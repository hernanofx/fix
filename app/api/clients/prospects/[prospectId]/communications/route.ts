import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating prospect communications
const createCommunicationSchema = z.object({
    type: z.enum(['EMAIL', 'CALL', 'MEETING', 'WHATSAPP', 'LINKEDIN', 'OTHER']),
    direction: z.enum(['INBOUND', 'OUTBOUND']),
    subject: z.string().optional(),
    content: z.string().optional(),
    duration: z.number().int().min(0).optional(),
    status: z.enum(['SENT', 'RECEIVED', 'MISSED', 'VOICEMAIL', 'SCHEDULED']).default('SENT'),
});

// Schema for updating prospect communications
const updateCommunicationSchema = z.object({
    type: z.enum(['EMAIL', 'CALL', 'MEETING', 'WHATSAPP', 'LINKEDIN', 'OTHER']).optional(),
    direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
    subject: z.string().optional(),
    content: z.string().optional(),
    duration: z.number().int().min(0).optional(),
    status: z.enum(['SENT', 'RECEIVED', 'MISSED', 'VOICEMAIL', 'SCHEDULED']).optional(),
});

// GET /api/clients/prospects/[prospectId]/communications
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
        const type = searchParams.get('type');
        const direction = searchParams.get('direction');

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

        if (type) {
            where.type = type;
        }

        if (direction) {
            where.direction = direction;
        }

        const communications = await prisma.prospectCommunication.findMany({
            where,
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(communications);
    } catch (error) {
        console.error('Error fetching prospect communications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/clients/prospects/[prospectId]/communications
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
        const validatedData = createCommunicationSchema.parse(body);

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

        // Create communication
        const communication = await prisma.prospectCommunication.create({
            data: {
                ...validatedData,
                prospectId,
                organizationId: session.user.organizationId,
                createdById: session.user.id,
            },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json(communication, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error creating prospect communication:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/clients/prospects/[prospectId]/communications/[communicationId]
export async function PUT(
    request: NextRequest,
    { params }: { params: { prospectId: string; communicationId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prospectId, communicationId } = params;
        const body = await request.json();

        // Validate input
        const validatedData = updateCommunicationSchema.parse(body);

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

        // Verify communication exists and belongs to the prospect
        const existingCommunication = await prisma.prospectCommunication.findFirst({
            where: {
                id: communicationId,
                prospectId,
                organizationId: session.user.organizationId,
            },
        });

        if (!existingCommunication) {
            return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
        }

        // Update communication
        const communication = await prisma.prospectCommunication.update({
            where: { id: communicationId },
            data: validatedData,
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json(communication);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error updating prospect communication:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/clients/prospects/[prospectId]/communications/[communicationId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { prospectId: string; communicationId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prospectId, communicationId } = params;

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

        // Verify communication exists and belongs to the prospect
        const existingCommunication = await prisma.prospectCommunication.findFirst({
            where: {
                id: communicationId,
                prospectId,
                organizationId: session.user.organizationId,
            },
        });

        if (!existingCommunication) {
            return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
        }

        // Delete communication
        await prisma.prospectCommunication.delete({
            where: { id: communicationId },
        });

        return NextResponse.json({ message: 'Communication deleted successfully' });
    } catch (error) {
        console.error('Error deleting prospect communication:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
