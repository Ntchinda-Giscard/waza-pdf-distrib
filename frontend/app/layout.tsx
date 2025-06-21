import type { Metadata } from 'next'
import toast, { Toaster } from 'react-hot-toast';

import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <Toaster/>
      <body>{children}</body>
    </html>
  )
}
