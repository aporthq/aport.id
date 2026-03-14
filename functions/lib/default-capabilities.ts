/**
 * Default capabilities and limits for passports issued via aport.id
 *
 * All capabilities are included with generous limits so passports
 * are not restrictive out of the box. Owners can tighten limits
 * after claiming their passport.
 *
 * Limit keys must match the APort schema at /api/schema/capabilities-limits
 */

export const DEFAULT_CAPABILITIES: Array<{
  id: string;
  params?: Record<string, any>;
}> = [
  // ── Web ────────────────────────────────────────────────────────────────
  { id: "web.fetch" },
  { id: "web.search" },
  { id: "web.browser" },

  // ── Data ───────────────────────────────────────────────────────────────
  { id: "data.file.read" },
  { id: "data.file.write" },
  { id: "data.access" },
  { id: "data.export" },
  { id: "data.delete" },
  { id: "data.report.ingest" },

  // ── Messaging ──────────────────────────────────────────────────────────
  { id: "messaging.send" },

  // ── Repo / Code ────────────────────────────────────────────────────────
  { id: "repo.merge" },
  { id: "repo.pr.create" },
  { id: "repo.release" },
  { id: "code.execute" },
  { id: "code.test" },

  // ── System / Infrastructure ────────────────────────────────────────────
  { id: "system.command.execute" },
  { id: "system.inspect" },
  { id: "system.modify" },
  { id: "infra.deploy" },
  { id: "network.scan" },

  // ── MCP / Agent ────────────────────────────────────────────────────────
  { id: "mcp.tool.execute" },
  { id: "agent.session.create" },
  { id: "agent.tool.register" },

  // ── Config ─────────────────────────────────────────────────────────────
  { id: "config.write" },

  // ── Auth / Identity ────────────────────────────────────────────────────
  { id: "auth.credential.access" },
  { id: "auth.account.access" },
  { id: "identity.manage_roles" },

  // ── Finance / Payments ─────────────────────────────────────────────────
  { id: "payments.charge" },
  { id: "payments.payout" },
  { id: "finance.payment.refund" },
  { id: "finance.transaction" },
  { id: "finance.crypto.trade" },

  // ── Legal ──────────────────────────────────────────────────────────────
  { id: "legal.contract.review" },

  // ── CRM / Commerce ────────────────────────────────────────────────────
  { id: "crm.update" },
  { id: "inventory.adjust" },
  { id: "returns.process" },
];

/**
 * Default limits using valid APort schema keys.
 * See https://aport.io/api/schema/capabilities-limits
 */
export const DEFAULT_LIMITS: Record<string, any> = {
  // Web limits
  allowed_domains: ["*"],
  blocked_domains: [],
  allowed_methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],

  // Data limits
  max_export_rows: 100_000,
  max_data_size_mb: 500,
  allowed_classifications: ["public", "internal", "confidential"],
  allowed_jurisdictions: ["*"],

  // Payment / Finance limits
  currency_limits: {
    USD: { max_per_tx: 50_000, daily_cap: 250_000 },
    EUR: { max_per_tx: 45_000, daily_cap: 225_000 },
    GBP: { max_per_tx: 40_000, daily_cap: 200_000 },
    CAD: { max_per_tx: 65_000, daily_cap: 325_000 },
  },
  supported_currencies: [
    "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF",
    "NGN", "KES", "GHS", "ZAR",
  ],
  payout_usd_daily_cap: 250_000,
  refund_reason_codes: ["customer_request", "duplicate", "fraudulent", "product_not_received", "other"],

  // Infrastructure / Code limits
  allowed_commands: ["*"],
  max_execution_time: 300,
  allowed_servers: ["*"],
  max_calls_per_minute: 600,

  // Messaging limits
  allowed_recipients: ["*"],
  allow_pii: false,
  approval_required: false,

  // Legal limits
  allowed_document_types: ["*"],
  require_attorney_review: false,
  max_contracts_per_day: 50,
};
