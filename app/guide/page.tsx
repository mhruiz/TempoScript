import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/site/site-header"
import { REPO_URL } from "@/lib/config"

const title = "Guide: time markers, presentation mode and shortcuts"
const description =
  "TempoScript reference: time markers such as ?05:00, nested and untimed sections, error fixes, presentation mode and keyboard shortcuts."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/guide" },
  openGraph: {
    type: "article",
    url: "/guide",
    title: `${title} | TempoScript`,
    description,
    siteName: "TempoScript",
    images: ["/opengraph-image"],
  },
}

const EXAMPLE_SCRIPT = `?01:00
# Opening

Introduce yourself and state the problem.

?05:00
## Main idea

??02:00
First argument, with the example.

??02:30
Second argument.

??!!
Take a question if someone raises a hand.

?00:30
## Closing

One sentence to remember. Thank the audience.

?!!
## Questions`

const MARKERS = [
  { marker: "?10:00", level: "1", meaning: "Top-level section that lasts 10 minutes." },
  { marker: "??03:00", level: "2", meaning: "Sub-section that lasts 3 minutes. It belongs to the level 1 section above it." },
  { marker: "???00:30", level: "3", meaning: "Sub-section of a level 2 section. You can nest as deep as you need." },
  { marker: "?!!", level: "1", meaning: "Untimed top-level section. The timer shows elapsed time and there is no limit." },
  { marker: "??!!", level: "2", meaning: "Untimed sub-section. It has no limit of its own, but the parent section's time keeps running." },
]

const ERRORS = [
  {
    message: "Seconds must be a multiple of 5",
    fix: "Round the seconds: write ?01:05 or ?01:10, not ?01:07.",
  },
  {
    message: "Invalid time marker format",
    fix: "A line that starts with ? must be a marker. Use two digits for minutes and seconds (?05:00, not ?5:00). If the line is ordinary text, do not start it with a question mark.",
  },
  {
    message: "Invalid nesting level",
    fix: "A marker can only go one level deeper than the one before it. Put a ? section before a ?? section, and a ?? section before a ??? section.",
  },
  {
    message: "Sub-block time exceeds parent block time",
    fix: "Shorten the sub-section or lengthen its parent. A ??03:00 section cannot sit inside a ?02:00 section.",
  },
]

const SHORTCUTS = [
  { keys: ["Space", "P"], action: "Play or pause the timers" },
  { keys: ["→", "N"], action: "Go to the next section" },
  { keys: ["←", "B"], action: "Go back to the previous section" },
  { keys: ["F"], action: "Enter or leave fullscreen" },
  { keys: ["+", "-"], action: "Make the text larger or smaller" },
  { keys: ["H"], action: "Show or hide the shortcut help" },
  { keys: ["Esc"], action: "Exit presentation mode" },
]

