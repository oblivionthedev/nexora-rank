import type { Metadata } from "next";
import "./globals.css";
import "./home.css";
import "./onboarding.css";
import "./status.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://nexorarank.tech"),
  title: { default: "Nexora Rank — Roblox Community Operations", template: "%s · Nexora Rank" },
  description: "Manage Roblox community ranking, staff activity, applications, sessions, automations, and Discord operations from one secure workspace.",
  icons: {
    icon: [{ url: "/nexora-discord-logo.png", type: "image/png" }],
    shortcut: "/nexora-discord-logo.png",
    apple: "/nexora-discord-logo.png",
  },
  applicationName: "Nexora Rank",
  other: { "codex-preview": "production" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Nexora Rank",
    title: "Nexora Rank — Roblox Community Operations",
    description: "Ranking, activity, applications, sessions, automations, and Discord operations in one secure workspace.",
  },
  twitter: { card: "summary", title: "Nexora Rank — Roblox Community Operations", description: "Run your Roblox community from one secure, auditable workspace." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className="antialiased"><ThemeProvider>{children}</ThemeProvider></body></html>;
}
