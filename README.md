# Grok Voice Agent (Clean)

Realtime voice assistant using the **existing xAI Grok Voice routing API**.

- Model: `grok-voice-latest` via `@ai-sdk/xai`
- Token route: `POST /api/realtime/setup` → `xai.experimental_realtime.getToken`
- Browser hook: `experimental_useRealtime` from `@ai-sdk/react`
- WebSocket: `wss://api.x.ai/v1/realtime?model=grok-voice-latest`
- Auth: server-only `XAI_API_KEY` minted into a short-lived client secret

This is the same routing path as the original `grok-voice-agent` project — not AI Gateway.

## Setup

```bash
pnpm install
cp .env.example .env.local
# set XAI_API_KEY=xai-...

pnpm dev
```

On Vercel, add `XAI_API_KEY` in Project Settings → Environment Variables, then redeploy.

## How routing works

1. The browser requests `/api/realtime/setup`.
2. The server calls `xai.experimental_realtime.getToken({ model: 'grok-voice-latest' })` with your `XAI_API_KEY`.
3. The client opens a WebSocket to xAI using that ephemeral token.
4. Audio in/out + tool calls (`getCurrentTime`, `getWeather`) run over that session.
