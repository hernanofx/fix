import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating prospect activities
const createActivitySchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['CALL', 'MEETING', 'EMAIL', 'TASK', 'FOLLOW_UP', 'SEND_QUOTE', 'SITE_VISIT']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    dueDate: z.string().datetime().optional(),
    assignedToId: z.string().optional(),
});

// Schema for updating prospect activities
const updateActivitySchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    type: z.enum(['CALL', 'MEETING', 'EMAIL', 'TASK', 'FOLLOW_UP', 'SEND_QUOTE', 'SITE_VISIT']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().datetime().optional(),
    assignedToId: z.string().optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

// GET /api/clients/prospects/[prospectId]/activities
export async function GET(
    request: NextRequest,
    { params }: { params: { prospectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prospectId } = params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        // Verify prospect belongs to user's organization
        const prospect = await prisma.client.findFirst({
            where: {
                id: prospectId,
                organizationId: session.user.organizationId,
                status: 'PROSPECT',
            },
        });

        if (!prospect) {
            return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
        }

        // Build filter conditions
        const where: any = {
            prospectId,
            organizationId: session.user.organizationId,
        };

        if (status) {
            where.status = status;
        }

        if (type) {
            where.type = type;
        }

        const activities = await prisma.prospectActivity.findMany({
            where,
            include: {
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(activities);
    } catch (error) {
        console.error('Error fetching prospect activities:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/clients/prospects/[prospectId]/activities
export async function POST(
    request: NextRequest,
    { params }: { params: { prospectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prospectId } = params;
        const body = await request.json();

        // Validate input
        const validatedData = createActivitySchema.parse(body);

        // Verify prospect belongs to user's organization
        const prospect = await prisma.client.findFirst({
            where: {
                id: prospectId,
                organizationId: session.user.organizationId,
                status: 'PROSPECT',
            },
        });

        if (!prospect) {
            return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
        }

        // Create activity
        const activity = await prisma.prospectActivity.create({
            data: {
                ...validatedData,
                dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
                prospectId,
                organizationId: session.user.organizationId,
                createdById: session.user.id,
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json(activity, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error creating prospect activity:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/clients/prospects/[prospectId]/activities/[activityId]
export async function PUT(
    request: NextRequest,
    { params }: { params: { prospectId: string; activityId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prospectId, activityId } = params;
        const body = await request.json();

        // Validate input
        const validatedData = updateActivitySchema.parse(body);

        // Verify prospect belongs to user's organization
        const prospect = await prisma.client.findFirst({
            where: {
                id: prospectId,
                organizationId: session.user.organizationId,
                status: 'PROSPECT',
            },
        });

        if (!prospect) {
            return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
        }

        // Verify activity exists and belongs to the prospect
        const existingActivity = await prisma.prospectActivity.findFirst({
            where: {
                id: activityId,
                prospectId,
                organizationId: session.user.organizationId,
            },
        });

        if (!existingActivity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // Update activity
        const activity = await prisma.prospectActivity.update({
            where: { id: activityId },
            data: {
                ...validatedData,
                dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true, email: true },
                },
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json(activity);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error updating prospect activity:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/clients/prospects/[prospectId]/activities/[activityId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { prospectId: string; activityId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prospectId, activityId } = params;

        // Verify prospect belongs to user's organization
        const prospect = await prisma.client.findFirst({
            where: {
                id: prospectId,
                organizationId: session.user.organizationId,
                status: 'PROSPECT',
            },
        });

        if (!prospect) {
            return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
        }

        // Verify activity exists and belongs to the prospect
        const existingActivity = await prisma.prospectActivity.findFirst({
            where: {
                id: activityId,
                prospectId,
                organizationId: session.user.organizationId,
            },
        });

        if (!existingActivity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // Delete activity
        await prisma.prospectActivity.delete({
            where: { id: activityId },
        });

        return NextResponse.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting prospect activity:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
