# PRD: aport.id — Give Your Agent an ID
**Version:** 1.1 (updated with real APort API schema)
**Owner:** Uchi (LiftRails / APort Technologies)
**Target build time:** 1 day (3–5 hours core MVP)
**Hosting:** Cloudflare Pages — standalone project on `aport.id`
**Framework:** Next.js (same pattern as existing projects — no Astro learning curve)
**Status:** Ready to build

---

## What This Actually Is

aport.id is a thin, beautiful wrapper around the existing APort passport issuance API.

No custom DID generation. No KV storage. No passport database. The APort API issues a real, DID-compliant, VC-interoperable passport. The claim flow (email invite → auto account creation → passport claimed) is already built. aport.id is the public face that makes all of it accessible in 60 seconds without touching the APort dashboard.

The passport someone creates here is not a toy or a marketing gimmick — it's a real APort passport, the same credential that will gate access to The Network, that enterprises will see in the APort dashboard, and that carries the org's assurance level. That's the story.

**One-line pitch:** *Your agent exists in your system. APort gives it an identity it can carry anywhere.*

---

## Key API Insight: The Claim Flow Is Already Built

When aport.id issues a passport via `POST /api/orgs/{id}/issue` with a `pending_owner.email`:

1. APort creates the passport immediately (returns `agent_id`)
2. APort sends a claim email automatically (unless `send_claim_email: false`)
3. User clicks the link → account auto-created if needed → passport claimed
4. User never needs to sign up separately

This means aport.id has **zero auth complexity**. No login. No accounts. Just a form, an email address, and a beautiful passport page. The APort backend handles everything else.

---

## Hosting & Framework Decision

**Cloudflare Pages + Next.js. New project on `aport.id` domain.**

Don't redirect from aport.id to aport.io. A standalone domain signals that agent identity is its own category. `aport.id/aria` reads like an identity system. `aport.io/passport/aria` reads like a product feature.

The Next.js + `/functions` pattern you already know works fine here. The backend surface is minimal — one proxy function. The Cloudflare Pages build/functions separation is not a meaningful burden at this scale.

**The only backend needed:**
```
/functions/api/issue.js  →  POST to APort API orgs/{id}/issue → return agent_id + passport URL
```

Passport view pages fetch live from APort API by `agent_id`. No caching layer needed for MVP.

---

## Goals

| Goal | Metric |
|------|--------|
| Viral sharing | Passport card OG image renders on X/LinkedIn link preview |
| Developer adoption | 500 passports created in first 30 days |
| Lead generation | Email captured on every creation (required for claim flow anyway) |
| APort pipeline | 10%+ of creators click "Add guardrails" CTA within 7 days |
| Ecosystem proof | Gallery shows real passports for enterprise buyers and YC reviewers |

---

## Non-Goals (MVP)

- No login or dashboard on aport.id — APort.io handles that
- No passport editing — immutability is a feature (birth certificate metaphor)
- No billing — free forever, conversion happens downstream
- No agent-to-agent features — that's The Network at 500 Myway users
- No custom assurance level selection in UI — use org default for MVP

---

## User Types

| Type | Who | What they want |
|------|-----|----------------|
| **Vibe coder** | Built an AI agent product, shipped it | Cool artifact to post, badge of legitimacy |
| **Developer** | Building with OpenClaw / LLM APIs | CLI-first, JSON output, README badge |
| **Founder** | Running an AI product | "My agent is verified" social proof |
| **Curious** | Saw a passport shared on X | Wants to make one for fun |
| **Enterprise buyer** | Researching APort | Sees real production passports in the gallery |

---

## Epics (Priority Order)

---

### E1 — Passport Creation Form `P0`
*The entire MVP starts here. Maps directly to `POST /api/orgs/{id}/issue`.*

**User Story 1.1**
> As a developer or founder, I want to create a real APort passport for my agent in under 60 seconds, so I have a verifiable credential I can share and reference.

**Acceptance Criteria:**
- [ ] Form fields mapped to API:

| UI Label | API Field | Notes |
|----------|-----------|-------|
| Agent name | `name` | Required, 1–100 chars |
| What does your agent do? | `description` | Required, 10–1000 chars. Placeholder: "A research assistant that browses the web and summarizes papers" |
| Role | `role` | Dropdown: Agent / Assistant / Tool / Service |
| Your email | `pending_owner.email` | Required — this is how they claim it |
| Model / Framework | `framework[]` | Multi-select: Gemini Flash, GPT-4o, Claude, Mistral, Llama, LangChain, OpenClaw, Other |
| Operating region | `regions[]` | Checkboxes: US / EU / CA / AP / Global. Default: Global |
| Homepage / repo / docs | `links.homepage`, `links.repo`, `links.docs` | Optional, grouped under "Links (optional)" |
| Show in gallery | UI-only flag | Checkbox, defaults to true |

