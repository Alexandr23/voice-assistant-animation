# 3D Speech Visualizer

A beautiful 3D audio visualizer using Three.js, React, and TypeScript that records your voice and creates a glowing bloom sphere animation. Hold space and speak to record, then replay your recording to see the visualization in action.

## Features

- 🎤 **Voice Recording**: Hold SPACE key and speak to record your voice
- 🎵 **Audio Playback**: Replay your recorded audio with synchronized visualization
- ✨ **Glowing Bloom Effect**: Beautiful animated sphere with bloom post-processing
- 🎨 **Real-time Visualization**: Sphere reacts to your voice in real-time
- 💾 **Audio Storage**: Recordings are saved and can be replayed
- ⚛️ **React + TypeScript**: Modern, type-safe React application

## Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)
5. Allow microphone access when prompted
6. Hold **SPACE** and speak to record
7. Click **Play Recording** to see the visualization

## Build

To build for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Controls

- **SPACE (Hold)**: Record audio while speaking
- **Play Recording**: Replay your recorded audio with visualization
- **Clear**: Delete the current recording

## How It Works

- Uses Web Audio API to capture and analyze audio frequencies
- Three.js for 3D rendering with a glowing sphere
- UnrealBloomPass for the beautiful bloom/glow effect
- Real-time frequency analysis drives the sphere animation (scale, color, intensity)
- React components manage state and UI
- TypeScript ensures type safety throughout

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Three.js** - 3D graphics
- **Vite** - Build tool and dev server
- **Web Audio API** - Audio processing
- **MediaRecorder API** - Audio recording

## Project Structure

```
src/
├── components/
│   ├── AudioVisualizer.tsx  # Three.js visualization logic
│   ├── Controls.tsx          # UI controls component
│   └── Controls.css          # Controls styling
├── App.tsx                   # Main app component
├── App.css                   # App styles
├── main.tsx                  # React entry point
└── index.css                 # Global styles
```

## Browser Compatibility

Works best in modern browsers that support:
- Web Audio API
- MediaRecorder API
- WebGL
- ES2020+ features

Enjoy creating beautiful visualizations of your voice! 🎉

