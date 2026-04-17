'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import jsPDF from 'jspdf'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tablet-royal-timid.ngrok-free.dev/api/v1'

type Question = { id: string; question: string; help?: string; required: boolean }
type Section = { title: string; questions: Question[] }
type QuestionsData = Record<string, Section>

function AnnexIVContent() {
  const searchParams = useSearchParams()
  const systemId = searchParams.get('systemId')
  const systemName = searchParams.get('systemName') || 'AI System'
  const sector = searchParams.get('sector') || ''

  const { orgId } = useUser()
  const { getToken } = useAuth()

  const [questions, setQuestions] = useState<QuestionsData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [document, setDocument] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentSection, setCurrentSection] = useState(0)

  useEffect(() => {
    if (!orgId) return
    async function fetchQuestions() {
      try {
        const token = await getToken()
        const url = `${BASE_URL}/organisations/${orgId}/ai-systems/documents/interview-questions${sector ? `?sector=${sector}` : ''}`
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        })
        const data = await res.json()
        setQuestions(data)
      } catch (e: any) {
        setError('Failed to load questions')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [orgId])

  const sections = questions ? Object.entries(questions) : []
  const totalSections = sections.length
  const progress = totalSections > 0 ? ((currentSection + 1) / totalSections) * 100 : 0

  function handleAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  function canProceed() {
    if (!questions || sections.length === 0) return false
    const [, section] = sections[currentSection]
    return section.questions.every(q => !q.required || (answers[q.id] && answers[q.id].trim()))
  }

  async function handleSubmit() {
    if (!systemId || !orgId) return
    setSubmitting(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await fetch(
        `${BASE_URL}/organisations/${orgId}/ai-systems/${systemId}/documents/generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ interview_answers: answers }),
        }
      )
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      setDocument(data)
    } catch (e: any) {
      setError(e.message || 'Generation failed')
    } finally {
      setSubmitting(false)
    }
  }

  function downloadPDF() {
    if (!document) return
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let y = 20

    pdf.setFillColor(0, 0, 0)
    pdf.rect(0, 0, pageWidth, 40, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Annex IV Technical Documentation', margin, 18)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${systemName} · Generated ${new Date().toLocaleDateString()}`, margin, 30)
    y = 55

    const sectionKeys = Object.keys(document)
    sectionKeys.forEach((key) => {
      const section = document[key]
      if (typeof section !== 'object') return

      if (y > 250) { pdf.addPage(); y = 20 }

      pdf.setFillColor(0, 113, 227)
      pdf.rect(margin, y, contentWidth, 8, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      pdf.text(title, margin + 3, y + 5.5)
      y += 13

      pdf.setTextColor(50, 50, 50)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)

      const content = typeof section === 'string'
        ? section
        : Object.values(section).filter(v => typeof v === 'string').join('\n\n')

      const lines = pdf.splitTextToSize(content, contentWidth)
      lines.forEach((line: string) => {
        if (y > 270) { pdf.addPage(); y = 20 }
        pdf.text(line, margin, y)
        y += 5
      })
      y += 8
    })

    pdf.save(`annex-iv-${systemName.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  if (!systemId) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
      No system selected. Go to <a href="/inventory" style={{ color: '#0071e3' }}>AI Inventory</a> and click Generate Annex IV on a classified system.
    </div>
  )

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>
      Loading questions...
    </div>
  )

  if (error && !document) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#ff3b30' }}>
      {error}
    </div>
  )

  if (document) return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #30d158, #25a244)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10l4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1d1d1f', margin: 0 }}>Document Generated</h1>
            <p style={{ fontSize: '13px', color: '#86868b', margin: 0 }}>Annex IV Technical Documentation for {systemName}</p>
          </div>
        </div>

        {Object.entries(document).map(([key, section]: [string, any]) => (
          <div key={key} style={{
            background: '#fff', borderRadius: '12px', padding: '20px',
            marginBottom: '12px', border: '0.5px solid rgba(0,0,0,0.08)',
          }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0071e3', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {key.replace(/_/g, ' ')}
            </h3>
            <p style={{ fontSize: '14px', color: '#3a3a3c', lineHeight: '1.6', margin: 0 }}>
              {typeof section === 'string' ? section : Object.values(section).filter(v => typeof v === 'string').join('\n\n')}
            </p>
          </div>
        ))}

        <button onClick={downloadPDF} style={{
          marginTop: '16px', padding: '12px 24px', borderRadius: '10px',
          background: '#0071e3', color: '#fff', border: 'none',
          fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: '100%',
        }}>
          Download PDF
        </button>
      </motion.div>
    </div>
  )

  if (sections.length === 0) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#86868b' }}>No questions found.</div>
  )

  const [sectionKey, sectionData] = sections[currentSection]
  const isLast = currentSection === totalSections - 1

  return (
    <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1d1d1f', marginBottom: '4px' }}>
          Annex IV Documentation
        </h1>
        <p style={{ fontSize: '13px', color: '#86868b' }}>{systemName}</p>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: '#86868b' }}>Section {currentSection + 1} of {totalSections}</span>
          <span style={{ fontSize: '12px', color: '#0071e3', fontWeight: 500 }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: '4px', background: '#e5e5ea', borderRadius: '2px' }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            style={{ height: '100%', background: '#0071e3', borderRadius: '2px' }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sectionKey}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{
            background: '#fff', borderRadius: '14px', padding: '24px',
            border: '0.5px solid rgba(0,0,0,0.08)', marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1d1d1f', marginBottom: '20px' }}>
              {sectionData.title}
            </h2>

            {sectionData.questions.map((q, i) => (
              <div key={q.id} style={{ marginBottom: i < sectionData.questions.length - 1 ? '20px' : 0 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#1d1d1f', marginBottom: '4px' }}>
                  {q.question}
                  {q.required && <span style={{ color: '#ff3b30', marginLeft: '3px' }}>*</span>}
                </label>
                {q.help && (
                  <p style={{ fontSize: '12px', color: '#86868b', marginBottom: '6px', marginTop: 0 }}>{q.help}</p>
                )}
                <textarea
                  value={answers[q.id] || ''}
                  onChange={e => handleAnswer(q.id, e.target.value)}
                  placeholder="Enter your answer..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px',
                    fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                    background: '#fafafa', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {currentSection > 0 && (
          <button onClick={() => setCurrentSection(s => s - 1)} style={{
            flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px',
            fontWeight: 500, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,0.15)',
            background: '#fff', color: '#1d1d1f',
          }}>
            Back
          </button>
        )}
        {!isLast ? (
          <button
            onClick={() => setCurrentSection(s => s + 1)}
            disabled={!canProceed()}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px',
              fontWeight: 600, cursor: canProceed() ? 'pointer' : 'not-allowed',
              border: 'none', background: canProceed() ? '#0071e3' : '#e5e5ea',
              color: canProceed() ? '#fff' : '#86868b',
            }}
          >
            Next Section
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !canProceed()}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px',
              fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
              border: 'none', background: '#0071e3', color: '#fff',
            }}
          >
            {submitting ? 'Generating...' : 'Generate Annex IV Document'}
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: '#ff3b30', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>{error}</p>
      )}
    </div>
  )
}

export default function AnnexIVPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', color: '#86868b' }}>Loading...</div>}>
      <AnnexIVContent />
    </Suspense>
  )
}