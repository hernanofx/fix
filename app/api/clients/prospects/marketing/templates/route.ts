import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { marketingEmailService } from '@/lib/email/marketingEmailService';

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

        // Obtener plantillas activas
        const templates = marketingEmailService.getActiveTemplates();

        return NextResponse.json({
            success: true,
            templates: templates
        });

    } catch (error) {
        console.error('Error obteniendo plantillas de marketing:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}