const h2 = "scroll-mt-6 text-2xl font-bold tracking-tight"
const muted = "text-muted-foreground"
const code = "rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
const th = "px-4 py-3 font-semibold"
const td = "px-4 py-3 align-top"

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-4xl space-y-14 px-6 pb-20 pt-8">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">TempoScript guide</h1>
          <p className={`text-lg ${muted}`}>
            TempoScript reads a Markdown script, splits it into sections at each time marker and guides you through
            them with timers. This page explains the marker syntax, presentation mode and the keyboard shortcuts.
          </p>
          <nav aria-label="On this page">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
              {[
                ["#quick-start", "Quick start"],
                ["#markers", "Time markers"],
                ["#rules", "Rules"],
                ["#errors", "Fixing errors"],
                ["#presenting", "Presentation mode"],
                ["#shortcuts", "Shortcuts"],
                ["#files", "Files and share links"],
                ["#storage", "Storage and offline use"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="underline underline-offset-4">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <section className="space-y-4">
          <h2 id="quick-start" className={h2}>
            Quick start
          </h2>
          <ol className={`list-decimal space-y-2 pl-5 ${muted}`}>
            <li>
              Open <Link href="/" className="underline underline-offset-4">the editor</Link> and replace the example
              with your own script.
            </li>
            <li>
              Before each section, add a line with a time marker such as <code className={code}>?05:00</code>.
            </li>
            <li>Check the preview on the right. Markers are hidden there; only your text shows.</li>
            <li>
              Press <strong className="text-foreground">Start Presentation</strong>, then press Play or the Space key
              when you begin to speak.
            </li>
          </ol>
          <p className={muted}>A complete script looks like this:</p>
          <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-sm leading-relaxed">
            {EXAMPLE_SCRIPT}
          </pre>
          <p className={muted}>
            This talk has a planned length of 6 minutes 30 seconds: the three timed top-level sections add up to that,
            and the final questions section is untimed. Text before the first marker is not part of any section and is
            not shown in presentation mode.
          </p>
        </section>

        <section className="space-y-4">
          <h2 id="markers" className={h2}>
            Time markers
          </h2>
          <p className={muted}>
            A time marker is a line that starts with question marks, followed by a time in{" "}
            <code className={code}>mm:ss</code> or by <code className={code}>!!</code>. The number of question marks
            sets the nesting level. Each marker starts a new section that runs until the next marker.
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th scope="col" className={th}>Marker</th>
                  <th scope="col" className={th}>Level</th>
                  <th scope="col" className={th}>Meaning</th>
                </tr>
              </thead>
              <tbody>
                {MARKERS.map((row) => (
                  <tr key={row.marker} className="border-b last:border-0">
                    <td className={`${td} whitespace-nowrap`}>
                      <code className={code}>{row.marker}</code>
                    </td>
                    <td className={td}>{row.level}</td>
                    <td className={td}>{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="pt-2 font-semibold">Untimed sections</h3>
          <p className={muted}>
            Use <code className={code}>?!!</code> for parts whose length you cannot plan: questions, a live demo, an
            aside. The section timer still counts up, but the progress bar does not fill and nothing turns red. An
            untimed sub-section (<code className={code}>??!!</code>) sits inside a timed parent, so the parent&apos;s
            timer keeps counting while you are in it.
          </p>
        </section>

        <section className="space-y-4">
          <h2 id="rules" className={h2}>
            Rules
          </h2>
          <ul className={`list-disc space-y-2 pl-5 ${muted}`}>
            <li>Each marker goes on its own line, with nothing else on it.</li>
            <li>
              Minutes and seconds each take two digits: <code className={code}>?05:00</code>,{" "}
              <code className={code}>?00:45</code>. The longest section is <code className={code}>?99:55</code>.
            </li>
            <li>Seconds must be a multiple of 5 (00, 05, 10 … 55).</li>
            <li>A nested marker has exactly one more question mark than its parent.</li>
            <li>A sub-section cannot be longer than its parent section.</li>
            <li>
              The planned total is the sum of the timed top-level sections. Sub-sections spend their parent&apos;s
              time; they do not add to the total.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 id="errors" className={h2}>
            Fixing errors
          </h2>
          <p className={muted}>
            The editor checks markers as you type. A line with a problem is underlined in red, the error is listed
            above the editor, and Start Presentation stays disabled until every error is fixed.
          </p>
          <dl className="space-y-4">
            {ERRORS.map((error) => (
              <div key={error.message} className="rounded-lg border p-4">
                <dt className="font-mono text-sm font-semibold">{error.message}</dt>
                <dd className={`mt-2 text-sm ${muted}`}>{error.fix}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="space-y-4">
          <h2 id="presenting" className={h2}>
            Presentation mode
          </h2>
          <p className={muted}>
            Presentation mode shows the whole script with the current section at full brightness and the rest dimmed.
            The view scrolls to keep the current section in sight. The bar at the bottom has the timers and controls.
          </p>
          <ul className={`list-disc space-y-2 pl-5 ${muted}`}>
            <li>
              <strong className="text-foreground">Total</strong>: time since you pressed Play, next to the planned
              total.
            </li>
            <li>
              <strong className="text-foreground">Block</strong>: time spent in the current section, next to its
              planned time.
            </li>
            <li>
              <strong className="text-foreground">Parent</strong>: shown inside a sub-section. Time spent in the
              top-level section, next to its planned time.
            </li>
            <li>
              <strong className="text-foreground">Progress bar</strong>: fills as the section&apos;s time passes. It
              turns red and pulses when you run over.
            </li>
            <li>
              <strong className="text-foreground">Auto-advance</strong>: when on, the app moves to the next section
              as soon as the current one runs out of time. Untimed sections never advance by themselves.
            </li>
          </ul>
          <p className={muted}>
            Moving to another section resets the section timer. The total keeps counting until you pause or exit.
            The timers follow the clock, so they stay correct if the tab is in the background. Where the browser
            allows it, the screen stays awake while you present.
          </p>
          <p className={muted}>
            The buttons at the top right change the text size and switch to fullscreen. The text size is remembered
            for next time.
          </p>
        </section>

        <section className="space-y-4">
          <h2 id="shortcuts" className={h2}>
            Keyboard shortcuts
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th scope="col" className={th}>Key</th>
                  <th scope="col" className={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {SHORTCUTS.map((shortcut) => (
                  <tr key={shortcut.action} className="border-b last:border-0">
                    <td className={`${td} whitespace-nowrap`}>
                      {shortcut.keys.map((key, index) => (
                        <span key={key}>
                          {index > 0 && (shortcut.keys[0] === "+" ? " / " : " or ")}
                          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">{key}</kbd>
                        </span>
                      ))}
                    </td>
                    <td className={td}>{shortcut.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={muted}>
            In the editor, double-click to expand it to full width, and press Esc or click outside to shrink it back.
          </p>
        </section>

        <section className="space-y-4">
          <h2 id="files" className={h2}>
            Files and share links
          </h2>
          <ul className={`list-disc space-y-2 pl-5 ${muted}`}>
            <li>
              <strong className="text-foreground">Export</strong> downloads the script as a Markdown file, markers
              included. Use it as a backup or to move a script to another device.
            </li>
            <li>
              <strong className="text-foreground">Import</strong> loads a Markdown or plain text file into the
              editor. If you already have a script of your own, the app asks before replacing it.
            </li>
            <li>
              <strong className="text-foreground">Copy link</strong> puts a link on the clipboard with the whole
              script compressed inside it. The script is in the part of the address after{" "}
              <code className={code}>#</code>, which browsers do not send to the server. Anyone who has the link can
              read the script. Long scripts make long links, which some chat apps cut; export the file in that case.
            </li>
            <li>
              <strong className="text-foreground">Load example</strong> brings back the sample script.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 id="storage" className={h2}>
            Storage and offline use
          </h2>
          <p className={muted}>
            Your script is saved automatically in the browser&apos;s local storage as you type. It stays on your
            device and is never sent to a server. Because it lives in one browser, it does not sync between devices,
            and clearing the browser&apos;s site data deletes it. Export important scripts to a file.
          </p>
          <p className={muted}>
            TempoScript is a progressive web app. After the first visit it loads without a connection, and you can
            install it from the browser menu (Install app or Add to Home Screen).
          </p>
          <p className={muted}>
            Found a bug or have an idea?{" "}
            <a href={`${REPO_URL}/issues`} rel="noopener" className="underline underline-offset-4">
              Open an issue on GitHub
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  )
}
