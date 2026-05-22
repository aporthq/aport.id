# aport-id — Give Your Agent an ID

Your agent exists in your system. APort gives it an identity it can carry anywhere and a control plane that governs what it can do.

`aport-id` issues real [APort](https://aport.id) passports — DID-compliant, VC-interoperable credentials for AI agents. For pre-action authorization, guardrails, and audit, use the canonical APort guardrail installer.

## Quick Start

```bash
npx @aporthq/aport-agent-guardrails claude-code
```

The installer can create a hosted passport, create a narrow setup key, and configure the selected framework in one flow.

Use another supported framework by changing the argument:

```bash
npx @aporthq/aport-agent-guardrails cursor
```

## Non-Interactive Usage

Use environment variables to skip prompts — useful for device management tools and scripts:

```bash
APORT_OWNER_EMAIL="you@email.com" \
APORT_QUICK_HOSTED=1 \
npx --yes @aporthq/aport-agent-guardrails claude-code --non-interactive
```

The main APort domain also exposes a thin curl shim for teams that prefer install URLs:

```bash
curl -fsSL https://aport.io/install.sh | bash -s -- claude-code
```

For passport-only issuance without framework guardrails, use the browser flow at [aport.id/create](https://aport.id/create) or call `POST https://aport.id/api/issue`.

## Passport-Only API Fields

| Field | Description | Default |
|------|-------------|---------|
| `name` | Agent name; optional when `framework` maps to a preset | — |
| `description` | What does your agent do? Optional when `framework` maps to a preset | — |
| `email` | Your email for claim flow | — |
| `role` | Agent role; framework presets provide this when omitted | `agent` |
| `framework` | Framework IDs, e.g. `claude-code`, `cursor`, `openclaw` | — |
| `regions` | Region list, e.g. `US`, `CA`, `EU`, `global` | Preset or `global` |
| `showInGallery` | Show/hide from public gallery | `true` |

## Badge

Add an APort badge to your project README:

```markdown
[![APort Passport](https://aport.id/badge/YOUR_AGENT_ID.svg)](https://aport.id/passport/YOUR_AGENT_ID)
```

Replace `YOUR_AGENT_ID` with your agent's slug (e.g. `aria`).

## JSON Endpoint

Every passport has a machine-readable JSON endpoint:

```
GET https://aport.id/passport/[slug].json
```

Returns the full passport payload — DID subject, verifiable credential fields, capabilities, regions, and links. `Content-Type: application/json`.

## What Is an APort Passport?

An APort passport is a real credential for an AI agent. Each passport includes:

- A **DID-compliant identifier** — a decentralized identity your agent owns
- **Verifiable Credential (VC) interoperability** — compatible with the W3C VC standard
- **Claim flow** — the email you provide receives a link to claim ownership; no separate signup required
- **Immutable issuance** — once issued, a passport is a permanent record (like a birth certificate)

Passports are issued through the [APort](https://aport.io) platform. `aport-id` wraps the APort API so you can issue one without touching the dashboard.

## Links

- **Web app:** [aport.id](https://aport.id) — create a passport in the browser
- **Gallery:** [aport.id/gallery](https://aport.id/gallery) — browse public agent passports
- **APort platform:** [aport.io](https://aport.io) — AI agent passport control plane, guardrails, and audit
- **npm:** [@aporthq](https://www.npmjs.com/org/aporthq)

## License

MIT
