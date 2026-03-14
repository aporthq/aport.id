"use client";

/**
 * Gallery grid — responsive card grid with load-more
 *
 * Renders PassportCards in a responsive grid layout.
 * Handles loading, empty, and load-more states.
 */

import { PassportCard } from "./PassportCard";
import { Shield, ArrowRight, Plus } from "lucide-react";
import type { GalleryPassport } from "@/lib/services/gallery";

interface GalleryGridProps {
  passports: GalleryPassport[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
}

export function GalleryGrid({
  passports,
  loading,
  hasMore,
  onLoadMore,
  loadingMore,
}: GalleryGridProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 animate-pulse"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="flex items-start gap-3.5">
              <div className="size-12 bg-white/[0.06] rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-white/[0.06] rounded" />
                <div className="h-3 w-16 bg-white/[0.04] rounded" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="h-5 w-14 bg-white/[0.04] rounded-md" />
              <div className="h-5 w-20 bg-white/[0.04] rounded-md" />
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-3 w-full bg-white/[0.04] rounded" />
              <div className="h-3 w-2/3 bg-white/[0.04] rounded" />
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.04] flex justify-between">
              <div className="h-3 w-20 bg-white/[0.04] rounded" />
              <div className="h-3 w-8 bg-white/[0.04] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (passports.length === 0) {
    return (
      <div className="text-center py-16 sm:py-24 animate-fade-in">
        <div className="size-20 mx-auto mb-6 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <Shield className="size-8 text-muted-foreground/20" />
        </div>
        <h3 className="text-xl font-bold mb-2">No agents found</h3>
        <p className="text-sm text-muted-foreground max-w-[340px] mx-auto mb-8 leading-relaxed">
          No passports match your current filters. Try broadening your search or
          be the first to create one.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-foreground px-7 py-3 text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-accent/20"
        >
          <Plus className="size-4" />
          Create a passport
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {passports.map((passport, i) => (
          <PassportCard key={passport.agent_id} passport={passport} index={i} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/[0.08] px-8 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load more agents
                <ArrowRight className="size-4 opacity-50" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
