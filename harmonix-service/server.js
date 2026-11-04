// Search-only web adaptation of Harmonix's YouTube Music source.
// Original project: https://github.com/BayuRifki/harmonix (MIT).
// No stream extraction, media proxy, or unauthorized content hosting.
import http from 'node:http';
import { Innertube } from 'youtubei.js';

const port = Number(process.env.PORT || 3000);
const origin = process.env.ALLOWED_ORIGIN || 'https://wu3x.github.io';
let clientPromise;
function musicClient() {
  if (!clientPromise) clientPromise = Innertube.create({ generate_session_locally: true }).catch(err => { clientPromise = null; throw err; });
  return clientPromise;
}
function respond(res, status, data, reqOrigin = '') {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': reqOrigin === origin ? origin : 'null',
    'vary': 'Origin'
  });
  res.end(JSON.stringify(data));
}
function songToResult(item) {
  if (!item || !item.id) return null;
  return {
    id: String(item.id), source: 'ytmusic',
    title: String(item.title || 'بدون عنوان'),
    artist: (item.artists || []).map(x => x.name).filter(Boolean).join('، '),
    duration: typeof item.duration === 'number' ? item.duration : (item.duration?.seconds || item.duration_seconds || 0),
    pageUrl: 'https://music.youtube.com/watch?v=' + encodeURIComponent(item.id),
    playableInCassette: false
  };
}
async function searchYtMusic(query) {
  const client = await musicClient();
  const result = await client.music.search(query, { type: 'song' });
  return ((result.songs && result.songs.contents) || []).map(songToResult).filter(Boolean).slice(0, 15);
}
const server = http.createServer(async (req, res) => {
  const reqOrigin = req.headers.origin || '';
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'access-control-allow-origin': reqOrigin === origin ? origin : 'null', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'Content-Type', 'vary': 'Origin' });
    return res.end();
  }
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { return respond(res, 400, { error: 'Invalid URL' }, reqOrigin); }
  if (req.method !== 'GET') return respond(res, 405, { error: 'Method not allowed' }, reqOrigin);
  if (url.pathname === '/health') return respond(res, 200, { ok: true, provider: 'harmonix-ytmusic-search' }, reqOrigin);
  if (url.pathname !== '/api/search') return respond(res, 404, { error: 'Not found' }, reqOrigin);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q || q.length > 100) return respond(res, 400, { error: 'Search must be 1-100 characters' }, reqOrigin);
  try {
    const tracks = await searchYtMusic(q);
    return respond(res, 200, { tracks, note: 'Search results only. No direct audio stream provided.' }, reqOrigin);
  } catch (error) {
    console.error('Search failed:', error);
    return respond(res, 502, { error: 'Music source temporarily unavailable' }, reqOrigin);
  }
});
server.requestTimeout = 15000;
server.listen(port, '0.0.0.0', () => console.log('Harmonix search service listening on', port));
