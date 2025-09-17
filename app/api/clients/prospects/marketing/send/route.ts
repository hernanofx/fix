import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { marketingEmailService } from '@/lib/email/marketingEmailService';
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

        const { templateId, prospectIds, customSubject, customVariables } = await request.json();

        if (!templateId || !prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
            return NextResponse.json(
                { error: 'Datos incompletos: se requiere templateId y prospectIds' },
                { status: 400 }
            );
        }

        // Obtener la plantilla
        const template = marketingEmailService.getTemplateById(templateId);
        if (!template) {
            return NextResponse.json(
                { error: `Plantilla ${templateId} no encontrada` },
                { status: 404 }
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
                situacion: true
            }
        });

        const result = {
            success: true,
            sentCount: 0,
            failedCount: 0,
            errors: [] as string[]
        };

        // Verificar que Resend esté configurado
        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json(
                {
                    success: false,
                    sentCount: 0,
                    failedCount: prospectIds.length,
                    errors: ['Configuración de Resend no encontrada. Verifica RESEND_API_KEY']
                },
                { status: 500 }
            );
        }

        // Para cada prospecto, enviar email personalizado
        for (const prospect of prospects) {
            try {
                // Verificar que el prospecto tenga email
                if (!prospect.email) {
                    result.errors.push(`Prospect ${prospect.name || prospect.id} no tiene email registrado`);
                    result.failedCount++;
                    continue;
                }

                // Preparar variables para reemplazar
                const variables: Record<string, string> = {
                    prospectName: prospect.name || 'Valued Prospect',
                    companyName: prospect.name || 'Your Company',
                    contactName: prospect.contactName || prospect.name || 'Contact',
                    ...customVariables
                };

                // Reemplazar variables en el contenido
                const htmlContent = marketingEmailService.replaceVariables(template.htmlContent, variables);
                const textContent = marketingEmailService.replaceVariables(template.textContent, variables);

                // Preparar asunto personalizado
                const subject = customSubject ||
                    marketingEmailService.replaceVariables(template.subject, variables);

                // Enviar email usando Resend
                const sendResult = await marketingEmailService.sendEmailViaResend({
                    to: [prospect.email],
                    subject: subject,
                    html: htmlContent,
                    text: textContent
                });

                if (sendResult.success) {
                    result.sentCount++;
                    console.log(`✅ Marketing email sent to ${prospect.email}`);

                    // Registrar comunicación en la tabla prospect_communications
                    try {
                        await prisma.prospectCommunication.create({
                            data: {
                                type: 'EMAIL',
                                direction: 'OUTBOUND',
                                subject: subject,
                                content: `Email de marketing enviado usando plantilla: ${template.name}`,
                                status: 'SENT',
                                prospectId: prospect.id,
                                organizationId: session.user.organizationId!,
                                createdById: session.user.id!,
                            }
                        });
                        console.log(`📋 Communication logged for prospect ${prospect.id}`);
                    } catch (commError) {
                        console.error(`Error logging communication for prospect ${prospect.id}:`, commError);
                        // No fallar el envío por error de logging
                    }
                } else {
                    result.errors.push(`Failed to send to ${prospect.email}: ${sendResult.error}`);
                    result.failedCount++;
                }

                // Pequeña pausa para evitar rate limits
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                result.errors.push(`Error sending to prospect ${prospect.id}: ${errorMsg}`);
                result.failedCount++;
            }
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error enviando emails de marketing:', error);
        return NextResponse.json(
            {
                success: false,
                sentCount: 0,
                failedCount: 0,
                errors: ['Error interno del servidor']
            },
            { status: 500 }
        );
    }
}