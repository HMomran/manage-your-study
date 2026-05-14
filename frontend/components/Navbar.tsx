'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="bg-navy text-white shadow-md sticky top-0 z-50">
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3 min-h-14 sm:min-h-16">
        <Link href="/study" className="min-w-0 flex items-center gap-2 font-bold text-base sm:text-lg tracking-tight">
          <BookOpen className="text-gold w-5 h-5 shrink-0" />
          <span className="text-white truncate">Manage Your </span>
          <span className="text-teal">Study</span>
        </Link>

        <nav className="flex items-center gap-3 text-xs sm:text-sm font-medium shrink-0">
          <Link
            href="/study"
            className={`hover:text-teal transition-colors ${pathname === '/study' ? 'text-teal' : 'text-white/80'}`}
          >
            Study Planner
          </Link>
        </nav>
      </div>
    </header>
  )
}
