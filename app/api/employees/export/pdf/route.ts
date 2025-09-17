import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'

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

        // Crear documento PDF
        const doc = new jsPDF()

        // Configurar fuente y colores
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(40, 40, 40)

        // Título
        doc.text('Lista de Empleados', 20, 30)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text(`Organización: ${user.organization.name}`, 20, 45)
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 55)
        doc.text(`Total de empleados: ${employees.length}`, 20, 65)

        // Línea separadora
        doc.setDrawColor(200, 200, 200)
        doc.line(20, 70, 190, 70)

        let yPosition = 80
        const pageHeight = doc.internal.pageSize.height
        const marginBottom = 20

        employees.forEach((employee, index) => {
            // Verificar si necesitamos una nueva página
            if (yPosition > pageHeight - marginBottom - 60) {
                doc.addPage()
                yPosition = 30
            }

            // Nombre del empleado
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            doc.text(`${index + 1}. ${employee.firstName} ${employee.lastName}`, 20, yPosition)
            yPosition += 8

            // Información básica
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.text(`Email: ${employee.email || 'No especificado'}`, 25, yPosition)
            yPosition += 6
            doc.text(`Teléfono: ${employee.phone || 'No especificado'}`, 25, yPosition)
            yPosition += 6
            doc.text(`Puesto: ${employee.position || 'No especificado'}`, 25, yPosition)
            yPosition += 6
            doc.text(`Departamento: ${employee.department || 'No especificado'}`, 25, yPosition)
            yPosition += 6

            // Salario si existe
            if (employee.salary) {
                doc.text(`Salario: $${employee.salary.toLocaleString('es-ES')}`, 25, yPosition)
                yPosition += 6
            }

            // Fechas
            if (employee.hireDate) {
                doc.text(`Fecha de Contratación: ${employee.hireDate.toLocaleDateString('es-ES')}`, 25, yPosition)
                yPosition += 6
            }
            if (employee.birthDate) {
                doc.text(`Fecha de Nacimiento: ${employee.birthDate.toLocaleDateString('es-ES')}`, 25, yPosition)
                yPosition += 6
            }

            // Estado
            doc.text(`Estado: ${employee.status === 'ACTIVE' ? 'Activo' :
                employee.status === 'INACTIVE' ? 'Inactivo' :
                    employee.status === 'TERMINATED' ? 'Terminado' :
                        employee.status === 'ON_LEAVE' ? 'De Licencia' : employee.status}`, 25, yPosition)
            yPosition += 6

            // Dirección si existe
            if (employee.address) {
                doc.text(`Dirección: ${employee.address}`, 25, yPosition)
                yPosition += 6
            }

            // Contacto de emergencia si existe
            if (employee.emergencyContact || employee.emergencyPhone) {
                if (employee.emergencyContact) {
                    doc.text(`Contacto Emergencia: ${employee.emergencyContact}`, 25, yPosition)
                    yPosition += 6
                }
                if (employee.emergencyPhone) {
                    doc.text(`Tel. Emergencia: ${employee.emergencyPhone}`, 25, yPosition)
                    yPosition += 6
                }
            }

            // Fecha de creación
            doc.setFontSize(8)
            doc.setTextColor(100, 100, 100)
            doc.text(`Creado: ${employee.createdAt.toLocaleDateString('es-ES')} por ${employee.createdBy?.name || 'Sistema'}`, 25, yPosition)
            yPosition += 10

            // Línea separadora entre empleados
            doc.setDrawColor(240, 240, 240)
            doc.line(20, yPosition, 190, yPosition)
            yPosition += 5

            doc.setTextColor(40, 40, 40)
        })

        // Pie de página
        const totalPages = doc.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(`Página ${i} de ${totalPages}`, 20, pageHeight - 10)
            doc.text('Generado por Pix - Sistema de Gestión', 120, pageHeight - 10)
        }

        // Generar buffer
        const buffer = doc.output('arraybuffer')

        // Configurar headers para descarga
        const headers = new Headers()
        headers.set('Content-Type', 'application/pdf')
        headers.set('Content-Disposition', `attachment; filename="empleados_${user.organization.name}_${new Date().toISOString().split('T')[0]}.pdf"`)

        return new NextResponse(buffer, {
            status: 200,
            headers
        })

    } catch (error) {
        console.error('Error exportando empleados a PDF:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
