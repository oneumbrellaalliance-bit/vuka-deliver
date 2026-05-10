// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Vuka Deliver',
  description: 'Food and essentials delivered in Kigali in under 45 minutes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vuka Deliver',
  },
  openGraph: {
    title: 'Vuka Deliver',
    description: 'Fast delivery in Kigali, Rwanda',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#D85A30',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans bg-[#F5F3EF] min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
