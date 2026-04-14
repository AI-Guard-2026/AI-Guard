'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'

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

interface AnnexDocument {
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
  const [annexDoc, setAnnexDoc] = useState<AnnexDocument | null>(null)
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
      setAnnexDoc(data)
      setStep('result')
    } catch {
      setError('Failed to generate document. Please try again.')
      setStep('form')
    }
  }

  async function handleExportPDF() {
    if (!annexDoc || !answers.system_name) return

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let y = 20

    const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold', color: [number, number, number], maxWidth?: number) => {
      pdf.setFontSize(fontSize)
      pdf.setFont('helvetica', fontStyle)
      pdf.setTextColor(...color)
      const lines = pdf.splitTextToSize(text, maxWidth || contentWidth)
      lines.forEach((line: string) => {
        if (y > pageHeight - 20) { pdf.addPage(); y = 20 }
        pdf.text(line, margin, y)
        y += fontSize * 0.45
      })
    }

    const addSpacer = (height: number) => { y += height }

    // Header
    pdf.setFillColor(29, 29, 31)
    pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F')
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text('AIGuard — Annex IV Technical Documentation', margin + 6, y + 11)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(180, 180, 180)
    pdf.text(`EU AI Act 2024/1689 | Generated ${new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin + 6, y + 21)
    y += 36

    // System info row
    pdf.setFillColor(245, 245, 247)
    pdf.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F')
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(29, 29, 31)
    pdf.text(`System: ${answers.system_name}`, margin + 6, y + 7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(134, 134, 139)
    pdf.text(`Vendor: ${answers.vendor || 'N/A'}  |  Classification: High Risk  |  Deployed: ${answers.deployment_date || 'N/A'}`, margin + 6, y + 13)
    y += 26

    // Sections
    const sectionData = [
      { title: '1. General Description', content: annexDoc.general_description },
      { title: '2. System Elements', content: annexDoc.system_elements },
      { title: '3. Development Process', content: annexDoc.development_process },
      { title: '4. Monitoring & Control', content: annexDoc.monitoring_control },
      { title: '5. Technical Specifications', content: annexDoc.technical_specifications },
      { title: '6. Standards Applied', content: annexDoc.standards_applied },
    ]

    sectionData.forEach((section) => {
      if (y > pageHeight - 40) { pdf.addPage(); y = 20 }
      pdf.setFillColor(0, 113, 227)
      pdf.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F')
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text(section.title, margin + 5, y + 7)
      y += 14
      addText(section.content, 9, 'normal', [58, 58, 60], contentWidth)
      addSpacer(8)
    })

    if (y > pageHeight - 25) { pdf.addPage(); y = 20 }
    pdf.setFillColor(255, 248, 236)
    pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F')
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(183, 96, 10)
    pdf.text('AI-generated compliance guidance. Legal review recommended before submission.', margin + 4, y + 8)

    pdf.save(`AIGuard-AnnexIV-${answers.system_name.replace(/ /g, '_')}.pdf`)
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
          <div style={{ fontSize: '13px', color: '#86868b' }}>AI Guard is drafting your compliance documentation...</div>
        </div>
      </div>
    )
  }

  if (step === 'result' && annexDoc) {
    return (
      <div style={{ padding: '28px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
                onClick={() => { setStep('form'); setAnnexDoc(null) }}
                style={{ padding: '8px 18px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', color: '#1d1d1f' }}
              >
                Generate New
              </button>
            </div>
          </div>

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
                  {annexDoc[section.key as keyof AnnexDocument]}
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