import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const mockSystems = [
  { id: '1', name: 'Credit Scoring Model', vendor: 'Internal', purpose: 'Loan decisioning', status: 'High Risk' },
  { id: '2', name: 'Fraud Detection', vendor: 'Stripe', purpose: 'Transaction monitoring', status: 'Unclassified' },
  { id: '3', name: 'Email Spam Filter', vendor: 'Google', purpose: 'Email filtering', status: 'Minimal Risk' },
]

const statusColors: Record<string, string> = {
  'Unclassified': 'bg-gray-100 text-gray-700',
  'High Risk': 'bg-red-100 text-red-700',
  'Limited Risk': 'bg-yellow-100 text-yellow-700',
  'Minimal Risk': 'bg-green-100 text-green-700',
  'Compliant': 'bg-green-200 text-green-800',
}

export default function InventoryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <h1 className="text-xl font-bold">AIGuard</h1>
      </header>
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">AI System Inventory</h2>
          <button className="bg-black text-white px-4 py-2 rounded-md text-sm">
            + Add System
          </button>
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
            {mockSystems.map((system) => (
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