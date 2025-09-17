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
                const prospectStatusValue = rowData.estado ? (
                    rowData.estado.toLowerCase().includes('contactar') ? 'A_CONTACTAR' :
                        rowData.estado.toLowerCase().includes('contactado') ? 'CONTACTADO_ESPERANDO' :
                            rowData.estado.toLowerCase().includes('cotizando') ? 'COTIZANDO' :
                                rowData.estado.toLowerCase().includes('negociando') ? 'NEGOCIANDO' :
                                    rowData.estado.toLowerCase().includes('ganado') ? 'GANADO' :
                                        rowData.estado.toLowerCase().includes('perdido') ? 'PERDIDO' :
                                            rowData.estado.toLowerCase().includes('sin interés') ? 'SIN_INTERES' : 'A_CONTACTAR'
                ) : 'A_CONTACTAR'

                // Procesar arrays de intereses
                const projectInterests = rowData['proyectosdeinterés'] ?
                    rowData['proyectosdeinterés'].split(',').map((item: string) => item.trim()).filter((item: string) => item) : []
                const materialInterests = rowData['materialesdeinterés'] ?
                    rowData['materialesdeinterés'].split(',').map((item: string) => item.trim()).filter((item: string) => item) : []
                const rubroInterests = rowData['rubrosdeinterés'] ?
                    rowData['rubrosdeinterés'].split(',').map((item: string) => item.trim()).filter((item: string) => item) : []

                const prospectData = {
                    name: rowData.nombre,
                    email: rowData.email || null,
                    phone: rowData.teléfono || rowData.telefono || null,
                    status: 'PROSPECT' as const,
                    prospectStatus: prospectStatusValue as 'A_CONTACTAR' | 'CONTACTADO_ESPERANDO' | 'COTIZANDO' | 'NEGOCIANDO' | 'GANADO' | 'PERDIDO' | 'SIN_INTERES',
                    address: rowData.dirección || rowData.direccion || null,
                    city: rowData.ciudad || null,
                    country: rowData.país || rowData.pais || 'Argentina',
                    rut: rowData.rut || null,
                    contactName: rowData['nombredecontacto'] || null,
                    contactPhone: rowData['teléfonodecontacto'] || rowData['telefonodecontacto'] || null,
                    projectInterests: projectInterests,
                    materialInterests: materialInterests,
                    rubroInterests: rubroInterests,
                    prospectNotes: rowData['notasdelprospecto'] || null,
                    organizationId: user.organizationId,
                    createdById: user.id
                }

                // Crear prospecto
                await prisma.client.create({
                    data: prospectData
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
            message: `Se importaron ${imported} prospectos${errors.length > 0 ? ` con ${errors.length} errores` : ''}`
        })

    } catch (error) {
        console.error('Error importing prospects:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}