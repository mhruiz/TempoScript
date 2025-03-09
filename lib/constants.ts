export const DEFAULT_MARKDOWN_CONTENT = `# Welcome to TempoScript: Your Timed Markdown Presentation Tool

When presenting without native speaker notes—such as when you're not using PowerPoint—TempoScript provides the guidance you need. Simply upload your markdown script, structure your sections with time markers, and precisely control the pace of your talk.

?00:15
## Getting Started

Press the **Start Presentation** button at the top right to begin your session.

?00:25
### How It Works

- 📝 **Markdown Editor**: Create your presentation in the editor on the left.
- 🕓 **Time Markers**: Insert markers (e.g., \`?05:00\`) to specify the duration of each section.
- 👁️ **Live Preview**: Watch your formatted presentation update in real time.

?01:00
## Understanding Time Markers

Time markers divide your presentation into well-timed segments. For instance, this active block is allocated **1:00** minutes to set the stage.

- \`?10:00\` → Top-level section (10 minutes)

??00:25  
If you want to set inner time markers, you can do so like this:
- \`??03:00\` → Nested section (3 minutes)
- \`???00:30\` → Deeply nested section (30 seconds)

Remember, **nested sections cannot exceed the duration of their parent section**.

?00:55
#### No-Timed Sections

??00:15  
Imagine you need to add a quick note or spontaneous explanation. With no-timed sections, you can speak freely without affecting the overall timing.

??!!  
Once you enter a no-timed block—indicated by the \`?!!\` symbols—the timer will pause. However, if this no-timed block is nested within a timed section, the parent block’s duration remains in effect.

?!!  
A no-timed section that is not nested within any timed block is completely unrestricted.

?00:30
## Presentation Controls

- ▶️ **Play/Pause**: Start or stop the timer.
- ⏩ **Next/Previous**: Navigate between sections.
- ⌨️ **Shortcuts**: Use keyboard commands (e.g., Space to play/pause) for quick control.

?04:30
## Wrap-Up

TempoScript helps you stay on schedule while offering the flexibility to delve deeper when needed. With structured time markers and no-timed sections, you remain in control of both the pace and the content of your presentation.
`

