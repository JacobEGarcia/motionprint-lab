import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const base = host ? `${protocol}://${host}` : "https://motionprint-lab.pages.dev";

  return {
    metadataBase: new URL(base),
    title: "Motionprint — Human Gesture to Animation Language",
    description:
      "An interactive animation research prototype that transforms human gesture, rhythm, and imperfection into expressive character motion.",
    authors: [{ name: "Jacob E. Garcia" }],
    keywords: [
      "creative technology",
      "character animation",
      "motion design",
      "computer graphics",
      "human-computer interaction",
      "research prototype",
    ],
    openGraph: {
      title: "Motionprint — What if a character moved like you?",
      description:
        "Draw a gesture, choose a point of view, and watch human imperfection become expressive motion.",
      type: "website",
      images: [{ url: `${base}/og.png`, width: 1536, height: 1024, alt: "Motionprint interactive animation research prototype" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Motionprint — Human Gesture to Animation Language",
      description:
        "An interactive research prototype by Jacob E. Garcia.",
      images: [`${base}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
