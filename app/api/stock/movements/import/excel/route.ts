import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
        }

        // Verificar que el usuario pertenece a una organización
        const user = await prisma.user.findFirst({
            where: {
                id: session.user.id
            },
            include: {
                organization: true
            }
        })

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'Usuario no autorizado para esta organización' }, { status: 403 })
        }

        // Leer el archivo Excel
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (data.length < 2) {
            return NextResponse.json({ error: 'El archivo debe contener al menos una fila de datos' }, { status: 400 })
        }

        const headers = data[0] as string[]
        const rows = data.slice(1) as any[][]

        let imported = 0
        const errors: string[] = []

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index]
            try {
                // Crear un objeto con los datos de la fila
                const rowData: any = {}
                headers.forEach((header, colIndex) => {
                    rowData[header.toLowerCase().replace(/\s+/g, '')] = row[colIndex]
                })

                // Validar campos requeridos
                if (!rowData.fecha || !rowData.tipo || !rowData.material || !rowData.cantidad) {
                    continue // Saltar filas sin datos requeridos
                }

                // Parsear fecha
                let date: Date
                try {
                    const dateStr = rowData.fecha.toString()
                    if (dateStr.includes('/')) {
                        // Formato DD/MM/YYYY
                        const [day, month, year] = dateStr.split('/')
                        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                    } else {
                        date = new Date(dateStr)
                    }
                    if (isNaN(date.getTime())) {
                        throw new Error('Fecha inválida')
                    }
                } catch (error) {
                    errors.push(`Fila ${index + 2}: Fecha inválida`)
                    continue
                }

                // Buscar material
                const material = await prisma.material.findFirst({
                    where: {
                        name: rowData.material,
                        organizationId: user.organizationId
                    }
                })

                if (!material) {
                    errors.push(`Fila ${index + 2}: Material "${rowData.material}" no encontrado`)
                    continue
                }

                // Determinar tipo de movimiento
                let movementType: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA'
                const tipo = rowData.tipo.toString().toLowerCase()
                if (tipo.includes('entrada')) {
                    movementType = 'ENTRADA'
                } else if (tipo.includes('salida')) {
                    movementType = 'SALIDA'
                } else if (tipo.includes('transferencia')) {
                    movementType = 'TRANSFERENCIA'
                } else {
                    errors.push(`Fila ${index + 2}: Tipo de movimiento inválido`)
                    continue
                }

                // Buscar almacenes según el tipo
                let fromWarehouseId = null
                let toWarehouseId = null

                if (movementType === 'ENTRADA') {
                    if (rowData.destino) {
                        const warehouse = await prisma.warehouse.findFirst({
                            where: {
                                name: rowData.destino,
                                organizationId: user.organizationId
                            }
                        })
                        if (warehouse) {
                            toWarehouseId = warehouse.id
                        }
                    }
                } else if (movementType === 'SALIDA') {
                    if (rowData.origen) {
                        const warehouse = await prisma.warehouse.findFirst({
                            where: {
                                name: rowData.origen,
                                organizationId: user.organizationId
                            }
                        })
                        if (warehouse) {
                            fromWarehouseId = warehouse.id
                        }
                    }
                } else if (movementType === 'TRANSFERENCIA') {
                    if (rowData.origen) {
                        const warehouse = await prisma.warehouse.findFirst({
                            where: {
                                name: rowData.origen,
                                organizationId: user.organizationId
                            }
                        })
                        if (warehouse) {
                            fromWarehouseId = warehouse.id
                        }
                    }
                    if (rowData.destino) {
                        const warehouse = await prisma.warehouse.findFirst({
                            where: {
                                name: rowData.destino,
                                organizationId: user.organizationId
                            }
                        })
                        if (warehouse) {
                            toWarehouseId = warehouse.id
                        }
                    }
                }

                // Crear movimiento
                await prisma.stockMovement.create({
                    data: {
                        type: movementType,
                        quantity: parseFloat(rowData.cantidad),
                        description: rowData.descripción || null,
                        reference: rowData.referencia || null,
                        date: date,
                        materialId: material.id,
                        fromWarehouseId: fromWarehouseId,
                        toWarehouseId: toWarehouseId,
                        organizationId: user.organizationId,
                        createdById: user.id
                    }
                })

                imported++
            } catch (error) {
                console.error('Error procesando fila:', error)
                errors.push(`Fila ${index + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        return NextResponse.json({
            imported,
            errors: errors.length > 0 ? errors : undefined,
            message: `Se importaron ${imported} movimientos${errors.length > 0 ? ` con ${errors.length} errores` : ''}`
        })

    } catch (error) {
        console.error('Error importing movements:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
