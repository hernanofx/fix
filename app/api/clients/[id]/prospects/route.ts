import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'activities', 'notes', 'communications', or null for all

        // Verify client exists and is a prospect
        const client = await prisma.client.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                status: true,
                organizationId: true
            }
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        if (client.status !== 'PROSPECT') {
            return NextResponse.json({ error: 'Client is not a prospect' }, { status: 400 })
        }

        let data: any = {}

        // Get activities
        if (!type || type === 'activities') {
            data.activities = await prisma.prospectActivity.findMany({
                where: { prospectId: id },
                include: {
                    assignedTo: {
                        select: { id: true, name: true, email: true }
                    },
                    createdBy: {
                        select: { id: true, name: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
        }

        // Get notes
        if (!type || type === 'notes') {
            data.notes = await prisma.prospectNote.findMany({
                where: { prospectId: id },
                include: {
                    createdBy: {
                        select: { id: true, name: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
        }

        // Get communications
        if (!type || type === 'communications') {
            data.communications = await prisma.prospectCommunication.findMany({
                where: { prospectId: id },
                include: {
                    createdBy: {
                        select: { id: true, name: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
        }

        return NextResponse.json({
            prospect: client,
            ...data
        })

    } catch (error: any) {
        console.error('Error fetching prospect data:', error)
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const body = await request.json()
        const { type, ...data } = body

        // Verify client exists and is a prospect
        const client = await prisma.client.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                organizationId: true
            }
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        if (client.status !== 'PROSPECT') {
            return NextResponse.json({ error: 'Client is not a prospect' }, { status: 400 })
        }

        let result: any

        switch (type) {
            case 'activity':
                result = await prisma.prospectActivity.create({
                    data: {
                        title: data.title,
                        description: data.description,
                        type: data.activityType,
                        status: data.status || 'PENDING',
                        priority: data.priority || 'MEDIUM',
                        dueDate: data.dueDate ? new Date(data.dueDate) : null,
                        assignedToId: data.assignedToId,
                        prospectId: id,
                        organizationId: client.organizationId,
                        createdById: data.createdById
                    },
                    include: {
                        assignedTo: {
                            select: { id: true, name: true, email: true }
                        },
                        createdBy: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                })
                break

            case 'note':
                result = await prisma.prospectNote.create({
                    data: {
                        title: data.title,
                        content: data.content,
                        type: data.noteType || 'GENERAL',
                        isPrivate: data.isPrivate || false,
                        prospectId: id,
                        organizationId: client.organizationId,
                        createdById: data.createdById
                    },
                    include: {
                        createdBy: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                })
                break

            case 'communication':
                result = await prisma.prospectCommunication.create({
                    data: {
                        type: data.communicationType,
                        direction: data.direction,
                        subject: data.subject,
                        content: data.content,
                        duration: data.duration,
                        status: data.status || 'SENT',
                        prospectId: id,
                        organizationId: client.organizationId,
                        createdById: data.createdById
                    },
                    include: {
                        createdBy: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                })
                break

            default:
                return NextResponse.json({ error: 'Invalid type. Must be activity, note, or communication' }, { status: 400 })
        }

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('Error creating prospect data:', error)
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
    }
}
