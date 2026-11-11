import Link from "next/link"
import { REPO_URL } from "@/lib/config"
import { LANDING_CONTENT, type Locale } from "@/lib/landing-content"

interface LandingContentProps {
  locale: Locale
  /** Where the hero button leads: the editor on this page or the home page. */
  editorHref: string
}

const sectionTitle = "text-2xl font-bold tracking-tight"
const muted = "text-muted-foreground"

export function LandingContent({ locale, editorHref }: LandingContentProps) {
  const t = LANDING_CONTENT[locale]
  const otherLocaleHref = locale === "en" ? "/es" : "/"

  return (
    <div lang={locale} className="border-t bg-muted/30">
      <main id="about" className="container mx-auto max-w-4xl scroll-mt-6 space-y-16 px-6 py-16">
        <section className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.hero.title}</h1>
          <p className={`text-lg ${muted}`}>{t.hero.lead}</p>
          <ul className="grid gap-2 sm:grid-cols-3">
            {t.hero.highlights.map((highlight) => (
              <li key={highlight} className="rounded-lg border bg-background p-4 text-sm font-medium">
                {highlight}
              </li>
            ))}
          </ul>
          <a
            href={editorHref}
            className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.hero.cta}
          </a>
        </section>

        <section className="space-y-6">
          <h2 className={sectionTitle}>{t.how.title}</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {t.how.steps.map((step, index) => (
              <li key={step.title} className="rounded-lg border bg-background p-5">
                <span className={`text-sm font-semibold ${muted}`}>{index + 1}</span>
                <h3 className="mt-1 font-semibold">{step.title}</h3>
                <p className={`mt-2 text-sm ${muted}`}>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-6">
          <h2 className={sectionTitle}>{t.syntax.title}</h2>
          <p className={muted}>{t.syntax.intro}</p>
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t.syntax.columns[0]}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t.syntax.columns[1]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {t.syntax.rows.map((row) => (
                  <tr key={row.marker} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{row.marker}</code>
                    </td>
                    <td className="px-4 py-3">{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="font-semibold">{t.syntax.rulesTitle}</h3>
          <ul className={`list-disc space-y-1 pl-5 text-sm ${muted}`}>
            {t.syntax.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <p>
            <Link href="/guide" className="text-sm font-medium underline underline-offset-4">
              {t.syntax.guideLink}
            </Link>
          </p>
        </section>

        <section className="space-y-6">
          <h2 className={sectionTitle}>{t.useCases.title}</h2>
          <p className={muted}>{t.useCases.intro}</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {t.useCases.items.map((item) => (
              <li key={item.title} className="rounded-lg border bg-background p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className={`mt-2 text-sm ${muted}`}>{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className={sectionTitle}>{t.privacy.title}</h2>
          {t.privacy.paragraphs.map((paragraph) => (
            <p key={paragraph} className={muted}>
              {paragraph}
            </p>
          ))}
        </section>

        <section className="space-y-6">
          <h2 className={sectionTitle}>{t.faq.title}</h2>
          <dl className="space-y-6">
            {t.faq.items.map((item) => (
              <div key={item.question}>
                <dt className="font-semibold">{item.question}</dt>
                <dd className={`mt-2 ${muted}`}>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="border-t">
        <div className={`container mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm ${muted}`}>
          <span>TempoScript</span>
          <nav aria-label="Footer" className="flex gap-5">
            <Link href="/guide" className="hover:text-foreground hover:underline">
              {t.footer.guide}
            </Link>
            <a href={REPO_URL} className="hover:text-foreground hover:underline" rel="noopener">
              {t.footer.source}
            </a>
            <Link
              href={otherLocaleHref}
              hrefLang={locale === "en" ? "es" : "en"}
              className="hover:text-foreground hover:underline"
            >
              {t.footer.otherLocale}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
