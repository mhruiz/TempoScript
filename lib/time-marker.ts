"use client"

import type { TimeMarker, ValidationError, ContentBlock } from "@/types/presentation"

const TIME_MARKER_REGEX = /^(\?+)(!!)?\s*(\d{2}):(\d{2})\s*$/
const CONTROL_MARKER_REGEX = /^(\?+)!!\s*$/

export function parseTimeMarker(line: string): TimeMarker | null {
  const match = line.match(TIME_MARKER_REGEX)
  if (!match) {
    // Check if it's a control marker
    const controlMatch = line.match(CONTROL_MARKER_REGEX)
    if (controlMatch) {
      return {
        time: 0,
        level: controlMatch[1].length,
        noTimeControl: true,
      }
    }
    return null
  }

  const [_, questionMarks, noTimeControl, minutes, seconds] = match
  const secondsValue = Number.parseInt(seconds)

  // Always validate seconds are multiples of 5
  if (secondsValue % 5 !== 0) {
    return null
  }

  return {
    time: Number.parseInt(minutes) * 60 + secondsValue,
    level: questionMarks.length,
    noTimeControl: !!noTimeControl,
  }
}

export function validateTimeMarkers(content: string): ValidationError[] {
  const lines = content.split("\n")
  const errors: ValidationError[] = []
  const levelStack: TimeMarker[] = []

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    if (!trimmedLine.startsWith("?")) return

    // Check for invalid seconds in time markers
    if (trimmedLine.includes(":")) {
      const parts = trimmedLine.split(":")
      if (parts.length > 1) {
        const seconds = parts[1].replace(/\D/g, "")
        const secondsValue = Number.parseInt(seconds)
        if (secondsValue % 5 !== 0) {
          errors.push({
            message: `Seconds must be a multiple of 5 at line ${index + 1}`,
            line: index,
          })
          return
        }
      }
    }

    const marker = parseTimeMarker(line)
    if (!marker && trimmedLine.startsWith("?")) {
      errors.push({
        message: `Invalid time marker format at line ${index + 1}`,
        line: index,
      })
      return
    }
    if (!marker) return

    // Validate nesting level for both time markers and control markers
    while (levelStack.length > 0 && levelStack[levelStack.length - 1].level >= marker.level) {
      levelStack.pop()
    }

    if (marker.level > 1 && (levelStack.length === 0 || levelStack[levelStack.length - 1].level !== marker.level - 1)) {
      errors.push({
        message: `Invalid nesting level at line ${index + 1}`,
        line: index,
      })
    }

    // Validate time constraints for nested blocks (only for time markers)
    if (!marker.noTimeControl && levelStack.length > 0 && !levelStack[levelStack.length - 1].noTimeControl) {
      const parentTime = levelStack[levelStack.length - 1].time
      if (marker.time > parentTime) {
        errors.push({
          message: `Sub-block time exceeds parent block time at line ${index + 1}`,
          line: index,
        })
      }
    }

    levelStack.push(marker)
  })

  return errors
}

export function parseContent(markdown: string): ContentBlock[] {
  const lines = markdown.split("\n")
  const blocks: ContentBlock[] = []
  let currentBlock: ContentBlock | null = null
  let content: string[] = []

  lines.forEach((line) => {
    const marker = parseTimeMarker(line)

    if (marker) {
      if (content.length > 0 && currentBlock) {
        currentBlock.content = content.join("\n")
        blocks.push(currentBlock)
      }

      currentBlock = {
        content: "",
        timeMarker: marker,
        children: [],
      }
      content = []
    } else if (!line.match(CONTROL_MARKER_REGEX)) {
      // Don't include control markers in content
      content.push(line)
    }
  })

  if (content.length > 0 && currentBlock) {
    currentBlock.content = content.join("\n")
    blocks.push(currentBlock)
  }

  return blocks
}

