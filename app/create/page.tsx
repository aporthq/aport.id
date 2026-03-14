"use client";

/**
 * /create — Dedicated passport creation page
 *
 * Same form as homepage but with its own URL for SEO, linking, and sharing.
 * Targets: "create AI agent passport", "register AI agent", "AI agent identity"
 */

import { useState } from "react";
import { PassportForm } from "@/components/passport/PassportForm";
import { PageLayout } from "@/components/layout/PageLayout";
import { Copy, Check, Bot } from "lucide-react";

export default function CreatePage() {
  return (
    <PageLayout maxWidth="narrow" currentPage="create">
      {/* Hero */}
      <header className="pt-8 sm:pt-12 pb-4 sm:pb-5 animate-fade-in">
        <h1 className="text-[2.5rem] font-bold tracking-tight leading-[1.1] sm:text-[3.25rem]">
          Create an Agent <span className="text-accent">Passport</span>
        </h1>
        <p className="mt-2 text-base text-muted-foreground leading-relaxed sm:text-[1.0625rem] text-center">
          A verifiable DID credential with identity, capabilities, and a
          deliverable contract. No&nbsp;account&nbsp;required.
        </p>
      </header>

      {/* CLI alternative */}
      <section
        className="pb-6 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <NpxLine />
      </section>

      {/* Creation form */}
      <section
        className="pb-20 sm:pb-24 animate-slide-up"
        style={{ animationDelay: "0.15s" }}
      >
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-2xl shadow-[0_8px_64px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
          <div className="p-6 sm:p-8">
            <h2 className="text-base font-semibold mb-6">Create a passport</h2>
            <PassportForm />
          </div>
        </div>
      </section>

      {/* For agents */}
      <section
        className="pb-20 sm:pb-24 animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <ForAgents />
      </section>

      {/* What you get */}
      <section
        className="pb-20 animate-slide-up"
        style={{ animationDelay: "0.25s" }}
      >
        <h3 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-widest mb-6">
          What you get
        </h3>
        <div className="grid gap-4">
          {[
            {
              title: "Verifiable DID credential",
              desc: "A W3C-compliant Decentralized Identifier — not a toy, a real globally resolvable identity.",
            },
            {
              title: "Shareable passport page",
              desc: "A public page at aport.id/passport/your-slug with OG metadata, JSON endpoint, and badge.",
            },
            {
              title: "Deliverable contract",
              desc: "Optional quality gates your agent must meet before marking any task done.",
            },
            {
              title: "API key on claim",
              desc: "When you claim your passport, an API key is generated so your agent can read its own identity.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-4 items-start rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4 hover:bg-white/[0.03] transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

// ─── npx aport-id line ────────────────────────────────────────────────────

function NpxLine() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText("npx aport-id");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors group"
      >
        <span className="font-mono bg-white/[0.04] border border-white/[0.06] rounded-md px-2.5 py-1 group-hover:bg-white/[0.07] group-hover:border-white/[0.1] transition-all inline-flex items-center gap-2">
          npx aport-id
          {copied ? (
            <Check className="size-3 text-accent" />
          ) : (
            <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </span>
        <span className="text-muted-foreground/25">or create below</span>
      </button>
    </div>
  );
}

// ─── "For Agents" section ──────────────────────────────────────────────────

function ForAgents() {
  const [copied, setCopied] = useState(false);
  const instruction =
    "Read https://aport.id/skill and follow the instructions.";

  const copy = () => {
    navigator.clipboard.writeText(instruction);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-accent/10 bg-accent/[0.03] overflow-hidden">
      <div className="px-5 sm:px-6 py-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="size-5 text-accent" />
          <h3 className="text-sm font-semibold text-foreground/90">
            For AI agents
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Send this to your AI agent. It will register itself — with identity,
          capabilities, and a deliverable contract.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-black/30 border border-white/[0.06] px-4 py-2.5 font-mono text-xs text-accent/90 select-all">
            {instruction}
          </div>
          <button
            onClick={copy}
            className="shrink-0 rounded-lg bg-white/[0.06] border border-white/[0.06] p-2.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.1] transition-all"
            title="Copy instruction"
          >
            {copied ? (
              <Check className="size-4 text-accent" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
