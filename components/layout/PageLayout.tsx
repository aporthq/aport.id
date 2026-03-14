"use client";

/**
 * Shared page layout — ambient glow, header, footer
 *
 * Used by Home and Gallery pages. Passport page keeps its
 * own Shell since it has different nav context (back arrow,
 * narrower width, no GitHub link).
 */

import { cn } from "@/lib/utils";
import { FooterPackages } from "./FooterPackages";
import { apiConfig } from "@/lib/config/api";

// ─── Ambient background ──────────────────────────────────────────────────────

function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      <div
        className="absolute -top-[35%] -right-[15%] h-[900px] w-[900px] rounded-full animate-glow-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute -bottom-[25%] -left-[10%] h-[700px] w-[700px] rounded-full animate-glow-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 65%)",
          animationDelay: "3s",
        }}
      />
      <div
        className="absolute top-[40%] -left-[15%] h-[500px] w-[500px] rounded-full animate-glow-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.03) 0%, transparent 65%)",
          animationDelay: "5s",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

interface HeaderProps {
  currentPage?: "home" | "gallery" | "create" | "manage";
}

function Header({ currentPage = "home" }: HeaderProps) {
  return (
    <nav className="flex items-center justify-between pt-6 sm:pt-8 pb-4 sm:pb-6">
      <a
        href="/"
        className="text-sm font-semibold tracking-tight text-foreground/80 hover:text-foreground transition-colors"
      >
        aport.id
      </a>
      <div className="flex items-center gap-4 sm:gap-5 text-sm text-muted-foreground">
        {currentPage !== "home" && currentPage !== "create" && (
          <a
            href="/create"
            className="transition-colors hover:text-foreground"
          >
            Create
          </a>
        )}
        <a
          href="/gallery"
          className={cn(
            "transition-colors hover:text-foreground",
            currentPage === "gallery" && "text-foreground",
          )}
        >
          Gallery
        </a>
        <a
          href="/manage"
          className={cn(
            "transition-colors hover:text-foreground",
            currentPage === "manage" && "text-foreground",
          )}
        >
          Manage
        </a>
        <a
          href="/what-breed-is-my-ai"
          className="transition-colors hover:text-foreground"
        >
          Breeds
        </a>
        <a
          href="https://aport.io"
          className="hidden sm:block transition-colors hover:text-foreground"
        >
          Platform
        </a>
        <a
          href="https://github.com/aporthq"
          className="hidden sm:block transition-colors hover:text-foreground"
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="pb-8 sm:pb-10 text-center space-y-6">
      <FooterPackages />

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/30">
        <a
          href={apiConfig.aportDomain}
          className="hover:text-muted-foreground transition-colors"
        >
          aport.io
        </a>
        <span>·</span>
        <a
          href="https://github.com/aporthq"
          className="hover:text-muted-foreground transition-colors"
        >
          GitHub
        </a>
        <span>·</span>
        <a
          href="https://x.com/aport_io"
          className="hover:text-muted-foreground transition-colors"
        >
          X
        </a>
      </div>
    </footer>
  );
}

// ─── Page Layout ─────────────────────────────────────────────────────────────

interface PageLayoutProps {
  children: React.ReactNode;
  /** Max content width — "narrow" (600px) for home, "wide" (1120px) for gallery */
  maxWidth?: "narrow" | "wide";
  /** Current page for header active state */
  currentPage?: "home" | "gallery" | "create" | "manage";
}

export function PageLayout({
  children,
  maxWidth = "narrow",
  currentPage = "home",
}: PageLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AmbientBackground />

      <main
        className={cn(
          "relative z-10 mx-auto px-4 sm:px-6",
          maxWidth === "narrow" ? "max-w-[720px]" : "max-w-[1120px]",
        )}
      >
        <Header currentPage={currentPage} />
        {children}
        <Footer />
      </main>
    </div>
  );
}
