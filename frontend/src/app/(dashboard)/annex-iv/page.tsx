'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Label } from '@/components/ui/label'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const questions = [
  { id: 'system_name', label: 'System Name', placeholder: 'e.g. Credit Scoring Model' },
  { id: 'vendor', label: 'Vendor / Developer', placeholder: 'e.g. Internal / OpenAI' },
  { id: 'purpose', label: 'Primary Purpose', placeholder: 'e.g. Evaluate creditworthiness for loan applications' },
  { id: 'data_sources', label: 'Training Data Sources', placeholder: 'e.g. Historical loan data, credit bureau data' },
  { id: 'architecture', label: 'System Architecture', placeholder: 'e.g. XGBoost model, REST API, PostgreSQL' },
  { id: 'accuracy', label: 'Accuracy / Performance Metrics', placeholder: 'e.g. 94% accuracy, AUC 0.91' },
  { id: 'bias_testing', label: 'Bias Testing Done', placeholder: 'e.g. Tested for gender and age bias' },
  { id: 'human_override', label: 'Human Override Mechanism', placeholder: 'e.g. Loan officers can override any decision' },
  { id: 'monitoring', label: 'Monitoring Approach', placeholder: 'e.g. Monthly performance reviews' },
  { id: 'deployment_date', label: 'Deployment Date', placeholder: 'e.g. January 2024' },
]

interface Document {
  general_description: string
  system_elements: string
  development_process: string
  monitoring_control: string
  technical_specifications: string
  standards_applied: string
}

const sections = [
  { key: 'general_description', title: '1. General Description', icon: '📋' },
  { key: 'system_elements', title: '2. System Elements', icon: '⚙️' },
  { key: 'development_process', title: '3. Development Process', icon: '🔬' },
  { key: 'monitoring_control', title: '4. Monitoring & Control', icon: '👁️' },
  { key: 'technical_specifications', title: '5. Technical Specifications', icon: '📐' },
  { key: 'standards_applied', title: '6. Standards Applied', icon: '📜' },
]

export default function AnnexIVPage() {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [document, setDocument] = useState<Document | null>(null)
  const [error, setError] = useState('')
  const documentRef = useRef<HTMLDivElement>(null)

  async function handleGenerate() {
    if (!answers.system_name) { setError('System name is required'); return }
    setStep('loading')
    setError('')
    try {
      const res = await fetch('/api/annex-iv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemName: answers.system_name, classification: 'High Risk', answers }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDocument(data)
      setStep('result')
    } catch {
      setError('Failed to generate document. Please try again.')
      setStep('form')
    }
  }

  async function handleExportPDF() {
    if (!documentRef.current) return
    const canvas = await html2canvas(documentRef.current)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const width = pdf.internal.pageSize.getWidth()
    const height = (canvas.height * width) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, width, height)
    pdf.save(`AIGuard-AnnexIV-${answers.system_name || 'document'}.pdf`)
  }

  if (step === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '24px' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #f5f5f7', borderTopColor: '#0071e3' }}
        />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '17px', fontWeight: 600, color: '#1d1d1f', marginBottom: '6px' }}>Generating Annex IV Document</div>
          <div style={{ fontSize: '13px', color: '#86868b' }}>Claude is drafting your compliance documentation...</div>
        </div>
      </div>
    )
  }

  if (step === 'result' && document) {
    return (
      <div style={{ padding: '28px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#86868b', marginBottom: '4px' }}>Annex IV Technical Documentation</div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.4px' }}>{answers.system_name}</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleExportPDF}
                style={{ padding: '8px 18px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: '#0071e3', color: '#fff' }}
              >
                Download PDF
              </button>
              <button
                onClick={() => { setStep('form'); setDocument(null) }}
                style={{ padding: '8px 18px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', color: '#1d1d1f' }}
              >
                Generate New
              </button>
            </div>
          </div>

          {/* Document */}
          <div ref={documentRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sections.map((section, i) => (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '18px' }}>{section.icon}</span>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f' }}>{section.title}</h3>
                </div>
                <p style={{ fontSize: '13px', color: '#3a3a3c', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {document[section.key as keyof Document]}
                </p>
              </motion.div>
            ))}

            <div style={{ background: '#fff8ec', borderRadius: '12px', padding: '14px 18px', border: '0.5px solid #ffe0b2' }}>
              <p style={{ fontSize: '12px', color: '#b7600a', fontWeight: 500 }}>
                ⚠️ This document is AI-generated compliance guidance. Have your legal team review before submission.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px', maxWidth: '680px' }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.4px', marginBottom: '4px' }}>
          Generate Annex IV Document
        </h2>
        <p style={{ fontSize: '13px', color: '#86868b', marginBottom: '28px' }}>
          Fill in the details below. Claude will generate your complete Annex IV technical documentation.
        </p>

        {error && (
          <div style={{ background: '#fff0f0', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#ff3b30' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {questions.map((q) => (
            <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#3a3a3c' }}>{q.label}</label>
              <input
                placeholder={q.placeholder}
                value={answers[q.id] || ''}
                onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                style={{
                  padding: '9px 12px', borderRadius: '10px',
                  border: '0.5px solid rgba(0,0,0,0.12)',
                  fontSize: '13px', color: '#1d1d1f',
                  background: '#fff', outline: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          style={{ width: '100%', padding: '13px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#0071e3', color: '#fff' }}
        >
          Generate Annex IV Document
        </button>
      </motion.div>
    </div>
  )
}