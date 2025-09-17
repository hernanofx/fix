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

        // Create PDF document
        const doc = new jsPDF()

        // Add title
        doc.setFontSize(20)
        doc.text('Términos de Pago', 14, 22)

        // Add date
        doc.setFontSize(10)
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 32)

        // Prepare table data
        const tableData = paymentTerms.map(term => [
            term.type === 'INCOME' ? 'Ingreso' : 'Egreso',
            term.entityType === 'CLIENT' ? 'Cliente' : 'Proveedor',
            term.entityType === 'CLIENT' ? term.client?.name : term.provider?.name,
            term.project?.name || '',
            new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: term.currency
            }).format(Number(term.amount)),
            term.periods.toString(),
            new Date(term.startDate).toLocaleDateString('es-ES'),
            term.status === 'ACTIVE' ? 'Activo' : 'Inactivo'
        ])

            // Add table
            ; (doc as any).autoTable({
                head: [['Tipo', 'Tipo Entidad', 'Entidad', 'Proyecto', 'Monto', 'Períodos', 'Fecha Inicio', 'Estado']],
                body: tableData,
                startY: 40,
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontSize: 9,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 15 },
                    6: { cellWidth: 20 },
                    7: { cellWidth: 15 }
                }
            })

        // Generate buffer
        const buf = doc.output('arraybuffer')

        // Return PDF file
        const response = new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=terminos_pago_${new Date().toISOString().split('T')[0]}.pdf`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting payment terms to PDF:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'
