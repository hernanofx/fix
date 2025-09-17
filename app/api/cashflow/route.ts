import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || session.user.organizationId
    const monthsAhead = parseInt(searchParams.get('monthsAhead') || '12') // Proyectar 12 meses por defecto
    const projectId = searchParams.get('projectId') // Opcional: filtrar por proyecto

    // Nuevos parámetros de filtrado
    const typeFilter = searchParams.get('typeFilter')
    const entityFilter = searchParams.get('entityFilter')
    const currencyFilter = searchParams.get('currencyFilter')
    const searchTerm = searchParams.get('searchTerm')

    const whereClause: any = { organizationId, status: 'ACTIVE' }
    if (projectId && projectId !== 'all') whereClause.projectId = projectId
    if (typeFilter && typeFilter !== 'all') whereClause.type = typeFilter
    if (entityFilter && entityFilter !== 'all') whereClause.entityType = entityFilter

    if (searchTerm && searchTerm.trim()) {
        whereClause.OR = [
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { client: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { provider: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { project: { name: { contains: searchTerm, mode: 'insensitive' } } }
        ]
    }

    const paymentTerms = await prisma.paymentTerm.findMany({
        where: whereClause,
        include: {
            client: true,
            provider: true,
            project: true
        }
    })

    const cashflow = []
    const now = new Date()

    // Mapa de recurrencias a meses
    const recurrenceMonths = {
        MENSUAL: 1,
        BIMESTRAL: 2,
        TRIMESTRAL: 3,
        CUATRIMESTRAL: 4,
        SEMESTRAL: 6,
        ANUAL: 12
    }

    for (const term of paymentTerms) {
        let currentDate = new Date(term.startDate)
        const monthsToAdd = recurrenceMonths[term.recurrence as keyof typeof recurrenceMonths]

        for (let i = 0; i < term.periods; i++) {
            // Calcular la fecha límite correctamente (X meses desde ahora)
            const limitDate = new Date(now)
            limitDate.setMonth(limitDate.getMonth() + monthsAhead)
            // CORRECCIÓN: Obtener el último día del mes límite correctamente
            limitDate.setDate(new Date(limitDate.getFullYear(), limitDate.getMonth() + 1, 0).getDate())

            // Verificar si la fecha está dentro del rango proyectado
            if (currentDate > limitDate) break

            // Solo incluir fechas futuras o actuales
            if (currentDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
                const item = {
                    id: `${term.id}-${i}`,
                    date: currentDate.toISOString().split('T')[0],
                    amount: term.amount,
                    type: term.type,
                    currency: term.currency,
                    entityName: term.entityType === 'CLIENT' ? term.client?.name : term.provider?.name,
                    entityType: term.entityType,
                    projectName: term.project?.name,
                    paymentTermId: term.id,
                    periodNumber: i + 1,
                    description: term.description
                }

                // Aplicar filtros adicionales en el frontend
                let includeItem = true

                if (currencyFilter && currencyFilter !== 'all' && item.currency !== currencyFilter) {
                    includeItem = false
                }

                if (searchTerm && searchTerm.trim()) {
                    const termLower = searchTerm.toLowerCase().trim()
                    const matchesSearch =
                        item.entityName?.toLowerCase().includes(termLower) ||
                        item.description?.toLowerCase().includes(termLower) ||
                        item.projectName?.toLowerCase().includes(termLower) ||
                        item.amount?.toString().includes(termLower) ||
                        new Date(item.date).toLocaleDateString('es-ES').includes(termLower)

                    if (!matchesSearch) {
                        includeItem = false
                    }
                }

                if (includeItem) {
                    cashflow.push(item)
                }
            }

            // Avanzar a la siguiente fecha según recurrencia
            currentDate.setMonth(currentDate.getMonth() + monthsToAdd)
        }
    }

    // Ordenar por fecha
    cashflow.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // =============================================
    // NUEVO: Agregar Bills pendientes al cashflow
    // =============================================

    // Buscar bills pendientes y parcialmente pagadas para incluir en cashflow
    const pendingBills = await prisma.bill.findMany({
        where: {
            organizationId,
            status: { in: ['PENDING', 'PARTIAL', 'SENT'] },
            dueDate: {
                gte: new Date(), // Solo futuras
                lte: new Date(now.getFullYear(), now.getMonth() + monthsAhead, 0) // Dentro del rango proyectado
            },
            ...(projectId && projectId !== 'all' ? { projectId } : {})
        },
        include: {
            client: { select: { name: true } },
            provider: { select: { name: true } },
            project: { select: { name: true } },
            payments: true // Para calcular monto pendiente
        }
    })

    // Agregar bills al cashflow
    for (const bill of pendingBills) {
        // Calcular monto pendiente
        const totalPaid = bill.payments.reduce((sum: number, payment: any) => sum + payment.amount.toNumber(), 0)
        const pendingAmount = bill.total.toNumber() - totalPaid

        if (pendingAmount > 0) {
            // Aplicar filtros
            let includeItem = true

            if (typeFilter && typeFilter !== 'all') {
                const billType = bill.type === 'CLIENT' ? 'INCOME' : 'EXPENSE'
                if (billType !== typeFilter) includeItem = false
            }

            if (entityFilter && entityFilter !== 'all') {
                const billEntityType = bill.type === 'CLIENT' ? 'CLIENT' : 'PROVIDER'
                if (billEntityType !== entityFilter) includeItem = false
            }

            if (currencyFilter && currencyFilter !== 'all' && bill.currency !== currencyFilter) {
                includeItem = false
            }

            if (searchTerm && searchTerm.trim()) {
                const termLower = searchTerm.toLowerCase().trim()
                const entityName = bill.type === 'CLIENT' ? bill.client?.name : bill.provider?.name
                const matchesSearch =
                    entityName?.toLowerCase().includes(termLower) ||
                    bill.description?.toLowerCase().includes(termLower) ||
                    bill.project?.name?.toLowerCase().includes(termLower) ||
                    bill.number?.toLowerCase().includes(termLower) ||
                    pendingAmount.toString().includes(termLower)

                if (!matchesSearch) includeItem = false
            }

            if (includeItem) {
                cashflow.push({
                    id: `bill-${bill.id}`,
                    date: bill.dueDate.toISOString().split('T')[0],
                    amount: pendingAmount,
                    type: bill.type === 'CLIENT' ? 'INCOME' : 'EXPENSE',
                    currency: bill.currency,
                    entityName: bill.type === 'CLIENT' ? bill.client?.name : bill.provider?.name,
                    entityType: bill.type === 'CLIENT' ? 'CLIENT' : 'PROVIDER',
                    projectName: bill.project?.name,
                    billId: bill.id,
                    billNumber: bill.number,
                    billStatus: bill.status,
                    description: `${bill.type === 'CLIENT' ? 'Cobro' : 'Pago'} - ${bill.description || bill.number}`,
                    source: 'bill' // Para distinguir de paymentTerms
                })
            }
        }
    }

    // =============================================
    // AGREGAR CHEQUES PENDIENTES AL CASHFLOW
    // =============================================

    // Buscar cheques que deben afectar el cashflow (solo PENDING e ISSUED)
    const pendingChecks = await prisma.check.findMany({
        where: {
            organizationId,
            status: {
                in: ['PENDING', 'ISSUED'] // Solo estos estados afectan el cashflow futuro
            },
            dueDate: {
                gte: new Date(), // Solo futuros
                lte: new Date(now.getFullYear(), now.getMonth() + monthsAhead, 0) // Dentro del rango proyectado
            },
            ...(projectId && projectId !== 'all' ? {
                OR: [
                    { cashBox: { id: projectId } },
                    { bankAccount: { id: projectId } }
                ]
            } : {})
        },
        include: {
            cashBox: { select: { name: true } },
            bankAccount: { select: { name: true } }
        }
    })

    // Agregar cheques al cashflow
    for (const check of pendingChecks) {
        // Aplicar filtros
        let includeItem = true

        if (typeFilter && typeFilter !== 'all') {
            // Cheques siempre son ingresos cuando se cobran
            if (typeFilter !== 'INCOME') includeItem = false
        }

        if (entityFilter && entityFilter !== 'all') {
            // Los cheques no tienen entidad específica, pero podemos usar el banco/caja
            const accountName = check.cashBox?.name || check.bankAccount?.name || ''
            if (!accountName.toLowerCase().includes(entityFilter.toLowerCase())) {
                includeItem = false
            }
        }

        if (currencyFilter && currencyFilter !== 'all' && check.currency !== currencyFilter) {
            includeItem = false
        }

        if (searchTerm && searchTerm.trim()) {
            const termLower = searchTerm.toLowerCase().trim()
            const accountName = check.cashBox?.name || check.bankAccount?.name || ''
            const matchesSearch =
                check.checkNumber.toLowerCase().includes(termLower) ||
                check.issuerName.toLowerCase().includes(termLower) ||
                check.issuerBank.toLowerCase().includes(termLower) ||
                accountName.toLowerCase().includes(termLower) ||
                check.amount.toString().includes(termLower)

            if (!matchesSearch) includeItem = false
        }

        if (includeItem) {
            cashflow.push({
                id: `check-${check.id}`,
                date: check.dueDate.toISOString().split('T')[0],
                amount: check.amount.toNumber(),
                type: 'INCOME', // Los cheques pendientes representan ingresos futuros
                currency: check.currency,
                entityName: check.issuerName,
                entityType: 'CHEQUE',
                projectName: null,
                checkId: check.id,
                checkNumber: check.checkNumber,
                description: `Cobro esperado de cheque #${check.checkNumber} - ${check.issuerName}`,
                source: 'check' // Para distinguir de paymentTerms y bills
            })
        }
    }

    // Ordenar cashflow completo por fecha después de agregar cheques
    cashflow.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Agrupar por mes para facilitar visualización
    const groupedByMonth = cashflow.reduce((acc, item) => {
        const monthKey = item.date.substring(0, 7) // YYYY-MM
        if (!acc[monthKey]) {
            acc[monthKey] = {
                month: monthKey,
                totalIncome: 0,
                totalExpense: 0,
                incomeByCurrency: {},
                expenseByCurrency: {},
                items: []
            }
        }

        if (item.type === 'INCOME') {
            acc[monthKey].totalIncome += Number(item.amount)
            acc[monthKey].incomeByCurrency[item.currency] = (acc[monthKey].incomeByCurrency[item.currency] || 0) + Number(item.amount)
        } else {
            acc[monthKey].totalExpense += Number(item.amount)
            acc[monthKey].expenseByCurrency[item.currency] = (acc[monthKey].expenseByCurrency[item.currency] || 0) + Number(item.amount)
        }

        acc[monthKey].items.push(item)
        return acc
    }, {} as Record<string, any>)

    // Calcular totales generales por moneda
    const totalByCurrency = cashflow.reduce((acc, item) => {
        if (!acc[item.currency]) {
            acc[item.currency] = {
                totalIncome: 0,
                totalExpense: 0,
                netCashflow: 0
            }
        }

        if (item.type === 'INCOME') {
            acc[item.currency].totalIncome += Number(item.amount)
        } else {
            acc[item.currency].totalExpense += Number(item.amount)
        }

        acc[item.currency].netCashflow = acc[item.currency].totalIncome - acc[item.currency].totalExpense

        return acc
    }, {} as Record<string, any>)

    const result = {
        summary: Object.values(groupedByMonth),
        details: cashflow,
        totalsByCurrency: totalByCurrency
    }

    return NextResponse.json(result)
}
