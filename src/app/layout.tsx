import type { Metadata, Viewport } from 'next'
import { Nunito, Fredoka } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const nunito = Nunito({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const fredoka = Fredoka({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Casa — Organicen la casa juntos',
  description:
    'Asigná tareas, sumá puntos, ganá la semana. La app para familias y compañeros de casa.',
  manifest: '/manifest.json',
}

// No `maximumScale` and no `userScalable: false` — pinch-zoom has to keep
// working (WCAG 2.1 SC 1.4.4, CASA-018). The flag was only ever guarding
// against iOS auto-zoom on a focused input, and `ui/input.tsx` already renders
// at `text-base` (16 px) on mobile, which is what actually prevents that.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4F46E5',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
