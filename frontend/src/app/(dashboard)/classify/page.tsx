'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const questions = [
  { id: 1, text: 'What is the primary purpose of this AI system?', options: ['Credit scoring / loan decisions', 'HR / recruitment / performance', 'Medical diagnosis / treatment', 'Biometric identification', 'Other'] },
  { id: 2, text: 'Does this system make decisions that directly affect people?', options: ['Yes — final decision', 'Yes — recommendation only', 'No — internal use only'] },
  { id: 3, text: 'Is this system deployed in the EU market?', options: ['Yes', 'No', 'Not sure'] },
  { id: 4, text: 'Can a human override this system\'s decisions?', options: ['Yes always', 'Sometimes', 'No'] },
  { id: 5, text: 'How many people does this system affect per month?', options: ['Under 100', '100–1,000', '1,000–10,000', 'Over 10,000'] },
]

export default function ClassifyPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()

  function handleAnswer(answer: string) {
    setAnswers({ ...answers, [questions[step].id]: answer })
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      classifySystem({ ...answers, [questions[step].id]: answer })
    }
  }

  function classifySystem(allAnswers: Record<number, string>) {
    const purpose = allAnswers[1]
    if (
      purpose === 'Credit scoring / loan decisions' ||
      purpose === 'HR / recruitment / performance' ||
      purpose === 'Medical diagnosis / treatment' ||
      purpose === 'Biometric identification'
    ) {
      setResult('High Risk')
    } else {
      setResult('Limited Risk')
    }
  }

  const progress = Math.round((step / questions.length) * 100)

  if (result) {
    return (
      <div className="p-6 max-w-2xl">
        <h2 className="text-2xl font-semibold mb-6">Classification Result</h2>
        <div className={`border rounded-lg p-6 mb-6 ${result === 'High Risk' ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}>
          <p className="text-sm text-gray-500 mb-1">Risk Tier</p>
          <p className={`text-3xl font-bold ${result === 'High Risk' ? 'text-red-600' : 'text-yellow-600'}`}>{result}</p>
          {result === 'High Risk' && (
            <p className="mt-3 text-sm text-gray-600">
              This system falls under <strong>Annex III</strong> of the EU AI Act and requires full compliance documentation including Annex IV technical documentation, conformity assessment, and EU database registration.
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
      <h2 className="text-2xl font-semibold mb-2">Risk Classification</h2>
      <p className="text-gray-500 mb-6">Answer the questions below to classify your AI system under the EU AI Act.</p>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-black h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm text-gray-400 mb-2">Question {step + 1} of {questions.length}</p>
      <p className="text-lg font-medium mb-6">{questions[step].text}</p>

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