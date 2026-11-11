"use client"

import { useState, useMemo, useCallback, useEffect, useReducer, useRef } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import { TimerControl } from "./timer-control"
import type { ContentBlock } from "@/types/presentation"
import { useInterval } from "@/hooks/use-interval"
import {
  buildModel,
  initialTimerState,
  selectView,
  timerReducer,
  type TimerAction,
  type TimerState,
} from "@/lib/presentation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AArrowDown, AArrowUp, Keyboard, Maximize, Minimize } from "lucide-react"

const markdownComponents: Components = {
  code({ node: _node, className: _className, children, ...props }) {
    return (
      <code
        className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-[0.875em] text-gray-900 dark:text-gray-100"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre({ node: _node, ...props }) {
    return <pre className="bg-gray-200 dark:bg-gray-800 p-3 rounded my-3 overflow-auto dark:text-gray-100" {...props} />
  },
}

const TEXT_SIZES = ["prose-sm", "prose-base", "prose-lg", "prose-xl", "prose-2xl"] as const
const DEFAULT_TEXT_SIZE = 1
const TEXT_SIZE_KEY = "temposcript-text-size"
const TICK_MS = 250

interface PresentationViewProps {
  blocks: ContentBlock[]
  onEnd: () => void
}

export function PresentationView({ blocks, onEnd }: PresentationViewProps) {
  // All timing lives in the reducer in lib/presentation.ts
  const model = useMemo(() => buildModel(blocks), [blocks])
  const [state, dispatch] = useReducer(
    (current: TimerState, action: TimerAction) => timerReducer(model, current, action),
    model,
    initialTimerState,
  )
  const view = selectView(model, state)
  const [showShortcuts, setShowShortcuts] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [textSize, setTextSize] = useState(DEFAULT_TEXT_SIZE)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastDirection, setLastDirection] = useState<"forward" | "backward">("forward")
  const blockRefs = useRef<(HTMLDivElement | null)[]>([])

  const move = useCallback((step: 1 | -1) => {
    setLastDirection(step === 1 ? "forward" : "backward")
    dispatch({ type: "move", step, now: Date.now() })
  }, [])
  const handleNext = useCallback(() => move(1), [move])
  const handlePrevious = useCallback(() => move(-1), [move])
  const togglePlay = useCallback(() => dispatch({ type: "toggle", now: Date.now() }), [])

  // Each tick counts the real time since the last one, so the timers stay
  // correct when the browser slows them down in a background tab
  useInterval(
    () => dispatch({ type: "tick", now: Date.now(), autoAdvance }),
    state.isPlaying ? TICK_MS : null,
  )

  // Count the time up to now as soon as the tab is visible again,
  // instead of waiting for the next tick
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        dispatch({ type: "tick", now: Date.now(), autoAdvance })
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [autoAdvance])

  // Text size: remember the choice between presentations
  useEffect(() => {
    try {
      const saved = Number.parseInt(localStorage.getItem(TEXT_SIZE_KEY) ?? "", 10)
      if (saved >= 0 && saved < TEXT_SIZES.length) setTextSize(saved)
    } catch {
      // Storage unavailable: keep the default size
    }
  }, [])

  const changeTextSize = useCallback((step: 1 | -1) => {
    setTextSize((prev) => {
      const next = Math.min(TEXT_SIZES.length - 1, Math.max(0, prev + step))
      try {
        localStorage.setItem(TEXT_SIZE_KEY, String(next))
      } catch {
        // Ignore: the size still applies to this presentation
      }
      return next
    })
  }, [])

  // Fullscreen
  const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement !== null)
    document.addEventListener("fullscreenchange", handleChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleChange)
      // Leave fullscreen when the presentation ends
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [])

  // Keep the screen awake while presenting, where the browser supports it
  useEffect(() => {
    if (!("wakeLock" in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        const sentinel = await navigator.wakeLock.request("screen")
        if (cancelled) {
          sentinel.release().catch(() => {})
        } else {
          lock = sentinel
        }
      } catch {
        // The browser refused (battery saver, hidden tab): nothing to do
      }
    }
    // The lock is dropped when the tab is hidden; take it again when it returns
    const handleVisibility = () => {
      if (document.visibilityState === "visible") acquire()
    }

    acquire()
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", handleVisibility)
      lock?.release().catch(() => {})
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Holding a key down must not skip sections or flicker play/pause
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return

      const target = e.target as HTMLElement | null
      const onControl = target?.closest("button, a, input, [role='switch']") != null
      // Space and Enter on a focused control already activate it
      if (onControl && (e.key === " " || e.key === "Enter")) return

      switch (e.key.length === 1 ? e.key.toLowerCase() : e.key) {
        case " ":
          e.preventDefault()
          togglePlay()
          break
        case "p":
          togglePlay()
          break
        case "ArrowRight":
        case "n":
          handleNext()
          break
        case "ArrowLeft":
        case "b":
          handlePrevious()
          break
        case "Escape":
          // In fullscreen the browser uses Esc to leave fullscreen first
          if (!document.fullscreenElement) onEnd()
          break
        case "h":
          setShowShortcuts((prev) => !prev)
          break
        case "f":
          toggleFullscreen()
          break
        case "+":
        case "=":
          changeTextSize(1)
          break
        case "-":
          changeTextSize(-1)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [togglePlay, handleNext, handlePrevious, onEnd, toggleFullscreen, changeTextSize])

  // Keep the current block in view
  useEffect(() => {
    const currentBlockElement = blockRefs.current[view.blockIndex]
    if (!currentBlockElement) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth"

    // Leave room for the header and the timer bar
    const viewportHeight = window.innerHeight - 200
    const fitsInViewport = currentBlockElement.getBoundingClientRect().height <= viewportHeight

    if (fitsInViewport) {
      currentBlockElement.scrollIntoView({ behavior, block: "center" })
    } else {
      // A long block: show its start when moving forward, its end when moving back
      currentBlockElement.scrollIntoView({ behavior, block: lastDirection === "forward" ? "start" : "end" })
    }
  }, [view.blockIndex, lastDirection, textSize])

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Shown only on devices with a mouse or trackpad: touch screens have no keyboard */}
      {showShortcuts && (
        <Card className="fixed top-20 right-4 p-3 z-10 hidden bg-background/80 backdrop-blur-sm border shadow-md [@media(hover:hover)_and_(pointer:fine)]:block">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard className="h-4 w-4" />
            <span className="text-sm font-medium">Keyboard Shortcuts</span>
          </div>
          <ul className="text-xs space-y-1">
            <li>
              <kbd className="px-1 bg-muted rounded">Space</kbd> or <kbd className="px-1 bg-muted rounded">P</kbd>:
              Play/Pause
            </li>
            <li>
              <kbd className="px-1 bg-muted rounded">→</kbd> or <kbd className="px-1 bg-muted rounded">N</kbd>: Next
              section
            </li>
            <li>
              <kbd className="px-1 bg-muted rounded">←</kbd> or <kbd className="px-1 bg-muted rounded">B</kbd>: Previous
              section
            </li>
            <li>
              <kbd className="px-1 bg-muted rounded">F</kbd>: Fullscreen
            </li>
            <li>
              <kbd className="px-1 bg-muted rounded">+</kbd> / <kbd className="px-1 bg-muted rounded">-</kbd>: Text size
            </li>
            <li>
              <kbd className="px-1 bg-muted rounded">Esc</kbd>: Exit presentation
            </li>
            <li>
              <kbd className="px-1 bg-muted rounded">H</kbd>: Toggle this help
            </li>
          </ul>
        </Card>
      )}

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
              TempoScript
            </p>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Smaller text"
              disabled={textSize === 0}
              onClick={() => changeTextSize(-1)}
            >
              <AArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Larger text"
              disabled={textSize === TEXT_SIZES.length - 1}
              onClick={() => changeTextSize(1)}
            >
              <AArrowUp className="h-4 w-4" />
            </Button>
            {canFullscreen && (
              <Button
                variant="outline"
                size="icon"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
        <div className={`max-w-none prose dark:prose-invert ${TEXT_SIZES[textSize]}`}>
          {model.steps.map((index) => (
            <div
              key={index}
              ref={(el) => {
                blockRefs.current[index] = el
              }}
              aria-current={index === view.blockIndex ? "step" : undefined}
              className={`transition-opacity duration-200 ${
                index === view.blockIndex ? "opacity-100" : "opacity-30"
              }`}
            >
              <ReactMarkdown components={markdownComponents}>{blocks[index].content}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>

      <TimerControl
        view={view}
        isPlaying={state.isPlaying}
        onPlayPause={togglePlay}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onEnd={onEnd}
        autoAdvance={autoAdvance}
        onAutoAdvanceChange={setAutoAdvance}
      />
    </div>
  )
}
