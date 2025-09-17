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

        let importedCount = 0
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
                if (!rowData.nombre || !rowData.unidad) {
                    continue // Saltar filas sin nombre o unidad
                }

                // Buscar rubro si se especifica
                let rubroId = null
                if (rowData.rubro) {
                    const rubro = await prisma.rubro.findFirst({
                        where: {
                            name: rowData.rubro,
                            organizationId: user.organizationId
                        }
                    })
                    if (rubro) {
                        rubroId = rubro.id
                    }
                }

                // Crear el material
                await prisma.material.create({
                    data: {
                        name: rowData.nombre,
                        description: rowData.descripción || null,
                        code: rowData.código || null,
                        unit: rowData.unidad,
                        minStock: rowData.stockmínimo ? parseFloat(rowData.stockmínimo) : null,
                        maxStock: rowData.stockmáximo ? parseFloat(rowData.stockmáximo) : null,
                        costPrice: rowData.preciocosto ? parseFloat(rowData.preciocosto) : null,
                        salePrice: rowData.precioventa ? parseFloat(rowData.precioventa) : null,
                        status: rowData.estado === 'Inactivo' ? 'INACTIVE' :
                            rowData.estado === 'Archivado' ? 'ARCHIVED' : 'ACTIVE',
                        organizationId: user.organizationId,
                        createdById: user.id,
                        rubroId: rubroId
                    }
                })

                importedCount++
            } catch (error) {
                errors.push(`Fila ${index + 2}: Error procesando - ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        return NextResponse.json({
            success: true,
            importedCount,
            errors: errors.length > 0 ? errors : undefined,
            message: `Se importaron ${importedCount} materiales desde Excel${errors.length > 0 ? ` con ${errors.length} errores` : ''}`
        })

    } catch (error) {
        console.error('Error importing Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
