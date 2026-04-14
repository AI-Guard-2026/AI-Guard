import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '32px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px',
          background: 'linear-gradient(135deg, #30d158 0%, #25a244 100%)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: '0 4px 12px rgba(48,209,88,0.35)',
        }}>
          <svg width="26" height="26" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="9" cy="9" r="2.5" fill="#fff"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.4px', marginBottom: '4px' }}>AIGuard</h1>
        <p style={{ fontSize: '14px', color: '#86868b' }}>EU AI Act Compliance Platform</p>
      </div>
      <SignUp />
    </div>
  )
}