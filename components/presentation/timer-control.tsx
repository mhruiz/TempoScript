"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipForward, SkipBack, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { formatTime } from "@/lib/presentation"

interface TimerControlProps {
  /** Planned length of the whole script, in seconds. 0 when nothing is timed. */
  totalTime: number
  blockTime: number
  totalElapsed: number
  blockElapsed: number
  isPlaying: boolean
  isFirst: boolean
  isLast: boolean
  /** Current section number out of the total, e.g. "3/12". */
  position: string
  noTimeControl?: boolean
  parentTime?: number
  parentElapsed?: number
  autoAdvance: boolean
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrevious: () => void
  onEnd: () => void
  onAutoAdvanceChange: (value: boolean) => void
}

export function TimerControl({
  totalTime,
  blockTime,
  totalElapsed,
  blockElapsed,
  isPlaying,
  isFirst,
  isLast,
  position,
  noTimeControl = false,
  parentTime,
  parentElapsed,
  autoAdvance,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onEnd,
  onAutoAdvanceChange,
}: TimerControlProps) {
  const hasBlockLimit = !noTimeControl && blockTime > 0
  const blockProgress = hasBlockLimit ? Math.min(100, (blockElapsed / blockTime) * 100) : 100
  const isOvertime = hasBlockLimit && blockElapsed > blockTime
  const isParentOvertime = parentTime !== undefined && (parentElapsed || 0) > parentTime
  const isTotalOvertime = totalTime > 0 && totalElapsed > totalTime

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
      <div className="container mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch id="auto-advance" checked={autoAdvance} onCheckedChange={onAutoAdvanceChange} />
            <Label htmlFor="auto-advance" className="text-sm">
              Auto-advance
            </Label>
          </div>
          <div className="flex items-center gap-4 text-sm tabular-nums">
            <span className="text-muted-foreground">Section {position}</span>
            <span className={isTotalOvertime ? "font-semibold text-destructive" : ""}>
              Total: {formatTime(totalElapsed)}
              {totalTime > 0 && `/${formatTime(totalTime)}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="mb-2 space-y-1 tabular-nums">
              <span className={`text-sm block ${isOvertime ? "font-semibold text-destructive" : ""}`}>
                Block: {formatTime(blockElapsed)}
                {hasBlockLimit && `/${formatTime(blockTime)}`}
                {isOvertime && ` (+${formatTime(blockElapsed - blockTime)})`}
              </span>
              {parentTime !== undefined && (
                <span className={`text-sm block ${isParentOvertime ? "text-destructive" : "text-muted-foreground"}`}>
                  Parent: {formatTime(parentElapsed || 0)}/{formatTime(parentTime)}
                </span>
              )}
            </div>
            <Progress
              value={blockProgress}
              aria-label="Time used in this section"
              className={`h-2 ${isOvertime ? "animate-pulse bg-destructive" : noTimeControl ? "bg-muted" : ""}`}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={onPrevious} disabled={isFirst} aria-label="Previous section">
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant={isPlaying ? "outline" : "default"}
              size="icon"
              onClick={isPlaying ? onPause : onPlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className={!isPlaying ? "bg-primary animate-pulse" : ""}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button variant="outline" size="icon" onClick={onNext} disabled={isLast} aria-label="Next section">
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button variant="destructive" size="icon" onClick={onEnd} aria-label="Exit presentation">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
