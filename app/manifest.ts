import type { MetadataRoute } from "next"
import { DESCRIPTION, SITE_NAME } from "@/lib/config"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: DESCRIPTION,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "en",
    categories: ["productivity", "utilities", "education"],
    theme_color: "#16181d",
    background_color: "#16181d",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  }
}
