import { xai } from '@ai-sdk/xai'
import { experimental_getRealtimeToolDefinitions, tool } from 'ai'
import { z } from 'zod'

// Tools the model is allowed to call during a voice session.
// Definitions are sent to xAI so Grok knows when to call them.
// Execution happens client-side via `onToolCall`.
const tools = {
  getCurrentTime: tool({
    description:
      'Get the current date and time. Use this whenever the user asks what time or day it is.',
    inputSchema: z.object({
      timeZone: z
        .string()
        .optional()
        .describe(
          'An IANA timezone like "America/New_York". Omit to use the device timezone.',
        ),
    }),
  }),
  getWeather: tool({
    description: 'Get the current weather for a given city.',
    inputSchema: z.object({
      city: z.string().describe('The city to get the weather for.'),
    }),
  }),
}

export async function POST(request: Request) {
  if (!process.env.XAI_API_KEY) {
    return Response.json(
      { error: 'XAI_API_KEY is not configured on the server.' },
      { status: 500 },
    )
  }

  const body = await request.json().catch(() => ({}))

  const toolDefinitions = await experimental_getRealtimeToolDefinitions({
    tools,
  })

  const token = await xai.experimental_realtime.getToken({
    model: 'grok-voice-latest',
    sessionConfig: {
      ...body.sessionConfig,
      tools: toolDefinitions,
    },
  })

  return Response.json({
    ...token,
    tools: toolDefinitions,
  })
}
