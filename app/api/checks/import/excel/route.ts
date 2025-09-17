import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'
import { Decimal } from '@prisma/client/runtime/library'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validar tipo de archivo
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            return NextResponse.json({ error: 'Invalid file type. Only .xlsx and .xls files are allowed' }, { status: 400 })
        }

        // Leer el archivo Excel
        const buffer = await file.arrayBuffer()
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)

        const worksheet = workbook.getWorksheet(1)
        if (!worksheet) {
            return NextResponse.json({ error: 'Invalid Excel file structure' }, { status: 400 })
        }

        const rows = worksheet.getRows(2, worksheet.rowCount - 1) // Saltar header
        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: 'No data found in Excel file' }, { status: 400 })
        }

        const checksToCreate = []
        const errors = []
        let successCount = 0

        // Procesar cada fila
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            if (!row) continue

            try {
                const rowNumber = i + 3 // +3 porque empezamos desde fila 3 (header + 1-indexed)

                // Extraer valores de las celdas
                const checkNumber = row.getCell(1).value?.toString()?.trim()
                const issueDateStr = row.getCell(2).value?.toString()?.trim()
                const dueDateStr = row.getCell(3).value?.toString()?.trim()
                const amountStr = row.getCell(4).value?.toString()?.trim()
                const currency = row.getCell(5).value?.toString()?.trim()
                const issuerName = row.getCell(6).value?.toString()?.trim()
                const issuerBank = row.getCell(7).value?.toString()?.trim()
                const issuedTo = row.getCell(8).value?.toString()?.trim()
                const receivedFrom = row.getCell(9).value?.toString()?.trim()
                const description = row.getCell(10).value?.toString()?.trim()
                const status = row.getCell(11).value?.toString()?.trim()

                // Validaciones básicas
                if (!checkNumber) {
                    errors.push(`Fila ${rowNumber}: Número de cheque requerido`)
                    continue
                }

                if (!issueDateStr) {
                    errors.push(`Fila ${rowNumber}: Fecha de emisión requerida`)
                    continue
                }

                if (!dueDateStr) {
                    errors.push(`Fila ${rowNumber}: Fecha de vencimiento requerida`)
                    continue
                }

                if (!amountStr) {
                    errors.push(`Fila ${rowNumber}: Monto requerido`)
                    continue
                }

                if (!currency) {
                    errors.push(`Fila ${rowNumber}: Moneda requerida`)
                    continue
                }

                if (!issuerName) {
                    errors.push(`Fila ${rowNumber}: Nombre del emisor requerido`)
                    continue
                }

                if (!issuerBank) {
                    errors.push(`Fila ${rowNumber}: Banco emisor requerido`)
                    continue
                }

                // Parsear fechas
                let issueDate: Date
                let dueDate: Date

                try {
                    // Intentar diferentes formatos de fecha
                    if (issueDateStr.includes('/')) {
                        const [day, month, year] = issueDateStr.split('/')
                        issueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                    } else if (issueDateStr.includes('-')) {
                        issueDate = new Date(issueDateStr)
                    } else {
                        throw new Error('Invalid date format')
                    }

                    if (dueDateStr.includes('/')) {
                        const [day, month, year] = dueDateStr.split('/')
                        dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                    } else if (dueDateStr.includes('-')) {
                        dueDate = new Date(dueDateStr)
                    } else {
                        throw new Error('Invalid date format')
                    }

                    if (isNaN(issueDate.getTime()) || isNaN(dueDate.getTime())) {
                        throw new Error('Invalid date')
                    }
                } catch (error) {
                    errors.push(`Fila ${rowNumber}: Formato de fecha inválido. Use DD/MM/YYYY o YYYY-MM-DD`)
                    continue
                }

                // Parsear monto
                let amount: number
                try {
                    // Remover símbolos de moneda y espacios
                    const cleanAmount = amountStr.replace(/[$,\s]/g, '')
                    amount = parseFloat(cleanAmount)
                    if (isNaN(amount) || amount <= 0) {
                        throw new Error('Invalid amount')
                    }
                } catch (error) {
                    errors.push(`Fila ${rowNumber}: Monto inválido. Use un número positivo`)
                    continue
                }

                // Validar moneda
                if (!['PESOS', 'USD', 'EUR'].includes(currency.toUpperCase())) {
                    errors.push(`Fila ${rowNumber}: Moneda inválida. Use PESOS, USD o EUR`)
                    continue
                }

                // Validar estado
                const validStatuses = ['ISSUED', 'PENDING', 'CLEARED', 'REJECTED', 'CANCELLED']
                const normalizedStatus = status?.toUpperCase() || 'ISSUED'
                if (!validStatuses.includes(normalizedStatus)) {
                    errors.push(`Fila ${rowNumber}: Estado inválido. Use: ${validStatuses.join(', ')}`)
                    continue
                }

                // Preparar datos del cheque
                const checkData = {
                    checkNumber,
                    issueDate,
                    dueDate,
                    amount: new Decimal(amount),
                    currency: currency.toUpperCase() as 'PESOS' | 'USD' | 'EUR',
                    issuerName,
                    issuerBank,
                    issuedTo: issuedTo || null,
                    receivedFrom: receivedFrom || null,
                    description: description || null,
                    status: normalizedStatus as 'ISSUED' | 'PENDING' | 'CLEARED' | 'REJECTED' | 'CANCELLED',
                    organizationId: session.user.organizationId
                }

                checksToCreate.push(checkData)

            } catch (error) {
                errors.push(`Fila ${i + 3}: Error procesando fila - ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        // Crear cheques en la base de datos
        if (checksToCreate.length > 0) {
            try {
                await prisma.check.createMany({
                    data: checksToCreate,
                    skipDuplicates: true
                })
                successCount = checksToCreate.length
            } catch (error) {
                console.error('Error creating checks:', error)
                errors.push('Error al guardar los cheques en la base de datos')
            }
        }

        return NextResponse.json({
            success: true,
            message: `Importación completada. ${successCount} cheques importados exitosamente.`,
            imported: successCount,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (error) {
        console.error('Error importing checks:', error)
        return NextResponse.json({
            error: 'Error importing checks',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}