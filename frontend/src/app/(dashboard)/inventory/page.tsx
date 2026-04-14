'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import CSVUpload from '@/components/shared/csv-upload'

const statusColors: Record<string, { background: string; color: string; dot: string }> = {
  'Unclassified': { background: '#f5f5f7', color: '#6e6e73', dot: '#aeaeb2' },
  'High Risk':    { background: '#fff0f0', color: '#c0392b', dot: '#ff3b30' },
  'Limited Risk': { background: '#fff8ec', color: '#b7600a', dot: '#ff9500' },
  'Minimal Risk': { background: '#edfff4', color: '#1a7a3a', dot: '#30d158' },
  'Compliant':    { background: '#e8f4ff', color: '#0055b3', dot: '#0071e3' },
}

const ALL_STATUSES = ['All', 'Unclassified', 'High Risk', 'Limited Risk', 'Minimal Risk', 'Compliant']

const initialSystems = [
  { id: '1', name: 'Credit Scoring Model', vendor: 'Internal', purpose: 'Loan decisioning', status: 'High Risk' },
  { id: '2', name: 'Fraud Detection', vendor: 'Stripe', purpose: 'Transaction monitoring', status: 'Unclassified' },
  { id: '3', name: 'Email Spam Filter', vendor: 'Google', purpose: 'Email filtering', status: 'Minimal Risk' },
]

export default function InventoryPage() {
  const [systems, setSystems] = useState(initialSystems)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', vendor: '', purpose: '' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = systems.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.vendor.toLowerCase().includes(search.toLowerCase()) ||
      s.purpose.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  function handleAdd() {
    if (!form.name) return
    setSystems([...systems, {
      id: String(Date.now()),
      name: form.name,
      vendor: form.vendor,
      purpose: form.purpose,
      status: 'Unclassified'
    }])
    setForm({ name: '', vendor: '', purpose: '' })
    setOpen(false)
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <CSVUpload onImport={(newSystems) => setSystems([...systems, ...newSystems])} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button style={{ padding: '8px 18px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: '#0071e3', color: '#fff' }}>
                + Add System
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add AI System</DialogTitle>
              </DialogHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                <div><Label>System Name</Label><Input placeholder="e.g. Credit Scoring Model" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><Label>Vendor</Label><Input placeholder="e.g. Internal / OpenAI" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} /></div>
                <div><Label>Purpose</Label><Input placeholder="e.g. Loan decisioning" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} /></div>
                <Button style={{ width: '100%' }} onClick={handleAdd}>Add System</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

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
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px', borderRadius: '980px', fontSize: '12px', fontWeight: 500,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: statusFilter === s ? '#1d1d1f' : '#fff',
                color: statusFilter === s ? '#fff' : '#3a3a3c',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {s}
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
              <TableHead style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>System</TableHead>
              <TableHead style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Vendor</TableHead>
              <TableHead style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Purpose</TableHead>
              <TableHead style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Risk Status</TableHead>
              <TableHead style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
  {filtered.length === 0 ? (
    <TableRow>
      <TableCell colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#86868b', fontSize: '13px' }}>
        No systems found
      </TableCell>
    </TableRow>
  ) : (
    filtered.map((system) => {
      const style = statusColors[system.status] || statusColors['Unclassified']
      return (
        <TableRow
          key={system.id}
          style={{ cursor: 'pointer', borderBottom: '0.5px solid rgba(0,0,0,0.04)' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <TableCell style={{ padding: '14px 20px', fontWeight: 500, fontSize: '13px', color: '#1d1d1f' }}>{system.name}</TableCell>
          <TableCell style={{ padding: '14px 20px', fontSize: '12px', color: '#86868b' }}>{system.vendor}</TableCell>
          <TableCell style={{ padding: '14px 20px', fontSize: '12px', color: '#3a3a3c' }}>{system.purpose}</TableCell>
          <TableCell style={{ padding: '14px 20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: style.background, color: style.color }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot }}></div>
              {system.status}
            </div>
          </TableCell>
          <TableCell style={{ padding: '14px 20px' }}>
            <a href={`/classify?id=${system.id}&name=${system.name}`} style={{ background: '#f5f5f7', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: '#0071e3', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>
              {system.status === 'Unclassified' ? 'Classify →' : 'View →'}
            </a>
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