import { getProfile } from './profile'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

function getApiKey(): string {
  const key = localStorage.getItem('job_tracker_settings')
  if (!key) return ''
  try {
    const parsed = JSON.parse(key)
    return parsed?.state?.apiKey ?? ''
  } catch {
    return ''
  }
}

async function callClaude(systemPrompt: string, userPrompt: string, maxTokens = 1000): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('No API key configured. Add your Anthropic API key in Settings.')

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `API error ${res.status}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

export async function scoreFit(
  title: string,
  company: string,
  url: string,
  profileOverride: string | null
): Promise<{ fitScore: 'strong' | 'good' | 'neutral' | 'weak'; fitReasoning: string }> {
  const profile = getProfile(profileOverride)
  const system = `You are evaluating job fit for a senior product manager. Score the job as: strong, good, neutral, or weak. Return JSON only — no markdown, no preamble: { "fitScore": string, "fitReasoning": string }. fitReasoning should be 1-2 sentences.

Candidate profile:
${profile}`

  const user = `Job Title: ${title}, Company: ${company}, URL: ${url}`
  const text = await callClaude(system, user, 500)

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Invalid AI response')
  return JSON.parse(match[0])
}

export async function parseProfileFromPDF(
  text: string,
  source: 'linkedin' | 'resume'
): Promise<string> {
  const sourceLabel = source === 'linkedin' ? 'LinkedIn profile export' : 'resume'
  const system = `You are a career advisor extracting candidate information from a ${sourceLabel} PDF. Parse the text and return a structured markdown candidate profile. Include these sections where data is available:
- Name and contact info
- Current role and company
- Target roles and industries
- Years of experience
- Key technical and soft skills
- Notable achievements and metrics
- Education

Return only clean markdown — no preamble, no explanation, no code fences.`

  const user = `Here is the extracted text from the ${sourceLabel}:\n\n${text.slice(0, 8000)}`
  return callClaude(system, user, 1500)
}

export async function generateOutreach(
  title: string,
  company: string,
  url: string,
  profileOverride: string | null
): Promise<string> {
  const profile = getProfile(profileOverride)
  const system = `You are a recruiter outreach specialist. Generate 2-3 LinkedIn DM variants for a senior product manager. Each variant must be under 150 words, lead with the company's pain point, include 1-2 specific proof points from the candidate background, end with a soft CTA. Tone options: Casual, Direct, Analytical. Never sound desperate. No subject line — these are LinkedIn DMs.

Candidate background:
${profile}

Output format:
---
Variant 1 — [Tone]
[message]
Word count: X
---
Variant 2 — [Tone]
[message]
Word count: X
---
Recommended: Variant X — [one sentence why]`

  const user = `Job Title: ${title}, Company: ${company}, Job URL: ${url}`
  return callClaude(system, user, 1000)
}
