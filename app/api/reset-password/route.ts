import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json()

        if (!token || !password) {
            return NextResponse.json(
                { success: false, error: 'Token y contraseña son requeridos' },
                { status: 400 }
            )
        }

        // Validar que la contraseña tenga al menos 8 caracteres
        if (password.length < 8) {
            return NextResponse.json(
                { success: false, error: 'La contraseña debe tener al menos 8 caracteres' },
                { status: 400 }
            )
        }

        // Buscar usuario por token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gte: new Date() // Token no expirado
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Token inválido o expirado' },
                { status: 400 }
            )
        }

        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 12)

        // Actualizar contraseña y limpiar token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        })

    } catch (error) {
        console.error('Error in reset password:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
