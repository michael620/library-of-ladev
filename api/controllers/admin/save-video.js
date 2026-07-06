module.exports = {
  friendlyName: 'Save video',
  description: 'Admin mutation endpoint for a single video',
  inputs: {
    url: {
      type: 'string',
      required: true,
    },
    _op: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    date: {
      type: 'string',
    },
    tags: {
      type: 'ref',
    },
    subtitles: {
      type: 'ref',
    },
  },
  fn: async function ({ url, _op, title, date, tags, subtitles }) {
    try {
      const video = await Video.findOne({ url });
      if (!video) {
        return this.res.status(404).json({ success: false, error: 'Video not found' });
      }
      const videoId = video.id;

      if (_op === 'delete') {
        await sails.getDatastore().transaction(async (db) => {
          await sails
            .sendNativeQuery('DELETE FROM subtitle WHERE owner = $1', [videoId])
            .usingConnection(db);
          await sails
            .sendNativeQuery('DELETE FROM transcript WHERE owner = $1', [videoId])
            .usingConnection(db);
          await sails
            .sendNativeQuery('DELETE FROM tagmap WHERE video_id = $1', [videoId])
            .usingConnection(db);
          await sails
            .sendNativeQuery('DELETE FROM video WHERE id = $1', [videoId])
            .usingConnection(db);
        });
        return this.res.status(200).json({ success: true });
      }

      let tagsChanged = false;
      await sails.getDatastore().transaction(async (db) => {
        const videoUpdate = {};
        if (typeof title === 'string') videoUpdate.title = title;
        if (typeof date === 'string') videoUpdate.date = date;
        if (Object.keys(videoUpdate).length > 0) {
          const cols = Object.keys(videoUpdate);
          const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
          const values = cols.map((c) => videoUpdate[c]);
          values.push(videoId);
          await sails
            .sendNativeQuery(`UPDATE video SET ${setClause} WHERE id = $${cols.length + 1}`, values)
            .usingConnection(db);
        }

        if (Array.isArray(tags)) {
          const currentRows = await sails
            .sendNativeQuery(
              'SELECT tag.name FROM tagmap JOIN tag ON tag.id = tagmap.tag_id WHERE tagmap.video_id = $1',
              [videoId]
            )
            .usingConnection(db);
          const current = new Set(currentRows.rows.map((r) => r.name));
          const desired = new Set(tags);

          const toAdd = [...desired].filter((t) => !current.has(t));
          const toRemove = [...current].filter((t) => !desired.has(t));

          if (toAdd.length > 0) {
            const existingRows = await sails
              .sendNativeQuery('SELECT name FROM tag WHERE name = ANY($1::text[])', [toAdd])
              .usingConnection(db);
            const existingNames = new Set(existingRows.rows.map((r) => r.name));
            const missing = toAdd.filter((n) => !existingNames.has(n));
            if (missing.length > 0) {
              sails.log.warn(
                `save-video: skipping unknown tag names for video ${url}: ${JSON.stringify(
                  missing
                )}`
              );
            }
            await sails
              .sendNativeQuery(
                `INSERT INTO tagmap (video_id, tag_id)
                             SELECT $1, id FROM tag WHERE name = ANY($2::text[])
                             ON CONFLICT DO NOTHING`,
                [videoId, toAdd]
              )
              .usingConnection(db);
          }
          if (toRemove.length > 0) {
            await sails
              .sendNativeQuery(
                `DELETE FROM tagmap WHERE video_id = $1
                             AND tag_id IN (SELECT id FROM tag WHERE name = ANY($2::text[]))`,
                [videoId, toRemove]
              )
              .usingConnection(db);
          }
          tagsChanged = toAdd.length + toRemove.length > 0;
        }
        if (Array.isArray(subtitles)) {
          for (const op of subtitles) {
            if (op._op === 'create') {
              await sails
                .sendNativeQuery(
                  `INSERT INTO subtitle (owner, "startTime", "endTime", text)
                                 VALUES ($1, $2, $3, $4)`,
                  [videoId, op.startTime, op.endTime, op.text]
                )
                .usingConnection(db);
            } else if (op._op === 'update') {
              const result = await sails
                .sendNativeQuery(
                  `UPDATE subtitle
                                 SET "startTime" = $1, "endTime" = $2, text = $3
                                 WHERE id = $4 AND owner = $5`,
                  [op.startTime, op.endTime, op.text, op.id, videoId]
                )
                .usingConnection(db);
              if (!result.rowsAffected && !result.rowCount) {
                sails.log.warn(
                  `save-video: subtitle op update for id ${op.id} did not match any row owned by video ${url}`
                );
              }
            } else if (op._op === 'delete') {
              const result = await sails
                .sendNativeQuery('DELETE FROM subtitle WHERE id = $1 AND owner = $2', [
                  op.id,
                  videoId,
                ])
                .usingConnection(db);
              if (!result.rowsAffected && !result.rowCount) {
                sails.log.warn(
                  `save-video: subtitle op delete for id ${op.id} did not match any row owned by video ${url}`
                );
              }
            }
          }
        }
      });
      if (tagsChanged) {
        await sails.hooks['db-refresh'].fetchAndUpdate();
      }
      return this.res.status(200).json({ success: true });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      sails.log.error('save-video error:', errorMsg);
      return this.res.status(500).json({ success: false, error: errorMsg });
    }
  },
};
