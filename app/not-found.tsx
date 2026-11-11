import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/site/site-header"

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-4xl space-y-4 px-6 py-24 text-center">
        <p className="text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="text-3xl font-bold tracking-tight">This page does not exist</h1>
        <p className="text-muted-foreground">The link may be old or mistyped. Your script is still safe in the editor.</p>
        <p className="flex justify-center gap-5 pt-2 text-sm font-medium">
          <Link href="/" className="underline underline-offset-4">
            Open the editor
          </Link>
          <Link href="/guide" className="underline underline-offset-4">
            Read the guide
          </Link>
        </p>
      </main>
    </div>
  )
}
