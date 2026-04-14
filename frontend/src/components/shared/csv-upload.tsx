'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ParsedSystem {
  name: string
  vendor: string
  purpose: string
  status: string
}

interface Props {
  onImport: (systems: ParsedSystem[]) => void
}

export default function CSVUpload({ onImport }: Props) {
  const [open, setOpen] = useState(false)
  const [parsed, setParsed] = useState<ParsedSystem[]>([])
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setFileName(file.name)
    setError('')

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

      const nameIdx = headers.indexOf('name')
      const vendorIdx = headers.indexOf('vendor')
      const purposeIdx = headers.indexOf('purpose')

      if (nameIdx === -1) {
        setError('CSV must have a "name" column')
        return
      }

      const systems = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim())
        return {
          name: cols[nameIdx] || '',
          vendor: cols[vendorIdx] || '',
          purpose: cols[purposeIdx] || '',
          status: 'Unclassified'
        }
      }).filter(s => s.name)

      setParsed(systems)
    }
    reader.readAsText(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  })

  function handleImport() {
    onImport(parsed)
    setParsed([])
    setFileName('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Import CSV</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import AI Systems via CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-gray-500">
            CSV must have columns: <strong>name, vendor, purpose</strong>
          </p>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-black bg-gray-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-sm">Drop the CSV file here...</p>
            ) : (
              <p className="text-sm text-gray-500">
                Drag and drop a CSV file here, or click to select
              </p>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {parsed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600">
                ✓ {parsed.length} systems found in {fileName}
              </p>
              <div className="max-h-32 overflow-y-auto border rounded p-2">
                {parsed.map((s, i) => (
                  <p key={s.name} className="text-xs text-gray-600">{s.name}</p>
                ))}
              </div>
              <Button className="w-full" onClick={handleImport}>
                Import {parsed.length} Systems
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}