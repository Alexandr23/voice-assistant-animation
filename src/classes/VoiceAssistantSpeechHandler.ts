import { RecordingState, SpeechHandlerCallbacks } from '../types'

export class VoiceAssistantSpeechHandler {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private microphone: MediaStreamAudioSourceNode | null = null
  private dataArray: Uint8Array | null = null
  private audioBuffer: AudioBuffer | null = null
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private isRecording = false
  private isPlaying = false
  private recordingState: RecordingState = 'idle'
  private hasRecording = false
  private callbacks: SpeechHandlerCallbacks
  private frequencyUpdateInterval: number | null = null

  constructor(callbacks: SpeechHandlerCallbacks) {
    this.callbacks = callbacks
  }

  async init(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioContextClass()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 32
      const bufferLength = this.analyser.frequencyBinCount
      this.dataArray = new Uint8Array(bufferLength)
    } catch (error) {
      console.error('Error initializing audio:', error)
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording || this.isPlaying) return

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      if (!this.audioContext || !this.analyser) {
        await this.init()
      }

      if (!this.audioContext || !this.analyser) return

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      this.microphone = this.audioContext.createMediaStreamSource(this.stream)
      
      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = 0
      this.microphone.connect(this.analyser)
      this.analyser.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      const recordedChunks: Blob[] = []
      this.mediaRecorder = new MediaRecorder(this.stream)

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        if (recordedChunks.length > 0 && this.audioContext) {
          const blob = new Blob(recordedChunks, { type: 'audio/webm' })
          const arrayBuffer = await blob.arrayBuffer()
          this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
          this.hasRecording = true
          this.recordingState = 'idle'
          this.callbacks.onHasRecordingChange(true)
          this.callbacks.onRecordingStateChange('idle')
        }
      }

      this.mediaRecorder.start()
      this.isRecording = true
      this.recordingState = 'recording'
      this.callbacks.onRecordingStateChange('recording')

      // Start frequency updates
      this.startFrequencyUpdates()
    } catch (error) {
      console.error('Error starting recording:', error)
      this.recordingState = 'idle'
      this.callbacks.onRecordingStateChange('idle')
    }
  }

  stopRecording(): void {
    if (!this.isRecording) return

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
    }

    if (this.microphone) {
      this.microphone.disconnect()
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect()
      } catch (e) {
        // Ignore if already disconnected
      }
    }

    this.isRecording = false
    this.recordingState = 'idle'
    this.callbacks.onRecordingStateChange('idle')
    this.stopFrequencyUpdates()
  }

  playRecording(): void {
    if (!this.audioBuffer || this.isPlaying || this.isRecording || !this.audioContext) return

    this.isPlaying = true
    this.recordingState = 'playing'
    this.callbacks.onRecordingStateChange('playing')

    const source = this.audioContext.createBufferSource()
    source.buffer = this.audioBuffer

    const analyserForPlayback = this.audioContext.createAnalyser()
    analyserForPlayback.fftSize = 32
    source.connect(analyserForPlayback)
    analyserForPlayback.connect(this.audioContext.destination)

    this.analyser = analyserForPlayback
    this.dataArray = new Uint8Array(analyserForPlayback.frequencyBinCount)

    source.onended = () => {
      this.isPlaying = false
      this.recordingState = 'idle'
      this.callbacks.onRecordingStateChange('idle')
      this.stopFrequencyUpdates()
    }

    source.start(0)
    this.startFrequencyUpdates()
  }

  clearRecording(): void {
    if (this.isRecording || this.isPlaying) return

    this.audioBuffer = null
    this.hasRecording = false
    this.recordingState = 'idle'
    this.callbacks.onHasRecordingChange(false)
    this.callbacks.onRecordingStateChange('idle')
    this.stopFrequencyUpdates()
  }

  getFrequency(): number {
    if (!this.analyser || !this.dataArray || (!this.isRecording && !this.isPlaying)) {
      return 0
    }

    try {
      // @ts-expect-error - Web Audio API accepts Uint8Array regardless of buffer type
      this.analyser.getByteFrequencyData(this.dataArray)
      let sum = 0
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i]
      }
      return sum / this.dataArray.length
    } catch (error) {
      console.debug('Analyser not ready:', error)
      return 0
    }
  }

  private startFrequencyUpdates(): void {
    this.stopFrequencyUpdates() // Clear any existing interval
    this.frequencyUpdateInterval = window.setInterval(() => {
      const frequency = this.getFrequency()
      this.callbacks.onFrequencyUpdate(frequency)
    }, 16) // ~60fps
  }

  private stopFrequencyUpdates(): void {
    if (this.frequencyUpdateInterval !== null) {
      clearInterval(this.frequencyUpdateInterval)
      this.frequencyUpdateInterval = null
    }
  }

  getRecordingState(): RecordingState {
    return this.recordingState
  }

  getHasRecording(): boolean {
    return this.hasRecording
  }

  dispose(): void {
    this.stopFrequencyUpdates()
    this.stopRecording()
    
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
  }
}

