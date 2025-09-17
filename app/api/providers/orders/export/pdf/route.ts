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

        // Create PDF document
        const doc = new jsPDF()

        // Add title
        doc.setFontSize(20)
        doc.text('Reporte de Órdenes de Pedido', 20, 20)

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
        const tableData = purchaseOrders.map(order => [
            order.number,
            order.provider?.name || 'Sin proveedor',
            order.status,
            order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('es-ES') : 'No especificada',
            order.items.length.toString(),
            order.items.reduce((sum, item) => sum + item.quantity, 0).toString()
        ])

            // Add table
            ; (doc as any).autoTable({
                head: [['Número', 'Proveedor', 'Estado', 'Entrega', 'Items', 'Cantidad Total']],
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
                }
            })

        // Add summary
        const finalY = (doc as any).lastAutoTable.finalY + 20
        doc.setFontSize(12)
        doc.text('Resumen:', 20, finalY)

        const totalOrders = purchaseOrders.length
        const pendingOrders = purchaseOrders.filter(o => o.status === 'PENDING').length
        const approvedOrders = purchaseOrders.filter(o => o.status === 'APPROVED').length
        const orderedOrders = purchaseOrders.filter(o => o.status === 'ORDERED').length
        const receivedOrders = purchaseOrders.filter(o => o.status === 'RECEIVED').length
        const totalItems = purchaseOrders.reduce((sum, order) => sum + order.items.length, 0)
        const totalQuantity = purchaseOrders.reduce((sum, order) =>
            sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)

        doc.setFontSize(10)
        doc.text(`Total de órdenes: ${totalOrders}`, 20, finalY + 10)
        doc.text(`Órdenes pendientes: ${pendingOrders}`, 20, finalY + 20)
        doc.text(`Órdenes aprobadas: ${approvedOrders}`, 20, finalY + 30)
        doc.text(`Órdenes realizadas: ${orderedOrders}`, 20, finalY + 40)
        doc.text(`Órdenes recibidas: ${receivedOrders}`, 20, finalY + 50)
        doc.text(`Total de items: ${totalItems}`, 20, finalY + 60)
        doc.text(`Cantidad total: ${totalQuantity}`, 20, finalY + 70)

        // Generate buffer
        const buffer = Buffer.from(doc.output('arraybuffer'))

        // Return PDF file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=ordenes_pedido_reporte_${new Date().toISOString().split('T')[0]}.pdf`
            }
        })

        return response

    } catch (error: any) {
        console.error('Export PDF error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'
