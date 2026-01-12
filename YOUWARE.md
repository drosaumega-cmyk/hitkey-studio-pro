# AI Audio Studio Pro - React Application

A comprehensive audio processing suite built with React 18, TypeScript, Vite, and Tailwind CSS, featuring LALAL.AI technology and professional audio processing capabilities.

## Project Overview

- **Project Type**: Professional Audio Processing Suite
- **Technology**: LALAL.AI Voice Cloning & Audio Processing Integration
- **Entry Point**: `src/main.tsx` (React application entry)
- **Build System**: Vite 7.0.0 (Fast development and build)
- **Styling System**: Tailwind CSS 3.4.17 (Atomic CSS framework)
- **UI Framework**: Lucide React Icons + HugeIcons for comprehensive iconography
- **Dark Mode**: Full dark/light theme support with class-based toggle

## Application Features

### Core Audio Processing Suite

#### 1. Voice Cloning Studio
- **Voice Sample Upload**: Upload 1-5 high-quality audio files (10-50 minutes recommended)
- **Multi-Format Support**: Accepts various audio formats for voice training
- **File Management**: Individual file control with play, pause, and remove functionality
- **Duration Tracking**: Real-time tracking of total upload duration
- **Text-to-Speech**: Convert any text to speech using cloned voices
- **Processing Status**: Real-time processing indicators and loading states

#### 2. AI Stem Splitter
- **Instrument Separation**: Extract vocals, drums, bass, guitar, piano, and other instruments
- **LALAL.AI Phoenix Algorithm**: Clean results with minimal artifacts
- **Batch Processing**: Process multiple stems simultaneously
- **Professional Quality**: High-quality stem isolation for music production

#### 3. Voice Cleaner
- **Noise Removal**: AI-powered background noise elimination
- **Audio Enhancement**: Improve clarity and audio quality
- **Normalization**: Audio level normalization for consistent output
- **Real-time Processing**: Instant audio quality improvements

#### 4. Voice Changer
- **Real-time Effects**: Transform voices with pitch, speed, and tone controls
- **Character Presets**: Robot, Child, Elder, Monster, Alien, Hero voices
- **Custom Settings**: Adjustable pitch (-12 to +12), speed (0.5x to 2x), tone selection
- **Live Preview**: Real-time voice transformation preview

#### 5. Lead/Back Vocal Splitter
- **Vocal Separation**: Isolate lead vocals from backing vocals
- **Harmony Extraction**: Extract background vocals and harmonies
- **Music Production**: Professional vocal separation for remixing

#### 6. Echo & Reverb Remover
- **Room Correction**: Remove unwanted room acoustics
- **Echo Elimination**: Clean up echo effects from recordings
- **Reverb Cleanup**: Remove artificial reverb artifacts
- **Adjustable Strength**: Customizable reduction intensity

#### 7. AI Music Video Creator
- **Text-to-Video Generation**: Create videos from descriptive text prompts
- **Image-to-Video Transformation**: Animate static images with AI-powered motion
- **Advanced Prompting**: Template-based prompts with customizable styles
- **Multi-Model Support**: VEO3, VEO3-Fast, and Midjourney-Video AI models
- **Real-time Processing**: Live status monitoring with polling system
- **Professional Settings**: Resolution, aspect ratio, and style customization
- **Traditional Video Sync**: Legacy audio-video synchronization features

### User Interface Design

- **Modern Gradient Design**: Attractive gradient backgrounds with glassmorphism effects
- **Dark/Light Mode**: Comprehensive theme support with smooth transitions
- **Tabbed Navigation**: Intuitive tab-based interface for different tools
- **Responsive Layout**: Fully responsive for desktop and mobile devices
- **Interactive Elements**: Hover effects, loading animations, and status indicators
- **Professional Cards**: Card-based layout with backdrop blur and shadow effects

### AI Integration

- **LALAL.AI Technology**: Professional-grade audio processing algorithms
- **VEO3 Video Generation**: AI-powered music video creation
- **Template System**: Configurable AI prompts with variable interpolation
- **Real-time Processing**: Live audio processing and transformation

## Technical Architecture

### Core Framework
- **React**: 18.3.1 - Declarative UI library with hooks
- **TypeScript**: 5.8.3 - Type-safe JavaScript development
- **Vite**: 7.0.0 - Next generation frontend build tool
- **Tailwind CSS**: 3.4.17 - Atomic CSS framework with dark mode support

### Icon Libraries
- **Lucide React**: Primary icon library for UI elements
- **HugeIcons**: Comprehensive icon library for audio/video processing features

### State Management
- **React Hooks**: Built-in state management for component state
- **File Management**: Efficient handling of multiple audio/video files
- **Theme Management**: Dark/light mode state with localStorage persistence

### Audio Processing
- **File Upload**: Multi-file audio upload with validation
- **Audio Playback**: HTML5 audio controls with custom interface
- **Duration Calculation**: Real-time audio duration tracking
- **Memory Management**: Proper cleanup of audio object URLs

### Responsive Design
- **Mobile-First**: Responsive design approach
- **Grid Layouts**: CSS Grid and Flexbox for complex layouts
- **Breakpoint Management**: Tailwind responsive utilities
- **Touch Support**: Mobile-friendly interactions

## AI Configuration

