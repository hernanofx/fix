import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'all'
        const sortField = searchParams.get('sortField') || 'name'
        const sortDirection = searchParams.get('sortDirection') || 'asc'
        const organizationId = (session as any).user.organizationId

        if (!organizationId) {
            return NextResponse.json({ error: 'Organización no encontrada' }, { status: 400 })
        }

        // Build where clause
        const where: any = {
            organizationId: organizationId
        }

        if (status !== 'all') {
            const normalizedStatus = status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            if (normalizedStatus.includes('complet')) {
                where.status = { contains: 'complet', mode: 'insensitive' }
            } else if (normalizedStatus.includes('in_progress') || normalizedStatus.includes('en progreso')) {
                where.status = { contains: 'progreso', mode: 'insensitive' }
            } else if (normalizedStatus.includes('plan')) {
                where.status = { contains: 'plan', mode: 'insensitive' }
            }
        }

        // Build order by
        const orderBy: any = {}
        orderBy[sortField] = sortDirection

        const projects = await prisma.project.findMany({
            where,
            orderBy,
            include: {
                createdBy: {
                    select: { name: true, email: true }
                }
            }
        })

        // Create PDF document
        const doc = new jsPDF()

        // Add title
        doc.setFontSize(20)
        doc.text('Lista de Proyectos', 14, 22)

        // Add date
        doc.setFontSize(10)
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 32)

        // Add filters info
        let yPosition = 42
        if (status !== 'all') {
            doc.text(`Filtro: Estado - ${status === 'COMPLETED' ? 'Completado' :
                status === 'IN_PROGRESS' ? 'En Progreso' :
                    status === 'PLANNING' ? 'Planificación' : status}`, 14, yPosition)
            yPosition += 10
        }

        // Prepare table data
        const tableData = projects.map(project => [
            project.name || '',
            project.city || '',
            project.status || '',
            project.budget ? `$${Number(String(project.budget).replace(/[^0-9.-]+/g, '') || 0).toLocaleString('en-US')}` : '$0',
            `${project.progress || 0}%`,
            project.startDate ? new Date(project.startDate).toLocaleDateString('es-ES') : '',
            project.endDate ? new Date(project.endDate).toLocaleDateString('es-ES') : ''
        ])

            // Add table
            ; (doc as any).autoTable({
                head: [['Nombre', 'Ciudad', 'Estado', 'Presupuesto', 'Progreso', 'Fecha Inicio', 'Fecha Fin']],
                body: tableData,
                startY: yPosition + 10,
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [66, 139, 202],
                    textColor: 255,
                    fontSize: 9,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { top: 10 }
            })

        // Add summary
        const pageCount = (doc as any).internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.text(`Página ${i} de ${pageCount}`, (doc as any).internal.pageSize.width - 30, (doc as any).internal.pageSize.height - 10)
        }

        // Generate PDF buffer
        const pdfBuffer = doc.output('arraybuffer')

        // Return PDF file
        const response = new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=proyectos_${new Date().toISOString().split('T')[0]}.pdf`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting projects to PDF:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
