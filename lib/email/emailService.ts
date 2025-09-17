// Minimal Resend-only email service
// Keeps generateEmailContent and types to preserve compatibility with callers.

// Enum de tipos de notificaciones (replica del Prisma)
export enum NotificationEventType {
    PROJECT_CREATED = 'PROJECT_CREATED',
    PROJECT_UPDATED = 'PROJECT_UPDATED',
    PROJECT_COMPLETED = 'PROJECT_COMPLETED',
    BUDGET_CREATED = 'BUDGET_CREATED',
    BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
    BUDGET_WARNING = 'BUDGET_WARNING',
    INVOICE_CREATED = 'INVOICE_CREATED',
    INVOICE_PAID = 'INVOICE_PAID',
    INVOICE_OVERDUE = 'INVOICE_OVERDUE',
    BILL_CREATED = 'BILL_CREATED',
    BILL_PAID = 'BILL_PAID',
    BILL_OVERDUE = 'BILL_OVERDUE',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
    EMPLOYEE_CREATED = 'EMPLOYEE_CREATED',
    EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
    CLIENT_CREATED = 'CLIENT_CREATED',
    PROVIDER_CREATED = 'PROVIDER_CREATED',
    INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
    INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',
    COLLECTION_CREATED = 'COLLECTION_CREATED',
    TIME_TRACKING_CREATED = 'TIME_TRACKING_CREATED',
    TASK_ASSIGNED = 'TASK_ASSIGNED',
    TASK_COMPLETED = 'TASK_COMPLETED',
    TASK_OVERDUE = 'TASK_OVERDUE',
    PAYROLL_GENERATED = 'PAYROLL_GENERATED',
    STOCK_LOW = 'STOCK_LOW',
    PURCHASE_ORDER_CREATED = 'PURCHASE_ORDER_CREATED',
    USER_REGISTERED = 'USER_REGISTERED',
    USER_INACTIVE = 'USER_INACTIVE'
}

export interface EmailConfig {
    to: string[];
    subject: string;
    html: string;
    text?: string;
}

export interface NotificationEventData {
    eventType: NotificationEventType;
    entityType: string;
    entityId: string;
    entityData: any;
    organizationId: string;
}

