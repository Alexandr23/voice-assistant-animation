import { RecordingState } from '../types'
import './VoiceAssistantPlayer.css'

interface VoiceAssistantPlayerProps {
  recordingState: RecordingState
  hasRecording: boolean
  onPlay: () => void
  onClear: () => void
}

export default function VoiceAssistantPlayer({
  recordingState,
  hasRecording,
  onPlay,
  onClear,
}: VoiceAssistantPlayerProps) {
  const getStatusText = () => {
    switch (recordingState) {
      case 'recording':
        return 'Recording...'
      case 'playing':
        return 'Playing...'
      default:
        return hasRecording ? 'Ready to play' : 'Ready to record'
    }
  }

  const getStatusClass = () => {
    if (recordingState === 'recording') return 'recording'
    if (recordingState === 'playing') return 'playing'
    return ''
  }

  return (
    <div className="controls">
      <div className="instructions">
        <h3>3D Speech Visualizer</h3>
        <p>Hold <strong>SPACE</strong> and speak to record</p>
      </div>
      <div className={`status ${getStatusClass()}`}>
        {getStatusText()}
      </div>
      <div>
        <button
          onClick={onPlay}
          disabled={!hasRecording || recordingState !== 'idle'}
        >
          Play Recording
        </button>
        <button
          onClick={onClear}
          disabled={recordingState !== 'idle'}
        >
          Clear
        </button>
      </div>
      <div className="space-hint">
        ⚠️ Press and HOLD Spacebar to record
      </div>
    </div>
  )
}

