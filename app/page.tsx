"use client"

import { useState, useEffect, useMemo } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info, Maximize2 } from "lucide-react"
import { CodeEditor } from "@/components/editor/code-editor"
import { Preview } from "@/components/editor/preview"
import { PresentationView } from "@/components/presentation/presentation-view"
import { parseContent } from "@/lib/time-marker"
import { DEFAULT_MARKDOWN_CONTENT } from "@/lib/constants"
import type { ValidationError } from "@/types/presentation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useMediaQuery } from "@/hooks/use-media-query"

const STORAGE_KEY = "temposcript-content"

export default function Home() {
  const [content, setContent] = useState("")
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [isEditorExpanded, setIsEditorExpanded] = useState(false)
  const isMobile = useMediaQuery("(max-width: 1023px)")

  // Load content from localStorage on initial render
  useEffect(() => {
    // Only access localStorage in the browser environment
    if (typeof window !== "undefined") {
      const savedContent = localStorage.getItem(STORAGE_KEY)
      setContent(savedContent || DEFAULT_MARKDOWN_CONTENT)
    } else {
      // Set default content for server-side rendering
      setContent(DEFAULT_MARKDOWN_CONTENT)
    }
  }, [])

  // Save content to localStorage whenever it changes
  useEffect(() => {
    if (content && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, content)
    }
  }, [content])

  const blocks = useMemo(() => parseContent(content), [content])

  const handleStartPresentation = () => {
    if (errors.length === 0) {
      setIsPresentationMode(true)
    }
  }

  const handleExpandEditor = () => {
    setIsEditorExpanded(true)
  }

  const handleCollapseEditor = () => {
    setIsEditorExpanded(false)
  }

  // Determine editor height based on mode and screen size
  const getEditorHeight = () => {
    if (isMobile) {
      return isEditorExpanded ? "h-[80vh]" : "h-[50vh]"
    } else {
      return "h-[calc(100vh-12rem)]"
    }
  }

  if (isPresentationMode) {
    return <PresentationView blocks={blocks} onEnd={() => setIsPresentationMode(false)} />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
              TempoScript
            </h1>
            <ThemeToggle />
          </div>
          <Button
            onClick={handleStartPresentation}
            disabled={errors.length > 0}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
          >
            Start Presentation
          </Button>
        </div>

        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {errors.map((error, index) => (
                  <li key={index}>
                    Line {error.line + 1}: {error.message}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isMobile ? "" : "h-[calc(100vh-12rem)]"}`}>
            <div className={`${getEditorHeight()} ${isEditorExpanded ? "col-span-2" : ""} transition-all duration-300`}>
              <CodeEditor
                value={content}
                onChange={setContent}
                onValidationChange={setErrors}
                errors={errors}
                isExpanded={isEditorExpanded}
                onExpand={handleExpandEditor}
                onCollapse={handleCollapseEditor}
              />
            </div>
            {!isEditorExpanded && (
              <div className={isMobile ? "" : "h-[calc(100vh-12rem)]"}>
                <Preview content={content} isMobileView={isMobile} />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Maximize2 className="h-4 w-4" />
                  <span className="sr-only">Editor expansion information</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-80">
                <p className="text-sm">Double-click on the editor to expand it to full width</p>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Time marker information</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="max-w-md p-4 w-80">
                <div className="space-y-2">
                  <p className="text-sm font-bold">Time Marker Guide</p>
                  <p className="text-sm">Time markers control the timing of your presentation:</p>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>
                      <code>?10:00</code> - Level 1 marker (10 minutes)
                    </li>
                    <li>
                      <code>??03:00</code> - Level 2 marker (3 minutes)
                    </li>
                    <li>
                      <code>???00:45</code> - Level 3 marker (45 seconds)
                    </li>
                    <li>
                      <code>?!!</code> - Section with no time control
                    </li>
                    <li>
                      <code>??!!</code> - Nested section with no time control
                    </li>
                  </ul>
                  <p className="text-sm font-bold">Rules</p>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>Seconds must be multiples of 5</li>
                    <li>Nested markers must have one more ? than their parent</li>
                    <li>Child markers cannot exceed parent time</li>
                  </ul>
                  <p className="text-sm font-bold mt-2">Editor Tips</p>
                  <ul className="text-sm list-disc pl-4">
                    <li>Double-click on the editor to expand it to full width</li>
                    <li>Press Esc or click outside to exit expanded mode</li>
                  </ul>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  )
}

