'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useUser } from '@/hooks/useUser'
import { motion, AnimatePresence } from 'framer-motion'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tablet-royal-timid.ngrok-free.dev/api/v1'

type AuditLog = {
  id: string
  timestamp: string
  action: string
  entity_type: string
  entity_id: string
  user_email: string
  details: Record<string, any>
  record_hash: string
  previous_hash: string
}

const actionConfig: Record<string, { label: string; color: string; bg: string; dot: string; icon: string }> = {
  'ai_system.created':        { label: 'System Added',         color: '#1a7a3a', bg: '#edfff4', dot: '#30d158', icon: '+' },
  'ai_system.deleted':        { label: 'System Deleted',       color: '#c0392b', bg: '#fff0f0', dot: '#ff3b30', icon: '\u2212' },
  'classification.completed': { label: 'Classification Done',  color: '#0055b3', bg: '#e8f4ff', dot: '#0071e3', icon: '\u25CE' },
  'document.generated':       { label: 'Document Generated',   color: '#6b3fa0', bg: '#f5f0ff', dot: '#9b59b6', icon: '\u2261' },
  'pdf.exported':             { label: 'PDF Exported',         color: '#b7600a', bg: '#fff8ec', dot: '#ff9500', icon: '\u2193' },
  'user.registered':          { label: 'User Registered',      color: '#1d1d1f', bg: '#f5f5f7', dot: '#aeaeb2', icon: '\u25CB' },
}

function getActionConfig(action: string) {
  return actionConfig[action] || { label: action, color: '#3a3a3c', bg: '#f5f5f7', dot: '#aeaeb2', icon: '\u2022' }
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function truncateHash(hash: string) {
  if (!hash || hash === 'GENESIS') return hash
  return hash.slice(0, 8) + '...' + hash.slice(-8)
}

export default function AuditLogPage() {
  const { getToken } = useAuth()
  const { orgId, loading: userLoading } = useUser()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) return
    async function fetchLogs() {
      try {
        const token = await getToken()
        const res = await fetch(`${BASE_URL}/organisations/${orgId}/audit-logs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        })
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : data.items || [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [orgId])

  function copyHash(hash: string) {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  if (userLoading || loading) {
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
    <div style={{ padding: '28px', maxWidth: '900px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.4px', marginBottom: '4px' }}>
          Audit Log
        </h2>
        <p style={{ fontSize: '13px', color: '#86868b' }}>
          Tamper-proof activity trail secured with SHA-256 hash chain
        </p>
      </motion.div>

      {/* Hash Chain Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%)',
          border: '0.5px solid rgba(0,113,227,0.2)',
          borderRadius: '12px', padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: '#0071e3', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4V8C14 11.5 11.5 14.5 8 15.5C4.5 14.5 2 11.5 2 8V4L8 1Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2" fill="#fff"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0055b3' }}>SHA-256 Hash Chain Active</div>
          <div style={{ fontSize: '12px', color: '#3a3a3c' }}>
            Every record is cryptographically linked to the previous one. Any tampering breaks the chain.
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0071e3' }}>{logs.length}</div>
          <div style={{ fontSize: '11px', color: '#86868b' }}>total records</div>
        </div>
      </motion.div>

      {error && (
        <div style={{ background: '#fff0f0', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#ff3b30', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Logs */}
      {logs.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b', fontSize: '13px' }}>
          No activity recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {logs.map((log, index) => {
            const config = getActionConfig(log.action)
            const isExpanded = expanded === log.id
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div
                  onClick={() => setExpanded(isExpanded ? null : log.id)}
                  style={{
                    background: '#fff', borderRadius: '12px', padding: '14px 18px',
                    border: '0.5px solid rgba(0,0,0,0.08)',
                    cursor: 'pointer', transition: 'box-shadow 0.15s',
                    boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => !isExpanded && (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Action badge */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: config.bg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '14px', fontWeight: 700,
                      color: config.color, flexShrink: 0,
                    }}>
                      {config.icon}
                    </div>

                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{
                          fontSize: '12px', fontWeight: 600,
                          color: config.color, background: config.bg,
                          padding: '2px 8px', borderRadius: '4px',
                        }}>
                          {config.label}
                        </span>
                        {log.details?.name && (
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#1d1d1f' }}>
                            {log.details.name}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '11px', color: '#86868b' }}>{formatTime(log.timestamp)}</span>
                        <span style={{ fontSize: '11px', color: '#86868b' }}>{log.user_email}</span>
                      </div>
                    </div>

                    {/* Hash preview */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        onClick={e => { e.stopPropagation(); copyHash(log.record_hash) }}
                        style={{
                          fontFamily: 'monospace', fontSize: '10px', color: '#86868b',
                          background: '#f5f5f7', padding: '3px 8px', borderRadius: '4px',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                        title="Click to copy full hash"
                      >
                        {copiedHash === log.record_hash ? 'Copied!' : truncateHash(log.record_hash)}
                      </div>
                    </div>

                    {/* Expand arrow */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      style={{ color: '#86868b', fontSize: '12px', flexShrink: 0 }}
                    >
                      ▼
                    </motion.div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#86868b', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entity Type</div>
                              <div style={{ fontSize: '12px', color: '#1d1d1f', fontWeight: 500 }}>{log.entity_type}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#86868b', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entity ID</div>
                              <div style={{ fontSize: '11px', color: '#3a3a3c', fontFamily: 'monospace' }}>{log.entity_id}</div>
                            </div>
                          </div>

                          {Object.keys(log.details || {}).length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '11px', color: '#86868b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Details</div>
                              <div style={{ background: '#f5f5f7', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#3a3a3c', fontFamily: 'monospace' }}>
                                {JSON.stringify(log.details, null, 2)}
                              </div>
                            </div>
                          )}

                          {/* Hash chain */}
                          <div>
                            <div style={{ fontSize: '11px', color: '#86868b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hash Chain</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#86868b', width: '100px', flexShrink: 0 }}>Previous Hash</span>
                                <div
                                  onClick={() => log.previous_hash !== 'GENESIS' && copyHash(log.previous_hash)}
                                  style={{
                                    fontFamily: 'monospace', fontSize: '11px',
                                    color: log.previous_hash === 'GENESIS' ? '#30d158' : '#3a3a3c',
                                    background: log.previous_hash === 'GENESIS' ? '#edfff4' : '#f5f5f7',
                                    padding: '4px 10px', borderRadius: '6px',
                                    cursor: log.previous_hash !== 'GENESIS' ? 'pointer' : 'default',
                                    wordBreak: 'break-all',
                                  }}
                                >
                                  {log.previous_hash === 'GENESIS' ? '\u2605 GENESIS BLOCK' : log.previous_hash}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#86868b', width: '100px', flexShrink: 0 }}>Record Hash</span>
                                <div
                                  onClick={() => copyHash(log.record_hash)}
                                  style={{
                                    fontFamily: 'monospace', fontSize: '11px', color: '#0055b3',
                                    background: '#e8f4ff', padding: '4px 10px', borderRadius: '6px',
                                    cursor: 'pointer', wordBreak: 'break-all',
                                  }}
                                  title="Click to copy"
                                >
                                  {copiedHash === log.record_hash ? 'Copied!' : log.record_hash}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}