import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "distribution — where to post your side-project",
  description:
    "An open registry of communities where AI builders ship and share. Telegram, Reddit, Discord, dev directories. Updated by the community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-bg text-fg">{children}</body>
    </html>
  );
}
