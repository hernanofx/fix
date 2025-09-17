import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const categoryFilter = searchParams.get('categoryFilter') || 'all'
        const searchTerm = searchParams.get('searchTerm') || ''
        const sortField = searchParams.get('sortField') || 'date'
        const sortDirection = searchParams.get('sortDirection') || 'desc'

        if (!organizationId) {
            return NextResponse.json({ error: 'Organización requerida' }, { status: 400 })
        }

        // Verificar que el usuario pertenece a la organización
        const user = await prisma.user.findFirst({
            where: {
                id: session.user.id,
                organizationId: organizationId
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no autorizado para esta organización' }, { status: 403 })
        }

        // Obtener todas las transacciones de la organización
        let transactions = await prisma.transaction.findMany({
            where: {
                organizationId: organizationId
            },
            include: {
                cashBox: true,
                bankAccount: true
            },
            orderBy: {
                [sortField]: sortDirection
            }
        })

        // Aplicar filtros
        if (categoryFilter !== 'all') {
            transactions = transactions.filter(transaction => transaction.category === categoryFilter)
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim()
            transactions = transactions.filter(transaction =>
                transaction.description?.toLowerCase().includes(term) ||
                transaction.category?.toLowerCase().includes(term) ||
                transaction.type?.toLowerCase().includes(term) ||
                transaction.cashBox?.name?.toLowerCase().includes(term) ||
                transaction.bankAccount?.name?.toLowerCase().includes(term) ||
                transaction.amount?.toString().includes(term) ||
                (transaction.date && new Date(transaction.date).toLocaleDateString('es-ES').includes(term))
            )
        }

        // Preparar datos para Excel
        const excelData = transactions.map(transaction => ({
            'Fecha': transaction.date ? new Date(transaction.date).toLocaleDateString('es-ES') : '',
            'Descripción': transaction.description,
            'Categoría': transaction.category || '',
            'Tipo': transaction.type === 'INCOME' ? 'Ingreso' : 'Egreso',
            'Monto': transaction.amount,
            'Moneda': transaction.currency,
            'Cuenta': transaction.cashBox?.name || transaction.bankAccount?.name || ''
        }))

        // Crear workbook y worksheet
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(excelData)

        // Configurar anchos de columna
        const columnWidths = [
            { wch: 12 }, // Fecha
            { wch: 40 }, // Descripción
            { wch: 20 }, // Categoría
            { wch: 10 }, // Tipo
            { wch: 15 }, // Monto
            { wch: 10 }, // Moneda
            { wch: 20 }  // Cuenta
        ]
        worksheet['!cols'] = columnWidths

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transacciones')

        // Generar buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        // Retornar archivo
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=transacciones_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })

    } catch (error) {
        console.error('Error exporting to Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'
