"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Plus,
  Trash2,
  ClipboardCheck,
  ArrowRight,
  FileText,
  FlaskConical,
  Users,
  ScanSearch,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DeliverableConfig {
  require_summary: boolean;
  min_summary_words: number;
  require_tests_passing: boolean;
  require_different_reviewer: boolean;
  scan_output: boolean;
  blocked_patterns: string[];
  acceptance_criteria: string[];
}

const INITIAL_CONFIG: DeliverableConfig = {
  require_summary: false,
  min_summary_words: 20,
  require_tests_passing: false,
  require_different_reviewer: false,
  scan_output: false,
  blocked_patterns: [],
  acceptance_criteria: [],
};

// ─── Component ───────────────────────────────────────────────────────────────

export function DeliverableConfirmation({
  agentName,
  onConfirm,
  onSkip,
  onClose,
}: {
  agentName: string;
  onConfirm: (config: DeliverableConfig) => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const [config, setConfig] = useState<DeliverableConfig>(INITIAL_CONFIG);
  const [criterionInput, setCriterionInput] = useState("");
  const [patternsInput, setPatternsInput] = useState("");

  const hasAnything =
    config.require_summary ||
    config.require_tests_passing ||
    config.require_different_reviewer ||
    config.scan_output ||
    config.acceptance_criteria.length > 0;

  const addCriterion = () => {
    const text = criterionInput.trim();
    if (!text || config.acceptance_criteria.length >= 20) return;
    setConfig((prev) => ({
      ...prev,
      acceptance_criteria: [...prev.acceptance_criteria, text],
    }));
    setCriterionInput("");
  };

  const removeCriterion = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      acceptance_criteria: prev.acceptance_criteria.filter((_, i) => i !== index),
    }));
  };

  const handleConfirm = () => {
    // Parse blocked patterns from comma-separated input
    const patterns = patternsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onConfirm({
      ...config,
      blocked_patterns: config.scan_output ? patterns : [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0c1017] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        {/* Top glass edge */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ClipboardCheck className="size-4 text-accent" />
              <h2 className="text-base font-semibold text-foreground">
                Deliverable contract
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              What must <span className="text-foreground font-medium">{agentName}</span> deliver
              before it can mark a task done?
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.06] transition-all"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Enforcement toggles ───────────────────────────────────── */}
          <div className="space-y-3">
            <EnforcementToggle
              icon={<FileText className="size-4" />}
              label="Require a written summary"
              checked={config.require_summary}
              onChange={(v) => setConfig((p) => ({ ...p, require_summary: v }))}
            >
              {config.require_summary && (
                <div className="flex items-center gap-2 mt-2.5 ml-8">
                  <span className="text-xs text-muted-foreground">minimum</span>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={config.min_summary_words}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        min_summary_words: Math.max(5, Math.min(500, parseInt(e.target.value) || 20)),
                      }))
                    }
                    className="w-16 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-foreground text-center tabular-nums focus:outline-none focus:border-accent/40"
                  />
                  <span className="text-xs text-muted-foreground">words</span>
                </div>
              )}
            </EnforcementToggle>

            <EnforcementToggle
              icon={<FlaskConical className="size-4" />}
              label="Tests must be passing"
              checked={config.require_tests_passing}
              onChange={(v) => setConfig((p) => ({ ...p, require_tests_passing: v }))}
            />

            <EnforcementToggle
              icon={<Users className="size-4" />}
              label="Require review by a different agent"
              checked={config.require_different_reviewer}
              onChange={(v) => setConfig((p) => ({ ...p, require_different_reviewer: v }))}
            />

            <EnforcementToggle
              icon={<ScanSearch className="size-4" />}
              label="Scan output for blocked content"
              checked={config.scan_output}
              onChange={(v) => setConfig((p) => ({ ...p, scan_output: v }))}
            >
              {config.scan_output && (
                <div className="mt-2.5 ml-8">
                  <input
                    value={patternsInput}
                    onChange={(e) => setPatternsInput(e.target.value)}
                    placeholder="TODO, FIXME, placeholder, console.log"
                    className="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/40"
                  />
                  <p className="text-[10px] text-muted-foreground/40 mt-1">
                    Comma-separated patterns
                  </p>
                </div>
              )}
            </EnforcementToggle>
          </div>

          {/* ── Acceptance criteria ────────────────────────────────────── */}
          <div>
            <p className="text-sm font-medium text-foreground/70 mb-2.5">
              Acceptance criteria
              <span className="text-muted-foreground/40 font-normal ml-1.5">(optional)</span>
            </p>
            <p className="text-xs text-muted-foreground/50 mb-3">
              Your agent must attest to each with evidence before completing a task.
            </p>

            {config.acceptance_criteria.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {config.acceptance_criteria.map((criterion, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 group"
                  >
                    <span className="text-xs text-accent/60 font-mono shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-foreground/80 flex-1 truncate">
                      {criterion}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCriterion(i)}
                      className="shrink-0 p-1 text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={criterionInput}
                onChange={(e) => setCriterionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCriterion();
                  }
                }}
                placeholder="e.g. A concrete output artifact must be produced"
                maxLength={200}
                className="flex-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/40"
              />
              <button
                type="button"
                onClick={addCriterion}
                disabled={!criterionInput.trim()}
                className="shrink-0 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* ── Divider ───────────────────────────────────────────────── */}
          <div className="h-px bg-white/[0.06]" />

          {/* ── Footer ────────────────────────────────────────────────── */}
          <div className="space-y-2.5">
            {hasAnything && (
              <p className="text-[11px] text-accent/60 leading-relaxed">
                Enforced by APort — not just a prompt. Your agent cannot call task complete until every condition is satisfied.
              </p>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!hasAnything}
              className={cn(
                "group w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200",
                "bg-accent text-accent-foreground shadow-lg shadow-accent/15",
                "hover:brightness-110 hover:shadow-accent/25 active:scale-[0.99]",
                "disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                Create with enforcement
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Skip — create without enforcement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle row ──────────────────────────────────────────────────────────────

function EnforcementToggle({
  icon,
  label,
  checked,
  onChange,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-3 cursor-pointer group">
        <span className="relative inline-flex shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer sr-only"
          />
          <span
            className={cn(
              "block h-[20px] w-[36px] rounded-full transition-colors duration-200",
              "bg-white/10 peer-checked:bg-accent",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
            )}
          />
          <span className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors select-none">
          <span className="text-muted-foreground/50">{icon}</span>
          {label}
        </span>
      </label>
      {children}
    </div>
  );
}
