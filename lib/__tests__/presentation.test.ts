import { describe, expect, it } from "vitest"
import { formatTime, plannedTotalSeconds, topLevelIndex } from "@/lib/presentation"
import { parseContent } from "@/lib/time-marker"

const blocks = parseContent(
  ["?01:00", "A", "??00:30", "A1", "??!!", "A2", "?02:00", "B", "?!!", "C", "??00:10", "C1"].join("\n"),
)

describe("plannedTotalSeconds", () => {
  it("adds top-level timed blocks only", () => {
    expect(plannedTotalSeconds(blocks)).toBe(180)
  })

  it("is zero for an empty script", () => {
    expect(plannedTotalSeconds([])).toBe(0)
  })
})

describe("topLevelIndex", () => {
  it("returns the block itself when it is top-level", () => {
    expect(topLevelIndex(blocks, 0)).toBe(0)
    expect(topLevelIndex(blocks, 3)).toBe(3)
  })

  it("returns the containing top-level block for nested blocks", () => {
    expect(topLevelIndex(blocks, 1)).toBe(0)
    expect(topLevelIndex(blocks, 2)).toBe(0)
    expect(topLevelIndex(blocks, 5)).toBe(4)
  })

  it("returns null when there is no top-level block before", () => {
    expect(topLevelIndex(parseContent("??00:30\nX"), 0)).toBeNull()
  })
})

describe("formatTime", () => {
  it("formats seconds as mm:ss", () => {
    expect(formatTime(0)).toBe("00:00")
    expect(formatTime(65)).toBe("01:05")
    expect(formatTime(3725)).toBe("62:05")
  })

  it("drops fractions and never goes negative", () => {
    expect(formatTime(59.9)).toBe("00:59")
    expect(formatTime(-3)).toBe("00:00")
  })
})
