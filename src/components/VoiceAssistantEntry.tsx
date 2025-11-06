import { useEffect, useRef, useState } from 'react'
import { RecordingState } from '../types'
import { VoiceAssistantSpeechHandler } from '../classes/VoiceAssistantSpeechHandler'
import VoiceAssistantAnimation from './VoiceAssistantAnimation'
import VoiceAssistantPlayer from './VoiceAssistantPlayer'

export default function VoiceAssistantEntry() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [hasRecording, setHasRecording] = useState(false)
  const [frequency, setFrequency] = useState(0)
  const speechHandlerRef = useRef<VoiceAssistantSpeechHandler | null>(null)
  const spaceKeyPressedRef = useRef(false)

  useEffect(() => {
    const callbacks = {
      onRecordingStateChange: (state: RecordingState) => {
        setRecordingState(state)
      },
      onHasRecordingChange: (has: boolean) => {
        setHasRecording(has)
      },
      onFrequencyUpdate: (freq: number) => {
        setFrequency(freq)
      },
    }

    const handler = new VoiceAssistantSpeechHandler(callbacks)
    handler.init()
    speechHandlerRef.current = handler

    return () => {
      handler.dispose()
      speechHandlerRef.current = null
    }
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && !spaceKeyPressedRef.current && recordingState !== 'playing') {
        e.preventDefault()
        spaceKeyPressedRef.current = true
        speechHandlerRef.current?.startRecording()
      }
    }

    const handleKeyUp = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && spaceKeyPressedRef.current) {
        e.preventDefault()
        spaceKeyPressedRef.current = false
        speechHandlerRef.current?.stopRecording()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return (): void => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [recordingState])

  const handlePlay = () => {
    speechHandlerRef.current?.playRecording()
  }

  const handleClear = () => {
    speechHandlerRef.current?.clearRecording()
  }

  return (
    <div className="app">
      <VoiceAssistantAnimation frequency={frequency} />
      <VoiceAssistantPlayer
        recordingState={recordingState}
        hasRecording={hasRecording}
        onPlay={handlePlay}
        onClear={handleClear}
      />
    </div>
  )
}

