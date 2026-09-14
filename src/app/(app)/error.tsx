'use client'

// Boundary for the signed-in pages (/casa/[id], /historial, /ajustes, /nueva,
// /onboarding). It renders inside AppShell, so the family keeps the nav while
// one segment fails.

import { ErrorState } from '@/components/error-state'

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return <ErrorState error={error} retry={retry} />
}
