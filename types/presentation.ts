export interface TimeMarker {
  time: number // Time in seconds
  level: number // Nesting level (number of ? symbols)
  noTimeControl: boolean // Whether this is a !! block
}

export interface ContentBlock {
  content: string
  timeMarker?: TimeMarker
  children: ContentBlock[]
}

export interface ValidationError {
  message: string
  line: number
}

export interface PresentationState {
  currentBlockIndex: number
  isPlaying: boolean
  totalElapsedTime: number
  blockElapsedTime: number
  parentElapsedTime: number
  shouldAdvance: boolean
}
