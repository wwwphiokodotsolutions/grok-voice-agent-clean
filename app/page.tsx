'use client'

import { Transcript, type TranscriptMessage } from '@/components/transcript'
import { ToolActivity, type ToolEvent } from '@/components/tool-activity'
import { VoiceOrb, type VoiceState } from '@/components/voice-orb'
import { gateway } from '@ai-sdk/gateway'
import { experimental_useRealtime as useRealtime } from '@ai-sdk/react'
import { useCallback, useMemo, useRef, useState } from 'react'

export default function Page() {
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const model = useMemo(
    () => gateway.experimental_realtime('xai/grok-voice-think-fast-1.0'),
    [],
  )

  const realtime = useRealtime({
    model,
    api: { token: '/api/realtime/token' },
    sessionConfig: {
      instructions:
        'You are Grok, a witty, helpful, and slightly irreverent voice assistant from xAI. Keep replies concise and conversational. Use the getCurrentTime and getWeather tools when the user asks about time or weather.',
      turnDetection: { type: 'server-vad' },
      // inputAudioTranscription: {}, // enable if model supports it
    },
    onError: (error) => {
      console.error('[realtime]', error)
      setErrorMessage(
        error?.message ||
          'The voice session ran into a problem. Please try reconnecting.',
      )
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    },
    onToolCall: async ({ toolCall }) => {
      const { toolCallId, toolName, args } = toolCall as {
        toolCallId: string
        toolName: string
        args: Record<string, unknown>
      }

      setToolEvents((prev) => [
        ...prev,
        { id: toolCallId, name: toolName, args, status: 'running' },
      ])

      const finish = (status: ToolEvent['status'], result?: unknown) =>
        setToolEvents((prev) =>
          prev.map((e) => (e.id === toolCallId ? { ...e, status, result } : e)),
        )

      try {
        if (toolName === 'getCurrentTime') {
          const timeZone =
            (args?.timeZone as string) ||
            Intl.DateTimeFormat().resolvedOptions().timeZone
          const result = {
            iso: new Date().toISOString(),
            formatted: new Date().toLocaleString('en-US', { timeZone }),
            timeZone,
          }
          finish('done', result)
          return result
        }

        if (toolName === 'getWeather') {
          const res = await fetch('/api/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args),
          })
          if (!res.ok) throw new Error('Weather lookup failed')
          const result = await res.json()
          finish('done', result)
          return result
        }

        finish('error')
        return { error: `Unknown tool: ${toolName}` }
      } catch (error) {
        finish('error')
        return { error: error instanceof Error ? error.message : 'Tool failed' }
      }
    },
  })

  const voiceState: VoiceState = useMemo(() => {
    if (realtime.status === 'connected') {
      return realtime.isPlaying ? 'speaking' : 'listening'
    }
    if (realtime.status === 'error') return 'error'
    return (realtime.status as VoiceState) || 'disconnected'
  }, [realtime.status, realtime.isPlaying])

  const messages: TranscriptMessage[] = useMemo(
    () =>
      (realtime.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        text:
          m.parts
            ?.filter((p: any) => p.type === 'text')
            .map((p: any) => p.text)
            .join(' ') ||
          m.content ||
          '',
      })),
    [realtime.messages],
  )

  const handleToggle = useCallback(async () => {
    if (realtime.status === 'connected' || realtime.status === 'connecting') {
      realtime.disconnect?.()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      return
    }

    setErrorMessage(null)

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setErrorMessage(
          'Microphone access was blocked. Enable mic permission for this site, then try again.',
        )
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setErrorMessage(
          'No microphone found. Connect a mic and try again.',
        )
      } else {
        setErrorMessage('Could not access the microphone. Check device settings.')
      }
      return
    }

    try {
      await realtime.connect()
      realtime.startAudioCapture?.(stream)
    } catch (error) {
      console.error('[connect]', error)
      setErrorMessage(
        'Could not connect to the voice service. Make sure AI_GATEWAY_API_KEY (or XAI_API_KEY) is set in the Vercel project environment variables.',
      )
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [realtime])

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            G
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-tight">
              Grok Voice
            </h1>
            <p className="text-xs text-muted-foreground">
              Realtime · xAI · AI Gateway
            </p>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs capitalize text-muted-foreground">
          <span
            className={
              voiceState === 'listening' || voiceState === 'speaking'
                ? 'h-2 w-2 rounded-full bg-primary'
                : voiceState === 'error'
                  ? 'h-2 w-2 rounded-full bg-destructive'
                  : 'h-2 w-2 rounded-full bg-muted-foreground/40'
            }
          />
          {voiceState === 'disconnected' ? 'Idle' : voiceState}
        </span>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
        <VoiceOrb state={voiceState} onToggle={handleToggle} />

        {errorMessage && (
          <div
            role="alert"
            className="flex max-w-md items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <span className="flex-1 text-pretty">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium hover:bg-destructive/15"
            >
              Dismiss
            </button>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Transcript">
          <Transcript messages={messages} />
        </Panel>
        <Panel title="Tool activity">
          <ToolActivity events={toolEvents} />
        </Panel>
      </section>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        Clean rebuild · Powered by Grok Voice + Vercel AI Gateway
      </footer>
    </main>
  )
}

function Panel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex h-72 flex-col overflow-hidden rounded-2xl border border-border bg-card/40">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
