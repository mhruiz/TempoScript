"use client"

import { useState, useEffect, useMemo, type ReactNode } from "react"
import Link from "next/link"
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

interface EditorAppProps {
  /** Static page content shown below the editor. Hidden while presenting. */
  children?: ReactNode
}

export function EditorApp({ children }: EditorAppProps) {
  // Start from the example script so the server-rendered HTML already has content
  const [content, setContent] = useState(DEFAULT_MARKDOWN_CONTENT)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [isEditorExpanded, setIsEditorExpanded] = useState(false)
  const isMobile = useMediaQuery("(max-width: 1023px)")

  // Replace the example script with the user's saved one after hydration
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem(STORAGE_KEY)
      if (savedContent) {
        setContent(savedContent)
      }
    } catch {
      // Storage can be unavailable (private mode, blocked site data)
    }
    setHasLoaded(true)
  }, [])

  // Save on every change, but only once the saved script has been read,
  // so the example never overwrites it
  useEffect(() => {
    if (!hasLoaded || !content) return
    try {
      localStorage.setItem(STORAGE_KEY, content)
    } catch {
      // Ignore: the script still works for this session
    }
  }, [content, hasLoaded])

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
    <div id="top" className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
              TempoScript
            </p>
            <ThemeToggle />
          </div>
          <Button
            onClick={handleStartPresentation}
            disabled={errors.length > 0}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
          >
            Start Presentation
          </Button>
        </header>

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

          <div className="flex items-center justify-end gap-2 mt-4">
            <nav aria-label="Help" className="mr-auto flex gap-4 text-sm text-muted-foreground">
              <a href="#about" className="hover:text-foreground hover:underline">
                What is TempoScript?
              </a>
              <Link href="/guide" className="hover:text-foreground hover:underline">
                Guide
              </Link>
            </nav>
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
      {children}
    </div>
  )
}

