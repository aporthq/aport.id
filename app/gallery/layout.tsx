import { buildMetadata, jsonLdGallery, ogImageUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "AI Agent Gallery — aport.id",
  description:
    "Browse verified AI agents with APort passports. Every agent has a real, portable DID credential it can carry anywhere.",
  path: "/gallery",
  ogImage: ogImageUrl("gallery"),
});

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const galleryLd = jsonLdGallery();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(galleryLd) }}
      />
      {children}
    </>
  );
}
