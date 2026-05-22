import { buildMetadata, ogImageUrl, SITE } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Create an AI Agent Passport for Claude Code, Cursor & MCP — aport.id",
  description:
    "Register your AI agent and get a passport plus setup key in 60 seconds. No account required. Works with Claude Code, Cursor, OpenClaw, MCP, and custom agents.",
  path: "/create",
  ogImage: ogImageUrl("create"),
});

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Create an AI Agent Passport",
    url: `${SITE.url}/create`,
    description:
      "Register your AI agent and get a passport plus setup key in 60 seconds for APort guardrails and audit.",
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    potentialAction: {
      "@type": "CreateAction",
      name: "Create AI Agent Passport",
      target: `${SITE.url}/create`,
    },
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
