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
        const sortField = searchParams.get('sortField') || 'deliveryDate'
        const sortDirection = searchParams.get('sortDirection') || 'desc'

        // Build where clause
        const where: any = { organizationId }
        if (status && status !== 'all') {
            where.status = status
        }

        // Build order by
        const orderBy: any = {}
        orderBy[sortField] = sortDirection === 'desc' ? 'desc' : 'asc'

        // Fetch purchase orders with provider and items
        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where,
            include: {
                provider: true,
                items: {
                    include: {
                        material: true,
                        rubro: true
                    }
                },
                createdBy: {
                    select: { name: true, email: true }
                }
            },
            orderBy
        })

        // Prepare data for Excel
        const excelData = purchaseOrders.map(order => ({
            'ID': order.id,
            'Number': order.number,
            'Description': order.description,
            'Provider Name': order.provider?.name || '',
            'Provider Email': order.provider?.email || '',
            'Provider Phone': order.provider?.phone || '',
            'Status': order.status,
            'Delivery Date': order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('es-ES') : '',
            'Total Items': order.items.length,
            'Total Quantity': order.items.reduce((sum, item) => sum + item.quantity, 0),
            'Notes': order.notes,
            'Created By': order.createdBy?.name || '',
            'Created Date': new Date(order.createdAt).toLocaleDateString('es-ES'),
            'Items': JSON.stringify(order.items.map(item => ({
                material: item.material?.name || '',
                quantity: item.quantity,
                unit: item.unit,
                rubro: item.rubro?.name || '',
                notes: item.notes
            })))
        }))

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)

        // Set column widths
        worksheet['!cols'] = [
            { wch: 36 }, // ID
            { wch: 15 }, // Number
            { wch: 30 }, // Description
            { wch: 25 }, // Provider Name
            { wch: 25 }, // Provider Email
            { wch: 15 }, // Provider Phone
            { wch: 12 }, // Status
            { wch: 15 }, // Delivery Date
            { wch: 12 }, // Total Items
            { wch: 15 }, // Total Quantity
            { wch: 15 }, // Total Amount
            { wch: 30 }, // Notes
            { wch: 20 }, // Created By
            { wch: 15 }, // Created Date
            { wch: 50 }  // Items
        ]

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ordenes_Pedido')

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        // Return Excel file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=ordenes_pedido_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })

        return response

    } catch (error: any) {
        console.error('Export error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'