// Interfaz para proveedores de email
interface EmailProvider {
    name: string;
    send: (config: EmailConfig) => Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class EmailService {
    private fromName: string;
    private fromEmail: string;

    constructor() {
        this.fromName = process.env.SMTP_FROM_NAME || 'Pix ERP';
        this.fromEmail = process.env.SMTP_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || process.env.ZOHO_EMAIL_USER || 'no-reply@pixerp.app';
        console.log('📧 EmailService initialized: using Resend if available');
    }

    // Método principal de envío (Resend-only)
    async sendEmail(config: EmailConfig): Promise<boolean> {
        console.log(`📧 Sending email via Resend to: ${config.to.join(', ')}`);
        try {
            if (!process.env.RESEND_API_KEY) {
                console.error('❌ RESEND_API_KEY not configured');
                return false;
            }

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: `${this.fromName} <${this.fromEmail}>`,
                    to: config.to,
                    subject: config.subject,
                    html: config.html,
                    text: config.text
                })
            });

            if (response.ok) {
                const body = await response.json();
                console.log('✅ Resend send successful:', body.id || 'no-id');
                return true;
            }

            const text = await response.text();
            console.error('❌ Resend send failed:', response.status, text);
            return false;
        } catch (err) {
            console.error('❌ Error sending via Resend:', err instanceof Error ? err.message : err);
            return false;
        }
    }

    // Keep a simple verifyConnection that checks Resend availability
    async verifyConnection(): Promise<boolean> {
        if (!process.env.RESEND_API_KEY) return false;
        try {
            const res = await fetch('https://api.resend.com/domains', { headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` } });
            return res.ok;
        } catch {
            return false;
        }
    }

    generateEmailContent(eventType: NotificationEventType, data: any): { subject: string; html: string; text: string } {
        const baseStyle = `
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
                .title { margin: 0; font-size: 24px; }
                .content { line-height: 1.6; color: #333; }
                .highlight { background: #f0f8ff; padding: 10px; border-left: 4px solid #667eea; margin: 15px 0; }
                .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px; }
                .btn { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
            </style>
        `;

        switch (eventType) {
            case NotificationEventType.PROJECT_CREATED:
                return {
                    subject: `🚀 Nuevo Proyecto: ${data.projectName || data.name}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Nuevo Proyecto Creado</h1>
                            </div>
                            <div class="content">
                                <p>Se ha creado un nuevo proyecto en el sistema:</p>
                                <div class="highlight">
                                    <strong>Proyecto:</strong> ${data.projectName || data.name}<br>
                                    <strong>Descripción:</strong> ${data.description || 'Sin descripción'}<br>
                                    <strong>Estado:</strong> ${data.status}<br>
                                    <strong>Fecha de inicio:</strong> ${data.startDate ? new Date(data.startDate).toLocaleDateString() : 'No definida'}<br>
                                    <strong>Fecha de fin:</strong> ${data.endDate ? new Date(data.endDate).toLocaleDateString() : 'No definida'}
                                </div>
                                <p>Este proyecto ya está disponible en el sistema para gestionar presupuestos, empleados y seguimiento.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Nuevo Proyecto: ${data.name}\n\nDescripción: ${data.description || 'Sin descripción'}\nEstado: ${data.status}\nFecha de inicio: ${data.startDate ? new Date(data.startDate).toLocaleDateString() : 'No definida'}\nFecha de fin: ${data.endDate ? new Date(data.endDate).toLocaleDateString() : 'No definida'}`
                };

            case NotificationEventType.BUDGET_CREATED:
                return {
                    subject: `💰 Nuevo Presupuesto: ${data.budgetName || data.name}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Presupuesto Creado</h1>
                            </div>
                            <div class="content">
                                <p>Se ha creado un nuevo presupuesto:</p>
                                <div class="highlight">
                                    <strong>Presupuesto:</strong> ${data.budgetName || data.name}<br>
                                    <strong>Descripción:</strong> ${data.description || 'Sin descripción'}<br>
                                    <strong>Monto Total:</strong> $${data.totalAmount?.toLocaleString() || '0'}<br>
                                    <strong>Tipo:</strong> ${data.type}<br>
                                    <strong>Estado:</strong> ${data.status}<br>
                                    <strong>Proyecto:</strong> ${data.projectName || data.project?.name || 'No asignado'}
                                </div>
                                <p>El presupuesto está listo para el seguimiento de gastos y control financiero.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Nuevo Presupuesto: ${data.name}\n\nDescripción: ${data.description || 'Sin descripción'}\nMonto Total: $${data.totalAmount?.toLocaleString() || '0'}\nTipo: ${data.type}\nEstado: ${data.status}\nProyecto: ${data.project?.name || 'No asignado'}`
                };

            case NotificationEventType.BUDGET_EXCEEDED:
                return {
                    subject: `⚠️ Presupuesto Excedido: ${data.name}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);">
                                <h1 class="title">⚠️ Alerta: Presupuesto Excedido</h1>
                            </div>
                            <div class="content">
                                <p><strong>ATENCIÓN:</strong> El siguiente presupuesto ha superado el límite establecido:</p>
                                <div class="highlight" style="background: #fff5f5; border-left-color: #ff6b6b;">
                                    <strong>Presupuesto:</strong> ${data.name}<br>
                                    <strong>Límite:</strong> $${data.totalAmount?.toLocaleString() || '0'}<br>
                                    <strong>Gastado:</strong> $${data.spent?.toLocaleString() || '0'}<br>
                                    <strong>Exceso:</strong> $${((data.spent || 0) - (data.totalAmount || 0)).toLocaleString()}<br>
                                    <strong>Proyecto:</strong> ${data.project?.name || 'No asignado'}
                                </div>
                                <p>Es necesario revisar los gastos y tomar las medidas correspondientes para controlar el presupuesto.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `ALERTA: Presupuesto Excedido - ${data.name}\n\nLímite: $${data.totalAmount?.toLocaleString() || '0'}\nGastado: $${data.spent?.toLocaleString() || '0'}\nExceso: $${((data.spent || 0) - (data.totalAmount || 0)).toLocaleString()}\nProyecto: ${data.project?.name || 'No asignado'}`
                };

            case NotificationEventType.INVOICE_CREATED:
                return {
                    subject: `📄 Nueva Factura: ${data.invoiceNumber || data.number}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Factura Generada</h1>
                            </div>
                            <div class="content">
                                <p>Se ha generado una nueva factura:</p>
                                <div class="highlight">
                                    <strong>Número:</strong> ${data.invoiceNumber || data.number}<br>
                                    <strong>Cliente:</strong> ${data.clientName || data.client?.name || 'No especificado'}<br>
                                    <strong>Monto:</strong> $${data.total?.toLocaleString() || data.amount?.toLocaleString() || '0'}<br>
                                    <strong>Estado:</strong> ${data.status}<br>
                                    <strong>Fecha de emisión:</strong> ${data.issueDate || 'No definida'}<br>
                                    <strong>Fecha de vencimiento:</strong> ${data.dueDate || 'No definida'}<br>
                                    <strong>Proyecto:</strong> ${data.project?.name || 'No asignado'}
                                </div>
                                <p>La factura está lista para ser enviada al cliente.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Nueva Factura: ${data.invoiceNumber || data.number}\n\nCliente: ${data.clientName || data.client?.name || 'No especificado'}\nMonto: $${data.total?.toLocaleString() || data.amount?.toLocaleString() || '0'}\nEstado: ${data.status}\nFecha de emisión: ${data.issueDate || 'No definida'}\nFecha de vencimiento: ${data.dueDate || 'No definida'}\nProyecto: ${data.project?.name || 'No asignado'}`
                };

            case NotificationEventType.PAYMENT_RECEIVED:
                return {
                    subject: `💳 Pago Recibido: ${data.invoice?.number}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%);">
                                <h1 class="title">💳 Pago Recibido</h1>
                            </div>
                            <div class="content">
                                <p>Se ha registrado un nuevo pago:</p>
                                <div class="highlight" style="background: #f0fff4; border-left-color: #00b894;">
                                    <strong>Factura:</strong> ${data.invoice?.number}<br>
                                    <strong>Monto pagado:</strong> $${data.amount?.toLocaleString() || '0'}<br>
                                    <strong>Método de pago:</strong> ${data.paymentMethod}<br>
                                    <strong>Fecha:</strong> ${data.paymentDate ? new Date(data.paymentDate).toLocaleDateString() : 'Hoy'}<br>
                                    <strong>Cliente:</strong> ${data.invoice?.client?.name || 'No especificado'}
                                </div>
                                <p>El pago ha sido registrado exitosamente en el sistema.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Pago Recibido - Factura: ${data.invoice?.number}\n\nMonto pagado: $${data.amount?.toLocaleString() || '0'}\nMétodo de pago: ${data.paymentMethod}\nFecha: ${data.paymentDate ? new Date(data.paymentDate).toLocaleDateString() : 'Hoy'}\nCliente: ${data.invoice?.client?.name || 'No especificado'}`
                };

            case NotificationEventType.PROJECT_UPDATED:
                return {
                    subject: `🔄 Proyecto Actualizado: ${data.projectName || data.name}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Proyecto Actualizado</h1>
                            </div>
                            <div class="content">
                                <p>Se ha actualizado la información del proyecto:</p>
                                <div class="highlight">
                                    <strong>Proyecto:</strong> ${data.projectName || data.name}<br>
                                    <strong>Estado:</strong> ${data.status}<br>
                                    <strong>Progreso:</strong> ${data.progress || 0}%<br>
                                    <strong>Última actualización:</strong> ${new Date().toLocaleDateString()}
                                </div>
                                <p>Los cambios han sido guardados exitosamente.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Proyecto Actualizado: ${data.projectName || data.name}\n\nEstado: ${data.status}\nProgreso: ${data.progress || 0}%\nÚltima actualización: ${new Date().toLocaleDateString()}`
                };

            case NotificationEventType.INVOICE_PAID:
                return {
                    subject: `✅ Factura Pagada: ${data.number}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%);">
                                <h1 class="title">✅ Factura Pagada</h1>
                            </div>
                            <div class="content">
                                <p>La siguiente factura ha sido completamente pagada:</p>
                                <div class="highlight" style="background: #f0fff4; border-left-color: #00b894;">
                                    <strong>Número:</strong> ${data.number}<br>
                                    <strong>Cliente:</strong> ${data.client?.name || 'No especificado'}<br>
                                    <strong>Monto total:</strong> $${data.total?.toLocaleString() || '0'}<br>
                                    <strong>Fecha de pago:</strong> ${data.paidDate ? new Date(data.paidDate).toLocaleDateString() : new Date().toLocaleDateString()}
                                </div>
                                <p>El pago ha sido registrado y la factura está al día.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Factura Pagada: ${data.number}\n\nCliente: ${data.client?.name || 'No especificado'}\nMonto total: $${data.total?.toLocaleString() || '0'}\nFecha de pago: ${data.paidDate ? new Date(data.paidDate).toLocaleDateString() : new Date().toLocaleDateString()}`
                };

            case NotificationEventType.INVOICE_OVERDUE:
                return {
                    subject: `⏰ Factura Vencida: ${data.number}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);">
                                <h1 class="title">⏰ Factura Vencida</h1>
                            </div>
                            <div class="content">
                                <p><strong>ATENCIÓN:</strong> La siguiente factura ha vencido:</p>
                                <div class="highlight" style="background: #fff5f5; border-left-color: #ff6b6b;">
                                    <strong>Número:</strong> ${data.number}<br>
                                    <strong>Cliente:</strong> ${data.client?.name || 'No especificado'}<br>
                                    <strong>Monto pendiente:</strong> $${data.total?.toLocaleString() || '0'}<br>
                                    <strong>Fecha de vencimiento:</strong> ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'No definida'}<br>
                                    <strong>Días de retraso:</strong> ${data.daysOverdue || 0} días
                                </div>
                                <p>Es necesario contactar al cliente para gestionar el pago pendiente.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Factura Vencida: ${data.number}\n\nCliente: ${data.client?.name || 'No especificado'}\nMonto pendiente: $${data.total?.toLocaleString() || '0'}\nFecha de vencimiento: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'No definida'}\nDías de retraso: ${data.daysOverdue || 0} días`
                };

            case NotificationEventType.PAYMENT_OVERDUE:
                return {
                    subject: `⏰ Pago Vencido`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);">
                                <h1 class="title">⏰ Pago Vencido</h1>
                            </div>
                            <div class="content">
                                <p><strong>ATENCIÓN:</strong> El siguiente pago ha vencido:</p>
                                <div class="highlight" style="background: #fff5f5; border-left-color: #ff6b6b;">
                                    <strong>Descripción:</strong> ${data.description || 'Sin descripción'}<br>
                                    <strong>Monto:</strong> $${data.amount?.toLocaleString() || '0'}<br>
                                    <strong>Fecha de vencimiento:</strong> ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'No definida'}<br>
                                    <strong>Cliente:</strong> ${data.client?.name || 'No especificado'}
                                </div>
                                <p>Es necesario gestionar este pago vencido.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Pago Vencido\n\nDescripción: ${data.description || 'Sin descripción'}\nMonto: $${data.amount?.toLocaleString() || '0'}\nFecha de vencimiento: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'No definida'}\nCliente: ${data.client?.name || 'No especificado'}`
                };

            case NotificationEventType.EMPLOYEE_UPDATED:
                return {
                    subject: `👤 Empleado Actualizado: ${data.employeeName || data.name}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Empleado Actualizado</h1>
                            </div>
                            <div class="content">
                                <p>Se ha actualizado la información del empleado:</p>
                                <div class="highlight">
                                    <strong>Nombre:</strong> ${data.employeeName || data.name}<br>
                                    <strong>Puesto:</strong> ${data.position || 'No especificado'}<br>
                                    <strong>Departamento:</strong> ${data.department || 'No especificado'}<br>
                                    <strong>Última actualización:</strong> ${new Date().toLocaleDateString()}
                                </div>
                                <p>Los cambios han sido guardados exitosamente.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Empleado Actualizado: ${data.name}\n\nPuesto: ${data.position || 'No especificado'}\nDepartamento: ${data.department || 'No especificado'}\nÚltima actualización: ${new Date().toLocaleDateString()}`
                };

            case NotificationEventType.INSPECTION_COMPLETED:
                return {
                    subject: `✅ Inspección Completada: ${data.title}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%);">
                                <h1 class="title">✅ Inspección Completada</h1>
                            </div>
                            <div class="content">
                                <p>Se ha completado la siguiente inspección:</p>
                                <div class="highlight" style="background: #f0fff4; border-left-color: #00b894;">
                                    <strong>Título:</strong> ${data.title}<br>
                                    <strong>Tipo:</strong> ${data.type}<br>
                                    <strong>Inspector:</strong> ${data.inspector || 'No especificado'}<br>
                                    <strong>Fecha de completación:</strong> ${new Date().toLocaleDateString()}<br>
                                    <strong>Proyecto:</strong> ${data.project?.name || 'No asignado'}
                                </div>
                                <p>Los resultados de la inspección están disponibles para revisión.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Inspección Completada: ${data.title}\n\nTipo: ${data.type}\nInspector: ${data.inspector || 'No especificado'}\nFecha de completación: ${new Date().toLocaleDateString()}\nProyecto: ${data.project?.name || 'No asignado'}`
                };

            case NotificationEventType.TASK_COMPLETED:
                return {
                    subject: `✅ Tarea Completada: ${data.title}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%);">
                                <h1 class="title">✅ Tarea Completada</h1>
                            </div>
                            <div class="content">
                                <p>Se ha completado la siguiente tarea:</p>
                                <div class="highlight" style="background: #f0fff4; border-left-color: #00b894;">
                                    <strong>Tarea:</strong> ${data.title}<br>
                                    <strong>Descripción:</strong> ${data.description || 'Sin descripción'}<br>
                                    <strong>Asignado a:</strong> ${data.assignee?.name || 'No asignado'}<br>
                                    <strong>Fecha de completación:</strong> ${new Date().toLocaleDateString()}<br>
                                    <strong>Proyecto:</strong> ${data.project?.name || 'No asignado'}
                                </div>
                                <p>La tarea ha sido marcada como completada.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Tarea Completada: ${data.title}\n\nDescripción: ${data.description || 'Sin descripción'}\nAsignado a: ${data.assignee?.name || 'No asignado'}\nFecha de completación: ${new Date().toLocaleDateString()}\nProyecto: ${data.project?.name || 'No asignado'}`
                };

            case NotificationEventType.TASK_OVERDUE:
                return {
                    subject: `⏰ Tarea Vencida: ${data.title}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);">
                                <h1 class="title">⏰ Tarea Vencida</h1>
                            </div>
                            <div class="content">
                                <p><strong>ATENCIÓN:</strong> La siguiente tarea ha vencido:</p>
                                <div class="highlight" style="background: #fff5f5; border-left-color: #ff6b6b;">
                                    <strong>Tarea:</strong> ${data.title}<br>
                                    <strong>Descripción:</strong> ${data.description || 'Sin descripción'}<br>
                                    <strong>Asignado a:</strong> ${data.assignee?.name || 'No asignado'}<br>
                                    <strong>Fecha de vencimiento:</strong> ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'No definida'}<br>
                                    <strong>Días de retraso:</strong> ${data.daysOverdue || 0} días<br>
                                    <strong>Proyecto:</strong> ${data.project?.name || 'No asignado'}
                                </div>
                                <p>Es necesario revisar el progreso de esta tarea.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Tarea Vencida: ${data.title}\n\nDescripción: ${data.description || 'Sin descripción'}\nAsignado a: ${data.assignee?.name || 'No asignado'}\nFecha de vencimiento: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'No definida'}\nDías de retraso: ${data.daysOverdue || 0} días\nProyecto: ${data.project?.name || 'No asignado'}`
                };

            case NotificationEventType.USER_INACTIVE:
                return {
                    subject: `👤 Usuario Inactivo: ${data.userName || data.name}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);">
                                <h1 class="title">👤 Usuario Inactivo</h1>
                            </div>
                            <div class="content">
                                <p>El siguiente usuario ha sido marcado como inactivo:</p>
                                <div class="highlight" style="background: #fff8e1; border-left-color: #ffa726;">
                                    <strong>Usuario:</strong> ${data.userName || data.name}<br>
                                    <strong>Email:</strong> ${data.email}<br>
                                    <strong>Rol:</strong> ${data.role}<br>
                                    <strong>Última actividad:</strong> ${data.lastActivity ? new Date(data.lastActivity).toLocaleDateString() : 'Desconocida'}
                                </div>
                                <p>El usuario ya no tendrá acceso al sistema.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Usuario Inactivo: ${data.name}\n\nEmail: ${data.email}\nRol: ${data.role}\nÚltima actividad: ${data.lastActivity ? new Date(data.lastActivity).toLocaleDateString() : 'Desconocida'}`
                };

            case NotificationEventType.CLIENT_CREATED:
                return {
                    subject: `🏢 Nuevo Cliente: ${data.clientName || data.name}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Cliente Registrado</h1>
                            </div>
                            <div class="content">
                                <p>Se ha registrado un nuevo cliente:</p>
                                <div class="highlight">
                                    <strong>Cliente:</strong> ${data.clientName || data.name}<br>
                                    <strong>Email:</strong> ${data.email || 'No especificado'}<br>
                                    <strong>Teléfono:</strong> ${data.phone || 'No especificado'}<br>
                                    <strong>Dirección:</strong> ${data.address || 'No especificada'}<br>
                                    <strong>Tipo:</strong> ${data.type || 'No especificado'}
                                </div>
                                <p>El cliente está listo para ser asignado a proyectos y generar facturas.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Nuevo Cliente: ${data.name}\n\nEmail: ${data.email || 'No especificado'}\nTeléfono: ${data.phone || 'No especificado'}\nDirección: ${data.address || 'No especificada'}\nTipo: ${data.type || 'No especificado'}`
                };

            case NotificationEventType.PROJECT_COMPLETED:
                return {
                    subject: `✅ Proyecto Completado: ${data.projectName || data.name}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%);">
                                <h1 class="title">✅ Proyecto Completado</h1>
                            </div>
                            <div class="content">
                                <p>¡Felicitaciones! Se ha completado exitosamente el siguiente proyecto:</p>
                                <div class="highlight" style="background: #f0fff4; border-left-color: #00b894;">
                                    <strong>Proyecto:</strong> ${data.projectName || data.name}<br>
                                    <strong>Descripción:</strong> ${data.description || 'Sin descripción'}<br>
                                    <strong>Fecha de completación:</strong> ${new Date().toLocaleDateString()}<br>
                                    <strong>Presupuesto final:</strong> $${data.budget?.toLocaleString() || '0'}<br>
                                    <strong>Creado por:</strong> ${data.createdBy || 'Sistema'}
                                </div>
                                <p>El proyecto ha sido marcado como completado en el sistema.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Proyecto Completado: ${data.name}\n\nDescripción: ${data.description || 'Sin descripción'}\nFecha de completación: ${new Date().toLocaleDateString()}\nPresupuesto final: $${data.budget?.toLocaleString() || '0'}\nCreado por: ${data.createdBy || 'Sistema'}`
                };

            case NotificationEventType.BUDGET_WARNING:
                return {
                    subject: `⚠️ Advertencia de Presupuesto: ${data.budgetName || data.name}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);">
                                <h1 class="title">⚠️ Advertencia de Presupuesto</h1>
                            </div>
                            <div class="content">
                                <p><strong>ATENCIÓN:</strong> El siguiente presupuesto está cerca de su límite:</p>
                                <div class="highlight" style="background: #fff8e1; border-left-color: #ffa726;">
                                    <strong>Presupuesto:</strong> ${data.budgetName || data.name}<br>
                                    <strong>Límite:</strong> $${data.totalAmount?.toLocaleString() || '0'}<br>
                                    <strong>Gastado:</strong> $${data.spent?.toLocaleString() || '0'}<br>
                                    <strong>Restante:</strong> $${((data.totalAmount || 0) - (data.spent || 0)).toLocaleString()}<br>
                                    <strong>Porcentaje usado:</strong> ${data.totalAmount ? Math.round(((data.spent || 0) / data.totalAmount) * 100) : 0}%<br>
                                    <strong>Proyecto:</strong> ${data.projectName || data.project?.name || 'No asignado'}
                                </div>
                                <p>Se recomienda revisar los gastos y considerar ajustes al presupuesto si es necesario.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Advertencia de Presupuesto: ${data.name}\n\nLímite: $${data.totalAmount?.toLocaleString() || '0'}\nGastado: $${data.spent?.toLocaleString() || '0'}\nRestante: $${((data.totalAmount || 0) - (data.spent || 0)).toLocaleString()}\nPorcentaje usado: ${data.totalAmount ? Math.round(((data.spent || 0) / data.totalAmount) * 100) : 0}%\nProyecto: ${data.project?.name || 'No asignado'}`
                };

            case NotificationEventType.TASK_ASSIGNED:
                return {
                    subject: `📋 Nueva Tarea Asignada: ${data.title}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Nueva Tarea Asignada</h1>
                            </div>
                            <div class="content">
                                <p>Se te ha asignado una nueva tarea:</p>
                                <div class="highlight">
                                    <strong>Tarea:</strong> ${data.title}<br>
                                    <strong>Descripción:</strong> ${data.description || 'Sin descripción'}<br>
                                    <strong>Asignado a:</strong> ${data.assigneeName || 'No asignado'}<br>
                                    <strong>Prioridad:</strong> ${data.priority || 'Normal'}<br>
                                    <strong>Fecha límite:</strong> ${data.endDate || 'Sin fecha límite'}<br>
                                    <strong>Proyecto:</strong> ${data.projectName || 'No asignado'}
                                </div>
                                <p>Por favor revisa los detalles de la tarea y comienza a trabajar en ella.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Nueva Tarea Asignada: ${data.title}\n\nDescripción: ${data.description || 'Sin descripción'}\nAsignado a: ${data.assigneeName || 'No asignado'}\nPrioridad: ${data.priority || 'Normal'}\nFecha límite: ${data.endDate || 'Sin fecha límite'}\nProyecto: ${data.projectName || 'No asignado'}`
                };

            case NotificationEventType.PAYROLL_GENERATED:
                return {
                    subject: `💰 Nómina Generada: ${data.employeeName}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Nómina Generada</h1>
                            </div>
                            <div class="content">
                                <p>Se ha generado la nómina para el siguiente empleado:</p>
                                <div class="highlight">
                                    <strong>Empleado:</strong> ${data.employeeName}<br>
                                    <strong>Período:</strong> ${data.period}<br>
                                    <strong>Salario neto:</strong> $${data.netPay?.toLocaleString() || '0'}<br>
                                    <strong>Moneda:</strong> ${data.currency || 'COP'}
                                </div>
                                <p>La nómina está lista para procesamiento y pago.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Nómina Generada: ${data.employeeName}\n\nPeríodo: ${data.period}\nSalario neto: $${data.netPay?.toLocaleString() || '0'}\nMoneda: ${data.currency || 'COP'}`
                };

            case NotificationEventType.PURCHASE_ORDER_CREATED:
                return {
                    subject: `📦 Orden de Compra Creada: ${data.number}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Orden de Compra Creada</h1>
                            </div>
                            <div class="content">
                                <p>Se ha creado una nueva orden de compra:</p>
                                <div class="highlight">
                                    <strong>Número:</strong> ${data.number}<br>
                                    <strong>Proveedor:</strong> ${data.providerName}<br>
                                    <strong>Descripción:</strong> ${data.description || 'Sin descripción'}<br>
                                    <strong>Fecha de entrega:</strong> ${data.deliveryDate || 'No especificada'}<br>
                                    <strong>Estado:</strong> ${data.status}
                                </div>
                                <p>La orden de compra está pendiente de aprobación y procesamiento.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Orden de Compra Creada: ${data.number}\n\nProveedor: ${data.providerName}\nDescripción: ${data.description || 'Sin descripción'}\nFecha de entrega: ${data.deliveryDate || 'No especificada'}\nEstado: ${data.status}`
                };

            case NotificationEventType.USER_REGISTERED:
                return {
                    subject: `👤 Nuevo Usuario Registrado: ${data.userName}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Nuevo Usuario Registrado</h1>
                            </div>
                            <div class="content">
                                <p>Se ha registrado un nuevo usuario en el sistema:</p>
                                <div class="highlight">
                                    <strong>Usuario:</strong> ${data.userName}<br>
                                    <strong>Email:</strong> ${data.email}<br>
                                    <strong>Rol:</strong> ${data.role}<br>
                                    <strong>Puesto:</strong> ${data.position || 'No especificado'}<br>
                                    <strong>Fecha de registro:</strong> ${data.registrationDate}
                                </div>
                                <p>El usuario puede comenzar a utilizar el sistema con sus credenciales.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Nuevo Usuario Registrado: ${data.userName}\n\nEmail: ${data.email}\nRol: ${data.role}\nPuesto: ${data.position || 'No especificado'}\nFecha de registro: ${data.registrationDate}`
                };

            case NotificationEventType.PROVIDER_CREATED:
                return {
                    subject: `🏢 Nuevo Proveedor Registrado: ${data.providerName || data.name}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Proveedor Registrado</h1>
                            </div>
                            <div class="content">
                                <p>Se ha registrado un nuevo proveedor:</p>
                                <div class="highlight">
                                    <strong>Proveedor:</strong> ${data.providerName || data.name}<br>
                                    <strong>Email:</strong> ${data.email || 'No especificado'}<br>
                                    <strong>Teléfono:</strong> ${data.phone || 'No especificado'}<br>
                                    <strong>Dirección:</strong> ${data.address || 'No especificada'}<br>
                                    <strong>Servicios:</strong> ${data.services || 'No especificados'}<br>
                                    <strong>Creado por:</strong> ${data.createdBy || 'Sistema'}
                                </div>
                                <p>El proveedor está listo para ser utilizado en órdenes de compra.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Nuevo Proveedor Registrado: ${data.name}\n\nEmail: ${data.email || 'No especificado'}\nTeléfono: ${data.phone || 'No especificado'}\nDirección: ${data.address || 'No especificada'}\nServicios: ${data.services || 'No especificados'}\nCreado por: ${data.createdBy || 'Sistema'}`
                };

            case NotificationEventType.COLLECTION_CREATED:
                return {
                    subject: `💰 Nueva Cobranza Creada`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Nueva Cobranza Creada</h1>
                            </div>
                            <div class="content">
                                <p>Se ha creado una nueva cobranza:</p>
                                <div class="highlight">
                                    <strong>Cliente:</strong> ${data.clientName}<br>
                                    <strong>Monto:</strong> $${data.amount?.toLocaleString() || '0'}<br>
                                    <strong>Método de pago:</strong> ${data.paymentMethod}<br>
                                    <strong>Estado:</strong> ${data.status}<br>
                                    <strong>Fecha de vencimiento:</strong> ${data.dueDate || 'No especificada'}<br>
                                    <strong>Descripción:</strong> ${data.description || 'Sin descripción'}
                                </div>
                                <p>La cobranza está pendiente de procesamiento.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Nueva Cobranza Creada\n\nCliente: ${data.clientName}\nMonto: $${data.amount?.toLocaleString() || '0'}\nMétodo de pago: ${data.paymentMethod}\nEstado: ${data.status}\nFecha de vencimiento: ${data.dueDate || 'No especificada'}\nDescripción: ${data.description || 'Sin descripción'}`
                };

            case NotificationEventType.TIME_TRACKING_CREATED:
                return {
                    subject: `⏱️ Registro de Tiempo Creado`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Registro de Tiempo Creado</h1>
                            </div>
                            <div class="content">
                                <p>Se ha registrado tiempo trabajado:</p>
                                <div class="highlight">
                                    <strong>Empleado:</strong> ${data.employeeName}<br>
                                    <strong>Proyecto:</strong> ${data.projectName}<br>
                                    <strong>Fecha:</strong> ${data.date}<br>
                                    <strong>Horas trabajadas:</strong> ${data.hoursWorked}<br>
                                    <strong>Tipo de trabajo:</strong> ${data.workType}<br>
                                    <strong>Descripción:</strong> ${data.description || 'Sin descripción'}
                                </div>
                                <p>El registro de tiempo ha sido guardado exitosamente.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Registro de Tiempo Creado\n\nEmpleado: ${data.employeeName}\nProyecto: ${data.projectName}\nFecha: ${data.date}\nHoras trabajadas: ${data.hoursWorked}\nTipo de trabajo: ${data.workType}\nDescripción: ${data.description || 'Sin descripción'}`
                };

            case NotificationEventType.INSPECTION_SCHEDULED:
                return {
                    subject: `🔍 Inspección Programada: ${data.title}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Inspección Programada</h1>
                            </div>
                            <div class="content">
                                <p>Se ha programado una nueva inspección:</p>
                                <div class="highlight">
                                    <strong>Título:</strong> ${data.title}<br>
                                    <strong>Tipo:</strong> ${data.type}<br>
                                    <strong>Fecha programada:</strong> ${data.scheduledDate}<br>
                                    <strong>Inspector:</strong> ${data.inspector || 'No asignado'}<br>
                                    <strong>Proyecto:</strong> ${data.projectName || 'No asignado'}<br>
                                    <strong>Ubicación:</strong> ${data.location || 'No especificada'}
                                </div>
                                <p>La inspección está programada y pendiente de ejecución.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Inspección Programada: ${data.title}\n\nTipo: ${data.type}\nFecha programada: ${data.scheduledDate}\nInspector: ${data.inspector || 'No asignado'}\nProyecto: ${data.projectName || 'No asignado'}\nUbicación: ${data.location || 'No especificada'}`
                };

            case NotificationEventType.STOCK_LOW:
                return {
                    subject: `📉 Stock Bajo: ${data.materialName}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);">
                                <h1 class="title">📉 Alerta de Stock Bajo</h1>
                            </div>
                            <div class="content">
                                <p><strong>ATENCIÓN:</strong> El siguiente material tiene stock bajo:</p>
                                <div class="highlight" style="background: #fff5f5; border-left-color: #ff6b6b;">
                                    <strong>Material:</strong> ${data.materialName}<br>
                                    <strong>Stock actual:</strong> ${data.currentStock} ${data.unit}<br>
                                    <strong>Stock mínimo:</strong> ${data.minStock} ${data.unit}<br>
                                    <strong>Almacén:</strong> ${data.warehouseName}
                                </div>
                                <p>Es necesario reponer este material para evitar interrupciones en los proyectos.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Alerta de Stock Bajo: ${data.materialName}\n\nStock actual: ${data.currentStock} ${data.unit}\nStock mínimo: ${data.minStock} ${data.unit}\nAlmacén: ${data.warehouseName}`
                };

            // ========================================
            // NUEVO SISTEMA DE FACTURAS (BILLS)
            // ========================================

            case NotificationEventType.BILL_CREATED:
                return {
                    subject: `📄 Nueva ${data.type === 'CLIENT' ? 'Factura de Cliente' : 'Factura de Proveedor'}: ${data.billNumber}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, ${data.type === 'CLIENT' ? '#4facfe 0%, #00f2fe 100%' : '#ffecd2 0%, #fcb69f 100%'});">
                                <h1 class="title">${data.type === 'CLIENT' ? '📄 Factura de Cliente' : '📝 Factura de Proveedor'}</h1>
                            </div>
                            <div class="content">
                                <p>Se ha generado una nueva ${data.type === 'CLIENT' ? 'factura para cliente' : 'factura de proveedor'}:</p>
                                <div class="highlight" style="background: ${data.type === 'CLIENT' ? '#f0f9ff' : '#fef7f0'}; border-left-color: ${data.type === 'CLIENT' ? '#4facfe' : '#fcb69f'};">
                                    <strong>Número:</strong> ${data.billNumber}<br>
                                    <strong>${data.type === 'CLIENT' ? 'Cliente' : 'Proveedor'}:</strong> ${data.entityName || 'No especificado'}<br>
                                    <strong>Proyecto:</strong> ${data.projectName || 'No asignado'}<br>
                                    <strong>Total:</strong> ${data.currency} $${data.total?.toLocaleString() || '0'}<br>
                                    <strong>Estado:</strong> ${data.status}<br>
                                    <strong>Fecha de emisión:</strong> ${data.issueDate}<br>
                                    <strong>Fecha de vencimiento:</strong> ${data.dueDate}
                                </div>
                                <p>La factura está lista para ${data.type === 'CLIENT' ? 'ser enviada al cliente' : 'procesamiento de pago'}.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Nueva ${data.type === 'CLIENT' ? 'Factura de Cliente' : 'Factura de Proveedor'}: ${data.billNumber}\n\n${data.type === 'CLIENT' ? 'Cliente' : 'Proveedor'}: ${data.entityName || 'No especificado'}\nProyecto: ${data.projectName || 'No asignado'}\nTotal: ${data.currency} $${data.total?.toLocaleString() || '0'}\nEstado: ${data.status}\nFecha de emisión: ${data.issueDate}\nFecha de vencimiento: ${data.dueDate}`
                };

            case NotificationEventType.BILL_PAID:
                return {
                    subject: `✅ ${data.type === 'CLIENT' ? 'Factura Cobrada' : 'Factura Pagada'}: ${data.billNumber}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%);">
                                <h1 class="title">✅ ${data.type === 'CLIENT' ? 'Factura Cobrada' : 'Factura Pagada'}</h1>
                            </div>
                            <div class="content">
                                <p>La siguiente factura ha sido ${data.type === 'CLIENT' ? 'cobrada completamente' : 'pagada completamente'}:</p>
                                <div class="highlight" style="background: #f0fff4; border-left-color: #00b894;">
                                    <strong>Número:</strong> ${data.billNumber}<br>
                                    <strong>${data.type === 'CLIENT' ? 'Cliente' : 'Proveedor'}:</strong> ${data.entityName || 'No especificado'}<br>
                                    <strong>Proyecto:</strong> ${data.projectName || 'No asignado'}<br>
                                    <strong>Monto total:</strong> ${data.currency} $${data.total?.toLocaleString() || '0'}<br>
                                    <strong>Monto ${data.type === 'CLIENT' ? 'cobrado' : 'pagado'}:</strong> ${data.currency} $${data.paidAmount?.toLocaleString() || '0'}<br>
                                    <strong>Método de pago:</strong> ${data.paymentMethod || 'No especificado'}<br>
                                    <strong>Fecha de pago:</strong> ${data.paymentDate}<br>
                                    ${data.paidDate ? `<strong>Fecha de ${data.type === 'CLIENT' ? 'cobro' : 'pago'} completo:</strong> ${data.paidDate}` : ''}
                                </div>
                                <p>La transacción ha sido registrada exitosamente en el sistema.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `${data.type === 'CLIENT' ? 'Factura Cobrada' : 'Factura Pagada'}: ${data.billNumber}\n\n${data.type === 'CLIENT' ? 'Cliente' : 'Proveedor'}: ${data.entityName || 'No especificado'}\nProyecto: ${data.projectName || 'No asignado'}\nMonto total: ${data.currency} $${data.total?.toLocaleString() || '0'}\nMonto ${data.type === 'CLIENT' ? 'cobrado' : 'pagado'}: ${data.currency} $${data.paidAmount?.toLocaleString() || '0'}\nMétodo de pago: ${data.paymentMethod || 'No especificado'}\nFecha de pago: ${data.paymentDate}`
                };

            case NotificationEventType.BILL_OVERDUE:
                return {
                    subject: `⚠️ ${data.type === 'CLIENT' ? 'Factura Vencida' : 'Pago Vencido'}: ${data.billNumber}`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);">
                                <h1 class="title">⚠️ ${data.type === 'CLIENT' ? 'Factura Vencida' : 'Pago Vencido'}</h1>
                            </div>
                            <div class="content">
                                <p><strong>ATENCIÓN:</strong> La siguiente ${data.type === 'CLIENT' ? 'factura está vencida' : 'factura requiere pago urgente'}:</p>
                                <div class="highlight" style="background: #fff5f5; border-left-color: #ff6b6b;">
                                    <strong>Número:</strong> ${data.billNumber}<br>
                                    <strong>${data.type === 'CLIENT' ? 'Cliente' : 'Proveedor'}:</strong> ${data.entityName || 'No especificado'}<br>
                                    <strong>Proyecto:</strong> ${data.projectName || 'No asignado'}<br>
                                    <strong>Monto pendiente:</strong> ${data.currency} $${data.total?.toLocaleString() || '0'}<br>
                                    <strong>Estado:</strong> ${data.status}<br>
                                    <strong>Fecha de vencimiento:</strong> ${data.dueDate}<br>
                                    <strong>Días de ${data.type === 'CLIENT' ? 'vencimiento' : 'atraso'}:</strong> ${data.daysPastDue || 0} días
                                </div>
                                <p>Es necesario ${data.type === 'CLIENT' ? 'contactar al cliente para gestionar el cobro' : 'proceder con el pago a la brevedad'}.</p>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `${data.type === 'CLIENT' ? 'Factura Vencida' : 'Pago Vencido'}: ${data.billNumber}\n\n${data.type === 'CLIENT' ? 'Cliente' : 'Proveedor'}: ${data.entityName || 'No especificado'}\nProyecto: ${data.projectName || 'No asignado'}\nMonto pendiente: ${data.currency} $${data.total?.toLocaleString() || '0'}\nEstado: ${data.status}\nFecha de vencimiento: ${data.dueDate}\nDías de ${data.type === 'CLIENT' ? 'vencimiento' : 'atraso'}: ${data.daysPastDue || 0} días`
                };

            default:
                return {
                    subject: `📧 Notificación del Sistema`,
                    html: `
                        ${baseStyle}
                        <div class="container">
                            <div class="header">
                                <h1 class="title">Notificación del Sistema</h1>
                            </div>
                            <div class="content">
                                <p>Se ha producido un evento en el sistema:</p>
                                <div class="highlight">
                                    <strong>Tipo de evento:</strong> ${eventType}<br>
                                    <strong>Datos:</strong> ${JSON.stringify(data, null, 2)}
                                </div>
                            </div>
                            <div class="footer">
                                <p>Sistema Pix ERP - Gestión de Construcción</p>
                            </div>
                        </div>
                    `,
                    text: `Notificación del Sistema\n\nTipo de evento: ${eventType}\nDatos: ${JSON.stringify(data, null, 2)}`
                };
        }
    }
}

export const emailService = new EmailService();