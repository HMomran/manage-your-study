import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Manage Your Study',
  description: 'Plan subjects, study dates, and daily lessons in one place',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface">
        <Navbar />
        <main className="w-full max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 pb-10 sm:pb-16 pt-3 sm:pt-4">
          {children}
        </main>
      </body>
    </html>
  )
}
