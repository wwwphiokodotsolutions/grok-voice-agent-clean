import { gateway } from '@ai-sdk/gateway'
import { tool } from 'ai'
import { z } from 'zod'

const tools = {
  getCurrentTime: tool({
    description:
      'Get the current date and time. Use whenever the user asks what time or day it is.',
    parameters: z.object({
      timeZone: z
        .string()
        .optional()
        .describe('IANA timezone like "America/New_York". Omit for device timezone.'),
    }),
  }),
  getWeather: tool({
    description: 'Get a simple current weather summary for a city.',
    parameters: z.object({
      city: z.string().describe('City name, e.g. "San Francisco"'),
    }),
  }),
}

export async function POST() {
  // Prefer AI Gateway key; fall back to direct xAI key if present
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.XAI_API_KEY) {
    return Response.json(
      { error: 'AI_GATEWAY_API_KEY or XAI_API_KEY is not configured.' },
      { status: 500 },
    )
  }

  try {
    const { token, url } = await gateway.experimental_realtime.getToken({
      model: 'xai/grok-voice-think-fast-1.0',
      // tools can be passed if the gateway + model support tool definitions in the token
    })

    return Response.json({
      token,
      url,
      tools: Object.keys(tools),
    })
  } catch (err) {
    console.error('[realtime/token]', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to mint token' },
      { status: 500 },
    )
  }
}
