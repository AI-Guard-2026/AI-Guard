'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const questions = [
  { id: 'system_name', label: 'System Name', placeholder: 'e.g. Credit Scoring Model' },
  { id: 'vendor', label: 'Vendor / Developer', placeholder: 'e.g. Internal / OpenAI' },
  { id: 'purpose', label: 'Primary Purpose', placeholder: 'e.g. Evaluate creditworthiness for loan applications' },
  { id: 'data_sources', label: 'Training Data Sources', placeholder: 'e.g. Historical loan data, credit bureau data' },
  { id: 'architecture', label: 'System Architecture', placeholder: 'e.g. XGBoost model, REST API, PostgreSQL' },
  { id: 'accuracy', label: 'Accuracy / Performance Metrics', placeholder: 'e.g. 94% accuracy, AUC 0.91' },
  { id: 'bias_testing', label: 'Bias Testing Done', placeholder: 'e.g. Tested for gender and age bias using fairness metrics' },
  { id: 'human_override', label: 'Human Override Mechanism', placeholder: 'e.g. Loan officers can override any decision' },
  { id: 'monitoring', label: 'Monitoring Approach', placeholder: 'e.g. Monthly performance reviews, drift detection' },
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

export default function AnnexIVPage() {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [document, setDocument] = useState<Document | null>(null)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!answers.system_name) {
      setError('System name is required')
      return
    }
    setStep('loading')
    setError('')

    try {
      const res = await fetch('/api/annex-iv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemName: answers.system_name,
          classification: 'High Risk',
          answers,
        }),
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

  if (step === 'loading') {
    return (
      <div className="p-6 max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Generating Annex IV Document...</h2>
        <p className="text-gray-500 mb-6">Claude is generating your compliance documentation. This takes 20–40 seconds.</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-black h-2 rounded-full w-2/3 animate-pulse" />
        </div>
      </div>
    )
  }

  if (step === 'result' && document) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Annex IV — {answers.system_name}</h2>
          <Button variant="outline" onClick={() => { setStep('form'); setDocument(null) }}>
            Generate New
          </Button>
        </div>

        <div className="space-y-6">
          {[
            { title: '1. General Description', content: document.general_description },
            { title: '2. System Elements', content: document.system_elements },
            { title: '3. Development Process', content: document.development_process },
            { title: '4. Monitoring & Control', content: document.monitoring_control },
            { title: '5. Technical Specifications', content: document.technical_specifications },
            { title: '6. Standards Applied', content: document.standards_applied },
          ].map((section) => (
            <div key={section.title} className="border rounded-lg p-5">
              <h3 className="font-semibold text-gray-800 mb-3">{section.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            ⚠️ This document is AI-generated compliance guidance. Have your legal team review before submission.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-2">Generate Annex IV Document</h2>
      <p className="text-gray-500 mb-6">Fill in the details below. Claude will generate your complete Annex IV technical documentation.</p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id}>
            <Label>{q.label}</Label>
            <Input
              placeholder={q.placeholder}
              value={answers[q.id] || ''}
              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <Button className="mt-6 w-full" onClick={handleGenerate}>
        Generate Annex IV Document
      </Button>
    </div>
  )
}