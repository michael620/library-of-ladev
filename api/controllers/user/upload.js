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
        const { createVideoAndSubtitle, buildVideoMetadata } = require('../../../utils/utils');
        const path = require('path');
        const uploadedFiles = await sails.upload(transcript_files);
        const video_metadata_file = uploadedFiles.find((e) => e.filename === 'video_metadata.tsv');
        if (video_metadata_file) {
            const video_metadata = await buildVideoMetadata(video_metadata_file.fd);
            for (const uploadedFile of uploadedFiles) {
                if (uploadedFile.filename === 'video_metadata.tsv') continue;
                const splitStr = uploadedFile.type === 'text/plain' ? '.txt' : '.tsv_sanitized.tsv';
                const url = uploadedFile.filename.split(splitStr)[0];
                if (video_metadata[url] && uploadedFile.type === 'text/plain') {
                    const video = await Video.findOne({ url });
                    const rawText = readFileSync(uploadedFile.fd, 'utf8');
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
        } else {
            sails.log(`video_metadata_file not found`);
            for (const uploadedFile of uploadedFiles) {
                await sails.rm(uploadedFile.fd);
            }
        }
        return { page: 'dashboard/index' };
    }
  }
  