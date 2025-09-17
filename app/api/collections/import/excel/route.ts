import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Obtener usuario con organización
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { organization: true }
        })

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'Usuario sin organización' }, { status: 400 })
        }

        // Obtener el archivo
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 })
        }

        // Leer el archivo Excel
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 2) {
            return NextResponse.json({ error: 'El archivo debe contener al menos una fila de datos' }, { status: 400 })
        }

        const headers = jsonData[0] as string[]
        const rows = jsonData.slice(1) as any[][]

        // Validar headers requeridos
        const requiredHeaders = ['monto', 'descripcion']
        const missingHeaders = requiredHeaders.filter(header =>
            !headers.some(h => h?.toLowerCase().includes(header.toLowerCase()))
        )

        if (missingHeaders.length > 0) {
            return NextResponse.json({
                error: `Faltan las siguientes columnas requeridas: ${missingHeaders.join(', ')}`
            }, { status: 400 })
        }

        const importedCollections = []
        const errors = []

        // Procesar cada fila
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            if (!row || row.length === 0) continue

            try {
                // Crear objeto de fila con headers como keys
                const rowData: any = {}
                headers.forEach((header, index) => {
                    if (header) {
                        rowData[header.toLowerCase()] = row[index]
                    }
                })

                // Validar datos requeridos
                if (!rowData.monto || isNaN(parseFloat(rowData.monto))) {
                    errors.push(`Fila ${i + 2}: Monto inválido`)
                    continue
                }

                // Preparar datos
                const statusValue = rowData.estado ? (rowData.estado.toLowerCase().includes('pagado') || rowData.estado.toLowerCase().includes('paid') ? 'PAID' :
                    rowData.estado.toLowerCase().includes('parcial') || rowData.estado.toLowerCase().includes('partial') ? 'PARTIAL' :
                        rowData.estado.toLowerCase().includes('vencido') || rowData.estado.toLowerCase().includes('overdue') ? 'OVERDUE' : 'PENDING') : 'PENDING'

                const methodValue = rowData.método || rowData.metodo ? (rowData.método || rowData.metodo).toLowerCase().includes('efectivo') ? 'CASH' :
                    (rowData.método || rowData.metodo).toLowerCase().includes('transferencia') ? 'TRANSFER' :
                        (rowData.método || rowData.metodo).toLowerCase().includes('cheque') ? 'CHECK' :
                            (rowData.método || rowData.metodo).toLowerCase().includes('debito') ? 'DEBIT_CARD' : 'CREDIT_CARD' : 'TRANSFER'

                const collectionData = {
                    amount: parseFloat(rowData.monto),
                    description: rowData.descripcion || rowData.descripción || `Cobranza ${i + 1}`,
                    method: methodValue as 'CASH' | 'TRANSFER' | 'CHECK' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'OTHER',
                    status: statusValue as 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED',
                    dueDate: rowData.fecha_vencimiento || rowData['fecha vencimiento'] ? new Date(rowData.fecha_vencimiento || rowData['fecha vencimiento']) : null,
                    paidDate: rowData.fecha_pago || rowData['fecha pago'] ? new Date(rowData.fecha_pago || rowData['fecha pago']) : null,
                    reference: rowData.referencia || null,
                    notes: rowData.notas || null,
                    currency: ((rowData.moneda || 'PESOS').toUpperCase() === 'USD' ? 'USD' : (rowData.moneda || 'PESOS').toUpperCase() === 'EUR' ? 'EUR' : 'PESOS') as 'PESOS' | 'USD' | 'EUR',
                    organizationId: user.organizationId,
                    createdById: user.id
                }

                // Crear la cobranza
                const collection = await prisma.payment.create({
                    data: collectionData,
                    include: {
                        client: { select: { name: true } },
                        project: { select: { name: true } },
                        rubro: { select: { name: true } }
                    }
                })

                importedCollections.push(collection)

            } catch (error) {
                console.error(`Error procesando fila ${i + 2}:`, error)
                errors.push(`Fila ${i + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        return NextResponse.json({
            message: `Se importaron ${importedCollections.length} cobranzas exitosamente`,
            imported: importedCollections.length,
            errors: errors.length > 0 ? errors : undefined,
            data: importedCollections
        })

    } catch (error) {
        console.error('Error importando cobranzas desde Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
