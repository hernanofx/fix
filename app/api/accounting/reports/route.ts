import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const organizationId = session.user.organizationId

        // Verificar que la organización tiene contabilidad habilitada
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { enableAccounting: true }
        })

        if (!organization?.enableAccounting) {
            return NextResponse.json({ error: 'Contabilidad no habilitada' }, { status: 403 })
        }

        const reportType = searchParams.get('type') // 'balance' | 'income-statement' | 'trial-balance'
        const fromDate = searchParams.get('fromDate')
        const toDate = searchParams.get('toDate')

        if (!reportType) {
            return NextResponse.json({ error: 'Tipo de reporte requerido' }, { status: 400 })
        }

        const endDate = toDate ? new Date(toDate) : new Date()
        const startDate = fromDate ? new Date(fromDate) : new Date(endDate.getFullYear(), 0, 1)

        switch (reportType) {
            case 'balance':
                return await generateBalanceSheet(organizationId, endDate)

            case 'income-statement':
                return await generateIncomeStatement(organizationId, startDate, endDate)

            case 'trial-balance':
                return await generateTrialBalance(organizationId, startDate, endDate)

            case 'stats':
                return await generateAccountingStats(organizationId)

            default:
                return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 })
        }

    } catch (error) {
        console.error('Error generating report:', error)
        return NextResponse.json({ error: 'Error generando reporte' }, { status: 500 })
    }
}

async function generateBalanceSheet(organizationId: string, asOfDate: Date) {
    // Balance General - Posición financiera a una fecha específica
    const accounts = await prisma.account.findMany({
        where: {
            organizationId,
            isActive: true,
            type: { in: ['ACTIVO', 'PASIVO', 'PATRIMONIO'] }
        }
    })

    // Obtener todas las entradas del diario hasta la fecha
    const journalEntries = await prisma.journalEntry.findMany({
        where: {
            organizationId,
            date: { lte: asOfDate }
        },
        include: {
            debitAccount: true,
            creditAccount: true
        }
    })

    const accountBalances = new Map<string, number>()

    // Calcular saldos por cuenta
    for (const entry of journalEntries) {
        if (entry.debitAccountId) {
            const currentBalance = accountBalances.get(entry.debitAccountId) || 0
            accountBalances.set(entry.debitAccountId, currentBalance + entry.debit.toNumber())
        }
        if (entry.creditAccountId) {
            const currentBalance = accountBalances.get(entry.creditAccountId) || 0
            accountBalances.set(entry.creditAccountId, currentBalance - entry.credit.toNumber())
        }
    }

    const balanceData = {
        assets: [] as any[],
        liabilities: [] as any[],
        equity: [] as any[],
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0
    }

    for (const account of accounts) {
        const balance = accountBalances.get(account.id) || 0

        if (Math.abs(balance) > 0.01) { // Solo mostrar cuentas con saldo
            const accountData = {
                code: account.code,
                name: account.name,
                balance: account.type === 'ACTIVO' ? balance : -balance // Ajustar signo para pasivos y patrimonio
            }

            switch (account.type) {
                case 'ACTIVO':
                    balanceData.assets.push(accountData)
                    balanceData.totalAssets += accountData.balance
                    break
                case 'PASIVO':
                    balanceData.liabilities.push(accountData)
                    balanceData.totalLiabilities += accountData.balance
                    break
                case 'PATRIMONIO':
                    balanceData.equity.push(accountData)
                    balanceData.totalEquity += accountData.balance
                    break
            }
        }
    }

    return NextResponse.json({
        type: 'balance-sheet',
        asOfDate,
        ...balanceData
    })
}

