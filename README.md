# Grok Voice Agent (Clean)

A clean, production-ready realtime voice assistant built with:

- **Next.js 15** + React 19
- **Vercel AI SDK** (`@ai-sdk/gateway` + `@ai-sdk/react`)
- **xAI Grok Voice** (`xai/grok-voice-think-fast-1.0`)
- Server-minted short-lived tokens (API key never reaches the browser)
- Tool calling (current time + weather)
- Beautiful dark UI with animated voice orb, live transcript & tool activity panel

## Quick start

```bash
pnpm install   # or npm / yarn
cp .env.example .env.local
# Add your key:
# AI_GATEWAY_API_KEY=...   (preferred)
# or XAI_API_KEY=xai-...

pnpm dev
```

Open http://localhost:3000 and tap the orb.

## Deploy to Vercel

1. Import this repo in the Vercel dashboard (or `vercel` CLI).
2. Add the environment variable `AI_GATEWAY_API_KEY` (or `XAI_API_KEY`).
3. Deploy. The production domain will be ready in ~30 s.

## Features

- Full-duplex speech-to-speech with server VAD
- Mic permission handling with clear error messages
- `getCurrentTime` and `getWeather` tools (weather uses free Open-Meteo, with graceful mock fallback)
- Responsive, accessible UI

## Notes

This is a clean rebuild intended to avoid previous build / linking issues.  
Enjoy talking to Grok!
