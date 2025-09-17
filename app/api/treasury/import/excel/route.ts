import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
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

        // Leer el archivo Excel
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)

        let importedCount = 0
        const errors: string[] = []

        // Procesar cada fila
        for (let index = 0; index < data.length; index++) {
            const row = data[index]
            try {
                const rowData = row as any

                // Validar campos requeridos
                const date = rowData['Fecha'] || rowData['fecha'] || rowData['Date'] || rowData['date']
                const description = rowData['Descripción'] || rowData['descripcion'] || rowData['Description'] || rowData['description']
                const category = rowData['Categoría'] || rowData['categoria'] || rowData['Category'] || rowData['category']
                const type = rowData['Tipo'] || rowData['tipo'] || rowData['Type'] || rowData['type']
                const amount = rowData['Monto'] || rowData['monto'] || rowData['Amount'] || rowData['amount']
                const currency = rowData['Moneda'] || rowData['moneda'] || rowData['Currency'] || rowData['currency'] || 'PESOS'

                if (!date || !description || !amount) {
                    errors.push(`Fila ${index + 2}: Campos requeridos faltantes`)
                    continue
                }

                // Validar tipo
                const validTypes = ['Ingreso', 'Egreso', 'ingreso', 'egreso', 'income', 'expense']
                if (!validTypes.includes(type)) {
                    errors.push(`Fila ${index + 2}: Tipo inválido: ${type}`)
                    continue
                }

                // Validar monto
                const numericAmount = parseFloat(amount.toString().replace(/[^\d.-]/g, ''))
                if (isNaN(numericAmount)) {
                    errors.push(`Fila ${index + 2}: Monto inválido: ${amount}`)
                    continue
                }

                // Validar fecha
                let parsedDate: Date
                try {
                    parsedDate = new Date(date)
                    if (isNaN(parsedDate.getTime())) {
                        throw new Error('Invalid date')
                    }
                } catch {
                    errors.push(`Fila ${index + 2}: Fecha inválida: ${date}`)
                    continue
                }

                // Crear la transacción
                await prisma.transaction.create({
                    data: {
                        date: parsedDate,
                        description: description.toString(),
                        category: category?.toString() || 'Importado',
                        type: type.toLowerCase().includes('ingreso') || type.toLowerCase().includes('income') ? 'INCOME' : 'EXPENSE',
                        amount: Math.abs(numericAmount),
                        currency: currency.toString().toUpperCase(),
                        organizationId: organizationId
                    }
                })

                importedCount++
            } catch (error) {
                errors.push(`Fila ${index + 2}: Error procesando fila - ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        return NextResponse.json({
            success: true,
            importedCount,
            errors: errors.length > 0 ? errors : undefined,
            message: `Se importaron ${importedCount} transacciones${errors.length > 0 ? ` con ${errors.length} errores` : ''}`
        })

    } catch (error) {
        console.error('Error importing Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
