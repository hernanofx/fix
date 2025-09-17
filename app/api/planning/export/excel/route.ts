import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

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
                    select: { firstName: true, lastName: true, email: true }
                },
                rubro: {
                    select: { name: true, code: true }
                },
                provider: {
                    select: { name: true, email: true }
                },
                client: {
                    select: { name: true, email: true }
                },
                createdBy: {
                    select: { name: true, email: true }
                }
            },
            orderBy
        })

        // Prepare data for Excel
        const excelData = tasks.map(task => ({
            'ID': task.id,
            'Título': task.title,
            'Descripción': task.description || '',
            'Fecha Inicio': task.startDate ? task.startDate.toISOString().split('T')[0] : '',
            'Fecha Fin': task.endDate ? task.endDate.toISOString().split('T')[0] : '',
            'Horas Estimadas': task.estimatedHours || '',
            'Progreso': task.progress || 0,
            'Prioridad': task.priority,
            'Estado': task.status,
            'Proyecto': task.project ? `${task.project.name}${task.project.code ? ` (${task.project.code})` : ''}` : '',
            'Asignado A': task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '',
            'Rubro': task.rubro ? `${task.rubro.name}${task.rubro.code ? ` (${task.rubro.code})` : ''}` : '',
            'Proveedor': task.provider ? task.provider.name : '',
            'Cliente': task.client ? task.client.name : '',
            'Creado Por': task.createdBy ? task.createdBy.name : '',
            'Fecha Creación': task.createdAt.toISOString().split('T')[0],
            'Última Actualización': task.updatedAt.toISOString().split('T')[0]
        }))

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(excelData)

        // Set column widths
        const colWidths = [
            { wch: 36 }, // ID
            { wch: 30 }, // Título
            { wch: 40 }, // Descripción
            { wch: 12 }, // Fecha Inicio
            { wch: 12 }, // Fecha Fin
            { wch: 15 }, // Horas Estimadas
            { wch: 10 }, // Progreso
            { wch: 10 }, // Prioridad
            { wch: 12 }, // Estado
            { wch: 25 }, // Proyecto
            { wch: 25 }, // Asignado A
            { wch: 20 }, // Rubro
            { wch: 25 }, // Proveedor
            { wch: 25 }, // Cliente
            { wch: 20 }, // Creado Por
            { wch: 15 }, // Fecha Creación
            { wch: 18 }  // Última Actualización
        ]
        ws['!cols'] = colWidths

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Tareas_Planning')

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // Return Excel file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=tareas_planning_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })

        return response

    } catch (error: any) {
        console.error('Export Excel error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'
