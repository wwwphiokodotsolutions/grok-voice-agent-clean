'use client'

import { Transcript, type TranscriptMessage } from '@/components/transcript'
import { ToolActivity, type ToolEvent } from '@/components/tool-activity'
import { VoiceOrb, type VoiceState } from '@/components/voice-orb'
import { xai } from '@ai-sdk/xai'
import { experimental_useRealtime } from '@ai-sdk/react'
import { useCallback, useMemo, useRef, useState } from 'react'

export default function Page() {
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const realtime = experimental_useRealtime({
    model: xai.experimental_realtime('grok-voice-latest'),
    api: { token: '/api/realtime/setup' },
    sessionConfig: {
      instructions:
        'You are Grok, a witty and helpful voice assistant. Keep replies concise and conversational. Use the getCurrentTime and getWeather tools when the user asks about time or weather.',
      inputAudioTranscription: {},
      turnDetection: { type: 'server-vad' },
    },
    onError: (error) => {
      console.log('[v0] realtime session error:', error)
      setErrorMessage(
        error.message ||
          'The voice session ran into a problem. Please try reconnecting.',
      )
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    },
    onToolCall: async ({ toolCall }) => {
      const { toolCallId, toolName, args } = toolCall
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
            (args as { timeZone?: string })?.timeZone ||
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
    return realtime.status as VoiceState
  }, [realtime.status, realtime.isPlaying])

  const messages: TranscriptMessage[] = useMemo(
    () =>
      realtime.messages.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join(' '),
      })),
    [realtime.messages],
  )

  const handleToggle = useCallback(async () => {
    if (realtime.status === 'connected' || realtime.status === 'connecting') {
      realtime.disconnect()
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
          'Microphone access was blocked. Enable mic permission for this site in your browser, then try again.',
        )
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setErrorMessage(
          'No microphone was found. Connect a mic or check your input device, then try again.',
        )
      } else {
        setErrorMessage(
          'Could not access your microphone. Please check your device settings and try again.',
        )
      }
      return
    }

    try {
      await realtime.connect()
      realtime.startAudioCapture(stream)
    } catch (error) {
      console.log('[v0] connection error:', error)
      setErrorMessage(
        'Could not connect to the voice service. The session token may be missing or expired — make sure XAI_API_KEY is set, then try again.',
      )
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [realtime])

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-base font-bold">G</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Grok Voice</h1>
            <p className="text-xs text-muted-foreground">Realtime voice · xAI</p>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs capitalize text-muted-foreground">
          <span
            className={
              voiceState === 'listening' || voiceState === 'speaking'
                ? 'h-2 w-2 rounded-full bg-primary'
                : voiceState === 'error'
                  ? 'h-2 w-2 rounded-full bg-destructive'
                  : 'h-2 w-2 rounded-full bg-muted-foreground/50'
            }
          />
          {voiceState === 'disconnected' ? 'Idle' : voiceState}
        </span>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
        <VoiceOrb state={voiceState} onToggle={handleToggle} />
        {errorMessage && (
          <div
            role="alert"
            className="flex max-w-md items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <span className="flex-1 text-pretty">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/15"
              aria-label="Dismiss error"
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
