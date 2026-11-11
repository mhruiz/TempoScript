import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { REPO_URL } from "@/lib/config"

interface SiteHeaderProps {
  editorLabel?: string
  guideLabel?: string
}

/** Header for the static pages. The editor has its own. */
export function SiteHeader({ editorLabel = "Open the editor", guideLabel = "Guide" }: SiteHeaderProps) {
  return (
    <header className="container mx-auto flex max-w-4xl items-center justify-between gap-4 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent"
        >
          TempoScript
        </Link>
        <ThemeToggle />
      </div>
      <nav aria-label="Main" className="flex items-center gap-5 text-sm">
        <Link href="/guide" className="hidden text-muted-foreground hover:text-foreground hover:underline sm:inline">
          {guideLabel}
        </Link>
        <a
          href={REPO_URL}
          rel="noopener"
          className="hidden text-muted-foreground hover:text-foreground hover:underline sm:inline"
        >
          GitHub
        </a>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90"
        >
          {editorLabel}
        </Link>
      </nav>
    </header>
  )
}
