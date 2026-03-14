"use client";

/**
 * Gallery passport card — glass design with hover interaction
 *
 * Displays a passport summary in the gallery grid.
 * Links to the full passport page via slug.
 */

import { cn } from "@/lib/utils";
import { getFrameworkById } from "@/lib/config/breeds";
import { getAvatarDataUri } from "@/lib/avatar";
import { Shield, ArrowUpRight } from "lucide-react";
import type { GalleryPassport } from "@/lib/services/gallery";

const REGION_FLAGS: Record<string, string> = {
  us: "US",
  eu: "EU",
  ca: "CA",
  ap: "AP",
  global: "Global",
};

function formatBornDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PassportCardProps {
  passport: GalleryPassport;
  index?: number;
}

export function PassportCard({ passport, index = 0 }: PassportCardProps) {
  const avatarUri = getAvatarDataUri(passport.slug || passport.agent_id || '', 64);
  const primaryFramework = passport.framework?.[0]
    ? getFrameworkById(passport.framework[0])
    : null;
  const slug = passport.slug || passport.agent_id;
  const bornDate = formatBornDate(passport.created_at);

  return (
    <a
      href={`/passport/${slug}`}
      className="group relative flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-accent/20 hover:bg-white/[0.04] hover:shadow-[0_12px_48px_rgba(6,182,212,0.08)] hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
    >
      {/* Top glass edge — reveals on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Hover arrow indicator */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
        <ArrowUpRight className="size-4 text-accent/60" />
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Avatar + Name + Status */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <img
              src={avatarUri}
              alt=""
              width={48}
              height={48}
              className="rounded-xl ring-1 ring-white/[0.08] group-hover:ring-accent/20 transition-all duration-300"
            />
            {/* Status dot overlaid on avatar */}
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#06090f]",
                passport.status === "active" ? "bg-emerald-400" : "bg-amber-400",
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate group-hover:text-accent transition-colors duration-200">
              {passport.name}
            </h3>
            {passport.slug && (
              <p className="text-xs text-muted-foreground/40 font-mono truncate">
                @{passport.slug}
              </p>
            )}
          </div>
        </div>

        {/* Role + Breed */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-md bg-white/[0.06] border border-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-muted-foreground capitalize">
            {passport.role}
          </span>
          {primaryFramework && (
            <span className="text-[11px] font-medium text-accent/60 truncate">
              {primaryFramework.breed}
            </span>
          )}
          {passport.claimed && (
            <span className="inline-flex items-center rounded-md bg-accent/10 border border-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              Claimed
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {passport.description}
        </p>

        {/* Footer: Born + Regions + Assurance */}
        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Born date */}
            {bornDate && (
              <span className="text-[10px] text-muted-foreground/50">
                {bornDate}
              </span>
            )}

            {/* Region flags */}
            <div className="flex items-center gap-1">
              {(passport.regions || []).slice(0, 3).map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50"
                >
                  {REGION_FLAGS[r] || r.toUpperCase()}
                </span>
              ))}
              {(passport.regions || []).length > 3 && (
                <span className="text-[10px] text-muted-foreground/30">
                  +{passport.regions.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Assurance badge */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
            <Shield className="size-3 text-accent/40" />
            <span>{passport.assurance_level}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
