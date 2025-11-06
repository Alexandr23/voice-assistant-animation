import VoiceAssistantEntry from './components/VoiceAssistantEntry'
import './App.css'

// Re-export RecordingState for backwards compatibility
export type { RecordingState } from './types'

function App() {
  return <VoiceAssistantEntry />
}

export default App

