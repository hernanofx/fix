import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Obtener usuario con organización
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { organization: true }
        })

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'Usuario sin organización' }, { status: 400 })
        }

        // Obtener todas las cobranzas de la organización
        const collections = await prisma.payment.findMany({
            where: {
                organizationId: user.organizationId
            },
            include: {
                client: {
                    select: { name: true }
                },
                project: {
                    select: { name: true }
                },
                rubro: {
                    select: { name: true }
                },
                cashBox: {
                    select: { name: true, currency: true }
                },
                bankAccount: {
                    select: { name: true, bankName: true, currency: true }
                },
                createdBy: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Preparar datos para Excel
        const excelData = collections.map(collection => ({
            'ID': collection.id,
            'Monto': collection.amount,
            'Moneda': collection.currency,
            'Descripción': collection.description || '',
            'Método': collection.method === 'CASH' ? 'Efectivo' :
                collection.method === 'TRANSFER' ? 'Transferencia' :
                    collection.method === 'CHECK' ? 'Cheque' :
                        collection.method === 'DEBIT_CARD' ? 'Débito' : 'Crédito',
            'Estado': collection.status === 'PENDING' ? 'Pendiente' :
                collection.status === 'PAID' ? 'Pagado' :
                    collection.status === 'PARTIAL' ? 'Parcial' :
                        collection.status === 'OVERDUE' ? 'Vencido' : 'Cancelado',
            'Fecha Vencimiento': collection.dueDate ? collection.dueDate.toLocaleDateString('es-ES') : '',
            'Fecha Pago': collection.paidDate ? collection.paidDate.toLocaleDateString('es-ES') : '',
            'Referencia': collection.reference || '',
            'Notas': collection.notes || '',
            'Cliente': collection.client?.name || '',
            'Proyecto': collection.project?.name || '',
            'Rubro': collection.rubro?.name || '',
            'Caja': collection.cashBox?.name || '',
            'Cuenta Bancaria': collection.bankAccount?.name || '',
            'Banco': collection.bankAccount?.bankName || '',
            'Creado por': collection.createdBy?.name || '',
            'Fecha de Creación': collection.createdAt.toLocaleDateString('es-ES'),
            'Última Actualización': collection.updatedAt.toLocaleDateString('es-ES')
        }))

        // Crear libro de Excel
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(excelData)

        // Configurar ancho de columnas
        const colWidths = [
            { wch: 10 }, // ID
            { wch: 12 }, // Monto
            { wch: 10 }, // Moneda
            { wch: 40 }, // Descripción
            { wch: 15 }, // Método
            { wch: 12 }, // Estado
            { wch: 15 }, // Fecha Vencimiento
            { wch: 15 }, // Fecha Pago
            { wch: 20 }, // Referencia
            { wch: 30 }, // Notas
            { wch: 25 }, // Cliente
            { wch: 25 }, // Proyecto
            { wch: 20 }, // Rubro
            { wch: 20 }, // Caja
            { wch: 25 }, // Cuenta Bancaria
            { wch: 20 }, // Banco
            { wch: 20 }, // Creado por
            { wch: 15 }, // Fecha de Creación
            { wch: 15 }  // Última Actualización
        ]
        ws['!cols'] = colWidths

        XLSX.utils.book_append_sheet(wb, ws, 'Cobranzas')

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // Configurar headers para descarga
        const headers = new Headers()
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        headers.set('Content-Disposition', `attachment; filename="cobranzas_${user.organization.name}_${new Date().toISOString().split('T')[0]}.xlsx"`)

        return new NextResponse(buffer, {
            status: 200,
            headers
        })

    } catch (error) {
        console.error('Error exportando cobranzas a Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