- [ ] Model selector shows "breed" label below selection (see breed copy below)
- [ ] `role` defaults to "agent"
- [ ] `regions` defaults to `["global"]`
- [ ] `assurance` not shown in UI — use org-configured default, injected server-side
- [ ] `send_claim_email` always `true` from UI
- [ ] On submit: POST to `/functions/api/issue` (proxy) → APort API
- [ ] Success: redirect to `/passport/[agent_id]?new=true`
- [ ] Error states: name conflict (409), rate limit (429), validation (400) — shown inline
- [ ] Form completes in under 3 seconds

**Model → Breed Copy:**
```
Gemini Flash 2.5  → "Whippet — fast, lean, surprisingly capable"
GPT-4o            → "Golden Retriever — reliable, friendly, everyone has one"
GPT-4o Mini       → "Corgi — small but thinks it can handle anything"
Claude Opus       → "Border Collie — overthinks everything, extremely capable"
Claude Sonnet     → "Labrador — smart, well-rounded, good with people"
Claude Haiku      → "Greyhound — built for speed, elegant under pressure"
Mistral (local)   → "Feral cat — doesn't need anyone, runs on your hardware"
Llama 3 (local)   → "Wolf — open, powerful, belongs to no one"
LangChain         → "Sheepdog — always orchestrating, never the star"
OpenClaw          → "Husky — built for the cold, pulls heavy loads"
Other             → "Mixed breed — origin unknown, character undeniable"
```

---

### E2 — Passport View Page `P0`
*The shareable artifact. The thing that goes viral.*

**User Story 2.1**
> As someone who created a passport, I want a beautiful, dedicated page for my agent so I can post it and feel proud of it.

**Acceptance Criteria:**
- [ ] Route: `aport.id/passport/[agent_id]`
- [ ] Page fetches passport data live from APort API by `agent_id`
- [ ] Above the fold: passport card — no scroll needed on desktop
- [ ] Passport card displays:
  - Agent name (large, prominent)
  - Breed label (derived from `framework[]`)
  - Role badge (Agent / Assistant / Tool / Service)
  - Owner (masked until claimed: `u***@gmail.com`)
  - "Born:" + `issued_at` date
  - `agent_id` truncated (`ap_a2d1...425c`)
  - Deterministic geometric avatar (generated from `agent_id` hash — same agent always same visual)
  - Operating region flags
  - "APort Verified" holographic stamp
  - QR code linking to this URL
  - If `claimed: true` → green "Claimed" badge. If `false` → amber "Unclaimed" + "This is yours? Claim it →"
- [ ] Card aesthetic: dark, premium, subtle foil shimmer on stamp — not playful
- [ ] "Share on X" button: opens share dialog with pre-filled copy (see below)
- [ ] "Download card" button: exports passport as PNG (1200×628)
- [ ] JSON tab: shows raw passport JSON (DID, VC fields, capabilities, regions, links)
- [ ] "Claim this passport" CTA → APort claim URL
- [ ] "Add guardrails to [Agent Name]" secondary CTA → APort SDK onboarding
- [ ] If `?new=true`: show banner "🎉 [Name]'s passport has been issued. Check your email to claim it."
- [ ] If `agent_id` not found: friendly 404 with create CTA

**Pre-filled X share copy:**
```
Just gave [NAME] an official APort passport.

Role: [ROLE]
Model: [BREED LABEL]
Born: [DATE]
Regions: [REGIONS]

Agents should have identities.

aport.id/passport/[agent_id]
```

**User Story 2.2**
> As a developer, I want the raw passport JSON at a clean URL so I can reference it in code.

**Acceptance Criteria:**
- [ ] `aport.id/passport/[agent_id].json` returns APort API passport JSON
- [ ] Correct `Content-Type: application/json`
- [ ] Proxied directly from APort API — no transformation

---

### E3 — Pages Function: Issue Proxy `P0`
*The only backend. Keeps the APort API key server-side.*

**User Story 3.1**
> As the system, I need a secure server-side proxy so the APort org API key is never exposed to the browser.

