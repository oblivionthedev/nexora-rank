import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: { default: "Nexora Rank — Opening Soon", template: "%s · Nexora Rank" },
  description: "Nexora Rank is opening soon. A calmer, safer way to run your Roblox community is on the way.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  applicationName: "Nexora Rank",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className="antialiased"><ThemeProvider>{children}</ThemeProvider></body></html>;
}
