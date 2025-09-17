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
                if (!rowData.nombre) {
                    continue // Saltar filas sin nombre
                }

                // Preparar datos
                const statusValue = rowData.estado ? (rowData.estado.toLowerCase().includes('activo') ? 'ACTIVE' :
                    rowData.estado.toLowerCase().includes('prospect') ? 'PROSPECT' :
                        rowData.estado.toLowerCase().includes('archivado') ? 'ARCHIVED' : 'INACTIVE') : 'ACTIVE'

                const clientData = {
                    name: rowData.nombre,
                    email: rowData.email || null,
                    phone: rowData.teléfono || rowData.telefono || null,
                    type: rowData.tipo ? (rowData.tipo.toLowerCase().includes('empresa') ? 'Empresa' : 'Particular') : 'Particular',
                    status: statusValue as 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'ARCHIVED',
                    address: rowData.dirección || rowData.direccion || null,
                    city: rowData.ciudad || null,
                    country: rowData.país || rowData.pais || null,
                    contactName: rowData.contacto || rowData.nombrecontacto || null,
                    contactPhone: rowData.teléfonocontacto || rowData.telefonocontacto || null,
                    organizationId: user.organizationId,
                    createdById: user.id
                }

                // Crear cliente
                await prisma.client.create({
                    data: clientData
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
            message: `Se importaron ${imported} clientes${errors.length > 0 ? ` con ${errors.length} errores` : ''}`
        })

    } catch (error) {
        console.error('Error importing clients:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
