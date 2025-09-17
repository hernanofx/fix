import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

        // Obtener todos los prospectos de la organización
        const prospects = await prisma.client.findMany({
            where: {
                organizationId: user.organizationId,
                status: 'PROSPECT'
            },
            include: {
                createdBy: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Preparar datos para Excel
        const excelData = prospects.map(prospect => ({
            'ID': prospect.id,
            'Nombre': prospect.name,
            'Email': prospect.email || '',
            'Teléfono': prospect.phone || '',
            'Estado': prospect.prospectStatus === 'A_CONTACTAR' ? 'A Contactar' :
                prospect.prospectStatus === 'CONTACTADO_ESPERANDO' ? 'Contactado - Esperando' :
                    prospect.prospectStatus === 'COTIZANDO' ? 'Cotizando' :
                        prospect.prospectStatus === 'NEGOCIANDO' ? 'Negociando' :
                            prospect.prospectStatus === 'GANADO' ? 'Ganado' :
                                prospect.prospectStatus === 'PERDIDO' ? 'Perdido' :
                                    prospect.prospectStatus === 'SIN_INTERES' ? 'Sin Interés' : 'A Contactar',
            'Dirección': prospect.address || '',
            'Ciudad': prospect.city || '',
            'País': prospect.country || '',
            'RUT': prospect.rut || '',
            'Nombre de Contacto': prospect.contactName || '',
            'Teléfono de Contacto': prospect.contactPhone || '',
            'Proyectos de Interés': prospect.projectInterests?.join(', ') || '',
            'Materiales de Interés': prospect.materialInterests?.join(', ') || '',
            'Rubros de Interés': prospect.rubroInterests?.join(', ') || '',
            'Notas del Prospecto': prospect.prospectNotes || '',
            'Creado por': prospect.createdBy?.name || '',
            'Fecha de Creación': new Date(prospect.createdAt).toLocaleDateString('es-ES'),
            'Última Actualización': new Date(prospect.updatedAt).toLocaleDateString('es-ES')
        }))

        // Crear libro de Excel
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(excelData)

        // Configurar ancho de columnas
        const colWidths = [
            { wch: 10 }, // ID
            { wch: 30 }, // Nombre
            { wch: 30 }, // Email
            { wch: 15 }, // Teléfono
            { wch: 20 }, // Estado
            { wch: 40 }, // Dirección
            { wch: 20 }, // Ciudad
            { wch: 20 }, // País
            { wch: 15 }, // RUT
            { wch: 25 }, // Nombre de Contacto
            { wch: 18 }, // Teléfono de Contacto
            { wch: 30 }, // Proyectos de Interés
            { wch: 30 }, // Materiales de Interés
            { wch: 30 }, // Rubros de Interés
            { wch: 40 }, // Notas del Prospecto
            { wch: 20 }, // Creado por
            { wch: 15 }, // Fecha de Creación
            { wch: 15 }  // Última Actualización
        ]
        ws['!cols'] = colWidths

        XLSX.utils.book_append_sheet(wb, ws, 'Prospectos')

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // Configurar headers para descarga
        const headers = new Headers()
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        headers.set('Content-Disposition', `attachment; filename="prospectos_${user.organization.name}_${new Date().toISOString().split('T')[0]}.xlsx"`)

        return new NextResponse(buffer, {
            status: 200,
            headers
        })

    } catch (error) {
        console.error('Error exportando prospectos a Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}