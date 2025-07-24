# Deployment Guide: Voice AI Assistant

This guide provides comprehensive instructions for deploying your Voice AI Assistant to production environments. The application requires HTTPS for microphone access and proper configuration for optimal performance.

## 📋 Pre-Deployment Checklist

### ✅ Essential Requirements

- [ ] **HTTPS Certificate** - Required for microphone access
- [ ] **ElevenLabs API Key** - Valid API key with sufficient credits
- [ ] **Agent Configuration** - Properly configured ElevenLabs agent
- [ ] **Environment Variables** - All required variables configured
- [ ] **Domain Setup** - Proper domain with DNS configuration
- [ ] **Security Headers** - CSP and security headers configured

### ✅ Performance Optimization

- [ ] **Production Build** - `npm run build` completes successfully
- [ ] **Bundle Analysis** - Bundle size optimized (<1MB total)
- [ ] **Image Optimization** - All images optimized for web
- [ ] **Caching Strategy** - Static assets properly cached
- [ ] **CDN Configuration** - Content delivery optimized

## 🚀 Deployment Platforms

### Vercel (Recommended)

Vercel provides the best integration with Next.js and automatic HTTPS.

#### Quick Deploy

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project directory**
   ```bash
   vercel --prod
   ```

#### Environment Variables

Configure in Vercel Dashboard or via CLI:

```bash
# Set environment variables
vercel env add NEXT_PUBLIC_ELEVENLABS_AGENT_ID
vercel env add ELEVENLABS_API_KEY

# Deploy with environment variables
vercel --prod
```

#### Custom Domain

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Configure DNS records as instructed
5. SSL certificate is automatically provisioned

#### Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "functions": {
    "src/app/**": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; connect-src 'self' wss://api.elevenlabs.io; media-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ]
}
```

### Netlify

Great for static hosting with serverless functions.

#### Deploy Steps

1. **Build the application**
   ```bash
   npm run build
   npm run export  # If using static export
   ```

2. **Create `netlify.toml`**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [build.environment]
     NODE_VERSION = "18"

   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-XSS-Protection = "1; mode=block"
       Content-Security-Policy = "default-src 'self'; connect-src 'self' wss://api.elevenlabs.io; media-src 'self';"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Deploy via Git**
   - Connect your repository to Netlify
   - Configure build settings
   - Add environment variables
   - Deploy automatically on push

#### Environment Variables

In Netlify Dashboard:
1. Go to Site Settings → Environment Variables
2. Add required variables:
   - `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
   - `ELEVENLABS_API_KEY`

### AWS (Advanced)

For enterprise deployments with full control.

#### Using AWS Amplify

1. **Install Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize Amplify**
   ```bash
   amplify init
   amplify add hosting
   amplify publish
   ```

#### Using ECS/Fargate

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production && npm cache clean --force

   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY . .
   COPY --from=deps /app/node_modules ./node_modules
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production

   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nextjs -u 1001

   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next ./.next
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./package.json

   USER nextjs
   EXPOSE 3000
   ENV PORT 3000

   CMD ["npm", "start"]
   ```

2. **Build and push to ECR**
   ```bash
   docker build -t voice-ai-assistant .
   docker tag voice-ai-assistant:latest YOUR_ECR_URI:latest
   docker push YOUR_ECR_URI:latest
   ```

### Digital Ocean

Cost-effective hosting with App Platform.

#### App Platform Deployment

1. **Create `app.yaml`**
   ```yaml
   name: voice-ai-assistant
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/elevenlabs-nextjs-conversational-ai
       branch: main
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: NEXT_PUBLIC_ELEVENLABS_AGENT_ID
       value: your_agent_id
       type: SECRET
     - key: ELEVENLABS_API_KEY
       value: your_api_key
       type: SECRET
   ```

2. **Deploy**
   ```bash
   doctl apps create --spec app.yaml
   ```

## 🔧 Environment Configuration

### Production Environment Variables

Create production environment file:

```env
# Required
NODE_ENV=production
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_your_id_here
ELEVENLABS_API_KEY=sk_your_key_here

# Performance Optimization
NEXT_TELEMETRY_DISABLED=1
ANALYZE=false

# Security
FORCE_HTTPS=true
SECURE_COOKIES=true
```

### Environment Variable Security

**✅ Do:**
- Use platform-specific secret management
- Rotate API keys regularly
- Use different keys for staging/production
- Monitor API key usage

**❌ Don't:**
- Commit `.env.local` to version control
- Expose private keys in client-side code
- Use development keys in production
- Share API keys in team communications

## 🔐 Security Configuration

### HTTPS Setup

**SSL Certificate Options:**
1. **Platform Managed** (Vercel, Netlify) - Automatic
2. **Let's Encrypt** - Free, automated
3. **Commercial Certificate** - Extended validation
4. **Cloudflare** - Proxy with SSL termination

### Content Security Policy

Add to your Next.js configuration:

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "connect-src 'self' wss://api.elevenlabs.io",
              "media-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  }
}
```

