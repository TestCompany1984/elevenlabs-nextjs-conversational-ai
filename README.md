# Voice AI Assistant with ElevenLabs & Next.js

A comprehensive, production-ready voice AI assistant built with Next.js 15, React 19, and the ElevenLabs Conversational SDK. Features real-time audio processing, advanced performance monitoring, cross-browser compatibility, and enterprise-grade security.

## ✨ Features

### 🎙️ Core Voice Features
- **Real-time Voice Conversations** - Sub-500ms latency with ElevenLabs SDK
- **Advanced Audio Processing** - Echo cancellation, noise suppression, smart muting
- **Cross-Browser Support** - Chrome, Firefox, Safari, Edge compatibility
- **Mobile Optimized** - Touch-friendly interface with battery monitoring

### 🔒 Security & Privacy
- **No Data Persistence** - Voice data never stored permanently
- **Secure Connections** - WSS protocol with HTTPS requirement
- **Permission Management** - Graceful microphone permission handling
- **Error Sanitization** - Sensitive data automatically removed from logs

### 📊 Performance & Monitoring
- **Real-time Metrics** - Latency, memory, audio quality monitoring
- **Adaptive Optimization** - Automatic performance tuning based on conditions
- **Network Resilience** - Automatic reconnection and error recovery
- **Development Dashboard** - Visual performance monitoring tools

