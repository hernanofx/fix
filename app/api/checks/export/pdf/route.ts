import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId') || session.user.organizationId
        const status = searchParams.get('status')
        const currency = searchParams.get('currency')
        const search = searchParams.get('search')

        // Construir filtros
        const where: any = { organizationId }

        if (status && status !== 'all') {
            where.status = status
        }

        if (currency && currency !== 'all') {
            where.currency = currency
        }

        if (search && search.trim()) {
            where.OR = [
                { checkNumber: { contains: search, mode: 'insensitive' } },
                { issuerName: { contains: search, mode: 'insensitive' } },
                { issuerBank: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { issuedTo: { contains: search, mode: 'insensitive' } },
                { receivedFrom: { contains: search, mode: 'insensitive' } }
            ]
        }

        const checks = await prisma.check.findMany({
            where,
            include: {
                cashBox: { select: { name: true } },
                bankAccount: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Crear PDF
        const doc = new jsPDF()

        // Título
        doc.setFontSize(20)
        doc.text('Lista de Cheques', 14, 22)

        // Fecha de generación
        doc.setFontSize(10)
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 30)

        // Función para traducir estados
        const getStatusText = (status: string) => {
            const statusMap: { [key: string]: string } = {
                'ISSUED': 'Emitido',
                'PENDING': 'Pendiente',
                'CLEARED': 'Cobrado',
                'REJECTED': 'Rechazado',
                'CANCELLED': 'Cancelado'
            }
            return statusMap[status] || status
        }

        // Preparar datos para la tabla
        const tableData = checks.map(check => {
            const recipient = check.issuedTo || check.receivedFrom || ''
            const account = check.cashBox?.name || check.bankAccount?.name || ''

            return [
                check.checkNumber,
                check.issueDate.toLocaleDateString('es-ES'),
                check.dueDate.toLocaleDateString('es-ES'),
                `${check.currency} ${Number(check.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
                check.issuerName,
                check.issuerBank,
                recipient,
                account,
                getStatusText(check.status),
                check.description || ''
            ]
        })

        // Configurar tabla
        doc.autoTable({
            head: [['Número', 'Emisión', 'Vencimiento', 'Monto', 'Emisor', 'Banco', 'Receptor', 'Cuenta', 'Estado', 'Descripción']],
            body: tableData,
            startY: 35,
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
                0: { cellWidth: 20 }, // Número
                1: { cellWidth: 18 }, // Emisión
                2: { cellWidth: 18 }, // Vencimiento
                3: { cellWidth: 20 }, // Monto
                4: { cellWidth: 25 }, // Emisor
                5: { cellWidth: 25 }, // Banco
                6: { cellWidth: 25 }, // Receptor
                7: { cellWidth: 25 }, // Cuenta
                8: { cellWidth: 15 }, // Estado
                9: { cellWidth: 30 }  // Descripción
            }
        })

        // Generar buffer del PDF
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

        // Configurar headers para descarga
        const headers = new Headers()
        headers.set('Content-Type', 'application/pdf')
        headers.set('Content-Disposition', `attachment; filename=cheques_${new Date().toISOString().split('T')[0]}.pdf`)

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers
        })

    } catch (error) {
        console.error('Error exporting checks to PDF:', error)
        return NextResponse.json({ error: 'Error exporting to PDF' }, { status: 500 })
    }
}