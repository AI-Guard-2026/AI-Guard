import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { systemName, answers } = await req.json()

  const prompt = `You are an EU AI Act compliance expert.

Analyse this AI system under Annex III of EU AI Act 2024/1689:

System Name: ${systemName}

Questionnaire Answers:
${Object.entries(answers).map(([q, a]) => `- ${q}: ${a}`).join('\n')}

Return ONLY a JSON object with these exact fields:
{
  "risk_tier": "High Risk" or "Limited Risk" or "Minimal Risk",
  "annex_iii_article": "exact article reference if High Risk, else null",
  "reasoning": "2-3 sentences explaining the classification in plain English",
  "confidence": 0.0 to 1.0,
  "human_review_required": true or false
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to parse classification' }, { status: 500 })
  }
}