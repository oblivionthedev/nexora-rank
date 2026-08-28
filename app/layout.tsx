import type { Metadata } from "next";
import "./globals.css";
import "./onboarding.css";
import "./status.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://nexorarank.tech"),
  title: { default: "Nexora Rank — Opening Soon", template: "%s · Nexora Rank" },
  description: "Nexora Rank is opening soon. A calmer, safer way to run your Roblox community is on the way.",
  icons: {
    icon: [{ url: "/nexora-discord-logo.png", type: "image/png" }],
    shortcut: "/nexora-discord-logo.png",
    apple: "/nexora-discord-logo.png",
  },
  applicationName: "Nexora Rank",
  other: { "codex-preview": "development" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Nexora Rank",
    title: "Nexora Rank — Opening Soon",
    description: "A calmer, safer way to run your Roblox community is on the way.",
  },
  twitter: { card: "summary", title: "Nexora Rank — Opening Soon", description: "A calmer, safer way to run your Roblox community is on the way." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className="antialiased"><ThemeProvider>{children}</ThemeProvider></body></html>;
}