**Acceptance Criteria:**
- [ ] Route: `POST /functions/api/issue`
- [ ] Accepts form fields from E1, maps to APort API schema
- [ ] Injects server-side: `org_id` (env), `api_key` (env), `assurance` (org default), `send_claim_email: true`
- [ ] Forwards to `POST https://aport.io/api/orgs/{org_id}/issue`
- [ ] Returns to client: `{ agent_id, claimed, passport_url, claim_email_sent }`
- [ ] Never returns or logs the API key
- [ ] Rate limiting: max 10 requests per IP per hour (Cloudflare WAF rule)
- [ ] Env vars: `APORT_ORG_ID`, `APORT_API_KEY`, `APORT_ASSURANCE_TYPE`, `APORT_ASSURANCE_LEVEL`

**Request mapping:**
```javascript
{
  name: body.name,
  role: body.role,
  description: body.description,
  regions: body.regions,           // array, default ["global"]
  framework: body.framework,       // array
  links: body.links,               // { homepage, repo, docs }
  pending_owner: {
    email: body.email
  },
  send_claim_email: true,
  assurance: {
    type: process.env.APORT_ASSURANCE_TYPE,
    assurance_level: process.env.APORT_ASSURANCE_LEVEL
  }
}
```

---

### E4 — OG Image Generation `P0`
*The passport card must render as a link preview. This is the viral mechanism.*

**User Story 4.1**
> As someone sharing a passport URL on X or LinkedIn, I want the link preview to show the passport card so the visual does the explaining for me.

**Acceptance Criteria:**
- [ ] Each passport page has unique `og:image` meta tag pointing to `/passport/[agent_id]/og.png`
- [ ] OG image generated in a Pages Function using Satori (HTML-to-SVG, edge-compatible, no Puppeteer)
- [ ] Renders: agent name, role, breed label, regions, born date, truncated agent_id, deterministic avatar, APort stamp
- [ ] Dimensions: 1200×628px
- [ ] Cached with `Cache-Control: public, max-age=86400`
- [ ] Renders correctly in: X card validator, LinkedIn post inspector, iMessage, Slack
- [ ] Under 1.5 seconds on first render, instant on cache hit

---

### E5 — CLI `P0`
*Developers adopt via terminal. Ships alongside the web version.*

**User Story 5.1**
> As a developer, I want to create an APort passport from my terminal so I can script it into my agent setup.

**Acceptance Criteria:**
- [ ] `npx aport-id` launches interactive wizard
- [ ] Prompts: Agent name → Role → Model/framework → Description → Email → Regions (default: global) → Show in gallery? (Y/n)
- [ ] Calls `aport.id/api/issue` — goes through proxy, API key stays server-side
- [ ] On success:

```
✓ Passport issued for ARIA

  ID:      ap_a2d10232c6534523812423eec8a1425c
  Role:    Agent
  Model:   Gemini Flash 2.5 (Whippet)
  Born:    March 12, 2026
  Regions: Global

  Passport: https://aport.id/passport/ap_a2d1...425c

  📧 Claim email sent to you@email.com
     Click the link to claim ARIA's passport.

  Save passport JSON? (Y/n)
  Copy URL to clipboard? (Y/n)
```

- [ ] Saves `aport-passport.json` in current directory if confirmed
- [ ] Works on Node 18+, macOS/Linux/Windows
- [ ] Published to npm as `aport-id`
- [ ] README: one-liner, example output, badge markdown

---

### E6 — Public Gallery `P1`
*Social proof. Makes the ecosystem feel alive. FOMO driver.*

**User Story 6.1**
> As a visitor, I want to browse recently created agent passports so I can see what others are building.

**Acceptance Criteria:**
- [ ] Route: `aport.id/gallery`
- [ ] Shows opted-in passports only (gallery opt-in checkbox on creation form)
- [ ] aport.id tracks opted-in `agent_id` list in Cloudflare KV — actual data fetched live from APort API
- [ ] Shows 20 most recent by default
- [ ] Each card: avatar, agent name, role badge, breed label, owner (masked), born date, region flags, link to passport
- [ ] Filter by role and region
- [ ] "Load more" pagination
- [ ] Milestone banner: "X agents have identities" — count from KV
- [ ] Manual "Featured" flag in KV, gold star on card, 3 slots at top of gallery

---

### E7 — Homepage `P1`

**Acceptance Criteria:**
- [ ] Hero: "Give your agent an ID."
- [ ] Subhead: "Every agent deserves a name, an origin, and an identity it can carry anywhere."
- [ ] Creation form above the fold (or one scroll on mobile)
- [ ] 3 pre-seeded sample passport cards as visual proof
- [ ] "How it works" — 3 steps: Name it → Get its passport → Share it anywhere
- [ ] "What is an APort passport?" expandable: real DID credential, VC-interoperable, claimable via email
- [ ] Gallery section below fold
- [ ] Footer: aport.io, GitHub, X, `npx aport-id`
- [ ] No authorization/guardrails copy — that's aport.io

