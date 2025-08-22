module.exports = {
    
    friendlyName: 'Upload',
  
    description: 'Upload then return home',

    files: ['transcript_files'],

    inputs: {
        video_metadata_text: {
            type: 'string',
            required: false
        },
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
  
    fn: async function ({transcript_files, video_metadata_text}) {
        const { createInterface } = require('readline');
        const { createReadStream, readFileSync } = require('fs');
        const { createOrUpdateVideos, createSubtitle, buildVideoMetadata, buildVideoMetadataFromText, buildVideoMetadataFromFiles } = require('../../utils/utils');
        const path = require('path');
        const uploadedFiles = await sails.upload(transcript_files);
        const video_metadata_file = uploadedFiles.find((e) => e.filename === 'video_metadata.tsv');
        const tsvFiles = [];
        const txtFiles = [];
        for (const uploadedFile of uploadedFiles) {
            if (uploadedFile.filename === 'video_metadata.tsv') continue;
            const splitStr = uploadedFile.filename.endsWith('.txt') ? '.txt' : '.tsv_sanitized.tsv';
            const url = uploadedFile.filename.split(splitStr)[0];
            if (uploadedFile.filename.endsWith('.txt')) {
                txtFiles.push(uploadedFile);
            } else if (uploadedFile.filename.endsWith('.tsv')) {
                tsvFiles.push(uploadedFile);
            } else {
                sails.log(`Encountered error with file ${url}`);
                sails.log(uploadedFile);
                await sails.rm(uploadedFile.fd);
            }
        }
        let video_metadata;
        if (video_metadata_file) {
            video_metadata = await buildVideoMetadata(video_metadata_file.fd);
            await sails.rm(video_metadata_file.fd);
        } else if (video_metadata_text) {
            video_metadata = buildVideoMetadataFromText(video_metadata_text);
        } else {
            video_metadata = buildVideoMetadataFromFiles(tsvFiles);
        }
        createOrUpdateVideos(video_metadata);
        for (const tsvFile of tsvFiles) {
            const splitStr = tsvFile.type === 'text/plain' ? '.txt' : '.tsv_sanitized.tsv';
            const url = tsvFile.filename.split(splitStr)[0];
            await createSubtitle(tsvFile.fd, url);
            await sails.rm(tsvFile.fd);
        }
        for (const txtFile of txtFiles) {
            const splitStr = txtFile.filename.endsWith('.txt') ? '.txt' : '.tsv_sanitized.tsv';
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
        sails.log(`Uploaded ${tsvFiles.length} files.`);
        return { page: 'dashboard/index' };
    }
  }
  