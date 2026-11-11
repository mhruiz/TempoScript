import type { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { LandingContent } from "@/components/landing/landing-content"
import { SiteHeader } from "@/components/site/site-header"
import { LANDING_CONTENT } from "@/lib/landing-content"
import { faqSchema } from "@/lib/structured-data"

const title = "TempoScript: guion con tiempos y notas de orador en Markdown"
const description =
  "Convierte un guion en Markdown en notas de orador con tiempos. Añade marcadores como ?05:00 a cada sección y no te pases de tiempo al presentar. Gratis, sin conexión y sin registro."

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: "/es",
    languages: { en: "/", es: "/es", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    url: "/es",
    title,
    description,
    siteName: "TempoScript",
    locale: "es_ES",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
}

export default function SpanishHome() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={faqSchema(LANDING_CONTENT.es.faq.items, "es")} />
      <div lang="es">
        <SiteHeader editorLabel="Abrir el editor" guideLabel="Guía" />
      </div>
      <LandingContent locale="es" editorHref="/" />
    </div>
  )
}
