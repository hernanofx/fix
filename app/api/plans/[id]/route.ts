import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import cloudinary from '@/lib/cloudinary'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const plan = await prisma.plan.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            },
            include: {
                project: true,
                createdBy: { select: { name: true, email: true } }
            }
        })

        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        return NextResponse.json(plan)
    } catch (error) {
        console.error('Error fetching plan:', error)
        return NextResponse.json({ error: 'Error fetching plan' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const plan = await prisma.plan.updateMany({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            },
            data: body
        })

        if (plan.count === 0) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

        const updatedPlan = await prisma.plan.findUnique({
            where: { id: params.id },
            include: {
                project: true,
                createdBy: { select: { name: true, email: true } }
            }
        })

        return NextResponse.json(updatedPlan)
    } catch (error) {
        console.error('Error updating plan:', error)
        return NextResponse.json({ error: 'Error updating plan' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // First, get the plan to obtain the file URL for Cloudinary deletion
        const plan = await prisma.plan.findFirst({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            }
        })

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // If the plan has a file URL, delete it from Cloudinary
        if (plan.fileUrl) {
            try {
                // Extract public_id from Cloudinary URL
                // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
                const urlParts = plan.fileUrl.split('/')
                const uploadIndex = urlParts.findIndex((part: string) => part === 'upload')

                if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                    // Get the part after 'upload' which contains version and public_id
                    const filePath = urlParts.slice(uploadIndex + 1).join('/')
                    // Remove version prefix (v1234567890/) and file extension
                    const publicIdWithVersion = filePath.split('.')[0] // Remove extension
                    const versionMatch = publicIdWithVersion.match(/^v\d+\//)
                    const publicId = versionMatch
                        ? publicIdWithVersion.replace(versionMatch[0], '') // Remove version
                        : publicIdWithVersion

                    // Delete from Cloudinary
                    await cloudinary.uploader.destroy(publicId)
                    console.log(`File deleted from Cloudinary: ${publicId}`)
                }
            } catch (cloudinaryError) {
                console.error('Error deleting file from Cloudinary:', cloudinaryError)
                // Continue with database deletion even if Cloudinary deletion fails
            }
        }

        // Delete the plan from database
        const deletedPlan = await prisma.plan.deleteMany({
            where: {
                id: params.id,
                organizationId: session.user.organizationId
            }
        })

        if (deletedPlan.count === 0) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: 'Plan and associated file deleted successfully' })
    } catch (error) {
        console.error('Error deleting plan:', error)
        return NextResponse.json({ error: 'Error deleting plan' }, { status: 500 })
    }
}
