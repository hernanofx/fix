process.env.TZ = 'America/Argentina/Buenos_Aires';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable static export completely for Railway
    output: undefined,

    experimental: {
        serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
        serverActions: {
            bodySizeLimit: '2mb',
        },
        // Disable static generation completely
        disableOptimizedLoading: true,
    },

    // Disable static generation during build
    trailingSlash: false,
    generateEtags: false,

    // Configure webpack for better build
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push({
                'utf-8-validate': 'commonjs utf-8-validate',
                'bufferutil': 'commonjs bufferutil',
                'supports-color': 'commonjs supports-color',
            })
        }
        return config
    },

    // Disable static optimization for images
    images: {
        unoptimized: true,
    },

    // Disable static generation for all pages
    generateBuildId: async () => {
        return 'build-' + Date.now()
    },
}

module.exports = nextConfig
