'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const statusColors: Record<string, string> = {
  'Unclassified': 'bg-gray-100 text-gray-700',
  'High Risk': 'bg-red-100 text-red-700',
  'Limited Risk': 'bg-yellow-100 text-yellow-700',
  'Minimal Risk': 'bg-green-100 text-green-700',
  'Compliant': 'bg-green-200 text-green-800',
}

const initialSystems = [
  { id: '1', name: 'Credit Scoring Model', vendor: 'Internal', purpose: 'Loan decisioning', status: 'High Risk' },
  { id: '2', name: 'Fraud Detection', vendor: 'Stripe', purpose: 'Transaction monitoring', status: 'Unclassified' },
  { id: '3', name: 'Email Spam Filter', vendor: 'Google', purpose: 'Email filtering', status: 'Minimal Risk' },
]

export default function InventoryPage() {
  const [systems, setSystems] = useState(initialSystems)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', vendor: '', purpose: '' })

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
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <h1 className="text-xl font-bold">AIGuard</h1>
      </header>
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">AI System Inventory</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>+ Add System</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add AI System</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>System Name</Label>
                  <Input
                    placeholder="e.g. Credit Scoring Model"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Vendor</Label>
                  <Input
                    placeholder="e.g. Internal / OpenAI"
                    value={form.vendor}
                    onChange={e => setForm({...form, vendor: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Purpose</Label>
                  <Input
                    placeholder="e.g. Loan decisioning"
                    value={form.purpose}
                    onChange={e => setForm({...form, purpose: e.target.value})}
                  />
                </div>
                <Button className="w-full" onClick={handleAdd}>Add System</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>System Name</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {systems.map((system) => (
              <TableRow key={system.id}>
                <TableCell className="font-medium">{system.name}</TableCell>
                <TableCell>{system.vendor}</TableCell>
                <TableCell>{system.purpose}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[system.status]}`}>
                    {system.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  )
}