"use client";

/**
 * Gallery page — PRD E6: Public Gallery
 *
 * Immersive, searchable directory of AI agents with passports.
 * Apple-like glass aesthetic with filtering and load-more.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { GalleryFilters } from "@/components/gallery/GalleryFilters";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { fetchGallery, type GalleryPassport } from "@/lib/services/gallery";
import { Sparkles, ArrowRight, Zap } from "lucide-react";

const PAGE_SIZE = 20;

export default function GalleryPage() {
  const [passports, setPassports] = useState<GalleryPassport[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [role, setRole] = useState("all");
  const [region, setRegion] = useState("all");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(
    async (opts: { append?: boolean } = {}) => {
      const offset = opts.append ? passports.length : 0;

      if (opts.append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await fetchGallery({
          limit: PAGE_SIZE,
          offset,
          role: role !== "all" ? role : undefined,
          region: region !== "all" ? region : undefined,
          search: search || undefined,
        });

        if (opts.append) {
          setPassports((prev) => [...prev, ...result.passports]);
        } else {
          setPassports(result.passports);
        }
        setTotal(result.total);
        setHasMore(result.hasMore);
      } catch {
        // Silent — empty state will show
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [role, region, search, passports.length],
  );

  // Reload on filter change (debounce search)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => {
        load();
      },
      search ? 300 : 0,
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, region, search]);

  const handleLoadMore = useCallback(() => {
    load({ append: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, region, search, passports.length]);

  return (
    <PageLayout maxWidth="wide" currentPage="gallery">
      {/* Milestone banner */}
      {total > 0 && !loading && (
        <div className="mb-6 animate-fade-in">
          <div className="relative overflow-hidden rounded-2xl border border-accent/10 bg-gradient-to-r from-accent/[0.06] via-accent/[0.03] to-transparent px-5 py-4 sm:px-6 sm:py-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                  <Zap className="size-4.5 text-accent" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-foreground">
                    <span className="text-accent">{total}</span>{" "}
                    {total === 1 ? "agent has" : "agents have"} an identity
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5 hidden sm:block">
                    Every passport is a real, verified credential on APort
                  </p>
                </div>
              </div>
              <a
                href="/"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-accent text-accent-foreground px-4 py-2 text-xs sm:text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-accent/15"
              >
                <span className="hidden sm:inline">Create yours</span>
                <span className="sm:hidden">Create</span>
                <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <header className="pt-4 sm:pt-6 pb-8 sm:pb-10 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="size-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center">
            <Sparkles className="size-5 text-accent" />
          </div>
          <span className="text-xs font-medium text-accent/70 uppercase tracking-widest">
            Gallery
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
          Discover AI agents
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[520px]">
          Browse verified agents with APort passports. Every agent here has a
          real, portable identity it can carry anywhere.
        </p>
      </header>

      {/* Filters */}
      <section
        className="pb-6 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <GalleryFilters
          role={role}
          region={region}
          search={search}
          onRoleChange={setRole}
          onRegionChange={setRegion}
          onSearchChange={setSearch}
          total={total}
        />
      </section>

      {/* Grid */}
      <section
        className="pb-16 sm:pb-20 animate-slide-up"
        style={{ animationDelay: "0.15s" }}
      >
        <GalleryGrid
          passports={passports}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
        />
      </section>
    </PageLayout>
  );
}
