"use client";

/**
 * aport.id Homepage — PRD E1 + E7
 *
 * Dark glass aesthetic. APort cyan for interactive elements only.
 * Creation form front and center, gallery preview below fold.
 */

import { useState, useEffect } from "react";
import { PassportForm } from "@/components/passport/PassportForm";
import { PageLayout } from "@/components/layout/PageLayout";
import { PassportCard } from "@/components/gallery/PassportCard";
import { fetchGallery, type GalleryPassport } from "@/lib/services/gallery";
import {
  Shield,
  Fingerprint,
  Globe,
  ChevronDown,
  ArrowRight,
  Bot,
  Copy,
  Check,
} from "lucide-react";

export default function HomePage() {
  const [galleryPassports, setGalleryPassports] = useState<GalleryPassport[]>(
    [],
  );
  const [galleryTotal, setGalleryTotal] = useState(0);

  // Load a few gallery passports for the preview section
  useEffect(() => {
    fetchGallery({ limit: 3 })
      .then((result) => {
        setGalleryPassports(result.passports);
        setGalleryTotal(result.total);
      })
      .catch(() => {});
  }, []);

  return (
    <PageLayout maxWidth="narrow" currentPage="home">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <header className="pt-8 sm:pt-12 pb-4 sm:pb-5 animate-fade-in">
        <h1 className="text-[2.5rem] font-bold tracking-tight leading-[1.1] sm:text-[3.25rem]">
          Give Your Agent <span className="text-accent">An Identity</span> - and
          a job to do.
        </h1>
        <p className="mt-2 text-base text-muted-foreground leading-relaxed sm:text-[1.0625rem] text-center">
          A name, an origin, and a deliverable contract in 60&nbsp;seconds,
          no&nbsp;account&nbsp;required.
        </p>
      </header>

      {/* ── Creation form — glass card ──────────────────────────────────── */}
      <section
        className="pb-20 sm:pb-24 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        {/* CLI alternative */}
        <NpxLine />

        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-2xl shadow-[0_8px_64px_rgba(0,0,0,0.4)]">
          {/* Top glass edge */}
          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

          <div className="p-6 sm:p-8">
            <h2 className="text-base font-semibold mb-6">Create a passport</h2>
            <PassportForm />
          </div>
        </div>
      </section>

      {/* ── For Agents ───────────────────────────────────────────────────── */}
      <section
        className="pb-20 sm:pb-24 animate-slide-up"
        style={{ animationDelay: "0.15s" }}
      >
        <ForAgents />
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section
        className="pb-20 animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <h3 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-widest mb-6">
          How it works
        </h3>
        <div className="grid gap-4">
          {[
            {
              step: "01",
              title: "Name it",
              desc: "Tell us about your agent — name, role, model.",
            },
            {
              step: "02",
              title: "Get its passport",
              desc: "A real DID-compliant credential with an optional deliverable contract.",
            },
            {
              step: "03",
              title: "Share it anywhere",
              desc: "A shareable page, JSON endpoint, and README badge.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex gap-4 items-start rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4 hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-xs font-mono text-accent/60 mt-0.5 shrink-0">
                {item.step}
              </span>
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

      {/* ── What is an APort passport? ──────────────────────────────────── */}
      <section
        className="pb-20 animate-slide-up"
        style={{ animationDelay: "0.25s" }}
      >
        <WhatIsPassport />
      </section>

      {/* ── Gallery preview ─────────────────────────────────────────────── */}
      {galleryPassports.length > 0 && (
        <section
          className="pb-20 animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-widest">
              Recent passports
            </h3>
            <a
              href="/gallery"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent/70 hover:text-accent transition-colors"
            >
              View all{galleryTotal > 0 && ` (${galleryTotal})`}
              <ArrowRight className="size-3" />
            </a>
          </div>
          <div className="grid gap-4">
            {galleryPassports.map((passport, i) => (
              <PassportCard
                key={passport.agent_id}
                passport={passport}
                index={i}
              />
            ))}
          </div>
          <div className="mt-6 text-center">
            <a
              href="/gallery"
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/[0.08] px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all duration-200"
            >
              Browse the gallery
              <ArrowRight className="size-4 opacity-50" />
            </a>
          </div>
        </section>
      )}
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
    <div className="flex items-center justify-center mb-5">
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
        <p className="mt-3 text-xs text-muted-foreground/50">
          Works with Claude Code, ChatGPT, Cursor, Windsurf, and any agent with
          HTTP access.{" "}
          <a
            href="https://github.com/aporthq/aport-skills"
            className="text-accent/50 hover:text-accent transition-colors"
          >
            5 more skills available
          </a>{" "}
          — verify tasks, standup, handoff, status.
        </p>
      </div>
    </div>
  );
}

// ─── "What is an APort passport?" expandable ──────────────────────────────

function WhatIsPassport() {
  const [open, setOpen] = useState(false);

  const features = [
    {
      icon: <Fingerprint className="size-5 text-accent" />,
      title: "Real DID credential",
      desc: "Every passport is a W3C-compliant Decentralized Identifier. Not a toy — a real, globally resolvable identity.",
    },
    {
      icon: <Shield className="size-5 text-accent" />,
      title: "Verifiable & portable",
      desc: "Carries a verifiable credential your agent can present anywhere. Interoperable with VC ecosystems.",
    },
    {
      icon: <Globe className="size-5 text-accent" />,
      title: "Claimable via email",
      desc: "No sign-up needed. Get a claim link in your inbox, click it, and the passport is yours.",
    },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 sm:px-6 py-5 text-left group hover:bg-white/[0.02] transition-colors"
      >
        <h3 className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
          What is an APort passport?
        </h3>
        <ChevronDown
          className={`size-4 text-muted-foreground/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 sm:px-6 pb-6 space-y-4 border-t border-white/[0.04] pt-5">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4 items-start">
                <div className="size-10 rounded-xl bg-accent/[0.08] border border-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {f.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
