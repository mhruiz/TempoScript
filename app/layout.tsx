import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "@/app/globals.css"

export const metadata = {
  title: "TempoScript: Guided Markdown Presentations",
  description:
    "Create timed, cue-based presentations from your Markdown scripts. TempoScript is a minimalist web app for guided performances, perfect when traditional presentation tools aren't an option.",
  keywords:
    "markdown, presentation, timed, cue-based, performance, web app, minimalist, guided",
  metadataBase: new URL("https://www.temposcript.com"),
  openGraph: {
    type: "website",
    url: "https://www.temposcript.com",
    title: "TempoScript: Guided Markdown Presentations",
    description:
      "Discover TempoScript – a minimalist web app that transforms your Markdown presentation script into a guided, timed performance. Ideal for cue-based presentations when traditional tools aren't available.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TempoScript Preview",
      },
    ],
    siteName: "TempoScript",
  },
  twitter: {
    card: "summary_large_image",
    title: "TempoScript: Guided Markdown Presentations",
    description:
      "Discover TempoScript – a minimalist web app that transforms your Markdown presentation script into a guided, timed performance. Ideal for cue-based presentations when traditional tools aren't available.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5bbad5" }],
  },
  manifest: "/site.webmanifest",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'