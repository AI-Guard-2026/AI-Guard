'use client'

import { useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'

const questions = [
  { id: 'purpose', text: 'What is the primary purpose of this AI system?', options: ['Credit scoring / loan decisions', 'HR / recruitment / performance', 'Medical diagnosis / treatment', 'Biometric identification', 'Fraud detection', 'Customer service chatbot', 'Other'] },
  { id: 'decisions', text: 'Does this system make decisions that directly affect people?', options: ['Yes — final decision', 'Yes — recommendation only', 'No — internal use only'] },
  { id: 'eu_deployed', text: 'Is this system deployed in the EU market?', options: ['Yes', 'No', 'Not sure'] },
  { id: 'human_override', text: 'Can a human override this system\'s decisions?', options: ['Yes always', 'Sometimes', 'No'] },
  { id: 'scale', text: 'How many people does this system affect per month?', options: ['Under 100', '100–1,000', '1,000–10,000', 'Over 10,000'] },
]

interface Result {
  risk_tier: string
  annex_iii_article: string | null
  reasoning: string
  confidence: number
  human_review_required: boolean
}

const tierConfig: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  'High Risk':    { bg: '#fff0f0', color: '#c0392b', border: '#ffcdd2', dot: '#ff3b30' },
  'Limited Risk': { bg: '#fff8ec', color: '#b7600a', border: '#ffe0b2', dot: '#ff9500' },
  'Minimal Risk': { bg: '#edfff4', color: '#1a7a3a', border: '#c8f7d8', dot: '#30d158' },
}

function ClassifyContent() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const systemName = searchParams.get('name') || 'Unknown System'

  async function handleAnswer(answer: string) {
    const newAnswers = { ...answers, [questions[step].id]: answer }
    setAnswers(newAnswers)
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemName, answers: newAnswers }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setResult(data)
      } catch {
        setError('Classification failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const progress = ((step) / questions.length) * 100

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '24px' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #f5f5f7', borderTopColor: '#0071e3' }}
        />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '17px', fontWeight: 600, color: '#1d1d1f', marginBottom: '6px' }}>Analysing with Claude AI</div>
          <div style={{ fontSize: '13px', color: '#86868b' }}>Reviewing EU AI Act 2024/1689 Annex III...</div>
        </div>
      </div>
    )
  }

  if (result) {
    const tier = tierConfig[result.risk_tier] || tierConfig['Minimal Risk']
    return (
      <div style={{ padding: '40px 28px', maxWidth: '640px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          <div style={{ fontSize: '13px', color: '#86868b', marginBottom: '8px' }}>Classification Result — {systemName}</div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.5px', marginBottom: '24px' }}>
            Your system has been classified
          </h2>

          {/* Risk Tier Card */}
          <div style={{ background: tier.bg, border: `1px solid ${tier.border}`, borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tier.dot }}></div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk Tier</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: tier.color, letterSpacing: '-0.5px', marginBottom: '12px' }}>
              {result.risk_tier}
            </div>
            {result.annex_iii_article && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.06)', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: tier.color, marginBottom: '12px' }}>
                📋 {result.annex_iii_article}
              </div>
            )}
            <p style={{ fontSize: '13px', color: '#3a3a3c', lineHeight: 1.6 }}>{result.reasoning}</p>
          </div>

          {/* Confidence */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#86868b', fontWeight: 500 }}>Confidence Score</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1d1d1f' }}>{Math.round(result.confidence * 100)}%</span>
            </div>
            <div style={{ height: '6px', background: '#f5f5f7', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ height: '100%', background: '#30d158', borderRadius: '3px' }}
              />
            </div>
            {result.human_review_required && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: '#fff8ec', borderRadius: '8px', fontSize: '12px', color: '#b7600a', fontWeight: 500 }}>
                ⚠️ Human legal review recommended before finalising
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => router.push('/inventory')}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#0071e3', color: '#fff' }}
            >
              Back to Inventory
            </button>
            <button
              onClick={() => { setStep(0); setAnswers({}); setResult(null) }}
              style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', color: '#1d1d1f' }}
            >
              Reclassify
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px 28px', maxWidth: '600px' }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

        <div style={{ fontSize: '13px', color: '#86868b', marginBottom: '6px' }}>Classifying: {systemName}</div>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.5px', marginBottom: '28px' }}>
          Risk Classification
        </h2>

        {/* Progress */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#86868b' }}>Question {step + 1} of {questions.length}</span>
            <span style={{ fontSize: '12px', color: '#86868b' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: '4px', background: '#f5f5f7', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%', background: '#0071e3', borderRadius: '2px' }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <p style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.2px', marginBottom: '20px', lineHeight: 1.4 }}>
              {questions[step].text}
            </p>

            {error && <p style={{ color: '#ff3b30', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {questions[step].options.map(option => (
                <motion.button
                  key={option}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(option)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 18px',
                    borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.1)',
                    background: '#fff', fontSize: '14px', color: '#1d1d1f',
                    cursor: 'pointer', fontWeight: 400,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0071e3'; e.currentTarget.style.color = '#0071e3' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#1d1d1f' }}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default function ClassifyPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px' }}>Loading...</div>}>
      <ClassifyContent />
    </Suspense>
  )
}