import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import pdfParse from 'pdf-parse'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const organizationId = formData.get('organizationId') as string

        if (!file || !organizationId) {
            return NextResponse.json({ error: 'Archivo y organización requeridos' }, { status: 400 })
        }

        // Verificar que el usuario pertenece a la organización
        const user = await prisma.user.findFirst({
            where: {
                id: session.user.id,
                organizationId: organizationId
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no autorizado para esta organización' }, { status: 403 })
        }

        // Leer el archivo PDF
        const buffer = await file.arrayBuffer()
        const data = await pdfParse(Buffer.from(buffer))
        const text = data.text

        let importedCount = 0
        const errors: string[] = []

        // Procesar el texto del PDF
        // Esto es un procesamiento básico - en un caso real necesitarías parsing más sofisticado
        const lines = text.split('\n').filter((line: string) => line.trim())

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index]
            try {
                // Intentar extraer información de la línea
                // Este es un ejemplo básico - necesitarías adaptar según el formato del PDF
                const parts = line.split(/\s{2,}/) // Dividir por múltiples espacios

                if (parts.length < 4) continue // Saltar líneas que no tienen suficientes datos

                const [dateStr, description, type, amountStr] = parts

                // Validar y parsear fecha
                let date: Date
                try {
                    date = new Date(dateStr)
                    if (isNaN(date.getTime())) {
                        throw new Error('Invalid date')
                    }
                } catch {
                    continue // Saltar líneas con fechas inválidas
                }

                // Validar tipo
                const validTypes = ['Ingreso', 'Egreso', 'ingreso', 'egreso', 'income', 'expense']
                if (!validTypes.some(validType => type.toLowerCase().includes(validType.toLowerCase()))) {
                    continue
                }

                // Validar y parsear monto
                const amount = parseFloat(amountStr.replace(/[^\d.,]/g, '').replace(',', '.'))
                if (isNaN(amount)) {
                    continue
                }

                // Crear la transacción
                await prisma.transaction.create({
                    data: {
                        date: date,
                        description: description,
                        category: 'Importado desde PDF',
                        type: type.toLowerCase().includes('ingreso') || type.toLowerCase().includes('income') ? 'INCOME' : 'EXPENSE',
                        amount: Math.abs(amount),
                        currency: 'PESOS', // Default para PDF
                        organizationId: organizationId
                    }
                })

                importedCount++
            } catch (error) {
                errors.push(`Línea ${index + 1}: Error procesando - ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        return NextResponse.json({
            success: true,
            importedCount,
            errors: errors.length > 0 ? errors : undefined,
            message: `Se importaron ${importedCount} transacciones desde PDF${errors.length > 0 ? ` con ${errors.length} errores` : ''}`
        })

    } catch (error) {
        console.error('Error importing PDF:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
