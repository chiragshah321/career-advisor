export const DEFAULT_PROFILE = `# Candidate Profile

**Name:** [Your Name]
**Role:** Senior Product Manager
**Experience:** 8 years in insurtech and proptech

## Background
- Senior PM at Rhino, AcroSure, Realtor.com
- Launched renters insurance product → $2M monthly written premium, 30–35% conversion rate
- MBA

## Core Strengths
- Stakeholder synthesis and cross-functional systems thinking
- Translating regulatory complexity into product
- Embedded insurance and marketplace products
- Data-driven roadmap prioritization

## Target Roles
- Senior PM in insurtech, proptech, healthtech, SaaS, fintech, or ops-heavy domains
- Based in Austin TX, open to remote/hybrid

## Proof Points
- Led 0→1 renters insurance launch generating $2M MWP
- 30–35% conversion on insurance product
- Cross-functional leadership across engineering, design, compliance, and sales
`

export function getProfile(override: string | null): string {
  return override ?? DEFAULT_PROFILE
}
