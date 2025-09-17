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
        const data = XLSX.utils.sheet_to_json(worksheet)

        let importedCount = 0
        const errors: string[] = []

        for (let index = 0; index < data.length; index++) {
            const row = data[index] as any
            try {
                // Mapear los datos del Excel
                const name = row['Nombre'] || row['Name'] || row['Rubro'] || ''
                const code = row['Código'] || row['Code'] || row['Código'] || null
                const typeRaw = row['Tipo'] || row['Type'] || ''
                const description = row['Descripción'] || row['Description'] || row['Desc'] || null
                const statusRaw = row['Estado'] || row['Status'] || row['State'] || 'ACTIVE'
                const color = row['Color'] || row['Colour'] || null

                // Validar datos requeridos
                if (!name.trim()) {
                    errors.push(`Fila ${index + 2}: Nombre requerido`)
                    continue
                }

                // Mapear tipo
                let type: 'PROVIDER' | 'CLIENT'
                const typeLower = typeRaw.toString().toLowerCase()
                if (typeLower.includes('proveedor') || typeLower.includes('provider')) {
                    type = 'PROVIDER'
                } else if (typeLower.includes('cliente') || typeLower.includes('client')) {
                    type = 'CLIENT'
                } else {
                    errors.push(`Fila ${index + 2}: Tipo inválido "${typeRaw}". Use "Proveedor" o "Cliente"`)
                    continue
                }

                // Mapear estado
                let status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' = 'ACTIVE'
                const statusLower = statusRaw.toString().toLowerCase()
                if (statusLower.includes('activo') || statusLower.includes('active')) {
                    status = 'ACTIVE'
                } else if (statusLower.includes('inactivo') || statusLower.includes('inactive')) {
                    status = 'INACTIVE'
                } else if (statusLower.includes('archivado') || statusLower.includes('archived')) {
                    status = 'ARCHIVED'
                }

                // Crear el rubro
                await prisma.rubro.create({
                    data: {
                        name: name.trim(),
                        code: code ? code.toString().trim() : null,
                        type: type,
                        description: description ? description.toString().trim() : null,
                        status: status,
                        color: color ? color.toString().trim() : null,
                        organizationId: user.organizationId,
                        createdById: session.user.id
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
            message: `Se importaron ${importedCount} rubros desde Excel${errors.length > 0 ? ` con ${errors.length} errores` : ''}`
        })

    } catch (error) {
        console.error('Error importing Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
