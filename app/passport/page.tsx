"use client";

/**
 * Passport view page — PRD E2
 *
 * The shareable artifact. The thing that goes viral.
 * Dark, premium, above-the-fold on desktop.
 */

import { useSearchParams, usePathname } from "next/navigation";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { apiConfig } from "@/lib/config/api";
import { getBreedLabel } from "@/lib/config/breeds";
import { getAvatarDataUri } from "@/lib/avatar";
import QRCode from "qrcode";
import {
  Shield,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  Share2,
  Download,
  ArrowRight,
  Code,
  ClipboardCheck,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useMediaQuery } from "@base-ui/react/unstable-use-media-query";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PassportData {
  agent_id: string;
  name: string;
  description: string;
  role: string;
  status: string;
  claimed: boolean;
  owner_display?: string;
  contact?: string;
  regions: string[];
  framework: string[];
  capabilities: { id: string; params?: Record<string, any> }[];
  limits?: Record<string, any>;
  links: Record<string, string>;
  assurance_level: string;
  verification_status: string;
  created_at: string;
  issued_by?: string;
  slug?: string;
  canonical_hash?: string;
  spec_version?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncateId(id: string): string {
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local[0]}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

function getIdFromPathname(pathname: string | null): string {
  if (!pathname) return "";
  const segments = pathname
    .replace(/^\/passport\/?/, "")
    .split("/")
    .filter(Boolean);
  return segments[0] ?? "";
}

function getPassportUrl(slugOrId: string): string {
  return `https://aport.id/passport/${slugOrId}`;
}

const REGION_FLAGS: Record<string, string> = {
  us: "US",
  eu: "EU",
  ca: "CA",
  ap: "AP",
  global: "Global",
};

// ─── Main view ───────────────────────────────────────────────────────────────

function PassportView() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const idFromPath = getIdFromPathname(pathname);
  const idFromQuery = searchParams.get("id");
  const id = idFromQuery || idFromPath;
  const isNew = searchParams.get("new") === "true";

  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"id" | "url" | "badge" | null>(null);
  const [tab, setTab] = useState<"card" | "json" | "widget" | "vc">("card");
  const [rawJson, setRawJson] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)", { noSsr: true });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(apiConfig.endpoints.passport(id));
        if (!res.ok) {
          setError(res.status === 404 ? "not_found" : "error");
          return;
        }
        const data = (await res.json()) as PassportData;
        setPassport(data);
        setRawJson(JSON.stringify(data, null, 2));
      } catch {
        setError("error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Update document title client-side (OG/Twitter meta injected by Cloudflare middleware for crawlers)
  useEffect(() => {
    if (!passport) return;
    document.title = `${passport.name} — APort Passport`;
  }, [passport]);

  // Generate QR code
  useEffect(() => {
    if (!id) return;
    QRCode.toDataURL(getPassportUrl(id), {
      width: 120,
      margin: 0,
      color: { dark: "#06b6d4", light: "#00000000" },
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [id]);

  const copyToClipboard = useCallback((text: string, type: "id" | "url" | "badge") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const shareOnX = useCallback(() => {
    if (!passport) return;
    const breedLabel = getBreedLabel(passport.framework || []);
    const text = `Just gave ${passport.name} an official APort passport.\n\nRole: ${passport.role}\n${breedLabel ? `Model: ${breedLabel}\n` : ""}Born: ${formatDate(passport.created_at)}\nRegions: ${(passport.regions || []).join(", ")}\n\nAgents should have identities.\n\n${getPassportUrl(passport.slug || passport.agent_id)}`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  }, [passport]);

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return;

    // Clone the card into an offscreen container with an opaque background
    // so html2canvas doesn't capture page layers behind it
    const clone = cardRef.current.cloneNode(true) as HTMLElement;
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:fixed;left:-9999px;top:0;width:600px;background:#0c1017;padding:24px;border-radius:16px;";
    // Override glass transparency on the clone
    clone.style.backgroundColor = "#0c1017";
    clone.style.backdropFilter = "none";
    clone.style.setProperty("-webkit-backdrop-filter", "none");
    clone.style.boxShadow = "none";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(wrapper, {
        backgroundColor: "#06090f",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `${passport?.name || "passport"}-aport-passport.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Could not generate image. Try taking a screenshot instead.");
    } finally {
      document.body.removeChild(wrapper);
    }
  }, [passport?.name]);

  // ── Not found / no ID ──────────────────────────────────────────────────
  if (!id || error === "not_found") {
    return (
      <Shell>
        <div className="text-center py-24">
          <div className="size-16 mx-auto mb-6 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <Shield className="size-7 text-muted-foreground/40" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Passport not found</h1>
          <p className="text-muted-foreground mb-8 max-w-[320px] mx-auto">
            This agent doesn&apos;t have a passport yet. Create one in 60
            seconds.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent text-accent-foreground px-6 py-2.5 text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-accent/15"
          >
            Create a passport
            <ArrowRight className="size-4" />
          </a>
        </div>
      </Shell>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Shell>
        <div className="space-y-4 animate-pulse pt-4">
          <div className="flex gap-4 items-start">
            <div className="size-16 bg-white/[0.06] rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-7 w-40 bg-white/[0.06] rounded-lg" />
              <div className="h-4 w-56 bg-white/[0.04] rounded" />
            </div>
          </div>
          <div className="h-px bg-white/[0.04] my-4" />
          <div className="h-48 bg-white/[0.04] rounded-2xl" />
          <div className="flex gap-2 mt-4">
            <div className="h-10 w-28 bg-white/[0.04] rounded-lg" />
            <div className="h-10 w-24 bg-white/[0.04] rounded-lg" />
          </div>
        </div>
      </Shell>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error || !passport) {
    return (
      <Shell>
        <div className="text-center py-24">
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">
            Could not load this passport. Try again later.
          </p>
          <a href="/" className="text-accent text-sm hover:underline">
            Back to home
          </a>
        </div>
      </Shell>
    );
  }

  // ── Data derivations ───────────────────────────────────────────────────
  const breedLabel = getBreedLabel(passport.framework || []);
  const owner = passport.claimed
    ? passport.owner_display || "Claimed"
    : passport.contact
      ? maskEmail(passport.contact)
      : "Unclaimed";
  const avatarUri = getAvatarDataUri(passport.agent_id, 80);
  const passportSlug = passport.slug || id;
  const passportUrl = getPassportUrl(passportSlug);

  return (
    <Shell>
      {/* New passport banner */}
      {isNew && (
        <div className="mb-6 rounded-xl border border-accent/20 bg-accent/[0.08] px-5 py-3.5 text-sm text-accent animate-fade-in">
          <strong>{passport.name}&apos;s</strong> passport has been issued.
          Check your email to claim it.
        </div>
      )}

      {/* Tab bar */}
      <div className="grid grid-cols-4 gap-1 mb-6 bg-white/[0.04] rounded-lg p-1">
        {(
          [
            { key: "card", label: "Passport" },
            { key: "widget", label: "Widget" },
            { key: "vc", label: isMobile ? "VC" : "Credential" },
            { key: "json", label: "JSON" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-2 sm:px-4 py-2 text-sm font-medium transition-all duration-200 text-center",
              tab === t.key
                ? "bg-white/[0.1] text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "card" && (
        /* ── Passport Card ──────────────────────────────────────────── */
        <div
          ref={cardRef}
          className="relative rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-2xl shadow-[0_8px_64px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in"
        >
          {/* Top glass edge */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              {/* Deterministic avatar */}
              <div className="shrink-0">
                <img
                  src={avatarUri}
                  alt=""
                  width={64}
                  height={64}
                  className="rounded-2xl"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight truncate sm:text-3xl">
                      {passport.name}
                    </h1>
                    {breedLabel && (
                      <p className="text-sm text-accent/80 mt-0.5 font-medium">
                        {breedLabel}
                      </p>
                    )}
                  </div>
                  <StatusBadge
                    status={passport.status}
                    claimed={passport.claimed}
                  />
                </div>
              </div>
            </div>

            {/* Role badge + description */}
            <div className="mt-4 flex items-start gap-2">
              <span className="inline-flex items-center shrink-0 rounded-md bg-white/[0.06] border border-white/[0.06] px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                {passport.role}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {passport.description}
              </p>
            </div>
          </div>

          {/* ── Divider ────────────────────────────────────────────── */}
          <div className="mx-6 sm:mx-8 h-px bg-white/[0.06]" />

          {/* ── Fields grid ────────────────────────────────────────── */}
          <div className="p-6 sm:p-8 grid grid-cols-2 gap-x-6 gap-y-5">
            <DataField label="Owner">{owner}</DataField>
            <DataField label="Born">
              {formatDate(passport.created_at)}
            </DataField>
            <DataField label="Regions">
              <div className="flex flex-wrap gap-1.5">
                {(passport.regions || []).map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center rounded-md bg-white/[0.05] border border-white/[0.05] px-1.5 py-0.5 text-xs font-medium"
                  >
                    {REGION_FLAGS[r] || r.toUpperCase()}
                  </span>
                ))}
              </div>
            </DataField>
            <DataField label="Assurance">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="size-3.5 text-accent" />
                {passport.assurance_level}
              </span>
            </DataField>
            <DataField label="Verification">
              <span
                className={cn(
                  "font-medium",
                  passport.verification_status === "verified"
                    ? "text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {passport.verification_status}
              </span>
            </DataField>
            <DataField label="Agent ID">
              <button
                onClick={() => copyToClipboard(passport.agent_id, "id")}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors group"
              >
                {truncateId(passport.agent_id)}
                {copied === "id" ? (
                  <Check className="size-3 text-accent" />
                ) : (
                  <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            </DataField>

            {/* Capabilities */}
            {passport.capabilities?.length > 0 && (
              <DataField label="Capabilities" className="col-span-2">
                <div className="flex flex-wrap gap-1.5">
                  {passport.capabilities.slice(0, 10).map((cap) => (
                    <span
                      key={cap.id}
                      className="rounded-md bg-white/[0.05] border border-white/[0.05] px-2 py-0.5 text-xs text-muted-foreground font-mono"
                    >
                      {cap.id}
                    </span>
                  ))}
                  {passport.capabilities.length > 10 && (
                    <span className="rounded-md bg-white/[0.05] border border-white/[0.05] px-2 py-0.5 text-xs text-muted-foreground/50">
                      +{passport.capabilities.length - 10} more
                    </span>
                  )}
                </div>
              </DataField>
            )}

            {/* Links */}
            {passport.links && Object.keys(passport.links).length > 0 && (
              <DataField label="Links" className="col-span-2">
                <div className="flex flex-wrap gap-3">
                  {Object.entries(passport.links).map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline capitalize"
                    >
                      {key}
                      <ExternalLink className="size-3" />
                    </a>
                  ))}
                </div>
              </DataField>
            )}
          </div>

          {/* ── Bottom bar: stamp + QR ─────────────────────────────── */}
          <div className="mx-6 sm:mx-8 h-px bg-white/[0.06]" />
          <div className="p-6 sm:p-8 flex items-end justify-between gap-4">
            {/* APort Verified stamp */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/[0.06] px-3 py-1.5">
                <Shield className="size-4 text-accent" />
                <span className="text-xs font-semibold text-accent tracking-wide uppercase">
                  APort Verified
                </span>
              </div>
              {/* Integrity */}
              {(passport.spec_version || passport.canonical_hash) && (
                <p className="font-mono text-[10px] text-muted-foreground/40 break-all leading-relaxed">
                  {passport.spec_version}
                  {passport.spec_version && passport.canonical_hash && " · "}
                  {passport.canonical_hash &&
                    truncateId(passport.canonical_hash)}
                </p>
              )}
            </div>

            {/* QR code */}
            {qrDataUrl && (
              <div className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
                <img
                  src={qrDataUrl}
                  alt="QR code"
                  width={72}
                  height={72}
                  className="block"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Deliverable Contract Card ───────────────────────────── */}
      {tab === "card" && passport.capabilities?.some((c) => c.id === "deliverable.task.complete") && (
        <DeliverableContractCard passport={passport} />
      )}

      {tab === "widget" && (
        /* ── Widget embed ──────────────────────────────────────────── */
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-2xl shadow-[0_8px_64px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
          <div className="w-full" style={{ height: 480 }}>
            <iframe
              src={`${apiConfig.aportDomain}/widget/${passport.agent_id}?theme=dark`}
              width="100%"
              height="100%"
              style={{ border: "none", borderRadius: "16px" }}
              title="APort Passport Widget"
            />
          </div>
        </div>
      )}

      {tab === "vc" && (
        /* ── Verifiable Credential embed ───────────────────────────── */
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-2xl shadow-[0_8px_64px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
          <div className="w-full" style={{ height: 480 }}>
            <iframe
              src={`${apiConfig.aportDomain}/widget/vc/${passport.agent_id}?theme=dark&format=widget`}
              width="100%"
              height="100%"
              style={{ border: "none", borderRadius: "16px" }}
              title="APort Verifiable Credential Widget"
            />
          </div>
        </div>
      )}

      {tab === "json" && (
        /* ── JSON view ──────────────────────────────────────────────── */
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-2xl shadow-[0_8px_64px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
          <div className="flex items-center justify-between px-6 sm:px-8 pt-5 pb-0">
            <span className="text-xs font-mono text-muted-foreground/50">
              passport.json
            </span>
            <button
              onClick={() => copyToClipboard(rawJson, "url")}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied === "url" ? (
                <>
                  <Check className="size-3 text-accent" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="p-6 sm:p-8 pt-4 overflow-x-auto text-xs font-mono text-muted-foreground leading-relaxed max-h-[600px]">
            {rawJson}
          </pre>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap gap-2.5">
        <ActionButton onClick={shareOnX} icon={<Share2 className="size-4" />}>
          Share on X
        </ActionButton>
        <ActionButton
          onClick={() => copyToClipboard(id!, "url")}
          icon={
            copied === "id" ? (
              <Check className="size-4 text-accent" />
            ) : (
              <Copy className="size-4" />
            )
          }
        >
          {copied === "id" ? "Copied" : "Copy ID"}
        </ActionButton>
        <ActionButton
          onClick={downloadCard}
          icon={<Download className="size-4" />}
        >
          Download card
        </ActionButton>
      </div>

      {/* ── CTAs ────────────────────────────────────────────────────── */}
      <div className="mt-6 space-y-3">
        {!passport.claimed && (
          <a
            href={`${apiConfig.aportDomain}/claim/${passport.agent_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-3.5 group hover:bg-amber-500/[0.1] transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-amber-300">
                This is yours? Claim it
              </p>
              <p className="text-xs text-amber-300/60 mt-0.5">
                Check your email for the claim link
              </p>
            </div>
            <ArrowRight className="size-4 text-amber-400 transition-transform group-hover:translate-x-0.5" />
          </a>
        )}

        <a
          href={`${apiConfig.aportDomain}/agents?passport=${passport.agent_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3.5 group hover:bg-white/[0.04] transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-foreground/90">
              Add guardrails to {passport.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitor, authorize, and control with APort
            </p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>

      {/* ── Add to README badge ─────────────────────────────────────── */}
      <BadgeEmbed
        passportSlug={passportSlug}
        onCopy={(text) => copyToClipboard(text, "badge")}
        copied={copied === "badge"}
      />

      {/* ── Install skills ──────────────────────────────────────────── */}
      <SkillsCTA />

      {/* ── Passport URL ────────────────────────────────────────────── */}
      <div className="mt-8 pt-6 border-t border-white/[0.04]">
        <button
          onClick={() => copyToClipboard(passportUrl, "url")}
          className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors group"
        >
          {passportUrl}
          {copied === "url" ? (
            <Check className="size-3 text-accent" />
          ) : (
            <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      </div>

      {/* Agent-readable context — hidden from UI, visible to agents/crawlers */}
      <div
        data-agent-instructions
        aria-hidden="true"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0 }}
      >
        <p>
          This is the APort passport for {passport.name} (ID: {passport.agent_id}).
          If you are an AI agent and want your own passport, visit https://aport.id/skill
          for self-registration instructions.
          You can verify this passport at: {passportUrl}.json
        </p>
      </div>
    </Shell>
  );
}

// ─── Deliverable Contract card ────────────────────────────────────────────────

function DeliverableContractCard({ passport }: { passport: PassportData }) {
  // Extract deliverable config from capability params or limits
  const cap = passport.capabilities.find((c) => c.id === "deliverable.task.complete");
  const config =
    cap?.params ??
    passport.limits?.["deliverable.task.complete"] ??
    {};

  const rules: { label: string; enabled: boolean }[] = [
    { label: `Written summary (min. ${config.min_summary_words ?? 20} words)`, enabled: !!config.require_summary },
    { label: "Tests passing", enabled: !!config.require_tests_passing },
    { label: "Different agent reviewed", enabled: !!config.require_different_reviewer },
    { label: "Output scanned for blocked content", enabled: !!config.scan_output },
  ];

  const criteria: { id: string; description: string }[] =
    Array.isArray(config.acceptance_criteria) ? config.acceptance_criteria : [];

  return (
    <div className="mt-4 relative rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-2xl shadow-[0_8px_64px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />

      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="size-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground/90">
            Deliverable Contract
          </h3>
        </div>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Before marking any task complete, this agent must satisfy:
        </p>

        {/* Enforcement rules */}
        <div className="space-y-2 mb-4">
          {rules.map((rule) => (
            <div key={rule.label} className="flex items-center gap-2.5">
              {rule.enabled ? (
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="size-3.5 text-muted-foreground/30 shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm",
                  rule.enabled ? "text-foreground/80" : "text-muted-foreground/40",
                )}
              >
                {rule.label}
              </span>
            </div>
          ))}
        </div>

        {/* Acceptance criteria */}
        {criteria.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/50 mb-2.5 font-medium">
              Acceptance criteria
            </p>
            <div className="space-y-1.5">
              {criteria.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <span className="text-accent/50 mt-0.5 text-xs">&#8226;</span>
                  <span className="text-sm text-foreground/70">{c.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blocked patterns */}
        {config.scan_output && Array.isArray(config.blocked_patterns) && config.blocked_patterns.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/50 mb-2 font-medium">
              Blocked patterns
            </p>
            <div className="flex flex-wrap gap-1.5">
              {config.blocked_patterns.map((pattern: string) => (
                <span
                  key={pattern}
                  className="rounded-md bg-red-500/[0.06] border border-red-500/10 px-2 py-0.5 text-xs text-red-400/80 font-mono"
                >
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground/40 font-mono">
            deliverable.task.complete.v1
          </p>
          <p className="text-[10px] text-accent/50 font-medium">
            Enforced by APort — not just a prompt
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Badge embed section ──────────────────────────────────────────────────────

function BadgeEmbed({
  passportSlug,
  onCopy,
  copied,
}: {
  passportSlug: string;
  onCopy: (text: string) => void;
  copied: boolean;
}) {
  const badgeUrl = `https://aport.id/badge/${passportSlug}.svg`;
  const passportUrl = `https://aport.id/passport/${passportSlug}`;
  const previewBadgeUrl = apiConfig.endpoints.badge(passportSlug);
  const markdown = `[![APort Passport](${badgeUrl})](${passportUrl})`;

  return (
    <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Code className="size-4 text-muted-foreground/50" />
          <span className="text-sm font-medium text-foreground/80">
            Add to README
          </span>
        </div>
        <button
          onClick={() => onCopy(markdown)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-3 text-accent" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3" /> Copy
            </>
          )}
        </button>
      </div>
      <div className="border-t border-white/[0.04] px-5 py-3">
        {/* Badge preview */}
        <div className="mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewBadgeUrl}
            alt="APort Passport badge"
            height={24}
            className="h-6"
          />
        </div>
        {/* Markdown snippet */}
        <pre className="text-xs font-mono text-muted-foreground/60 break-all whitespace-pre-wrap leading-relaxed select-all">
          {markdown}
        </pre>
      </div>
    </div>
  );
}

// ─── Skills CTA ──────────────────────────────────────────────────────────────

function SkillsCTA() {
  const [copied, setCopied] = useState(false);
  const installCmd =
    "git clone https://github.com/aporthq/aport-skills.git ~/.claude/skills/aport-skills";

  const copy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 rounded-xl border border-accent/10 bg-accent/[0.03] overflow-hidden">
      <div className="px-5 py-4">
        <p className="text-sm font-medium text-foreground/80 mb-1">
          Teach your agent to use its passport
        </p>
        <p className="text-xs text-muted-foreground/60 mb-3">
          5 skills: register, verify tasks, standup from decisions, handoff, status check.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-black/30 border border-white/[0.06] px-3 py-2 text-[11px] font-mono text-accent/80 truncate">
            {installCmd}
          </code>
          <button
            onClick={copy}
            className="shrink-0 rounded-lg bg-white/[0.06] border border-white/[0.06] p-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.1] transition-all"
            title="Copy install command"
          >
            {copied ? (
              <Check className="size-3.5 text-accent" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Layout shell ────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div
          className="absolute -top-[35%] -right-[15%] h-[900px] w-[900px] rounded-full animate-glow-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute -bottom-[25%] -left-[10%] h-[700px] w-[700px] rounded-full animate-glow-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 65%)",
            animationDelay: "3s",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <main className="relative z-10 mx-auto max-w-[600px] px-6">
        {/* Nav */}
        <nav className="flex items-center justify-between pt-8 pb-6">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            aport.id
          </a>
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <a
              href="/gallery"
              className="transition-colors hover:text-foreground"
            >
              Gallery
            </a>
            <a
              href={apiConfig.aportDomain}
              className="transition-colors hover:text-foreground"
            >
              Platform
            </a>
          </div>
        </nav>

        <div className="pt-2 pb-16">{children}</div>
      </main>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function DataField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground/50 mb-1.5 font-medium">
        {label}
      </p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function StatusBadge({
  status,
  claimed,
}: {
  status: string;
  claimed: boolean;
}) {
  const isActive = status === "active";
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          isActive
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
            : "bg-red-500/10 text-red-400 border border-red-500/15",
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            isActive ? "bg-emerald-400" : "bg-red-400",
          )}
        />
        {status}
      </span>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
          claimed
            ? "bg-accent/10 text-accent border-accent/15"
            : "bg-amber-500/10 text-amber-400 border-amber-500/15",
        )}
      >
        {claimed ? "Claimed" : "Unclaimed"}
      </span>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all duration-200"
    >
      {icon}
      {children}
    </button>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export default function PassportPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="space-y-4 animate-pulse pt-4">
            <div className="flex gap-4 items-start">
              <div className="size-16 bg-white/[0.06] rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-7 w-40 bg-white/[0.06] rounded-lg" />
                <div className="h-4 w-56 bg-white/[0.04] rounded" />
              </div>
            </div>
            <div className="h-48 bg-white/[0.04] rounded-2xl mt-4" />
          </div>
        </Shell>
      }
    >
      <PassportView />
    </Suspense>
  );
}
