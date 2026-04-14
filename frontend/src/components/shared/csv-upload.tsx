'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

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

      if (nameIdx === -1) { setError('CSV must have a "name" column'); return }

      const systems = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim())
        return { name: cols[nameIdx] || '', vendor: cols[vendorIdx] || '', purpose: cols[purposeIdx] || '', status: 'Unclassified' }
      }).filter(s => s.name)

      setParsed(systems)
    }
    reader.readAsText(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/csv': ['.csv'] }, maxFiles: 1
  })

  function handleImport() {
    onImport(parsed)
    setParsed([])
    setFileName('')
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ padding: '8px 18px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', color: '#1d1d1f' }}
      >
        Import CSV
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '28px',
            width: '480px', boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.3px' }}>Import AI Systems</h2>
                <p style={{ fontSize: '12px', color: '#86868b', marginTop: '3px' }}>CSV must have columns: name, vendor, purpose</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#f5f5f7', cursor: 'pointer', fontSize: '14px', color: '#86868b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Drop Zone */}
            <div
              {...getRootProps()}
              style={{
                border: `1.5px dashed ${isDragActive ? '#0071e3' : 'rgba(0,0,0,0.15)'}`,
                borderRadius: '14px',
                padding: '32px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? '#f0f6ff' : '#fafafa',
                transition: 'all 0.15s',
                marginBottom: '16px',
              }}
            >
              <input {...getInputProps()} />
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>📂</div>
              {isDragActive ? (
                <p style={{ fontSize: '14px', color: '#0071e3', fontWeight: 500 }}>Drop your CSV file here</p>
              ) : (
                <>
                  <p style={{ fontSize: '14px', color: '#1d1d1f', fontWeight: 500, marginBottom: '4px' }}>Drag and drop your CSV file</p>
                  <p style={{ fontSize: '12px', color: '#86868b' }}>or click to browse files</p>
                </>
              )}
            </div>

            {error && (
              <div style={{ background: '#fff0f0', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#ff3b30' }}>
                {error}
              </div>
            )}

            {parsed.length > 0 && (
              <div>
                <div style={{ background: '#edfff4', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>✓</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a7a3a' }}>{parsed.length} systems found in {fileName}</div>
                    <div style={{ fontSize: '11px', color: '#86868b', marginTop: '2px' }}>{parsed.map(s => s.name).join(', ')}</div>
                  </div>
                </div>
                <button
                  onClick={handleImport}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#0071e3', color: '#fff' }}
                >
                  Import {parsed.length} Systems
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}