import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Grok Voice Agent',
  description: 'Clean realtime voice assistant powered by xAI Grok via Vercel AI Gateway',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0f1218',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans min-h-dvh">{children}</body>
    </html>
  )
}
