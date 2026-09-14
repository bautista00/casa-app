'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Household } from '@/types'
import { es } from '@/lib/i18n/es'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Home,
  Plus,
  Trophy,
  Settings,
  LogOut,
  ChevronDown,
  ClipboardList,
} from 'lucide-react'

interface AppShellProps {
  profile: Profile
  households: Household[]
  children: React.ReactNode
}

export function AppShell({ profile, households, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Extract current household ID from path
  const match = pathname.match(/\/casa\/([^/]+)/)
  const currentHouseholdId = match?.[1]
  const currentHousehold = households.find((h) => h.id === currentHouseholdId)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = currentHouseholdId
    ? [
        {
          href: `/casa/${currentHouseholdId}`,
          label: es.nav.board,
          icon: ClipboardList,
        },
        {
          href: `/casa/${currentHouseholdId}/historial`,
          label: es.nav.history,
          icon: Trophy,
        },
        {
          href: `/casa/${currentHouseholdId}/ajustes`,
          label: es.nav.settings,
          icon: Settings,
        },
      ]
    : []

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Link
              href="/onboarding"
              className="font-bold text-xl font-[family-name:var(--font-heading)] text-primary"
            >
              Casa
            </Link>

            {/* Household switcher */}
            {households.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-11 gap-1 cursor-pointer"
                  >
                    <Home className="w-4 h-4" />
                    <span className="max-w-[120px] truncate text-sm">
                      {currentHousehold?.name ?? es.nav.switchHouse}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {households.map((h) => (
                    <DropdownMenuItem
                      key={h.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/casa/${h.id}`)}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      {h.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push('/onboarding')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {es.onboarding.createHouse}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="sm" className="h-11 gap-2 cursor-pointer">
                <span className="text-lg">{profile.emoji}</span>
                <span className="text-sm font-medium max-w-[80px] truncate">
                  {profile.display_name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {es.auth.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      {navItems.length > 0 && (
        <nav className="sticky bottom-0 z-40 border-t bg-card/80 backdrop-blur-sm md:hidden">
          <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-11 flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            })}
            <Link
              href={`/casa/${currentHouseholdId}/nueva`}
              aria-label={es.nav.newTask}
              className="flex min-h-11 flex-col items-center justify-center gap-1 px-3 py-2 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Plus className="w-5 h-5 text-primary-foreground" />
              </div>
            </Link>
          </div>
        </nav>
      )}
    </div>
  )
}
