#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * 
 * Validates that all required environment variables are set
 * for production deployment of the Voice AI Assistant.
 */

const requiredVars = [
  'NEXT_PUBLIC_ELEVENLABS_AGENT_ID',
  'ELEVENLABS_API_KEY'
]

const optionalVars = [
  'NODE_ENV',
  'PORT',
  'HOST',
  'SENTRY_DSN',
  'ANALYTICS_ID',
  'NEXT_PUBLIC_DOMAIN',
  'NEXT_PUBLIC_APP_URL'
]

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n')
  
  let hasErrors = false
  
  // Check required variables
  console.log('📋 Required Variables:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (!value) {
      console.log(`❌ ${varName}: Missing (REQUIRED)`)
      hasErrors = true
    } else if (varName.includes('KEY') && value.startsWith('your_')) {
      console.log(`⚠️  ${varName}: Placeholder value detected - please update`)
      hasErrors = true
    } else {
      const displayValue = varName.includes('KEY') 
        ? value.substring(0, 8) + '***' 
        : value
      console.log(`✅ ${varName}: ${displayValue}`)
    }
  })
  
  console.log('\n📋 Optional Variables:')
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      const displayValue = varName.includes('KEY') || varName.includes('DSN')
        ? value.substring(0, 8) + '***' 
        : value
      console.log(`✅ ${varName}: ${displayValue}`)
    } else {
      console.log(`➖ ${varName}: Not set (optional)`)
    }
  })
  
  // Validate specific configurations
  console.log('\n🔧 Configuration Validation:')
  
  // Node environment
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') {
    console.log('✅ NODE_ENV: Production mode')
  } else {
    console.log(`⚠️  NODE_ENV: ${nodeEnv || 'not set'} (should be "production" for deployment)`)
  }
  
  // ElevenLabs Agent ID format
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  if (agentId && agentId.startsWith('agent_')) {
    console.log('✅ ElevenLabs Agent ID: Valid format')
  } else if (agentId) {
    console.log('⚠️  ElevenLabs Agent ID: Unexpected format (should start with "agent_")')
  }
  
  // API Key format
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (apiKey && apiKey.startsWith('sk_')) {
    console.log('✅ ElevenLabs API Key: Valid format')
  } else if (apiKey) {
    console.log('⚠️  ElevenLabs API Key: Unexpected format (should start with "sk_")')
  }
  
  // Security configurations
  console.log('\n🔒 Security Configuration:')
  
  const httpsRequired = process.env.FORCE_HTTPS === 'true'
  console.log(`${httpsRequired ? '✅' : '⚠️ '} HTTPS Enforcement: ${httpsRequired ? 'Enabled' : 'Disabled'}`)
  
  const secureCookies = process.env.SECURE_COOKIES === 'true'
  console.log(`${secureCookies ? '✅' : '⚠️ '} Secure Cookies: ${secureCookies ? 'Enabled' : 'Disabled'}`)
  
  // Performance monitoring
  console.log('\n📊 Monitoring Configuration:')
  
  const perfMonitoring = process.env.ENABLE_PERFORMANCE_MONITORING === 'true'
  console.log(`${perfMonitoring ? '✅' : '➖'} Performance Monitoring: ${perfMonitoring ? 'Enabled' : 'Disabled'}`)
  
  const errorReporting = process.env.ENABLE_ERROR_REPORTING === 'true'
  console.log(`${errorReporting ? '✅' : '➖'} Error Reporting: ${errorReporting ? 'Enabled' : 'Disabled'}`)
  
  const sentryDsn = process.env.SENTRY_DSN
  console.log(`${sentryDsn ? '✅' : '➖'} Sentry DSN: ${sentryDsn ? 'Configured' : 'Not configured'}`)
  
  // Summary
  console.log('\n📊 Validation Summary:')
  if (hasErrors) {
    console.log('❌ Environment validation failed!')
    console.log('\n🔧 To fix issues:')
    console.log('1. Copy .env.production to .env.local')
    console.log('2. Replace placeholder values with actual configuration')
    console.log('3. Run this script again to validate')
    process.exit(1)
  } else {
    console.log('✅ Environment validation passed!')
    console.log('🚀 Ready for production deployment')
  }
}

// Export for use in other scripts
module.exports = { validateEnvironment, requiredVars, optionalVars }

// Run validation if script is executed directly
if (require.main === module) {
  validateEnvironment()
}