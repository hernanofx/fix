import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const dynamic = 'force-dynamic'

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const billId = searchParams.get('billId')
        const status = searchParams.get('status')
        const type = searchParams.get('type')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        // Build where clause
        const where: any = { organizationId }

        if (billId) {
            where.id = billId
        }

        if (status) {
            where.status = status
        }

        if (type) {
            where.type = type
        }

        if (startDate || endDate) {
            where.issueDate = {}
            if (startDate) where.issueDate.gte = new Date(startDate)
            if (endDate) where.issueDate.lte = new Date(endDate)
        }

        const bills = await prisma.bill.findMany({
            where,
            include: {
                createdBy: { select: { name: true, email: true } },
                project: { select: { name: true } },
                client: { select: { name: true } },
                provider: { select: { name: true } },
                billRubros: {
                    include: {
                        rubro: { select: { name: true, color: true } }
                    }
                },
                payments: {
                    include: {
                        cashBox: { select: { name: true } },
                        bankAccount: { select: { name: true } }
                    }
                },
                stockMovements: {
                    include: {
                        material: { select: { name: true, unit: true } },
                        warehouse: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Create PDF
        const doc = new jsPDF()

        // Title
        doc.setFontSize(20)
        doc.text('Facturas', 14, 22)

        // Date
        doc.setFontSize(10)
        doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 30)

        // Prepare table data
        const tableData = bills.map(bill => [
            bill.number,
            bill.type === 'CLIENT' ? 'Cliente' : 'Proveedor',
            bill.client?.name || bill.provider?.name || 'N/A',
            bill.project.name,
            formatCurrency(Number(bill.total), bill.currency),
            getStatusLabel(bill.status),
            bill.issueDate ? new Date(bill.issueDate).toLocaleDateString('es-AR') : '',
            bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('es-AR') : ''
        ])

        // Add table
        doc.autoTable({
            head: [['Número', 'Tipo', 'Cliente/Proveedor', 'Proyecto', 'Monto', 'Estado', 'Emisión', 'Vencimiento']],
            body: tableData,
            startY: 35,
            styles: {
                fontSize: 8,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        })

        // Summary section
        const finalY = (doc as any).lastAutoTable.finalY || 35
        doc.setFontSize(12)
        doc.text('Resumen', 14, finalY + 20)

        const totalAmount = bills.reduce((sum, bill) => sum + Number(bill.total), 0)
        const paidAmount = bills
            .filter(bill => bill.status === 'PAID')
            .reduce((sum, bill) => sum + Number(bill.total), 0)
        const pendingAmount = bills
            .filter(bill => bill.status === 'PENDING' || bill.status === 'PARTIAL')
            .reduce((sum, bill) => sum + Number(bill.total), 0)

        doc.setFontSize(10)
        doc.text(`Total de facturas: ${bills.length}`, 14, finalY + 30)
        doc.text(`Monto total: ${formatCurrency(totalAmount, 'PESOS')}`, 14, finalY + 37)
        doc.text(`Monto pagado: ${formatCurrency(paidAmount, 'PESOS')}`, 14, finalY + 44)
        doc.text(`Monto pendiente: ${formatCurrency(pendingAmount, 'PESOS')}`, 14, finalY + 51)

        // Create buffer
        const buffer = Buffer.from(doc.output('arraybuffer'))

        // Return PDF file
        const filename = billId
            ? `factura_${bills[0]?.number || 'detalle'}_${new Date().toISOString().split('T')[0]}.pdf`
            : `facturas_${new Date().toISOString().split('T')[0]}.pdf`

        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=${filename}`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting bills to PDF:', error)
        return NextResponse.json({ error: 'Error exporting bills to PDF' }, { status: 500 })
    }
}

function formatCurrency(amount: number, currency: string = 'PESOS'): string {
    const symbols: Record<string, string> = {
        'PESOS': '$',
        'USD': 'US$',
        'EUR': '€'
    }
    const symbol = symbols[currency] || '$'
    return `${symbol}${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'DRAFT': 'Borrador',
        'PENDING': 'Pendiente',
        'SENT': 'Enviada',
        'PARTIAL': 'Pago Parcial',
        'PAID': 'Pagada',
        'OVERDUE': 'Vencida',
        'CANCELLED': 'Cancelada'
    }
    return labels[status] || status
}
