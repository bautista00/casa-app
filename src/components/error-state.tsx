'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RotateCw } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { es } from '@/lib/i18n/es'

/**
 * Shared fallback UI for every `error.tsx` boundary.
 *
 * Deliberately renders no part of `error` except `digest` — a server-side error
 * message can carry Postgres `hint`/`details` and must never reach the DOM.
 * The full error is logged to the console so it stays visible in the dev log.
 */
export function ErrorState({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error('[casa] error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl font-bold font-[family-name:var(--font-heading)]">
          {es.errors.title}
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {es.errors.description}
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Button
          onClick={() => retry()}
          className="h-12 w-full text-base font-semibold cursor-pointer gap-2"
        >
          <RotateCw className="w-4 h-4" />
          {es.errors.retry}
        </Button>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'h-12 w-full text-base cursor-pointer'
          )}
        >
          {es.errors.goHome}
        </Link>
      </div>

      {error.digest && (
        <p className="text-[11px] text-muted-foreground/70 font-mono">
          {error.digest}
        </p>
      )}
    </div>
  )
}
