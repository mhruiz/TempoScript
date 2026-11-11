import { BASE_URL, DESCRIPTION, REPO_URL, SITE_NAME } from "@/lib/config"

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: BASE_URL,
  description: DESCRIPTION,
  inLanguage: ["en", "es"],
}

export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: BASE_URL,
  description: DESCRIPTION,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Presentation software",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript. Works in current versions of Chrome, Edge, Firefox and Safari.",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Markdown editor with live preview",
    "Time markers that set a duration for each section of a script",
    "Nested sections with their own time budget",
    "Untimed sections for questions and asides",
    "Presentation mode that highlights the current section",
    "Timers for total, section and parent section time",
    "Overtime warning",
    "Optional automatic advance to the next section",
    "Keyboard shortcuts",
    "Works offline and installs as a progressive web app",
    "Scripts stored only in the browser",
  ],
  screenshot: `${BASE_URL}/opengraph-image`,
  sameAs: [REPO_URL],
}

export function faqSchema(items: { question: string; answer: string }[], inLanguage: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}
