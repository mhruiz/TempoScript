"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import { TimerControl } from "./timer-control"
import type { ContentBlock, PresentationState } from "@/types/presentation"
import { useInterval } from "@/hooks/use-interval"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card } from "@/components/ui/card"
import { Keyboard } from "lucide-react"

interface PresentationViewProps {
  blocks: ContentBlock[]
  onEnd: () => void
}

export function PresentationView({ blocks, onEnd }: PresentationViewProps) {
  const [state, setState] = useState<PresentationState>({
    currentBlockIndex: 0,
    isPlaying: false,
    totalElapsedTime: 0,
    blockElapsedTime: 0,
    parentElapsedTime: 0,
  })
  const [showShortcuts, setShowShortcuts] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const blockRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [lastDirection, setLastDirection] = useState<"forward" | "backward">("forward")

  const currentBlock = blocks[state.currentBlockIndex]
  const currentTime = currentBlock?.timeMarker?.time || 0
  const isNoTimeControl = currentBlock?.timeMarker?.noTimeControl || false

  // Find the top-level parent block
  const parentBlock = useMemo(() => {
    if (!currentBlock?.timeMarker) return null
    const currentLevel = currentBlock.timeMarker.level
    if (currentLevel <= 1) return null // No parent for level 1 blocks

    // Find the first level 1 block before the current block
    for (let i = state.currentBlockIndex - 1; i >= 0; i--) {
      const block = blocks[i]
      if (block.timeMarker && block.timeMarker.level === 1) {
        return block
      }
    }
    return null
  }, [blocks, state.currentBlockIndex, currentBlock])

  // Find the current top-level section ID
  const getCurrentTopLevelSectionId = useCallback(() => {
    if (!currentBlock?.timeMarker) return null

    // If current block is level 1, that's our section
    if (currentBlock.timeMarker.level === 1) {
      return state.currentBlockIndex
    }

    // Otherwise find the containing level 1 block
    for (let i = state.currentBlockIndex - 1; i >= 0; i--) {
      if (blocks[i].timeMarker?.level === 1) {
        return i
      }
    }
    return null
  }, [blocks, currentBlock, state.currentBlockIndex])

  // Track when top-level section changes
  const [lastTopLevelSectionId, setLastTopLevelSectionId] = useState<number | null>(null)

  useInterval(
    () => {
      setState((prev) => {
        const newBlockElapsedTime = prev.blockElapsedTime + 1
        const newParentElapsedTime = prev.parentElapsedTime + 1

        // Check if we should auto-advance to the next slide
        if (
          autoAdvance &&
          !isNoTimeControl &&
          currentTime > 0 &&
          newBlockElapsedTime >= currentTime &&
          prev.currentBlockIndex < blocks.length - 1
        ) {
          // We'll handle the advance in the next useEffect
          return {
            ...prev,
            totalElapsedTime: prev.totalElapsedTime + 1,
            blockElapsedTime: newBlockElapsedTime,
            parentElapsedTime: newParentElapsedTime,
            shouldAdvance: true,
          }
        }

        return {
          ...prev,
          totalElapsedTime: prev.totalElapsedTime + 1,
          blockElapsedTime: newBlockElapsedTime,
          parentElapsedTime: newParentElapsedTime,
        }
      })
    },
    state.isPlaying ? 1000 : null,
  )

  // Handle auto-advance
  useEffect(() => {
    if (state.shouldAdvance) {
      handleNext()
      setState((prev) => ({ ...prev, shouldAdvance: false }))
    }
  }, [state.shouldAdvance]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlay = () => setState((prev) => ({ ...prev, isPlaying: true }))
  const handlePause = () => setState((prev) => ({ ...prev, isPlaying: false }))
  const handleTogglePlay = () => setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))

  const handleNext = () => {
    if (state.currentBlockIndex < blocks.length - 1) {
      setLastDirection("forward")
      setState((prev) => {
        const currentTopLevelSectionId = getCurrentTopLevelSectionId()

        // Reset parent timer only when moving to a different top-level section
        const shouldResetParentTimer = currentTopLevelSectionId !== lastTopLevelSectionId

        if (shouldResetParentTimer) {
          setLastTopLevelSectionId(currentTopLevelSectionId)
        }

        return {
          ...prev,
          currentBlockIndex: prev.currentBlockIndex + 1,
          blockElapsedTime: 0,
          parentElapsedTime: shouldResetParentTimer ? 0 : prev.parentElapsedTime,
        }
      })
    }
  }

  const handlePrevious = () => {
    if (state.currentBlockIndex > 0) {
      setLastDirection("backward")
      setState((prev) => {
        const currentTopLevelSectionId = getCurrentTopLevelSectionId()

        // Get the previous block's top level section
        const prevIndex = prev.currentBlockIndex - 1
        let prevTopLevelSectionId = null

        // Find the containing level 1 block for the previous slide
        if (blocks[prevIndex]?.timeMarker?.level === 1) {
          prevTopLevelSectionId = prevIndex
        } else {
          for (let i = prevIndex - 1; i >= 0; i--) {
            if (blocks[i].timeMarker?.level === 1) {
              prevTopLevelSectionId = i
              break
            }
          }
        }

        // Reset parent timer only when moving to a different top-level section
        const shouldResetParentTimer = prevTopLevelSectionId !== currentTopLevelSectionId

        if (shouldResetParentTimer) {
          setLastTopLevelSectionId(prevTopLevelSectionId)
        }

        return {
          ...prev,
          currentBlockIndex: prevIndex,
          blockElapsedTime: 0,
          parentElapsedTime: shouldResetParentTimer ? 0 : prev.parentElapsedTime,
        }
      })
    }
  }

  // Add keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
        case "p":
          handleTogglePlay()
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
          onEnd()
          break
        case "h":
          setShowShortcuts((prev) => !prev)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [state.isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Improved scrolling logic to ensure the entire block is visible when possible
  useEffect(() => {
    const currentBlockElement = blockRefs.current[state.currentBlockIndex]
    if (!currentBlockElement || !containerRef.current) return

    // Get viewport height (minus some padding for controls)
    const viewportHeight = window.innerHeight - 200 // Subtract space for header and controls

    // Get block dimensions
    const blockRect = currentBlockElement.getBoundingClientRect()
    const blockHeight = blockRect.height

    // Determine if block can fit entirely in viewport
    const canFitEntireBlock = blockHeight <= viewportHeight

    // Determine scroll behavior based on block size and navigation direction
    if (canFitEntireBlock) {
      // If block fits, center it
      currentBlockElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    } else {
      // If block is too large to fit entirely
      if (lastDirection === "forward") {
        // When moving forward, align to top
        currentBlockElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      } else {
        // When moving backward, align to bottom
        currentBlockElement.scrollIntoView({
          behavior: "smooth",
          block: "end",
        })
      }
    }
  }, [state.currentBlockIndex, lastDirection])

  return (
    <div className="min-h-screen bg-background pb-24">
      {showShortcuts && (
        <Card className="fixed top-4 right-4 p-3 z-10 bg-background/80 backdrop-blur-sm border shadow-md">
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
              slide
            </li>
            <li>
              <kbd className="px-1 bg-muted rounded">←</kbd> or <kbd className="px-1 bg-muted rounded">B</kbd>: Previous
              slide
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

      <div ref={containerRef} className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
              TempoScript
            </h1>
            <ThemeToggle />
          </div>
        </div>

        <div className="prose max-w-none dark:prose-invert">
          {blocks.map((block, index) => (
            <div
              key={index}
              ref={(el) => (blockRefs.current[index] = el)}
              className={`transition-opacity duration-200 ${
                index === state.currentBlockIndex ? "opacity-100" : "opacity-30"
              }`}
            >
              <ReactMarkdown>{block.content}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>

      <TimerControl
        totalTime={blocks.reduce((acc, block) => acc + (block.timeMarker?.time || 0), 0)}
        blockTime={currentTime}
        totalElapsed={state.totalElapsedTime}
        blockElapsed={state.blockElapsedTime}
        isPlaying={state.isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onEnd={onEnd}
        noTimeControl={isNoTimeControl}
        parentTime={parentBlock?.timeMarker?.time}
        parentElapsed={state.parentElapsedTime}
        autoAdvance={autoAdvance}
        onAutoAdvanceChange={setAutoAdvance}
      />
    </div>
  )
}

