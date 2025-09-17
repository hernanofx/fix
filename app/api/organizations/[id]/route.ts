import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: {
        id: string
    }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: params.id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        status: true,
                        createdAt: true
                    }
                },
                projects: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        progress: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: {
                        users: true,
                        projects: true,
                        employees: true,
                        budgets: true,
                        bills: true
                    }
                }
            }
        })

        if (!organization) {
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(organization)
    } catch (error) {
        console.error('Error fetching organization:', error)
        return NextResponse.json(
            { error: 'Error fetching organization' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const body = await request.json()
        const { name, email, phone, address, city, country, website, description, status, plan } = body

        const organization = await prisma.organization.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phone && { phone }),
                ...(address && { address }),
                ...(city && { city }),
                ...(country && { country }),
                ...(website && { website }),
                ...(description && { description }),
                ...(status && { status }),
                ...(plan && { plan })
            }
        })

        return NextResponse.json(organization)
    } catch (error) {
        console.error('Error updating organization:', error)
        return NextResponse.json(
            { error: 'Error updating organization' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const body = await request.json()
        const updateData: any = {}

        // Solo actualizar los campos que se envíen
        Object.keys(body).forEach(key => {
            if (body[key] !== undefined) {
                updateData[key] = body[key]
            }
        })

        const organization = await prisma.organization.update({
            where: { id: params.id },
            data: updateData
        })

        return NextResponse.json(organization)
    } catch (error) {
        console.error('Error updating organization:', error)
        return NextResponse.json(
            { error: 'Error updating organization' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await prisma.organization.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'Organization deleted successfully' })
    } catch (error) {
        console.error('Error deleting organization:', error)
        return NextResponse.json(
            { error: 'Error deleting organization' },
            { status: 500 }
        )
    }
}
