"use client";

/**
 * Breed detail page — /breed/[breedSlug]/[modelId]
 *
 * Single SPA page that reads the breed slug and model from the URL pathname.
 * Cloudflare middleware (functions/breed/[[path]]/_middleware.ts) serves this
 * page for all /breed/* routes and injects OG meta tags for crawlers.
 */

import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import {
  FRAMEWORK_OPTIONS,
  getFrameworkByBreedSlug,
  type FrameworkOption,
} from "@/lib/config/breeds";
import { BreedImage } from "@/components/breed/BreedImage";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseBreedPath(pathname: string | null): {
  breedSlug: string;
  modelId: string;
} {
  if (!pathname) return { breedSlug: "", modelId: "" };
  const segments = pathname
    .replace(/^\/breed\/?/, "")
    .split("/")
    .filter(Boolean);
  return {
    breedSlug: segments[0] ?? "",
    modelId: segments[1] ?? "",
  };
}

function getRelatedBreeds(
  current: FrameworkOption,
  count: number,
): FrameworkOption[] {
  // Prefer same provider, fall back to random
  const sameProvider = FRAMEWORK_OPTIONS.filter(
    (f) => f.provider === current.provider && f.id !== current.id,
  );
  const pool =
    sameProvider.length >= count
      ? sameProvider
      : [
          ...sameProvider,
          ...FRAMEWORK_OPTIONS.filter(
            (f) =>
              f.provider !== current.provider && f.id !== current.id,
          ),
        ];
  // Shuffle and take `count`
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─── Main view ───────────────────────────────────────────────────────────────

function BreedDetail() {
  const pathname = usePathname();
  const { breedSlug, modelId } = parseBreedPath(pathname);
  const [copied, setCopied] = useState<"social" | "url" | null>(null);

  const framework = useMemo(() => {
    if (!breedSlug) return undefined;
    // Try slug first, then fall back to matching by modelId
    const bySlug = getFrameworkByBreedSlug(breedSlug);
    if (bySlug && (!modelId || bySlug.id === modelId)) return bySlug;
    // If modelId provided, verify it matches
    if (modelId) {
      const byModel = FRAMEWORK_OPTIONS.find((f) => f.id === modelId);
      if (byModel && byModel.breedSlug === breedSlug) return byModel;
    }
    return bySlug;
  }, [breedSlug, modelId]);

  const related = useMemo(
    () => (framework ? getRelatedBreeds(framework, 3) : []),
    [framework],
  );

  const pageUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://aport.id/breed/${breedSlug}/${modelId}`;

  const copyToClipboard = useCallback(
    (text: string, type: "social" | "url") => {
      navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    },
    [],
  );

  const shareOnX = useCallback(() => {
    if (!framework) return;
    const text = `${framework.socialCopy}\n\nDiscover your AI's breed at aport.id/what-breed-is-my-ai`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  }, [framework]);

  // ── Not found ────────────────────────────────────────────────────────────
  if (!breedSlug || !framework) {
    return (
      <PageLayout currentPage="home">
        <div className="text-center py-24">
          <div className="size-16 mx-auto mb-6 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Breed not found</h1>
          <p className="text-muted-foreground mb-8 max-w-[360px] mx-auto">
            We couldn&apos;t find that breed. Explore all AI model breeds
            to find the right match.
          </p>
          <a
            href="/what-breed-is-my-ai"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent text-accent-foreground px-6 py-2.5 text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-accent/15"
          >
            Browse all breeds
            <ArrowRight className="size-4" />
          </a>
        </div>
      </PageLayout>
    );
  }

  // ── Breed detail ─────────────────────────────────────────────────────────
  return (
    <PageLayout currentPage="home">
      <div className="pt-2 pb-16">
        {/* Back link */}
        <a
          href="/what-breed-is-my-ai"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="size-4" />
          All breeds
        </a>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-10">
          <BreedImage
            imageApi={framework.imageApi}
            breed={framework.breed}
            size="lg"
            className="mb-6"
          />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-accent mb-2">
            {framework.breed}
          </h1>
          <p className="text-lg text-foreground/80 font-medium mb-2">
            {framework.name}
          </p>
          <span className="inline-flex items-center rounded-md bg-white/[0.06] border border-white/[0.06] px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {framework.provider}
          </span>
        </div>

        {/* ── Personality card ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-xl p-6 sm:p-8 mb-4">
          <div className="relative">
            <span className="absolute -top-2 -left-1 text-4xl text-accent/20 font-serif select-none">
              &ldquo;
            </span>
            <p className="text-foreground/90 leading-relaxed pl-6">
              {framework.longDescription}
            </p>
            <span className="text-4xl text-accent/20 font-serif select-none leading-none">
              &rdquo;
            </span>
          </div>
        </div>

        {/* ── Fun Fact card ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-xl p-6 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="size-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground/50 font-medium mb-1.5">
                Fun Fact
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {framework.funFact}
              </p>
            </div>
          </div>
        </div>

        {/* ── Tags ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {framework.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/[0.05] border border-white/[0.06] px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* ── Share section ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-xl p-6 sm:p-8 mb-6">
          <p className="text-sm font-medium text-foreground/80 mb-4">
            Share this breed
          </p>
          <div className="space-y-3">
            {/* Copy social copy */}
            <button
              onClick={() => copyToClipboard(framework.socialCopy, "social")}
              className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 group hover:bg-white/[0.06] transition-colors"
            >
              <p className="text-xs text-muted-foreground text-left line-clamp-2 pr-4">
                {framework.socialCopy}
              </p>
              {copied === "social" ? (
                <Check className="size-4 text-accent shrink-0" />
              ) : (
                <Copy className="size-4 text-muted-foreground/50 shrink-0 group-hover:text-foreground transition-colors" />
              )}
            </button>

            {/* Action buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={shareOnX}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all duration-200"
              >
                <ExternalLink className="size-4" />
                Share on X
              </button>
              <button
                onClick={() => copyToClipboard(pageUrl, "url")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all duration-200"
              >
                {copied === "url" ? (
                  <>
                    <Check className="size-4 text-accent" />
                    Copied
                  </>
                ) : (
                  <>
                    <Share2 className="size-4" />
                    Copy link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <a
          href={`/?framework=${framework.id}`}
          className="flex items-center justify-between w-full rounded-xl border border-accent/20 bg-accent/[0.08] px-5 py-4 group hover:bg-accent/[0.12] transition-colors mb-10"
        >
          <div>
            <p className="text-sm font-semibold text-accent">
              Give {framework.name} an official passport
            </p>
            <p className="text-xs text-accent/60 mt-0.5">
              Create a verified AI agent identity in 60 seconds
            </p>
          </div>
          <ArrowRight className="size-4 text-accent transition-transform group-hover:translate-x-0.5" />
        </a>

        {/* ── Related breeds ────────────────────────────────────────── */}
        {related.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground/60 uppercase tracking-wider mb-4">
              Related breeds
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <a
                  key={r.id}
                  href={`/breed/${r.breedSlug}/${r.id}`}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-xl p-4 hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <BreedImage
                      imageApi={r.imageApi}
                      breed={r.breed}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-accent truncate">
                        {r.breed}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.name}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground/70 line-clamp-2">
                    {r.breedDescription}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export default function BreedPage() {
  return <BreedDetail />;
}
