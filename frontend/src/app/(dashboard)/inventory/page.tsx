'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import { useUser } from '@/hooks/useUser'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { listSystems, createSystem, deleteSystem, importCSV } from '@/lib/api'

const statusColors: Record<string, { background: string; color: string; dot: string }> = {
  'unclassified': { background: '#f5f5f7', color: '#6e6e73', dot: '#aeaeb2' },
  'high_risk':    { background: '#fff0f0', color: '#c0392b', dot: '#ff3b30' },
  'limited_risk': { background: '#fff8ec', color: '#b7600a', dot: '#ff9500' },
  'minimal_risk': { background: '#edfff4', color: '#1a7a3a', dot: '#30d158' },
  'compliant':    { background: '#e8f4ff', color: '#0055b3', dot: '#0071e3' },
}

const riskLabel: Record<string, string> = {
  'unclassified': 'Unclassified',
  'high_risk': 'High Risk',
  'limited_risk': 'Limited Risk',
  'minimal_risk': 'Minimal Risk',
  'compliant': 'Compliant',
}

const ALL_FILTERS = ['All', 'high_risk', 'limited_risk', 'minimal_risk', 'unclassified']

export default function InventoryPage() {
  const { getToken } = useAuth()
  const { orgId, loading: userLoading } = useUser()

  const [systems, setSystems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', vendor: '', purpose: '', sector: '' })
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [csvUploading, setCsvUploading] = useState(false)

  async function fetchSystems() {
    if (!orgId) return
    try {
      const token = await getToken()
      if (!token) return
      const data = await listSystems(token, orgId, {
        search: search || undefined,
        risk_tier: riskFilter !== 'All' ? riskFilter : undefined,
      })
      setSystems(data.items || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orgId) fetchSystems()
  }, [orgId, search, riskFilter])

  async function handleAdd() {
    if (!form.name || !form.purpose) return
    setSubmitting(true)
    try {
      const token = await getToken()
      if (!token || !orgId) return
      await createSystem(token, orgId, form)
      setForm({ name: '', vendor: '', purpose: '', sector: '' })
      setOpen(false)
      fetchSystems()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(systemId: string) {
    if (!confirm('Delete this system?')) return
    try {
      const token = await getToken()
      if (!token || !orgId) return
      await deleteSystem(token, orgId, systemId)
      fetchSystems()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !orgId) return
    setCsvUploading(true)
    try {
      const token = await getToken()
      if (!token) return
      const result = await importCSV(token, orgId, file)
      alert(`Imported ${result.created} systems. ${result.failed > 0 ? `${result.failed} failed.` : ''}`)
      fetchSystems()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCsvUploading(false)
      e.target.value = ''
    }
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
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.4px' }}>AI System Inventory</h2>
          <p style={{ fontSize: '13px', color: '#86868b', marginTop: '3px' }}>{systems.length} systems registered</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

          {/* CSV Import */}
          <label style={{
            padding: '8px 18px', borderRadius: '980px', fontSize: '13px', fontWeight: 500,
            cursor: csvUploading ? 'wait' : 'pointer',
            border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', color: '#1d1d1f',
            display: 'inline-block',
          }}>
            {csvUploading ? 'Importing...' : 'Import CSV'}
            <input type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} />
          </label>

          {/* Add System */}
          <button
            onClick={() => setOpen(true)}
            style={{ padding: '8px 18px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: '#0071e3', color: '#fff' }}
          >
            + Add System
          </button>

          {/* Custom Modal */}
          {open && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '480px', boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.3px' }}>Add AI System</h2>
                  <button onClick={() => setOpen(false)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#f5f5f7', cursor: 'pointer', fontSize: '14px', color: '#86868b' }}>\u2715</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'System Name *', key: 'name', placeholder: 'e.g. Credit Scoring Model' },
                    { label: 'Vendor', key: 'vendor', placeholder: 'e.g. Internal / OpenAI' },
                    { label: 'Purpose *', key: 'purpose', placeholder: 'e.g. Loan decisioning' },
                    { label: 'Sector', key: 'sector', placeholder: 'e.g. fintech, healthcare' },
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#3a3a3c', display: 'block', marginBottom: '5px' }}>{field.label}</label>
                      <input
                        placeholder={field.placeholder}
                        value={form[field.key as keyof typeof form]}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.12)', fontSize: '13px', color: '#1d1d1f', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleAdd}
                    disabled={submitting}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', border: 'none', background: '#0071e3', color: '#fff', marginTop: '6px', opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? 'Adding...' : 'Add System'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {error && (
        <div style={{ background: '#fff0f0', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#ff3b30' }}>
          {error} <button onClick={() => setError('')} style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ff3b30', fontWeight: 600 }}>\u2715</button>
        </div>
      )}

      {/* Search + Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}
      >
        <input
          placeholder="Search systems..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.12)',
            fontSize: '13px', color: '#1d1d1f', background: '#fff', outline: 'none', width: '240px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ALL_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setRiskFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '980px', fontSize: '12px', fontWeight: 500,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: riskFilter === f ? '#1d1d1f' : '#fff',
                color: riskFilter === f ? '#fff' : '#3a3a3c',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {f === 'All' ? 'All' : riskLabel[f]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <Table>
          <TableHeader>
            <TableRow style={{ background: '#fafafa' }}>
              {['System', 'Vendor', 'Purpose', 'Risk Tier', 'Action'].map(h => (
                <TableHead key={h} style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {systems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#86868b', fontSize: '13px' }}>
                  No systems found. Add your first AI system above.
                </TableCell>
              </TableRow>
            ) : (
              systems.map((system) => {
                const tier = system.risk_tier || 'unclassified'
                const style = statusColors[tier] || statusColors['unclassified']
                return (
                  <TableRow
                    key={system.id}
                    style={{ cursor: 'pointer', borderBottom: '0.5px solid rgba(0,0,0,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <TableCell style={{ padding: '14px 20px', fontWeight: 500, fontSize: '13px', color: '#1d1d1f' }}>{system.name}</TableCell>
                    <TableCell style={{ padding: '14px 20px', fontSize: '12px', color: '#86868b' }}>{system.vendor || '\u2014'}</TableCell>
                    <TableCell style={{ padding: '14px 20px', fontSize: '12px', color: '#3a3a3c' }}>{system.purpose}</TableCell>
                    <TableCell style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: style.background, color: style.color }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot }}></div>
                        {riskLabel[tier]}
                      </div>
                    </TableCell>
                    <TableCell style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <a
                          href={`/classify?id=${system.id}&name=${encodeURIComponent(system.name)}`}
                          style={{ background: '#f5f5f7', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: '#0071e3', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}
                        >
                          {tier === 'unclassified' ? 'Classify' : 'Reclassify'}
                        </a>
                        {tier === 'high_risk' && (
                          <a
                            href={`/annex-iv?systemId=${system.id}&systemName=${encodeURIComponent(system.name)}&sector=${encodeURIComponent(system.sector || '')}`}
                            style={{ background: '#f0f7ff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: '#0071e3', cursor: 'pointer', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}
                          >
                            Annex IV
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(system.id)}
                          style={{ background: '#fff0f0', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: '#ff3b30', cursor: 'pointer', fontWeight: 500 }}
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  )
} 
