import { describe, expect, it } from "vitest"
import {
  buildModel,
  formatTime,
  initialTimerState,
  plannedTotalSeconds,
  selectView,
  timerReducer,
  type TimerAction,
  type TimerState,
} from "@/lib/presentation"
import { parseContent } from "@/lib/time-marker"

// index: 0 A(60s)  1 A1(30s)  2 A2(untimed)  3 B(120s)  4 C(untimed)  5 C1(10s)
const script = ["?01:00", "A", "??00:30", "A1", "??!!", "A2", "?02:00", "B", "?!!", "C", "??00:10", "C1"].join("\n")

function setup(source = script) {
  const model = buildModel(parseContent(source))
  let state: TimerState = initialTimerState(model)
  let now = 1_000_000
  const dispatch = (action: TimerAction) => {
    state = timerReducer(model, state, action)
  }
  return {
    model,
    view: () => selectView(model, state),
    state: () => state,
    play: () => dispatch({ type: "play", now }),
    pause: () => dispatch({ type: "pause", now }),
    next: () => dispatch({ type: "move", step: 1, now }),
    previous: () => dispatch({ type: "move", step: -1, now }),
    /** Lets `seconds` pass, ticking four times a second like the app does. */
    run: (seconds: number, autoAdvance = false) => {
      for (let i = 0; i < seconds * 4; i++) {
        now += 250
        dispatch({ type: "tick", now, autoAdvance })
      }
    },
    /** Lets time pass with no ticks at all, as in a sleeping tab. */
    sleep: (seconds: number) => {
      now += seconds * 1000
    },
    tick: (autoAdvance = false) => dispatch({ type: "tick", now, autoAdvance }),
  }
}

describe("plannedTotalSeconds", () => {
  it("adds top-level timed blocks only", () => {
    expect(plannedTotalSeconds(parseContent(script))).toBe(180)
  })

  it("counts a section whose marker is followed directly by a sub-section", () => {
    expect(plannedTotalSeconds(parseContent("?05:00\n??02:00\nText"))).toBe(300)
  })
})

describe("buildModel", () => {
  it("records parents and subtree ends", () => {
    const { model } = setup()
    expect(model.parent).toEqual([-1, 0, 0, -1, -1, 4])
    expect(model.subtreeEnd).toEqual([3, 2, 3, 4, 6, 6])
  })

  it("does not stop on blocks that have no text", () => {
    const { model } = setup("?05:00\n\n??02:00\nFirst\n??01:00\nSecond")
    expect(model.blocks).toHaveLength(3)
    expect(model.steps).toEqual([1, 2])
    expect(model.parent).toEqual([-1, 0, 0])
  })
})

describe("timer", () => {
  it("does not count time until play is pressed", () => {
    const t = setup()
    t.run(5)
    expect(t.view().total.elapsed).toBe(0)
  })

  it("counts time on the current block and on the total", () => {
    const t = setup()
    t.play()
    t.run(10)
    expect(t.view().block).toEqual({ elapsed: 10, limit: 60, overtime: false })
    expect(t.view().total.elapsed).toBe(10)
  })

  it("stops counting while paused and resumes without a jump", () => {
    const t = setup()
    t.play()
    t.run(4)
    t.pause()
    t.sleep(100)
    t.run(3)
    expect(t.view().total.elapsed).toBe(4)
    t.play()
    t.run(2)
    expect(t.view().total.elapsed).toBe(6)
  })

  it("keeps the time between the last tick and a pause", () => {
    const t = setup()
    t.play()
    for (let i = 0; i < 10; i++) {
      t.sleep(0.2)
      t.pause()
      t.play()
    }
    expect(t.view().total.elapsed).toBe(2)
  })

  it("catches up after ticks were missed", () => {
    const t = setup()
    t.play()
    t.sleep(45)
    t.tick()
    expect(t.view().block.elapsed).toBe(45)
  })

  it("never takes time away when the clock goes backwards", () => {
    const t = setup()
    t.play()
    t.run(5)
    t.sleep(-60)
    t.tick()
    t.run(1)
    expect(t.view().total.elapsed).toBe(6)
  })
})

describe("navigation", () => {
  it("stays within the first and last block", () => {
    const t = setup()
    t.previous()
    expect(t.view().position).toBe(1)
    for (let i = 0; i < 20; i++) t.next()
    expect(t.view().position).toBe(6)
    expect(t.view().isLast).toBe(true)
  })

  it("gives the time before a move to the block being left", () => {
    const t = setup()
    t.play()
    t.sleep(0.9)
    t.next()
    t.sleep(0.9)
    t.previous()
    t.sleep(0.9)
    t.next()
    // 1.8 s were spent on A and 0.9 s on A1, although no tick ever fired
    expect(t.state().elapsed.slice(0, 2)).toEqual([1800, 900])
  })

  it("remembers the time of a block when the presenter comes back to it", () => {
    const t = setup()
    t.play()
    t.next() // A1
    t.run(20)
    t.next() // A2
    t.run(5)
    t.previous() // back to A1
    expect(t.view().block.elapsed).toBe(20)
    t.run(3)
    expect(t.view().block.elapsed).toBe(23)
  })

  it("keeps block times and total in agreement after moving around", () => {
    const t = setup()
    t.play()
    const moves = [t.next, t.next, t.previous, t.next, t.next, t.next, t.previous, t.previous, t.next, t.next, t.next]
    for (const move of moves) {
      t.run(3)
      move()
    }
    t.run(3)
    const spent = t.state().elapsed.reduce((sum, ms) => sum + ms, 0)
    expect(spent).toBe(36_000)
    expect(t.view().total.elapsed).toBe(36)
  })
})

