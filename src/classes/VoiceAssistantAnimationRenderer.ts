import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
// @ts-ignore - dat.gui doesn't have perfect TypeScript support
import { GUI } from 'dat.gui'
import vertexShader from '../shaders/vertexShader.glsl?raw'
import fragmentShader from '../shaders/fragmentShader.glsl?raw'

export interface AnimationRendererConfig {
  width?: number
  height?: number
  container: HTMLElement
}

export class VoiceAssistantAnimationRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private composer: EffectComposer
  private mesh: THREE.Mesh
  private meshMaterial: THREE.ShaderMaterial
  private bloomPass: UnrealBloomPass
  private clock: THREE.Clock
  private gui: GUI | null = null
  private animationFrameId: number | null = null
  private mouseX = 0
  private mouseY = 0
  private frequency = 0
  private width: number
  private height: number
  private container: HTMLElement
  private handleMouseMove: ((e: MouseEvent) => void) | null = null
  private handleResize: (() => void) | null = null

  constructor(config: AnimationRendererConfig) {
    this.width = config.width || 200
    this.height = config.height || 200
    this.container = config.container

    // Initialize scene
    this.scene = new THREE.Scene()

    // Initialize camera
    const aspect = this.width / this.height
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
    this.camera.position.set(0, -2, 14)
    this.camera.lookAt(0, 0, 0)

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(this.width, this.height)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(0x000000, 0) // Transparent background
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.container.appendChild(this.renderer.domElement)

    // Post-processing for bloom effect
    this.composer = new EffectComposer(this.renderer)
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    // Bloom parameters
    const bloomParams = {
      threshold: 0.3,
      strength: 0.1,
      radius: 0.8,
    }

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      bloomParams.strength,
      bloomParams.radius,
      bloomParams.threshold
    )
    this.composer.addPass(this.bloomPass)

    const outputPass = new OutputPass()
    this.composer.addPass(outputPass)

    // Setup GUI for bloom controls
    this.gui = new GUI()
    const bloomFolder = this.gui.addFolder('Bloom')
    bloomFolder.add(bloomParams, 'threshold', 0, 1).onChange((value: number) => {
      this.bloomPass.threshold = Number(value)
    })
    bloomFolder.add(bloomParams, 'strength', 0, 3).onChange((value: number) => {
      this.bloomPass.strength = Number(value)
    })
    bloomFolder.add(bloomParams, 'radius', 0, 1).onChange((value: number) => {
      this.bloomPass.radius = Number(value)
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

    this.meshMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    })
    this.meshMaterial.wireframe = true

    const geometry = new THREE.IcosahedronGeometry(4, 15)
    this.mesh = new THREE.Mesh(geometry, this.meshMaterial)
    this.scene.add(this.mesh)

    // Initialize clock for time
    this.clock = new THREE.Clock()

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    // Setup mouse interaction
    this.setupMouseInteraction()
    this.setupResizeHandler()
    this.startAnimation()
  }

  private setupMouseInteraction(): void {
    this.handleMouseMove = (e: MouseEvent): void => {
      const rect = this.container.getBoundingClientRect()
      const containerCenterX = rect.left + rect.width / 2
      const containerCenterY = rect.top + rect.height / 2
      
      this.mouseX = (e.clientX - containerCenterX) / 100
      this.mouseY = (e.clientY - containerCenterY) / 100
    }

    window.addEventListener('mousemove', this.handleMouseMove)
  }

  private setupResizeHandler(): void {
    this.handleResize = (): void => {
      const width = this.width
      const height = this.height
      const aspect = width / height

      this.camera.aspect = aspect
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(width, height)
      this.composer.setSize(width, height)
    }

    window.addEventListener('resize', this.handleResize)
  }

  private startAnimation(): void {
    const animate = (): void => {
      this.animationFrameId = requestAnimationFrame(animate)

      // Update camera position based on mouse
      this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.05
      this.camera.position.y += (-this.mouseY - this.camera.position.y) * 0.5
      this.camera.lookAt(this.scene.position)

      // Update time uniform
      this.meshMaterial.uniforms.u_time.value = this.clock.getElapsedTime()

      // Update shader uniforms based on audio frequency
      this.meshMaterial.uniforms.u_frequency.value = this.frequency

      // Update colors and bloom based on frequency
      if (this.frequency > 0) {
        const intensity = this.frequency / 255
        this.meshMaterial.uniforms.u_red.value = 1.0
        this.meshMaterial.uniforms.u_green.value = 1.0
        this.meshMaterial.uniforms.u_blue.value = 1.0
        
        this.bloomPass.strength = 0.5 + intensity * 2
      } else {
        this.meshMaterial.uniforms.u_frequency.value = 0
        this.meshMaterial.uniforms.u_red.value = 1.0
        this.meshMaterial.uniforms.u_green.value = 1.0
        this.meshMaterial.uniforms.u_blue.value = 1.0
        
        this.bloomPass.strength = 0.5
      }

      this.composer.render()
    }

    animate()
  }

  update(frequency: number): void {
    this.frequency = frequency
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }

    if (this.handleMouseMove) {
      window.removeEventListener('mousemove', this.handleMouseMove)
    }

    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize)
    }

    if (this.renderer && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }

    if (this.gui) {
      this.gui.destroy()
      this.gui = null
    }

    this.renderer?.dispose()
  }
}

