import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AutoAccountingService } from '@/lib/accounting/auto-accounting'

const prisma = new PrismaClient()

// Función para parsear fechas en formato YYYY-MM-DD como zona horaria local
function parseLocalDate(dateString: string): Date {
    // Si la fecha viene en formato YYYY-MM-DD, parsearla manualmente
    // para evitar problemas de zona horaria UTC
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        // Crear fecha en zona horaria local (meses son 0-indexed en Date)
        return new Date(year, month - 1, day)
    }
    // Si no es formato YYYY-MM-DD, usar el constructor normal
    return new Date(dateString)
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const sortField = searchParams.get('sortField') || 'date'
        const sortDirection = searchParams.get('sortDirection') || 'desc'

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            )
        }

        // Construir el orderBy dinámicamente
        let orderBy: any = {}
        if (sortField && sortDirection) {
            if (sortField === 'date') {
                orderBy.date = sortDirection
            } else if (sortField === 'description') {
                orderBy.description = sortDirection
            } else if (sortField === 'category') {
                orderBy.category = sortDirection
            } else if (sortField === 'type') {
                // Ordenamiento personalizado por tipo para mantener consistencia con frontend
                // INCOME -> Ingreso, EXPENSE -> Egreso
                // Para ordenar correctamente: Ingreso primero, luego Egreso
                if (sortDirection === 'asc') {
                    // Ingreso (INCOME) primero, luego Egreso (EXPENSE)
                    orderBy.type = 'desc' // INCOME viene después de EXPENSE alfabéticamente
                } else {
                    // Egreso (EXPENSE) primero, luego Ingreso (INCOME)
                    orderBy.type = 'asc'
                }
            } else if (sortField === 'amount') {
                orderBy.amount = sortDirection
            } else if (sortField === 'currency') {
                orderBy.currency = sortDirection
            } else {
                // Default order by date
                orderBy.date = 'desc'
            }
        } else {
            orderBy.date = 'desc'
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                organizationId: organizationId
            },
            select: {
                id: true,
                amount: true,
                description: true,
                type: true,
                category: true,
                currency: true,
                date: true,
                reference: true,
                notes: true,
                organizationId: true,
                projectId: true,
                cashBoxId: true,
                bankAccountId: true,
                createdAt: true,
                updatedAt: true,
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                cashBox: {
                    select: {
                        id: true,
                        name: true,
                        currency: true
                    }
                },
                bankAccount: {
                    select: {
                        id: true,
                        name: true,
                        bankName: true,
                        currency: true
                    }
                }
            },
            orderBy: orderBy
        })

        console.log(`Transacciones encontradas para organización ${organizationId}:`, transactions.length)
        console.log('Referencias de transacciones:', transactions.map(t => ({ id: t.id, reference: t.reference, description: t.description })))

        // Filtrar transacciones relacionadas con facturas
        const billTransactions = transactions.filter(t => t.reference?.startsWith('BILL-PAY-'))
        console.log('🔥 TREASURY GET - Bill transactions found:', billTransactions.map(t => ({ id: t.id, reference: t.reference, description: t.description, amount: t.amount, type: t.type })))

        // Calcular totales del mes actual
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const monthlyTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date)
            return transactionDate >= startOfMonth && transactionDate <= endOfMonth
        })

        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0)

        const monthlyExpense = monthlyTransactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0)

        // Obtener cuentas reales
        const cashBoxes = await prisma.cashBox.findMany({
            where: { organizationId, isActive: true },
            select: {
                id: true,
                name: true,
                currency: true,
                updatedAt: true
            }
        })

        const bankAccounts = await prisma.bankAccount.findMany({
            where: { organizationId, isActive: true },
            select: {
                id: true,
                name: true,
                bankName: true,
                currency: true,
                updatedAt: true
            }
        })

        // Obtener balances por cuenta y moneda
        const accountBalances = await prisma.accountBalance.findMany({
            where: { organizationId }
        })

        // Formatear cuentas para el frontend
        const accounts = [
            ...cashBoxes.map(cb => ({
                id: cb.id,
                name: cb.name,
                type: 'Caja',
                currency: cb.currency,
                balance: 0, // Se calculará desde AccountBalance
                lastUpdate: cb.updatedAt
            })),
            ...bankAccounts.map(ba => ({
                id: ba.id,
                name: ba.name,
                type: 'Banco',
                currency: ba.currency,
                balance: 0, // Se calculará desde AccountBalance
                lastUpdate: ba.updatedAt,
                bankName: ba.bankName
            }))
        ]

        // Calcular balances desde AccountBalance
        const accountsWithBalances = accounts.map((account) => {
            const accountType = account.type === 'Caja' ? 'CASH_BOX' : 'BANK_ACCOUNT'

            // Obtener balances por moneda para esta cuenta
            const balancesByCurrency: { [key: string]: number } = {
                PESOS: 0,
                USD: 0,
                EUR: 0
            }

            accountBalances
                .filter(ab => ab.accountId === account.id && ab.accountType === accountType)
                .forEach(ab => {
                    balancesByCurrency[ab.currency] = ab.balance
                })

            // El balance principal será el de la moneda principal de la cuenta
            let mainBalance = balancesByCurrency[account.currency] || 0

            return {
                ...account,
                balance: mainBalance,
                balancesByCurrency
            }
        })

        // Calcular totales globales por moneda
        const balancesByCurrency = {
            PESOS: accountsWithBalances.reduce((sum, account) => sum + (account.balancesByCurrency?.PESOS || 0), 0),
            USD: accountsWithBalances.reduce((sum, account) => sum + (account.balancesByCurrency?.USD || 0), 0),
            EUR: accountsWithBalances.reduce((sum, account) => sum + (account.balancesByCurrency?.EUR || 0), 0)
        }

        console.log('🔥 TREASURY GET - Global balances by currency:', balancesByCurrency)

        // Mapear tipos para el frontend
        const mappedTransactions = transactions.map(t => ({
            ...t,
            type: t.type === 'INCOME' ? 'Ingreso' : 'Egreso'
        }))

        // Mantener compatibilidad con el frontend que espera accounts y transactions
        return NextResponse.json({
            accounts: accountsWithBalances,
            transactions: mappedTransactions,
            monthlyIncome,
            monthlyExpense,
            balancesByCurrency
        })
    } catch (error) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Crear transacción
        if (body.type === 'transaction') {
            // Validar que la moneda sea proporcionada y válida
            if (!body.currency) {
                return NextResponse.json(
                    { error: 'Currency is required for transactions' },
                    { status: 400 }
                )
            }

            const validCurrencies = ['PESOS', 'USD', 'EUR']
            if (!validCurrencies.includes(body.currency)) {
                return NextResponse.json(
                    { error: 'Invalid currency. Must be PESOS, USD, or EUR' },
                    { status: 400 }
                )
            }

            const transaction = await prisma.transaction.create({
                data: {
                    amount: parseFloat(body.amount),
                    description: body.description,
                    type: body.transactionType || (body.type === 'Ingreso' ? 'INCOME' : 'EXPENSE'), // Usar transactionType si existe
                    category: body.category,
                    currency: body.currency as any, // Cast to any to bypass TypeScript enum validation
                    date: body.date ? parseLocalDate(body.date) : new Date(),
                    reference: body.reference,
                    notes: body.notes,
                    organizationId: body.organizationId,
                    projectId: body.projectId || null,
                    cashBoxId: body.cashBoxId || null,
                    bankAccountId: body.bankAccountId || null
                },
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    cashBox: {
                        select: {
                            id: true,
                            name: true,
                            currency: true
                        }
                    },
                    bankAccount: {
                        select: {
                            id: true,
                            name: true,
                            bankName: true,
                            currency: true
                        }
                    }
                }
            })

            // Actualizar balance en AccountBalance
            const accountId = body.cashBoxId || body.bankAccountId
            const accountType = body.cashBoxId ? 'CASH_BOX' : 'BANK_ACCOUNT'

            if (accountId) {
                const amount = parseFloat(body.amount)
                const transactionType = body.transactionType || (body.type === 'Ingreso' ? 'INCOME' : 'EXPENSE')
                const adjustment = transactionType === 'INCOME' ? amount : -amount

                await prisma.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId,
                            accountType,
                            currency: body.currency
                        }
                    },
                    update: {
                        balance: {
                            increment: adjustment
                        },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId,
                        accountType,
                        currency: body.currency,
                        balance: adjustment,
                        organizationId: body.organizationId,
                        updatedAt: new Date()
                    }
                })
            }

            // Generar asiento contable automático si está habilitado
            try {
                const org = await prisma.organization.findUnique({
                    where: { id: body.organizationId },
                    select: { enableAccounting: true }
                })

                if (org?.enableAccounting) {
                    await AutoAccountingService.createTransactionEntry(transaction.id)
                    console.log(`✅ Auto-accounting: Created journal entry for transaction ${transaction.id}`)
                }
            } catch (accountingError) {
                console.error('Error creating automatic journal entry for transaction:', accountingError)
                // No fallar la operación por error de contabilidad
            }

            return NextResponse.json(transaction, { status: 201 })
        }

        // Para cuentas, por ahora retornamos un objeto simple
        if (body.type === 'account') {
            const account = {
                id: Date.now().toString(),
                ...body
            }
            return NextResponse.json(account)
        }

        return NextResponse.json({ error: 'unknown type' }, { status: 400 })
    } catch (error) {
        console.error('Error creating transaction:', error)
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        )
    }
}
