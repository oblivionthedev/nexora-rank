import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: { default: "Nexora Rank — Identity & Operations for Roblox Communities", template: "%s · Nexora Rank" },
  description: "Connect Discord and Roblox identities, then run ranking, activity, applications, and automation from one trusted workspace.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  applicationName: "Nexora Rank",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className="antialiased"><ThemeProvider>{children}</ThemeProvider></body></html>;
}
