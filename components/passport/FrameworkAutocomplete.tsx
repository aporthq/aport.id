"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { FRAMEWORK_OPTIONS, type FrameworkOption } from "@/lib/config/breeds";
import { BreedImage } from "@/components/breed/BreedImage";
import { prefetchBreedImages } from "@/lib/hooks/useBreedImage";
import { X, Search, Plus } from "lucide-react";

interface FrameworkAutocompleteProps {
  value: string[];
  onChange: (frameworkIds: string[]) => void;
  disabled?: boolean;
  className?: string;
}

/** Resolve a framework ID to display info — supports custom entries */
function resolveFramework(id: string): FrameworkOption {
  const known = FRAMEWORK_OPTIONS.find((f) => f.id === id);
  if (known) return known;
  const other = FRAMEWORK_OPTIONS.find((f) => f.id === "other")!;
  return { ...other, id, name: id };
}

export function FrameworkAutocomplete({
  value,
  onChange,
  disabled = false,
  className,
}: FrameworkAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Prefetch images for visible options on mount
  useEffect(() => {
    prefetchBreedImages(FRAMEWORK_OPTIONS.slice(0, 12).map((f) => f.imageApi));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = normalizedQuery
    ? FRAMEWORK_OPTIONS.filter(
        (f) =>
          !value.includes(f.id) &&
          (f.name.toLowerCase().includes(normalizedQuery) ||
            f.breed.toLowerCase().includes(normalizedQuery) ||
            f.provider.toLowerCase().includes(normalizedQuery))
      )
    : FRAMEWORK_OPTIONS.filter((f) => !value.includes(f.id));

  const queryMatchesExact = normalizedQuery
    ? FRAMEWORK_OPTIONS.some((f) => f.name.toLowerCase() === normalizedQuery)
    : false;
  const showCustomOption =
    normalizedQuery.length >= 2 &&
    !queryMatchesExact &&
    !value.includes(query.trim());

  const totalOptions = filtered.length + (showCustomOption ? 1 : 0);

  const selectedFrameworks = value.map((id) => resolveFramework(id));

  const select = useCallback(
    (id: string) => {
      if (!value.includes(id)) onChange([...value, id]);
      setQuery("");
      setOpen(false);
      setHighlightedIndex(0);
    },
    [value, onChange]
  );

  const addCustom = useCallback(() => {
    const custom = query.trim();
    if (custom && !value.includes(custom)) {
      onChange([...value, custom]);
    }
    setQuery("");
    setOpen(false);
    setHighlightedIndex(0);
  }, [query, value, onChange]);

  const remove = useCallback(
    (id: string) => onChange(value.filter((v) => v !== id)),
    [value, onChange]
  );

  useEffect(() => {
    if (open) setHighlightedIndex(0);
  }, [open, query]);

  useEffect(() => {
    if (totalOptions === 0) return;
    setHighlightedIndex((i) =>
      i >= totalOptions ? totalOptions - 1 : i < 0 ? 0 : i
    );
  }, [totalOptions]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && e.key !== "Escape" && e.key !== "Backspace") {
      setOpen(true);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, totalOptions - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex < filtered.length) {
          select(filtered[highlightedIndex].id);
        } else if (showCustomOption) {
          addCustom();
        }
        break;
      case "Escape":
        setOpen(false);
        setQuery("");
        break;
      case "Backspace":
        if (!query && value.length > 0) remove(value[value.length - 1]);
        break;
    }
  };

  const handleBlur = useCallback(() => {
    setTimeout(() => setOpen(false), 150);
  }, []);

  const primary = selectedFrameworks[0];

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-foreground/70">
        Model / Framework
      </label>

      {/* Selected chips */}
      {selectedFrameworks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id, i) => {
            const fw = selectedFrameworks[i];
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent"
              >
                <BreedImage imageApi={fw.imageApi} breed={fw.breed} size="sm" className="size-4" />
                {fw.name}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="rounded p-0.5 hover:bg-accent/20 transition-colors"
                  aria-label={`Remove ${fw.name}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Breed label with image — the viral personality element */}
      {primary && (
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
          <BreedImage imageApi={primary.imageApi} breed={primary.breed} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-accent/90">
              {primary.breed}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {primary.breedDescription}
            </p>
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="flex items-stretch">
        <span className="inline-flex items-center rounded-l-[var(--radius)] border border-r-0 border-[var(--border)] bg-white/[0.06] px-3 text-muted-foreground/50 select-none pointer-events-none">
          <Search className="size-4" />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            value.length === 0
              ? "GPT-5, Claude Opus, Gemini, or type your own..."
              : "Add another model..."
          }
          className="form-input"
          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: "none" }}
          autoComplete="off"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={open ? "framework-listbox" : undefined}
        />
      </div>

      {/* Dropdown */}
      {open && totalOptions > 0 && (
        <div className="relative">
          <ul
            ref={listRef}
            id="framework-listbox"
            role="listbox"
            className="absolute z-50 -mt-0.5 w-full max-h-72 overflow-auto rounded-xl border border-white/[0.08] bg-popover backdrop-blur-2xl py-1 shadow-xl shadow-black/30"
          >
            {filtered.map((fw, i) => (
              <li
                key={fw.id}
                role="option"
                aria-selected={i === highlightedIndex}
                className={cn(
                  "cursor-pointer mx-1 rounded-lg px-3 py-2.5 transition-colors",
                  i === highlightedIndex
                    ? "bg-white/[0.08]"
                    : "hover:bg-white/[0.04]"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(fw.id);
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
              >
                <div className="flex items-center gap-3">
                  <BreedImage imageApi={fw.imageApi} breed={fw.breed} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {fw.name}
                      </span>
                      <span className="text-xs font-medium text-accent shrink-0">
                        {fw.breed}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fw.breedDescription}
                    </p>
                  </div>
                </div>
              </li>
            ))}

            {/* Custom model option */}
            {showCustomOption && (
              <li
                role="option"
                aria-selected={highlightedIndex === filtered.length}
                className={cn(
                  "cursor-pointer mx-1 rounded-lg px-3 py-2.5 transition-colors border-t border-white/[0.04]",
                  highlightedIndex === filtered.length
                    ? "bg-white/[0.08]"
                    : "hover:bg-white/[0.04]"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addCustom();
                }}
                onMouseEnter={() => setHighlightedIndex(filtered.length)}
              >
                <div className="flex items-center gap-2">
                  <Plus className="size-3.5 text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    Add &ldquo;{query.trim()}&rdquo;
                  </span>
                  <span className="text-xs text-muted-foreground/50 ml-auto">
                    Mixed Breed
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 pl-[22px]">
                  Origin unknown, character undeniable
                </p>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