### 🎨 User Experience
- **Visual Feedback** - Animated status indicators and audio visualizations
- **Responsive Design** - Mobile-first design with TailwindCSS
- **Error Recovery** - User-friendly error messages with retry mechanisms
- **Accessibility** - Screen reader support and keyboard navigation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn or pnpm
- ElevenLabs account with API access
- HTTPS domain (for production) or localhost (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/elevenlabs-nextjs-conversational-ai.git
   cd elevenlabs-nextjs-conversational-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your ElevenLabs credentials:
   ```env
   # ElevenLabs Configuration
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
   ELEVENLABS_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Allow microphone permissions when prompted
   - Start your voice conversation!

## 🔧 Configuration

### ElevenLabs Setup

1. **Create an ElevenLabs Account**
   - Sign up at [elevenlabs.io](https://elevenlabs.io)
   - Navigate to your API settings

2. **Get Your Credentials**
   - **Agent ID**: Create a conversational agent and copy its ID
   - **API Key**: Generate an API key from your profile settings

3. **Environment Variables**
   ```env
   # Public (exposed to client)
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxxxxxxx
   
   # Private (server-side only)
   ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Audio Configuration

The application includes optimized audio settings for best performance:

```typescript
// Default audio configuration
{
  sampleRate: 44100,        // High quality audio
  channels: 1,              // Mono for voice
  echoCancellation: true,   // Prevent feedback
  noiseSuppression: true,   // Clear audio
  autoGainControl: true,    // Consistent levels
  latencyHint: 'interactive' // Low latency
}
```

### Performance Settings

Adjust performance settings in development:

```typescript
// Access performance tools in browser console (development only)
window.performanceMonitor.generateReport()
window.securityAuditor.runFullAudit()
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main application page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── VoiceComponent.tsx # Main voice interface
│   ├── PermissionModal.tsx# Permission handling
│   ├── ErrorDisplay.tsx  # Error management
│   └── ui/               # Reusable UI components
├── lib/                  # Core utilities
│   ├── audio-permissions.ts # Permission management
│   ├── session-manager.ts   # Session handling
│   ├── performance-monitor.ts # Performance tracking
│   ├── error-handler.ts     # Error management
│   └── security-audit.ts    # Security validation
├── types/                # TypeScript definitions
│   ├── conversation.ts   # Conversation types
│   ├── audio.ts         # Audio types
│   └── session.ts       # Session types
└── hooks/               # Custom React hooks
    └── useErrorHandler.ts # Error handling hook
```

## 🧪 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Code linting
npm run lint

# Type checking
npm run type-check
```

### Development Tools

The application includes several development tools accessible in the browser console:

```javascript
// Performance monitoring
window.performanceMonitor.generateReport()
window.performanceMonitor.exportData()

// Security audit
window.securityAuditor.runFullAudit()

// Browser compatibility testing
window.browserTester.runFullTest()
```

### Testing

The application includes comprehensive testing infrastructure:

- **Performance Testing** - Latency measurement and optimization
- **Browser Compatibility** - Cross-browser API support testing  
- **Security Audit** - Privacy and security validation
- **Error Scenarios** - Error handling and recovery testing

## 🚢 Deployment

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Test the production build locally**
   ```bash
   npm start
   ```

### Deployment Platforms

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
```bash
npm run build
# Upload the .next folder to Netlify
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup

**Production environment variables:**
```env
# Required for production
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
ELEVENLABS_API_KEY=your_api_key

# Optional optimizations
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**HTTPS Requirements:**
- Microphone access requires HTTPS in production
- Use a proper SSL/TLS certificate
- Configure CSP headers for security

## 🔐 Security

### Best Practices Implemented

- **No Voice Data Storage** - Audio streams are never persisted
- **API Key Security** - Server-side API keys only
- **Error Sanitization** - Sensitive data removed from logs
- **Permission Security** - Graceful permission handling
- **HTTPS Enforcement** - Secure connections required

### Security Audit

Run the built-in security audit:

```javascript
// In browser console (development)
const audit = await window.securityAuditor.runFullAudit()
console.log(window.securityAuditor.formatSecurityReport(audit))
```

## ⚡ Performance

### Optimization Features

- **Sub-500ms Latency** - Real-time voice processing
- **Adaptive Quality** - Automatic audio quality adjustment
- **Memory Management** - Leak detection and cleanup
- **Network Resilience** - Automatic reconnection
- **Battery Optimization** - Mobile power management

### Performance Monitoring

Monitor real-time performance metrics:

```javascript
// Access performance data
const report = window.performanceMonitor.generateReport()
console.log('Average Latency:', report.metrics.latency.average)
console.log('Memory Usage:', report.metrics.memory.heapUsed)
```

## 🌐 Browser Support

| Browser | Version | WebRTC | Audio API | WebSocket | Status |
|---------|---------|--------|-----------|-----------|--------|
| Chrome  | 88+     | ✅     | ✅        | ✅        | Full Support |
| Firefox | 85+     | ✅     | ✅        | ✅        | Full Support |
| Safari  | 14+     | ✅     | ⚠️        | ✅        | Partial Support |
| Edge    | 88+     | ✅     | ✅        | ✅        | Full Support |

## 🐛 Troubleshooting

### Common Issues

**Microphone Permission Denied**
```bash
# Check HTTPS requirement
# Ensure proper domain setup
# Clear browser permissions and retry
```

**High Latency**
```bash
# Check network connection
# Try lower audio quality
# Close other audio applications
```

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Error Recovery

The application includes automatic error recovery:
- Connection failures → Automatic retry with backoff
- Permission issues → User-friendly guidance
- Audio problems → Graceful fallback
- Network issues → Offline detection and recovery

## 📚 API Reference

### VoiceComponent Props

```typescript
interface VoiceComponentProps {
  // No props required - fully self-contained
}
```

### Performance Monitor API

```typescript
// Start latency measurement
performanceMonitor.startLatencyMeasurement(id, type, details?)

// End measurement and get duration
const duration = performanceMonitor.endLatencyMeasurement(id)

// Generate performance report
const report = performanceMonitor.generateReport()
```

### Audio Permission Manager API

```typescript
// Request microphone permission
const permissions = await permissionManager.requestMicrophonePermission()

// Check current permissions
const current = await permissionManager.checkMicrophonePermission()

// Listen for permission changes
const unsubscribe = permissionManager.onPermissionChange(callback)
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add JSDoc comments for public APIs
- Include tests for new features
- Update documentation as needed
- Run security and performance audits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ElevenLabs](https://elevenlabs.io) for the amazing conversational AI SDK
- [Next.js](https://nextjs.org) team for the excellent React framework
- [TailwindCSS](https://tailwindcss.com) for the utility-first CSS framework
- [Lucide](https://lucide.dev) for the beautiful icons

## 📞 Support

- 📧 Email: support@yourproject.com
- 📖 Documentation: [docs.yourproject.com](https://docs.yourproject.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/elevenlabs-nextjs-conversational-ai/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/elevenlabs-nextjs-conversational-ai/discussions)

---

**Built with ❤️ using Next.js, React, and ElevenLabs**