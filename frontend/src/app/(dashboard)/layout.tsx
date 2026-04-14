'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { LayoutDashboard, Database } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'AI Inventory', icon: Database },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-50 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <span className="text-xl font-bold">AIGuard</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t flex items-center gap-3">
          <UserButton />
          <span className="text-sm text-gray-600">Account</span>
        </div>
      </aside>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}