import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const organizationId = formData.get('organizationId') as string

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
        }

        // Read Excel file
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)

        let importedCount = 0
        const errors: string[] = []

        // Process each row
        for (let index = 0; index < data.length; index++) {
            const row = data[index]
            try {
                const rowData = row as any

                // Validate required fields
                const fecha = rowData.Fecha || rowData.fecha
                const tipo = rowData.Tipo || rowData.tipo
                const entidad = rowData.Entidad || rowData.entidad
                const tipoEntidad = rowData['Tipo Entidad'] || rowData.tipoEntidad || rowData['tipo_entidad']
                const monto = rowData.Monto || rowData.monto
                const moneda = rowData.Moneda || rowData.moneda
                const descripcion = rowData.Descripción || rowData.descripcion || rowData.Descripcion
                const proyecto = rowData.Proyecto || rowData.proyecto
                const periodo = rowData.Período || rowData.periodo || rowData['periodo']

                if (!fecha || !tipo || !entidad || !tipoEntidad || !monto || !moneda) {
                    errors.push(`Fila ${index + 2}: Campos requeridos faltantes`)
                    continue
                }

                // Validate tipo
                const validTypes = ['INCOME', 'EXPENSE', 'Ingreso', 'Egreso']
                if (!validTypes.includes(tipo)) {
                    errors.push(`Fila ${index + 2}: Tipo inválido "${tipo}". Debe ser INCOME, EXPENSE, Ingreso o Egreso`)
                    continue
                }

                // Validate tipoEntidad
                const validEntityTypes = ['CLIENT', 'PROVIDER', 'Cliente', 'Proveedor']
                if (!validEntityTypes.includes(tipoEntidad)) {
                    errors.push(`Fila ${index + 2}: Tipo de entidad inválido "${tipoEntidad}". Debe ser CLIENT, PROVIDER, Cliente o Proveedor`)
                    continue
                }

                // Validate moneda
                const validCurrencies = ['PESOS', 'USD', 'EUR']
                if (!validCurrencies.includes(moneda)) {
                    errors.push(`Fila ${index + 2}: Moneda inválida "${moneda}". Debe ser PESOS, USD o EUR`)
                    continue
                }

                // Convert values
                const normalizedTipo = tipo === 'Ingreso' ? 'INCOME' : tipo === 'Egreso' ? 'EXPENSE' : tipo
                const normalizedTipoEntidad = tipoEntidad === 'Cliente' ? 'CLIENT' : tipoEntidad === 'Proveedor' ? 'PROVIDER' : tipoEntidad
                const parsedMonto = parseFloat(monto.toString().replace(/[$,]/g, ''))
                const parsedFecha = new Date(fecha)

                if (isNaN(parsedMonto)) {
                    errors.push(`Fila ${index + 2}: Monto inválido "${monto}"`)
                    continue
                }

                if (isNaN(parsedFecha.getTime())) {
                    errors.push(`Fila ${index + 2}: Fecha inválida "${fecha}"`)
                    continue
                }

                // Find or create entity
                let entityId = null
                if (normalizedTipoEntidad === 'CLIENT') {
                    const client = await prisma.client.findFirst({
                        where: {
                            name: entidad,
                            organizationId
                        }
                    })
                    if (client) {
                        entityId = client.id
                    } else {
                        const newClient = await prisma.client.create({
                            data: {
                                name: entidad,
                                organizationId,
                                createdById: session.user.id
                            }
                        })
                        entityId = newClient.id
                    }
                } else {
                    const provider = await prisma.provider.findFirst({
                        where: {
                            name: entidad,
                            organizationId
                        }
                    })
                    if (provider) {
                        entityId = provider.id
                    } else {
                        const newProvider = await prisma.provider.create({
                            data: {
                                name: entidad,
                                organizationId,
                                createdById: session.user.id
                            }
                        })
                        entityId = newProvider.id
                    }
                }

                // Find project if specified
                let projectId = null
                if (proyecto && proyecto.trim()) {
                    const project = await prisma.project.findFirst({
                        where: {
                            name: proyecto.trim(),
                            organizationId
                        }
                    })
                    if (project) {
                        projectId = project.id
                    }
                }

                // Create payment term
                const periods = periodo ? parseInt(periodo.toString()) : 1

                await prisma.paymentTerm.create({
                    data: {
                        type: normalizedTipo as 'INCOME' | 'EXPENSE',
                        entityType: normalizedTipoEntidad as 'CLIENT' | 'PROVIDER',
                        clientId: normalizedTipoEntidad === 'CLIENT' ? entityId : null,
                        providerId: normalizedTipoEntidad === 'PROVIDER' ? entityId : null,
                        amount: parsedMonto,
                        currency: moneda as 'PESOS' | 'USD' | 'EUR',
                        startDate: parsedFecha,
                        recurrence: 'MENSUAL',
                        periods: periods,
                        description: descripcion || `Importado desde Excel - ${entidad}`,
                        status: 'ACTIVE',
                        projectId,
                        organizationId
                    }
                })

                importedCount++

            } catch (error) {
                console.error(`Error processing row ${index + 2}:`, error)
                errors.push(`Fila ${index + 2}: Error procesando datos - ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        return NextResponse.json({
            success: true,
            importedCount,
            errors: errors.length > 0 ? errors : undefined,
            message: `Se importaron ${importedCount} registros exitosamente${errors.length > 0 ? `. ${errors.length} errores encontrados.` : ''}`
        })

    } catch (error) {
        console.error('Error importing cashflow from Excel:', error)
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
