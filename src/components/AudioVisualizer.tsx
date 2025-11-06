import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { RecordingState } from '../App'
import { useSpeechHandler } from '../hooks/useSpeechHandler'
import Animation3D from './Animation3D'

export interface AudioVisualizerHandle {
  play: () => void
  clear: () => void
}

interface AudioVisualizerProps {
  onRecordingStateChange: (state: RecordingState) => void
  onHasRecordingChange: (has: boolean) => void
}

const AudioVisualizer = forwardRef<AudioVisualizerHandle, AudioVisualizerProps>(
  ({ onRecordingStateChange, onHasRecordingChange }, ref) => {
    const [frequency, setFrequency] = useState(0)
    const speechHandler = useSpeechHandler(onRecordingStateChange, onHasRecordingChange)
    const spaceKeyPressedRef = useRef(false)

    useImperativeHandle(ref, () => ({
      play: () => {
        speechHandler.playRecording()
      },
      clear: () => {
        speechHandler.clearRecording()
      },
    }))

    // Update frequency from speech handler
    useEffect(() => {
      const interval = setInterval(() => {
        const freq = speechHandler.getFrequency()
        setFrequency(freq)
      }, 16) // ~60fps

      return () => clearInterval(interval)
    }, [speechHandler])

    // Keyboard controls
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.code === 'Space' && !spaceKeyPressedRef.current && speechHandler.recordingState !== 'playing') {
          e.preventDefault()
          spaceKeyPressedRef.current = true
          speechHandler.startRecording()
        }
      }

      const handleKeyUp = (e: KeyboardEvent): void => {
        if (e.code === 'Space' && spaceKeyPressedRef.current) {
          e.preventDefault()
          spaceKeyPressedRef.current = false
          speechHandler.stopRecording()
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)

      return (): void => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
      }
    }, [speechHandler])

    return <Animation3D frequency={frequency} />
  }
)

AudioVisualizer.displayName = 'AudioVisualizer'

export default AudioVisualizer

