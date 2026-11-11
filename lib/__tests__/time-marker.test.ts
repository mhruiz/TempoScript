import { describe, expect, it } from "vitest"
import { parseContent, parseTimeMarker, validateTimeMarkers } from "@/lib/time-marker"

describe("parseTimeMarker", () => {
  it("parses a top-level marker", () => {
    expect(parseTimeMarker("?05:00")).toEqual({ time: 300, level: 1, noTimeControl: false })
  })

  it("derives the level from the number of question marks", () => {
    expect(parseTimeMarker("??03:00")?.level).toBe(2)
    expect(parseTimeMarker("???00:30")).toEqual({ time: 30, level: 3, noTimeControl: false })
  })

  it("parses an untimed marker", () => {
    expect(parseTimeMarker("?!!")).toEqual({ time: 0, level: 1, noTimeControl: true })
    expect(parseTimeMarker("??!!  ")).toEqual({ time: 0, level: 2, noTimeControl: true })
  })

  it("accepts trailing whitespace", () => {
    expect(parseTimeMarker("??00:25  ")?.time).toBe(25)
  })

  it("rejects seconds that are not a multiple of 5", () => {
    expect(parseTimeMarker("?00:07")).toBeNull()
  })

  it("rejects ordinary text", () => {
    expect(parseTimeMarker("## Heading")).toBeNull()
    expect(parseTimeMarker("?5:00")).toBeNull()
    expect(parseTimeMarker("Why? 05:00")).toBeNull()
  })
})

describe("validateTimeMarkers", () => {
  it("returns no errors for a valid script", () => {
    const script = ["?01:00", "Intro", "??00:30", "Detail", "??!!", "Aside", "?!!", "Questions"].join("\n")
    expect(validateTimeMarkers(script)).toEqual([])
  })

  it("reports seconds that are not a multiple of 5", () => {
    const errors = validateTimeMarkers("?00:07\nText")
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe(0)
    expect(errors[0].message).toMatch(/multiple of 5/)
  })

  it("reports a malformed marker", () => {
    const errors = validateTimeMarkers("Text\n?abc")
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe(1)
    expect(errors[0].message).toMatch(/Invalid time marker format/)
  })

  it("reports a nested marker without a parent", () => {
    const errors = validateTimeMarkers("??00:30\nText")
    expect(errors[0].message).toMatch(/Invalid nesting level/)
  })

  it("reports a skipped nesting level", () => {
    const errors = validateTimeMarkers("?01:00\nA\n???00:30\nB")
    expect(errors[0].message).toMatch(/Invalid nesting level/)
  })

  it("reports a child longer than its parent", () => {
    const errors = validateTimeMarkers("?01:00\nA\n??02:00\nB")
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/exceeds parent/)
  })

  it("allows any child duration inside an untimed parent", () => {
    expect(validateTimeMarkers("?!!\nA\n??10:00\nB")).toEqual([])
  })
})

describe("parseContent", () => {
  it("splits the script into one block per marker", () => {
    const blocks = parseContent("?01:00\n# One\n??00:30\nTwo\n?!!\nThree")
    expect(blocks.map((b) => b.content)).toEqual(["# One", "Two", "Three"])
    expect(blocks.map((b) => b.timeMarker?.level)).toEqual([1, 2, 1])
    expect(blocks[2].timeMarker?.noTimeControl).toBe(true)
  })

  it("drops text that comes before the first marker", () => {
    const blocks = parseContent("Preamble\n?00:30\nBody")
    expect(blocks).toHaveLength(1)
    expect(blocks[0].content).toBe("Body")
  })

  it("keeps a section that has no text before its first sub-section", () => {
    const blocks = parseContent("?05:00\n??02:00\nText")
    expect(blocks.map((b) => [b.timeMarker?.level, b.timeMarker?.time, b.content])).toEqual([
      [1, 300, ""],
      [2, 120, "Text"],
    ])
  })

  it("returns no blocks when the script has no markers", () => {
    expect(parseContent("# Just markdown")).toEqual([])
  })
})
