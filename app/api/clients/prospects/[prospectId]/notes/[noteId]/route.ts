import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for updating prospect notes
const updateNoteSchema = z.object({
    title: z.string().optional(),
    content: z.string().min(1).optional(),
    type: z.enum(['GENERAL', 'FOLLOW_UP', 'DECISION_MAKER', 'OBJECTION', 'COMPETITION', 'BUDGET', 'TIMELINE']).optional(),
    isPrivate: z.boolean().optional(),
});

// PUT /api/clients/prospects/[prospectId]/notes/[noteId]
export async function PUT(
    request: NextRequest,
    { params }: { params: { prospectId: string; noteId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prospectId, noteId } = params;
        const body = await request.json();

        // Validate input
        const validatedData = updateNoteSchema.parse(body);

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

        // Verify note exists and belongs to the prospect
        const existingNote = await prisma.prospectNote.findFirst({
            where: {
                id: noteId,
                prospectId,
                organizationId: session.user.organizationId,
            },
        });

        if (!existingNote) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        // Update note
        const note = await prisma.prospectNote.update({
            where: { id: noteId },
            data: validatedData,
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json(note);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error updating prospect note:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/clients/prospects/[prospectId]/notes/[noteId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { prospectId: string; noteId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prospectId, noteId } = params;

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

        // Verify note exists and belongs to the prospect
        const existingNote = await prisma.prospectNote.findFirst({
            where: {
                id: noteId,
                prospectId,
                organizationId: session.user.organizationId,
            },
        });

        if (!existingNote) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        // Delete note
        await prisma.prospectNote.delete({
            where: { id: noteId },
        });

        return NextResponse.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting prospect note:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
