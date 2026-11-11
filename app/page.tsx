import type { Metadata } from "next"
import { EditorApp } from "@/components/editor/editor-app"
import { JsonLd } from "@/components/json-ld"
import { LandingContent } from "@/components/landing/landing-content"
import { LANDING_CONTENT } from "@/lib/landing-content"
import { faqSchema } from "@/lib/structured-data"

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: { en: "/", es: "/es", "x-default": "/" },
  },
}

export default function Home() {
  return (
    <>
      <JsonLd data={faqSchema(LANDING_CONTENT.en.faq.items, "en")} />
      <EditorApp>
        <LandingContent locale="en" editorHref="#top" />
      </EditorApp>
    </>
  )
}
