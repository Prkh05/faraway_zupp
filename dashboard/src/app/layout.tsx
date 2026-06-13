import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FireWatch AI — Fire Station Dashboard",
  description:
    "Real-time fire incident monitoring dashboard with AI-powered severity classification. View, triage, and manage citizen-reported fire incidents by priority.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
