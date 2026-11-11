"use client"

import { useRef } from "react"
import { Download, Link2, RotateCcw, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EditorToolbarProps {
  onImport: (text: string, fileName: string) => void
  onImportError: () => void
  onExport: () => void
  onShare: () => void
  onReset: () => void
}

const MAX_IMPORT_BYTES = 2 * 1024 * 1024

export function EditorToolbar({ onImport, onImportError, onExport, onShare, onReset }: EditorToolbarProps) {
  const fileInput = useRef<HTMLInputElement>(null)

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Clear the input so choosing the same file again fires a change event
    event.target.value = ""
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      onImportError()
      return
    }
    try {
      onImport(await file.text(), file.name)
    } catch {
      onImportError()
    }
  }

  return (
    <div role="toolbar" aria-label="Script" className="mb-3 flex flex-wrap gap-2">
      <input
        ref={fileInput}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        className="hidden"
        onChange={handleFile}
      />
      <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button variant="outline" size="sm" onClick={onShare}>
        <Link2 className="mr-2 h-4 w-4" />
        Copy link
      </Button>
      <Button variant="ghost" size="sm" onClick={onReset} className="ml-auto text-muted-foreground">
        <RotateCcw className="mr-2 h-4 w-4" />
        Load example
      </Button>
    </div>
  )
}
