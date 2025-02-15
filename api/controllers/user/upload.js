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
        if (video_metadata_file) {
            const video_metadata = await buildVideoMetadata(video_metadata_file.fd);
            await sails.rm(video_metadata_file.fd);
            const tsvFiles = [];
            const txtFiles = [];
            for (const uploadedFile of uploadedFiles) {
                if (uploadedFile.filename === 'video_metadata.tsv') continue;
                const splitStr = uploadedFile.type === 'text/plain' ? '.txt' : '.tsv_sanitized.tsv';
                const url = uploadedFile.filename.split(splitStr)[0];
                if (video_metadata[url] && uploadedFile.type === 'text/plain') {
                    txtFiles.push(uploadedFile);
                } else if (video_metadata[url] && uploadedFile.filename.endsWith('.tsv')) {
                    tsvFiles.push(uploadedFile);
                } else {
                    sails.log(`Encountered error with file ${url}`);
                    sails.log(uploadedFile);
                }
            }
            for (const tsvFile of tsvFiles) {
                const splitStr = tsvFile.type === 'text/plain' ? '.txt' : '.tsv_sanitized.tsv';
                const url = tsvFile.filename.split(splitStr)[0];
                await createVideoAndSubtitle(tsvFile.fd, video_metadata[url]);
                await sails.rm(tsvFile.fd);
            }
            for (const txtFile of txtFiles) {
                const splitStr = txtFile.type === 'text/plain' ? '.txt' : '.tsv_sanitized.tsv';
                const url = txtFile.filename.split(splitStr)[0];
                const video = await Video.findOne({ url });
                if (!video) {
                    sails.log('Error trying to find video '+url);
                    continue;
                }
                const rawText = readFileSync(txtFile.fd, 'utf8');
                await Transcript.destroyOne({ owner: video.id });
                await Transcript.create({ owner: video.id, text: rawText });
                await sails.rm(txtFile.fd);
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
  