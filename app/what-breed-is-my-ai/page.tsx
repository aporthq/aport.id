"use client";

import { PageLayout } from "@/components/layout/PageLayout";
import { FRAMEWORK_OPTIONS, getProviders } from "@/lib/config/breeds";
import { BreedImage } from "@/components/breed/BreedImage";
import { cn } from "@/lib/utils";
import { Share2, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

const PROVIDER_FILTERS = ["All", ...getProviders()];

export default function WhatBreedIsMyAIPage() {
  const [filter, setFilter] = useState("All");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const items =
      filter === "All"
        ? FRAMEWORK_OPTIONS
        : FRAMEWORK_OPTIONS.filter((fw) => fw.provider === filter);

    // Keep "other" / "Mixed Breed" last
    return [...items].sort((a, b) => {
      const aIsOther =
        a.breed.toLowerCase() === "mixed breed" ||
        a.provider.toLowerCase() === "other";
      const bIsOther =
        b.breed.toLowerCase() === "mixed breed" ||
        b.provider.toLowerCase() === "other";
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return 0;
    });
  }, [filter]);

  function handleShare(e: React.MouseEvent, fw: (typeof FRAMEWORK_OPTIONS)[0]) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(fw.socialCopy).then(() => {
      setCopied(fw.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <PageLayout maxWidth="narrow" currentPage="home">
      <div className="flex flex-col gap-16 py-12">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="animate-slide-up text-center flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 text-accent">
            <Sparkles className="size-5" />
            <span className="text-sm font-medium tracking-wide uppercase">
              The definitive guide
            </span>
            <Sparkles className="size-5" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            What Breed Is My{" "}
            <span className="text-accent">AI</span>?
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Every AI model has a personality. We gave them breeds.
          </p>
        </section>

        {/* ── Fun stats ────────────────────────────────────── */}
        <section
          className="animate-fade-in text-center"
          style={{ animationDelay: "100ms" }}
        >
          <p className="text-sm text-muted-foreground tracking-wide">
            <span className="text-foreground font-semibold">
              {FRAMEWORK_OPTIONS.length} models
            </span>{" "}
            &middot;{" "}
            <span className="text-foreground font-semibold">
              {FRAMEWORK_OPTIONS.length} breeds
            </span>{" "}
            &middot;{" "}
            <span className="text-foreground font-semibold">0 actual dogs</span>
          </p>
        </section>

        {/* ── Provider filter pills ────────────────────────── */}
        <section
          className="animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
            {PROVIDER_FILTERS.map((provider) => (
              <button
                key={provider}
                onClick={() => setFilter(provider)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200",
                  filter === provider
                    ? "bg-accent/20 text-accent border-accent/30"
                    : "bg-white/[0.04] border-white/[0.06] text-muted-foreground hover:border-white/[0.1]"
                )}
              >
                {provider}
              </button>
            ))}
          </div>
        </section>

        {/* ── Breed grid ───────────────────────────────────── */}
        <section
          className="animate-fade-in"
          style={{ animationDelay: "300ms" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((fw, i) => (
              <Link
                key={fw.id}
                href={`/breed/${fw.breedSlug}/${fw.id}`}
                className={cn(
                  "group relative rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-xl",
                  "hover:border-accent/20 hover:bg-white/[0.04] hover:-translate-y-1",
                  "transition-all duration-300 p-6 flex flex-col items-center text-center gap-4"
                )}
                style={{ animationDelay: `${300 + i * 50}ms` }}
              >
                {/* Share button */}
                <button
                  onClick={(e) => handleShare(e, fw)}
                  className={cn(
                    "absolute top-4 right-4 p-2 rounded-lg transition-all duration-200",
                    "text-muted-foreground hover:text-accent hover:bg-accent/10",
                    copied === fw.id && "text-accent bg-accent/10"
                  )}
                  aria-label={`Share ${fw.name}`}
                >
                  <Share2 className="size-4" />
                  {copied === fw.id && (
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-accent whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>

                {/* Breed image */}
                <BreedImage
                  imageApi={fw.imageApi}
                  breed={fw.breed}
                  size="lg"
                />

                {/* Breed name */}
                <h2 className="text-accent text-lg font-bold leading-tight">
                  {fw.breed}
                </h2>

                {/* Model name */}
                <p className="text-sm text-muted-foreground">{fw.name}</p>

                {/* Description in quotes */}
                <p className="text-sm text-muted-foreground/80 italic">
                  &ldquo;{fw.breedDescription}&rdquo;
                </p>

                {/* Tags */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                  {fw.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────── */}
        <section
          className="animate-fade-in"
          style={{ animationDelay: "400ms" }}
        >
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-xl p-8 text-center flex flex-col items-center gap-4">
            <h2 className="text-xl font-bold">
              Your agent deserves an identity too.
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Create a portable AI passport with a real DID credential your agent
              can carry anywhere.
            </p>
            <Link
              href="/"
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-6 py-2.5",
                "bg-accent text-white font-medium text-sm",
                "hover:bg-accent/90 transition-colors duration-200"
              )}
            >
              Create a Passport
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
