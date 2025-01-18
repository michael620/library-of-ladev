module.exports = {
    
    friendlyName: 'Upload',
  
    description: 'Upload then return home',

    files: ['transcript'],

    inputs: {
        transcript: {
            description: 'file',
            type: 'ref',
            required: true
        },
        url: {
            description: 'url',
            type: 'string',
            // required: true
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
  
    fn: async function ({transcript, url, title, date}) {
        const { createInterface } = require('readline');
        const { createReadStream } = require('fs');
        const { processTSVLine, onCloseTSV } = require('../../../utils/utils');
        const path = require('path');
        const video = await Video.findOrCreate({ url }, { url, title, date });
        await Tagmap.findOrCreate({ owner: video.id }, { owner: video.id });
        const subtitles = [];
        const speakers = new Set();
        const uploadedFile = await sails.uploadOne(transcript);
        createInterface({input: createReadStream(uploadedFile.fd)})
            .on('line', (data) => processTSVLine(data, video.id, subtitles, speakers))
            .on('close', () => onCloseTSV(uploadedFile.fd, subtitles, speakers));
        return { page: 'dashboard/index' };
    }
  }
  