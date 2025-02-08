module.exports = {
    
    friendlyName: 'Upload',
  
    description: 'Upload then return home',

    files: ['transcript_files'],

    inputs: {
        transcript_files: {
            description: 'files',
            type: 'ref',
            required: true
        }
    },
  
    exits: {
      success: {
        responseType: 'inertia'
      }
    },
  
    fn: async function ({transcript_files}) {
        const { createInterface } = require('readline');
        const { createReadStream, readFileSync } = require('fs');
        const { createVideoAndSubtitle, buildVideoMetadata } = require('../../utils/utils');
        const path = require('path');
        const uploadedFiles = await sails.upload(transcript_files);
        const video_metadata_file = uploadedFiles.find((e) => e.filename === 'video_metadata.tsv');
        const tag_metadata_file = uploadedFiles.find((e) => e.filename === 'tag_metadata.tsv');
        if (video_metadata_file) {
            const video_metadata = await buildVideoMetadata(video_metadata_file.fd);
            await sails.rm(video_metadata_file.fd);
            for (const uploadedFile of uploadedFiles) {
                if (uploadedFile.filename === 'video_metadata.tsv') continue;
                const splitStr = uploadedFile.type === 'text/plain' ? '.txt' : '.tsv_sanitized.tsv';
                const url = uploadedFile.filename.split(splitStr)[0];
                if (video_metadata[url] && uploadedFile.type === 'text/plain') {
                    const video = await Video.findOne({ url });
                    if (!video) {
                        sails.log('Error trying to find video '+url);
                        continue;
                    }
                    const rawText = readFileSync(uploadedFile.fd, 'utf8');
                    await Transcript.destroyOne({ owner: video.id });
                    await Transcript.create({ owner: video.id, text: rawText });
                } else if (video_metadata[url] && uploadedFile.filename.endsWith('.tsv')) {
                    const date = video_metadata[url].date;
                    const title = video_metadata[url].title;
                    await createVideoAndSubtitle(uploadedFile.fd, url, title, date);
                } else {
                    sails.log(`Encountered error with file ${url}`);
                    sails.log(uploadedFile);
                }
                await sails.rm(uploadedFile.fd);
            }
        } else if (tag_metadata_file) {
            const tag_metadata = await buildVideoMetadata(tag_metadata_file.fd);
            await sails.rm(tag_metadata_file.fd);
            const rawSqls = [];
            Object.keys(tag_metadata).forEach(key => {
                const tags = tag_metadata[key].tags.split(', ');
                const formattedTags = tags.map(item => `'${item}'`).join(', ');
                const RAW_SQL = `
                INSERT INTO tagmap (video_id, tag_id)
                SELECT v.id, t.id
                FROM tag t
                JOIN video v ON v.url = '${key}'
                WHERE t.name IN (${formattedTags});`;
                rawSqls.push(RAW_SQL);
            });
            for (const raw of rawSqls) {
                await sails.sendNativeQuery(raw);
            }
        } else {
            sails.log(`video_metadata_file not found`);
            for (const uploadedFile of uploadedFiles) {
                await sails.rm(uploadedFile.fd);
            }
        }
        return { page: 'dashboard/index' };
    }
  }
  