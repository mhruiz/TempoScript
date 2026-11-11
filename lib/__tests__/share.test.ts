import { describe, expect, it } from "vitest"
import { decodeScriptFromHash, encodeScriptToHash } from "@/lib/share"

describe("share links", () => {
  it("round-trips a script, including non-ASCII text", async () => {
    const script = "?01:00\n# Introducción ⏱️\n\n??00:30\nLínea con `código` y ñ"
    const hash = await encodeScriptToHash(script)
    expect(hash.startsWith("s=")).toBe(true)
    expect(await decodeScriptFromHash(hash)).toBe(script)
    expect(await decodeScriptFromHash(`#${hash}`)).toBe(script)
  })

  it("produces a fragment that is safe in a URL", async () => {
    const hash = await encodeScriptToHash("?05:00\n".repeat(200))
    expect(hash).toMatch(/^s=[dp]\.[A-Za-z0-9_-]+$/)
  })

  it("compresses repetitive scripts", async () => {
    const script = "?05:00\nSame line again\n".repeat(200)
    const hash = await encodeScriptToHash(script)
    expect(hash.length).toBeLessThan(script.length / 4)
  })

  it("reads uncompressed fragments", async () => {
    expect(await decodeScriptFromHash("s=p.P zA1OjAw".replace(" ", ""))).toBe("?05:00")
  })

  it("returns null for other fragments and damaged data", async () => {
    expect(await decodeScriptFromHash("")).toBeNull()
    expect(await decodeScriptFromHash("#about")).toBeNull()
    expect(await decodeScriptFromHash("s=")).toBeNull()
    expect(await decodeScriptFromHash("s=x.abcd")).toBeNull()
    expect(await decodeScriptFromHash("s=d.!!!!")).toBeNull()
    expect(await decodeScriptFromHash("s=d.AAAAAAAAAAAA")).toBeNull()
  })
})
