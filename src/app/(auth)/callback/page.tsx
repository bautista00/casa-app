'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { es } from '@/lib/i18n/es'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2, MailWarning } from 'lucide-react'

const TIMEOUT_MS = 8000

export default function CallbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // Supabase reports a dead link either in the hash fragment (implicit flow)
    // or in the query string (PKCE). When it does, there is nothing to wait for,
    // so fail on the next tick instead of after the full timeout.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const query = new URLSearchParams(window.location.search)
    const linkRejected = Boolean(hash.get('error') || query.get('error'))

    let done = false
    const succeed = () => {
      if (done) return
      done = true
      router.replace('/onboarding')
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') succeed()
    })

    // The session may already be established by the time this mounts, in which
    // case no SIGNED_IN event will ever arrive.
    if (!linkRejected) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) succeed()
      })
    }

    // Expired link, already-consumed link, link opened in another browser, or a
    // Supabase outage: nothing arrives at all. Don't spin forever (CASA-014).
    const timer = setTimeout(
      () => {
        if (!done) setFailed(true)
      },
      linkRejected ? 0 : TIMEOUT_MS
    )

    return () => {
      clearTimeout(timer)
      sub.subscription.unsubscribe()
    }
  }, [supabase, router])

  if (failed) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="w-16 h-16 rounded-3xl bg-accent/10 flex items-center justify-center shadow-sm">
          <MailWarning className="w-8 h-8 text-accent" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold font-[family-name:var(--font-heading)]">
            {es.auth.linkExpired}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {es.auth.linkExpiredHelp}
          </p>
        </div>
        <Link
          href="/login"
          className={cn(
            buttonVariants(),
            'h-12 w-full max-w-xs text-base font-semibold cursor-pointer'
          )}
        >
          {es.auth.backToLogin}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 px-6 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{es.auth.verifying}</p>
    </div>
  )
}
