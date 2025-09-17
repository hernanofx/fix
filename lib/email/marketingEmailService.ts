// Marketing Email Service for Prospects
// Specialized service for sending professional sales emails to prospects

import nodemailer from 'nodemailer';

export enum MarketingEmailType {
    INTRODUCTION = 'INTRODUCTION',
    FOLLOW_UP = 'FOLLOW_UP',
    SPECIAL_OFFER = 'SPECIAL_OFFER',
    PRODUCT_SHOWCASE = 'PRODUCT_SHOWCASE',
    CASE_STUDY = 'CASE_STUDY',
    TESTIMONIAL = 'TESTIMONIAL',
    NEWSLETTER = 'NEWSLETTER',
    EVENT_INVITATION = 'EVENT_INVITATION',
    QUOTE_REQUEST = 'QUOTE_REQUEST',
    WELCOME_BACK = 'WELCOME_BACK'
}

export interface MarketingEmailTemplate {
    id: string;
    name: string;
    type: MarketingEmailType;
    subject: string;
    htmlContent: string;
    textContent: string;
    variables: string[]; // Variables disponibles en la plantilla
    category: string;
    isActive: boolean;
}

export interface MarketingEmailConfig {
    templateId: string;
    prospectIds: string[];
    customSubject?: string;
    customVariables?: Record<string, string>;
    scheduledDate?: Date;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

export interface MarketingEmailResult {
    success: boolean;
    sentCount: number;
    failedCount: number;
    errors: string[];
    messageId?: string;
}

class MarketingEmailService {
    private fromName: string;
    private fromEmail: string;

    constructor() {
        this.fromName = process.env.SMTP_FROM_NAME || 'Pix ERP';
        this.fromEmail = process.env.SMTP_FROM_EMAIL || 'info@pixerp.app';
    }

