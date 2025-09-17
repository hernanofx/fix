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
                if (!rowData.material || !rowData.almacén) {
                    continue // Saltar filas sin material o almacén
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

                // Buscar almacén
                const warehouse = await prisma.warehouse.findFirst({
                    where: {
                        name: rowData.almacén,
                        organizationId: user.organizationId
                    }
                })

                if (!warehouse) {
                    errors.push(`Fila ${index + 2}: Almacén "${rowData.almacén}" no encontrado`)
                    continue
                }

                // Verificar si ya existe un stock para este material y almacén
                const existingStock = await prisma.stock.findFirst({
                    where: {
                        materialId: material.id,
                        warehouseId: warehouse.id
                    }
                })

                const quantity = parseFloat(rowData.cantidad) || 0
                const reserved = parseFloat(rowData.reservado) || 0

                if (existingStock) {
                    // Actualizar stock existente
                    await prisma.stock.update({
                        where: { id: existingStock.id },
                        data: {
                            quantity: quantity,
                            reserved: reserved
                        }
                    })
                } else {
                    // Crear nuevo stock
                    await prisma.stock.create({
                        data: {
                            materialId: material.id,
                            warehouseId: warehouse.id,
                            quantity: quantity,
                            reserved: reserved
                        }
                    })
                }

                imported++
            } catch (error) {
                console.error('Error procesando fila:', error)
                errors.push(`Fila ${index + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        return NextResponse.json({
            imported,
            errors: errors.length > 0 ? errors : undefined,
            message: `Se importaron ${imported} stocks${errors.length > 0 ? ` con ${errors.length} errores` : ''}`
        })

    } catch (error) {
        console.error('Error importing stocks:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
