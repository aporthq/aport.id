/**
 * SEO utilities — single source of truth for all metadata, JSON-LD,
 * and OG configuration across the site.
 *
 * Every page imports from here. Nothing is hardcoded elsewhere.
 */

import type { Metadata } from "next";

// ─── Site constants ─────────────────────────────────────────────────────────

export const SITE = {
  name: "aport.id",
  title: "aport.id - Give Your Agent an ID",
  description:
    "Every agent deserves a name, an origin, and an identity it can carry anywhere. Create a real APort passport in 60 seconds.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://aport.id",
  twitter: "@aport_io",
  locale: "en_US",
  themeColor: "#06b6d4",
} as const;

// ─── OG image URLs ──────────────────────────────────────────────────────────

export function ogImageUrl(
  page: "home" | "gallery" | "passport" | "create" | "manage",
  slugOrId?: string,
): string {
  if (page === "passport" && slugOrId) {
    return `${SITE.url}/api/passport/${slugOrId}/og.png`;
  }
  return `${SITE.url}/api/og.png?page=${page}`;
}

// ─── Metadata builder ───────────────────────────────────────────────────────

interface PageMeta {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

/**
 * Build a complete Next.js Metadata object with OG, Twitter, canonical,
 * and all the bells. Merges with defaults from SITE constants.
 */
export function buildMetadata(page: PageMeta = {}): Metadata {
  const title = page.title || SITE.title;
  const description = page.description || SITE.description;
  const canonical = page.path ? `${SITE.url}${page.path}` : SITE.url;
  const image = page.ogImage || ogImageUrl("home");

  return {
    title,
    description,
    metadataBase: new URL(SITE.url),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      siteName: SITE.name,
      type: "website",
      url: canonical,
      locale: SITE.locale,
      images: [
        {
          url: image,
          width: 1200,
          height: 628,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE.twitter,
      title,
      description,
      images: [image],
    },
    robots: page.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large" as const },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: "/logo.svg",
    },
    manifest: "/site.webmanifest",
    other: {
      "theme-color": SITE.themeColor,
    },
  };
}

// ─── JSON-LD generators ─────────────────────────────────────────────────────

/** Organization — appears on every page via layout */
export function jsonLdOrganization(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "APort",
    url: SITE.url,
    logo: `${SITE.url}/icon.svg`,
    sameAs: [
      "https://github.com/aporthq",
      "https://x.com/aport_io",
      "https://aport.io",
    ],
    description: SITE.description,
  };
}

/** WebSite with SearchAction — enables sitelinks search box in Google */
export function jsonLdWebSite(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    publisher: { "@type": "Organization", name: "APort" },
  };
}

/** SoftwareApplication — for the home page (the product itself) */
export function jsonLdSoftwareApp(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "APort ID",
    url: SITE.url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    description:
      "Issue verifiable DID-compliant identity passports for AI agents in 60 seconds.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/** CollectionPage — for the gallery */
export function jsonLdGallery(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI Agent Gallery — aport.id",
    url: `${SITE.url}/gallery`,
    description:
      "Browse verified AI agents with APort passports. Every agent has a real, portable DID credential.",
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
  };
}

// Note: Passport page JSON-LD is injected by Cloudflare middleware
// (functions/passport/[id]/_middleware.ts) since passport pages are
// dynamic and can't use Next.js static metadata.
