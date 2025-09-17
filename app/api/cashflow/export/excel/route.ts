import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const monthsAhead = parseInt(searchParams.get('monthsAhead') || '12')
        const projectId = searchParams.get('projectId')
        const typeFilter = searchParams.get('typeFilter')
        const entityFilter = searchParams.get('entityFilter')
        const currencyFilter = searchParams.get('currencyFilter')
        const searchTerm = searchParams.get('searchTerm')

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
        }

        // Get payment terms for cashflow calculation
        const paymentTerms = await prisma.paymentTerm.findMany({
            where: {
                organizationId,
                status: 'ACTIVE',
                ...(projectId && projectId !== 'all' && {
                    projectId: projectId
                }),
                ...(typeFilter && typeFilter !== 'all' && {
                    type: typeFilter as 'INCOME' | 'EXPENSE'
                }),
                ...(entityFilter && entityFilter !== 'all' && {
                    entityType: entityFilter as 'CLIENT' | 'PROVIDER'
                })
            },
            include: {
                client: true,
                provider: true,
                project: true
            }
        })

        // Generate cashflow projections
        const cashflow = []
        const startDate = new Date()

        for (const term of paymentTerms) {
            const entityName = term.entityType === 'CLIENT' ? term.client?.name : term.provider?.name
            if (!entityName) continue

            for (let period = 0; period < term.periods; period++) {
                const periodDate = new Date(term.startDate)
                periodDate.setMonth(periodDate.getMonth() + period)

                // Skip if date is in the past or beyond monthsAhead
                const monthsDiff = (periodDate.getFullYear() - startDate.getFullYear()) * 12 + periodDate.getMonth() - startDate.getMonth()
                if (monthsDiff < 0 || monthsDiff >= monthsAhead) continue

                cashflow.push({
                    date: periodDate.toISOString().split('T')[0],
                    amount: term.amount,
                    type: term.type,
                    currency: term.currency,
                    entityName,
                    entityType: term.entityType,
                    projectName: term.project?.name,
                    paymentTermId: term.id,
                    periodNumber: period + 1,
                    description: term.description || `Período ${period + 1} de ${term.periods}`
                })
            }
        }

        // Apply additional filters
        let filteredCashflow = cashflow

        if (currencyFilter && currencyFilter !== 'all') {
            filteredCashflow = filteredCashflow.filter(item => item.currency === currencyFilter)
        }

        if (searchTerm && searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim()
            filteredCashflow = filteredCashflow.filter(item =>
                item.entityName?.toLowerCase().includes(term) ||
                item.description?.toLowerCase().includes(term) ||
                item.projectName?.toLowerCase().includes(term) ||
                item.amount?.toString().includes(term) ||
                (item.date && new Date(item.date).toLocaleDateString('es-ES').includes(term))
            )
        }

        // Sort by date
        filteredCashflow.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Prepare data for Excel
        const excelData = filteredCashflow.map(item => ({
            Fecha: new Date(item.date).toLocaleDateString('es-ES'),
            Tipo: item.type === 'INCOME' ? 'Ingreso' : 'Egreso',
            Entidad: item.entityName,
            'Tipo Entidad': item.entityType === 'CLIENT' ? 'Cliente' : 'Proveedor',
            Monto: item.amount,
            Moneda: item.currency,
            Descripción: item.description,
            Proyecto: item.projectName || '',
            'Período': item.periodNumber
        }))

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(excelData)

        // Set column widths
        const colWidths = [
            { wch: 12 }, // Fecha
            { wch: 10 }, // Tipo
            { wch: 25 }, // Entidad
            { wch: 12 }, // Tipo Entidad
            { wch: 12 }, // Monto
            { wch: 8 },  // Moneda
            { wch: 30 }, // Descripción
            { wch: 20 }, // Proyecto
            { wch: 8 }   // Período
        ]
        ws['!cols'] = colWidths

        XLSX.utils.book_append_sheet(wb, ws, 'Cashflow Proyectado')

        // Generate buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // Return Excel file
        const response = new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=cashflow_proyectado_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting cashflow to Excel:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
