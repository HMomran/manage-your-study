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
        <main className="max-w-4xl mx-auto px-4 pb-16 pt-4">
          {children}
        </main>
      </body>
    </html>
  )
}
