import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/email/notificationService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'test') {
            // Test de configuración SMTP
            const testResult = await notificationService.testEmailConfiguration();
            return NextResponse.json({ success: testResult });
        }

        if (action === 'test-email') {
            // Enviar email de prueba
            const email = searchParams.get('email');
            if (!email) {
                return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
            }

            const success = await notificationService.sendTestEmail(email, session.user.organizationId);
            return NextResponse.json({ success });
        }

        if (action === 'logs') {
            // Obtener logs de notificaciones
            const limit = parseInt(searchParams.get('limit') || '50');
            const offset = parseInt(searchParams.get('offset') || '0');

            const logs = await notificationService.getNotificationLogs(
                session.user.organizationId,
                limit,
                offset
            );
            return NextResponse.json(logs);
        }

        if (action === 'getConfigs') {
            // Obtener configuraciones de notificaciones
            const configs = await prisma.notificationConfig.findMany({
                where: {
                    organizationId: session.user.organizationId,
                    userId: session.user.id
                },
                include: {
                    project: { select: { id: true, name: true } }
                }
            });
            return NextResponse.json(configs);
        }

        // Obtener configuraciones de notificaciones (legacy)
        const configs = await notificationService.getNotificationConfigs(session.user.organizationId);
        return NextResponse.json(configs);

    } catch (error) {
        console.error('Error in notifications API:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { action, eventType, isEnabled, emailEnabled, recipients, emailTemplate, module, projectId, enabled } = body;

        if (action === 'configure') {
            // Nueva funcionalidad de configuración por proyecto/módulo
            if (!eventType || !module) {
                return NextResponse.json({ error: 'EventType y module son requeridos' }, { status: 400 });
            }

            // Buscar configuración existente
            const existingConfig = await prisma.notificationConfig.findFirst({
                where: {
                    organizationId: session.user.organizationId,
                    userId: session.user.id,
                    eventType,
                    module,
                    projectId: projectId || null
                }
            });

            if (existingConfig) {
                // Actualizar configuración existente
                await prisma.notificationConfig.update({
                    where: { id: existingConfig.id },
                    data: {
                        isEnabled: enabled,
                        emailEnabled: enabled,
                        updatedAt: new Date()
                    }
                });
            } else {
                // Crear nueva configuración
                await prisma.notificationConfig.create({
                    data: {
                        organizationId: session.user.organizationId,
                        userId: session.user.id,
                        eventType,
                        module,
                        projectId: projectId || null,
                        isEnabled: enabled,
                        emailEnabled: enabled,
                        recipients: recipients || [session.user.email]
                    }
                });
            }

            // También crear/actualizar en notification_recipients
            if (enabled) {
                const recipientEmails = recipients || [session.user.email];
                const config = await prisma.notificationConfig.findFirst({
                    where: {
                        organizationId: session.user.organizationId,
                        userId: session.user.id,
                        eventType,
                        module,
                        projectId: projectId || null
                    }
                });

                if (config) {
                    // Limpiar destinatarios existentes
                    await prisma.notificationRecipient.deleteMany({
                        where: { configId: config.id }
                    });

                    // Crear nuevos destinatarios
                    for (const email of recipientEmails) {
                        await prisma.notificationRecipient.create({
                            data: {
                                configId: config.id,
                                email: email
                            }
                        });
                    }
                }
            }

            return NextResponse.json({ success: true });
        }

        // Funcionalidad legacy
        if (!eventType) {
            return NextResponse.json({ error: 'EventType es requerido' }, { status: 400 });
        }

        await notificationService.configureNotification(
            session.user.organizationId,
            eventType,
            isEnabled,
            emailEnabled,
            recipients,
            emailTemplate
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error configuring notification:', error);
        return NextResponse.json(
            { error: 'Error configurando notificación' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body;

        if (action === 'setup-defaults') {
            // Configurar notificaciones por defecto
            await notificationService.setupDefaultNotifications(
                session.user.organizationId,
                session.user.id
            );
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

    } catch (error) {
        console.error('Error in notifications PUT API:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
