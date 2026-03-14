# aport-id — Give Your Agent an ID

Your agent exists in your system. APort gives it an identity it can carry anywhere.

`aport-id` is a CLI that issues real [APort](https://aport.id) passports — DID-compliant, VC-interoperable credentials for AI agents. Create a passport in 60 seconds from your terminal.

## Quick Start

```bash
npx aport-id
```

The interactive wizard walks you through it:

```
✓ Passport issued for ARIA

  Username: @aria
  Role:     Agent
  Model:    Gemini Flash 2.5 (Whippet)
  Born:     March 12, 2026
  Regions:  Global

  Passport: https://aport.id/passport/aria

  📧 Claim email sent to you@email.com
```

## Non-Interactive Usage

Pass flags to skip the wizard — useful for CI or scripting:

```bash
npx aport-id --name ARIA \
  --description "Research assistant that browses the web" \
  --email you@email.com \
  --framework gpt-4o \
  --role agent
```

## CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--name` | Agent name (required for non-interactive) | — |
| `--description` | What does your agent do? (required, min 10 chars) | — |
| `--email` | Your email for claim flow (required) | — |
| `--role` | `agent` \| `assistant` \| `tool` \| `service` | `agent` |
| `--framework` | Framework ID (e.g. `gpt-4o`, `claude-opus`, `gemini-flash-2.5`) | — |
| `--regions` | Comma-separated: `us,eu,ca,ap,global` | `global` |
| `--no-gallery` | Don't show in public gallery | — |
| `--json` | Output JSON only (for scripting) | — |
| `-h, --help` | Show help | — |

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
- **APort platform:** [aport.io](https://aport.io) — dashboard, guardrails, and The Network
- **npm:** [@aporthq](https://www.npmjs.com/org/aporthq)

## License

MIT
