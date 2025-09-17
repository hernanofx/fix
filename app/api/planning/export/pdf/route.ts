import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const projectId = searchParams.get('projectId')
        const assigneeId = searchParams.get('assigneeId')
        const sortField = searchParams.get('sortField') || 'startDate'
        const sortDirection = searchParams.get('sortDirection') || 'desc'

        // Build where clause
        const where: any = { organizationId }
        if (status && status !== 'all') {
            where.status = status
        }
        if (projectId && projectId !== 'all') {
            where.projectId = projectId
        }
        if (assigneeId && assigneeId !== 'all') {
            where.assigneeId = assigneeId
        }

        // Build order by
        const orderBy: any = {}
        orderBy[sortField] = sortDirection === 'desc' ? 'desc' : 'asc'

        // Fetch tasks with relations
        const tasks = await prisma.task.findMany({
            where,
            include: {
                project: {
                    select: { name: true, code: true }
                },
                assignee: {
                    select: { firstName: true, lastName: true }
                },
                rubro: {
                    select: { name: true }
                },
                provider: {
                    select: { name: true }
                },
                client: {
                    select: { name: true }
                }
            },
            orderBy
        })

        // Create PDF document
        const doc = new jsPDF()

        // Add title
        doc.setFontSize(20)
        doc.text('Reporte de Tareas - Planning', 20, 20)

        // Add date
        doc.setFontSize(10)
        doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 20, 30)

        // Add filters info
        let yPosition = 40
        if (status && status !== 'all') {
            doc.text(`Estado: ${status}`, 20, yPosition)
            yPosition += 10
        }

        // Prepare table data
        const tableData = tasks.map(task => [
            task.title,
            task.status,
            task.priority,
            task.startDate ? new Date(task.startDate).toLocaleDateString('es-ES') : 'No definida',
            task.endDate ? new Date(task.endDate).toLocaleDateString('es-ES') : 'No definida',
            task.progress + '%',
            task.project?.name || 'Sin proyecto',
            task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Sin asignar'
        ])

            // Add table
            ; (doc as any).autoTable({
                head: [['Título', 'Estado', 'Prioridad', 'Inicio', 'Fin', 'Progreso', 'Proyecto', 'Asignado']],
                body: tableData,
                startY: yPosition + 10,
                styles: {
                    fontSize: 7,
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [66, 139, 202],
                    textColor: 255,
                    fontSize: 8,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                columnStyles: {
                    0: { cellWidth: 40 }, // Título
                    1: { cellWidth: 20 }, // Estado
                    2: { cellWidth: 20 }, // Prioridad
                    3: { cellWidth: 20 }, // Inicio
                    4: { cellWidth: 20 }, // Fin
                    5: { cellWidth: 15 }, // Progreso
                    6: { cellWidth: 30 }, // Proyecto
                    7: { cellWidth: 25 }  // Asignado
                }
            })

        // Add summary
        const finalY = (doc as any).lastAutoTable.finalY + 20
        doc.setFontSize(12)
        doc.text('Resumen:', 20, finalY)

        const totalTasks = tasks.length
        const pendingTasks = tasks.filter(t => t.status === 'PENDING').length
        const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
        const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
        const cancelledTasks = tasks.filter(t => t.status === 'CANCELLED').length
        const avgProgress = tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length) : 0
        const highPriorityTasks = tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length

        doc.setFontSize(10)
        doc.text(`Total de tareas: ${totalTasks}`, 20, finalY + 10)
        doc.text(`Tareas pendientes: ${pendingTasks}`, 20, finalY + 20)
        doc.text(`Tareas en progreso: ${inProgressTasks}`, 20, finalY + 30)
        doc.text(`Tareas completadas: ${completedTasks}`, 20, finalY + 40)
        doc.text(`Tareas canceladas: ${cancelledTasks}`, 20, finalY + 50)
        doc.text(`Progreso promedio: ${avgProgress}%`, 20, finalY + 60)
        doc.text(`Tareas de alta prioridad: ${highPriorityTasks}`, 20, finalY + 70)

        // Generate buffer
        const buffer = Buffer.from(doc.output('arraybuffer'))

        // Return PDF file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=tareas_planning_reporte_${new Date().toISOString().split('T')[0]}.pdf`
            }
        })

        return response

    } catch (error: any) {
        console.error('Export PDF error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'
