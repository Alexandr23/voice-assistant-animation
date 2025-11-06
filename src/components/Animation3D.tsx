import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import vertexShader from '../shaders/vertexShader.glsl?raw'
import fragmentShader from '../shaders/fragmentShader.glsl?raw'
// @ts-ignore - dat.gui doesn't have perfect TypeScript support
import { GUI } from 'dat.gui'

interface Animation3DProps {
  frequency: number
}

export default function Animation3D({ frequency }: Animation3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const composerRef = useRef<EffectComposer | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const meshMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const bloomPassRef = useRef<UnrealBloomPass | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const clockRef = useRef<THREE.Clock | null>(null)
  const mouseXRef = useRef(0)
  const mouseYRef = useRef(0)
  const guiRef = useRef<GUI | null>(null)
  const frequencyRef = useRef(0)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const width = 200
    const height = 200
    const aspect = width / height

    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
    camera.position.set(0, -2, 14)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0) // Transparent background
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Post-processing for bloom effect
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // Bloom parameters
    const bloomParams = {
      threshold: 0.3,
      strength: 0.1,
      radius: 0.8,
    }

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      bloomParams.strength,
      bloomParams.radius,
      bloomParams.threshold
    )
    composer.addPass(bloomPass)
    bloomPassRef.current = bloomPass

    const outputPass = new OutputPass()
    composer.addPass(outputPass)
    composerRef.current = composer

    // Setup GUI for bloom controls
    const gui = new GUI()
    guiRef.current = gui
    
    const bloomFolder = gui.addFolder('Bloom')
    bloomFolder.add(bloomParams, 'threshold', 0, 1).onChange((value: number) => {
      if (bloomPassRef.current) {
        bloomPassRef.current.threshold = Number(value)
      }
    })
    bloomFolder.add(bloomParams, 'strength', 0, 3).onChange((value: number) => {
      if (bloomPassRef.current) {
        bloomPassRef.current.strength = Number(value)
      }
    })
    bloomFolder.add(bloomParams, 'radius', 0, 1).onChange((value: number) => {
      if (bloomPassRef.current) {
        bloomPassRef.current.radius = Number(value)
      }
    })
    bloomFolder.open()

    // Create icosahedron mesh with Perlin noise shaders
    const uniforms = {
      u_time: { value: 0.0 },
      u_frequency: { value: 0.0 },
      u_red: { value: 1.0 },
      u_green: { value: 1.0 },
      u_blue: { value: 1.0 },
    }

    const meshMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    })
    meshMaterial.wireframe = true
    meshMaterialRef.current = meshMaterial

    const geometry = new THREE.IcosahedronGeometry(4, 15)
    const mesh = new THREE.Mesh(geometry, meshMaterial)
    scene.add(mesh)
    meshRef.current = mesh

    // Initialize clock for time
    clockRef.current = new THREE.Clock()

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Mouse interaction for camera movement
    const handleMouseMove = (e: MouseEvent): void => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const containerCenterX = rect.left + rect.width / 2
      const containerCenterY = rect.top + rect.height / 2
      
      mouseXRef.current = (e.clientX - containerCenterX) / 100
      mouseYRef.current = (e.clientY - containerCenterY) / 100
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    const animate = (): void => {
      animationFrameRef.current = requestAnimationFrame(animate)

      if (!meshRef.current || !meshMaterialRef.current || !bloomPassRef.current || !composerRef.current || !clockRef.current || !cameraRef.current) return

      // Update camera position based on mouse
      cameraRef.current.position.x += (mouseXRef.current - cameraRef.current.position.x) * 0.05
      cameraRef.current.position.y += (-mouseYRef.current - cameraRef.current.position.y) * 0.5
      cameraRef.current.lookAt(scene.position)

      // Update time uniform
      meshMaterialRef.current.uniforms.u_time.value = clockRef.current.getElapsedTime()

      // Get current frequency from ref (updated by useEffect)
      const currentFrequency = frequencyRef.current

      // Update shader uniforms based on audio frequency
      meshMaterialRef.current.uniforms.u_frequency.value = currentFrequency

      // Update colors and bloom based on frequency
      if (currentFrequency > 0) {
        const intensity = currentFrequency / 255
        meshMaterialRef.current.uniforms.u_red.value = 1.0
        meshMaterialRef.current.uniforms.u_green.value = 1.0
        meshMaterialRef.current.uniforms.u_blue.value = 1.0
        
        bloomPassRef.current.strength = 0.5 + intensity * 2
      } else {
        meshMaterialRef.current.uniforms.u_frequency.value = 0
        meshMaterialRef.current.uniforms.u_red.value = 1.0
        meshMaterialRef.current.uniforms.u_green.value = 1.0
        meshMaterialRef.current.uniforms.u_blue.value = 1.0
        
        if (bloomPassRef.current) {
          bloomPassRef.current.strength = 0.5
        }
      }

      composerRef.current.render()
    }

    animate()

    // Handle window resize
    const handleResize = (): void => {
      if (!cameraRef.current || !rendererRef.current || !composerRef.current) return

      const width = 200
      const height = 200
      const aspect = width / height

      cameraRef.current.aspect = aspect
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
      composerRef.current.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return (): void => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement)
      }

      if (guiRef.current) {
        guiRef.current.destroy()
        guiRef.current = null
      }

      rendererRef.current?.dispose()
      composerRef.current = null
    }
  }, [])

  // Update frequency ref whenever the prop changes
  useEffect(() => {
    frequencyRef.current = frequency
  }, [frequency])

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '200px', 
        height: '200px',
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 10,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
      }} 
    />
  )
}

