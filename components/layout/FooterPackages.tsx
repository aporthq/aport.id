"use client";

import { useState } from "react";
import { PACKAGES, CATEGORIES, type APortPackage } from "@/lib/config/packages";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function PackagePill({
  pkg,
  isSelected,
  onClick,
}: {
  pkg: APortPackage;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-mono transition-all",
        isSelected
          ? "bg-accent/10 border-accent/20 text-accent"
          : "bg-white/[0.03] border-white/[0.05] text-muted-foreground/40 hover:text-muted-foreground hover:border-white/[0.1]",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full shrink-0",
          pkg.registry === "npm" ? "bg-red-400/60" : "bg-blue-400/60",
        )}
      />
      {pkg.name}
    </button>
  );
}

function PackageDetail({ pkg }: { pkg: APortPackage }) {
  const [copied, setCopied] = useState<"install" | "snippet" | null>(null);

  const copy = (text: string, type: "install" | "snippet") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in text-left max-w-md mx-auto">
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground/80">
            {pkg.description}
          </p>
          <a
            href={pkg.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-[11px] font-mono text-muted-foreground/40 hover:text-accent transition-colors"
          >
            {pkg.packageName}
            <ExternalLink className="size-2.5" />
          </a>
        </div>
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            pkg.registry === "npm"
              ? "bg-red-500/10 text-red-400/70"
              : "bg-blue-500/10 text-blue-400/70",
          )}
        >
          {pkg.registry}
        </span>
      </div>

      {/* Install */}
      <div className="border-t border-white/[0.04] px-4 py-2.5 flex items-center justify-between gap-2">
        <code className="text-[11px] font-mono text-muted-foreground/60 truncate">
          {pkg.install}
        </code>
        <button
          onClick={() => copy(pkg.install, "install")}
          className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
          title="Copy install command"
        >
          {copied === "install" ? (
            <Check className="size-3 text-accent" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
      </div>

      {/* Snippet */}
      <div className="border-t border-white/[0.04] px-4 py-3 relative group">
        <button
          onClick={() => copy(pkg.snippet, "snippet")}
          className="absolute top-2 right-3 text-muted-foreground/30 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
          title="Copy code"
        >
          {copied === "snippet" ? (
            <Check className="size-3 text-accent" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
        <pre className="text-[11px] font-mono text-muted-foreground/50 leading-relaxed whitespace-pre-wrap overflow-x-auto">
          {pkg.snippet}
        </pre>
      </div>
    </div>
  );
}

export function FooterPackages() {
  const [selected, setSelected] = useState<APortPackage | null>(null);

  return (
    <div className="pt-8 border-t border-white/[0.04]">
      {CATEGORIES.map((cat) => {
        const pkgs = PACKAGES.filter((p) => p.category === cat.key);
        if (!pkgs.length) return null;
        return (
          <div key={cat.key} className="mb-4 last:mb-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/25 mb-2.5 font-medium">
              {cat.label}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {pkgs.map((pkg) => (
                <PackagePill
                  key={pkg.packageName}
                  pkg={pkg}
                  isSelected={selected?.packageName === pkg.packageName}
                  onClick={() =>
                    setSelected(
                      selected?.packageName === pkg.packageName ? null : pkg,
                    )
                  }
                />
              ))}
            </div>
          </div>
        );
      })}

      {selected && <PackageDetail pkg={selected} />}
    </div>
  );
}
