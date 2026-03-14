"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FrameworkAutocomplete } from "./FrameworkAutocomplete";
import { DeliverableConfirmation, type DeliverableConfig } from "./DeliverableConfirmation";
import { apiConfig } from "@/lib/config/api";
import { ChevronDown, ArrowRight, Settings2 } from "lucide-react";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "agent" | "assistant" | "tool" | "service";

interface FormData {
  name: string;
  slug: string;
  slugTouched: boolean;
  description: string;
  role: Role;
  email: string;
  framework: string[];
  regions: string[];
  links: { homepage: string; repo: string; docs: string };
  showInGallery: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  email?: string;
  general?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLES: { value: Role; label: string }[] = [
  { value: "agent", label: "Agent" },
  { value: "assistant", label: "Assistant" },
  { value: "tool", label: "Tool" },
  { value: "service", label: "Service" },
];

const REGIONS = [
  { value: "global", label: "Global" },
  { value: "us", label: "US" },
  { value: "eu", label: "EU" },
  { value: "ca", label: "CA" },
  { value: "ap", label: "AP" },
];

const INITIAL_FORM: FormData = {
  name: "",
  slug: "",
  slugTouched: false,
  description: "",
  role: "agent",
  email: "",
  framework: [],
  regions: ["global"],
  links: { homepage: "", repo: "", docs: "" },
  showInGallery: true,
};

// ─── Validation ──────────────────────────────────────────────────────────────

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim() || data.name.length > 100)
    errors.name = "Agent name is required (1–100 characters)";
  if (data.description.length < 10 || data.description.length > 1000)
    errors.description = "Description must be 10–1,000 characters";
  if (!data.email.trim() || !data.email.includes("@"))
    errors.email = "A valid email is required to claim the passport";
  return errors;
}

function errorMessageForStatus(status: number, serverMsg?: string): string {
  switch (status) {
    case 409:
      return "An agent with this name already exists. Try another.";
    case 429:
      return "Too many requests — please wait a moment and try again.";
    case 400:
      return serverMsg || "Please check your inputs and try again.";
    default:
      return serverMsg || "Something went wrong. Please try again.";
  }
}

// ─── Pill button ─────────────────────────────────────────────────────────────

