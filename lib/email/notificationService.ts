import { prisma } from '../prisma';
import { emailService, NotificationEventType, NotificationEventData } from './emailService';

export interface NotificationRecipientConfig {
    recipientType: 'INTERNAL_USER' | 'EXTERNAL_EMAIL';
    userId?: string;
    email?: string;
    name?: string;
}

class NotificationService {

    /**
     * Envía una notificación basada en un evento
     */
    async sendNotification(eventData: NotificationEventData): Promise<void> {
        try {
            // Obtener configuraciones de notificaciones para este evento y organización
            // Buscar configuraciones tanto generales como específicas de proyecto
            const configs = await prisma.notificationConfig.findMany({
                where: {
                    organizationId: eventData.organizationId,
                    eventType: eventData.eventType,
                    isEnabled: true,
                    emailEnabled: true,
                    OR: [
                        { projectId: null }, // Configuraciones generales
                        eventData.entityData?.projectId
                            ? { projectId: eventData.entityData.projectId } // Configuración específica del proyecto del evento
                            : { projectId: { not: null } } // Si no hay projectId en el evento, incluir TODAS las configuraciones específicas de proyecto
                    ]
                },
                include: {
                    notificationRecipients: {
                        where: { isActive: true }
                    }
                }
            });

            if (configs.length === 0) {
                console.log(`No active notification configs for event ${eventData.eventType} in org ${eventData.organizationId}`);
                return;
            }

            // Recopilar todos los destinatarios únicos
            const allRecipients = new Set<string>();
            configs.forEach(config => {
                config.recipients?.forEach(email => allRecipients.add(email));
                config.notificationRecipients?.forEach(recipient => {
                    if (recipient.email) allRecipients.add(recipient.email);
                });
            });

            if (allRecipients.size === 0) {
                console.log(`No recipients configured for event ${eventData.eventType}`);
                return;
            }

            // Generar contenido del email usando el primer template encontrado o el por defecto
            const emailTemplate = configs.find(c => c.emailTemplate)?.emailTemplate;
            const emailContent = emailService.generateEmailContent(
                eventData.eventType,
                eventData.entityData
            );

            // Enviar emails a todos los destinatarios únicos
            const emailPromises = Array.from(allRecipients).map(async (recipientEmail) => {
                const success = await emailService.sendEmail({
                    to: [recipientEmail],
                    subject: emailContent.subject,
                    html: emailContent.html,
                    text: emailContent.text
                });

                // Log del envío
                await this.logNotification({
                    organizationId: eventData.organizationId,
                    eventType: eventData.eventType,
                    recipientEmail,
                    subject: emailContent.subject,
                    status: success ? 'SENT' : 'FAILED',
                    entityType: eventData.entityType,
                    entityId: eventData.entityId,
                    entityData: eventData.entityData
                });

                return success;
            });

            await Promise.all(emailPromises);
            console.log(`Notifications sent for event ${eventData.eventType} to ${allRecipients.size} recipients`);

        } catch (error) {
            console.error('Error sending notification:', error);

            // Log del error
            await this.logNotification({
                organizationId: eventData.organizationId,
                eventType: eventData.eventType,
                recipientEmail: 'system',
                subject: 'System Error',
                status: 'FAILED',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                entityType: eventData.entityType,
                entityId: eventData.entityId,
                entityData: eventData.entityData
            });
        }
    }

