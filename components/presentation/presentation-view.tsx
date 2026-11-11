"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import { TimerControl } from "./timer-control"
import type { ContentBlock } from "@/types/presentation"
import { useInterval } from "@/hooks/use-interval"
import { plannedTotalSeconds, topLevelIndex } from "@/lib/presentation"
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

interface TimerState {
  currentBlockIndex: number
  isPlaying: boolean
  // Elapsed times in milliseconds
  totalElapsed: number
  blockElapsed: number
  parentElapsed: number
}

interface PresentationViewProps {
  blocks: ContentBlock[]
  onEnd: () => void
}

export function PresentationView({ blocks, onEnd }: PresentationViewProps) {
  const [state, setState] = useState<TimerState>({
    currentBlockIndex: 0,
    isPlaying: false,
    totalElapsed: 0,
    blockElapsed: 0,
    parentElapsed: 0,
  })
  const [showShortcuts, setShowShortcuts] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [textSize, setTextSize] = useState(DEFAULT_TEXT_SIZE)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastDirection, setLastDirection] = useState<"forward" | "backward">("forward")
  const blockRefs = useRef<(HTMLDivElement | null)[]>([])
  const lastTickRef = useRef(0)

  const totalTime = useMemo(() => plannedTotalSeconds(blocks), [blocks])

  const currentBlock = blocks[state.currentBlockIndex]
  const currentTime = currentBlock?.timeMarker?.time || 0
  const isNoTimeControl = currentBlock?.timeMarker?.noTimeControl || false

  // The top-level block that contains the current nested block
  const parentBlock = useMemo(() => {
    if (!currentBlock?.timeMarker || currentBlock.timeMarker.level <= 1) return null
    const parentIndex = topLevelIndex(blocks, state.currentBlockIndex)
    return parentIndex === null ? null : blocks[parentIndex]
  }, [blocks, state.currentBlockIndex, currentBlock])

  // Move by `step` blocks. The parent timer restarts only when the move
  // crosses into a different top-level section.
  const move = useCallback(
    (step: 1 | -1) => {
      setLastDirection(step === 1 ? "forward" : "backward")
      setState((prev) => {
        const nextIndex = prev.currentBlockIndex + step
        if (nextIndex < 0 || nextIndex >= blocks.length) return prev
        const sameSection = topLevelIndex(blocks, nextIndex) === topLevelIndex(blocks, prev.currentBlockIndex)
        return {
          ...prev,
          currentBlockIndex: nextIndex,
          blockElapsed: 0,
          parentElapsed: sameSection ? prev.parentElapsed : 0,
        }
      })
    },
    [blocks],
  )

  const handleNext = useCallback(() => move(1), [move])
  const handlePrevious = useCallback(() => move(-1), [move])

  const setPlaying = useCallback((isPlaying: boolean | ((prev: boolean) => boolean)) => {
    setState((prev) => {
      const next = typeof isPlaying === "function" ? isPlaying(prev.isPlaying) : isPlaying
      if (next === prev.isPlaying) return prev
      if (next) lastTickRef.current = Date.now()
      return { ...prev, isPlaying: next }
    })
  }, [])

  // Advance the timers by the real time that has passed since the last tick,
  // so they stay correct when the browser slows timers in a background tab
  useInterval(
    () => {
      const now = Date.now()
      const delta = Math.max(0, now - lastTickRef.current)
      lastTickRef.current = now

      setState((prev) => {
        if (!prev.isPlaying) return prev
        const blockElapsed = prev.blockElapsed + delta
        const next = {
          ...prev,
          totalElapsed: prev.totalElapsed + delta,
          blockElapsed,
          parentElapsed: prev.parentElapsed + delta,
        }

        const block = blocks[prev.currentBlockIndex]
        const blockTime = block?.timeMarker?.time ?? 0
        const shouldAdvance =
          autoAdvance &&
          !block?.timeMarker?.noTimeControl &&
          blockTime > 0 &&
          blockElapsed >= blockTime * 1000 &&
          prev.currentBlockIndex < blocks.length - 1

        if (!shouldAdvance) return next

        const nextIndex = prev.currentBlockIndex + 1
        const sameSection = topLevelIndex(blocks, nextIndex) === topLevelIndex(blocks, prev.currentBlockIndex)
        return {
          ...next,
          currentBlockIndex: nextIndex,
          blockElapsed: 0,
          parentElapsed: sameSection ? next.parentElapsed : 0,
        }
      })
    },
    state.isPlaying ? TICK_MS : null,
  )

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
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const target = e.target as HTMLElement | null
      const onControl = target?.closest("button, a, input, [role='switch']") != null
      // Space and Enter on a focused control already activate it
      if (onControl && (e.key === " " || e.key === "Enter")) return

      switch (e.key.length === 1 ? e.key.toLowerCase() : e.key) {
        case " ":
          e.preventDefault()
          setPlaying((prev) => !prev)
          break
        case "p":
          setPlaying((prev) => !prev)
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
  }, [setPlaying, handleNext, handlePrevious, onEnd, toggleFullscreen, changeTextSize])

  // Keep the current block in view
  useEffect(() => {
    const currentBlockElement = blockRefs.current[state.currentBlockIndex]
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
  }, [state.currentBlockIndex, lastDirection, textSize])

  return (
    <div className="min-h-screen bg-background pb-40">
      {showShortcuts && (
        <Card className="fixed top-20 right-4 p-3 z-10 hidden bg-background/80 backdrop-blur-sm border shadow-md sm:block">
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
          {blocks.map((block, index) => (
            <div
              key={index}
              ref={(el) => {
                blockRefs.current[index] = el
              }}
              aria-current={index === state.currentBlockIndex ? "step" : undefined}
              className={`transition-opacity duration-200 ${
                index === state.currentBlockIndex ? "opacity-100" : "opacity-30"
              }`}
            >
              <ReactMarkdown components={markdownComponents}>{block.content}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>

      <TimerControl
        totalTime={totalTime}
        blockTime={currentTime}
        totalElapsed={Math.floor(state.totalElapsed / 1000)}
        blockElapsed={Math.floor(state.blockElapsed / 1000)}
        isPlaying={state.isPlaying}
        isFirst={state.currentBlockIndex === 0}
        isLast={state.currentBlockIndex === blocks.length - 1}
        position={`${state.currentBlockIndex + 1}/${blocks.length}`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onEnd={onEnd}
        noTimeControl={isNoTimeControl}
        parentTime={parentBlock?.timeMarker?.noTimeControl ? undefined : parentBlock?.timeMarker?.time}
        parentElapsed={Math.floor(state.parentElapsed / 1000)}
        autoAdvance={autoAdvance}
        onAutoAdvanceChange={setAutoAdvance}
      />
    </div>
  )
}
