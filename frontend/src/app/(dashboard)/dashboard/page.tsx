'use client'

import { motion } from 'framer-motion'

const metrics = [
  { label: 'Total AI Systems', value: '8', pill: '↑ 2 this month', pillColor: '#f0f6ff', pillText: '#0071e3' },
  { label: 'High Risk', value: '4', valueColor: '#ff3b30', pill: 'Needs action', pillColor: '#fff0f0', pillText: '#ff3b30' },
  { label: 'Compliant', value: '2', valueColor: '#30d158', pill: 'Fully documented', pillColor: '#edfff4', pillText: '#1a7a3a' },
  { label: 'Annex IV Docs', value: '2', valueColor: '#0071e3', pill: 'Generated', pillColor: '#f0f6ff', pillText: '#0071e3' },
]

const systems = [
  { name: 'Credit Scoring Model', vendor: 'Internal', risk: 'High Risk', riskStyle: { background: '#fff0f0', color: '#c0392b' }, status: 'Compliant', statusStyle: { background: '#e8f4ff', color: '#0055b3' } },
  { name: 'Fraud Detection', vendor: 'Stripe', risk: 'High Risk', riskStyle: { background: '#fff0f0', color: '#c0392b' }, status: 'In Progress', statusStyle: { background: '#fff8ec', color: '#b7600a' } },
  { name: 'HR Screening Tool', vendor: 'Workday', risk: 'High Risk', riskStyle: { background: '#fff0f0', color: '#c0392b' }, status: 'Unclassified', statusStyle: { background: '#f5f5f7', color: '#6e6e73' } },
  { name: 'KYC Verification', vendor: 'Jumio', risk: 'Limited Risk', riskStyle: { background: '#fff8ec', color: '#b7600a' }, status: 'Unclassified', statusStyle: { background: '#f5f5f7', color: '#6e6e73' } },
  { name: 'Email Spam Filter', vendor: 'Google', risk: 'Minimal Risk', riskStyle: { background: '#edfff4', color: '#1a7a3a' }, status: 'Compliant', statusStyle: { background: '#e8f4ff', color: '#0055b3' } },
]

const activity = [
  { text: 'Annex IV generated for Credit Scoring Model', time: '2 hours ago', iconBg: '#edfff4', iconColor: '#30d158', icon: '✓' },
  { text: 'HR Screening Tool classified High Risk', time: '5 hours ago', iconBg: '#fff0f0', iconColor: '#ff3b30', icon: '⚠' },
  { text: '3 systems imported via CSV', time: 'Yesterday', iconBg: '#f0f6ff', iconColor: '#0071e3', icon: '+' },
]

const dotColors: Record<string, string> = {
  'High Risk': '#ff3b30',
  'Limited Risk': '#ff9500',
  'Minimal Risk': '#30d158',
}

export default function DashboardPage() {
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
            High-risk AI systems must be compliant by 2 August 2026
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#30d158', letterSpacing: '-1px', lineHeight: 1 }}>109</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>days remaining</div>
        </div>
      </motion.div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            style={{
              background: '#fff', borderRadius: '14px', padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '11px', color: '#86868b', fontWeight: 500, marginBottom: '10px' }}>{m.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1, color: m.valueColor || '#1d1d1f' }}>{m.value}</div>
            <div style={{ display: 'inline-flex', marginTop: '8px', padding: '2px 8px', borderRadius: '980px', fontSize: '10px', fontWeight: 600, background: m.pillColor, color: m.pillText }}>{m.pill}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div style={{ padding: '16px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f' }}>AI System Inventory</span>
            <a href="/inventory" style={{ fontSize: '12px', color: '#0071e3', textDecoration: 'none', fontWeight: 500 }}>View all</a>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['System', 'Risk Tier', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', color: '#86868b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {systems.map((s, i) => (
                <motion.tr
                  key={s.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '13px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ fontWeight: 500, fontSize: '13px', color: '#1d1d1f' }}>{s.name}</div>
                    <div style={{ color: '#86868b', fontSize: '11px', marginTop: '1px' }}>{s.vendor}</div>
                  </td>
                  <td style={{ padding: '13px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, ...s.riskStyle }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColors[s.risk] || '#86868b' }}></div>
                      {s.risk}
                    </div>
                  </td>
                  <td style={{ padding: '13px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, ...s.statusStyle }}>
                      {s.status}
                    </div>
                  </td>
                  <td style={{ padding: '13px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.04)' }}>
                    <button style={{ background: '#f5f5f7', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: '#0071e3', cursor: 'pointer', fontWeight: 500 }}>
                      {s.status === 'Unclassified' ? 'Classify →' : 'View →'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Donut */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div style={{ padding: '16px 20px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f' }}>Risk Distribution</span>
            </div>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="28" fill="none" stroke="#f5f5f7" strokeWidth="11"/>
                <circle cx="38" cy="38" r="28" fill="none" stroke="#ff3b30" strokeWidth="11" strokeDasharray="88 88" strokeDashoffset="0" transform="rotate(-90 38 38)"/>
                <circle cx="38" cy="38" r="28" fill="none" stroke="#ff9500" strokeWidth="11" strokeDasharray="22 154" strokeDashoffset="-88" transform="rotate(-90 38 38)"/>
                <circle cx="38" cy="38" r="28" fill="none" stroke="#30d158" strokeWidth="11" strokeDasharray="66 110" strokeDashoffset="-110" transform="rotate(-90 38 38)"/>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {[['#ff3b30', 'High Risk', '4'], ['#ff9500', 'Limited', '2'], ['#30d158', 'Minimal', '2']].map(([color, label, count]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#3a3a3c' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }}></div>
                      {label}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#1d1d1f' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Activity */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div style={{ padding: '16px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f' }}>Recent Activity</span>
            </div>
            {activity.map((a, i) => (
              <div key={i} style={{ padding: '13px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px', borderBottom: i < activity.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', color: a.iconColor, fontWeight: 700 }}>
                  {a.icon}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#1d1d1f', fontWeight: 500, lineHeight: 1.4 }}>{a.text}</div>
                  <div style={{ fontSize: '11px', color: '#86868b', marginTop: '2px' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}