import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationTrigger } from '@/lib/email/notificationTrigger'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')

        if (!organizationId) {
            return NextResponse.json(
                { error: 'organizationId is required' },
                { status: 400 }
            )
        }

        const where: any = { organizationId }
        if (status) where.status = status
        if (priority) where.priority = priority

        const projects = await prisma.project.findMany({
            where,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        budgets: true,
                        inspections: true,
                        timeTrackings: true,
                        bills: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(projects)
    } catch (error) {
        console.error('Error fetching projects:', error)
        return NextResponse.json(
            { error: 'Error fetching projects' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('POST /api/projects called')

        const body = await request.json()
        console.log('Request body:', body)

        const {
            name,
            description,
            code,
            status = 'PLANNING',
            priority = 'MEDIUM',
            startDate,
            endDate,
            budget,
            address,
            city,
            coordinates,
            organizationId,
            createdById
        } = body

        // Basic validation
        if (!organizationId) {
            console.log('Missing organizationId')
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        if (!createdById) {
            console.log('Missing createdById')
            return NextResponse.json({ error: 'createdById is required' }, { status: 400 })
        }

        if (!name || typeof name !== 'string' || !name.trim()) {
            console.log('Invalid name:', name)
            return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
        }

        console.log('Creating project with data:', {
            name,
            organizationId,
            createdById,
            status,
            priority
        })

        const project = await prisma.project.create({
            data: {
                name: String(name).trim(),
                description: description || null,
                code: code || null,
                status: status,
                priority: priority,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                budget: budget ? Number(budget) : null,
                address: address || null,
                city: city || null,
                coordinates: coordinates || null,
                organizationId,
                createdById
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        })

        console.log('Project created successfully:', project.id)

        // 🚀 Disparar notificación de proyecto creado
        try {
            await notificationTrigger.onProjectCreated(project);
            console.log('Project creation notification sent');
        } catch (notificationError) {
            console.error('Error sending project notification:', notificationError);
            // No fallar la creación del proyecto por error de notificación
        }

        return NextResponse.json(project, { status: 201 })
    } catch (error) {
        console.error('Error creating project:', error)
        return NextResponse.json(
            { error: 'Error creating project', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
