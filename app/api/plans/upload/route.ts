import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import cloudinary from '@/lib/cloudinary'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const projectId = formData.get('projectId') as string
        const name = formData.get('name') as string
        const type = formData.get('type') as string
        const description = formData.get('description') as string

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Get organization name for folder structure
        const organization = await prisma.organization.findUnique({
            where: { id: session.user.organizationId },
            select: { name: true }
        })

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Get project name
        let projectName = 'general'
        if (projectId) {
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    organizationId: session.user.organizationId
                },
                select: { name: true }
            })
            if (project) {
                projectName = project.name.replace(/[^a-zA-Z0-9]/g, '_')
            }
        }

        const orgName = organization.name.replace(/[^a-zA-Z0-9]/g, '_')
        const folder = `${orgName}/${projectName}`

        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder,
                    public_id: `${Date.now()}_${file.name}`,
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) reject(error)
                    else resolve(result)
                }
            ).end(buffer)
        }) as any

        // Create plan record in database
        const plan = await prisma.plan.create({
            data: {
                name,
                description,
                type: type as any,
                fileUrl: uploadResult.secure_url,
                fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                projectId: projectId || null,
                organizationId: session.user.organizationId,
                createdById: session.user.id
            },
            include: {
                project: true,
                createdBy: { select: { name: true, email: true } }
            }
        })

        return NextResponse.json(plan, { status: 201 })

    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json({ error: 'Error uploading file' }, { status: 500 })
    }
}