    // Plantillas de email predefinidas
    private emailTemplates: MarketingEmailTemplate[] = [
        {
            id: 'intro-basic',
            name: 'Introducción Básica',
            type: MarketingEmailType.INTRODUCTION,
            subject: 'Conoce Pix - Tu Socio en Construcción',
            category: 'Introducción',
            isActive: true,
            variables: ['prospectName', 'companyName', 'contactName'],
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Conoce Pix Construcción</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
                        .container { max-width: 600px; margin: 0 auto; background: white; }
                        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 40px 30px; text-align: center; }
                        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
                        .tagline { font-size: 16px; opacity: 0.9; }
                        .content { padding: 40px 30px; line-height: 1.6; color: #374151; }
                        .highlight { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
                        .service { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; }
                        .service-icon { font-size: 32px; margin-bottom: 10px; }
                        .cta-button { display: inline-block; background: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                        .footer { background: #1e3a8a; color: white; padding: 30px; text-align: center; }
                        .social-links { margin: 20px 0; }
                        .social-links a { color: white; margin: 0 10px; text-decoration: none; }
                        @media (max-width: 600px) { .services { grid-template-columns: 1fr; } }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">PIX CONSTRUCCIÓN</div>
                            <div class="tagline">Construyendo el futuro de tu proyecto</div>
                        </div>

                        <div class="content">
                            <h1 style="color: #1e3a8a; margin-bottom: 20px;">¡Hola {{prospectName}}!</h1>

                            <p>Somos <strong>Pix Construcción</strong>, una empresa especializada en soluciones integrales para el sector de la construcción. Con más de 10 años de experiencia, hemos acompañado a empresas como la tuya en la realización de proyectos exitosos.</p>

                            <div class="highlight">
                                <h3 style="margin-top: 0; color: #1e3a8a;">¿Por qué elegir Pix Construcción?</h3>
                                <ul style="margin: 0; padding-left: 20px;">
                                    <li>✅ Equipo técnico altamente calificado</li>
                                    <li>✅ Tecnología de vanguardia en gestión de proyectos</li>
                                    <li>✅ Compromiso con plazos y presupuestos</li>
                                    <li>✅ Atención personalizada y seguimiento continuo</li>
                                </ul>
                            </div>

                            <div class="services">
                                <div class="service">
                                    <div class="service-icon">🏗️</div>
                                    <h4>Construcción</h4>
                                    <p>Soluciones completas en edificación residencial, comercial e industrial.</p>
                                </div>
                                <div class="service">
                                    <div class="service-icon">📊</div>
                                    <h4>Gestión de Proyectos</h4>
                                    <p>Control total de presupuestos, tiempos y calidad.</p>
                                </div>
                                <div class="service">
                                    <div class="service-icon">🔧</div>
                                    <h4>Mantenimiento</h4>
                                    <p>Servicios de mantenimiento preventivo y correctivo.</p>
                                </div>
                            </div>

                            <p>Nos gustaría conocer más sobre tu proyecto y cómo podemos ayudarte a materializarlo. ¿Te parece si agendamos una reunión para conversar sobre tus necesidades específicas?</p>

                            <div style="text-align: center;">
                                <a href="#" class="cta-button">Agendar Reunión</a>
                            </div>

                            <p style="margin-top: 30px;">También puedes contactarnos directamente:</p>
                            <p><strong>📞 Teléfono:</strong> +56 9 1234 5678<br>
                            <strong>📧 Email:</strong> contacto@pixconstruccion.com<br>
                            <strong>🌐 Web:</strong> www.pixconstruccion.com</p>
                        </div>

                        <div class="footer">
                            <p><strong>Pix Construcción</strong></p>
                            <p>Construyendo sueños, entregando resultados</p>
                            <div class="social-links">
                                <a href="#">📘 Facebook</a>
                                <a href="#">📷 Instagram</a>
                                <a href="#">💼 LinkedIn</a>
                            </div>
                            <p style="font-size: 12px; opacity: 0.8;">
                                Este email fue enviado a {{prospectName}} por interés en nuestros servicios.<br>
                                Si no deseas recibir más comunicaciones, puedes <a href="#" style="color: white;">darte de baja aquí</a>.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            textContent: `
PIX CONSTRUCCIÓN
Construyendo el futuro de tu proyecto

¡Hola {{prospectName}}!

Somos Pix Construcción, una empresa especializada en soluciones integrales para el sector de la construcción. Con más de 10 años de experiencia, hemos acompañado a empresas como la tuya en la realización de proyectos exitosos.

¿POR QUÉ ELEGIR PIX CONSTRUCCIÓN?
• Equipo técnico altamente calificado
• Tecnología de vanguardia en gestión de proyectos
• Compromiso con plazos y presupuestos
• Atención personalizada y seguimiento continuo

NUESTROS SERVICIOS:
• Construcción: Soluciones completas en edificación residencial, comercial e industrial
• Gestión de Proyectos: Control total de presupuestos, tiempos y calidad
• Mantenimiento: Servicios de mantenimiento preventivo y correctivo

Nos gustaría conocer más sobre tu proyecto y cómo podemos ayudarte a materializarlo. ¿Te parece si agendamos una reunión para conversar sobre tus necesidades específicas?

CONTACTO:
Teléfono: +56 9 1234 5678
Email: contacto@pixconstruccion.com
Web: www.pixconstruccion.com

Pix Construcción
Construyendo sueños, entregando resultados

Este email fue enviado por interés en nuestros servicios.
Si no deseas recibir más comunicaciones, puedes darte de baja respondiendo a este email con "BAJA".
            `
        },
        {
            id: 'follow-up-1',
            name: 'Seguimiento 1 - Recordatorio',
            type: MarketingEmailType.FOLLOW_UP,
            subject: 'Seguimiento - ¿Hablamos de tu proyecto?',
            category: 'Seguimiento',
            isActive: true,
            variables: ['prospectName', 'companyName', 'daysSinceContact'],
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Seguimiento - Tu Proyecto</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
                        .container { max-width: 600px; margin: 0 auto; background: white; }
                        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
                        .content { padding: 40px 30px; line-height: 1.6; color: #374151; }
                        .reminder-box { background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
                        .timeline { display: flex; justify-content: space-between; margin: 30px 0; }
                        .timeline-item { text-align: center; flex: 1; }
                        .timeline-dot { width: 20px; height: 20px; background: #10b981; border-radius: 50%; margin: 0 auto 10px; }
                        .timeline-line { height: 2px; background: #10b981; margin-top: 10px; }
                        .cta-button { display: inline-block; background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                        .footer { background: #1e3a8a; color: white; padding: 30px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0; font-size: 24px;">Seguimiento de tu Proyecto</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Hace {{daysSinceContact}} días que nos contactaste</p>
                        </div>

                        <div class="content">
                            <h2 style="color: #059669;">¡Hola {{prospectName}}!</h2>

                            <p>Espero que este email te encuentre bien. Hace {{daysSinceContact}} días nos contactaste para conocer más sobre nuestros servicios de construcción, y quería hacer un seguimiento personalizado.</p>

                            <div class="reminder-box">
                                <h3 style="margin-top: 0; color: #059669;">📅 Recordatorio de nuestra conversación</h3>
                                <p>En nuestra comunicación anterior hablamos sobre:</p>
                                <ul style="margin: 10px 0;">
                                    <li>Las necesidades específicas de tu proyecto</li>
                                    <li>Los plazos que manejas</li>
                                    <li>El presupuesto aproximado</li>
                                </ul>
                            </div>

                            <div class="timeline">
                                <div class="timeline-item">
                                    <div class="timeline-dot"></div>
                                    <strong>Contacto Inicial</strong>
                                    <div class="timeline-line"></div>
                                </div>
                                <div class="timeline-item">
                                    <div class="timeline-dot" style="background: #fbbf24;"></div>
                                    <strong>Seguimiento</strong>
                                    <div class="timeline-line"></div>
                                </div>
                                <div class="timeline-item">
                                    <div class="timeline-dot" style="background: #e5e7eb;"></div>
                                    <strong>Reunión</strong>
                                    <div class="timeline-line"></div>
                                </div>
                                <div class="timeline-item">
                                    <div class="timeline-dot" style="background: #e5e7eb;"></div>
                                    <strong>Proyecto</strong>
                                </div>
                            </div>

                            <p>Me gustaría saber si has tenido oportunidad de revisar la información que te compartí. ¿Hay algún aspecto específico sobre el que te gustaría profundizar?</p>

                            <p>Estoy disponible para:</p>
                            <ul>
                                <li>📞 Una llamada de 15 minutos para resolver tus dudas</li>
                                <li>📧 Enviar información más detallada sobre casos similares</li>
                                <li>🏢 Organizar una visita a una de nuestras obras en ejecución</li>
                            </ul>

                            <div style="text-align: center;">
                                <a href="#" class="cta-button">Agendar Llamada</a>
                            </div>

                            <p style="margin-top: 30px;">Quedo atento a tus comentarios. ¡Será un placer poder ayudarte con tu proyecto!</p>

                            <p><strong>Saludos cordiales,</strong><br>
                            [Tu Nombre]<br>
                            Ejecutivo de Ventas<br>
                            Pix Construcción</p>
                        </div>

                        <div class="footer">
                            <p><strong>Pix Construcción</strong></p>
                            <p>Construyendo sueños, entregando resultados</p>
                            <p style="font-size: 12px; opacity: 0.8;">
                                Este es un seguimiento personalizado de tu consulta.<br>
                                Si ya no estás interesado, puedes <a href="#" style="color: white;">darte de baja aquí</a>.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            textContent: `
PIX CONSTRUCCIÓN - SEGUIMIENTO

¡Hola {{prospectName}}!

Hace {{daysSinceContact}} días nos contactaste para conocer más sobre nuestros servicios de construcción, y quería hacer un seguimiento personalizado.

RECORDATORIO DE NUESTRA CONVERSACIÓN:
• Las necesidades específicas de tu proyecto
• Los plazos que manejas
• El presupuesto aproximado

Me gustaría saber si has tenido oportunidad de revisar la información que te compartí. ¿Hay algún aspecto específico sobre el que te gustaría profundizar?

Estoy disponible para:
• Una llamada de 15 minutos para resolver tus dudas
• Enviar información más detallada sobre casos similares
• Organizar una visita a una de nuestras obras en ejecución

Quedo atento a tus comentarios. ¡Será un placer poder ayudarte con tu proyecto!

Saludos cordiales,
[Tu Nombre]
Ejecutivo de Ventas
Pix Construcción

Este es un seguimiento personalizado de tu consulta.
Si ya no estás interesado, puedes darte de baja respondiendo con "BAJA".
            `
        },
        {
            id: 'special-offer',
            name: 'Oferta Especial',
            type: MarketingEmailType.SPECIAL_OFFER,
            subject: '🎯 Oferta Especial Limitada - 15% Descuento',
            category: 'Ofertas',
            isActive: true,
            variables: ['prospectName', 'companyName', 'discountPercentage', 'validUntil'],
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Oferta Especial Pix Construcción</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
                        .container { max-width: 600px; margin: 0 auto; background: white; }
                        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 40px 30px; text-align: center; position: relative; }
                        .offer-badge { position: absolute; top: -15px; right: 30px; background: #fbbf24; color: #92400e; padding: 10px 20px; border-radius: 25px; font-weight: bold; font-size: 14px; }
                        .content { padding: 40px 30px; line-height: 1.6; color: #374151; }
                        .offer-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; }
                        .discount { font-size: 48px; font-weight: bold; color: #dc2626; margin: 10px 0; }
                        .validity { background: #dc2626; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; font-weight: bold; }
                        .cta-button { display: inline-block; background: #dc2626; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3); }
                        .conditions { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
                        .urgency { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
                        .footer { background: #1e3a8a; color: white; padding: 30px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="offer-badge">⚡ OFERTA LIMITADA</div>
                            <h1 style="margin: 0; font-size: 32px;">¡Oferta Especial!</h1>
                            <p style="margin: 10px 0 0 0; font-size: 18px;">Para {{prospectName}} y {{companyName}}</p>
                        </div>

                        <div class="content">
                            <h2 style="color: #dc2626; text-align: center;">¡Tenemos una oferta especial para ti!</h2>

                            <div class="offer-box">
                                <h3 style="margin-top: 0; color: #92400e;">Descuento Exclusivo</h3>
                                <div class="discount">{{discountPercentage}}%</div>
                                <p style="margin: 0; font-size: 18px; color: #92400e;">en tu próximo proyecto de construcción</p>
                                <div class="validity">Válido hasta {{validUntil}}</div>
                            </div>

                            <div class="urgency">
                                <h3 style="margin-top: 0; color: #dc2626;">⏰ ¡Esta oferta es por tiempo limitado!</h3>
                                <p style="margin: 5px 0;">Solo por ser uno de nuestros prospectos más destacados, queremos ofrecerte esta oportunidad única. Esta promoción está disponible únicamente por las próximas 48 horas.</p>
                            </div>

                            <p>Esta oferta especial incluye:</p>
                            <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                                <li>✅ {{discountPercentage}}% de descuento en servicios de construcción</li>
                                <li>✅ Estudio técnico gratuito</li>
                                <li>✅ Presupuesto sin compromiso</li>
                                <li>✅ Asesoría especializada durante 6 meses</li>
                                <li>✅ Seguimiento personalizado del proyecto</li>
                            </ul>

                            <div class="conditions">
                                <h4 style="margin-top: 0; color: #374151;">Condiciones de la oferta:</h4>
                                <ul style="text-align: left; margin: 10px 0;">
                                    <li>Válido para proyectos nuevos</li>
                                    <li>Mínimo de inversión: $50.000.000</li>
                                    <li>Debe iniciar el proyecto dentro de 30 días</li>
                                    <li>No acumulable con otras promociones</li>
                                </ul>
                            </div>

                            <div style="text-align: center;">
                                <a href="#" class="cta-button">¡Aprovechar Oferta Ahora!</a>
                            </div>

                            <p style="text-align: center; margin-top: 30px; color: #6b7280;">
                                ¿Tienes preguntas sobre esta oferta?<br>
                                Contáctanos al <strong>+56 9 1234 5678</strong> o responde este email.
                            </p>
                        </div>

                        <div class="footer">
                            <p><strong>Pix Construcción</strong></p>
                            <p>Construyendo sueños, entregando resultados</p>
                            <p style="font-size: 12px; opacity: 0.8;">
                                Esta oferta es exclusiva para {{prospectName}} de {{companyName}}.<br>
                                Si no deseas recibir ofertas especiales, puedes <a href="#" style="color: white;">darte de baja aquí</a>.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            textContent: `
PIX CONSTRUCCIÓN - OFERTA ESPECIAL

¡OFERTA LIMITADA PARA {{prospectName}} DE {{companyName}}!

¡Tenemos una oferta especial para ti!

DESCUENTO EXCLUSIVO: {{discountPercentage}}%
en tu próximo proyecto de construcción

Válido hasta {{validUntil}}

¡Esta oferta es por tiempo limitado!
Solo por ser uno de nuestros prospectos más destacados, queremos ofrecerte esta oportunidad única. Esta promoción está disponible únicamente por las próximas 48 horas.

Esta oferta especial incluye:
• {{discountPercentage}}% de descuento en servicios de construcción
• Estudio técnico gratuito
• Presupuesto sin compromiso
• Asesoría especializada durante 6 meses
• Seguimiento personalizado del proyecto

CONDICIONES DE LA OFERTA:
• Válido para proyectos nuevos
• Mínimo de inversión: $50.000.000
• Debe iniciar el proyecto dentro de 30 días
• No acumulable con otras promociones

¿Tienes preguntas sobre esta oferta?
Contáctanos al +56 9 1234 5678 o responde este email.

Pix Construcción
Construyendo sueños, entregando resultados

Esta oferta es exclusiva para {{prospectName}} de {{companyName}}.
Si no deseas recibir ofertas especiales, puedes darte de baja respondiendo con "BAJA".
            `
        },
        {
            id: 'case-study',
            name: 'Caso de Éxito',
            type: MarketingEmailType.CASE_STUDY,
            subject: '🏆 Caso de Éxito - Proyecto Similar al Tuyo',
            category: 'Casos de Éxito',
            isActive: true,
            variables: ['prospectName', 'companyName', 'projectName', 'projectValue', 'completionTime'],
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Caso de Éxito Pix Construcción</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
                        .container { max-width: 600px; margin: 0 auto; background: white; }
                        .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 40px 30px; text-align: center; }
                        .success-badge { background: #fbbf24; color: #92400e; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 15px; }
                        .content { padding: 40px 30px; line-height: 1.6; color: #374151; }
                        .case-study { background: #f8f9fa; border-radius: 12px; padding: 30px; margin: 30px 0; }
                        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
                        .stat { text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                        .stat-number { font-size: 24px; font-weight: bold; color: #7c3aed; }
                        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
                        .testimonial { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0; }
                        .cta-button { display: inline-block; background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                        .comparison { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
                        .comparison-item { padding: 20px; border-radius: 8px; text-align: center; }
                        .before { background: #fef2f2; border: 2px solid #fca5a5; }
                        .after { background: #f0fdf4; border: 2px solid #86efac; }
                        .footer { background: #1e3a8a; color: white; padding: 30px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="success-badge">🏆 CASO DE ÉXITO</div>
                            <h1 style="margin: 0; font-size: 28px;">Proyecto Similar al Tuyo</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Para {{prospectName}} de {{companyName}}</p>
                        </div>

                        <div class="content">
                            <h2 style="color: #7c3aed; text-align: center;">¡Hola {{prospectName}}!</h2>

                            <p>Queríamos compartir contigo un caso de éxito reciente que creemos puede interesarte, ya que tiene similitudes con el proyecto que nos comentaste.</p>

                            <div class="case-study">
                                <h3 style="margin-top: 0; color: #7c3aed;">{{projectName}}</h3>
                                <p>Proyecto de construcción de edificio comercial de 5 pisos con áreas comunes y locales comerciales.</p>

                                <div class="stats">
                                    <div class="stat">
                                        <div class="stat-number">{{projectValue}}</div>
                                        <div class="stat-label">Valor del Proyecto</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-number">{{completionTime}}</div>
                                        <div class="stat-label">Tiempo de Ejecución</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-number">98%</div>
                                        <div class="stat-label">Satisfacción Cliente</div>
                                    </div>
                                </div>

                                <h4 style="color: #7c3aed;">El Desafío</h4>
                                <p>El cliente necesitaba construir un edificio comercial moderno en un plazo ajustado, con estrictos estándares de calidad y dentro de un presupuesto limitado. El terreno presentaba desafíos técnicos adicionales.</p>

                                <h4 style="color: #7c3aed;">Nuestra Solución</h4>
                                <ul>
                                    <li>✅ Diseño personalizado adaptado a las necesidades específicas</li>
                                    <li>✅ Utilización de tecnologías constructivas innovadoras</li>
                                    <li>✅ Gestión eficiente de proveedores y subcontratistas</li>
                                    <li>✅ Control de calidad en cada etapa del proyecto</li>
                                    <li>✅ Comunicación constante y transparente con el cliente</li>
                                </ul>
                            </div>

                            <div class="comparison">
                                <div class="comparison-item before">
                                    <h4 style="margin-top: 0; color: #dc2626;">Antes de Pix</h4>
                                    <ul style="text-align: left; margin: 10px 0;">
                                        <li>Plazos no cumplidos</li>
                                        <li>Costos descontrolados</li>
                                        <li>Calidad inconsistente</li>
                                        <li>Falta de comunicación</li>
                                    </ul>
                                </div>
                                <div class="comparison-item after">
                                    <h4 style="margin-top: 0; color: #16a34a;">Después de Pix</h4>
                                    <ul style="text-align: left; margin: 10px 0;">
                                        <li>Entrega en tiempo y forma</li>
                                        <li>Presupuesto respetado</li>
                                        <li>Calidad superior garantizada</li>
                                        <li>Comunicación permanente</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="testimonial">
                                <p style="margin: 0; font-style: italic; font-size: 16px;">
                                    "Pix Construcción no solo cumplió con todos nuestros requerimientos, sino que superó nuestras expectativas. El proyecto se entregó antes de lo previsto y con una calidad excepcional. Recomiendo ampliamente sus servicios."
                                </p>
                                <p style="margin: 10px 0 0 0; text-align: right; font-weight: bold;">
                                    - María González, Gerente de Proyectos<br>
                                    <span style="font-weight: normal; font-size: 14px;">Empresa Constructora XYZ</span>
                                </p>
                            </div>

                            <p>Este caso demuestra cómo podemos ayudarte a transformar tu visión en realidad, cumpliendo con los más altos estándares de calidad y eficiencia.</p>

                            <p>¿Te gustaría que preparemos un presupuesto personalizado para tu proyecto, considerando las lecciones aprendidas en casos similares?</p>

                            <div style="text-align: center;">
                                <a href="#" class="cta-button">Solicitar Presupuesto</a>
                            </div>

                            <p style="text-align: center; margin-top: 20px; color: #6b7280;">
                                También puedes llamarnos al <strong>+56 9 1234 5678</strong>
                            </p>
                        </div>

                        <div class="footer">
                            <p><strong>Pix Construcción</strong></p>
                            <p>Construyendo sueños, entregando resultados</p>
                            <p style="font-size: 12px; opacity: 0.8;">
                                Compartimos casos de éxito para inspirarte.<br>
                                Si no deseas recibir más casos, puedes <a href="#" style="color: white;">darte de baja aquí</a>.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            textContent: `
PIX CONSTRUCCIÓN - CASO DE ÉXITO

¡Hola {{prospectName}}!

Queríamos compartir contigo un caso de éxito reciente que creemos puede interesarte, ya que tiene similitudes con el proyecto que nos comentaste.

PROYECTO: {{projectName}}
Proyecto de construcción de edificio comercial de 5 pisos con áreas comunes y locales comerciales.

ESTADÍSTICAS:
• Valor del Proyecto: {{projectValue}}
• Tiempo de Ejecución: {{completionTime}}
• Satisfacción del Cliente: 98%

EL DESAFÍO:
El cliente necesitaba construir un edificio comercial moderno en un plazo ajustado, con estrictos estándares de calidad y dentro de un presupuesto limitado. El terreno presentaba desafíos técnicos adicionales.

NUESTRA SOLUCIÓN:
• Diseño personalizado adaptado a las necesidades específicas
• Utilización de tecnologías constructivas innovadoras
• Gestión eficiente de proveedores y subcontratistas
• Control de calidad en cada etapa del proyecto
• Comunicación constante y transparente con el cliente

RESULTADOS:
• Entrega en tiempo y forma
• Presupuesto respetado
• Calidad superior garantizada
• Comunicación permanente

TESTIMONIO:
"Pix Construcción no solo cumplió con todos nuestros requerimientos, sino que superó nuestras expectativas. El proyecto se entregó antes de lo previsto y con una calidad excepcional. Recomiendo ampliamente sus servicios."
- María González, Gerente de Proyectos, Empresa Constructora XYZ

Este caso demuestra cómo podemos ayudarte a transformar tu visión en realidad, cumpliendo con los más altos estándares de calidad y eficiencia.

¿Te gustaría que preparemos un presupuesto personalizado para tu proyecto?

Contáctanos al +56 9 1234 5678

Pix Construcción
Construyendo sueños, entregando resultados

Si no deseas recibir más casos de éxito, responde con "BAJA".
            `
        }
    ];

    // Método para obtener todas las plantillas activas
    public getActiveTemplates(): MarketingEmailTemplate[] {
        return this.emailTemplates.filter(template => template.isActive);
    }

    // Método para obtener plantillas por categoría
    public getTemplatesByCategory(category: string): MarketingEmailTemplate[] {
        return this.emailTemplates.filter(template =>
            template.category === category && template.isActive
        );
    }

    // Método para obtener plantilla por ID
    public getTemplateById(id: string): MarketingEmailTemplate | undefined {
        return this.emailTemplates.find(template => template.id === id);
    }

    // Método para reemplazar variables en el contenido (público para uso en endpoints)
    public replaceVariables(content: string, variables: Record<string, string>): string {
        let result = content;
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value || '');
        });
        return result;
    }

    // Método principal para enviar emails de marketing
    public async sendMarketingEmail(config: MarketingEmailConfig): Promise<MarketingEmailResult> {
        console.log(`📧 Sending marketing email to ${config.prospectIds.length} prospects`);

        try {
            // Hacer llamada al endpoint de envío
            const response = await fetch('/api/clients/prospects/marketing/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    templateId: config.templateId,
                    prospectIds: config.prospectIds,
                    customSubject: config.customSubject,
                    customVariables: config.customVariables
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                const errorData = await response.json();
                return {
                    success: false,
                    sentCount: 0,
                    failedCount: config.prospectIds.length,
                    errors: [errorData.error || 'Error en el envío']
                };
            }
        } catch (error) {
            console.error('Error sending marketing emails:', error);
            return {
                success: false,
                sentCount: 0,
                failedCount: config.prospectIds.length,
                errors: [error instanceof Error ? error.message : 'Error desconocido']
            };
        }
    }

    // Método auxiliar para obtener datos del prospecto
    private async getProspectData(prospectId: string): Promise<any> {
        try {
            // Hacer llamada a la API para obtener datos reales del prospecto
            const response = await fetch('/api/clients/prospects/marketing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prospectIds: [prospectId]
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.prospects.length > 0) {
                    return data.prospects[0];
                }
            }

            console.warn(`No se pudieron obtener datos del prospecto ${prospectId}`);
            return null;
        } catch (error) {
            console.error(`Error obteniendo datos del prospecto ${prospectId}:`, error);
            return null;
        }
    }

    // Método para enviar email via Resend
    public async sendEmailViaResend(config: { to: string[]; subject: string; html: string; text?: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            if (!process.env.RESEND_API_KEY) {
                return {
                    success: false,
                    error: 'RESEND_API_KEY not configured'
                };
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
                const result = await response.json();
                return {
                    success: true,
                    messageId: result.id || `resend-${Date.now()}`
                };
            } else {
                const errorData = await response.text();
                return {
                    success: false,
                    error: `Resend API error: ${response.status} - ${errorData}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Método para enviar email via Zoho SMTP (deprecated - usar sendEmailViaResend)
    public async sendEmailViaSMTP(config: { to: string[]; subject: string; html: string; text?: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.zoho.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            const mailOptions = {
                from: `${this.fromName} <${this.fromEmail}>`,
                to: config.to.join(', '),
                subject: config.subject,
                html: config.html,
                text: config.text
            };

            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Método para crear una nueva plantilla
    public createTemplate(template: Omit<MarketingEmailTemplate, 'id'>): MarketingEmailTemplate {
        const newTemplate: MarketingEmailTemplate = {
            ...template,
            id: `custom-${Date.now()}`
        };
        this.emailTemplates.push(newTemplate);
        return newTemplate;
    }

    // Método para actualizar una plantilla existente
    public updateTemplate(id: string, updates: Partial<MarketingEmailTemplate>): boolean {
        const index = this.emailTemplates.findIndex(template => template.id === id);
        if (index === -1) return false;

        this.emailTemplates[index] = { ...this.emailTemplates[index], ...updates };
        return true;
    }

    // Método para obtener estadísticas de envío
    public async getEmailStats(prospectId?: string): Promise<any> {
        // Aquí implementarías estadísticas de envío desde la base de datos
        return {
            totalSent: 0,
            totalOpened: 0,
            totalClicked: 0,
            conversionRate: 0
        };
    }
}

export const marketingEmailService = new MarketingEmailService();