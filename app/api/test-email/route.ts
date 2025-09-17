import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/emailService';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Send test email using the email service
        const success = await emailService.sendEmail({
            to: [email],
            subject: '🧪 Email de Prueba - Pix ERP',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Email de Prueba</h1>
          </div>
          <div style="background: white; border: 1px solid #ddd; border-radius: 0 0 8px 8px; padding: 20px;">
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              ¡Hola! Este es un email de prueba del sistema Pix ERP.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Si estás recibiendo este email, significa que la configuración SMTP está funcionando correctamente.
            </p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>Detalles de la prueba:</strong><br>
              • Fecha y hora: ${new Date().toLocaleString('es-ES')}<br>
              • Destinatario: ${email}<br>
              • Sistema: Pix ERP - Gestión de Construcción
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Este es un email automático generado por el sistema de notificaciones de Pix ERP.
            </p>
          </div>
        </div>
      `,
            text: `Email de Prueba - Pix ERP

¡Hola! Este es un email de prueba del sistema Pix ERP.

Si estás recibiendo este email, significa que la configuración SMTP está funcionando correctamente.

Detalles de la prueba:
• Fecha y hora: ${new Date().toLocaleString('es-ES')}
• Destinatario: ${email}
• Sistema: Pix ERP - Gestión de Construcción

Este es un email automático generado por el sistema de notificaciones de Pix ERP.`
        });

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'Test email sent successfully'
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to send test email' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Error sending test email:', error);
        return NextResponse.json(
            { error: 'Failed to send test email' },
            { status: 500 }
        );
    }
}
