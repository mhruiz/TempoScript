import { ImageResponse } from "next/og"

export const alt = "TempoScript: a Markdown script with a time marker before each section"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const lines: { text: string; marker?: boolean }[] = [
  { text: "?01:00", marker: true },
  { text: "# Opening" },
  { text: "?05:00", marker: true },
  { text: "## Main idea" },
  { text: "??02:00", marker: true },
  { text: "First argument" },
  { text: "?!!", marker: true },
  { text: "## Questions" },
]

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: "#16181d",
          color: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 600 }}>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>TempoScript</div>
          <div style={{ marginTop: 24, fontSize: 40, lineHeight: 1.25, color: "#cbd5e1" }}>
            Timed speaker notes from a Markdown script
          </div>
          <div style={{ marginTop: 40, fontSize: 28, color: "#94a3b8" }}>Free · Offline · No sign-up</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 380,
            padding: "32px 36px",
            borderRadius: 20,
            border: "2px solid #334155",
            background: "#0f1115",
            fontSize: 30,
            lineHeight: 1.6,
          }}
        >
          {lines.map((line, index) => (
            <div key={index} style={{ display: "flex", color: line.marker ? "#fbbf24" : "#e2e8f0" }}>
              {line.text}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
