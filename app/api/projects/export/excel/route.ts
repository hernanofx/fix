import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

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

        // Prepare data for Excel
        const excelData = projects.map(project => ({
            'Nombre': project.name || '',
            'Dirección': project.address || '',
            'Ciudad': project.city || '',
            'Estado': project.status || '',
            'Presupuesto': project.budget ? Number(String(project.budget).replace(/[^0-9.-]+/g, '')) || 0 : 0,
            'Progreso (%)': project.progress || 0,
            'Fecha Inicio': project.startDate ? new Date(project.startDate).toLocaleDateString('es-ES') : '',
            'Fecha Fin': project.endDate ? new Date(project.endDate).toLocaleDateString('es-ES') : '',
            'Descripción': project.description || '',
            'Creado por': project.createdBy?.name || '',
            'Fecha de Creación': project.createdAt ? new Date(project.createdAt).toLocaleDateString('es-ES') : ''
        }))

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(excelData)

        // Set column widths
        const colWidths = [
            { wch: 30 }, // Nombre
            { wch: 40 }, // Dirección
            { wch: 20 }, // Ciudad
            { wch: 15 }, // Estado
            { wch: 15 }, // Presupuesto
            { wch: 12 }, // Progreso
            { wch: 12 }, // Fecha Inicio
            { wch: 12 }, // Fecha Fin
            { wch: 50 }, // Descripción
            { wch: 20 }, // Creado por
            { wch: 15 }  // Fecha de Creación
        ]
        ws['!cols'] = colWidths

        XLSX.utils.book_append_sheet(wb, ws, 'Proyectos')

        // Generate buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // Return Excel file
        const response = new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=proyectos_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting projects to Excel:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