async function generateIncomeStatement(organizationId: string, fromDate: Date, toDate: Date) {
    // Estado de Resultados - Ingresos y egresos en un período
    const accounts = await prisma.account.findMany({
        where: {
            organizationId,
            isActive: true,
            type: { in: ['INGRESO', 'EGRESO'] }
        }
    })

    // Obtener entradas del diario en el período
    const journalEntries = await prisma.journalEntry.findMany({
        where: {
            organizationId,
            date: { gte: fromDate, lte: toDate }
        },
        include: {
            debitAccount: true,
            creditAccount: true
        }
    })

    const accountBalances = new Map<string, number>()

    // Calcular saldos por cuenta
    for (const entry of journalEntries) {
        if (entry.debitAccountId) {
            const currentBalance = accountBalances.get(entry.debitAccountId) || 0
            accountBalances.set(entry.debitAccountId, currentBalance + entry.debit.toNumber())
        }
        if (entry.creditAccountId) {
            const currentBalance = accountBalances.get(entry.creditAccountId) || 0
            accountBalances.set(entry.creditAccountId, currentBalance - entry.credit.toNumber())
        }
    }

    const incomeData = {
        revenue: [] as any[],
        expenses: [] as any[],
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0
    }

    for (const account of accounts) {
        const balance = accountBalances.get(account.id) || 0

        if (Math.abs(balance) > 0.01) {
            const accountData = {
                code: account.code,
                name: account.name,
                balance: balance
            }

            if (account.type === 'INGRESO') {
                // Para ingresos, el saldo se muestra como positivo cuando hay más créditos
                accountData.balance = -balance
                incomeData.revenue.push(accountData)
                incomeData.totalRevenue += accountData.balance
            } else {
                // Para gastos, el saldo se muestra como positivo cuando hay más débitos
                incomeData.expenses.push(accountData)
                incomeData.totalExpenses += Math.abs(balance)
            }
        }
    }

    incomeData.netIncome = incomeData.totalRevenue - incomeData.totalExpenses

    return NextResponse.json({
        type: 'income-statement',
        period: { fromDate, toDate },
        ...incomeData
    })
}

async function generateTrialBalance(organizationId: string, fromDate: Date, toDate: Date) {
    // Balance de Comprobación - Saldos de todas las cuentas
    const accounts = await prisma.account.findMany({
        where: {
            organizationId,
            isActive: true
        },
        orderBy: { code: 'asc' }
    })

    // Obtener entradas del diario en el período
    const journalEntries = await prisma.journalEntry.findMany({
        where: {
            organizationId,
            date: { gte: fromDate, lte: toDate }
        }
    })

    const accountDebits = new Map<string, number>()
    const accountCredits = new Map<string, number>()

    // Sumar débitos y créditos por cuenta
    for (const entry of journalEntries) {
        if (entry.debitAccountId) {
            const currentDebit = accountDebits.get(entry.debitAccountId) || 0
            accountDebits.set(entry.debitAccountId, currentDebit + entry.debit.toNumber())
        }
        if (entry.creditAccountId) {
            const currentCredit = accountCredits.get(entry.creditAccountId) || 0
            accountCredits.set(entry.creditAccountId, currentCredit + entry.credit.toNumber())
        }
    }

    const trialBalanceData = accounts.map(account => {
        const debits = accountDebits.get(account.id) || 0
        const credits = accountCredits.get(account.id) || 0

        return {
            code: account.code,
            name: account.name,
            type: account.type,
            debits,
            credits,
            balance: debits - credits
        }
    }).filter(account => Math.abs(account.debits) > 0.01 || Math.abs(account.credits) > 0.01)

    const totals = trialBalanceData.reduce((acc, account) => ({
        debits: acc.debits + account.debits,
        credits: acc.credits + account.credits
    }), { debits: 0, credits: 0 })

    return NextResponse.json({
        type: 'trial-balance',
        period: { fromDate, toDate },
        accounts: trialBalanceData,
        totals
    })
}

async function generateAccountingStats(organizationId: string) {
    const [totalAccounts, entriesThisMonth, lastEntry, balanceCheck] = await Promise.all([
        prisma.account.count({
            where: { organizationId, isActive: true }
        }),
        prisma.journalEntry.count({
            where: {
                organizationId,
                date: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        }),
        prisma.journalEntry.findFirst({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            select: { entryNumber: true, date: true }
        }),
        // Verificar que los asientos están balanceados
        prisma.journalEntry.groupBy({
            by: ['entryNumber'],
            where: { organizationId },
            _sum: {
                debit: true,
                credit: true
            }
        })
    ])

    const isBalanced = balanceCheck.every(entry =>
        Math.abs((entry._sum.debit?.toNumber() || 0) - (entry._sum.credit?.toNumber() || 0)) < 0.01
    )

    return NextResponse.json({
        totalAccounts,
        monthlyEntries: entriesThisMonth,
        lastEntry: lastEntry?.entryNumber || null,
        lastEntryDate: lastEntry?.date || null,
        isBalanced
    })
}