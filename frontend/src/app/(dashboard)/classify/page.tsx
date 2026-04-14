'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const questions = [
  { id: 'purpose', text: 'What is the primary purpose of this AI system?', options: ['Credit scoring / loan decisions', 'HR / recruitment / performance', 'Medical diagnosis / treatment', 'Biometric identification', 'Fraud detection', 'Customer service chatbot', 'Other'] },
  { id: 'decisions', text: 'Does this system make decisions that directly affect people?', options: ['Yes — final decision', 'Yes — recommendation only', 'No — internal use only'] },
  { id: 'eu_deployed', text: 'Is this system deployed in the EU market?', options: ['Yes', 'No', 'Not sure'] },
  { id: 'human_override', text: 'Can a human override this system\'s decisions?', options: ['Yes always', 'Sometimes', 'No'] },
  { id: 'scale', text: 'How many people does this system affect per month?', options: ['Under 100', '100–1,000', '1,000–10,000', 'Over 10,000'] },
]

interface ClassificationResult {
  risk_tier: string
  annex_iii_article: string | null
  reasoning: string
  confidence: number
  human_review_required: boolean
}

function ClassifyContent() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ClassificationResult | null>(null)
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
      } catch (e) {
        setError('Classification failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const progress = Math.round((step / questions.length) * 100)

  if (loading) {
    return (
      <div className="p-6 max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Classifying...</h2>
        <p className="text-gray-500">Claude is analysing your AI system under EU AI Act 2024/1689...</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-6">
          <div className="bg-black h-2 rounded-full w-3/4 animate-pulse" />
        </div>
      </div>
    )
  }

  if (result) {
    const tierColor = {
      'High Risk': 'border-red-300 bg-red-50',
      'Limited Risk': 'border-yellow-300 bg-yellow-50',
      'Minimal Risk': 'border-green-300 bg-green-50',
    }[result.risk_tier] || 'border-gray-300 bg-gray-50'

    const textColor = {
      'High Risk': 'text-red-600',
      'Limited Risk': 'text-yellow-600',
      'Minimal Risk': 'text-green-600',
    }[result.risk_tier] || 'text-gray-600'

    return (
      <div className="p-6 max-w-2xl">
        <h2 className="text-2xl font-semibold mb-6">Classification Result — {systemName}</h2>
        <div className={`border rounded-lg p-6 mb-4 ${tierColor}`}>
          <p className="text-sm text-gray-500 mb-1">Risk Tier</p>
          <p className={`text-3xl font-bold ${textColor}`}>{result.risk_tier}</p>
          {result.annex_iii_article && (
            <p className="mt-2 text-sm font-medium text-gray-700">
              📋 {result.annex_iii_article}
            </p>
          )}
          <p className="mt-3 text-sm text-gray-600">{result.reasoning}</p>
        </div>
        <div className="border rounded-lg p-4 mb-6 bg-white">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Confidence</span>
            <span className="font-medium">{Math.round(result.confidence * 100)}%</span>
          </div>
          {result.human_review_required && (
            <p className="mt-2 text-xs text-amber-600 font-medium">
              ⚠️ Human legal review recommended before finalising this classification
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/inventory')}>Back to Inventory</Button>
          <Button variant="outline" onClick={() => { setStep(0); setAnswers({}); setResult(null) }}>
            Reclassify
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-1">Risk Classification</h2>
      <p className="text-gray-500 mb-6">Classifying: <strong>{systemName}</strong></p>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      <p className="text-sm text-gray-400 mb-2">Question {step + 1} of {questions.length}</p>
      <p className="text-lg font-medium mb-6">{questions[step].text}</p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="space-y-3">
        {questions[step].options.map(option => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            className="w-full text-left px-4 py-3 border rounded-lg hover:border-black hover:bg-gray-50 transition-colors text-sm"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ClassifyPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ClassifyContent />
    </Suspense>
  )
}