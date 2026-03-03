import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Footer } from '@/components/Footer'
import { LayoutContent } from '@/components/LayoutContent'
import { NetworkValidator } from '@/components/NetworkValidator'
import { DemoWrapper } from '@/components/demo/DemoWrapper'
import ContextProvider from '@/context'
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Hearst - Real Yield from Bitcoin Mining',
  description:
    'RWA-backed yield from green Bitcoin mining farms. Tokenized hashrate, sustainable energy, institutional-grade infrastructure.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-background`}>
        <ErrorBoundary>
          <ContextProvider cookies={cookies}>
            <DemoWrapper>
              <LayoutContent>{children}</LayoutContent>
              <Footer />
              <NetworkValidator />
            </DemoWrapper>
          </ContextProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
