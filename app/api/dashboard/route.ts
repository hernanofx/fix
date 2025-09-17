import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export const dynamic = 'force-dynamic'

// Función auxiliar para determinar el origen de la transacción
const getTransactionOrigin = (transaction: any) => {
    // Verificar por reference y categoría/tipo para mayor precisión
    if (transaction.reference?.startsWith('PAY-')) {
        // Distinguir entre collections y payrolls por categoría y tipo
        if (transaction.category === 'Cobranza' && transaction.type === 'INCOME') {
            return 'Clientes'
        }
        if (transaction.category === 'Nómina' && transaction.type === 'EXPENSE') {
            return 'Empleados'
        }
    }

    // Verificar otros tipos de reference
    if (transaction.reference) {
        if (transaction.reference.startsWith('BILL-PAY-')) return 'Facturas'
        if (transaction.reference.startsWith('EXPENSE-')) return 'Gastos'
        if (transaction.reference.startsWith('PURCHASE-')) return 'Compras'
        if (transaction.reference.includes('MANUAL') || transaction.reference.includes('IMPORT')) return 'Tesorería'
    }

    // Si no hay reference específico, verificar por categoría
    if (transaction.category) {
        if (transaction.category === 'Nómina' || transaction.category === 'Nomina') return 'Empleados'
        if (transaction.category === 'Cobro' || transaction.category === 'Cobranza') return 'Clientes'
        if (transaction.category === 'Pago Factura' || transaction.category === 'Factura') return 'Facturas'
        // Categorías que deberían ser consideradas como Tesorería
        if (['Ingreso', 'Egreso', 'Transferencia', 'Ajuste', 'Interés', 'Comisión'].includes(transaction.category)) {
            return 'Tesorería'
        }
    }

    // También verificar por descripción si contiene palabras clave
    if (transaction.description) {
        const desc = transaction.description.toLowerCase()
        if (desc.includes('nómina') || desc.includes('nomina') || desc.includes('salario')) return 'Empleados'
        if (desc.includes('cobro') || desc.includes('cobranza') || desc.includes('cliente')) return 'Clientes'
        if (desc.includes('factura') || desc.includes('proveedor')) return 'Facturas'
        // Descripciones que indican origen tesorería
        if (desc.includes('transferencia') || desc.includes('depósito') || desc.includes('retiro') ||
            desc.includes('ingreso') || desc.includes('egreso') || desc.includes('ajuste')) {
            return 'Tesorería'
        }
    }

    // Por defecto, si no coincide con otros orígenes específicos, considerar Tesorería
    // Esto es más inclusivo que antes
    return 'Tesorería'
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const organizationId = session.user.organizationId

        // Extraer el parámetro 'period' de la URL
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || 'month'

        // Obtener información de la organización para el clima
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                id: true,
                name: true,
                city: true,
                country: true,
                address: true
            }
        })

        const now = new Date()

        // Calcular fechas de inicio y fin basadas en el período
        let startDate: Date
        let endDate: Date

        switch (period) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
                break
            case 'quarter':
                // Últimos 3 meses
                startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0)
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
                break
            case 'year':
                // Este año
                startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
                break
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        }

        // Usar startDate y endDate en lugar de startOfMonth y endOfMonth

        // Proyectos activos
        const activeProjects = await prisma.project.count({
            where: {
                organizationId,
                status: { in: ['PLANNING', 'IN_PROGRESS'] }
            }
        })

        // Ingresos del mes por moneda (collections pagadas + transacciones de ingreso que no sean de cobranzas)
        const collectionsRevenueByCurrency = await prisma.payment.groupBy({
            by: ['currency'],
            where: {
                organizationId,
                status: 'PAID',
                paidDate: {
                    gte: startDate,
                    lte: endDate
                }
                // Solo collections, no pagos de facturas (ya no hay invoiceId)
            },
            _sum: {
                amount: true
            }
        })

        const transactionsRevenueByCurrency = await prisma.transaction.groupBy({
            by: ['currency'],
            where: {
                organizationId,
                type: 'INCOME',
                date: {
                    gte: startDate,
                    lte: endDate
                },
                category: {
                    not: 'Cobranza' // Excluir transacciones automáticas de cobranzas
                }
            },
            _sum: {
                amount: true
            }
        })

        // Filtrar transacciones de ingresos por origen "Tesorería"
        const treasuryIncomeTransactions = await prisma.transaction.findMany({
            where: {
                organizationId,
                type: 'INCOME',
                date: {
                    gte: startDate,
                    lte: endDate
                },
                category: {
                    not: 'Cobranza' // Excluir transacciones automáticas de cobranzas
                }
            }
        })

        const filteredTreasuryIncomeTransactions = treasuryIncomeTransactions.filter(t => getTransactionOrigin(t) === 'Tesorería')

        // Calcular ingresos por moneda de transacciones de tesorería
        const treasuryIncomeByCurrency = {
            PESOS: 0,
            USD: 0,
            EUR: 0
        }

        filteredTreasuryIncomeTransactions.forEach(item => {
            const amount = item.amount
            const currency = item.currency as keyof typeof treasuryIncomeByCurrency
            treasuryIncomeByCurrency[currency] += amount && typeof amount === 'object' && 'toNumber' in amount ? (amount as any).toNumber() : Number(amount)
        })

        // Ingresos por facturas de clientes (NEW BILL SYSTEM) - Bills pagadas de tipo CLIENT
        // Excluimos pagos que ya están en collections para evitar duplicación
        const billsClientRevenueByCurrency = await prisma.billPayment.groupBy({
            by: ['currency'],
            where: {
                organizationId,
                paymentDate: {
                    gte: startDate,
                    lte: endDate
                },
                bill: {
                    type: 'CLIENT'
                }
                // BillPayment no tiene relación con Payment, eliminamos la condición inválida
            },
            _sum: {
                amount: true
            }
        })

        // Calcular totales por moneda
        const monthlyRevenueByCurrency = {
            PESOS: 0,
            USD: 0,
            EUR: 0
        }

        // Sumar collections por moneda
        collectionsRevenueByCurrency.forEach(item => {
            const amount = item._sum.amount
            const currency = item.currency as keyof typeof monthlyRevenueByCurrency
            monthlyRevenueByCurrency[currency] += amount && typeof amount === 'object' && 'toNumber' in amount ? (amount as any).toNumber() : Number(amount)
        })

        // Sumar transactions de tesorería por moneda
        Object.entries(treasuryIncomeByCurrency).forEach(([currency, amount]) => {
            monthlyRevenueByCurrency[currency as keyof typeof monthlyRevenueByCurrency] += amount
        })

        // Sumar bills por moneda
        billsClientRevenueByCurrency.forEach(item => {
            const amount = item._sum.amount
            const currency = item.currency as keyof typeof monthlyRevenueByCurrency
            monthlyRevenueByCurrency[currency] += amount && typeof amount === 'object' && 'toNumber' in amount ? (amount as any).toNumber() : Number(amount)
        })

        const totalMonthlyRevenue = monthlyRevenueByCurrency.PESOS + monthlyRevenueByCurrency.USD + monthlyRevenueByCurrency.EUR

        // Mantener totalMonthlyRevenue como suma para compatibilidad, pero usar monthlyRevenueByCurrency para display

        // Egresos del mes por moneda (pagos de facturas + transacciones de egreso que no sean automáticas + nóminas)
        const invoicePaymentsExpenseByCurrency = await prisma.payment.groupBy({
            by: ['currency'],
            where: {
                organizationId,
                status: 'PAID',
                paidDate: {
                    gte: startDate,
                    lte: endDate
                }
                // Solo pagos de facturas (ya no hay invoiceId, ahora usamos billId)
            },
            _sum: {
                amount: true
            }
        })

        const transactionsExpenseByCurrency = await prisma.transaction.groupBy({
            by: ['currency'],
            where: {
                organizationId,
                type: 'EXPENSE',
                date: {
                    gte: startDate,
                    lte: endDate
                },
                category: {
                    not: 'Nómina' // Excluir nóminas automáticas
                },
                reference: {
                    not: {
                        startsWith: 'PAY-' // Excluir pagos automáticos de facturas
                    }
                },
                payrollId: null // Excluir transacciones relacionadas con nóminas
            },
            _sum: {
                amount: true
            }
        })

        // Filtrar transacciones de egresos por origen "Tesorería"
        const treasuryExpenseTransactions = await prisma.transaction.findMany({
            where: {
                organizationId,
                type: 'EXPENSE',
                date: {
                    gte: startDate,
                    lte: endDate
                },
                category: {
                    not: 'Nómina' // Excluir nóminas automáticas
                },
                reference: {
                    not: {
                        startsWith: 'PAY-' // Excluir pagos automáticos de facturas
                    }
                },
                payrollId: null // Excluir transacciones relacionadas con nóminas
            }
        })

        const filteredTreasuryExpenseTransactions = treasuryExpenseTransactions.filter(t => getTransactionOrigin(t) === 'Tesorería')

        // Calcular egresos por moneda de transacciones de tesorería
        const treasuryExpenseByCurrency = {
            PESOS: 0,
            USD: 0,
            EUR: 0
        }

        filteredTreasuryExpenseTransactions.forEach(item => {
            const amount = item.amount
            const currency = item.currency as keyof typeof treasuryExpenseByCurrency
            treasuryExpenseByCurrency[currency] += amount && typeof amount === 'object' && 'toNumber' in amount ? (amount as any).toNumber() : Number(amount)
        })

        const payrollsExpenseByCurrency = await prisma.payroll.groupBy({
            by: ['currency'],
            where: {
                organizationId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: {
                netPay: true
            }
        })

        // Gastos por facturas de proveedores (NEW BILL SYSTEM) - Bills pagadas de tipo PROVIDER
        const billsProviderExpenseByCurrency = await prisma.billPayment.groupBy({
            by: ['currency'],
            where: {
                organizationId,
                paymentDate: {
                    gte: startDate,
                    lte: endDate
                },
                bill: {
                    type: 'PROVIDER'
                }
                // BillPayment no tiene relación con Payment, eliminamos la condición inválida
            },
            _sum: {
                amount: true
            }
        })

        // Calcular totales de egresos por moneda
        const monthlyExpenseByCurrency = {
            PESOS: 0,
            USD: 0,
            EUR: 0
        }

        // Sumar pagos de facturas por moneda
        invoicePaymentsExpenseByCurrency.forEach(item => {
            const amount = item._sum.amount
            const currency = item.currency as keyof typeof monthlyExpenseByCurrency
            monthlyExpenseByCurrency[currency] += amount && typeof amount === 'object' && 'toNumber' in amount ? (amount as any).toNumber() : Number(amount)
        })

        // Sumar transactions de tesorería por moneda
        Object.entries(treasuryExpenseByCurrency).forEach(([currency, amount]) => {
            monthlyExpenseByCurrency[currency as keyof typeof monthlyExpenseByCurrency] += amount
        })

        // Sumar nóminas por moneda
        payrollsExpenseByCurrency.forEach(item => {
            const amount = item._sum.netPay
            const currency = item.currency as keyof typeof monthlyExpenseByCurrency
            monthlyExpenseByCurrency[currency] += amount && typeof amount === 'object' && 'toNumber' in amount ? (amount as any).toNumber() : Number(amount)
        })

        // Sumar bills de proveedores por moneda
        billsProviderExpenseByCurrency.forEach(item => {
            const amount = item._sum.amount
            const currency = item.currency as keyof typeof monthlyExpenseByCurrency
            monthlyExpenseByCurrency[currency] += amount && typeof amount === 'object' && 'toNumber' in amount ? (amount as any).toNumber() : Number(amount)
        })

        const totalMonthlyExpense = monthlyExpenseByCurrency.PESOS + monthlyExpenseByCurrency.USD + monthlyExpenseByCurrency.EUR

        // Variables separadas por moneda para display
        const monthlyRevenue = monthlyRevenueByCurrency
        const monthlyExpense = monthlyExpenseByCurrency

        // ===== NUEVO: Obtener balances actuales de cajas y bancos =====
        // Temporalmente comentado para evitar error de fetch en Railway
        let currentBalances = {
            cashBoxes: { PESOS: 0, USD: 0, EUR: 0 },
            bankAccounts: { PESOS: 0, USD: 0, EUR: 0 },
            total: { PESOS: 0, USD: 0, EUR: 0 }
        }

        /* 
        const balancesResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/treasury/balances?organizationId=${organizationId}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (balancesResponse.ok) {
            const balancesData = await balancesResponse.json()

            // Procesar balances de cajas
            Object.values(balancesData.accounts).forEach((account: any) => {
                if (account.type === 'CASH_BOX' && account.balancesByCurrency) {
                    Object.entries(account.balancesByCurrency).forEach(([currency, balance]: [string, any]) => {
                        currentBalances.cashBoxes[currency as keyof typeof currentBalances.cashBoxes] += balance || 0
                    })
                } else if (account.type === 'BANK_ACCOUNT' && account.balancesByCurrency) {
                    Object.entries(account.balancesByCurrency).forEach(([currency, balance]: [string, any]) => {
                        currentBalances.bankAccounts[currency as keyof typeof currentBalances.bankAccounts] += balance || 0
                    })
                }
            })

            // Calcular totales
            Object.keys(currentBalances.total).forEach(currency => {
                currentBalances.total[currency as keyof typeof currentBalances.total] =
                    currentBalances.cashBoxes[currency as keyof typeof currentBalances.cashBoxes] +
                    currentBalances.bankAccounts[currency as keyof typeof currentBalances.bankAccounts]
            })
        }
        */
        // 1. Transacciones de gastos por categoría (excluyendo automáticas)
        const expensesByCategory = await prisma.transaction.groupBy({
            by: ['category'],
            where: {
                organizationId,
                type: 'EXPENSE',
                date: {
                    gte: startDate,
                    lte: endDate
                },
                AND: [
                    { category: { not: null } },
                    { category: { not: 'Nómina' } }
                ],
                reference: {
                    not: {
                        startsWith: 'PAY-' // Excluir pagos automáticos de facturas
                    }
                },
                payrollId: null // Excluir transacciones relacionadas con nóminas
            },
            _sum: { amount: true }
        })

        // 2. Nóminas del mes (como categoría separada)
        const payrollsByCategory = await prisma.payroll.groupBy({
            by: ['currency'],
            where: {
                organizationId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: { netPay: true }
        })

        // 3. Pagos de facturas por rubro (usando la relación con rubros)
        const paymentsByRubro = await prisma.payment.groupBy({
            by: ['rubroId'],
            where: {
                organizationId,
                status: 'PAID',
                paidDate: {
                    gte: startDate,
                    lte: endDate
                },
                rubroId: {
                    not: null
                }
            },
            _sum: {
                amount: true
            }
        })

        // Obtener información de los rubros para los IDs obtenidos
        const rubroIds = paymentsByRubro.map(p => p.rubroId).filter(id => id !== null)
        let rubros: any[] = []

        if (rubroIds.length > 0) {
            rubros = await prisma.rubro.findMany({
                where: {
                    id: {
                        in: rubroIds
                    }
                },
                select: {
                    id: true,
                    name: true,
                    type: true
                }
            })
        }

        // Crear un mapa de rubros para acceso rápido
        const rubroMap = new Map(rubros.map(r => [r.id, r]))

        // Procesar datos para el gráfico de dona
        const categoryData = {
            labels: [] as string[],
            data: [] as number[],
            colors: [] as string[],
            total: 0
        }

        // Colores predefinidos para categorías
        const categoryColors: { [key: string]: string } = {
            'Nómina': '#ef4444',      // Rojo
            'Materiales': '#10b981',  // Verde
            'Equipos': '#3b82f6',     // Azul
            'Servicios': '#f59e0b',   // Ámbar
            'Administrativos': '#8b5cf6', // Violeta
            'Gastos': '#6b7280',     // Gris
            'Otros': '#94a3b8'       // Gris claro
        }

        // Procesar transacciones por categoría
        expensesByCategory.forEach(item => {
            let amount = 0
            if (item._sum.amount !== null && item._sum.amount !== undefined) {
                if (typeof item._sum.amount === 'object' && 'toNumber' in item._sum.amount) {
                    amount = (item._sum.amount as any).toNumber()
                } else if (typeof item._sum.amount === 'number') {
                    amount = item._sum.amount
                } else {
                    amount = Number(item._sum.amount)
                }
            }

            const category = item.category || 'Otros'

            if (amount > 0) {
                categoryData.labels.push(category)
                categoryData.data.push(amount)
                categoryData.colors.push(categoryColors[category] || categoryColors['Otros'])
                categoryData.total += amount
            }
        })

        // Agregar nóminas como categoría separada
        const totalPayroll = payrollsByCategory.reduce((sum, item) => {
            let netPay = 0
            if (item._sum.netPay !== null && item._sum.netPay !== undefined) {
                if (typeof item._sum.netPay === 'object' && 'toNumber' in item._sum.netPay) {
                    netPay = (item._sum.netPay as any).toNumber()
                } else if (typeof item._sum.netPay === 'number') {
                    netPay = item._sum.netPay
                } else {
                    netPay = Number(item._sum.netPay)
                }
            }
            return sum + netPay
        }, 0)

        if (totalPayroll > 0) {
            categoryData.labels.push('Nómina')
            categoryData.data.push(totalPayroll)
            categoryData.colors.push(categoryColors['Nómina'])
            categoryData.total += totalPayroll
        }

        // Agregar pagos por rubro
        paymentsByRubro.forEach(item => {
            if (item.rubroId && item._sum.amount !== null && item._sum.amount !== undefined) {
                let amount: number = 0

                if (typeof item._sum.amount === 'object' && item._sum.amount !== null && 'toNumber' in item._sum.amount) {
                    amount = (item._sum.amount as any).toNumber()
                } else if (typeof item._sum.amount === 'number') {
                    amount = item._sum.amount
                } else {
                    amount = Number(item._sum.amount)
                }

                const rubro = rubroMap.get(item.rubroId)
                const rubroName = rubro?.name || 'Sin rubro'

                if (amount > 0) {
                    categoryData.labels.push(rubroName)
                    categoryData.data.push(amount)
                    categoryData.colors.push(categoryColors[rubroName] || categoryColors['Otros'])
                    categoryData.total += amount
                }
            }
        })

        // Si no hay datos, agregar una categoría por defecto
        if (categoryData.labels.length === 0) {
            categoryData.labels.push('Sin datos')
            categoryData.data.push(0)
            categoryData.colors.push(categoryColors['Otros'])
            categoryData.total = 0
        }

        // Empleados activos
        const activeEmployees = await prisma.employee.count({
            where: {
                organizationId,
                status: 'ACTIVE'
            }
        })

        // Empleados en obra hoy (con time tracking activo)
        const employeesOnSite = await prisma.timeTracking.count({
            where: {
                organizationId,
                startTime: {
                    gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                },
                endTime: null // Activos
            }
        })

        // Proyectos recientes
        const recentProjects = await prisma.project.findMany({
            where: { organizationId },
            include: {
                _count: {
                    select: {
                        inspections: true,
                        timeTrackings: true,
                        bills: true // Cambiado de invoices a bills
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 3
        })

        // Alertas: facturas vencidas (NEW SYSTEM), inspecciones pendientes, cobranzas vencidas, condiciones de pago vencidas

        // Facturas vencidas - Sistema NUEVO (bills)
        const overdueBills = await prisma.bill.count({
            where: {
                organizationId,
                dueDate: { lt: now },
                status: { in: ['PENDING', 'SENT', 'PARTIAL'] }
            }
        })

        // Total de facturas vencidas (solo nuevo sistema)
        const totalOverdueInvoices = overdueBills

        const pendingInspections = await prisma.inspection.count({
            where: {
                organizationId,
                status: 'PENDING',
                scheduledDate: { lt: now }
            }
        })

        // Cobranzas vencidas (collections = payments que están vencidas)
        const overdueCollections = await prisma.payment.count({
            where: {
                organizationId,
                dueDate: { lt: now },
                status: { in: ['PENDING', 'PARTIAL'] }
                // Solo collections, no pagos de facturas (ya no hay invoiceId)
            }
        })

        // Condiciones de pago vencidas (payment terms con fecha de vencimiento pasada)
        // Nota: PaymentTerm no tiene campo dueDate, se calcula basado en startDate + recurrence + periods
        // Por ahora retornamos 0 hasta implementar la lógica completa
        const overduePaymentTerms = 0

        // Tareas pendientes de la tabla Task asignadas al usuario logueado
        // Primero encontrar el empleado correspondiente al usuario logueado
        const userEmployeeForCount = await prisma.employee.findFirst({
            where: {
                organizationId,
                email: session.user.email // Asumiendo que el email del usuario coincide con el del empleado
            },
            select: {
                id: true
            }
        })

        // Temporalmente comentado para evitar error
        const pendingTasks = 0
        /* const pendingTasks = await prisma.task.count({
            where: {
                organizationId,
                status: { in: ['PENDING', 'IN_PROGRESS'] },
                ...(userEmployeeForCount && { assigneeId: userEmployeeForCount.id }) // Solo tareas asignadas al empleado del usuario
            }
        }) */

        // Eficiencia general (promedio de duración de time tracking)
        const efficiencyData = await prisma.timeTracking.aggregate({
            where: {
                organizationId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _avg: {
                duration: true
            }
        })

        // Calcular eficiencia como porcentaje (duración promedio / 8 horas * 100)
        const avgDurationHours = (efficiencyData._avg.duration || 0) / 60 // convertir minutos a horas
        const efficiency = Math.min(100, Math.round((avgDurationHours / 8) * 100))

        // Ingresos mensuales (últimos 6 meses) - collections + transactions
        // Primero obtener budgets activos para calcular presupuestado
        const activeBudgets = await prisma.budget.findMany({
            where: {
                project: {
                    organizationId,
                    status: { in: ['PLANNING', 'IN_PROGRESS'] }
                }
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        startDate: true,
                        endDate: true,
                        status: true
                    }
                },
                items: {
                    select: {
                        currency: true,
                        cost: true
                    }
                }
            }
        })

        const monthlyRevenues = []
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

            // Calcular CONSUMO (gastos) del mes - payments, transactions, bills
            // 1. Pagos de facturas (payments) - ya incluyen bills pagadas
            const paymentsMonth = await prisma.payment.groupBy({
                by: ['currency'],
                where: {
                    organizationId,
                    status: 'PAID',
                    paidDate: {
                        gte: monthStart,
                        lte: monthEnd
                    }
                },
                _sum: { amount: true }
            })

            // 2. Transacciones de gastos (excluyendo automáticas de bills y nóminas)
            const transactionsExpenseMonth = await prisma.transaction.groupBy({
                by: ['currency'],
                where: {
                    organizationId,
                    type: 'EXPENSE',
                    date: {
                        gte: monthStart,
                        lte: monthEnd
                    },
                    category: {
                        not: 'Nómina' // Excluir nóminas automáticas
                    },
                    reference: {
                        not: {
                            startsWith: 'PAY-' // Excluir pagos automáticos de facturas
                        }
                    },
                    payrollId: null, // Excluir transacciones relacionadas con nóminas
                    // NOTA: Las transacciones de bills se excluyen por reference que no empiece con 'PAY-'
                    // ya que las bills generan transacciones automáticas con reference 'PAY-...'
                },
                _sum: { amount: true }
            })

            // 3. Nóminas del mes
            const payrollsMonth = await prisma.payroll.groupBy({
                by: ['currency'],
                where: {
                    organizationId,
                    createdAt: {
                        gte: monthStart,
                        lte: monthEnd
                    }
                },
                _sum: { netPay: true }
            })

            // Calcular totales por moneda (SIN SUMAR entre monedas)
            const consumedByCurrency = {
                PESOS: 0,
                USD: 0,
                EUR: 0
            }

            // Sumar payments por moneda
            paymentsMonth.forEach(p => {
                const amount = p._sum.amount
                const currency = p.currency as keyof typeof consumedByCurrency
                consumedByCurrency[currency] += amount && typeof amount === 'object' && 'toNumber' in amount ? (amount as any).toNumber() : Number(amount)
            })

            // Sumar transactions por moneda
            transactionsExpenseMonth.forEach(t => {
                const amount = t._sum.amount
                const currency = t.currency as keyof typeof consumedByCurrency
                consumedByCurrency[currency] += amount && typeof amount === 'object' && 'toNumber' in amount ? (amount as any).toNumber() : Number(amount)
            })

            // Sumar nóminas por moneda
            payrollsMonth.forEach(p => {
                const amount = p._sum.netPay
                const currency = p.currency as keyof typeof consumedByCurrency
                consumedByCurrency[currency] += amount && typeof amount === 'object' && 'toNumber' in amount ? (amount as any).toNumber() : Number(amount)
            })

            // Total consumido (suma de todas las monedas para compatibilidad con gráfico)
            const totalConsumed = consumedByCurrency.PESOS + consumedByCurrency.USD + consumedByCurrency.EUR

            // Calcular presupuestado mensual basado en budgets activos
            const budgetedByCurrency = {
                PESOS: 0,
                USD: 0,
                EUR: 0
            }

            activeBudgets.forEach(budget => {
                const project = budget.project
                if (!project || !project.startDate || !project.endDate) return

                const projectStart = new Date(project.startDate)
                const projectEnd = new Date(project.endDate)

                // Verificar si el mes actual está dentro del período del proyecto
                if (monthStart <= projectEnd && monthEnd >= projectStart) {
                    // Calcular presupuesto total por moneda basado en los items
                    const budgetByCurrency = {
                        PESOS: 0,
                        USD: 0,
                        EUR: 0
                    }

                    budget.items.forEach(item => {
                        const currency = item.currency as keyof typeof budgetByCurrency
                        const cost = item.cost && typeof item.cost === 'object' && 'toNumber' in item.cost
                            ? (item.cost as any).toNumber()
                            : Number(item.cost)
                        budgetByCurrency[currency] += cost
                    })

                    // Calcular duración del proyecto en meses
                    const startYear = projectStart.getFullYear()
                    const startMonth = projectStart.getMonth()
                    const endYear = projectEnd.getFullYear()
                    const endMonth = projectEnd.getMonth()

                    const monthsDiff = Math.max(1,
                        (endYear - startYear) * 12 + (endMonth - startMonth) + 1
                    )

                    // Distribuir cada moneda equitativamente por mes
                    Object.entries(budgetByCurrency).forEach(([currency, totalAmount]) => {
                        if (totalAmount > 0) {
                            const monthlyBudget = totalAmount / monthsDiff
                            budgetedByCurrency[currency as keyof typeof budgetedByCurrency] += monthlyBudget

                            console.log(`[BUDGET CALC] ${monthStart.toLocaleString('es', { month: 'short', year: 'numeric' })}:`, {
                                projectId: project.id,
                                projectName: project.name,
                                currency,
                                totalBudget: totalAmount,
                                monthsDiff,
                                monthlyBudget: Math.round(monthlyBudget),
                                projectStart: projectStart.toISOString().split('T')[0],
                                projectEnd: projectEnd.toISOString().split('T')[0]
                            })
                        }
                    })
                }
            })

            // Total presupuestado (suma de todas las monedas para compatibilidad con gráfico)
            const budgetedAmount = budgetedByCurrency.PESOS + budgetedByCurrency.USD + budgetedByCurrency.EUR

            // Log para debugging de consumo mensual
            console.log(`[MONTHLY CONSUMPTION] ${monthStart.toLocaleString('es', { month: 'short', year: 'numeric' })}:`, {
                consumedByCurrency,
                budgetedByCurrency,
                totalConsumed,
                totalBudgeted: budgetedAmount
            })

            monthlyRevenues.push({
                month: monthStart.toLocaleString('es', { month: 'short' }),
                revenue: totalConsumed, // Suma total para el gráfico
                consumedByCurrency, // Detalle por moneda
                budgeted: budgetedAmount, // Suma total para el gráfico
                budgetedByCurrency // Detalle por moneda
            })
        }

        // Progreso de proyectos
        const projectProgress = await prisma.project.findMany({
            where: {
                organizationId,
                status: { in: ['PLANNING', 'IN_PROGRESS'] }
            },
            select: {
                id: true,
                name: true,
                progress: true,
                status: true
            },
            take: 4
        })

        // Total ingresos por bills de clientes (para compatibilidad)
        const billsClientRevenue = await prisma.billPayment.aggregate({
            where: {
                organizationId,
                paymentDate: {
                    gte: startDate,
                    lte: endDate
                },
                bill: {
                    type: 'CLIENT'
                }
                // BillPayment no tiene relación con Payment, eliminamos la condición inválida
            },
            _sum: {
                amount: true
            }
        })

        // Total gastos por bills de proveedores (para compatibilidad)
        const billsProviderExpense = await prisma.billPayment.aggregate({
            where: {
                organizationId,
                paymentDate: {
                    gte: startDate,
                    lte: endDate
                },
                bill: {
                    type: 'PROVIDER'
                }
                // BillPayment no tiene relación con Payment, eliminamos la condición inválida
            },
            _sum: {
                amount: true
            }
        })

        // Tareas recientes (últimas 5 tareas activas)
        const recentTasks = await prisma.assignment.findMany({
            where: {
                organizationId,
                status: 'ACTIVO'
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        })

        // Tareas de planificación recientes (últimas 5 tareas pendientes/activas asignadas al usuario logueado)
        // Primero encontrar el empleado correspondiente al usuario logueado
        const userEmployee = await prisma.employee.findFirst({
            where: {
                organizationId,
                email: session.user.email // Asumiendo que el email del usuario coincide con el del empleado
            },
            select: {
                id: true
            }
        })

        // Temporalmente comentado para evitar error
        const recentPlanningTasks: any[] = []
        /* const recentPlanningTasks = await prisma.task.findMany({
            where: {
                organizationId,
                status: {
                    in: ['PENDING', 'IN_PROGRESS']
                },
                ...(userEmployee && { assigneeId: userEmployee.id }) // Solo tareas asignadas al empleado del usuario
            },
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, firstName: true, lastName: true } },
                rubro: { select: { id: true, name: true } }
            },
            orderBy: {
                startDate: 'asc'
            },
            take: 5
        }) */

        return NextResponse.json({
            organization: {
                id: organization?.id,
                name: organization?.name,
                city: organization?.city,
                country: organization?.country,
                address: organization?.address
            },
            metrics: {
                activeProjects,
                pendingTasks,
                monthlyRevenue: monthlyRevenue, // Objeto separado por moneda
                monthlyExpense: monthlyExpense, // Objeto separado por moneda
                monthlyRevenueByCurrency, // Nuevo: separado por moneda
                monthlyExpenseByCurrency, // Nuevo: separado por moneda
                billsRevenue: billsClientRevenue._sum.amount || 0, // Solo ingresos por bills
                billsExpense: billsProviderExpense._sum.amount || 0, // Solo gastos por bills
                activeEmployees,
                employeesOnSite,
                efficiency,
                currentBalances // Nuevo: balances actuales de cajas y bancos
            },
            recentProjects: recentProjects.map(p => ({
                id: p.id,
                name: p.name,
                status: p.status,
                progress: p.progress || 0,
                inspectionsCount: p._count.inspections,
                timeTrackingCount: p._count.timeTrackings,
                billsCount: p._count.bills // Cambiado de invoices a bills
            })),
            alerts: {
                overdueInvoices: totalOverdueInvoices, // Total de facturas vencidas (solo nuevo sistema)
                overdueBills: overdueBills, // Solo sistema nuevo
                pendingInspections,
                overdueCollections,
                overduePaymentTerms,
                pendingTasks, // Tareas pendientes de la tabla Task
                total: totalOverdueInvoices + pendingInspections + overdueCollections + overduePaymentTerms + pendingTasks
            },
            tasks: recentTasks.map(task => ({
                id: task.id,
                employeeName: `${task.employee.firstName} ${task.employee.lastName}`,
                employeePosition: task.employee.position,
                projectName: task.project.name,
                role: task.role,
                startDate: task.startDate.toISOString().split('T')[0],
                endDate: task.endDate ? task.endDate.toISOString().split('T')[0] : null,
                hoursPerWeek: task.hoursPerWeek,
                status: task.status === 'ACTIVO' ? 'Activo' :
                    task.status === 'INACTIVO' ? 'Inactivo' : 'Completado'
            })),
            planningTasks: recentPlanningTasks.map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                startDate: task.startDate ? task.startDate.toISOString().split('T')[0] : null,
                endDate: task.endDate ? task.endDate.toISOString().split('T')[0] : null,
                estimatedHours: task.estimatedHours,
                progress: task.progress,
                priority: task.priority,
                status: task.status === 'PENDING' ? 'Pendiente' :
                    task.status === 'IN_PROGRESS' ? 'En Progreso' :
                        task.status === 'COMPLETED' ? 'Completada' : task.status,
                projectName: task.project?.name || null,
                assigneeName: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : null,
                rubroName: task.rubro?.name || null
            })),
            charts: {
                monthlyRevenues,
                projectProgress: projectProgress.map(p => ({
                    name: p.name,
                    progress: p.progress || 0
                })),
                expensesByCategory: categoryData // Nuevo gráfico de consumos por rubros
            }
        })

    } catch (error) {
        console.error('Error fetching dashboard data:', error)
        return NextResponse.json(
            { error: 'Error fetching dashboard data' },
            { status: 500 }
        )
    }
}