    /**
     * Configura notificaciones para un evento específico (método legacy - mantener por compatibilidad)
     */
    async configureNotification(
        organizationId: string,
        eventType: NotificationEventType,
        isEnabled: boolean,
        emailEnabled: boolean,
        recipients: NotificationRecipientConfig[],
        emailTemplate?: string
    ): Promise<void> {
        try {
            // Para mantener compatibilidad, crear una configuración general (sin userId específico)
            // Buscar el primer admin de la organización
            const adminUser = await prisma.user.findFirst({
                where: {
                    organizationId,
                    role: 'ADMIN'
                }
            });

            if (!adminUser) {
                throw new Error('No admin user found for organization');
            }

            // Buscar configuración existente
            const existingConfig = await prisma.notificationConfig.findFirst({
                where: {
                    organizationId,
                    userId: adminUser.id,
                    eventType,
                    module: 'legacy', // Usar 'legacy' para configuraciones del sistema viejo
                    projectId: null
                }
            });

            let config;
            if (existingConfig) {
                config = await prisma.notificationConfig.update({
                    where: { id: existingConfig.id },
                    data: {
                        isEnabled,
                        emailEnabled,
                        emailTemplate,
                        recipients: recipients.map(r => r.email || '').filter(Boolean)
                    }
                });
            } else {
                config = await prisma.notificationConfig.create({
                    data: {
                        organizationId,
                        userId: adminUser.id,
                        eventType,
                        module: 'legacy',
                        projectId: null,
                        isEnabled,
                        emailEnabled,
                        emailTemplate,
                        recipients: recipients.map(r => r.email || '').filter(Boolean)
                    }
                });
            }

            // Limpiar destinatarios existentes
            await prisma.notificationRecipient.deleteMany({
                where: { configId: config.id }
            });

            // Crear nuevos destinatarios
            if (recipients.length > 0) {
                await prisma.notificationRecipient.createMany({
                    data: recipients.map(recipient => ({
                        configId: config.id,
                        email: recipient.email || '',
                        name: recipient.name
                    }))
                });
            }

            console.log(`Notification configuration updated for ${eventType}`);
        } catch (error) {
            console.error('Error configuring notification:', error);
            throw error;
        }
    }

    /**
     * Obtiene todas las configuraciones de notificaciones para una organización
     */
    async getNotificationConfigs(organizationId: string) {
        return await prisma.notificationConfig.findMany({
            where: { organizationId },
            include: {
                notificationRecipients: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                eventType: 'asc'
            }
        });
    }

    /**
     * Obtiene el historial de notificaciones
     */
    async getNotificationLogs(
        organizationId: string,
        limit: number = 50,
        offset: number = 0
    ) {
        return await prisma.notificationLog.findMany({
            where: { organizationId },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });
    }

    /**
     * Logs de notificación
     */
    private async logNotification(logData: {
        organizationId: string;
        eventType: NotificationEventType;
        recipientEmail: string;
        subject: string;
        status: 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED';
        errorMessage?: string;
        entityType?: string;
        entityId?: string;
        entityData?: any;
    }): Promise<void> {
        try {
            await prisma.notificationLog.create({
                data: {
                    ...logData,
                    sentAt: logData.status === 'SENT' ? new Date() : null
                }
            });
        } catch (error) {
            console.error('Error logging notification:', error);
        }
    }

    /**
     * Valida la configuración de SMTP
     */
    async testEmailConfiguration(): Promise<boolean> {
        return await emailService.verifyConnection();
    }

