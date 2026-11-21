const processTSVLine = (data, id, subtitles, speakers) => {
  try {
    let [startTime, endTime, speakerText] = data.split('\t');
    if (startTime === 'start' || endTime === 'end') return;
    startTime = Math.floor(Number.parseInt(startTime) / 1000);
    endTime = Math.floor(Number.parseInt(endTime) / 1000);
    let speaker = 'SPEAKER';
    let text = speakerText;
    if (speakerText.indexOf('[') > -1 && speakerText.indexOf(']') > -1) {
      speaker = speakerText.substring(speakerText.indexOf('[') + 1, speakerText.indexOf(']'));
      text = speakerText.substring(speakerText.indexOf(']') + 3);
    }
    if (text === '' || Number.isNaN(startTime) || Number.isNaN(endTime)) {
      sails.log('Invalid line:', data);
      return;
    }
    subtitles.push({ startTime, endTime, text, speaker, owner: id });
    speakers.add(speaker);
  } catch (e) {
    console.log(`Error encountered while processing ${id} ${data}`);
    console.log(e);
  }
};

const onCloseTSV = async (subtitles, url, db) => {
  const videoResult = await sails
    .sendNativeQuery('SELECT id FROM video WHERE url = $1', [url])
    .usingConnection(db);
  const videoRow = videoResult.rows[0];
  if (!videoRow) {
    return 0;
  }
  const videoId = videoRow.id;
  await sails
    .sendNativeQuery('DELETE FROM subtitle WHERE owner = $1', [videoId])
    .usingConnection(db);
  let rowCount = 0;
  if (subtitles.length !== 0) {
    // split subtitles into chunks of 1000
    const chunks = [];
    for (let i = 0; i < subtitles.length; i += 1000) {
      chunks.push(subtitles.slice(i, i + 1000));
    }
    for (const chunk of chunks) {
      // Build a multi-row parameterized INSERT
      const placeholders = [];
      const values = [];
      let paramIdx = 1;
      for (const row of chunk) {
        placeholders.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
        );
        values.push(videoId, row.startTime, row.endTime, row.text, row.speaker);
      }
      const result = await sails
        .sendNativeQuery(
          `INSERT INTO subtitle (owner, "startTime", "endTime", text, speaker) VALUES ${placeholders.join(
            ', '
          )}`,
          values
        )
        .usingConnection(db);
      rowCount += result.rowCount || chunk.length;
    }
  }
  return rowCount;
};