function Pill({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150",
        selected
          ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
          : "bg-white/[0.04] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.07] hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PassportForm({ className }: { className?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [slugEditing, setSlugEditing] = useState(false);
  const [descTouched, setDescTouched] = useState(false);
  const [showDeliverable, setShowDeliverable] = useState(false);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const setLink = (key: keyof FormData["links"], val: string) =>
    setForm((prev) => ({ ...prev, links: { ...prev.links, [key]: val } }));

  const toggleRegion = (region: string) => {
    setForm((prev) => {
      if (region === "global") return { ...prev, regions: ["global"] };
      const without = prev.regions.filter(
        (r) => r !== "global" && r !== region
      );
      const next = prev.regions.includes(region)
        ? without
        : [...without, region];
      return { ...prev, regions: next.length === 0 ? ["global"] : next };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setDescTouched(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Show deliverable confirmation before submitting
    setShowDeliverable(true);
  };

  const submitPassport = async (deliverable?: DeliverableConfig) => {
    setShowDeliverable(false);
    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(apiConfig.endpoints.issue, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug || slugify(form.name),
          description: form.description.trim(),
          role: form.role,
          email: form.email.trim(),
          framework: form.framework,
          regions: form.regions,
          links: {
            ...(form.links.homepage && { homepage: form.links.homepage.trim() }),
            ...(form.links.repo && { repo: form.links.repo.trim() }),
            ...(form.links.docs && { docs: form.links.docs.trim() }),
          },
          showInGallery: form.showInGallery,
          ...(deliverable && { deliverable }),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors({
          general: errorMessageForStatus(
            res.status,
            (body as { message?: string }).message
          ),
        });
        return;
      }

      const data = (await res.json()) as { agent_id?: string; slug?: string };
      const passportPath = data.slug || data.agent_id;
      if (passportPath) {
        router.push(`/passport/${passportPath}?new=true`);
      }
    } catch {
      setErrors({ general: "Network error — please check your connection." });
    } finally {
      setSubmitting(false);
    }
  };

  const currentSlug = form.slug || slugify(form.name);
  const hasLinks = form.links.homepage || form.links.repo || form.links.docs;
  const hasCustomOptions =
    form.role !== "agent" ||
    form.slugTouched ||
    !form.regions.includes("global") ||
    form.regions.length !== 1 ||
    hasLinks ||
    !form.showInGallery;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-5", className)}
      noValidate
    >
      {/* Error banner */}
      {errors.general && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.general}
        </div>
      )}

      {/* Agent name + auto-slug sub-label */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground/70">
          Agent name
        </label>
        <input
          value={form.name}
          onChange={(e) => {
            const newName = e.target.value;
            setForm((prev) => ({
              ...prev,
              name: newName,
              ...(prev.slugTouched ? {} : { slug: slugify(newName) }),
            }));
          }}
          placeholder="e.g. ARIA, ContractBot, Scout"
          maxLength={100}
          disabled={submitting}
          className="form-input text-[1.125rem] font-semibold tracking-tight placeholder:font-normal placeholder:text-sm placeholder:tracking-normal"
          aria-invalid={!!errors.name}
        />
        {/* Auto-generated slug — clickable to reveal edit */}
        {currentSlug ? (
          <button
            type="button"
            onClick={() => {
              setSlugEditing(!slugEditing);
              if (!slugEditing) setOptionsOpen(false);
            }}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors font-mono"
          >
            aport.id/passport/<span className="text-accent/60 hover:text-accent">{currentSlug}</span>
          </button>
        ) : null}
        {/* Inline slug editor */}
        {slugEditing && (
          <div className="flex items-stretch animate-slide-up">
            <span className="inline-flex items-center rounded-l-[var(--radius)] border border-r-0 border-[var(--border)] bg-white/[0.06] px-3 text-sm font-medium text-muted-foreground select-none">
              @
            </span>
            <input
              value={form.slug}
              onChange={(e) => {
                const raw = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                setForm((prev) => ({ ...prev, slug: raw, slugTouched: true }));
              }}
              placeholder="agent-username"
              maxLength={100}
              disabled={submitting}
              className="form-input font-mono text-sm"
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: "none" }}
              autoFocus
            />
          </div>
        )}
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      {/* Description */}
      <Field label="What does it do?" error={descTouched ? errors.description : undefined}>
        <textarea
          value={form.description}
          onChange={(e) => {
            set("description", e.target.value);
            if (!descTouched) setDescTouched(true);
          }}
          placeholder="A research assistant that browses the web and summarizes papers"
          maxLength={1000}
          rows={2}
          disabled={submitting}
          className="form-input resize-none leading-relaxed"
          aria-invalid={!!errors.description}
        />
        <div className="flex items-center justify-end mt-1">
          <span
            className={cn(
              "text-xs tabular-nums",
              descTouched && form.description.length < 10
                ? "text-destructive"
                : "text-muted-foreground/40"
            )}
          >
            {form.description.length}/1000
          </span>
        </div>
      </Field>

      {/* Model / Framework — viral element, primary field */}
      <FrameworkAutocomplete
        value={form.framework}
        onChange={(fw) => set("framework", fw)}
        disabled={submitting}
      />

      {/* Email */}
      <Field label="Your email" error={errors.email}>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="you@company.com"
          disabled={submitting}
          className="form-input"
          aria-invalid={!!errors.email}
        />
        <p className="text-xs text-muted-foreground/50 mt-1.5">
          We&apos;ll send a claim link so you can own this passport.
        </p>
      </Field>

      {/* ── More options accordion ──────────────────────────────────────── */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setOptionsOpen(!optionsOpen)}
          className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors group"
        >
          <Settings2 className="size-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          <span>More options</span>
          {hasCustomOptions && (
            <span className="size-1.5 rounded-full bg-accent" />
          )}
          <ChevronDown
            className={cn(
              "size-3 opacity-40 transition-transform duration-200",
              optionsOpen && "rotate-180"
            )}
          />
        </button>

        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            optionsOpen
              ? "grid-rows-[1fr] opacity-100 mt-5"
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden space-y-5">
            {/* Role */}
            <Field label="Role">
              <div className="grid grid-cols-4 gap-2">
                {ROLES.map((r) => (
                  <Pill
                    key={r.value}
                    selected={form.role === r.value}
                    disabled={submitting}
                    onClick={() => set("role", r.value)}
                  >
                    {r.label}
                  </Pill>
                ))}
              </div>
            </Field>

            {/* Regions */}
            <Field label="Operating region">
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((r) => (
                  <Pill
                    key={r.value}
                    selected={form.regions.includes(r.value)}
                    disabled={submitting}
                    onClick={() => toggleRegion(r.value)}
                  >
                    {r.label}
                  </Pill>
                ))}
              </div>
            </Field>

            {/* Links */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground/70">
                Links <span className="text-muted-foreground/40 font-normal">(optional)</span>
              </label>
              <div className="space-y-2">
                {(["homepage", "repo", "docs"] as const).map((key) => (
                  <input
                    key={key}
                    value={form.links[key]}
                    onChange={(e) => setLink(key, e.target.value)}
                    placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} URL`}
                    type="url"
                    disabled={submitting}
                    className="form-input text-sm"
                  />
                ))}
              </div>
            </div>

            {/* Gallery toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="relative inline-flex">
                <input
                  type="checkbox"
                  checked={form.showInGallery}
                  onChange={(e) => set("showInGallery", e.target.checked)}
                  disabled={submitting}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "block h-[22px] w-[40px] rounded-full transition-colors duration-200",
                    "bg-white/10 peer-checked:bg-accent",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
                  )}
                />
                <span className="absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-[18px]" />
              </span>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors select-none">
                Show in public gallery
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "group w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-200",
          "bg-accent text-accent-foreground shadow-lg shadow-accent/15",
          "hover:brightness-110 hover:shadow-accent/25 active:scale-[0.99] active:brightness-95",
          "disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            Issuing passport...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            Create passport
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        )}
      </button>

      {/* Deliverable enforcement confirmation */}
      {showDeliverable && (
        <DeliverableConfirmation
          agentName={form.name.trim() || "Your agent"}
          onConfirm={(config) => submitPassport(config)}
          onSkip={() => submitPassport()}
          onClose={() => setShowDeliverable(false)}
        />
      )}
    </form>
  );
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground/70">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
