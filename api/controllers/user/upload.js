module.exports = {
    
    friendlyName: 'Upload',
  
    description: 'Upload then return home',

    files: ['transcript_files'],

    inputs: {
        transcript_files: {
            description: 'files',
            type: 'ref',
            required: true
        },
        url: {
            description: 'url',
            type: 'string'
        },
        title: {
            description: 'title',
            type: 'string'
        },
        date: {
            description: 'date',
            type: 'string'
        }
    },
  
    exits: {
      success: {
        responseType: 'inertia'
      }
    },
  
    fn: async function ({transcript_files, url, title, date}) {
        const { createInterface } = require('readline');
        const { createReadStream, readFileSync } = require('fs');
        const { processTSVLine, onCloseTSV } = require('../../../utils/utils');
        const path = require('path');
        const uploadedFiles = await sails.upload(transcript_files);
        for (const uploadedFile of uploadedFiles) {
            const splitStr = uploadedFile.type === 'text/plain' ? '.txt' : '.tsv';
            const urlToUse = url || uploadedFile.filename.split(splitStr)[0];
            const video = await Video.findOrCreate({ url: urlToUse }, { url: urlToUse, title, date });
            if (uploadedFile.type === 'text/plain') {
                const rawText = readFileSync(uploadedFile.fd, 'utf8');
                await Transcript.create({ owner: video.id, text: rawText });
                await sails.rm(uploadedFile.fd);
            } else if (uploadedFile.filename.endsWith('.tsv')) {
                await Tagmap.findOrCreate({ owner: video.id }, { owner: video.id });
                const subtitles = [];
                const speakers = new Set();
                createInterface({input: createReadStream(uploadedFile.fd)})
                .on('line', (data) => processTSVLine(data, video.id, subtitles, speakers))
                .on('close', () => onCloseTSV(uploadedFile.fd, subtitles, speakers));
            } else {
                await sails.rm(uploadedFile.fd);
            }
        }
        return { page: 'dashboard/index' };
    }
  }
  