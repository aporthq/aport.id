import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "AI Model Breeds — aport.id",
  description: "Every AI model has a personality. Discover which dog breed matches your AI model.",
  path: "/breed",
});

export default function BreedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
