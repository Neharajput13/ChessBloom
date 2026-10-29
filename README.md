# ChessBloom

ChessBloom is a polished, beginner-friendly chess learning app with an optional Gemma-powered Bloom Coach backend.

## Run it

For the demo-only static version, open `index.html` in a browser. For live AI answers, run the included Node server:

```bash
npm start
```

Then visit `http://localhost:3001` with the current `.env` configuration. If you change `PORT`, use that port in the browser.

## Connect Google AI Studio

1. Copy `.env.example` to `.env`.
2. Put your Google AI Studio key in `GOOGLE_AI_API_KEY`. Never paste it into `app.js`, `index.html`, GitHub, or a browser-exposed environment variable.
3. Set `GEMINI_MODEL` to the exact Gemma model ID enabled in your Google AI Studio account. The default is `gemma-4`; if Studio shows a different ID, use that exact value.
4. Run `npm start` and ask Bloom Coach a question. The browser calls `/api/coach`; the server calls Google AI Studio.

## Deploy

Deploy this folder as one Node web service on Render, Railway, Fly.io, or another Node host.

- Build command: leave empty
- Start command: `npm start`
- Environment variables: `GOOGLE_AI_API_KEY`, `GEMINI_MODEL`, and optionally `PORT`
- Health check: `/`

Do not deploy with `python -m http.server` if you want live Gemma responses; that serves files but cannot protect the API key or proxy `/api/coach`. After deployment, set the service URL as the app URL and verify that the coach works from the deployed site.

## Included in this MVP

- Beginner-focused landing page and lesson cards
- Real browser-playable “The art of the opening” video generated from an animated chessboard canvas, with native controls, seekable 12-second content, synced chapter captions, transcript fallback, and optional browser voice narration
- Interactive chessboard with selectable white pieces and basic move validation
- Play vs Computer mode with automatic black replies
- Two Players mode for local pass-and-play
- Move list, captures, reset, and quick review interactions
- Bloom Coach mentor with beginner explanations, quick questions, and free-form prompts
- Responsive layout for desktop and mobile

If `GOOGLE_AI_API_KEY` is absent, the coach intentionally uses a local demo response and the API returns a clear 503 instead of exposing or guessing a key. Once the key and exact model ID are added to `.env`, the existing frontend request uses the live backend proxy automatically. Stockfish should remain the source of truth for chess calculations; Gemma should explain those results.
