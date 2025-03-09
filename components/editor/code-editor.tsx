"use client"

import { useRef, useCallback, useEffect } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { validateTimeMarkers } from "@/lib/time-marker"
import type { ValidationError } from "@/types/presentation"
import { Decoration, EditorView } from "@codemirror/view"
import { StateField, StateEffect } from "@codemirror/state"
import { X } from "lucide-react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  onValidationChange: (errors: ValidationError[]) => void
  errors: ValidationError[]
  isExpanded: boolean
  onExpand: () => void
  onCollapse: () => void
}

// Define an effect for updating error decorations
const addErrorMark = StateEffect.define<{ from: number; to: number }>()

// Create a state field for managing error decorations
const errorField = StateField.define({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    // Clear all decorations first
    decorations = Decoration.none
    for (const e of tr.effects) {
      if (e.is(addErrorMark)) {
        decorations = decorations.update({
          add: [
            Decoration.mark({
              class: "cm-error-underline",
              attributes: { style: "text-decoration: wavy underline red" },
            }).range(e.value.from, e.value.to),
          ],
        })
      }
    }
    return decorations
  },
  provide: (f) => EditorView.decorations.from(f),
})

export function CodeEditor({
  value,
  onChange,
  onValidationChange,
  errors,
  isExpanded,
  onExpand,
  onCollapse,
}: CodeEditorProps) {
  const view = useRef<EditorView>()
  const editorRef = useRef<HTMLDivElement>(null)

  const handleChange = useCallback(
    (value: string) => {
      onChange(value)
      const errors = validateTimeMarkers(value)
      onValidationChange(errors)
    },
    [onChange, onValidationChange],
  )

  // Update error decorations when errors change
  useEffect(() => {
    if (view.current) {
      const lines = value.split("\n")
      const effects = errors.map((error) => {
        const lineStart = lines.slice(0, error.line).reduce((acc, line) => acc + line.length + 1, 0)
        const lineEnd = lineStart + lines[error.line].length
        return addErrorMark.of({ from: lineStart, to: lineEnd })
      })

      view.current.dispatch({
        effects,
      })
    }
  }, [errors, value])

  // Handle double-click to expand
  const handleDoubleClick = useCallback(() => {
    if (!isExpanded) {
      onExpand()
    }
  }, [isExpanded, onExpand])

  // Handle escape key to collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        onCollapse()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isExpanded, onCollapse])

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isExpanded &&
        editorRef.current &&
        !editorRef.current.contains(e.target as Node) &&
        // Make sure we're not clicking on a CodeMirror element
        !(e.target as HTMLElement).closest(".cm-editor")
      ) {
        onCollapse()
      }
    }

    if (isExpanded) {
      // Use a small delay to avoid immediate collapse after double-click
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside)
      }, 100)

      return () => {
        clearTimeout(timer)
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isExpanded, onCollapse])

  return (
    <div
      ref={editorRef}
      className="h-full w-full border rounded-lg overflow-hidden flex flex-col"
      onDoubleClick={handleDoubleClick}
    >
      {isExpanded && (
        <div className="bg-muted p-2 flex justify-between items-center">
          <span className="text-sm">
            Press <kbd className="px-1 bg-background rounded">Esc</kbd> or click outside to exit expanded mode
          </span>
          <button
            onClick={onCollapse}
            className="p-1 hover:bg-background rounded-sm"
            aria-label="Close expanded editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={value}
          height="100%"
          extensions={[markdown(), errorField]}
          onChange={handleChange}
          className="text-sm h-full"
          theme="dark"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
          }}
          onCreateEditor={(v) => {
            view.current = v
          }}
        />
      </div>
    </div>
  )
}

