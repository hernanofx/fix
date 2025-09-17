import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { AutoAccountingService } from '@/lib/accounting/auto-accounting'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const payrolls = await prisma.payroll.findMany({
            where: { organizationId },
            include: {
                cashBox: true,
                bankAccount: true,
                transaction: true
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(payrolls)
    } catch (error) {
        console.error('Error fetching payrolls:', error)
        return NextResponse.json({ error: 'Error fetching payrolls' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { organizationId, createdById } = body

        if (!organizationId) return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        if (!createdById) return NextResponse.json({ error: 'createdById is required' }, { status: 400 })

        // validate related records exist to avoid FK violations
        const orgExists = await prisma.organization.findUnique({ where: { id: organizationId } })
        if (!orgExists) return NextResponse.json({ error: 'Organization not found' }, { status: 400 })

        const userExists = await prisma.user.findUnique({ where: { id: createdById } })
        if (!userExists) return NextResponse.json({ error: 'createdById user not found' }, { status: 400 })

        const coerceNumber = (v: any) => {
            if (v === null || v === undefined || v === '') return 0
            const n = Number(v)
            return Number.isFinite(n) && !isNaN(n) ? n : 0
        }

        // Validate required fields
        if (!body.employeeName) {
            return NextResponse.json({ error: 'employeeName is required' }, { status: 400 })
        }

        // Validate payment method
        if (body.paymentMethod === 'cashBox' && !body.cashBoxId) {
            return NextResponse.json({ error: 'cashBoxId is required when paymentMethod is cashBox' }, { status: 400 })
        }
        if (body.paymentMethod === 'bankAccount' && !body.bankAccountId) {
            return NextResponse.json({ error: 'bankAccountId is required when paymentMethod is bankAccount' }, { status: 400 })
        }

        const data: any = {
            organizationId,
            createdById,
            employeeId: body.employeeId || null,
            employeeName: body.employeeName.trim(),
            employeePosition: body.employeePosition || '',
            period: body.period || '',
            baseSalary: coerceNumber(body.baseSalary),
            overtimeHours: coerceNumber(body.overtimeHours),
            overtimeRate: coerceNumber(body.overtimeRate) || 1.5,
            overtimePay: coerceNumber(body.overtimePay),
            bonuses: coerceNumber(body.bonuses),
            deductions: coerceNumber(body.deductions),
            deductionsDetail: body.deductionsDetail || '',
            currency: body.currency || 'PESOS',
            cashBoxId: body.paymentMethod === 'cashBox' ? body.cashBoxId : null,
            bankAccountId: body.paymentMethod === 'bankAccount' ? body.bankAccountId : null,
        }

        // Recalculate netPay server-side to ensure consistency
        data.netPay = (data.baseSalary || 0) + (data.overtimePay || 0) + (data.bonuses || 0) - (data.deductions || 0)

        console.log('Creating payroll with data:', JSON.stringify(data, null, 2))

        // Create payroll and transaction in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the payroll
            const payroll = await tx.payroll.create({ data })

            // Create the transaction for treasury
            const transactionData = {
                amount: data.netPay,
                description: `Nómina ${data.employeeName} - ${data.period}`,
                type: 'EXPENSE' as const,
                category: 'Nómina',
                currency: data.currency,
                date: new Date(),
                reference: `PAY-${payroll.id}`,
                notes: `Pago de nómina para ${data.employeeName} correspondiente al período ${data.period}`,
                organizationId,
                projectId: null,
                cashBoxId: data.cashBoxId,
                bankAccountId: data.bankAccountId,
            }

            const transaction = await tx.transaction.create({ data: transactionData })

            // Update payroll with transaction reference
            await tx.payroll.update({
                where: { id: payroll.id },
                data: { transactionId: transaction.id }
            })

            // Update transaction with payroll reference
            await tx.transaction.update({
                where: { id: transaction.id },
                data: { payrollId: payroll.id }
            })

            // Update AccountBalance for the expense (egreso)
            const amount = new Decimal(data.netPay).toNumber()
            const adjustment = -amount // Es un egreso, así que decrementar el balance

            if (data.cashBoxId) {
                await tx.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: data.cashBoxId,
                            accountType: 'CASH_BOX',
                            currency: data.currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: data.cashBoxId,
                        accountType: 'CASH_BOX',
                        currency: data.currency,
                        balance: adjustment,
                        organizationId: organizationId,
                        updatedAt: new Date()
                    }
                })
            } else if (data.bankAccountId) {
                await tx.accountBalance.upsert({
                    where: {
                        accountId_accountType_currency: {
                            accountId: data.bankAccountId,
                            accountType: 'BANK_ACCOUNT',
                            currency: data.currency
                        }
                    },
                    update: {
                        balance: { increment: adjustment },
                        updatedAt: new Date()
                    },
                    create: {
                        accountId: data.bankAccountId,
                        accountType: 'BANK_ACCOUNT',
                        currency: data.currency,
                        balance: adjustment,
                        organizationId: organizationId,
                        updatedAt: new Date()
                    }
                })
            }

            return { payroll, transaction }
        })

        console.log('Payroll and transaction created successfully:', result.payroll.id, result.transaction.id)

        // Generar asiento contable automático si la organización tiene contabilidad habilitada
        try {
            await AutoAccountingService.createPayrollEntry(result.payroll.id)
        } catch (accountingError) {
            console.error('Error creating payroll accounting entry:', accountingError)
            // No fallar la creación de payroll por error en contabilidad
        }

        // Fetch the complete payroll with relations for response
        const completePayroll = await prisma.payroll.findUnique({
            where: { id: result.payroll.id },
            include: {
                cashBox: true,
                bankAccount: true,
                transaction: true
            }
        })

        return NextResponse.json(completePayroll, { status: 201 })
    } catch (error: any) {
        console.error('Error creating payroll:', error?.message || error)
        console.error('Error stack:', error?.stack || error)
        return NextResponse.json({ error: 'Error creating payroll: ' + (error?.message || 'Unknown error') }, { status: 500 })
    }
}
