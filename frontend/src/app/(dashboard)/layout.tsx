'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, SignOutButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'

const navItems = [
  {
    section: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
      )},
    ]
  },
  {
    section: 'Compliance',
    items: [
      { href: '/inventory', label: 'AI Inventory', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M4 7h8M4 9.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      )},
      { href: '/classify', label: 'Classify System', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 4V8C14 11.5 11.5 14.5 8 15.5C4.5 14.5 2 11.5 2 8V4L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
      )},
      { href: '/annex-iv', label: 'Annex IV Docs', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/><path d="M10 2v4h4M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      )},
    ]
  },
  {
  section: 'Settings',
  items: [
    { href: '/audit', label: 'Audit Log', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    )},
    { href: '/settings', label: 'Settings', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    )},
  ]
}
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f5f7' }}>
      {/* Sidebar */}
      <div style={{
        width: '230px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderRight: '0.5px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #30d158 0%, #25a244 100%)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(48,209,88,0.35)',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="9" cy="9" r="2.5" fill="#fff"/>
            </svg>
          </div>
          <span style={{ fontSize: '17px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.3px' }}>AIGuard</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {navItems.map((group) => (
            <div key={group.section}>
              <div style={{ padding: '14px 8px 4px', color: '#86868b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {group.section}
              </div>
              {group.items.map((item) => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 10px', borderRadius: '8px',
                        cursor: 'pointer',
                        background: active ? 'rgba(0,113,227,0.1)' : 'transparent',
                        color: active ? '#0071e3' : '#3a3a3c',
                        fontSize: '13px',
                        fontWeight: active ? 500 : 400,
                        transition: 'background 0.15s',
                        marginBottom: '1px',
                      }}
                    >
                      <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }}>{item.icon}</span>
                      {item.label}
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 16px', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div suppressHydrationWarning>
              <UserButton />
            </div>
            <div>
              <div style={{ color: '#1d1d1f', fontSize: '12px', fontWeight: 500 }}>Account</div>
              <div style={{ color: '#86868b', fontSize: '11px' }}>AIGuard</div>
            </div>
          </div>
          <SignOutButton>
            <button style={{
              width: '100%', padding: '7px', borderRadius: '8px', fontSize: '12px',
              fontWeight: 500, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,0.1)',
              background: '#fff5f5', color: '#ff3b30',
            }}>
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{
          height: '56px',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', flexShrink: 0,
        }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.2px' }}>
            {navItems.flatMap(g => g.items).find(i => i.href === pathname)?.label || 'AIGuard'}
          </span>
        </div>

        {/* Page content */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ flex: 1, overflowY: 'auto' }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}