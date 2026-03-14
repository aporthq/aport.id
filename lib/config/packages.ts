/**
 * APort packages registry — npm + PyPI
 *
 * Complete list sourced from:
 *   https://www.npmjs.com/settings/aporthq/packages (9 npm packages)
 *   https://pypi.org/search/?q=aporthq (5 pypi packages)
 *
 * Used by the footer to render an interactive, indexable list
 * of all published guardrails, SDKs, and middleware.
 */

export interface APortPackage {
  /** Display name */
  name: string;
  /** npm or pypi package name */
  packageName: string;
  /** npm or pypi URL */
  href: string;
  /** npm | pypi */
  registry: "npm" | "pypi";
  /** Category for grouping */
  category: "skills" | "guardrail" | "sdk" | "middleware";
  /** Short description */
  description: string;
  /** Install command */
  install: string;
  /** Starter code snippet */
  snippet: string;
}

export const PACKAGES: APortPackage[] = [
  // ── Skills — agent workflow skills ────────────────────────────────────────
  {
    name: "APort Skills",
    packageName: "aport-skills",
    href: "https://github.com/aporthq/aport-skills",
    registry: "npm",
    category: "skills",
    description: "Workflow skills for AI agents — register, verify tasks, standup, handoff, status",
    install: "git clone https://github.com/aporthq/aport-skills.git ~/.claude/skills/aport-skills",
    snippet: `# 5 skills for agents with APort passports:
/aport-id        Register + get a passport
/aport-complete  Verify before marking done
/aport-standup   Standup from signed decisions
/aport-handoff   Verified work package
/aport-status    Like git status for your agent`,
  },

  // ── Guardrails — OpenClaw first ─────────────────────────────────────────
  {
    name: "OpenClaw",
    packageName: "@aporthq/openclaw-aport",
    href: "https://www.npmjs.com/package/@aporthq/openclaw-aport",
    registry: "npm",
    category: "guardrail",
    description: "Deterministic pre-action authorization plugin for OpenClaw agents",
    install: "npx @aporthq/aport-agent-guardrails openclaw",
    snippet: `# In your OpenClaw config.yaml:
plugins:
  entries:
    openclaw-aport:
      enabled: true
      config:
        mode: local
        passportFile: ~/.openclaw/aport/passport.json`,
  },
  {
    name: "Claude Code",
    packageName: "@aporthq/aport-agent-guardrails-claude-code",
    href: "https://www.npmjs.com/package/@aporthq/aport-agent-guardrails-claude-code",
    registry: "npm",
    category: "guardrail",
    description: "PreToolUse hook — enforces policy before every Claude Code tool call",
    install: "npx @aporthq/aport-agent-guardrails claude-code",
    snippet: `// One-command install:
// npx @aporthq/aport-agent-guardrails claude-code
//
// Auto-registers in ~/.claude/settings.json
// Every tool call is verified against your policy`,
  },
  {
    name: "Cursor",
    packageName: "@aporthq/aport-agent-guardrails-cursor",
    href: "https://www.npmjs.com/package/@aporthq/aport-agent-guardrails-cursor",
    registry: "npm",
    category: "guardrail",
    description: "Cursor IDE hook — policy enforcement for Cursor agent actions",
    install: "npx @aporthq/aport-agent-guardrails cursor",
    snippet: `// One-command install:
// npx @aporthq/aport-agent-guardrails cursor
//
// Auto-registers in ~/.cursor/hooks.json
// Every tool call is verified against your policy`,
  },
  {
    name: "LangChain (Node)",
    packageName: "@aporthq/aport-agent-guardrails-langchain",
    href: "https://www.npmjs.com/package/@aporthq/aport-agent-guardrails-langchain",
    registry: "npm",
    category: "guardrail",
    description: "LangChain/LangGraph callback handler for Node.js",
    install: "npm install @aporthq/aport-agent-guardrails-langchain",
    snippet: `import { APortGuardrailCallback } from '@aporthq/aport-agent-guardrails-langchain';

const agent = initializeAgent(tools, llm, {
  callbacks: [new APortGuardrailCallback()]
});`,
  },
  {
    name: "LangChain (Python)",
    packageName: "aport-agent-guardrails-langchain",
    href: "https://pypi.org/project/aport-agent-guardrails-langchain/",
    registry: "pypi",
    category: "guardrail",
    description: "LangChain/LangGraph async callback handler for Python",
    install: "pip install aport-agent-guardrails-langchain",
    snippet: `from aport_guardrails_langchain import APortCallback

agent = initialize_agent(tools=tools, llm=llm,
    callbacks=[APortCallback()])
result = await agent.ainvoke({"input": "..."})`,
  },
  {
    name: "CrewAI (Node)",
    packageName: "@aporthq/aport-agent-guardrails-crewai",
    href: "https://www.npmjs.com/package/@aporthq/aport-agent-guardrails-crewai",
    registry: "npm",
    category: "guardrail",
    description: "CrewAI before-tool-call hook and task decorator for Node.js",
    install: "npm install @aporthq/aport-agent-guardrails-crewai",
    snippet: `import { beforeToolCall } from '@aporthq/aport-agent-guardrails-crewai';

// Returns false to block, null to allow
const result = beforeToolCall({ tool_name, tool_input });`,
  },
  {
    name: "CrewAI (Python)",
    packageName: "aport-agent-guardrails-crewai",
    href: "https://pypi.org/project/aport-agent-guardrails-crewai/",
    registry: "pypi",
    category: "guardrail",
    description: "CrewAI before_tool_call hook for multi-agent crews",
    install: "pip install aport-agent-guardrails-crewai",
    snippet: `from aport_guardrails_crewai import register_aport_guardrail

register_aport_guardrail()
crew = Crew(agents=[agent1, agent2], tasks=[task1])
result = crew.kickoff()`,
  },
  {
    name: "n8n",
    packageName: "@aporthq/aport-agent-guardrails-n8n",
    href: "https://www.npmjs.com/package/@aporthq/aport-agent-guardrails-n8n",
    registry: "npm",
    category: "guardrail",
    description: "n8n custom node — policy gate for n8n workflows",
    install: "npm install @aporthq/aport-agent-guardrails-n8n",
    snippet: `// Install as an n8n community node
// Add the APort Policy Gate node to any workflow
// Routes on allow/deny decision from your policy`,
  },
  {
    name: "MCP Policy Gate",
    packageName: "@aporthq/mcp-policy-gate-example",
    href: "https://www.npmjs.com/package/@aporthq/mcp-policy-gate-example",
    registry: "npm",
    category: "guardrail",
    description: "Example MCP server with APort policy enforcement",
    install: "npm install @aporthq/mcp-policy-gate-example",
    snippet: `// MCP server that gates tool access via APort policy
// Add to your MCP config to enforce policy on
// any tool call made through the MCP protocol`,
  },

  // ── SDKs ────────────────────────────────────────────────────────────────
  {
    name: "CLI",
    packageName: "@aporthq/aport-agent-guardrails",
    href: "https://www.npmjs.com/package/@aporthq/aport-agent-guardrails",
    registry: "npm",
    category: "sdk",
    description: "One-command setup — pick your framework, get guardrails instantly",
    install: "npx @aporthq/aport-agent-guardrails",
    snippet: `# Interactive setup — picks your framework
npx @aporthq/aport-agent-guardrails

# Or specify directly
npx @aporthq/aport-agent-guardrails cursor
npx @aporthq/aport-agent-guardrails openclaw`,
  },
  {
    name: "Core (Node)",
    packageName: "@aporthq/aport-agent-guardrails-core",
    href: "https://www.npmjs.com/package/@aporthq/aport-agent-guardrails-core",
    registry: "npm",
    category: "sdk",
    description: "Shared evaluator, passport, config, and audit logging for Node.js",
    install: "npm install @aporthq/aport-agent-guardrails-core",
    snippet: `import { Evaluator } from '@aporthq/aport-agent-guardrails-core';

const evaluator = new Evaluator(configPath, framework);
const decision = await evaluator.verify(passport, policy, context);
if (decision.allow) { /* proceed */ }`,
  },
  {
    name: "Core (Python)",
    packageName: "aport-agent-guardrails",
    href: "https://pypi.org/project/aport-agent-guardrails/",
    registry: "pypi",
    category: "sdk",
    description: "Shared evaluator, passport, config, and audit logging for Python",
    install: "pip install aport-agent-guardrails",
    snippet: `from aport_guardrails.core import Evaluator

evaluator = Evaluator(mode='local',
    passport_path='~/.aport/passport.json')
decision = evaluator.evaluate('system.command.execute',
    {'command': 'ls'})`,
  },
  {
    name: "SDK (Node)",
    packageName: "@aporthq/sdk-node",
    href: "https://www.npmjs.com/package/@aporthq/sdk-node",
    registry: "npm",
    category: "sdk",
    description: "Node.js SDK — agent auth, policy verification, decision tokens",
    install: "npm install @aporthq/sdk-node",
    snippet: `import { APortClient } from '@aporthq/sdk-node';

const client = new APortClient({ baseUrl: 'https://api.aport.io' });
const decision = await client.verifyPolicy(agentId,
  'finance.payment.refund.v1',
  { amount: 1000, currency: 'USD' });`,
  },
  {
    name: "SDK (Python)",
    packageName: "aporthq-sdk-python",
    href: "https://pypi.org/project/aporthq-sdk-python/",
    registry: "pypi",
    category: "sdk",
    description: "Python SDK — agent auth, policy verification, decision tokens",
    install: "pip install aporthq-sdk-python",
    snippet: `from aporthq_sdk_python import APortClient, APortClientOptions

client = APortClient(APortClientOptions(
    base_url="https://api.aport.io",
    api_key="your-api-key"))
decision = await client.verify_policy(agent_id,
    "finance.payment.refund.v1",
    {"amount": 1000, "currency": "USD"})`,
  },

  // ── Middleware ───────────────────────────────────────────────────────────
  {
    name: "Express",
    packageName: "@aporthq/middleware-express",
    href: "https://www.npmjs.com/package/@aporthq/middleware-express",
    registry: "npm",
    category: "middleware",
    description: "Express.js middleware — route-level policy enforcement",
    install: "npm install @aporthq/middleware-express",
    snippet: `const { requirePolicy } = require('@aporthq/middleware-express');

app.post('/api/refunds',
  requirePolicy('finance.payment.refund.v1', AGENT_ID),
  (req, res) => res.json({ success: true })
);`,
  },
  {
    name: "FastAPI",
    packageName: "aporthq-middleware-fastapi",
    href: "https://pypi.org/project/aporthq-middleware-fastapi/",
    registry: "pypi",
    category: "middleware",
    description: "FastAPI middleware — route-level policy enforcement",
    install: "pip install aporthq-middleware-fastapi",
    snippet: `from aporthq_middleware_fastapi import require_policy

app.middleware("http")(
    require_policy("finance.payment.refund.v1", AGENT_ID))

@app.post("/api/refunds")
async def process_refund(request):
    return {"success": True}`,
  },
];

export const CATEGORIES = [
  { key: "skills" as const, label: "Skills" },
  { key: "guardrail" as const, label: "Guardrails" },
  { key: "sdk" as const, label: "SDKs" },
  { key: "middleware" as const, label: "Middleware" },
];
