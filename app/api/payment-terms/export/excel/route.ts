import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const typeFilter = searchParams.get('typeFilter')
        const entityFilter = searchParams.get('entityFilter')
        const statusFilter = searchParams.get('statusFilter')
        const searchTerm = searchParams.get('searchTerm')

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
        }

        // Build where clause
        const where: any = {
            organizationId
        }

        if (typeFilter && typeFilter !== 'all') {
            where.type = typeFilter
        }

        if (entityFilter && entityFilter !== 'all') {
            where.entityType = entityFilter
        }

        if (statusFilter && statusFilter !== 'all') {
            where.status = statusFilter
        }

        if (searchTerm && searchTerm.trim()) {
            where.OR = [
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { client: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { provider: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { project: { name: { contains: searchTerm, mode: 'insensitive' } } }
            ]
        }

        // Get payment terms
        const paymentTerms = await prisma.paymentTerm.findMany({
            where,
            include: {
                client: true,
                provider: true,
                project: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Prepare data for Excel
        const excelData = paymentTerms.map(term => ({
            'ID': term.id,
            'Tipo': term.type === 'INCOME' ? 'Ingreso' : 'Egreso',
            'Tipo Entidad': term.entityType === 'CLIENT' ? 'Cliente' : 'Proveedor',
            'Entidad': term.entityType === 'CLIENT' ? term.client?.name : term.provider?.name,
            'Proyecto': term.project?.name || '',
            'Monto': term.amount,
            'Moneda': term.currency,
            'Períodos': term.periods,
            'Fecha Inicio': new Date(term.startDate).toLocaleDateString('es-ES'),
            'Descripción': term.description || '',
            'Estado': term.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
            'Fecha Creación': new Date(term.createdAt).toLocaleDateString('es-ES'),
            'Última Actualización': new Date(term.updatedAt).toLocaleDateString('es-ES')
        }))

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(excelData)

        // Set column widths
        const colWidths = [
            { wch: 36 }, // ID
            { wch: 10 }, // Tipo
            { wch: 12 }, // Tipo Entidad
            { wch: 25 }, // Entidad
            { wch: 20 }, // Proyecto
            { wch: 12 }, // Monto
            { wch: 8 },  // Moneda
            { wch: 8 },  // Períodos
            { wch: 12 }, // Fecha Inicio
            { wch: 30 }, // Descripción
            { wch: 8 },  // Estado
            { wch: 12 }, // Fecha Creación
            { wch: 15 }  // Última Actualización
        ]
        ws['!cols'] = colWidths

        XLSX.utils.book_append_sheet(wb, ws, 'Términos de Pago')

        // Generate buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // Return Excel file
        const response = new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=terminos_pago_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting payment terms to Excel:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'