const upsertVideo = async (meta, groupDbId, db) => {
  const { url, title, date, tags } = meta;
  const { TAG_TYPES } = require('../../shared/constants');

  // (xmax = 0) is true for INSERT, false for UPDATE.
  const videoResult = await sails
    .sendNativeQuery(
      `INSERT INTO video (url, title, date, group_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (url) DO UPDATE SET title = $2, date = $3, group_id = $4
       RETURNING (xmax = 0) AS inserted`,
      [url, title, date, groupDbId]
    )
    .usingConnection(db);

  const created = videoResult.rows[0].inserted;

  if (tags) {
    const tagsArr = tags.split(', ');

    // Ensure each tag row exists
    for (const tag of tagsArr) {
      const tagType = tag.includes('(cameo)') ? TAG_TYPES.CAMEOS.text : TAG_TYPES.APPEARANCES.text;
      await sails
        .sendNativeQuery(
          `INSERT INTO tag (name, tag_type) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
          [tag, tagType]
        )
        .usingConnection(db);
    }

    // Link all tags to the video
    await sails
      .sendNativeQuery(
        `INSERT INTO tagmap (video_id, tag_id)
         SELECT v.id, t.id
         FROM tag t
         JOIN video v ON v.url = $1
         WHERE t.name = ANY($2::text[])
         ON CONFLICT DO NOTHING`,
        [url, tagsArr]
      )
      .usingConnection(db);
  }

  return { created };
};

const createSubtitle = async (fd, url, db, warnings) => {
  const { readFileSync } = require('fs');
  const lines = readFileSync(fd, 'utf8').split(/\r?\n/);
  const subtitles = [];
  const speakers = new Set();
  for (const line of lines) {
    processTSVLine(line, 0, subtitles, speakers);
  }

  const videoResult = await sails
    .sendNativeQuery('SELECT id FROM video WHERE url = $1', [url])
    .usingConnection(db);
  const videoRow = videoResult.rows[0];
  if (!videoRow) {
    warnings.push(`createSubtitle: video not found for url "${url}", skipping subtitle ingest`);
    return { rows: 0 };
  }

  const rowCount = await onCloseTSV(subtitles, url, db);
  return { rows: rowCount };
};

const createTranscript = async (fd, url, db, warnings) => {
  const { readFileSync } = require('fs');

  const videoResult = await sails
    .sendNativeQuery('SELECT id FROM video WHERE url = $1', [url])
    .usingConnection(db);
  const videoRow = videoResult.rows[0];
  if (!videoRow) {
    warnings.push(`createTranscript: video not found for url "${url}", skipping transcript ingest`);
    return;
  }

  const videoId = videoRow.id;
  const rawText = readFileSync(fd, 'utf8');

  // Delete any existing transcript
  await sails
    .sendNativeQuery('DELETE FROM transcript WHERE owner = $1', [videoId])
    .usingConnection(db);

  // Insert the new transcript
  await sails
    .sendNativeQuery('INSERT INTO transcript (owner, text) VALUES ($1, $2)', [videoId, rawText])
    .usingConnection(db);
};

const buildVideoMetadata = async (fd) => {
  const { createInterface } = require('readline');
  const { createReadStream } = require('fs');
  const dayjs = require('dayjs');
  const defaultDate = dayjs().format('YYYY-MM-DD');
  return new Promise(function (resolve, reject) {
    const metadata = {};
    const stream = createReadStream(fd);
    const rl = createInterface({ input: stream });
    rl.on('line', (data) => {
      const [
        url,
        title = 'Untitled Stream',
        date = defaultDate,
        tags = '',
        groupId = '',
        isDefault = '',
      ] = data.split('\t');
      if (!url || url === 'url') return;
      metadata[url] = {
        url,
        date,
        title,
        tags,
        groupId: groupId || undefined,
        isDefault: isDefault !== '',
      };
    });
    rl.on('close', () => resolve(metadata));
    rl.on('error', reject);
    stream.on('error', reject);
  });
};

const buildVideoMetadataFromText = (data) => {
  const metadata = {};
  const lines = data.split(/\r\n|\r|\n/);
  const dayjs = require('dayjs');
  const defaultDate = dayjs().format('YYYY-MM-DD');
  for (const line of lines) {
    const [
      url,
      title = 'Untitled Stream',
      date = defaultDate,
      tags = '',
      groupId = '',
      isDefault = '',
    ] = line.split('\t');
    if (url === 'url') continue;
    metadata[url] = {
      url,
      date,
      title,
      tags,
      groupId: groupId || undefined,
      isDefault: isDefault !== '',
    };
  }
  return metadata;
};

const sortTags = (tags) => {
  if (!tags) return [];
  const TAGS = sails.hooks['db-refresh'].getTags();
  const filteredTags = tags
    .split(', ')
    .filter((tag) => {
      if (!TAGS[tag]) {
        sails.log(`Missing tag ${tag}`);
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (TAGS[a].order !== TAGS[b].order) return TAGS[a].order - TAGS[b].order;
      return a.localeCompare(b);
    });
  return filteredTags;
};

const processRawResult = (rawResult) => {
  const { formatSeconds } = require('../../shared/constants');
  const map = new Map();
  for (const row of rawResult.rows) {
    const { url, title, date, tags } = row;
    const entry = map.get(url) || {
      url,
      title,
      date,
      tags: sortTags(tags),
      videoId: row.id,
      groupId: row.group_id,
      defaultVideoId: row.default_video_id,
    };
    if (row.text) {
      entry.total = entry.total || row.total_count;
      entry.subtitles = entry.subtitles || [];
      entry.subtitles.push({
        subtitleId: row.subtitleId,
        startTime: row.startTime,
        timestamp: formatSeconds(row.startTime),
        text: row.text,
      });
    }
    map.set(url, entry);
  }
  const results = Array.from(map.values());
  return results;
};

const processRawResultFTS = (rawResult) => {
  const map = new Map();
  for (const row of rawResult.rows) {
    const { url, title, date, tags } = row;
    const matches = row.snippets
      ? row.snippets.split(' || ').map((snippet) => {
          return { text: snippet };
        })
      : [];
    const entry = map.get(row.url) || {
      url,
      title,
      date,
      tags: sortTags(tags),
      matches: [],
      videoId: row.id,
      groupId: row.group_id,
      defaultVideoId: row.default_video_id,
    };
    entry.matches.push(...matches);
    map.set(row.url, entry);
  }
  const results = Array.from(map.values());
  return results;
};

const processRawResultSubtitle = (rawResult) => {
  const { formatSeconds } = require('../../shared/constants');
  const results = rawResult.rows.map((row) => ({
    subtitleId: row.subtitleId,
    startTime: row.startTime,
    endTime: row.endTime,
    timestamp: formatSeconds(row.startTime),
    text: row.text,
  }));
  return results;
};

module.exports = {
  processTSVLine,
  onCloseTSV,
  processRawResult,
  processRawResultFTS,
  processRawResultSubtitle,
  upsertVideo,
  createSubtitle,
  createTranscript,
  buildVideoMetadata,
  buildVideoMetadataFromText,
};
