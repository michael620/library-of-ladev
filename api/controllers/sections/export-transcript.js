module.exports = {
    friendlyName: 'Export transcript',
    description: 'Export transcript',
    fn: async function () {
        try {
            const { formatSeconds } = require('../../../shared/constants');
            const url = this.req.query.url;
            const start = this.req.query.start;
            const end = this.req.query.end;
            const includeTimestamp = this.req.query.includeTimestamp === 'true';

            const RAW_SQL = `
            SELECT subtitle.text, subtitle."startTime"
            FROM subtitle
            JOIN video ON subtitle.owner = video.id
            WHERE video.url = $1
            AND (subtitle."startTime" >= $2)
            AND (subtitle."startTime" <= $3)
            ORDER BY subtitle."startTime";
            `;
            const rawResult = await sails.sendNativeQuery(RAW_SQL, [url, start, end]);
            const textContent = rawResult.rows.map(row => `${includeTimestamp ? `${formatSeconds(row.startTime)}\t` : ''}${row.text}`).join('\n');

            this.res.set({
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="example.txt"',
                'Cache-Control': 'no-cache'
            });
            return this.res.send(textContent);
        } catch (err) {
            sails.log.error(err);
            return this.res.serverError('Unable to generate file.');
        }
    }
}
