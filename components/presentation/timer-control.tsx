"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipForward, SkipBack, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface TimerControlProps {
  totalTime: number
  blockTime: number
  totalElapsed: number
  blockElapsed: number
  isPlaying: boolean
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
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const blockProgress = noTimeControl ? 100 : (blockElapsed / blockTime) * 100
  const isOvertime = !noTimeControl && blockElapsed > blockTime

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
      <div className="container mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch id="auto-advance" checked={autoAdvance} onCheckedChange={onAutoAdvanceChange} />
            <Label htmlFor="auto-advance" className="text-sm">
              Auto-advance slides
            </Label>
          </div>
          <span className="text-sm">Total: {formatTime(totalElapsed)}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <div className="space-y-1">
                <span className="text-sm block">
                  Block: {formatTime(blockElapsed)}
                  {!noTimeControl && `/${formatTime(blockTime)}`}
                </span>
                {parentTime !== undefined && (
                  <span className="text-sm text-muted-foreground block">
                    Parent: {formatTime(parentElapsed || 0)}/{formatTime(parentTime)}
                  </span>
                )}
              </div>
            </div>
            <Progress
              value={blockProgress}
              className={`h-2 ${isOvertime ? "animate-pulse bg-destructive" : noTimeControl ? "bg-muted" : ""}`}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={onPrevious}>
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant={isPlaying ? "outline" : "default"}
              size="icon"
              onClick={isPlaying ? onPause : onPlay}
              className={!isPlaying ? "bg-primary animate-pulse" : ""}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button variant="outline" size="icon" onClick={onNext}>
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button variant="destructive" size="icon" onClick={onEnd}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

