'use client'

import { cn } from '@/lib/utils'

export type TranscriptMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export function Transcript({ messages }: { messages: TranscriptMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Conversation will appear here once you start talking.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={cn(
            'max-w-[90%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
            m.role === 'user'
              ? 'ml-auto bg-primary/15 text-foreground'
              : 'mr-auto bg-muted/60 text-foreground',
          )}
        >
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {m.role === 'user' ? 'You' : 'Grok'}
          </span>
          {m.text || <span className="opacity-50">…</span>}
        </div>
      ))}
    </div>
  )
}
