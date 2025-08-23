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
        const { createOrUpdateVideos, createSubtitle, createTranscript, buildVideoMetadata, buildVideoMetadataFromText } = require('../../utils/utils');
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
            await createTranscript(txtFile.fd, url);
            await sails.rm(txtFile.fd);
        }
        sails.log(`Uploaded ${tsvFiles.length} subtitle files.`);
        sails.log(`Uploaded ${txtFiles.length} transcript files.`);
        return { page: 'dashboard/index' };
    }
  }
  