'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { es } from '@/lib/i18n/es'
import { Home, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    })

    setLoading(false)

    if (error) {
      toast.error(es.errors.generic)
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary/5 to-background">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-4">
          <Home className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-[family-name:var(--font-heading)] text-foreground">
          {es.app.name}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {es.app.tagline}
        </p>
      </div>

      <Card className="w-full max-w-sm shadow-lg border-2">
        <CardHeader className="pb-4">
          <h2 className="text-xl font-semibold text-center">
            {es.auth.login}
          </h2>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center py-4">
              <Mail className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="font-medium text-lg">{es.auth.checkEmail}</p>
              <p className="text-muted-foreground text-sm mt-2">
                {es.auth.magicLinkSent}
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{es.auth.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={es.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-12 text-base"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  es.auth.sendMagicLink
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
