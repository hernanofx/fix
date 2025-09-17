import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const { name, slug, description, parentId } = await req.json();
        // Remover organizationId para admins globales

        // Verificar que la categoría existe
        const existingCategory = await prisma.wikiCategory.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Actualizar la categoría
        const updatedCategory = await prisma.wikiCategory.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(slug && { slug }),
                ...(description !== undefined && { description }),
                ...(parentId !== undefined && { parentId })
            },
            include: {
                children: true,
                pages: true,
                _count: {
                    select: { pages: true }
                }
            }
        });

        return NextResponse.json(updatedCategory);
    } catch (error) {
        console.error('Error updating wiki category:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        // Remover organizationId para admins globales

        // Verificar que la categoría existe
        const existingCategory = await prisma.wikiCategory.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Eliminar la categoría (esto debería manejar cascada si está configurado)
        await prisma.wikiCategory.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting wiki category:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
