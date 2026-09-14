'use client'

// Catches failures in the route-group layouts — `(app)/layout.tsx` awaits
// getProfile/getUserHouseholds, and an `error.tsx` never catches the layout of
// its own segment, so this root-level boundary is the one that sees them.

import { ErrorState } from '@/components/error-state'

export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return <ErrorState error={error} retry={retry} />
}
