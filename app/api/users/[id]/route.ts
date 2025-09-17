import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

interface RouteParams {
    params: {
        id: string
    }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.id },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        plan: true,
                        status: true
                    }
                },
                _count: {
                    select: {
                        projects: true,
                        employees: true,
                        budgets: true,
                        bills: true,
                        inspectionCreatedBy: true,
                        inspectionInspectedBy: true,
                        timeTrackings: true
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Remover la contraseña de la respuesta
        const { password, ...userWithoutPassword } = user

        return NextResponse.json(userWithoutPassword)
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json(
            { error: 'Error fetching user' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const body = await request.json()
        const {
            name,
            email,
            password,
            role,
            status,
            phone,
            position,
            language,
            timezone,
            organizationId
        } = body

        const updateData: any = {}

        if (name !== undefined) updateData.name = name
        if (email !== undefined) updateData.email = email
        if (role !== undefined) updateData.role = role
        if (status !== undefined) updateData.status = status
        if (phone !== undefined) updateData.phone = phone
        if (position !== undefined) updateData.position = position
        if (language !== undefined) updateData.language = language
        if (timezone !== undefined) updateData.timezone = timezone
        if (organizationId !== undefined) updateData.organizationId = organizationId

        // Si se proporciona una nueva contraseña, hashearla
        if (password) {
            updateData.password = await bcrypt.hash(password, 12)
        }

        const user = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        })

        // Remover la contraseña de la respuesta
        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json(userWithoutPassword)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Error updating user' },
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

        const user = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        })

        // Remover la contraseña de la respuesta
        const { password, ...userWithoutPassword } = user

        return NextResponse.json(userWithoutPassword)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Error updating user' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await prisma.user.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'User deleted successfully' })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { error: 'Error deleting user' },
            { status: 500 }
        )
    }
}
