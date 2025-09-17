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

        // Obtener todos los empleados de la organización
        const employees = await prisma.employee.findMany({
            where: { organizationId: user.organizationId },
            include: {
                createdBy: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Preparar datos para Excel
        const excelData = employees.map(employee => ({
            'ID': employee.id,
            'Nombre': employee.firstName,
            'Apellido': employee.lastName,
            'Email': employee.email || '',
            'Teléfono': employee.phone || '',
            'Puesto': employee.position || '',
            'Departamento': employee.department || '',
            'Salario': employee.salary || '',
            'Fecha de Contratación': employee.hireDate ? employee.hireDate.toLocaleDateString('es-ES') : '',
            'Fecha de Nacimiento': employee.birthDate ? employee.birthDate.toLocaleDateString('es-ES') : '',
            'Dirección': employee.address || '',
            'Contacto de Emergencia': employee.emergencyContact || '',
            'Teléfono de Emergencia': employee.emergencyPhone || '',
            'Estado': employee.status === 'ACTIVE' ? 'Activo' :
                employee.status === 'INACTIVE' ? 'Inactivo' :
                    employee.status === 'TERMINATED' ? 'Terminado' :
                        employee.status === 'ON_LEAVE' ? 'De Licencia' : employee.status,
            'Creado por': employee.createdBy?.name || '',
            'Fecha de Creación': employee.createdAt.toLocaleDateString('es-ES'),
            'Última Actualización': employee.updatedAt.toLocaleDateString('es-ES')
        }))

        // Crear libro de Excel
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(excelData)

        // Configurar ancho de columnas
        const colWidths = [
            { wch: 10 }, // ID
            { wch: 20 }, // Nombre
            { wch: 20 }, // Apellido
            { wch: 30 }, // Email
            { wch: 15 }, // Teléfono
            { wch: 25 }, // Puesto
            { wch: 20 }, // Departamento
            { wch: 12 }, // Salario
            { wch: 18 }, // Fecha de Contratación
            { wch: 18 }, // Fecha de Nacimiento
            { wch: 40 }, // Dirección
            { wch: 25 }, // Contacto de Emergencia
            { wch: 18 }, // Teléfono de Emergencia
            { wch: 12 }, // Estado
            { wch: 20 }, // Creado por
            { wch: 15 }, // Fecha de Creación
            { wch: 15 }  // Última Actualización
        ]
        ws['!cols'] = colWidths

        XLSX.utils.book_append_sheet(wb, ws, 'Empleados')

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // Configurar headers para descarga
        const headers = new Headers()
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        headers.set('Content-Disposition', `attachment; filename="empleados_${user.organization.name}_${new Date().toISOString().split('T')[0]}.xlsx"`)

        return new NextResponse(buffer, {
            status: 200,
            headers
        })

    } catch (error) {
        console.error('Error exportando empleados a Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
