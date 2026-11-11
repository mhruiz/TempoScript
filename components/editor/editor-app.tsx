"use client"

import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle, Info, Maximize2 } from "lucide-react"
import { CodeEditor } from "@/components/editor/code-editor"
import { EditorToolbar } from "@/components/editor/editor-toolbar"
import { Preview } from "@/components/editor/preview"
import { PresentationView } from "@/components/presentation/presentation-view"
import { parseContent, validateTimeMarkers } from "@/lib/time-marker"
import { decodeScriptFromHash, encodeScriptToHash } from "@/lib/share"
import { DEFAULT_MARKDOWN_CONTENT } from "@/lib/constants"
import { REPO_URL } from "@/lib/config"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useMediaQuery } from "@/hooks/use-media-query"
import { toast } from "@/hooks/use-toast"

const STORAGE_KEY = "temposcript-content"

interface PendingReplace {
  content: string
  title: string
  description: string
  confirmLabel: string
}

interface EditorAppProps {
  /** Static page content shown below the editor. Hidden while presenting. */
  children?: ReactNode
}

function exportFileName(content: string) {
  const heading = content.match(/^#{1,6}\s+(.+)$/m)?.[1] ?? ""
  const slug = heading
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  return `${slug || "temposcript-script"}.md`
}

export function EditorApp({ children }: EditorAppProps) {
  // Start from the example script so the server-rendered HTML already has content
  const [content, setContent] = useState(DEFAULT_MARKDOWN_CONTENT)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [pendingReplace, setPendingReplace] = useState<PendingReplace | null>(null)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [isEditorExpanded, setIsEditorExpanded] = useState(false)
  const isMobile = useMediaQuery("(max-width: 1023px)")

  // Latest script, readable from event handlers that outlive a render
  const contentRef = useRef(content)
  useEffect(() => {
    contentRef.current = content
  }, [content])

  // Load the saved script after hydration, then look for a shared one in the URL.
  // The URL is checked again on hashchange: pasting a share link into a tab that
  // already has the app open does not reload the page.
  useEffect(() => {
    let cancelled = false
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {
      // Storage can be unavailable (private mode, blocked site data)
    }
    if (saved) {
      setContent(saved)
      contentRef.current = saved
    }
    setHasLoaded(true)

    const openSharedScript = async () => {
      const hash = window.location.hash
      if (!hash.startsWith("#s=")) return
      const shared = await decodeScriptFromHash(hash)
      if (cancelled) return
      // Drop the fragment so a reload does not offer the shared script again
      window.history.replaceState(null, "", window.location.pathname + window.location.search)
      if (shared === null) {
        toast({
          variant: "destructive",
          title: "This link is damaged",
          description: "The shared script could not be read. Ask for the link again.",
        })
        return
      }
      const current = contentRef.current
      if (shared === current) return
      if (current.trim() === "" || current === DEFAULT_MARKDOWN_CONTENT) {
        setContent(shared)
        toast({ title: "Shared script opened" })
        return
      }
      setPendingReplace({
        content: shared,
        title: "Open the shared script?",
        description: "This link contains a script. Opening it replaces the script you have in the editor now.",
        confirmLabel: "Open shared script",
      })
    }

    openSharedScript()
    window.addEventListener("hashchange", openSharedScript)
    return () => {
      cancelled = true
      window.removeEventListener("hashchange", openSharedScript)
    }
  }, [])

  // Save on every change, but only once the saved script has been read,
  // so the example never overwrites it
  useEffect(() => {
    if (!hasLoaded) return
    try {
      localStorage.setItem(STORAGE_KEY, content)
    } catch {
      // Ignore: the script still works for this session
    }
  }, [content, hasLoaded])

  const errors = useMemo(() => validateTimeMarkers(content), [content])
  const blocks = useMemo(() => parseContent(content), [content])
  const canPresent = errors.length === 0 && blocks.length > 0

  // Replace the script, asking first if that would discard the user's own work
  const requestReplace = useCallback(
    (replacement: PendingReplace) => {
      if (replacement.content === content) return
      if (content.trim() === "" || content === DEFAULT_MARKDOWN_CONTENT) {
        setContent(replacement.content)
        return
      }
      setPendingReplace(replacement)
    },
    [content],
  )

  const handleImport = (text: string, fileName: string) => {
    requestReplace({
      content: text.replace(/\r\n?/g, "\n"),
      title: `Replace your script with ${fileName}?`,
      description: "Importing a file replaces the script you have in the editor now. Export it first if you want to keep it.",
      confirmLabel: "Replace script",
    })
  }

  const handleExport = () => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = exportFileName(content)
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    try {
      const hash = await encodeScriptToHash(content)
      const url = `${window.location.origin}/#${hash}`
      await navigator.clipboard.writeText(url)
      toast({
        title: "Link copied",
        description:
          url.length > 8000
            ? "The script is inside the link. It is long, so some apps may cut it. Export the file if it does not open."
            : "The script is inside the link itself. Anyone with the link can read it.",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Could not copy the link",
        description: "Your browser blocked access to the clipboard. Use Export instead.",
      })
    }
  }

  const handleReset = () => {
    requestReplace({
      content: DEFAULT_MARKDOWN_CONTENT,
      title: "Load the example script?",
      description: "This replaces the script you have in the editor now. Export it first if you want to keep it.",
      confirmLabel: "Load example",
    })
  }

  // Determine editor height based on mode and screen size
  const getEditorHeight = () => {
    if (isMobile) {
      return isEditorExpanded ? "h-[80vh]" : "h-[50vh]"
    } else {
      return "h-[calc(100vh-15rem)]"
    }
  }

  if (isPresentationMode) {
    return <PresentationView blocks={blocks} onEnd={() => setIsPresentationMode(false)} />
  }

  return (
    <div id="top" className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <header className="flex justify-between items-center gap-3 mb-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Image src="/favicon.svg" alt="" width={32} height={32} className="h-8 w-8 rounded-md" priority />
            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
              TempoScript
            </p>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-5">
            <nav aria-label="Main" className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
              <Link href="/guide" className="hover:text-foreground hover:underline">
                Guide
              </Link>
              <a href={REPO_URL} rel="noopener" className="hover:text-foreground hover:underline">
                GitHub
              </a>
            </nav>
            <Button
              onClick={() => setIsPresentationMode(true)}
              disabled={!canPresent}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
            >
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">Start Presentation</span>
            </Button>
          </div>
        </header>

        <EditorToolbar
          onImport={handleImport}
          onImportError={() =>
            toast({
              variant: "destructive",
              title: "Could not import the file",
              description: "Choose a Markdown or plain text file smaller than 2 MB.",
            })
          }
          onExport={handleExport}
          onShare={handleShare}
          onReset={handleReset}
        />

        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {errors.length === 0 && blocks.length === 0 && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>No timed sections yet</AlertTitle>
            <AlertDescription>
              Add a time marker such as <code>?05:00</code> on its own line before a section to start presenting.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isMobile ? "" : "h-[calc(100vh-15rem)]"}`}>
            <div className={`${getEditorHeight()} ${isEditorExpanded ? "col-span-2" : ""} transition-all duration-300`}>
              <CodeEditor
                value={content}
                onChange={setContent}
                errors={errors}
                isExpanded={isEditorExpanded}
                onExpand={() => setIsEditorExpanded(true)}
                onCollapse={() => setIsEditorExpanded(false)}
              />
            </div>
            {!isEditorExpanded && (
              <div className={isMobile ? "" : "h-[calc(100vh-15rem)]"}>
                <Preview content={content} isMobileView={isMobile} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <nav aria-label="Help" className="mr-auto flex gap-4 text-sm text-muted-foreground">
              <a href="#about" className="hover:text-foreground hover:underline">
                What is TempoScript?
              </a>
              <Link href="/guide" className="hover:text-foreground hover:underline sm:hidden">
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

      <AlertDialog open={pendingReplace !== null} onOpenChange={(open) => !open && setPendingReplace(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingReplace?.title}</AlertDialogTitle>
            <AlertDialogDescription>{pendingReplace?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my script</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingReplace) setContent(pendingReplace.content)
              }}
            >
              {pendingReplace?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {children}
    </div>
  )
}
