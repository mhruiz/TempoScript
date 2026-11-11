# TempoScript

**Timed speaker notes from a Markdown script.** Try it at [temposcript.com](https://www.temposcript.com/).

TempoScript turns a plain Markdown script into speaker notes that keep time. You give each section a duration, press Start, and the app highlights where you are, runs the timers and warns you when a section goes over. It is for talks, lectures, pitches and recordings where you have no presenter view to guide you.

- Free, no account
- Works offline and installs as an app (PWA)
- Your script stays in your browser; nothing is uploaded

## How it works

Write your script in Markdown and put a time marker on its own line before each section:

```markdown
?01:00
# Opening
Introduce yourself and state the problem.

?05:00
## Main idea

??02:00
First argument.

??02:30
Second argument.

?!!
## Questions
```

| Marker | Meaning |
| --- | --- |
| `?10:00` | Top-level section that lasts 10 minutes |
| `??03:00` | Sub-section that lasts 3 minutes, inside the section above |
| `???00:30` | Sub-sub-section that lasts 30 seconds |
| `?!!` | Untimed section: elapsed time is shown, there is no limit |
| `??!!` | Untimed sub-section: the parent section's time keeps running |

Rules:

- Each marker goes on its own line.
- Time is `mm:ss` with two digits each. Seconds must be a multiple of 5.
- A nested marker has exactly one more `?` than its parent.
- A sub-section cannot be longer than its parent section.

The editor underlines invalid markers and lists the errors. You cannot start presenting until they are fixed.

The full reference is in the [guide](https://www.temposcript.com/guide).

## Features

- **Editor with live preview.** Markdown editor with marker validation as you type.
- **Presentation mode.** The current section is highlighted and kept in view. Timers show total, section and parent section time. The progress bar turns red when you run over.
- **Auto-advance.** Optionally move to the next section when the time runs out.
- **Accurate timers.** They follow the clock, so a background tab does not slow them down. The screen stays awake where the browser allows it.
- **Text size and fullscreen** in presentation mode.
- **Import and export** Markdown files.
- **Share links.** The whole script travels compressed in the URL fragment, which is not sent to the server.
- **Light and dark themes.**

### Keyboard shortcuts in presentation mode

| Key | Action |
| --- | --- |
| `Space` or `P` | Play or pause |
| `→` or `N` | Next section |
| `←` or `B` | Previous section |
| `F` | Fullscreen |
| `+` / `-` | Text size |
| `H` | Show or hide the help |
| `Esc` | Exit |

## Development

Requires Node.js 20 or later.

```bash
git clone https://github.com/mhruiz/TempoScript.git
cd TempoScript
npm install
npm run dev
```

Open `http://localhost:3000`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests (Vitest) |

The service worker is disabled in development. To test offline behaviour, run `npm run build && npm start`.

### Project layout

| Path | Contents |
| --- | --- |
| `app/` | Pages (`/`, `/guide`, `/es`), metadata routes (robots, sitemap, manifest, Open Graph image) |
| `components/editor/` | Editor, toolbar and preview |
| `components/presentation/` | Presentation mode and timer bar |
| `components/landing/` | Static overview shown below the editor |
| `lib/time-marker.ts` | Marker parser and validator |
| `lib/share.ts` | Share link encoding |
| `lib/landing-content.ts` | Overview and FAQ text in English and Spanish |

### Deployment

The site is hosted on Netlify. Every push to `main` is deployed to production, so changes go through a pull request and its deploy preview first.

## Built with

Next.js, React, Tailwind CSS, shadcn/ui, CodeMirror and react-markdown.

The first version of this project was an experiment in building an app almost entirely with AI tools: Claude, ChatGPT, Replit, v0, Gemini, Grok and Project IDX.

## License

[MIT](LICENSE)
