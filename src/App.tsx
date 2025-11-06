import { useState, useRef } from 'react'
import AudioVisualizer from './components/AudioVisualizer'
import Controls from './components/Controls'
import './App.css'

export type RecordingState = 'idle' | 'recording' | 'playing'

function App() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [hasRecording, setHasRecording] = useState(false)
  const visualizerRef = useRef<{ play: () => void; clear: () => void } | null>(null)

  const handlePlay = () => {
    visualizerRef.current?.play()
  }

  const handleClear = () => {
    visualizerRef.current?.clear()
    setHasRecording(false)
  }

  return (
    <div className="app">
      <AudioVisualizer
        ref={visualizerRef}
        onRecordingStateChange={setRecordingState}
        onHasRecordingChange={setHasRecording}
      />
      <Controls
        recordingState={recordingState}
        hasRecording={hasRecording}
        onPlay={handlePlay}
        onClear={handleClear}
      />
    </div>
  )
}

export default App

