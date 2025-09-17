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

        // Obtener todos los clientes de la organización
        const clients = await prisma.client.findMany({
            where: { organizationId: user.organizationId },
            include: {
                createdBy: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Preparar datos para Excel
        const excelData = clients.map(client => ({
            'ID': client.id,
            'Nombre': client.name,
            'Email': client.email || '',
            'Teléfono': client.phone || '',
            'Estado': client.status === 'ACTIVE' ? 'Activo' :
                client.status === 'INACTIVE' ? 'Inactivo' :
                    client.status === 'PROSPECT' ? 'Prospecto' : 'Archivado',
            'Dirección': client.address || '',
            'Ciudad': client.city || '',
            'País': client.country || '',
            'RUT': client.rut || '',
            'Nombre de Contacto': client.contactName || '',
            'Teléfono de Contacto': client.contactPhone || '',
            'Notas': client.notes || '',
            'Creado por': client.createdBy?.name || '',
            'Fecha de Creación': new Date(client.createdAt).toLocaleDateString('es-ES'),
            'Última Actualización': new Date(client.updatedAt).toLocaleDateString('es-ES')
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
            { wch: 12 }, // Estado
            { wch: 40 }, // Dirección
            { wch: 20 }, // Ciudad
            { wch: 20 }, // País
            { wch: 15 }, // RUT
            { wch: 25 }, // Nombre de Contacto
            { wch: 18 }, // Teléfono de Contacto
            { wch: 40 }, // Notas
            { wch: 20 }, // Creado por
            { wch: 15 }, // Fecha de Creación
            { wch: 15 }  // Última Actualización
        ]
        ws['!cols'] = colWidths

        XLSX.utils.book_append_sheet(wb, ws, 'Clientes')

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // Configurar headers para descarga
        const headers = new Headers()
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        headers.set('Content-Disposition', `attachment; filename="clientes_${user.organization.name}_${new Date().toISOString().split('T')[0]}.xlsx"`)

        return new NextResponse(buffer, {
            status: 200,
            headers
        })

    } catch (error) {
        console.error('Error exportando clientes a Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
