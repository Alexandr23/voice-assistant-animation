import { useEffect, useRef } from 'react'
import { VoiceAssistantAnimationRenderer } from '../classes/VoiceAssistantAnimationRenderer'

interface VoiceAssistantAnimationProps {
  frequency: number
  width?: number
  height?: number
  style?: React.CSSProperties
}

export default function VoiceAssistantAnimation({
  frequency,
  width = 200,
  height = 200,
  style,
}: VoiceAssistantAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<VoiceAssistantAnimationRenderer | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const renderer = new VoiceAssistantAnimationRenderer({
      container: containerRef.current,
      width,
      height,
    })
    rendererRef.current = renderer

    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [width, height])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.update(frequency)
    }
  }, [frequency])

  const defaultStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 10,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    ...style,
  }

  return <div ref={containerRef} style={defaultStyle} />
}

