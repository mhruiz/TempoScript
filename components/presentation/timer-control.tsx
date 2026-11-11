"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipForward, SkipBack, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { formatTime, type Clock, type TimerView } from "@/lib/presentation"

interface TimerControlProps {
  view: TimerView
  isPlaying: boolean
  autoAdvance: boolean
  onPlayPause: () => void
  onNext: () => void
  onPrevious: () => void
  onEnd: () => void
  onAutoAdvanceChange: (value: boolean) => void
}

function clockText({ elapsed, limit, overtime }: Clock) {
  if (limit === null) return formatTime(elapsed)
  const over = overtime && elapsed > limit ? ` (+${formatTime(elapsed - limit)})` : ""
  return `${formatTime(elapsed)}/${formatTime(limit)}${over}`
}

export function TimerControl({
  view,
  isPlaying,
  autoAdvance,
  onPlayPause,
  onNext,
  onPrevious,
  onEnd,
  onAutoAdvanceChange,
}: TimerControlProps) {
  const { block, parents, total } = view
  const blockProgress = block.limit === null ? 100 : Math.min(100, (block.elapsed / block.limit) * 100)

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
            <span className="text-muted-foreground">
              Section {view.position}/{view.stepCount}
            </span>
            <span className={total.overtime ? "font-semibold text-destructive" : ""}>Total: {clockText(total)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="mb-2 space-y-1 tabular-nums">
              <span className={`text-sm block ${block.overtime ? "font-semibold text-destructive" : ""}`}>
                Block: {clockText(block)}
              </span>
              {parents.map((parent) => (
                <span
                  key={parent.level}
                  className={`text-sm block ${parent.overtime ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {parents.length > 1 ? `Parent (level ${parent.level})` : "Parent"}: {clockText(parent)}
                </span>
              ))}
            </div>
            <Progress
              value={blockProgress}
              aria-label="Time used in this section"
              className={`h-2 ${block.overtime ? "animate-pulse bg-destructive" : block.limit === null ? "bg-muted" : ""}`}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onPrevious}
              disabled={view.isFirst}
              aria-label="Previous section"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant={isPlaying ? "outline" : "default"}
              size="icon"
              onClick={onPlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              className={!isPlaying ? "bg-primary animate-pulse" : ""}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button variant="outline" size="icon" onClick={onNext} disabled={view.isLast} aria-label="Next section">
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
