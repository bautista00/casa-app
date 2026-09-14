'use client'

// Last-resort boundary: replaces the root layout, so it must ship its own
// <html>/<body> and cannot rely on globals.css or the font variables.

import { useEffect } from 'react'
import { es } from '@/lib/i18n/es'

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error('[casa] global error boundary caught:', error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.5rem',
          textAlign: 'center',
          background: '#f2f5fc',
          color: '#1b1f2a',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
          {es.errors.title}
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: '20rem',
            fontSize: '0.875rem',
            color: '#515869',
          }}
        >
          {es.errors.description}
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            minHeight: 48,
            padding: '0 1.5rem',
            borderRadius: 12,
            border: 'none',
            background: '#4F46E5',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {es.errors.retry}
        </button>
      </body>
    </html>
  )
}
