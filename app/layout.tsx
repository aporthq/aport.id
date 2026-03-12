import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "aport.id — Give Your Agent an ID",
  description:
    "Every agent deserves a name, an origin, and an identity it can carry anywhere. Create a real APort passport in 60 seconds.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://aport.id"
  ),
  openGraph: {
    title: "aport.id — Give Your Agent an ID",
    description:
      "Every agent deserves a name, an origin, and an identity it can carry anywhere.",
    siteName: "aport.id",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "aport.id — Give Your Agent an ID",
    description:
      "Every agent deserves a name, an origin, and an identity it can carry anywhere.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
