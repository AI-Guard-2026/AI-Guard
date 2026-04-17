'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import { useUser } from '@/hooks/useUser'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tablet-royal-timid.ngrok-free.dev/api/v1'

type Stats = {
  organisation_name: string
  plan: string
  total_systems: number
  unclassified: number
  high_risk: number
  limited_risk: number
  minimal_risk: number
  unacceptable: number
  compliant: number
  needs_review: number
  in_progress: number
  total_documents: number
  approved_documents: number
  pending_documents: number
  compliance_score: number
  days_until_deadline: number
  on_track: boolean
}

export default function DashboardPage() {
  const { getToken } = useAuth()
  const { orgId, loading: userLoading } = useUser()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) return
    async function fetchStats() {
      try {
        const token = await getToken()
        const res = await fetch(`${BASE_URL}/organisations/${orgId}/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        })
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setStats(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [orgId])

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

  const s = stats
  const total = s?.total_systems || 0
  const highRisk = s?.high_risk || 0
  const limitedRisk = s?.limited_risk || 0
  const minimalRisk = s?.minimal_risk || 0
  const compliant = s?.compliant || 0
  const daysLeft = s?.days_until_deadline ?? 109
  const complianceScore = s?.compliance_score ?? 0

  // Donut chart calculations
  const circumference = 176
  const highAngle = total > 0 ? (highRisk / total) * circumference : 0
  const limitedAngle = total > 0 ? (limitedRisk / total) * circumference : 0
  const minimalAngle = total > 0 ? (minimalRisk / total) * circumference : 0

  const donutSlices = [
    { label: 'High Risk', count: highRisk, color: '#ff3b30', hoverColor: '#ff2020', dashArray: `${highAngle} ${circumference}`, dashOffset: '0' },
    { label: 'Limited', count: limitedRisk, color: '#ff9500', hoverColor: '#ff8800', dashArray: `${limitedAngle} ${circumference}`, dashOffset: `${-highAngle}` },
    { label: 'Minimal', count: minimalRisk, color: '#30d158', hoverColor: '#25c050', dashArray: `${minimalAngle} ${circumference}`, dashOffset: `${-(highAngle + limitedAngle)}` },
  ]

  const metrics = [
    { label: 'Total AI Systems', value: String(total), pill: s?.on_track ? 'On track' : 'Needs attention', pillColor: s?.on_track ? '#edfff4' : '#fff0f0', pillText: s?.on_track ? '#1a7a3a' : '#ff3b30' },
    { label: 'High Risk', value: String(highRisk), valueColor: '#ff3b30', pill: highRisk > 0 ? 'Needs action' : 'Clear', pillColor: highRisk > 0 ? '#fff0f0' : '#edfff4', pillText: highRisk > 0 ? '#ff3b30' : '#1a7a3a' },
    { label: 'Compliant', value: String(compliant), valueColor: '#30d158', pill: 'Fully documented', pillColor: '#edfff4', pillText: '#1a7a3a' },
    { label: 'Annex IV Docs', value: String(s?.total_documents || 0), valueColor: '#0071e3', pill: `${s?.approved_documents || 0} approved`, pillColor: '#f0f6ff', pillText: '#0071e3' },
  ]

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Deadline Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'linear-gradient(135deg, #1d1d1f 0%, #3a3a3c 100%)',
          borderRadius: '16px', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600, letterSpacing: '-0.2px', marginBottom: '4px' }}>
            EU AI Act Enforcement Deadline
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
            High-risk AI systems must be compliant by August 2, 2026
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: daysLeft < 60 ? '#ff9500' : '#30d158', letterSpacing: '-1px', lineHeight: 1 }}>
            {daysLeft}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '2px' }}>days remaining</div>
        </div>
      </motion.div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div style={{ fontSize: '11px', color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: m.valueColor || '#1d1d1f', letterSpacing: '-1px', marginBottom: '8px' }}>
              {m.value}
            </div>
            <div style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: m.pillColor, color: m.pillText }}>
              {m.pill}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f', marginBottom: '16px' }}>Risk Distribution</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 70 70">
                <circle cx="35" cy="35" r="28" fill="none" stroke="#f5f5f7" strokeWidth="10" />
                {total === 0 ? (
                  <circle cx="35" cy="35" r="28" fill="none" stroke="#e5e5ea" strokeWidth="10" />
                ) : (
                  donutSlices.map((slice) => (
                    <circle
                      key={slice.label}
                      cx="35" cy="35" r="28"
                      fill="none"
                      stroke={hoveredSlice === slice.label ? slice.hoverColor : slice.color}
                      strokeWidth={hoveredSlice === slice.label ? 12 : 10}
                      strokeDasharray={slice.dashArray}
                      strokeDashoffset={slice.dashOffset}
                      strokeLinecap="round"
                      style={{ transition: 'all 0.2s', transform: 'rotate(-90deg)', transformOrigin: '35px 35px' }}
                      onMouseEnter={() => setHoveredSlice(slice.label)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  ))
                )}
                <text x="35" y="32" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1d1d1f">
                  {hoveredSlice ? donutSlices.find(s => s.label === hoveredSlice)?.count : total}
                </text>
                <text x="35" y="42" textAnchor="middle" fontSize="6" fill="#86868b">
                  {hoveredSlice || 'total'}
                </text>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {donutSlices.map(slice => (
                <div
                  key={slice.label}
                  onMouseEnter={() => setHoveredSlice(slice.label)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'default', opacity: hoveredSlice && hoveredSlice !== slice.label ? 0.4 : 1, transition: 'opacity 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: slice.color }} />
                    <span style={{ fontSize: '12px', color: '#3a3a3c' }}>{slice.label}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f' }}>{slice.count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Compliance Score */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f', marginBottom: '16px' }}>Compliance Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', fontWeight: 700, color: complianceScore >= 70 ? '#30d158' : complianceScore >= 40 ? '#ff9500' : '#ff3b30', letterSpacing: '-2px' }}>
              {complianceScore}
            </div>
            <div style={{ fontSize: '20px', color: '#86868b', fontWeight: 300 }}>/100</div>
          </div>
          <div style={{ height: '6px', background: '#f5f5f7', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${complianceScore}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{
                height: '100%', borderRadius: '3px',
                background: complianceScore >= 70 ? '#30d158' : complianceScore >= 40 ? '#ff9500' : '#ff3b30',
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Needs Review', value: s?.needs_review || 0, color: '#ff9500' },
              { label: 'In Progress', value: s?.in_progress || 0, color: '#0071e3' },
              { label: 'Pending Docs', value: s?.pending_documents || 0, color: '#86868b' },
              { label: 'Unclassified', value: s?.unclassified || 0, color: '#aeaeb2' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#86868b' }}>{item.label}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1d1d1f', marginLeft: 'auto' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f', marginBottom: '14px' }}>Quick Actions</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: '+ Add AI System', href: '/inventory', bg: '#0071e3', color: '#fff' },
            { label: 'Classify System', href: '/classify', bg: '#f5f5f7', color: '#1d1d1f' },
            { label: 'View Audit Log', href: '/audit', bg: '#f5f5f7', color: '#1d1d1f' },
            { label: 'Generate Annex IV', href: '/inventory', bg: '#f5f5f7', color: '#1d1d1f' },
          ].map(action => (
            <a
              key={action.label}
              href={action.href}
              style={{
                padding: '9px 18px', borderRadius: '10px', fontSize: '13px',
                fontWeight: 500, background: action.bg, color: action.color,
                textDecoration: 'none', cursor: 'pointer',
                border: action.bg === '#f5f5f7' ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {action.label}
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  )
}