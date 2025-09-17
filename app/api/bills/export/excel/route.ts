import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const status = searchParams.get('status')
        const type = searchParams.get('type')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        // Build where clause
        const where: any = { organizationId }

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

        // Create workbook
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Pix ERP'
        workbook.lastModifiedBy = 'Pix ERP'
        workbook.created = new Date()
        workbook.modified = new Date()

        // Bills sheet
        const billsSheet = workbook.addWorksheet('Facturas')

        // Headers
        billsSheet.columns = [
            { header: 'Número', key: 'number', width: 15 },
            { header: 'Tipo', key: 'type', width: 12 },
            { header: 'Cliente/Proveedor', key: 'entity', width: 25 },
            { header: 'Proyecto', key: 'project', width: 20 },
            { header: 'Monto', key: 'amount', width: 15 },
            { header: 'Moneda', key: 'currency', width: 10 },
            { header: 'Estado', key: 'status', width: 12 },
            { header: 'Fecha Emisión', key: 'issueDate', width: 15 },
            { header: 'Fecha Vencimiento', key: 'dueDate', width: 15 },
            { header: 'Fecha Pago', key: 'paidDate', width: 15 },
            { header: 'Descripción', key: 'description', width: 30 },
            { header: 'Creado por', key: 'createdBy', width: 20 }
        ]

        // Style headers
        billsSheet.getRow(1).font = { bold: true }
        billsSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
        }

        // Add data
        bills.forEach(bill => {
            billsSheet.addRow({
                number: bill.number,
                type: bill.type === 'CLIENT' ? 'Cliente' : 'Proveedor',
                entity: bill.client?.name || bill.provider?.name || 'N/A',
                project: bill.project.name,
                amount: Number(bill.total),
                currency: bill.currency,
                status: getStatusLabel(bill.status),
                issueDate: bill.issueDate ? new Date(bill.issueDate).toLocaleDateString('es-AR') : '',
                dueDate: bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('es-AR') : '',
                paidDate: bill.paidDate ? new Date(bill.paidDate).toLocaleDateString('es-AR') : '',
                description: bill.description || '',
                createdBy: bill.createdBy.name
            })
        })

        // Format currency column
        const amountColumn = billsSheet.getColumn('amount')
        amountColumn.numFmt = '"$"#,##0.00'

        // Auto-fit columns
        billsSheet.columns.forEach(column => {
            if (column.width) {
                column.width = Math.max(column.width, 12)
            }
        })

        // Create buffer
        const buffer = await workbook.xlsx.writeBuffer()

        // Return Excel file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=facturas_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting bills to Excel:', error)
        return NextResponse.json({ error: 'Error exporting bills to Excel' }, { status: 500 })
    }
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
