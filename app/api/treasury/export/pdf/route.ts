import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import jsPDF from 'jspdf'

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

        if (!organizationId) {
            return NextResponse.json({ error: 'Organización requerida' }, { status: 400 })
        }

        // Verificar que el usuario pertenece a la organización
        const user = await prisma.user.findFirst({
            where: {
                id: session.user.id,
                organizationId: organizationId
            },
            include: {
                organization: true
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no autorizado para esta organización' }, { status: 403 })
        }

        // Obtener las transacciones filtradas
        let whereClause: any = {
            organizationId: organizationId
        }

        // Aplicar filtro de categoría
        if (categoryFilter !== 'all') {
            whereClause.category = categoryFilter
        }

        // Aplicar filtro de búsqueda
        if (searchTerm.trim()) {
            whereClause.OR = [
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { category: { contains: searchTerm, mode: 'insensitive' } },
                { type: { contains: searchTerm, mode: 'insensitive' } },
                { cashBox: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { bankAccount: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { amount: { equals: parseFloat(searchTerm) || undefined } }
            ].filter(Boolean)
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                cashBox: true,
                bankAccount: true
            },
            orderBy: {
                date: 'desc'
            }
        })

        // Crear documento PDF
        const doc = new jsPDF()

        // Configurar fuente y colores
        doc.setFont('helvetica')

        // Título
        doc.setFontSize(20)
        doc.setTextColor(37, 99, 235) // Azul
        doc.text('Reporte de Transacciones - Tesorería', 20, 20)

        // Información del reporte
        doc.setFontSize(12)
        doc.setTextColor(0, 0, 0)
        doc.text(`Organización: ${user.organization?.name || 'N/A'}`, 20, 35)
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 20, 45)
        doc.text(`Total de transacciones: ${transactions.length}`, 20, 55)

        // Filtros aplicados
        let yPosition = 65
        if (categoryFilter !== 'all' || searchTerm.trim()) {
            doc.setFontSize(14)
            doc.setTextColor(37, 99, 235)
            doc.text('Filtros aplicados:', 20, yPosition)
            yPosition += 10

            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)
            if (categoryFilter !== 'all') {
                doc.text(`Categoría: ${categoryFilter}`, 20, yPosition)
                yPosition += 8
            }
            if (searchTerm.trim()) {
                doc.text(`Búsqueda: ${searchTerm}`, 20, yPosition)
                yPosition += 8
            }
            yPosition += 10
        }

        // Preparar datos para la tabla
        const tableData = transactions.map(transaction => [
            transaction.date ? new Date(transaction.date).toLocaleDateString('es-ES') : '',
            transaction.description || '',
            transaction.category || '',
            transaction.type === 'INCOME' ? 'Ingreso' : 'Egreso',
            `$${transaction.amount?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0,00'}`,
            transaction.currency || 'PESOS',
            transaction.cashBox?.name || transaction.bankAccount?.name || ''
        ])

        // Configurar colores para la tabla
        const headStyles = {
            fillColor: [248, 249, 250],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'left'
        }

        const bodyStyles = {
            textColor: [0, 0, 0],
            halign: 'left'
        }

        // Agregar tabla manualmente
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)

        // Encabezados
        const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', 'Moneda', 'Cuenta']
        const colWidths = [25, 40, 25, 20, 25, 20, 30]
        let currentY = yPosition

        // Dibujar encabezados
        doc.setFillColor(248, 249, 250)
        doc.rect(20, currentY - 2, 185, 8, 'F')
        doc.setFont('helvetica', 'bold')
        let currentX = 20
        headers.forEach((header, index) => {
            doc.text(header, currentX + 2, currentY + 3)
            currentX += colWidths[index]
        })
        currentY += 8

        // Dibujar filas de datos
        doc.setFont('helvetica', 'normal')
        let alternateRow = false

        transactions.slice(0, 20).forEach((transaction, index) => { // Limitar a 20 filas para evitar que el PDF sea demasiado grande
            if (currentY > 250) { // Si nos acercamos al final de la página, agregar nueva página
                doc.addPage()
                currentY = 20
            }

            // Color de fondo alterno
            if (alternateRow) {
                doc.setFillColor(248, 249, 250)
                doc.rect(20, currentY - 2, 185, 6, 'F')
            }
            alternateRow = !alternateRow

            const rowData = [
                transaction.date ? new Date(transaction.date).toLocaleDateString('es-ES') : '',
                (transaction.description || '').substring(0, 15), // Limitar longitud
                transaction.category || '',
                transaction.type === 'INCOME' ? 'Ingreso' : 'Egreso',
                `$${transaction.amount?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0,00'}`,
                transaction.currency || 'PESOS',
                (transaction.cashBox?.name || transaction.bankAccount?.name || '').substring(0, 10)
            ]

            currentX = 20
            rowData.forEach((data, colIndex) => {
                doc.text(data, currentX + 2, currentY + 3)
                currentX += colWidths[colIndex]
            })
            currentY += 6
        })

        // Si hay más transacciones, mostrar mensaje
        if (transactions.length > 20) {
            currentY += 5
            doc.setFontSize(8)
            doc.setTextColor(100, 100, 100)
            doc.text(`... y ${transactions.length - 20} transacciones más`, 20, currentY)
        }

        // Calcular resumen
        const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + (t.amount || 0), 0)
        const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + (t.amount || 0), 0)
        const balance = totalIncome - totalExpense

        // Agregar resumen al final de la página
        const pageHeight = doc.internal.pageSize.height
        const summaryY = currentY + 20

        if (summaryY > pageHeight - 40) {
            doc.addPage()
            currentY = 20
        }

        doc.setFontSize(14)
        doc.setTextColor(37, 99, 235)
        doc.text('Resumen', 20, currentY + 20)

        doc.setFontSize(12)
        doc.setTextColor(0, 0, 0)
        doc.text(`Total Ingresos: $${totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 20, currentY + 35)
        doc.text(`Total Egresos: $${totalExpense.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 20, currentY + 45)
        if (balance >= 0) {
            doc.setTextColor(5, 150, 105) // Verde
        } else {
            doc.setTextColor(220, 38, 38) // Rojo
        }
        doc.text(`Balance: $${balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 20, currentY + 55)

        // Generar buffer del PDF
        const pdfOutput = doc.output('arraybuffer')
        const pdfBuffer = Buffer.from(pdfOutput)

        // Devolver el PDF
        const response = new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="transacciones_tesoreria_${new Date().toISOString().split('T')[0]}.pdf"`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting to PDF:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'
