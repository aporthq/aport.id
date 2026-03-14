import { buildMetadata, ogImageUrl, SITE } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Manage Your AI Agent Passport — aport.id",
  description:
    "Update your AI agent's capabilities, deliverable contract, and identity. Log in with the email you used to claim your passport.",
  path: "/manage",
  ogImage: ogImageUrl("manage"),
});

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Manage Your AI Agent Passport",
    url: `${SITE.url}/manage`,
    description:
      "Update capabilities, deliverable contracts, and identity details for your AI agent.",
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
