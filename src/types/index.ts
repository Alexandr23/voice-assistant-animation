export type RecordingState = 'idle' | 'recording' | 'playing'

export interface SpeechHandlerCallbacks {
  onRecordingStateChange: (state: RecordingState) => void
  onHasRecordingChange: (has: boolean) => void
  onFrequencyUpdate: (frequency: number) => void
}

