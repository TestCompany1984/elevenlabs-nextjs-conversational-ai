import { NextResponse } from 'next/server'

/**
 * Health check endpoint for production monitoring
 * 
 * Provides application status, version, and basic system information
 * for load balancers and monitoring systems.
 */
export async function GET() {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      features: {
        elevenlabsConfigured: !!process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
        httpsEnabled: process.env.NODE_ENV === 'production',
        performanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true'
      }
    }

    // Add response headers for monitoring
    const response = NextResponse.json(healthData, { status: 200 })
    
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Support both GET and HEAD requests for health checks
export async function HEAD() {
  try {
    const response = new Response(null, { status: 200 })
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    return response
  } catch {
    return new Response(null, { status: 500 })
  }
}