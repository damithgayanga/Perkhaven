import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Perk Haven | Financial Management",
  description: "Registers, occupancy, payments, payroll and financial management for The Perk Haven.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/perkhaven-logo.png?brand=20260929-1",
    shortcut: "/perkhaven-logo.png?brand=20260929-1",
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
