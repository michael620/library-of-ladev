module.exports = {
  friendlyName: 'Upload',

  description: 'Upload',

  files: ['transcript_files'],

  inputs: {
    video_metadata_text: {
      type: 'string',
      required: false,
    },
    transcript_files: {
      description: 'files',
      type: 'ref',
      required: true,
    },
  },

  fn: async function ({ transcript_files, video_metadata_text }) {
    const {
      upsertVideo,
      createSubtitle,
      createTranscript,
      buildVideoMetadata,
      buildVideoMetadataFromText,
    } = require('../../utils/utils');
    const { resolveGroupPlan } = require('../../utils/groupIngest');

    // Track every uploaded fd for cleanup in finally
    const allFds = [];

    try {
      const uploadedFiles = await sails.upload(transcript_files);
      for (const f of uploadedFiles) {
        allFds.push(f.fd);
      }

      // --- Step 1: Separate video_metadata.tsv and index remaining files by url ---
      const video_metadata_file = uploadedFiles.find((e) => e.filename === 'video_metadata.tsv');
      const filesByUrl = {};

      for (const uploadedFile of uploadedFiles) {
        if (uploadedFile.filename === 'video_metadata.tsv') continue;

        if (uploadedFile.filename.endsWith('.txt')) {
          const url = uploadedFile.filename.split('.txt')[0];
          if (!filesByUrl[url]) filesByUrl[url] = {};
          filesByUrl[url].transcriptFile = uploadedFile;
        } else if (uploadedFile.filename.endsWith('.tsv')) {
          const url = uploadedFile.filename.split('.tsv_sanitized.tsv')[0];
          if (!filesByUrl[url]) filesByUrl[url] = {};
          filesByUrl[url].subtitleFile = uploadedFile;
        } else {
          sails.log(`upload: encountered unknown file type for ${uploadedFile.filename}`);
          sails.log(uploadedFile);
        }
      }

      // --- Step 2: Build video_metadata ---
      let video_metadata;
      try {
        if (video_metadata_file) {
          video_metadata = await buildVideoMetadata(video_metadata_file.fd);
        } else if (video_metadata_text) {
          video_metadata = buildVideoMetadataFromText(video_metadata_text);
        }
      } catch (err) {
        return this.res.status(500).json({
          success: false,
          error: `FAILED before ingest: could not parse video_metadata — ${err.message}.`,
        });
      }

      if (!video_metadata || Object.keys(video_metadata).length === 0) {
        return this.res.status(500).json({
          success: false,
          error:
            'FAILED before ingest: no usable video metadata found.',
        });
      }

      // --- Step 3: Resolve group plan ---
      const warnings = [];
      const plan = resolveGroupPlan(Object.values(video_metadata));
      for (const w of plan.warnings) {
        warnings.push(w);
      }

      // --- Step 4: Per-video transactional ingest ---
      let created = 0;
      let updated = 0;
      let subtitleFiles = 0;
      let subtitleRows = 0;
      let transcriptFiles = 0;
      const failures = [];

      const succeededUrls = new Set();

      for (const resolvedRow of plan.rows) {
        const { url, groupKey } = resolvedRow;
        const meta = video_metadata[url];
        const filesForUrl = filesByUrl[url] || {};

        let currentStage = 'group';
        let localCreated = 0;
        let localUpdated = 0;
        let localSubFiles = 0;
        let localSubRows = 0;
        let localTransFiles = 0;
        try {
          await sails.getDatastore().transaction(async (db) => {
            // Ensure the stream_group row exists and get its id
            await sails
              .sendNativeQuery(
                'INSERT INTO stream_group (maintainer_key) VALUES ($1) ON CONFLICT (maintainer_key) DO NOTHING',
                [groupKey]
              )
              .usingConnection(db);

            const groupResult = await sails
              .sendNativeQuery('SELECT id FROM stream_group WHERE maintainer_key = $1', [groupKey])
              .usingConnection(db);

            const groupDbId = groupResult.rows[0].id;

            // Upsert video + tags + tagmap
            currentStage = 'video';
            const { created: wasCreated } = await upsertVideo(meta, groupDbId, db);
            if (wasCreated) {
              localCreated = 1;
            } else {
              localUpdated = 1;
            }

            // Subtitle ingest
            if (filesForUrl.subtitleFile) {
              currentStage = 'subtitles';
              const { rows } = await createSubtitle(filesForUrl.subtitleFile.fd, url, db, warnings);
              localSubFiles = 1;
              localSubRows = rows;
            }

            // Transcript ingest
            if (filesForUrl.transcriptFile) {
              currentStage = 'transcript';
              await createTranscript(filesForUrl.transcriptFile.fd, url, db, warnings);
              localTransFiles = 1;
            }
          });

          // Transaction committed — apply locals to outer tallies
          created += localCreated;
          updated += localUpdated;
          subtitleFiles += localSubFiles;
          subtitleRows += localSubRows;
          transcriptFiles += localTransFiles;
          succeededUrls.add(url);
        } catch (err) {
          failures.push({ url, stage: currentStage, error: err.message });
          sails.log.error(
            `upload: failed to ingest video "${url}" at stage ${currentStage}: ${err.message}`
          );
        }
      }

      // --- Step 5: Group-default pass over SUCCEEDED videos only ---
      for (const [groupKey, { url: defaultUrl, explicit }] of plan.groupDefaults) {
        if (!succeededUrls.has(defaultUrl)) continue;

        try {
          await sails.getDatastore().transaction(async (db) => {
            const groupResult = await sails
              .sendNativeQuery(
                'SELECT id, default_video_id FROM stream_group WHERE maintainer_key = $1',
                [groupKey]
              )
              .usingConnection(db);

            if (!groupResult.rows[0]) return;

            const { id: groupId, default_video_id: existingDefault } = groupResult.rows[0];

            // Respect the explicit rule: only overwrite an existing default if explicit
            if (!explicit && existingDefault != null) return;

            const videoResult = await sails
              .sendNativeQuery('SELECT id FROM video WHERE url = $1', [defaultUrl])
              .usingConnection(db);

            if (!videoResult.rows[0]) return;

            const videoId = videoResult.rows[0].id;

            await sails
              .sendNativeQuery('UPDATE stream_group SET default_video_id = $1 WHERE id = $2', [
                videoId,
                groupId,
              ])
              .usingConnection(db);
          });
        } catch (err) {
          warnings.push(`group-default pass failed for group "${groupKey}": ${err.message}`);
          sails.log.error(
            `upload: group-default pass failed for group "${groupKey}": ${err.message}`
          );
        }
      }

      // --- Step 6: db-refresh ---
      await sails.hooks['db-refresh'].fetchAndUpdate();

      // --- Step 7: Build response message ---
      const failedCount = failures.length;
      const failedSuffix = failedCount > 0 ? ` (${failedCount} FAILED)` : '';
      const videoTotal = created + updated + failedCount;
      let message = `OK. Videos: ${created} created, ${updated} updated${failedSuffix} of ${videoTotal}. Subtitles: ${subtitleFiles} files / ${subtitleRows.toLocaleString()} rows. Transcripts: ${transcriptFiles} files.`;

      if (failedCount > 0) {
        const failedLines = failures
          .map(
            (f) =>
              `  ${f.url} at stage '${f.stage}' — ${f.error}; that video rolled back, others committed.`
          )
          .join('\n');
        message += `\nFailed (${failedCount}):\n${failedLines}`;
      }

      if (warnings.length > 0) {
        message += `\nWarnings (${warnings.length}): ${warnings.join('; ')}`;
      }

      return this.res.status(200).json({
        success: true,
        created,
        updated,
        subtitleFiles,
        subtitleRows,
        transcriptFiles,
        failures,
        warnings,
        message,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      sails.log.error('upload: top-level error:', errorMsg);
      return this.res.status(500).json({
        success: false,
        error: `FAILED before ingest: ${errorMsg}`,
      });
    } finally {
      // Clean up every tracked fd exactly once
      for (const fd of allFds) {
        try {
          await sails.rm(fd);
        } catch (cleanupErr) {
          sails.log.warn(`upload: failed to remove temp file ${fd}: ${cleanupErr.message}`);
        }
      }
    }
  },
};