### yw_manifest.json Structure
```json
{
  "ai_config": {
    "voice_cloning": {
      "model": "deepseek-v3",
      "temperature": 0.7,
      "maxTokens": 4000,
      "system_prompt": "You are an AI voice cloning assistant..."
    },
    "audio_processing": {
      "model": "gemini-2.5-flash",
      "temperature": 0.3,
      "maxTokens": 2000,
      "system_prompt": "You are an expert audio processing assistant..."
    },
    "music_video_creator": {
      "model": "veo3-fast",
      "response_format": "url",
      "prompt_template": "Create a music video with ${style} aesthetic..."
    }
  }
}
```

### Template Variables
- AI prompts support dynamic variable interpolation
- String templates with `${variable}` syntax become callable functions
- Enables dynamic content generation and customization

## Development Commands

- **Install dependencies**: `npm install`
- **Development mode**: `npm run dev`
- **Build project**: `npm run build`
- **Preview build**: `npm run preview`

## Build Configuration

### Tailwind CSS Extensions
- **Dark Mode**: Class-based dark mode support
- **Custom Animations**: Fade-in, slide-up, pulse animations
- **Extended Shadows**: Glow effects for interactive elements
- **Backdrop Blur**: Glass morphism effects

### TypeScript Configuration
- Strict type checking enabled
- React types and hooks support
- Audio/video file interface definitions

## Key Components

### Main Application (`src/App.tsx`)
- **Tab Navigation**: Multi-tool interface with 7 different audio processing tools
- **Theme Toggle**: Dark/light mode switching with icon transitions
- **File Management**: Audio/video file upload, preview, and management
- **Processing States**: Loading indicators and status feedback
- **Responsive Layout**: Adaptive interface for different screen sizes

### Audio Processing Interfaces
- **Voice File Management**: TypeScript interfaces for audio file handling
- **Processing Results**: Structured result handling for different processing types
- **Settings Management**: Voice transformation controls and presets

### UI Components
- **Interactive Cards**: Glassmorphism card designs with hover effects
- **Progress Indicators**: Custom loading states and progress feedback
- **Form Controls**: Styled inputs, selectors, and range controls
- **Action Buttons**: Contextual buttons with loading states

## Feature Integration

### LALAL.AI Integration
- **Voice Cloning**: Upload and process voice samples
- **Stem Separation**: Professional instrument isolation
- **Audio Enhancement**: Noise removal and quality improvement
- **Real-time Processing**: Live audio transformation

### AI Video Generation
- **VEO3 Technology**: Advanced AI-powered video creation with high-quality output
- **Multi-Modal Generation**: Both text-to-video and image-to-video capabilities
- **Professional Models**: VEO3 (3-5 min), VEO3-Fast (2-3 min), Midjourney-Video (~4 min)
- **Advanced Prompting**: Template-based prompt system with dynamic variables
- **Real-time Processing**: Live task monitoring with status polling
- **Video Configuration**: Customizable resolution (720p/1080p), aspect ratios (16:9/9:16)
- **Style Presets**: Cinematic, realistic, artistic, animated, and vintage styles
- **Image Processing**: Automatic image validation and preprocessing for video input
- **API Integration**: Direct integration with Youware AI video generation API

## Processing Workflows

### Voice Cloning Workflow
1. Upload 1-5 voice samples (10-50 minutes total)
2. Configure text-to-speech parameters
3. Process voice cloning with LALAL.AI
4. Generate speech from text using cloned voice
5. Download or preview generated audio

### Audio Processing Workflow
1. Upload source audio files
2. Select processing type (stem separation, cleaning, etc.)
3. Configure processing parameters
4. Execute AI-powered processing
5. Preview and download processed results

### AI Video Generation Workflow
1. Choose generation mode: Text-to-Video or Image-to-Video
2. For Image-to-Video: Upload source image for animation
3. Write detailed video generation prompt
4. Select AI model (VEO3, VEO3-Fast, or Midjourney-Video)
5. Configure video settings (resolution, aspect ratio, style)
6. Submit generation task and monitor real-time status
7. Preview and download generated AI videos

### Traditional Music Video Creation Workflow
1. Upload video file and audio source
2. Select synchronization mode and video style
3. Configure timing and visual effects
4. Generate synchronized music video
5. Preview and download final video

## Quality Standards

### Build Verification
- **TypeScript Compilation**: Error-free TypeScript compilation
- **CSS Optimization**: Tailwind CSS purging and optimization
- **Asset Bundling**: Optimized asset bundling via Vite
- **Performance**: Optimized bundle size and loading times

### Code Quality
- **Type Safety**: Comprehensive TypeScript interfaces
- **Component Architecture**: Reusable and maintainable components
- **State Management**: Efficient state handling with React hooks
- **Error Handling**: Graceful error handling and user feedback

## Future Development

### API Integration
1. Replace simulation logic with actual LALAL.AI API calls
2. Implement VEO3 video generation API integration
3. Add real-time processing status updates
4. Implement proper error handling for API responses

### Enhanced Features
1. Audio waveform visualization
2. Advanced audio editing capabilities
3. Batch processing for multiple files
4. Audio format conversion tools
5. Professional export options

### Performance Optimizations
1. Audio streaming for large files
2. Progressive loading for processing results
3. Caching for frequently processed content
4. Background processing capabilities

## Security Considerations

- **File Validation**: Proper audio/video file type validation
- **Memory Management**: Cleanup of temporary file objects
- **API Security**: Secure handling of API keys and requests
- **User Data**: Privacy protection for uploaded audio content

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **HTML5 Audio**: Native audio playback support
- **File API**: Modern file upload and processing
- **CSS Grid**: Advanced layout support
- **ES6+**: Modern JavaScript features support