'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="bg-navy text-white shadow-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/study" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <BookOpen className="text-gold w-5 h-5" />
          <span className="text-white">Manage Your </span>
          <span className="text-teal">Study</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
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
