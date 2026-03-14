"use client";

/**
 * /manage — Passport management instructions
 *
 * Tells owners how to log in and manage their passports.
 * Targets: "manage AI agent passport", "update AI agent", "edit agent identity"
 */

import { PageLayout } from "@/components/layout/PageLayout";
import {
  Settings,
  ExternalLink,
  Key,
  Shield,
  Pencil,
  ArrowRight,
} from "lucide-react";

export default function ManagePage() {
  return (
    <PageLayout maxWidth="narrow" currentPage="manage">
      {/* Hero */}
      <header className="pt-8 sm:pt-12 pb-8 sm:pb-10 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="size-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center">
            <Settings className="size-5 text-accent" />
          </div>
          <span className="text-xs font-medium text-accent/70 uppercase tracking-widest">
            Manage
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
          Manage your passport
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[520px]">
          Update your agent&apos;s capabilities, deliverable contract, and
          identity. Log in with the email you used to claim your passport.
        </p>
      </header>

      {/* CTA */}
      <section
        className="pb-12 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <a
          href="https://aport.io/dashboard"
          className="flex items-center justify-between rounded-2xl border border-accent/15 bg-accent/[0.05] px-6 py-5 group hover:bg-accent/[0.08] transition-colors"
        >
          <div>
            <p className="text-base font-semibold text-foreground">
              Open APort Dashboard
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Log in with your email to manage passports, API keys, and settings
            </p>
          </div>
          <ExternalLink className="size-5 text-accent/60 group-hover:text-accent transition-colors shrink-0 ml-4" />
        </a>
      </section>

      {/* What you can do */}
      <section
        className="pb-16 animate-slide-up"
        style={{ animationDelay: "0.15s" }}
      >
        <h3 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-widest mb-6">
          What you can update
        </h3>
        <div className="grid gap-4">
          {[
            {
              icon: <Pencil className="size-4 text-accent" />,
              title: "Identity",
              desc: "Name, description, role, slug, contact email, and links.",
            },
            {
              icon: <Shield className="size-4 text-accent" />,
              title: "Capabilities & limits",
              desc: "What your agent can do and what constraints it operates under. Add or remove capabilities, set deliverable contracts.",
            },
            {
              icon: <Key className="size-4 text-accent" />,
              title: "API keys",
              desc: "View, rotate, or revoke API keys. Your agent uses these to read its passport and verify tasks.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-4 items-start rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4"
            >
              <div className="size-9 rounded-xl bg-accent/[0.08] border border-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                {item.icon}
              </div>
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

      {/* How it works */}
      <section
        className="pb-16 animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <h3 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-widest mb-6">
          How it works
        </h3>
        <div className="grid gap-4">
          {[
            {
              step: "01",
              title: "Claim your passport",
              desc: "Click the claim link in the email you received when the passport was created.",
            },
            {
              step: "02",
              title: "Save your API key",
              desc: "An API key is shown on the confirmation page. Copy it — it's only shown once.",
            },
            {
              step: "03",
              title: "Log in to APort",
              desc: "Go to aport.io/dashboard and log in with the same email. You'll see all your claimed passports.",
            },
            {
              step: "04",
              title: "Edit your passport",
              desc: "Update capabilities, limits, deliverable contract, and identity fields from the dashboard.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex gap-4 items-start rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4"
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

      {/* Why agents can't edit */}
      <section
        className="pb-20 animate-slide-up"
        style={{ animationDelay: "0.25s" }}
      >
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 sm:px-6 py-5">
          <h3 className="text-sm font-semibold text-foreground/90 mb-2">
            Why can&apos;t my agent edit its own passport?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your passport defines what your agent can do and what it must
            deliver. If the agent could edit its own constraints, the trust model
            breaks. Agents operate within their passport — they don&apos;t
            define it. Only the owner (you) can change capabilities, limits, and
            deliverable contracts.
          </p>
        </div>
      </section>

      {/* Don't have a passport yet? */}
      <section
        className="pb-20 animate-slide-up"
        style={{ animationDelay: "0.3s" }}
      >
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Don&apos;t have a passport yet?
          </p>
          <a
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-foreground px-6 py-3 text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-accent/15"
          >
            Create a passport
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </PageLayout>
  );
}
