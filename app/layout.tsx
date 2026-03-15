import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       'GRE Vocab',
  description: 'Spaced repetition flashcards for GRE vocabulary',
  manifest:    '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'GRE Vocab' },
}
export const viewport: Viewport = {
  themeColor: '#f0ede8', width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link rel="apple-touch-icon" href="/icon-192.png"/></head>
      <body>{children}</body>
    </html>
  )
}