describe("nested sections", () => {
  it("shows the parent with the time of the whole section", () => {
    const t = setup()
    t.play()
    t.run(10) // A
    t.next()
    t.run(15) // A1
    expect(t.view().block).toEqual({ elapsed: 15, limit: 30, overtime: false })
    expect(t.view().parents).toEqual([{ elapsed: 25, limit: 60, overtime: false, level: 1 }])
  })

  it("keeps the parent's time running in an untimed sub-section", () => {
    const t = setup()
    t.play()
    t.next()
    t.next() // A2, untimed
    t.run(70)
    expect(t.view().block).toEqual({ elapsed: 70, limit: null, overtime: false })
    expect(t.view().parents[0]).toMatchObject({ elapsed: 70, limit: 60, overtime: true })
  })

  it("does not lose the parent's time after leaving the section and coming back", () => {
    const t = setup()
    t.play()
    t.run(10) // A
    t.next()
    t.run(15) // A1
    t.next() // A2
    t.next() // B
    t.run(8)
    t.previous() // A2 again
    expect(t.view().parents[0].elapsed).toBe(25)
    expect(t.view().total.elapsed).toBe(33)
  })

  it("counts the sub-sections against the section when back on its own text", () => {
    const t = setup()
    t.play()
    t.run(20) // A
    t.next()
    t.run(30) // A1
    t.previous() // A
    expect(t.view().block).toEqual({ elapsed: 50, limit: 60, overtime: false })
    t.run(11)
    expect(t.view().block.overtime).toBe(true)
  })

  it("lists every timed parent, outermost first", () => {
    const t = setup("?10:00\nTop\n??05:00\nMid\n???01:00\nLeaf")
    t.play()
    t.next()
    t.next()
    t.run(2)
    expect(t.view().parents.map((p) => [p.level, p.elapsed, p.limit])).toEqual([
      [1, 2, 600],
      [2, 2, 300],
    ])
  })

  it("leaves out untimed parents", () => {
    const t = setup()
    for (let i = 0; i < 5; i++) t.next() // C1, inside untimed C
    expect(t.view().parents).toEqual([])
  })

  it("finds the parent of a sub-section whose section has no text of its own", () => {
    const t = setup("?05:00\n??02:00\nFirst")
    t.play()
    t.run(3)
    expect(t.view().stepCount).toBe(1)
    expect(t.view().parents).toEqual([{ elapsed: 3, limit: 300, overtime: false, level: 1 }])
    expect(t.view().total.limit).toBe(300)
  })
})

describe("total", () => {
  it("is not late because of time spent in untimed sections", () => {
    const t = setup("?00:10\nTalk\n?!!\nQuestions")
    t.play()
    t.run(8)
    t.next()
    t.run(60)
    expect(t.view().total).toEqual({ elapsed: 68, limit: 10, overtime: false })
  })

  it("is late when timed sections used more than planned", () => {
    const t = setup("?00:10\nTalk\n?!!\nQuestions")
    t.play()
    t.run(11)
    expect(t.view().total.overtime).toBe(true)
  })

  it("has no limit when nothing is timed", () => {
    expect(setup("?!!\nNotes").view().total.limit).toBeNull()
  })
})

describe("auto-advance", () => {
  it("moves on when the block runs out of time", () => {
    const t = setup("?00:05\nOne\n?00:05\nTwo\n?00:05\nThree")
    t.play()
    t.run(5.5, true)
    expect(t.view().position).toBe(2)
    expect(t.view().block.elapsed).toBe(0)
    t.run(5, true)
    expect(t.view().position).toBe(3)
  })

  it("stays on the last block", () => {
    const t = setup("?00:05\nOne\n?00:05\nTwo")
    t.play()
    t.run(30, true)
    expect(t.view().position).toBe(2)
    expect(t.view().block).toMatchObject({ elapsed: 25, overtime: true })
  })

  it("never leaves an untimed block by itself", () => {
    const t = setup("?!!\nOne\n?00:05\nTwo")
    t.play()
    t.run(30, true)
    expect(t.view().position).toBe(1)
  })

  it("advances one block at a time after a long gap", () => {
    const t = setup("?00:05\nOne\n?00:05\nTwo\n?00:05\nThree")
    t.play()
    t.sleep(60)
    t.tick(true)
    expect(t.view().position).toBe(2)
  })

  it("lets the presenter go back to a block that is out of time", () => {
    const t = setup("?00:05\nOne\n?00:05\nTwo\n?00:05\nThree")
    t.play()
    t.run(6, true) // now on Two
    t.previous()
    t.run(3, true)
    expect(t.view().position).toBe(1)
    expect(t.view().block).toMatchObject({ elapsed: 8, overtime: true })
    t.next()
    t.run(4.5, true) // Two had 1 s; it runs out again and moves on
    expect(t.view().position).toBe(3)
  })

  it("does nothing while switched off", () => {
    const t = setup("?00:05\nOne\n?00:05\nTwo")
    t.play()
    t.run(20, false)
    expect(t.view().position).toBe(1)
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
