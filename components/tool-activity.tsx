'use client'

import { cn } from '@/lib/utils'
import { Check, Loader2, X } from 'lucide-react'

export type ToolEvent = {
  id: string
  name: string
  args?: unknown
  status: 'running' | 'done' | 'error'
  result?: unknown
}

export function ToolActivity({ events }: { events: ToolEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Tool calls (time, weather, …) will show up here.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      {events.map((e) => (
        <div
          key={e.id}
          className="rounded-xl border border-border bg-card/50 px-3 py-2.5 text-sm"
        >
          <div className="flex items-center gap-2">
            {e.status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
            {e.status === 'done' && <Check className="h-3.5 w-3.5 text-primary" />}
            {e.status === 'error' && <X className="h-3.5 w-3.5 text-destructive" />}
            <span className="font-medium">{e.name}</span>
            <span
              className={cn(
                'ml-auto text-[10px] uppercase tracking-wide',
                e.status === 'error' ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {e.status}
            </span>
          </div>
          {e.args != null && (
            <pre className="mt-1.5 overflow-x-auto text-[11px] text-muted-foreground">
              {JSON.stringify(e.args, null, 0)}
            </pre>
          )}
          {e.result != null && e.status === 'done' && (
            <pre className="mt-1 overflow-x-auto text-[11px] text-primary/90">
              {JSON.stringify(e.result, null, 0)}
            </pre>
          )}
        </div>
      ))}
    </div>
  )
}
