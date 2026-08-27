import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://nexorarank.tech"),
  title: { default: "Nexora Rank — Identity & Operations for Roblox Communities", template: "%s · Nexora Rank" },
  description: "Connect Discord and Roblox identities, then run ranking, activity, applications, and automation from one trusted workspace.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  applicationName: "Nexora Rank",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Nexora Rank",
    title: "Nexora Rank — Identity & Operations for Roblox Communities",
    description: "Connect Discord and Roblox identities, ranking, activity, and automation in one trusted workspace.",
  },
  twitter: { card: "summary", title: "Nexora Rank", description: "Identity and operations for Roblox communities." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className="antialiased"><ThemeProvider>{children}</ThemeProvider></body></html>;
}
