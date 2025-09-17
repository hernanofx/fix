const { execSync } = require('child_process')

function isValidDatabaseUrl(url) {
    if (!url) return false
    try {
        // Use the URL constructor for stricter validation
        const parsed = new URL(url)
        const protocol = parsed.protocol.replace(':', '')
        if (protocol !== 'postgres' && protocol !== 'postgresql') return false
        // host must exist
        if (!parsed.hostname) return false
        // Check for placeholder values
        if (url.includes('[password]') || url.includes('[id]') || url.includes('xxxx')) return false
        return true
    } catch (e) {
        return false
    }
}

// Detect if we're in Docker build context vs runtime
const isDockerBuild = process.env.DOCKER_BUILDKIT ||
    process.env.BUILDKIT_HOST ||
    !process.env.RAILWAY_ENVIRONMENT ||
    !process.env.RAILWAY_SERVICE_ID

const dbUrl = process.env.DATABASE_URL || ''

if (!isValidDatabaseUrl(dbUrl)) {
    console.warn('Skipping prisma db push: DATABASE_URL is missing or malformed in build environment.')
    console.warn('DATABASE_URL sample (first 80 chars):', dbUrl ? dbUrl.slice(0, 80) + (dbUrl.length > 80 ? '…' : '') : '(empty)')
    console.warn('💡 This is normal during Docker build. Migrations will run during container startup (init.js).')
    process.exit(0)
}

if (isDockerBuild) {
    console.log('🔨 Detected Docker build context. Skipping prisma db push during build.')
    console.log('💡 Migrations will be executed during container startup (init.js).')
    process.exit(0)
}

// Test basic connectivity before attempting migrations
console.log('🔍 Testing database connectivity...')
try {
    execSync('npx prisma db pull --force --schema=./prisma/test-schema.prisma', {
        stdio: 'pipe',
        timeout: 10000
    })
    // Clean up test schema file
    try {
        require('fs').unlinkSync('./prisma/test-schema.prisma')
    } catch { }
} catch (error) {
    console.log('⚠️  Cannot reach database during build. Skipping prisma db push.')
    console.log('💡 This is normal during Docker build. Migrations will run during container startup (init.js).')
    process.exit(0)
}

try {
    console.log('Running prisma db push --accept-data-loss')
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
    console.log('✅ Prisma db push completed successfully')
} catch (e) {
    console.error('Error running prisma db push:', e)
    console.log('💡 Migrations will be executed during container startup (init.js).')
    process.exit(0) // Don't fail the build, defer to runtime
}