    /**
     * Envía un email de prueba
     */
    async sendTestEmail(to: string, organizationId: string): Promise<boolean> {
        try {
            const success = await emailService.sendEmail({
                to: [to],
                subject: '✅ Test de Configuración de Email - Pix ERP',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1>✅ Configuración de Email Exitosa</h1>
            </div>
            <div style="padding: 20px; background: #f8fafc;">
              <p>¡Felicitaciones! La configuración de email para Pix ERP está funcionando correctamente.</p>
              <p>Este es un email de prueba enviado desde tu sistema de notificaciones.</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Servidor SMTP:</strong> ${process.env.SMTP_HOST}</p>
            </div>
            <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
              <p>© 2025 Pix ERP - Sistema de Gestión para la Construcción</p>
            </div>
          </div>
        `,
                text: 'Configuración de email exitosa - Pix ERP'
            });

            // Log del test
            await this.logNotification({
                organizationId,
                eventType: NotificationEventType.PROJECT_CREATED, // Usamos este tipo como test
                recipientEmail: to,
                subject: 'Test de Configuración de Email',
                status: success ? 'SENT' : 'FAILED'
            });

            return success;
        } catch (error) {
            console.error('Error sending test email:', error);
            return false;
        }
    }

    /**
     * Configuración por defecto para nuevas organizaciones
     */
    async setupDefaultNotifications(organizationId: string, adminUserId: string): Promise<void> {
        const defaultConfigs: Array<{
            eventType: string;
            module: string;
            isEnabled: boolean;
            emailEnabled: boolean;
        }> = [
                { eventType: 'PROJECT_CREATED', module: 'projects', isEnabled: false, emailEnabled: false },
                { eventType: 'PROJECT_UPDATED', module: 'projects', isEnabled: false, emailEnabled: false },
                { eventType: 'PROJECT_COMPLETED', module: 'projects', isEnabled: false, emailEnabled: false },
                { eventType: 'BUDGET_CREATED', module: 'budgets', isEnabled: false, emailEnabled: false },
                { eventType: 'BUDGET_EXCEEDED', module: 'budgets', isEnabled: false, emailEnabled: false },
                { eventType: 'BUDGET_WARNING', module: 'budgets', isEnabled: false, emailEnabled: false },
                { eventType: 'INVOICE_CREATED', module: 'invoices', isEnabled: false, emailEnabled: false },
                { eventType: 'INVOICE_PAID', module: 'invoices', isEnabled: false, emailEnabled: false },
                { eventType: 'INVOICE_OVERDUE', module: 'invoices', isEnabled: false, emailEnabled: false },
                { eventType: 'PAYMENT_RECEIVED', module: 'invoices', isEnabled: false, emailEnabled: false },
                { eventType: 'PAYMENT_OVERDUE', module: 'invoices', isEnabled: false, emailEnabled: false },
                { eventType: 'EMPLOYEE_CREATED', module: 'employees', isEnabled: false, emailEnabled: false },
                { eventType: 'EMPLOYEE_UPDATED', module: 'employees', isEnabled: false, emailEnabled: false },
                { eventType: 'CLIENT_CREATED', module: 'clients', isEnabled: false, emailEnabled: false },
                { eventType: 'PROVIDER_CREATED', module: 'providers', isEnabled: false, emailEnabled: false },
                { eventType: 'INSPECTION_SCHEDULED', module: 'inspections', isEnabled: false, emailEnabled: false },
                { eventType: 'INSPECTION_COMPLETED', module: 'inspections', isEnabled: false, emailEnabled: false },
                { eventType: 'COLLECTION_CREATED', module: 'collections', isEnabled: false, emailEnabled: false },
                { eventType: 'TIME_TRACKING_CREATED', module: 'employees', isEnabled: false, emailEnabled: false },
                { eventType: 'TASK_ASSIGNED', module: 'tasks', isEnabled: false, emailEnabled: false },
                { eventType: 'TASK_COMPLETED', module: 'tasks', isEnabled: false, emailEnabled: false },
                { eventType: 'TASK_OVERDUE', module: 'tasks', isEnabled: false, emailEnabled: false },
                { eventType: 'PAYROLL_GENERATED', module: 'payrolls', isEnabled: false, emailEnabled: false },
                { eventType: 'STOCK_LOW', module: 'stock', isEnabled: false, emailEnabled: false },
                { eventType: 'PURCHASE_ORDER_CREATED', module: 'providers', isEnabled: false, emailEnabled: false },
                { eventType: 'USER_REGISTERED', module: 'users', isEnabled: false, emailEnabled: false },
                { eventType: 'USER_INACTIVE', module: 'users', isEnabled: false, emailEnabled: false },
            ];

        const adminUser = await prisma.user.findUnique({
            where: { id: adminUserId }
        });

        if (!adminUser) {
            throw new Error('Admin user not found');
        }

        for (const config of defaultConfigs) {
            // Crear configuración si no existe
            const existingConfig = await prisma.notificationConfig.findFirst({
                where: {
                    organizationId,
                    userId: adminUserId,
                    eventType: config.eventType as any,
                    module: config.module,
                    projectId: null
                }
            });

            if (!existingConfig) {
                const newConfig = await prisma.notificationConfig.create({
                    data: {
                        organizationId,
                        userId: adminUserId,
                        eventType: config.eventType as any,
                        module: config.module,
                        projectId: null,
                        isEnabled: config.isEnabled,
                        emailEnabled: config.emailEnabled,
                        recipients: [adminUser.email]
                    }
                });

                // Crear destinatario
                await prisma.notificationRecipient.create({
                    data: {
                        configId: newConfig.id,
                        email: adminUser.email,
                        name: adminUser.name || 'Admin',
                        isActive: true
                    }
                });
            }
        }
    }
}

export const notificationService = new NotificationService();
