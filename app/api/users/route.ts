import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { emailService } from '@/lib/email/emailService'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const role = searchParams.get('role')
        const status = searchParams.get('status')

        const where: any = {}
        if (organizationId) where.organizationId = organizationId
        if (role) where.role = role
        if (status) where.status = status

        const users = await prisma.user.findMany({
            where,
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Error fetching users' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            name,
            email,
            password,
            role = 'USER',
            status = 'ACTIVE',
            phone,
            position,
            language = 'es',
            timezone = 'America/Santiago',
            organizationId,
            sendWelcomeEmail = false
        } = body

        // Verificar que la organización existe
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        })

        if (!organization) {
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
            )
        }

        // Verificar que el email no esté en uso
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already in use' },
                { status: 400 }
            )
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                status,
                phone,
                position,
                language,
                timezone,
                organizationId
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        })

        // Verificar si ya existe un empleado con este email en la organización
        const existingEmployee = await prisma.employee.findFirst({
            where: {
                email: email,
                organizationId: organizationId,
            },
        });

        if (!existingEmployee) {
            // Crear empleado automáticamente
            await prisma.employee.create({
                data: {
                    firstName: name.split(' ')[0] || name,
                    lastName: name.split(' ').slice(1).join(' ') || '',
                    email,
                    phone,
                    position,
                    organizationId,
                    createdById: user.id
                }
            })
        }

        // Remover la contraseña de la respuesta
        const { password: _, ...userWithoutPassword } = user

        // Send welcome email if requested (async, non-blocking)
        if (sendWelcomeEmail) {
            console.log(`📧 [DEBUG] sendWelcomeEmail es true, preparando envío de email a ${email}`);

            try {
                const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
                console.log(`📧 [DEBUG] Login URL: ${loginUrl}`);

                // Send email asynchronously without blocking the response
                console.log(`📧 [DEBUG] Programando envío asíncrono con setImmediate...`);
                setImmediate(async () => {
                    console.log(`📧 [DEBUG] Ejecutando setImmediate para email de ${email}`);

                    try {
                        console.log(`📧 [DEBUG] Llamando a emailService.sendEmail...`);
                        const welcomeEmailSent = await emailService.sendEmail({
                            to: [email],
                            subject: `🎉 Bienvenido a Pix ERP - ${organization.name}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
                                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                        <h1 style="margin: 0; font-size: 28px;">¡Bienvenido a Pix ERP!</h1>
                                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Sistema de Gestión para la Construcción</p>
                                    </div>

                                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                        <h2 style="color: #1f2937; margin-top: 0;">Hola ${name},</h2>

                                        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                                            Tu cuenta ha sido creada exitosamente en <strong>${organization.name}</strong>.
                                            Ya puedes acceder al sistema con tus credenciales.
                                        </p>

                                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                                            <h3 style="margin: 0 0 15px 0; color: #1f2937;">Tus Credenciales de Acceso:</h3>
                                            <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> ${email}</p>
                                            <p style="margin: 5px 0; color: #4b5563;"><strong>Contraseña:</strong> ${password}</p>
                                            <p style="margin: 15px 0 0 0; color: #dc2626; font-size: 14px;">
                                                ⚠️ <strong>Importante:</strong> Te recomendamos cambiar tu contraseña después del primer inicio de sesión.
                                            </p>
                                        </div>

                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="${loginUrl}/login"
                                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                                🚀 Acceder al Sistema
                                            </a>
                                        </div>

                                        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                                            <h4 style="margin: 0 0 10px 0; color: #92400e;">¿Necesitas Ayuda?</h4>
                                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                                                Si tienes alguna pregunta o necesitas asistencia, no dudes en contactar al administrador de tu organización.
                                            </p>
                                        </div>

                                        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                                            Este es un email automático, por favor no respondas a esta dirección.<br>
                                            © ${new Date().getFullYear()} Pix ERP - Sistema de Gestión para la Construcción
                                        </p>
                                    </div>
                                </div>
                            `,
                            text: `
                                ¡Bienvenido a Pix ERP!

                                Hola ${name},

                                Tu cuenta ha sido creada exitosamente en ${organization.name}.
                                Ya puedes acceder al sistema con tus credenciales.

                                TUS CREDENCIALES DE ACCESO:
                                Email: ${email}
                                Contraseña: ${password}

                                IMPORTANTE: Te recomendamos cambiar tu contraseña después del primer inicio de sesión.

                                Accede al sistema aquí: ${loginUrl}/login

                                Si tienes alguna pregunta, contacta al administrador de tu organización.

                                © ${new Date().getFullYear()} Pix ERP - Sistema de Gestión para la Construcción
                            `
                        });

                        if (welcomeEmailSent) {
                            console.log(`✅ Welcome email sent successfully to ${email}`);
                        } else {
                            console.error(`❌ Failed to send welcome email to ${email}`);
                        }
                    } catch (emailError) {
                        console.error('❌ Error sending welcome email:', emailError);
                        // Don't fail the user creation if email fails
                    }
                });

                console.log(`📧 [DEBUG] setImmediate programado correctamente para ${email}`);
            } catch (emailError) {
                console.error('❌ Error setting up welcome email:', emailError);
                // Don't fail the user creation if email setup fails
            }
        } else {
            console.log(`📧 [DEBUG] sendWelcomeEmail es false, NO se enviará email a ${email}`);
        }

        return NextResponse.json(userWithoutPassword, { status: 201 })
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Error creating user' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { newPassword, sendNotification = true } = body

        if (!newPassword) {
            return NextResponse.json(
                { error: 'New password is required' },
                { status: 400 }
            )
        }

        // Verificar que el usuario existe
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Actualizar la contraseña
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                updatedAt: new Date()
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        })

        // Enviar notificación por email si se solicita (async, non-blocking)
        if (sendNotification) {
            try {
                const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
                // Send email asynchronously without blocking the response
                setImmediate(async () => {
                    try {
                        const notificationSent = await emailService.sendEmail({
                            to: [existingUser.email],
                            subject: `🔐 Contraseña Actualizada - Pix ERP`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
                                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                        <h1 style="margin: 0; font-size: 28px;">🔐 Contraseña Actualizada</h1>
                                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Tu contraseña ha sido cambiada</p>
                                    </div>

                                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                        <h2 style="color: #1f2937; margin-top: 0;">Hola ${existingUser.name},</h2>

                                        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                                            Tu contraseña ha sido actualizada exitosamente en <strong>${existingUser.organization.name}</strong>.
                                        </p>

                                        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                                            <h3 style="margin: 0 0 15px 0; color: #92400e;">Nueva Contraseña:</h3>
                                            <p style="margin: 5px 0; color: #92400e; font-family: monospace; font-size: 16px; font-weight: bold;">
                                                ${newPassword}
                                            </p>
                                            <p style="margin: 15px 0 0 0; color: #92400e; font-size: 14px;">
                                                ⚠️ <strong>Importante:</strong> Guarda esta contraseña en un lugar seguro y considera cambiarla por una más personal después de iniciar sesión.
                                            </p>
                                        </div>

                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="${loginUrl}/login"
                                               style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                                🔑 Iniciar Sesión
                                            </a>
                                        </div>

                                        <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                                            <h4 style="margin: 0 0 10px 0; color: #1e40af;">¿No solicitaste este cambio?</h4>
                                            <p style="margin: 0; color: #1e40af; font-size: 14px;">
                                                Si no solicitaste este cambio de contraseña, contacta inmediatamente al administrador de tu organización.
                                            </p>
                                        </div>

                                        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                                            Este es un email automático, por favor no respondas a esta dirección.<br>
                                            © ${new Date().getFullYear()} Pix ERP - Sistema de Gestión para la Construcción
                                        </p>
                                    </div>
                                </div>
                            `,
                            text: `
                                CONTRASEÑA ACTUALIZADA - Pix ERP

                                Hola ${existingUser.name},

                                Tu contraseña ha sido actualizada exitosamente en ${existingUser.organization.name}.

                                NUEVA CONTRASEÑA: ${newPassword}

                                IMPORTANTE: Guarda esta contraseña en un lugar seguro y considera cambiarla por una más personal después de iniciar sesión.

                                Inicia sesión aquí: ${loginUrl}/login

                                Si no solicitaste este cambio, contacta inmediatamente al administrador de tu organización.

                                © ${new Date().getFullYear()} Pix ERP - Sistema de Gestión para la Construcción
                            `
                        });

                        if (notificationSent) {
                            console.log(`Password reset notification sent to ${existingUser.email}`);
                        } else {
                            console.error(`Failed to send password reset notification to ${existingUser.email}`);
                        }
                    } catch (emailError) {
                        console.error('Error sending password reset notification:', emailError);
                        // Don't fail the password reset if email fails
                    }
                });
            } catch (emailError) {
                console.error('Error setting up password reset notification:', emailError);
                // Don't fail the password reset if email setup fails
            }
        }        // Remover la contraseña de la respuesta
        const { password: _, ...userWithoutPassword } = updatedUser

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully',
            user: userWithoutPassword
        })
    } catch (error) {
        console.error('Error updating password:', error)
        return NextResponse.json(
            { error: 'Error updating password' },
            { status: 500 }
        )
    }
}
