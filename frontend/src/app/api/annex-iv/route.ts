import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const maxDuration = 60

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { systemName, classification, answers } = await req.json()

  const prompt = `You are an EU AI Act compliance expert. Generate Annex IV technical documentation.

System Name: ${systemName}
Risk Classification: ${classification}

Details:
${Object.entries(answers).map(([q, a]) => `- ${q}: ${a}`).join('\n')}

Return ONLY a JSON object, no markdown, no explanation:
{
  "general_description": "2 paragraphs max",
  "system_elements": "2 paragraphs max",
  "development_process": "2 paragraphs max",
  "monitoring_control": "1 paragraph max",
  "technical_specifications": "1 paragraph max",
  "standards_applied": "1 paragraph max"
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 })
  }
}