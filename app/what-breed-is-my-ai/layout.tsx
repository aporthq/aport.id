import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "What Breed Is My AI? — aport.id",
  description:
    "Every AI model has a personality. GPT-5? Bernese Mountain Dog. Claude Opus? Border Collie. Grok? Jack Russell Terrier. Find your AI's breed.",
  path: "/what-breed-is-my-ai",
});

export default function BreedQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add JSON-LD for this page (ItemList schema)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI Model Breed Guide",
    description: "Every AI model mapped to a dog breed based on personality",
    url: "https://aport.id/what-breed-is-my-ai",
    numberOfItems: 28, // update as needed
    itemListElement: [], // we'll let the page handle the visual part
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
