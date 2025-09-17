import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Remover filtrado por organizationId para hacer global
        const pages = await prisma.wikiPage.findMany({
            include: {
                category: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(pages);
    } catch (error) {
        console.error('Error fetching wiki pages:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { title, slug, content, categoryId } = await req.json();
        // Setear organizationId a null para contenido global
        const page = await prisma.wikiPage.create({
            data: {
                title,
                slug,
                content,
                categoryId,
                organizationId: undefined,
                createdBy: session.user.id
            },
            include: {
                category: true
            }
        });

        return NextResponse.json(page);
    } catch (error) {
        console.error('Error creating wiki page:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
