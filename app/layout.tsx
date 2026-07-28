import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://jacobegarcia.github.io/motionprint-lab/";
const socialImage = `${siteUrl}og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    url: siteUrl,
    type: "website",
    images: [
      {
        url: socialImage,
        width: 1536,
        height: 1024,
        alt: "Motionprint interactive animation research prototype",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Motionprint — Human Gesture to Animation Language",
    description: "An interactive research prototype by Jacob E. Garcia.",
    images: [socialImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
