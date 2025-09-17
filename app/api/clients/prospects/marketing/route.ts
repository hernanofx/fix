import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.organizationId) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        // Verificar que la organización tenga acceso al módulo de marketing
        const ALLOWED_ORGANIZATION_ID = 'cmfhlseem0000rdo84w0c4jgt';
        if (session.user.organizationId !== ALLOWED_ORGANIZATION_ID) {
            return NextResponse.json(
                { error: 'Acceso denegado: Este módulo solo está disponible para organizaciones autorizadas' },
                { status: 403 }
            );
        }

        const { prospectIds } = await request.json();

        if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
            return NextResponse.json(
                { error: 'Se requieren IDs de prospectos' },
                { status: 400 }
            );
        }

        // Obtener los prospectos de la base de datos
        const prospects = await prisma.client.findMany({
            where: {
                id: {
                    in: prospectIds
                },
                organizationId: session.user.organizationId,
                status: 'PROSPECT'
            },
            select: {
                id: true,
                name: true,
                email: true,
                contactName: true,
                phone: true,
                city: true,
                situacion: true,
                projectInterests: true,
                materialInterests: true,
                rubroInterests: true,
                address: true,
                prospectNotes: true
            }
        });

        // Verificar que todos los prospectos solicitados fueron encontrados
        const foundIds = prospects.map(p => p.id);
        const missingIds = prospectIds.filter(id => !foundIds.includes(id));

        if (missingIds.length > 0) {
            return NextResponse.json(
                {
                    error: `Algunos prospectos no fueron encontrados: ${missingIds.join(', ')}`,
                    prospects: prospects
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            prospects: prospects
        });

    } catch (error) {
        console.error('Error obteniendo prospectos para marketing:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// Método GET para obtener prospectos por filtros (útil para el componente de marketing)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.organizationId) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        // Verificar que la organización tenga acceso al módulo de marketing
        const ALLOWED_ORGANIZATION_ID = 'cmfhlseem0000rdo84w0c4jgt';
        if (session.user.organizationId !== ALLOWED_ORGANIZATION_ID) {
            return NextResponse.json(
                { error: 'Acceso denegado: Este módulo solo está disponible para organizaciones autorizadas' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const situacion = searchParams.get('situacion');
        const city = searchParams.get('city');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {
            organizationId: session.user.organizationId,
            status: 'PROSPECT'
        };

        // Aplicar filtros
        if (situacion && situacion !== 'all') {
            where.situacion = situacion;
        }

        if (city) {
            where.city = {
                contains: city,
                mode: 'insensitive'
            };
        }

        const prospects = await prisma.client.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                contactName: true,
                phone: true,
                city: true,
                situacion: true,
                projectInterests: true,
                materialInterests: true,
                rubroInterests: true
            },
            orderBy: {
                name: 'asc'
            },
            take: limit
        });

        return NextResponse.json({
            success: true,
            prospects: prospects
        });

    } catch (error) {
        console.error('Error obteniendo prospectos:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}