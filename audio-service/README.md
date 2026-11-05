# Cassette audio discovery prototype

This is a **test backend**, not a universal song streaming service. It searches Internet Archive public metadata, filters items that explicitly declare Creative Commons or public-domain license URLs, and returns links to public MP3/M4A/OGG files. It does not scrape Sm3ha, YouTube, Albumaty, or Dndnha; does not download protected tracks; and does not proxy or host audio.

Run with Node 20+: `cd audio-service && npm start`. Try `http://localhost:3000/health` and `http://localhost:3000/api/search?q=music`.

For hosting set `ALLOWED_ORIGIN=https://wu3x.github.io`; deploy this directory to a Node-compatible host. Hosting plans may have limits and costs. No host is deployed by this repository change.

**Important:** Catalog availability, Arabic/Gulf repertoire, copyright status of uploader claims, browser CORS, and actual playback need testing before connecting to the live cassette. The `playableInCassette` field means a direct file link was found, not that playback was verified in Safari. Do not publish material without checking rights. Existing GitHub Pages cassette is untouched.
