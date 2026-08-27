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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Cabinet Grotesk (headlines) + Satoshi (body) from Fontshare, JetBrains
            Mono for identifiers and receipts. These were previously declared in
            CSS but never loaded, so every page fell back to a system font. */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f%5B%5D=cabinet-grotesk@700,800&f%5B%5D=satoshi@400,500,700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="antialiased"><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
