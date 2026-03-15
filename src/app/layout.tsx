import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeAtlas",
  description: "A minimal local-first workspace for repository indexing and Q&A.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
