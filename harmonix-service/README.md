# Harmonix search service (experimental)

This is a **server-side search prototype** adapted from the YouTube Music search approach in [Harmonix](https://github.com/BayuRifki/harmonix), MIT licensed. The original cassette website remains unchanged.

## Start

Requires Node.js 20+.

```bash
cd harmonix-service
npm install
ALLOWED_ORIGIN=https://wu3x.github.io npm start
```

Check `http://localhost:3000/health`, then `http://localhost:3000/api/search?q=%D9%85%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%D9%87`.

## Limitations

- Search results are **not** direct playable audio URLs. YouTube Music tracks cannot be inserted into the cassette's HTML audio element merely by copying a watch URL.
- A separate HTTPS host is required before the existing GitHub Pages admin can call this service.
- YouTube Music access is unofficial and may break or be subject to platform terms.
- No ad bypass, audio extraction, streaming proxy, or automatic publishing is implemented.
- The existing cassette and Supabase configuration are untouched.
- Before production use, add authentication, request rate limits, logging policy and deployment monitoring.
