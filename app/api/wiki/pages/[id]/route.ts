import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        // Remover filtrado por organizationId para hacer global
        const page = await prisma.wikiPage.findUnique({
            where: { id },
            include: {
                category: true
            }
        });

        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        return NextResponse.json(page);
    } catch (error) {
        console.error('Error fetching wiki page:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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
        const { title, slug, content, categoryId } = await req.json();
        // Remover organizationId para admins globales

        const page = await prisma.wikiPage.update({
            where: { id },
            data: {
                title,
                slug,
                content,
                categoryId
            },
            include: { category: true }
        });

        return NextResponse.json(page);
    } catch (error) {
        console.error('Error updating wiki page:', error);
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

        const page = await prisma.wikiPage.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Page deleted successfully' });
    } catch (error) {
        console.error('Error deleting wiki page:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
