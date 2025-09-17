import { NextResponse } from 'next/server'

export async function GET() {
    // Health check simple que no depende de la base de datos
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        service: 'pix-application'
    }

    return NextResponse.json(health, {
        status: 200,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Content-Type': 'application/json'
        }
    })
}