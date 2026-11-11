import type { ContentBlock } from "@/types/presentation"

/** Index of the top-level (level 1) block that contains the block at `index`, or null. */
export function topLevelIndex(blocks: ContentBlock[], index: number): number | null {
  for (let i = index; i >= 0; i--) {
    if (blocks[i]?.timeMarker?.level === 1) return i
  }
  return null
}

/** Planned length of the whole script in seconds. Nested blocks spend their parent's time. */
export function plannedTotalSeconds(blocks: ContentBlock[]): number {
  return blocks.reduce((total, block) => total + (block.timeMarker?.level === 1 ? block.timeMarker.time : 0), 0)
}

export function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}
