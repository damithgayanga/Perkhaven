import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Perk Haven | Financial Management",
  description: "Registers, occupancy, payments, payroll and financial management for The Perk Haven.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/perkhaven-logo-system.webp?brand=20260929-2",
    shortcut: "/perkhaven-logo-system.webp?brand=20260929-2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
