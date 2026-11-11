export type Locale = "en" | "es"

export interface LandingContent {
  hero: { title: string; lead: string; highlights: string[]; cta: string }
  how: { title: string; steps: { title: string; body: string }[] }
  syntax: {
    title: string
    intro: string
    columns: [string, string]
    rows: { marker: string; meaning: string }[]
    rulesTitle: string
    rules: string[]
    guideLink: string
  }
  useCases: { title: string; intro: string; items: { title: string; body: string }[] }
  privacy: { title: string; paragraphs: string[] }
  faq: { title: string; items: { question: string; answer: string }[] }
  footer: { guide: string; source: string; otherLocale: string }
}

export const LANDING_CONTENT: Record<Locale, LandingContent> = {
  en: {
    hero: {
      title: "A timed script for your presentations, written in Markdown",
      lead: "TempoScript turns a plain Markdown script into speaker notes that keep time. Give each section a duration, press Start, and the app highlights where you are, counts how long you have been talking and warns you when you run over.",
      highlights: [
        "Free, with the source code on GitHub",
        "Works offline and installs as an app",
        "No account: your script never leaves your browser",
      ],
      cta: "Open the editor",
    },
    how: {
      title: "How it works",
      steps: [
        {
          title: "Write your script in Markdown",
          body: "Type or paste your talk into the editor. Headings, lists, bold text and code blocks all render in the live preview.",
        },
        {
          title: "Add time markers",
          body: "Put a line such as ?05:00 before a section to give it five minutes. Use ??01:30 for a sub-section that takes a minute and a half of that time.",
        },
        {
          title: "Present",
          body: "Press Start Presentation. The current section is highlighted, the timers run, and the progress bar turns red and pulses when a section runs over its time.",
        },
      ],
    },
    syntax: {
      title: "Time marker syntax",
      intro: "A time marker is a line that starts with one or more question marks. It sets the duration of the text below it, up to the next marker.",
      columns: ["Marker", "Meaning"],
      rows: [
        { marker: "?10:00", meaning: "Top-level section that lasts 10 minutes" },
        { marker: "??03:00", meaning: "Sub-section that lasts 3 minutes, inside the section above" },
        { marker: "???00:30", meaning: "Sub-sub-section that lasts 30 seconds" },
        { marker: "?!!", meaning: "Untimed section: the timer shows elapsed time but there is no limit" },
        { marker: "??!!", meaning: "Untimed sub-section: the parent section's time keeps running" },
      ],
      rulesTitle: "Rules",
      rules: [
        "Each marker goes on its own line.",
        "Time is written as mm:ss, and seconds must be a multiple of 5.",
        "A nested marker has exactly one more question mark than its parent.",
        "A sub-section cannot be longer than its parent section.",
      ],
      guideLink: "Read the full guide",
    },
    useCases: {
      title: "When to use it",
      intro: "TempoScript helps whenever you speak against the clock and have no presenter view to guide you.",
      items: [
        {
          title: "Conference talks and meetups",
          body: "Rehearse a 20-minute slot and see exactly which section eats your time.",
        },
        {
          title: "Lectures and classes",
          body: "Split a lesson into timed blocks and keep room for questions with untimed sections.",
        },
        {
          title: "Thesis defences and pitches",
          body: "Strict time limits are easier to meet when every part of the talk has its own budget.",
        },
        {
          title: "Podcasts, streams and video",
          body: "Keep a rundown on a second screen and move through segments on schedule.",
        },
        {
          title: "Slides without speaker notes",
          body: "Presenting a PDF, a shared browser tab or a live demo? Keep your script and timing on another device.",
        },
      ],
    },
    privacy: {
      title: "Private and offline by design",
      paragraphs: [
        "TempoScript runs entirely in your browser. Your script is saved in the browser's local storage on your device. There is no account, no server-side storage and no tracking.",
        "After the first visit the app works without an internet connection, and you can install it on a computer, tablet or phone from the browser menu.",
      ],
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          question: "What is TempoScript?",
          answer:
            "TempoScript is a free web app that turns a Markdown script into timed speaker notes. You mark each section with a duration such as ?05:00, and during the presentation the app highlights the current section and tracks your time.",
        },
        {
          question: "Is TempoScript free?",
          answer: "Yes. It is free to use, has no paid plan and needs no account. It is open source under the MIT license, with the code on GitHub.",
        },
        {
          question: "Does it work offline?",
          answer:
            "Yes. After you open it once, the app is cached and works without a connection. You can also install it as an app from your browser.",
        },
        {
          question: "Where is my script stored?",
          answer:
            "Only in your browser's local storage, on your own device. Nothing is uploaded. Clearing your browser data removes the script, so use Export to keep a copy of anything important.",
        },
        {
          question: "How is it different from a teleprompter or presenter view?",
          answer:
            "A teleprompter scrolls text at a fixed speed, and presenter view ties notes to slides. TempoScript ties time to the sections of your script: you move forward when you are ready, or let it advance automatically, and it shows whether you are within the time you planned.",
        },
        {
          question: "Can sections advance automatically?",
          answer:
            "Yes. Turn on Auto-advance in presentation mode and the app moves to the next section when the current one runs out of time.",
        },
        {
          question: "Which keyboard shortcuts are there?",
          answer:
            "In presentation mode: Space or P to play and pause, Right arrow or N for the next section, Left arrow or B for the previous one, F for fullscreen, + and - to change the text size, H to show or hide the help, and Esc to exit.",
        },
        {
          question: "Does it work on a phone or tablet?",
          answer: "Yes. The layout adapts to small screens, so you can keep the script on a phone while your slides are on another device.",
        },
      ],
    },
    footer: { guide: "Guide", source: "Source code", otherLocale: "Español" },
  },
  es: {
    hero: {
      title: "Un guion con tiempos para tus presentaciones, escrito en Markdown",
      lead: "TempoScript convierte un guion en Markdown en notas de orador que controlan el tiempo. Asigna una duración a cada sección, pulsa Start y la aplicación resalta por dónde vas, cuenta cuánto llevas hablando y te avisa cuando te pasas.",
      highlights: [
        "Gratis, con el código fuente en GitHub",
        "Funciona sin conexión y se instala como aplicación",
        "Sin cuenta: tu guion no sale de tu navegador",
      ],
      cta: "Abrir el editor",
    },
    how: {
      title: "Cómo funciona",
      steps: [
        {
          title: "Escribe tu guion en Markdown",
          body: "Escribe o pega tu charla en el editor. Los títulos, las listas, la negrita y los bloques de código se ven en la vista previa al instante.",
        },
        {
          title: "Añade marcadores de tiempo",
          body: "Pon una línea como ?05:00 antes de una sección para darle cinco minutos. Usa ??01:30 para una subsección que ocupa un minuto y medio de ese tiempo.",
        },
        {
          title: "Presenta",
          body: "Pulsa Start Presentation. La sección actual queda resaltada, los cronómetros avanzan y la barra de progreso se pone roja y parpadea cuando una sección supera su tiempo.",
        },
      ],
    },
    syntax: {
      title: "Sintaxis de los marcadores de tiempo",
      intro: "Un marcador de tiempo es una línea que empieza con uno o más signos de interrogación. Fija la duración del texto que tiene debajo, hasta el siguiente marcador.",
      columns: ["Marcador", "Significado"],
      rows: [
        { marker: "?10:00", meaning: "Sección principal de 10 minutos" },
        { marker: "??03:00", meaning: "Subsección de 3 minutos dentro de la sección anterior" },
        { marker: "???00:30", meaning: "Subsección de segundo nivel de 30 segundos" },
        { marker: "?!!", meaning: "Sección sin tiempo: el cronómetro muestra lo transcurrido, pero no hay límite" },
        { marker: "??!!", meaning: "Subsección sin tiempo: el tiempo de la sección padre sigue corriendo" },
      ],
      rulesTitle: "Reglas",
      rules: [
        "Cada marcador va en su propia línea.",
        "El tiempo se escribe como mm:ss y los segundos deben ser múltiplos de 5.",
        "Un marcador anidado lleva exactamente un signo de interrogación más que su padre.",
        "Una subsección no puede durar más que su sección padre.",
      ],
      guideLink: "Leer la guía completa (en inglés)",
    },
    useCases: {
      title: "Cuándo usarlo",
      intro: "TempoScript ayuda siempre que hablas contra el reloj y no tienes una vista de presentador que te guíe.",
      items: [
        {
          title: "Charlas y meetups",
          body: "Ensaya un turno de 20 minutos y descubre qué sección se come tu tiempo.",
        },
        {
          title: "Clases",
          body: "Divide una lección en bloques con tiempo y reserva sitio para preguntas con secciones sin tiempo.",
        },
        {
          title: "Defensas de TFG, TFM o tesis y pitches",
          body: "Los límites estrictos se cumplen mejor cuando cada parte de la exposición tiene su propio tiempo.",
        },
        {
          title: "Pódcast, directos y vídeo",
          body: "Ten la escaleta en una segunda pantalla y avanza por los bloques según lo previsto.",
        },
        {
          title: "Diapositivas sin notas de orador",
          body: "¿Presentas un PDF, una pestaña compartida o una demo en vivo? Lleva el guion y los tiempos en otro dispositivo.",
        },
      ],
    },
    privacy: {
      title: "Privado y sin conexión por diseño",
      paragraphs: [
        "TempoScript se ejecuta por completo en tu navegador. Tu guion se guarda en el almacenamiento local del navegador, en tu dispositivo. No hay cuenta, ni almacenamiento en servidor, ni seguimiento.",
        "Tras la primera visita, la aplicación funciona sin conexión a internet, y puedes instalarla en un ordenador, una tableta o un móvil desde el menú del navegador.",
      ],
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        {
          question: "¿Qué es TempoScript?",
          answer:
            "TempoScript es una aplicación web gratuita que convierte un guion en Markdown en notas de orador con tiempos. Marcas cada sección con una duración como ?05:00 y, durante la presentación, la aplicación resalta la sección actual y controla tu tiempo.",
        },
        {
          question: "¿TempoScript es gratis?",
          answer: "Sí. Es gratis, no tiene plan de pago y no pide cuenta. Es de código abierto con licencia MIT y el código está en GitHub.",
        },
        {
          question: "¿Funciona sin conexión?",
          answer:
            "Sí. Después de abrirla una vez, la aplicación queda guardada y funciona sin conexión. También puedes instalarla como aplicación desde el navegador.",
        },
        {
          question: "¿Dónde se guarda mi guion?",
          answer:
            "Solo en el almacenamiento local de tu navegador, en tu propio dispositivo. No se sube nada. Si borras los datos del navegador, el guion se pierde, así que usa Export para guardar una copia de lo importante.",
        },
        {
          question: "¿En qué se diferencia de un teleprompter o de la vista de presentador?",
          answer:
            "Un teleprompter desplaza el texto a velocidad fija y la vista de presentador une las notas a las diapositivas. TempoScript une el tiempo a las secciones de tu guion: avanzas cuando quieres, o dejas que avance solo, y ves si vas dentro del tiempo previsto.",
        },
        {
          question: "¿Las secciones pueden avanzar solas?",
          answer:
            "Sí. Activa Auto-advance en el modo presentación y la aplicación pasa a la siguiente sección cuando se agota el tiempo de la actual.",
        },
        {
          question: "¿Qué atajos de teclado hay?",
          answer:
            "En el modo presentación: Espacio o P para reproducir y pausar, Flecha derecha o N para la sección siguiente, Flecha izquierda o B para la anterior, F para pantalla completa, + y - para cambiar el tamaño del texto, H para mostrar u ocultar la ayuda y Esc para salir.",
        },
        {
          question: "¿Funciona en móvil o tableta?",
          answer: "Sí. El diseño se adapta a pantallas pequeñas, así que puedes llevar el guion en el móvil mientras las diapositivas están en otro dispositivo.",
        },
      ],
    },
    footer: { guide: "Guía", source: "Código fuente", otherLocale: "English" },
  },
}
