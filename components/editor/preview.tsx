"use client"

import { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import { Card } from "@/components/ui/card"
import { parseTimeMarker } from "@/lib/time-marker"

interface PreviewProps {
  content: string
  isMobileView?: boolean
}

export function Preview({ content, isMobileView = false }: PreviewProps) {
  const processedContent = useMemo(() => {
    return content
      .split("\n")
      .filter((line) => {
        // Filter out both time markers and ?!! markers
        if (line.trim().startsWith("?")) {
          const isTimeMarker = parseTimeMarker(line)
          const isControlMarker = /^\?+!!/.test(line.trim())
          return !(isTimeMarker || isControlMarker)
        }
        return true
      })
      .join("\n")
  }, [content])

  return (
    <Card className={`h-full w-full ${isMobileView ? "overflow-visible" : "overflow-auto"} p-6 bg-card`}>
      <div className="markdown-preview prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{processedContent}</ReactMarkdown>
      </div>
    </Card>
  )
}

