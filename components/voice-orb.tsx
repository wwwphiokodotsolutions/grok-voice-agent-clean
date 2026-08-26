'use client'

import { cn } from '@/lib/utils'
import { Loader2, Mic, MicOff } from 'lucide-react'

export type VoiceState =
  | 'disconnected'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'error'

const labels: Record<VoiceState, string> = {
  disconnected: 'Tap to start talking',
  connecting: 'Connecting…',
  listening: 'Listening…',
  speaking: 'Grok is speaking…',
  error: 'Connection error — try again',
}

export function VoiceOrb({
  state,
  onToggle,
}: {
  state: VoiceState
  onToggle: () => void
}) {
  const active = state === 'listening' || state === 'speaking'
  const connecting = state === 'connecting'

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        type="button"
        onClick={onToggle}
        aria-label={active ? 'End voice session' : 'Start voice session'}
        className="group relative flex h-44 w-44 items-center justify-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring/40 sm:h-52 sm:w-52"
      >
        {active && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-duration:2s]" />
            <span className="absolute inset-4 animate-ping rounded-full bg-primary/10 [animation-duration:2.5s]" />
          </>
        )}

        <span
          className={cn(
            'absolute inset-0 rounded-full border transition-colors duration-500',
            active
              ? 'border-primary/50 shadow-[0_0_50px_-10px_var(--color-primary)]'
              : 'border-border',
            state === 'error' && 'border-destructive/60',
          )}
        />

        <span
          className={cn(
            'relative flex h-28 w-28 items-center justify-center rounded-full transition-all duration-500 sm:h-32 sm:w-32',
            active
              ? 'scale-105 bg-primary text-primary-foreground'
              : 'bg-card text-foreground group-hover:bg-muted',
            state === 'speaking' && 'animate-pulse [animation-duration:1.1s]',
          )}
        >
          {connecting ? (
            <Loader2 className="h-9 w-9 animate-spin" />
          ) : active ? (
            <Mic className="h-9 w-9" />
          ) : (
            <MicOff className="h-9 w-9 opacity-80" />
          )}
        </span>
      </button>

      <p
        className={cn(
          'text-sm font-medium transition-colors',
          state === 'error' ? 'text-destructive' : 'text-muted-foreground',
        )}
        aria-live="polite"
      >
        {labels[state]}
      </p>
    </div>
  )
}
