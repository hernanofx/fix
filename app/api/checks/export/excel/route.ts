import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

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

        // Crear workbook
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Cheques')

        // Definir columnas
        worksheet.columns = [
            { header: 'Número de Cheque', key: 'checkNumber', width: 15 },
            { header: 'Fecha de Emisión', key: 'issueDate', width: 15 },
            { header: 'Fecha de Vencimiento', key: 'dueDate', width: 18 },
            { header: 'Monto', key: 'amount', width: 12 },
            { header: 'Moneda', key: 'currency', width: 8 },
            { header: 'Emisor', key: 'issuerName', width: 20 },
            { header: 'Banco Emisor', key: 'issuerBank', width: 20 },
            { header: 'Receptor/Origen', key: 'recipient', width: 20 },
            { header: 'Cuenta Asociada', key: 'account', width: 20 },
            { header: 'Estado', key: 'status', width: 12 },
            { header: 'Descripción', key: 'description', width: 30 }
        ]

        // Estilos para el header
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
        }

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

        // Agregar datos
        checks.forEach(check => {
            const recipient = check.issuedTo || check.receivedFrom || ''
            const account = check.cashBox?.name || check.bankAccount?.name || ''

            worksheet.addRow({
                checkNumber: check.checkNumber,
                issueDate: check.issueDate.toLocaleDateString('es-ES'),
                dueDate: check.dueDate.toLocaleDateString('es-ES'),
                amount: check.amount.toNumber(),
                currency: check.currency,
                issuerName: check.issuerName,
                issuerBank: check.issuerBank,
                recipient: recipient,
                account: account,
                status: getStatusText(check.status),
                description: check.description || ''
            })
        })

        // Aplicar formato de moneda a la columna de monto
        const amountColumn = worksheet.getColumn('amount')
        amountColumn.numFmt = '#,##0.00'

        // Generar buffer
        const buffer = await workbook.xlsx.writeBuffer()

        // Configurar headers para descarga
        const headers = new Headers()
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        headers.set('Content-Disposition', `attachment; filename=cheques_${new Date().toISOString().split('T')[0]}.xlsx`)

        return new NextResponse(buffer, {
            status: 200,
            headers
        })

    } catch (error) {
        console.error('Error exporting checks to Excel:', error)
        return NextResponse.json({ error: 'Error exporting to Excel' }, { status: 500 })
    }
}