'use client'

import { useState, useRef, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { generateDocument, exportPDF } from '@/lib/api'

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

const sections = [
  { key: 'general_description', title: '1. General Description', icon: '📋' },
  { key: 'system_elements', title: '2. System Elements', icon: '⚙️' },
  { key: 'development_process', title: '3. Development Process', icon: '🔬' },
  { key: 'monitoring_control', title: '4. Monitoring & Control', icon: '👁️' },
  { key: 'technical_specifications', title: '5. Technical Specifications', icon: '📐' },
  { key: 'standards_applied', title: '6. Standards Applied', icon: '📜' },
]

function AnnexIVContent() {
  const { getToken } = useAuth()
  const { orgId } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()

  const systemId = searchParams.get('id') || ''
  const systemNameFromUrl = searchParams.get('name') || ''

  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form')
  const [answers, setAnswers] = useState<Record<string, string>>({
    system_name: systemNameFromUrl,
  })
  const [annexDoc, setAnnexDoc] = useState<any>(null)
  const [documentId, setDocumentId] = useState<string>('')
  const [error, setError] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  async function handleGenerate() {
    if (!answers.system_name) { setError('System name is required'); return }
    if (!systemId) { setError('No system selected. Go to Inventory and click Classify first.'); return }
    setStep('loading')
    setError('')
    try {
      const token = await getToken()
      if (!token || !orgId) throw new Error('Not authenticated')
      const data = await generateDocument(token, orgId, systemId, answers)
      setAnnexDoc(data.content || data)
      setDocumentId(data.id || '')
      setStep('result')
    } catch (err: any) {
      setError(err.message || 'Failed to generate document. Please try again.')
      setStep('form')
    }
  }

  async function handleExportPDF() {
    if (!documentId || !orgId || !systemId) return
    setPdfLoading(true)
    try {
      const token = await getToken()
      if (!token) return
      const blob = await exportPDF(token, orgId, systemId, documentId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AIGuard-AnnexIV-${answers.system_name.replace(/ /g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'PDF export failed')
    } finally {
      setPdfLoading(false)
    }
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
          <div style={{ fontSize: '13px', color: '#86868b' }}>AIGuard is drafting your compliance documentation...</div>
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
                disabled={pdfLoading}
                style={{ padding: '8px 18px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: pdfLoading ? 'wait' : 'pointer', border: 'none', background: '#0071e3', color: '#fff', opacity: pdfLoading ? 0.7 : 1 }}
              >
                {pdfLoading ? 'Exporting...' : 'Download PDF'}
              </button>
              <button
                onClick={() => router.push('/inventory')}
                style={{ padding: '8px 18px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', color: '#1d1d1f' }}
              >
                Back to Inventory
              </button>
              <button
                onClick={() => { setStep('form'); setAnnexDoc(null); setDocumentId('') }}
                style={{ padding: '8px 18px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', color: '#1d1d1f' }}
              >
                Generate New
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fff0f0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#ff3b30' }}>{error}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sections.map((section, i) => {
              const content = typeof annexDoc === 'object' ? annexDoc[section.key] : null
              if (!content) return null
              return (
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
                  <p style={{ fontSize: '13px', color: '#3a3a3c', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{content}</p>
                </motion.div>
              )
            })}

            <div style={{ background: '#fff8ec', borderRadius: '12px', padding: '14px 18px', border: '0.5px solid #ffe0b2' }}>
              <p style={{ fontSize: '12px', color: '#b7600a', fontWeight: 500 }}>
                ⚠️ AI-generated compliance guidance. Have your legal team review before submission.
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
          {systemId
            ? `Generating for: ${systemNameFromUrl || 'Selected system'}`
            : 'Go to Inventory → Classify a system first → then come back here.'}
        </p>

        {error && (
          <div style={{ background: '#fff0f0', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#ff3b30' }}>{error}</div>
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
          disabled={!systemId}
          style={{
            width: '100%', padding: '13px', borderRadius: '12px', fontSize: '14px',
            fontWeight: 600, cursor: systemId ? 'pointer' : 'not-allowed',
            border: 'none', background: systemId ? '#0071e3' : '#aeaeb2', color: '#fff',
          }}
        >
          {systemId ? 'Generate Annex IV Document' : 'Select a system from Inventory first'}
        </button>
      </motion.div>
    </div>
  )
}

export default function AnnexIVPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px' }}>Loading...</div>}>
      <AnnexIVContent />
    </Suspense>
  )
}