// Share links carry the whole script in the URL fragment, so it never reaches a server.
// Format: #s=d.<base64url of deflate-raw bytes>  or  #s=p.<base64url of UTF-8 bytes>

const HASH_KEY = "s="
const MAX_DECODED_BYTES = 2 * 1024 * 1024

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function pipeThrough(bytes: Uint8Array, transform: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(transform).getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > MAX_DECODED_BYTES) {
      await reader.cancel()
      throw new Error("Shared script is too large")
    }
    chunks.push(value)
  }
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

/** Returns the URL fragment (without "#") that holds the script. */
export async function encodeScriptToHash(script: string): Promise<string> {
  const bytes = new TextEncoder().encode(script)
  if (typeof CompressionStream !== "undefined") {
    const compressed = await pipeThrough(bytes, new CompressionStream("deflate-raw"))
    return `${HASH_KEY}d.${bytesToBase64Url(compressed)}`
  }
  return `${HASH_KEY}p.${bytesToBase64Url(bytes)}`
}

/** Reads a script from a URL fragment. Returns null if the fragment holds none or is damaged. */
export async function decodeScriptFromHash(hash: string): Promise<string | null> {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash
  if (!fragment.startsWith(HASH_KEY)) return null

  const payload = fragment.slice(HASH_KEY.length)
  const format = payload.slice(0, 2)
  const data = payload.slice(2)
  if (!data) return null

  try {
    let bytes = base64UrlToBytes(data)
    if (format === "d.") {
      if (typeof DecompressionStream === "undefined") return null
      bytes = await pipeThrough(bytes, new DecompressionStream("deflate-raw"))
    } else if (format !== "p.") {
      return null
    }
    if (bytes.length > MAX_DECODED_BYTES) return null
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}
