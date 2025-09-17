import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { emailService } from '@/lib/email/emailService'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email es requerido' },
                { status: 400 }
            )
        }

        // Buscar usuario por email
        const user = await prisma.user.findUnique({
            where: { email }
        })

        // Siempre devolver el mismo mensaje por seguridad (no revelar si el email existe)
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'Si existe una cuenta con ese email, recibirás un enlace de recuperación en los próximos minutos.'
            })
        }

        // Generar token de recuperación único
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

        // Guardar token en la base de datos
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry
            }
        })

        // Generar enlace de recuperación
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

        // Enviar email de recuperación
        const emailSent = await emailService.sendEmail({
            to: [email],
            subject: 'Recupera tu contraseña - Pix ERP',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Recupera tu contraseña</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; text-align: center; }
                        .title { margin: 0; font-size: 24px; }
                        .content { line-height: 1.6; color: #333; }
                        .highlight { background: #f0f8ff; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
                        .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; font-weight: bold; }
                        .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px; }
                        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; border-radius: 4px; margin: 15px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 class="title">🔐 Recupera tu contraseña</h1>
                        </div>
                        <div class="content">
                            <p>Hola <strong>${user.name || 'Usuario'}</strong>,</p>
                            <p>Hemos recibido una solicitud para restablecer tu contraseña en <strong>Pix ERP</strong>.</p>

                            <div class="highlight">
                                <p><strong>Para restablecer tu contraseña, haz clic en el siguiente enlace:</strong></p>
                                <p style="text-align: center; margin: 20px 0;">
                                    <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                                </p>
                                <p><strong>Enlace directo:</strong><br>
                                <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a></p>
                            </div>

                            <div class="warning">
                                <strong>⚠️ Importante:</strong>
                                <ul style="margin: 10px 0; padding-left: 20px;">
                                    <li>Este enlace expirará en 24 horas</li>
                                    <li>Si no solicitaste este cambio, puedes ignorar este email</li>
                                    <li>Por seguridad, no compartas este enlace con nadie</li>
                                </ul>
                            </div>

                            <p>Si tienes problemas con el enlace, copia y pega la URL completa en tu navegador.</p>

                            <p>Si no solicitaste este cambio, puedes ignorar este mensaje. Tu contraseña permanecerá sin cambios.</p>

                            <p>Saludos,<br>
                            <strong>Equipo de Pix ERP</strong></p>
                        </div>
                        <div class="footer">
                            <p><strong>Pix ERP</strong> - Sistema de Gestión para la Construcción</p>
                            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                            <p>Si necesitas ayuda, contacta a nuestro equipo de soporte.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `Hola ${user.name || 'Usuario'},

Hemos recibido una solicitud para restablecer tu contraseña en Pix ERP.

Para restablecer tu contraseña, visita el siguiente enlace:
${resetUrl}

Este enlace expirará en 24 horas.

Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña permanecerá sin cambios.

Saludos,
Equipo de Pix ERP

---
Pix ERP - Sistema de Gestión para la Construcción
Este es un email automático, por favor no respondas a este mensaje.`
        })

        if (!emailSent) {
            console.error('Error sending password reset email')
            return NextResponse.json(
                { success: false, error: 'Error al enviar el email de recuperación' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Si existe una cuenta con ese email, recibirás un enlace de recuperación en los próximos minutos.'
        })

    } catch (error) {
        console.error('Error in forgot password:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
