import type { MetadataRoute } from "next"
import { BASE_URL } from "@/lib/config"

const languages = {
  en: `${BASE_URL}/`,
  es: `${BASE_URL}/es`,
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/`,
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages },
    },
    {
      url: `${BASE_URL}/es`,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: { languages },
    },
    {
      url: `${BASE_URL}/guide`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
