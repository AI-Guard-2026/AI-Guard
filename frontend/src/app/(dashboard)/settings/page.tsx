'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@/hooks/useUser'

export default function SettingsPage() {
  const { orgId, userId, loading } = useUser()
  const [copied, setCopied] = useState(false)

  function copyOrgId() {
    if (!orgId) return
    navigator.clipboard.writeText(orgId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #f5f5f7', borderTopColor: '#0071e3' }}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '640px' }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.4px', marginBottom: '4px' }}>
          Settings
        </h2>
        <p style={{ fontSize: '13px', color: '#86868b', marginBottom: '28px' }}>
          Manage your organisation and team access
        </p>

        {/* Organisation ID card */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f', marginBottom: '4px' }}>
            Organisation ID
          </div>
          <p style={{ fontSize: '12px', color: '#86868b', marginBottom: '14px' }}>
            Share this ID with teammates so they can join your organisation when they sign up.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              flex: 1, padding: '10px 14px', borderRadius: '8px',
              background: '#f5f5f7', fontFamily: 'monospace',
              fontSize: '13px', color: '#1d1d1f', wordBreak: 'break-all',
            }}>
              {orgId || 'Loading...'}
            </div>
            <button
              onClick={copyOrgId}
              style={{
                padding: '10px 18px', borderRadius: '8px', fontSize: '13px',
                fontWeight: 500, cursor: 'pointer', border: 'none', flexShrink: 0,
                background: copied ? '#30d158' : '#0071e3', color: '#fff',
                transition: 'background 0.2s',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* How to invite teammates */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f', marginBottom: '14px' }}>
            How to add teammates
          </div>
          {[
            { step: '1', text: 'Copy your Organisation ID above' },
            { step: '2', text: 'Share it with your teammate' },
            { step: '3', text: 'Teammate signs up at aiguard.vercel.app' },
            { step: '4', text: 'They enter the Organisation ID during signup — they\'ll be added to your org automatically' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: '#0071e3', color: '#fff', fontSize: '11px',
                fontWeight: 700, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, marginTop: '1px',
              }}>
                {item.step}
              </div>
              <span style={{ fontSize: '13px', color: '#3a3a3c', lineHeight: '1.5' }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Account info */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f', marginBottom: '14px' }}>
            Account Info
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#86868b' }}>User ID</span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#3a3a3c' }}>{userId?.slice(0, 8)}...</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#86868b' }}>Plan</span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#0071e3' }}>Free</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#86868b' }}>EU AI Act Version</span>
              <span style={{ fontSize: '12px', color: '#3a3a3c' }}>2024/1689</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
