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

const onCloseTSV = async (subtitles, url, resolve) => {
  const sql = `
    DELETE FROM subtitle
    WHERE owner = (
        SELECT id FROM video WHERE url = '${url}'
    );
    `;
  await sails.sendNativeQuery(sql);
  if (subtitles.length !== 0) {
    //split subtitles into chunks of 1000
    const chunks = [];
    for (let i = 0; i < subtitles.length; i += 1000) {
      chunks.push(subtitles.slice(i, i + 1000));
    }
    for (const chunk of chunks) {
      await Subtitle.createEach(chunk);
    }
  }
  resolve();
};

const createOrUpdateVideos = async (video_metadata) => {
  if (!video_metadata) return;

  const { resolveGroupPlan } = require('./groupIngest');
  const metaRows = Object.values(video_metadata);
  const plan = resolveGroupPlan(metaRows);
  for (const warning of plan.warnings) {
    sails.log.warn(warning);
  }

  // Map from groupKey -> numeric stream_group.id (lazily populated)
  const groupIdCache = new Map();

  for (const resolvedRow of plan.rows) {
    const { url, groupKey } = resolvedRow;
    const metadata = video_metadata[url];
    const { title, date, tags } = metadata;
    const { TAG_TYPES } = require('../../shared/constants');

    // Lazily findOrCreate the StreamGroup keyed on maintainerKey so re-ingest
    // rejoins the existing group row instead of creating a new orphan.
    if (!groupIdCache.has(groupKey)) {
      const sg = await StreamGroup.findOrCreate({ maintainerKey: groupKey }, { maintainerKey: groupKey });
      groupIdCache.set(groupKey, sg.id);
    }
    const groupDbId = groupIdCache.get(groupKey);

    await Video.findOrCreate({ url }, { url, title, date, group: groupDbId });
    await Video.updateOne({ url }, { url, title, date, group: groupDbId });

    if (tags) {
      const tagsArr = tags.split(', ');
      const sqls = [];
      for (const tag of tagsArr) {
        const tagType = tag.includes('(cameo)')
          ? TAG_TYPES.CAMEOS.text
          : TAG_TYPES.APPEARANCES.text;
        sqls.push(`
                    INSERT INTO tag (name, tag_type)
                    VALUES ('${tag}', '${tagType}')
                    ON CONFLICT (name) DO NOTHING;
                `);
      }
      const formattedTags = tagsArr.map((item) => `'${item}'`).join(', ');
      sqls.push(`
                INSERT INTO tagmap (video_id, tag_id)
                SELECT v.id, t.id
                FROM tag t
                JOIN video v ON v.url = '${url}'
                WHERE t.name IN (${formattedTags})
                ON CONFLICT DO NOTHING;
            `);
      for (const sql of sqls) {
        await sails.sendNativeQuery(sql);
      }
    }
  }

  // Resolve each group's default_video_id in a follow-up pass.
  // Only overwrite existing default if upload explicitly sets is_default
  for (const [groupKey, { url: defaultUrl, explicit }] of plan.groupDefaults) {
    const groupId = groupIdCache.get(groupKey);
    if (!explicit) {
      const group = await StreamGroup.findOne({ id: groupId });
      if (group && group.defaultVideo != null) continue;
    }
    const v = await Video.findOne({ url: defaultUrl });
    await StreamGroup.updateOne({ id: groupId }).set({ defaultVideo: v.id });
  }

  await sails.hooks['db-refresh'].fetchAndUpdate();
};

const createSubtitle = async (fd, url) => {
  const { createInterface } = require('readline');
  const { createReadStream } = require('fs');
  const video = await Video.findOne({ url });
  if (!video) {
    sails.log('Error trying to find video ' + url);
    return Promise.resolve();
  }
  return new Promise(function (resolve) {
    const subtitles = [];
    const speakers = new Set();
    createInterface({ input: createReadStream(fd) })
      .on('line', (data) => processTSVLine(data, video.id, subtitles, speakers))
      .on('close', () => onCloseTSV(subtitles, url, resolve));
  });
};

const createTranscript = async (fd, url) => {
  const { readFileSync } = require('fs');
  const video = await Video.findOne({ url });
  if (!video) {
    sails.log('Error trying to find video ' + url);
    return Promise.resolve();
  }
  const rawText = readFileSync(fd, 'utf8');
  await Transcript.destroyOne({ owner: video.id });
  await Transcript.create({ owner: video.id, text: rawText });
};

const buildVideoMetadata = async (fd) => {
  const { createInterface } = require('readline');
  const { createReadStream } = require('fs');
  const dayjs = require('dayjs');
  const defaultDate = dayjs().format('YYYY-MM-DD');
  return new Promise(function (resolve) {
    const metadata = {};
    createInterface({ input: createReadStream(fd) })
      .on('line', (data) => {
        const [url, title = 'Untitled Stream', date = defaultDate, tags = '', groupId = '', isDefault = ''] = data.split('\t');
        if (!url || url === 'url') return;
        metadata[url] = {
          url,
          date,
          title,
          tags,
          groupId: groupId || undefined,
          isDefault: isDefault !== '',
        };
      })
      .on('close', () => {
        resolve(metadata);
      });
  });
};

const buildVideoMetadataFromText = (data) => {
  const metadata = {};
  const lines = data.split(/\r\n|\r|\n/);
  const dayjs = require('dayjs');
  const defaultDate = dayjs().format('YYYY-MM-DD');
  for (const line of lines) {
    const [url, title = 'Untitled Stream', date = defaultDate, tags = '', groupId = '', isDefault = ''] = line.split('\t');
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
  createOrUpdateVideos,
  createSubtitle,
  createTranscript,
  buildVideoMetadata,
  buildVideoMetadataFromText,
};
