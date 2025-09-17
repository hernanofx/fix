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
        const categories = await prisma.wikiCategory.findMany({
            include: {
                children: true,
                pages: true,
                _count: {
                    select: { pages: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching wiki categories:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { name, slug, description, parentId } = await req.json();
        // Setear organizationId a null para contenido global
        const category = await prisma.wikiCategory.create({
            data: {
                name,
                slug,
                description,
                parentId,
                organizationId: undefined
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error creating wiki category:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
