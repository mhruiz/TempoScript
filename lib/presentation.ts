import type { ContentBlock } from "@/types/presentation"

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

/** A block the presenter can stop on. Blocks without text only give structure. */
export function hasText(block: ContentBlock): boolean {
  return block.content.trim() !== ""
}

export interface PresentationModel {
  blocks: ContentBlock[]
  /** Indices of the blocks the presenter steps through, in order. */
  steps: number[]
  /** For each block, the index just past its last descendant. */
  subtreeEnd: number[]
  /** For each block, the index of its direct parent, or -1. */
  parent: number[]
}

export function buildModel(blocks: ContentBlock[]): PresentationModel {
  const level = (index: number) => blocks[index].timeMarker?.level ?? 1

  const subtreeEnd = blocks.map((_, index) => {
    let end = index + 1
    while (end < blocks.length && level(end) > level(index)) end++
    return end
  })

  const parent = blocks.map((_, index) => {
    for (let i = index - 1; i >= 0; i--) {
      if (level(i) < level(index)) return i
    }
    return -1
  })

  const steps = blocks.flatMap((block, index) => (hasText(block) ? [index] : []))

  return { blocks, steps, subtreeEnd, parent }
}

/** Planned length of the whole script in seconds. Nested blocks spend their parent's time. */
export function plannedTotalSeconds(blocks: ContentBlock[]): number {
  return blocks.reduce((total, block) => total + (block.timeMarker?.level === 1 ? block.timeMarker.time : 0), 0)
}

/** Time limit of a block in milliseconds, or null when it has none. */
function limitMs(block: ContentBlock | undefined): number | null {
  const marker = block?.timeMarker
  if (!marker || marker.noTimeControl || marker.time <= 0) return null
  return marker.time * 1000
}

// ---------------------------------------------------------------------------
// Timer state
// ---------------------------------------------------------------------------

/**
 * The only time that is stored is the time spent on each block. Every figure
 * on screen (block, parents, total) is a sum of those, so they cannot drift
 * apart, whatever order the presenter moves in.
 */
export interface TimerState {
  /** Position in `model.steps`. */
  stepIndex: number
  isPlaying: boolean
  /** Clock reading (ms) up to which time has been counted. */
  lastTick: number
  /** Milliseconds spent on each block, by block index. */
  elapsed: number[]
  /** True when the presenter arrived at a block that was already out of time. */
  holdAutoAdvance: boolean
}

export type TimerAction =
  | { type: "play"; now: number }
  | { type: "pause"; now: number }
  | { type: "toggle"; now: number }
  | { type: "tick"; now: number; autoAdvance: boolean }
  | { type: "move"; step: 1 | -1; now: number }

export function initialTimerState(model: PresentationModel): TimerState {
  return {
    stepIndex: 0,
    isPlaying: false,
    lastTick: 0,
    elapsed: model.blocks.map(() => 0),
    holdAutoAdvance: false,
  }
}

/** Time spent on a block and everything nested in it, in milliseconds. */
export function subtreeElapsedMs(model: PresentationModel, elapsed: number[], index: number): number {
  let total = 0
  for (let i = index; i < model.subtreeEnd[index]; i++) total += elapsed[i]
  return total
}

/** Counts the time since the last tick against the current block. */
function settle(model: PresentationModel, state: TimerState, now: number): TimerState {
  if (!state.isPlaying) return state
  // A clock that jumps backwards must never take time away
  const delta = Math.max(0, now - state.lastTick)
  const blockIndex = model.steps[state.stepIndex]
  if (delta === 0 || blockIndex === undefined) return { ...state, lastTick: now }
  const elapsed = state.elapsed.slice()
  elapsed[blockIndex] += delta
  return { ...state, elapsed, lastTick: now }
}

function isOutOfTime(model: PresentationModel, elapsed: number[], blockIndex: number): boolean {
  const limit = limitMs(model.blocks[blockIndex])
  return limit !== null && subtreeElapsedMs(model, elapsed, blockIndex) >= limit
}

function goTo(model: PresentationModel, state: TimerState, stepIndex: number): TimerState {
  if (stepIndex < 0 || stepIndex >= model.steps.length) return state
  return {
    ...state,
    stepIndex,
    // Going back to a block that already used its time must not bounce forward again
    holdAutoAdvance: isOutOfTime(model, state.elapsed, model.steps[stepIndex]),
  }
}

export function timerReducer(model: PresentationModel, state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "play":
      return state.isPlaying ? state : { ...state, isPlaying: true, lastTick: action.now }

    case "pause":
      return state.isPlaying ? { ...settle(model, state, action.now), isPlaying: false } : state

    case "toggle":
      return timerReducer(model, state, { type: state.isPlaying ? "pause" : "play", now: action.now })

    case "move":
      // Time up to the key press belongs to the block being left
      return goTo(model, settle(model, state, action.now), state.stepIndex + action.step)

    case "tick": {
      if (!state.isPlaying) return state
      const settled = settle(model, state, action.now)
      if (!action.autoAdvance || settled.holdAutoAdvance) return settled
      return isOutOfTime(model, settled.elapsed, model.steps[settled.stepIndex])
        ? goTo(model, settled, settled.stepIndex + 1)
        : settled
    }
  }
}

// ---------------------------------------------------------------------------
// What the timer bar shows
// ---------------------------------------------------------------------------

export interface Clock {
  /** Seconds used. */
  elapsed: number
  /** Seconds planned, or null when untimed. */
  limit: number | null
  overtime: boolean
}

export interface TimerView {
  blockIndex: number
  /** Step number, starting at 1. */
  position: number
  stepCount: number
  isFirst: boolean
  isLast: boolean
  /** The current block, including anything nested in it. */
  block: Clock
  /** Timed parents of the current block, outermost first. */
  parents: (Clock & { level: number })[]
  /** `overtime` here only counts timed sections: questions do not make a talk late. */
  total: Clock
}

function clock(model: PresentationModel, elapsed: number[], index: number): Clock {
  const used = subtreeElapsedMs(model, elapsed, index)
  const limit = limitMs(model.blocks[index])
  return {
    elapsed: Math.floor(used / 1000),
    limit: limit === null ? null : limit / 1000,
    overtime: limit !== null && used > limit,
  }
}

export function selectView(model: PresentationModel, state: TimerState): TimerView {
  const blockIndex = model.steps[state.stepIndex] ?? 0

  const parents: TimerView["parents"] = []
  for (let i = model.parent[blockIndex] ?? -1; i >= 0; i = model.parent[i]) {
    const parentClock = clock(model, state.elapsed, i)
    if (parentClock.limit !== null) {
      parents.unshift({ ...parentClock, level: model.blocks[i].timeMarker?.level ?? 1 })
    }
  }

  const planned = plannedTotalSeconds(model.blocks)
  let totalMs = 0
  let timedMs = 0
  model.blocks.forEach((block, index) => {
    totalMs += state.elapsed[index]
    if (block.timeMarker?.level === 1 && limitMs(block) !== null) {
      timedMs += subtreeElapsedMs(model, state.elapsed, index)
    }
  })

  return {
    blockIndex,
    position: state.stepIndex + 1,
    stepCount: model.steps.length,
    isFirst: state.stepIndex === 0,
    isLast: state.stepIndex >= model.steps.length - 1,
    block: clock(model, state.elapsed, blockIndex),
    parents,
    total: {
      elapsed: Math.floor(totalMs / 1000),
      limit: planned > 0 ? planned : null,
      overtime: planned > 0 && timedMs > planned * 1000,
    },
  }
}

export function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}
