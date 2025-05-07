# Library of Ladev

A Node application that hosts a searchable database of Neuro-sama stream transcripts.

### Live Demo
Check out the live version of the project at:

**[https://libraryofladev.com/](https://libraryofladev.com/)**
### Technologies
Framework: Sails+Inertia

Frontend: React

Backend: PostgreSQL

## Getting Started

### Running the Node app

1. Clone the repo
   ```sh
   git clone https://github.com/michael620/library-of-ladev.git
   ```
2. Install dependencies
   ```sh
   npm install
   ```
3. Start Sails server
   ```sh
   npx sails lift
   ```
4. Visit http://localhost:1337

### Processing + uploading transcripts

1. Download audio from YouTube using `yt-dlp`.
2. Transcribe audio using `faster-whisper` to `.tsv`.
   This should be in the following format:
   ```
   <startTime>  <endTime>  <text>
   ```
4. Sanitize the raw transcription (e.g. replace misspelt names).
5. Upload to the database at http://localhost:1337/upload. This requires a video_metadata.tsv file in the following format:
   ```
   <YouTube url>  <date: YYYY-MM-DD>  <title>  <tags: tag1, tag2, ...>
   ```

## License
Distributed under the MIT License. See the LICENSE file for more information.
