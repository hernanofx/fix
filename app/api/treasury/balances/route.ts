import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            )
        }

        // Obtener todos los balances por cuenta
        const accountBalances = await prisma.accountBalance.findMany({
            where: { organizationId }
        })

        // Obtener información de las cuentas
        const cashBoxes = await prisma.cashBox.findMany({
            where: { organizationId, isActive: true },
            select: { id: true, name: true, currency: true }
        })

        const bankAccounts = await prisma.bankAccount.findMany({
            where: { organizationId, isActive: true },
            select: { id: true, name: true, bankName: true, currency: true }
        })

        // Estructurar la respuesta
        const balances: { [key: string]: any } = {}

        // Procesar cajas
        cashBoxes.forEach(cashBox => {
            const balancesByCurrency: { [key: string]: number } = {
                PESOS: 0,
                USD: 0,
                EUR: 0
            }

            // Obtener balances de AccountBalance
            accountBalances
                .filter(ab => ab.accountId === cashBox.id && ab.accountType === 'CASH_BOX')
                .forEach(ab => {
                    balancesByCurrency[ab.currency] = ab.balance
                })

            balances[cashBox.id] = {
                id: cashBox.id,
                name: cashBox.name,
                type: 'CASH_BOX',
                currency: cashBox.currency,
                balancesByCurrency,
                totalBalance: balancesByCurrency[cashBox.currency] || 0
            }
        })

        // Procesar bancos
        bankAccounts.forEach(bankAccount => {
            const balancesByCurrency: { [key: string]: number } = {
                PESOS: 0,
                USD: 0,
                EUR: 0
            }

            // Obtener balances de AccountBalance
            accountBalances
                .filter(ab => ab.accountId === bankAccount.id && ab.accountType === 'BANK_ACCOUNT')
                .forEach(ab => {
                    balancesByCurrency[ab.currency] = ab.balance
                })

            balances[bankAccount.id] = {
                id: bankAccount.id,
                name: bankAccount.name,
                type: 'BANK_ACCOUNT',
                currency: bankAccount.currency,
                bankName: bankAccount.bankName,
                balancesByCurrency,
                totalBalance: balancesByCurrency[bankAccount.currency] || 0
            }
        })

        // Calcular totales globales por moneda
        const globalBalances = {
            PESOS: Object.values(balances).reduce((sum: number, account: any) =>
                sum + (account.balancesByCurrency?.PESOS || 0), 0),
            USD: Object.values(balances).reduce((sum: number, account: any) =>
                sum + (account.balancesByCurrency?.USD || 0), 0),
            EUR: Object.values(balances).reduce((sum: number, account: any) =>
                sum + (account.balancesByCurrency?.EUR || 0), 0)
        }

        return NextResponse.json({
            accounts: balances,
            globalBalances,
            lastUpdated: new Date().toISOString()
        })

    } catch (error) {
        console.error('Error fetching balances:', error)
        return NextResponse.json(
            { error: 'Failed to fetch balances' },
            { status: 500 }
        )
    }
}