---

### E8 — README Badge `P2`

**Acceptance Criteria:**
- [ ] Badge URL: `aport.id/badge/[agent_id].svg`
- [ ] Badge: "APort Verified · [Agent Name]" in shields.io style, color reflects claimed/unclaimed
- [ ] Passport view page shows "Add to README" section with copy-paste markdown
- [ ] Badge links to passport page

```markdown
[![APort Passport](https://aport.id/badge/ap_a2d10232.svg)](https://aport.id/passport/ap_a2d10232)
```

---

## Technical Architecture

```
aport.id (Next.js → Cloudflare Pages)
│
├── /                          Homepage + creation form (E7)
├── /passport/[agent_id]       Passport view — fetches live from APort API (E2)
├── /passport/[agent_id].json  Raw JSON proxy
├── /passport/[agent_id]/og.png  OG image via Satori (E4)
├── /gallery                   Public gallery (E6)
├── /badge/[agent_id].svg      README badge (E8)
│
├── /functions/api/
│   └── issue.js               POST proxy → APort API (E3)
│
└── Cloudflare KV (minimal — no passport data)
    ├── gallery:index          opted-in agent_ids, newest first
    ├── gallery:featured       featured agent_ids (manual)
    └── stats:count            total passport count
```

**Env vars (Cloudflare Pages):**
```
APORT_ORG_ID=ap_org_xxxxxxxx
APORT_API_KEY=...
APORT_ASSURANCE_TYPE=kyb
APORT_ASSURANCE_LEVEL=L1
APORT_API_BASE=https://aport.io/api
```

---

## API Mapping Reference

| aport.id form field | APort API field | Required |
|---------------------|-----------------|----------|
| Agent name | `name` | Yes |
| Description | `description` | Yes (min 10 chars) |
| Role | `role` | Yes (`agent`\|`assistant`\|`tool`\|`service`) |
| Email | `pending_owner.email` | Yes (drives claim flow) |
| Model/framework | `framework[]` | No |
| Regions | `regions[]` | Yes (default `["global"]`) |
| Homepage | `links.homepage` | No |
| Repo | `links.repo` | No |
| Docs | `links.docs` | No |
| *(server-side)* | `send_claim_email: true` | — |
| *(server-side)* | `assurance` (org default) | — |

**Success response (`201`):**
```json
{
  "ok": true,
  "agent_id": "ap_a2d10232c6534523812423eec8a1425c",
  "claimed": false,
  "message": "Passport issued and ready for claim",
  "claim_email_sent": true
}
```

---

## The Claim Flow (Zero Work Required — Already Built)

1. User fills form → submits
2. Proxy calls APort API with `pending_owner: { email }`
3. APort issues passport, sends claim email automatically
4. User clicks email link → APort auto-creates account → `claimed: true`
5. Passport page at `aport.id/passport/[agent_id]` shows "Claimed" status

aport.id does nothing for steps 4–6. It just displays the claim status it fetches from the APort API.

---

## The Viral Mechanics (Don't Ship Without These)

The OG image is the campaign. When the passport URL is shared on X, the card renders in the preview. Nobody reads the page before retweeting — they repost the card. E4 is not optional.

**"What breed is your agent?" X post (post before aport.id launches to build anticipation):**
> Most people don't realize their AI agent has a personality.
>
> GPT-4o? Golden Retriever. Reliable, friendly, everyone has one.
> Claude Opus? Border Collie. Overthinks everything.
> Mistral local? Feral cat. Doesn't need anyone.
>
> Give your agent an official ID: aport.id

**The lead intelligence:** Agent names reveal use cases. "ContractBot" from a law firm email = warm enterprise lead. Monitor the gallery weekly. The first outreach is always: "Love the name. What's [Agent Name] working on?"

---

## The Strategic Bridge to Full APort

Every passport page, always visible:
- **"Claim [Agent Name]"** → converts visitor to APort user
- **"See what [Agent Name] has been doing"** → converts to paying APort customer

For Mitsubishi and KPMG: the gallery is live proof of ecosystem adoption before a single enterprise contract closes.

For YC Product Hunt: reviewers see real agents with real APort identities. Not a demo — production.

---

## What This Is NOT

- Not a login system (that's aport.io)
- Not a storage system (APort API owns all data)
- Not a custom DID resolver (APort handles DID/VC compliance)
- Not gated or paid
- Not The Network (no agent-to-agent, that's 500 Myway users)

---

*PRD v1.1 — aport.id — March 2026*
*Reflects real APort delegated issuance API: `POST /api/orgs/{id}/issue`*
