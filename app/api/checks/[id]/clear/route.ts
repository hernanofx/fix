import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Reutilizar lógica de PUT con status CLEARED
        const updateRequest = new Request(`${request.url.replace('/clear', '')}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'CLEARED' }),
            headers: request.headers
        })

        // Simular llamada a PUT
        const response = await fetch(`${request.url.replace('/clear', '')}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'CLEARED' }),
            headers: request.headers
        })

        return response
    } catch (error) {
        console.error('Error clearing check:', error)
        return NextResponse.json({ error: 'Error clearing check' }, { status: 500 })
    }
}