### Security Headers

Essential security headers for production:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## 📊 Performance Optimization

### Build Optimization

1. **Analyze Bundle Size**
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ANALYZE=true npm run build
   ```

2. **Optimize Dependencies**
   ```bash
   # Remove unused dependencies
   npm audit
   npm prune
   
   # Use production-only install
   npm ci --only=production
   ```

3. **Enable Compression**
   ```javascript
   // next.config.js
   const nextConfig = {
     compress: true,
     poweredByHeader: false,
     generateEtags: false
   }
   ```

### CDN Configuration

**Cloudflare Setup:**
1. Add your domain to Cloudflare
2. Configure DNS records
3. Enable caching rules:
   ```
   /_next/static/* - Cache Everything, Edge TTL: 1 year
   /api/* - Bypass Cache
   ```

### Caching Strategy

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

## 🔍 Monitoring & Analytics

### Error Tracking

**Sentry Integration:**
```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV
})
```

### Performance Monitoring

**Built-in Performance Monitor:**
```javascript
// Enable in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  window.performanceMonitor = new PerformanceMonitor()
  
  // Send performance data to analytics
  setInterval(() => {
    const report = window.performanceMonitor.generateReport()
    analytics.track('performance_report', report)
  }, 60000) // Every minute
}
```

### Health Checks

Create health check endpoint:

```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  })
}
```

## 🚨 Troubleshooting

### Common Deployment Issues

**Build Failures:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

**HTTPS Issues:**
```bash
# Check certificate validity
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Verify DNS configuration
dig yourdomain.com
```

**Performance Issues:**
```bash
# Test with different regions
curl -w "@curl-format.txt" -o /dev/null -s "https://yourdomain.com"

# Check CDN configuration
curl -I "https://yourdomain.com/_next/static/css/[hash].css"
```

### Debug Production Issues

1. **Enable Production Logging**
   ```javascript
   // next.config.js
   const nextConfig = {
     experimental: {
       logging: {
         level: 'verbose'
       }
     }
   }
   ```

2. **Check Network Requests**
   ```javascript
   // Add to production build
   if (process.env.NODE_ENV === 'production') {
     console.log('WebSocket connection:', process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID)
   }
   ```

## 📱 Mobile Optimization

### PWA Configuration

Create `manifest.json`:
```json
{
  "name": "Voice AI Assistant",
  "short_name": "VoiceAI",
  "description": "Real-time voice AI assistant",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Mobile Performance

```javascript
// Optimize for mobile
const mobileOptimizations = {
  // Reduce audio quality on mobile
  audioQuality: /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'medium' : 'high',
  
  // Enable battery monitoring
  batteryMonitoring: 'getBattery' in navigator,
  
  // Adjust buffer sizes
  bufferSize: /Mobile/.test(navigator.userAgent) ? 256 : 512
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level high

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Automated Testing

```yaml
# Add to deploy.yml
- name: Run Performance Tests
  run: |
    npm run build
    npm start &
    sleep 5
    curl -f http://localhost:3000/api/health
    pkill -f "npm start"
```

## 📊 Post-Deployment Validation

### Checklist

- [ ] **HTTPS Working** - Certificate valid and secure
- [ ] **Microphone Access** - Permissions work correctly
- [ ] **Voice Conversations** - End-to-end functionality
- [ ] **Performance** - Latency under 500ms
- [ ] **Error Handling** - Graceful error recovery
- [ ] **Mobile Support** - Works on mobile devices
- [ ] **Security Headers** - All headers properly configured
- [ ] **Monitoring** - Error tracking and analytics active

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Create test configuration
cat > loadtest.yml << EOF
config:
  target: 'https://yourdomain.com'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Homepage"
    flow:
      - get:
          url: "/"
      - think: 5
EOF

# Run load test
artillery run loadtest.yml
```

### Performance Validation

Use browser dev tools to verify:

1. **Core Web Vitals**
   - Largest Contentful Paint (LCP) < 2.5s
   - First Input Delay (FID) < 100ms
   - Cumulative Layout Shift (CLS) < 0.1

2. **Audio Performance**
   - Voice input latency < 500ms
   - No audio dropouts
   - Proper echo cancellation

3. **Network Efficiency**
   - Gzip compression enabled
   - Static assets cached
   - Critical resources prioritized

## 🎯 Success Metrics

Monitor these key performance indicators:

- **Uptime**: > 99.9%
- **Latency**: < 500ms voice processing
- **Error Rate**: < 1%
- **Security Score**: A+ on SSL Labs
- **Performance Score**: > 90 on PageSpeed Insights
- **User Satisfaction**: > 4.5/5 rating

---

**Ready to deploy? Follow this guide step-by-step for a successful production deployment!**