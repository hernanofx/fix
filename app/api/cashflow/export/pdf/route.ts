import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

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

        // Create PDF
        const doc = new jsPDF()

        // Title
        doc.setFontSize(20)
        doc.text('Cashflow Proyectado', 14, 22)

        // Filters info
        doc.setFontSize(10)
        let yPosition = 35
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, yPosition)
        yPosition += 5
        doc.text(`Período proyectado: ${monthsAhead} meses`, 14, yPosition)
        yPosition += 5

        if (typeFilter && typeFilter !== 'all') {
            doc.text(`Tipo: ${typeFilter === 'INCOME' ? 'Ingreso' : 'Egreso'}`, 14, yPosition)
            yPosition += 5
        }
        if (entityFilter && entityFilter !== 'all') {
            doc.text(`Entidad: ${entityFilter === 'CLIENT' ? 'Cliente' : 'Proveedor'}`, 14, yPosition)
            yPosition += 5
        }
        if (currencyFilter && currencyFilter !== 'all') {
            doc.text(`Moneda: ${currencyFilter}`, 14, yPosition)
            yPosition += 5
        }
        if (searchTerm && searchTerm.trim()) {
            doc.text(`Búsqueda: "${searchTerm}"`, 14, yPosition)
            yPosition += 5
        }

        // Prepare table data
        const tableData = filteredCashflow.map(item => [
            new Date(item.date).toLocaleDateString('es-ES'),
            item.type === 'INCOME' ? 'Ingreso' : 'Egreso',
            item.entityName,
            item.entityType === 'CLIENT' ? 'Cliente' : 'Proveedor',
            `$${Number(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            item.currency,
            item.description,
            item.projectName || '',
            item.periodNumber.toString()
        ])

            // Add table
            ; (doc as any).autoTable({
                head: [['Fecha', 'Tipo', 'Entidad', 'Tipo Entidad', 'Monto', 'Moneda', 'Descripción', 'Proyecto', 'Período']],
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
                columnStyles: {
                    0: { cellWidth: 20 }, // Fecha
                    1: { cellWidth: 15 }, // Tipo
                    2: { cellWidth: 30 }, // Entidad
                    3: { cellWidth: 18 }, // Tipo Entidad
                    4: { cellWidth: 20 }, // Monto
                    5: { cellWidth: 12 }, // Moneda
                    6: { cellWidth: 40 }, // Descripción
                    7: { cellWidth: 25 }, // Proyecto
                    8: { cellWidth: 12 }  // Período
                }
            })

        // Generate buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

        // Return PDF file
        const response = new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=cashflow_proyectado_${new Date().toISOString().split('T')[0]}.pdf`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting cashflow to PDF:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
