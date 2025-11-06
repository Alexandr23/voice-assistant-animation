import { useRef, useCallback, useState, useEffect } from 'react'
import { RecordingState } from '../App'

interface UseSpeechHandlerReturn {
  startRecording: () => Promise<void>
  stopRecording: () => void
  playRecording: () => void
  clearRecording: () => void
  getFrequency: () => number
  recordingState: RecordingState
  hasRecording: boolean
}

export function useSpeechHandler(
  onRecordingStateChange: (state: RecordingState) => void,
  onHasRecordingChange: (has: boolean) => void
): UseSpeechHandlerReturn {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isRecordingRef = useRef(false)
  const isPlayingRef = useRef(false)
  
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [hasRecording, setHasRecording] = useState(false)

  // Sync state changes with parent callbacks
  useEffect(() => {
    onRecordingStateChange(recordingState)
  }, [recordingState, onRecordingStateChange])

  useEffect(() => {
    onHasRecordingChange(hasRecording)
  }, [hasRecording, onHasRecordingChange])

  const initAudio = useCallback(async (): Promise<void> => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContextClass()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 32
      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)
    } catch (error) {
      console.error('Error initializing audio:', error)
    }
  }, [])

  const startRecording = useCallback(async (): Promise<void> => {
    if (isRecordingRef.current || isPlayingRef.current) return

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })

      if (!audioContextRef.current || !analyserRef.current) {
        await initAudio()
      }

      if (!audioContextRef.current || !analyserRef.current) return

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      microphoneRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current)
      
      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.value = 0
      microphoneRef.current.connect(analyserRef.current)
      analyserRef.current.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      const recordedChunks: Blob[] = []
      mediaRecorderRef.current = new MediaRecorder(streamRef.current)

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        if (recordedChunks.length > 0 && audioContextRef.current) {
          const blob = new Blob(recordedChunks, { type: 'audio/webm' })
          const arrayBuffer = await blob.arrayBuffer()
          audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer)
          setHasRecording(true)
          setRecordingState('idle')
        }
      }

      mediaRecorderRef.current.start()
      isRecordingRef.current = true
      setRecordingState('recording')
    } catch (error) {
      console.error('Error starting recording:', error)
      setRecordingState('idle')
    }
  }, [initAudio])

  const stopRecording = useCallback((): void => {
    if (!isRecordingRef.current) return

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect()
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
      } catch (e) {
        // Ignore if already disconnected
      }
    }

    isRecordingRef.current = false
    setRecordingState('idle')
  }, [])

  const playRecording = useCallback((): void => {
    if (!audioBufferRef.current || isPlayingRef.current || isRecordingRef.current || !audioContextRef.current) return

    isPlayingRef.current = true
    setRecordingState('playing')

    const source = audioContextRef.current.createBufferSource()
    source.buffer = audioBufferRef.current

    const analyserForPlayback = audioContextRef.current.createAnalyser()
    analyserForPlayback.fftSize = 32
    source.connect(analyserForPlayback)
    analyserForPlayback.connect(audioContextRef.current.destination)

    analyserRef.current = analyserForPlayback
    dataArrayRef.current = new Uint8Array(analyserForPlayback.frequencyBinCount)

    source.onended = () => {
      isPlayingRef.current = false
      setRecordingState('idle')
    }

    source.start(0)
  }, [])

  const clearRecording = useCallback((): void => {
    if (isRecordingRef.current || isPlayingRef.current) return

    audioBufferRef.current = null
    setHasRecording(false)
    setRecordingState('idle')
  }, [])

  const getFrequency = useCallback((): number => {
    if (!analyserRef.current || !dataArrayRef.current || (!isRecordingRef.current && !isPlayingRef.current)) {
      return 0
    }

    try {
      // @ts-expect-error - Web Audio API accepts Uint8Array regardless of buffer type
      analyserRef.current.getByteFrequencyData(dataArrayRef.current)
      let sum = 0
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i]
      }
      return sum / dataArrayRef.current.length
    } catch (error) {
      console.debug('Analyser not ready:', error)
      return 0
    }
  }, [])

  return {
    startRecording,
    stopRecording,
    playRecording,
    clearRecording,
    getFrequency,
    recordingState,
    hasRecording,
  }
}

