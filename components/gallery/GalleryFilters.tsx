"use client";

/**
 * Gallery filter bar — role pills, region pills, search input
 *
 * All filter state is managed by the parent via props.
 */

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useRef } from "react";

const ROLE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "agent", label: "Agents" },
  { value: "assistant", label: "Assistants" },
  { value: "tool", label: "Tools" },
  { value: "service", label: "Services" },
];

const REGION_OPTIONS = [
  { value: "all", label: "All" },
  { value: "global", label: "Global" },
  { value: "us", label: "US" },
  { value: "eu", label: "EU" },
  { value: "ca", label: "CA" },
  { value: "ap", label: "AP" },
];

interface GalleryFiltersProps {
  role: string;
  region: string;
  search: string;
  onRoleChange: (role: string) => void;
  onRegionChange: (region: string) => void;
  onSearchChange: (search: string) => void;
  total: number;
}

export function GalleryFilters({
  role,
  region,
  search,
  onRoleChange,
  onRegionChange,
  onSearchChange,
  total,
}: GalleryFiltersProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search bar */}
      <div className="relative">
        <div className="flex items-stretch">
          <span className="inline-flex items-center rounded-l-xl border border-r-0 border-white/[0.08] bg-white/[0.04] px-3 sm:px-3.5 text-muted-foreground/40 select-none pointer-events-none">
            <Search className="size-4" />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search agents..."
            className="form-input flex-1 text-sm"
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderLeft: "none",
            }}
            autoComplete="off"
          />
          {search && (
            <button
              onClick={() => {
                onSearchChange("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/[0.08] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter pills row */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Role pills */}
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onRoleChange(opt.value)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
              role === opt.value
                ? "bg-accent/15 text-accent border border-accent/20 shadow-sm shadow-accent/5"
                : "bg-white/[0.04] text-muted-foreground border border-transparent hover:bg-white/[0.08] hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}

        {/* Separator */}
        <div className="w-px h-5 bg-white/[0.08] shrink-0" />

        {/* Region pills */}
        {REGION_OPTIONS.map((opt) => (
          <button
            key={`region-${opt.value}`}
            onClick={() => onRegionChange(opt.value)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
              region === opt.value
                ? "bg-accent/15 text-accent border border-accent/20 shadow-sm shadow-accent/5"
                : "bg-white/[0.04] text-muted-foreground border border-transparent hover:bg-white/[0.08] hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}

        {/* Count — always visible at end */}
        <span className="text-xs text-muted-foreground/40 shrink-0 pl-2">
          {total} {total === 1 ? "agent" : "agents"}
        </span>
      </div>
    </div>
  );
}
