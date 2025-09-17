import { prisma } from '@/lib/prisma'
import { StandardChartService } from './standard-chart'
import { Decimal } from '@prisma/client/runtime/library'
import { Currency } from '@prisma/client'

export class AutoAccountingService {

    /**
     * Genera asiento automático desde una transacción
     */
    static async createTransactionEntry(transactionId: string) {
        try {
            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId },
                include: {
                    organization: { select: { enableAccounting: true } },
                    cashBox: true,
                    bankAccount: true,
                    project: { select: { name: true } }
                }
            })

            if (!transaction?.organization.enableAccounting) return null

            // Obtener cuentas principales
            const accounts = await StandardChartService.getMainAccounts(transaction.organizationId)
            if (!accounts) return null

            const entries = []
            let description = `${transaction.type === 'INCOME' ? 'Ingreso' : 'Egreso'} - ${transaction.description}`

            if (transaction.project) {
                description += ` (Proyecto: ${transaction.project.name})`
            }

            if (transaction.type === 'INCOME') {
                // Ingreso: Débito Caja/Banco, Crédito Ingresos
                entries.push({
                    debitAccountId: accounts.cashAccount?.id,
                    amount: transaction.amount,
                    currency: transaction.currency
                })
                entries.push({
                    creditAccountId: accounts.incomeAccount?.id,
                    amount: transaction.amount,
                    currency: transaction.currency
                })
            } else {
                // Egreso: Débito Gastos, Crédito Caja/Banco
                entries.push({
                    debitAccountId: accounts.expenseAccount?.id,
                    amount: transaction.amount,
                    currency: transaction.currency
                })
                entries.push({
                    creditAccountId: accounts.cashAccount?.id,
                    amount: transaction.amount,
                    currency: transaction.currency
                })
            }

            return await this.createJournalEntry({
                organizationId: transaction.organizationId,
                description,
                entries,
                sourceType: 'TRANSACTION',
                sourceId: transactionId,
                isAutomatic: true
            })

        } catch (error) {
            console.error('Error creating transaction entry:', error)
            return null
        }
    }

    /**
     * Genera asiento automático desde una nómina
     * Regla simplificada:
     *  - Débito: Gastos de Sueldos (cuenta de gasto)
     *  - Crédito: Deducciones (cuenta de pasivo) si existen
     *  - Crédito: Caja/Banco por Net Pay (pago efectivo/transferencia)
     */
    static async createPayrollEntry(payrollId: string) {
        try {
            const payroll = await prisma.payroll.findUnique({
                where: { id: payrollId },
                include: {
                    organization: { select: { enableAccounting: true } },
                    cashBox: true,
                    bankAccount: true,
                    // employee: true // Opcional si se necesita traza por empleado
                }
            })

            if (!payroll?.organization.enableAccounting) return null

            // Obtener cuentas relevantes desde el plan estándar
            const accounts = await StandardChartService.getMainAccounts(payroll.organizationId)
            if (!accounts) return null

            const entries: any[] = []
            const description = `Nómina - ${payroll.employeeName} (${payroll.period})`

            const grossPay = (payroll.baseSalary || 0) + (payroll.overtimePay || 0) + (payroll.bonuses || 0)
            const deductions = payroll.deductions || 0
            const netPay = payroll.netPay || (grossPay - deductions)

            // Débito: Gastos de Sueldos (usaremos expenseAccount si existe)
            if (accounts.payrollExpenseAccount?.id) {
                entries.push({
                    debitAccountId: accounts.payrollExpenseAccount.id,
                    amount: grossPay,
                    currency: payroll.currency
                })
            } else {
                // Fallback a expenseAccount general
                entries.push({
                    debitAccountId: accounts.expenseAccount?.id,
                    amount: grossPay,
                    currency: payroll.currency
                })
            }

            // Crédito: Deducciones a cuenta de pasivo (si hay)
            if (deductions > 0) {
                const deductionsAccount = accounts.payrollDeductionsAccount || accounts.payrollLiabilityAccount || accounts.payableAccount
                if (deductionsAccount?.id) {
                    entries.push({
                        creditAccountId: deductionsAccount.id,
                        amount: deductions,
                        currency: payroll.currency
                    })
                }
            }

            // Crédito: Caja/Banco por neto pagado
            // Preferir bankAccount -> cashBox
            if (payroll.bankAccountId && accounts.cashAccount?.id) {
                entries.push({
                    creditAccountId: accounts.cashAccount.id,
                    amount: netPay,
                    currency: payroll.currency
                })
            } else if (payroll.cashBoxId && accounts.cashAccount?.id) {
                entries.push({
                    creditAccountId: accounts.cashAccount.id,
                    amount: netPay,
                    currency: payroll.currency
                })
            } else if (accounts.cashAccount?.id) {
                entries.push({
                    creditAccountId: accounts.cashAccount.id,
                    amount: netPay,
                    currency: payroll.currency
                })
            }

            // Validar y crear asiento
            if (entries.length > 0) {
                return await this.createJournalEntry({
                    organizationId: payroll.organizationId,
                    description,
                    entries,
                    sourceType: 'PAYROLL',
                    sourceId: payrollId,
                    isAutomatic: true
                })
            }

        } catch (error) {
            console.error('Error creating payroll entry:', error)
            return null
        }
    }

    /**
     * Genera asiento automático desde un pago de factura
     */
    static async createBillPaymentEntry(billPaymentId: string) {
        try {
            const billPayment = await prisma.billPayment.findUnique({
                where: { id: billPaymentId },
                include: {
                    bill: {
                        include: {
                            billRubros: {
                                include: { rubro: true }
                            },
                            client: { select: { name: true } },
                            provider: { select: { name: true } },
                            project: { select: { name: true } }
                        }
                    },
                    organization: { select: { enableAccounting: true } }
                }
            })

            if (!billPayment?.organization.enableAccounting) return null

            const bill = billPayment.bill
            const entries = []
            let description = `Pago Bill #${bill.number}`

            if (bill.client) description += ` - Cliente: ${bill.client.name}`
            if (bill.provider) description += ` - Proveedor: ${bill.provider.name}`
            if (bill.project) description += ` (${bill.project.name})`

            if (bill.type === 'CLIENT') {
                // Pago de cliente (cobranza)
                // Débito: Caja/Banco, Crédito: Cuentas por Cobrar

                const cashAccount = await StandardChartService.getAccountByCode(bill.organizationId, '1.1.01')
                const clientsAccount = await StandardChartService.getAccountByCode(bill.organizationId, '1.1.03')

                if (cashAccount && clientsAccount) {
                    entries.push({
                        debitAccountId: cashAccount.id,
                        amount: billPayment.amount.toNumber(),
                        currency: billPayment.currency
                    })
                    entries.push({
                        creditAccountId: clientsAccount.id,
                        amount: billPayment.amount.toNumber(),
                        currency: billPayment.currency
                    })
                }

            } else {
                // Pago a proveedor
                // Débito: Cuentas por Pagar, Crédito: Caja/Banco

                const providersAccount = await StandardChartService.getAccountByCode(bill.organizationId, '2.1.01')
                const cashAccount = await StandardChartService.getAccountByCode(bill.organizationId, '1.1.01')

                if (providersAccount && cashAccount) {
                    entries.push({
                        debitAccountId: providersAccount.id,
                        amount: billPayment.amount.toNumber(),
                        currency: billPayment.currency
                    })
                    entries.push({
                        creditAccountId: cashAccount.id,
                        amount: billPayment.amount.toNumber(),
                        currency: billPayment.currency
                    })
                }
            }

            if (entries.length > 0) {
                return await this.createJournalEntry({
                    organizationId: bill.organizationId,
                    description,
                    entries,
                    sourceType: 'BILL_PAYMENT',
                    sourceId: billPaymentId,
                    isAutomatic: true
                })
            }

        } catch (error) {
            console.error('Error creating bill payment entry:', error)
            return null
        }
    }

    /**
     * Genera asiento automático cuando se crea una factura (reconocimiento de ingreso/gasto)
     */
    static async createBillEntry(billId: string) {
        try {
            const bill = await prisma.bill.findUnique({
                where: { id: billId },
                include: {
                    billRubros: {
                        include: { rubro: true }
                    },
                    client: { select: { name: true } },
                    provider: { select: { name: true } },
                    project: { select: { name: true } },
                    organization: { select: { enableAccounting: true } }
                }
            })

            if (!bill?.organization.enableAccounting) return null

            const entries = []
            let description = `Bill #${bill.number}`

            if (bill.client) description += ` - Cliente: ${bill.client.name}`
            if (bill.provider) description += ` - Proveedor: ${bill.provider.name}`
            if (bill.project) description += ` (${bill.project.name})`

            if (bill.type === 'CLIENT') {
                // Factura de cliente (reconocimiento de ingreso)
                // Débito: Cuentas por Cobrar, Crédito: Ingresos por rubro

                const clientsAccount = await StandardChartService.getAccountByCode(bill.organizationId, '1.1.03')

                if (clientsAccount) {
                    entries.push({
                        debitAccountId: clientsAccount.id,
                        amount: bill.total.toNumber(),
                        currency: 'PESOS' // Default currency for bills
                    })

                    // Distribuir por rubros
                    for (const rubroItem of bill.billRubros) {
                        const rubroAmount = (bill.total.toNumber() * rubroItem.percentage.toNumber()) / 100
                        const incomeAccount = await StandardChartService.getAccountForRubro(
                            bill.organizationId,
                            rubroItem.rubro.name,
                            true // is income
                        )

                        if (incomeAccount) {
                            entries.push({
                                creditAccountId: incomeAccount.id,
                                amount: rubroAmount,
                                currency: 'PESOS'
                            })
                        }
                    }
                }

            } else {
                // Factura de proveedor (reconocimiento de gasto)
                // Débito: Gastos por rubro, Crédito: Cuentas por Pagar

                const providersAccount = await StandardChartService.getAccountByCode(bill.organizationId, '2.1.01')

                if (providersAccount) {
                    // Distribuir gastos por rubros
                    for (const rubroItem of bill.billRubros) {
                        const rubroAmount = (bill.total.toNumber() * rubroItem.percentage.toNumber()) / 100
                        const expenseAccount = await StandardChartService.getAccountForRubro(
                            bill.organizationId,
                            rubroItem.rubro.name,
                            false // is expense
                        )

                        if (expenseAccount) {
                            entries.push({
                                debitAccountId: expenseAccount.id,
                                amount: rubroAmount,
                                currency: 'PESOS'
                            })
                        }
                    }

                    entries.push({
                        creditAccountId: providersAccount.id,
                        amount: bill.total.toNumber(),
                        currency: 'PESOS'
                    })
                }
            }

            if (entries.length > 0) {
                return await this.createJournalEntry({
                    organizationId: bill.organizationId,
                    description,
                    entries,
                    sourceType: 'BILL',
                    sourceId: billId,
                    isAutomatic: true
                })
            }

        } catch (error) {
            console.error('Error creating bill entry:', error)
            return null
        }
    }

    /**
     * Genera asiento automático desde un pago genérico
     */
    static async createPaymentEntry(paymentId: string) {
        try {
            const payment = await prisma.payment.findUnique({
                where: { id: paymentId },
                include: {
                    client: { select: { name: true } },
                    provider: { select: { name: true } },
                    project: { select: { name: true } },
                    rubro: { select: { name: true } },
                    organization: { select: { enableAccounting: true } }
                }
            })

            if (!payment?.organization.enableAccounting) return null

            const entries = []
            let description = `Pago - ${payment.description || 'Sin descripción'}`

            if (payment.client) description += ` - Cliente: ${payment.client.name}`
            if (payment.provider) description += ` - Proveedor: ${payment.provider.name}`
            if (payment.project) description += ` (${payment.project.name})`

            // Determinar cuentas según el contexto
            if (payment.client) {
                // Pago de cliente (ingreso) - usar cuenta de ventas
                const cashAccount = await StandardChartService.getAccountByCode(payment.organizationId, '1.1.01')
                const salesIncomeAccount = payment.rubro
                    ? await StandardChartService.getAccountForRubro(payment.organizationId, payment.rubro.name, true)
                    : await StandardChartService.getAccountByCode(payment.organizationId, '4.1.03') // Ingresos por Venta de Materiales

                if (cashAccount && salesIncomeAccount) {
                    entries.push({
                        debitAccountId: cashAccount.id,
                        amount: payment.amount,
                        currency: payment.currency
                    })
                    entries.push({
                        creditAccountId: salesIncomeAccount.id,
                        amount: payment.amount,
                        currency: payment.currency
                    })
                }

            } else if (payment.provider) {
                // Pago a proveedor (egreso)
                const expenseAccount = payment.rubro
                    ? await StandardChartService.getAccountForRubro(payment.organizationId, payment.rubro.name, false)
                    : await StandardChartService.getAccountByCode(payment.organizationId, '5.1.01')
                const cashAccount = await StandardChartService.getAccountByCode(payment.organizationId, '1.1.01')

                if (expenseAccount && cashAccount) {
                    entries.push({
                        debitAccountId: expenseAccount.id,
                        amount: payment.amount,
                        currency: payment.currency
                    })
                    entries.push({
                        creditAccountId: cashAccount.id,
                        amount: payment.amount,
                        currency: payment.currency
                    })
                }
            }

            if (entries.length > 0) {
                return await this.createJournalEntry({
                    organizationId: payment.organizationId,
                    description,
                    entries,
                    sourceType: 'PAYMENT',
                    sourceId: paymentId,
                    isAutomatic: true
                })
            }

        } catch (error) {
            console.error('Error creating payment entry:', error)
            return null
        }
    }

    /**
     * Método interno para crear asientos contables
     */
    private static async createJournalEntry(data: {
        organizationId: string
        description: string
        entries: Array<{
            debitAccountId?: string
            creditAccountId?: string
            amount: number
            currency: string
        }>
        sourceType: string
        sourceId: string
        isAutomatic: boolean
    }) {
        try {
            // Validar balance
            const totalDebits = data.entries
                .filter(e => e.debitAccountId)
                .reduce((sum, e) => sum + e.amount, 0)

            const totalCredits = data.entries
                .filter(e => e.creditAccountId)
                .reduce((sum, e) => sum + e.amount, 0)

            if (Math.abs(totalDebits - totalCredits) > 0.01) {
                console.error('Asiento desbalanceado:', { totalDebits, totalCredits, data })
                return null
            }

            // Generar número correlativo
            const lastEntry = await prisma.journalEntry.findFirst({
                where: { organizationId: data.organizationId },
                orderBy: { entryNumber: 'desc' }
            })

            const nextNumber = lastEntry
                ? String(parseInt(lastEntry.entryNumber) + 1).padStart(6, '0')
                : '000001'

            // Crear asientos en transacción
            const journalEntries = await prisma.$transaction(async (tx) => {
                const createdEntries = []

                for (const entry of data.entries) {
                    if (entry.debitAccountId) {
                        const journalEntry = await tx.journalEntry.create({
                            data: {
                                entryNumber: nextNumber,
                                date: new Date(),
                                description: data.description,
                                debit: new Decimal(entry.amount),
                                credit: new Decimal(0),
                                currency: entry.currency as Currency,
                                exchangeRate: new Decimal(1), // Por ahora usar 1, después implementar conversiones
                                debitAccountId: entry.debitAccountId,
                                organizationId: data.organizationId,
                                sourceType: data.sourceType,
                                sourceId: data.sourceId,
                                isAutomatic: data.isAutomatic
                            }
                        })
                        createdEntries.push(journalEntry)
                    }

                    if (entry.creditAccountId) {
                        const journalEntry = await tx.journalEntry.create({
                            data: {
                                entryNumber: nextNumber,
                                date: new Date(),
                                description: data.description,
                                debit: new Decimal(0),
                                credit: new Decimal(entry.amount),
                                currency: entry.currency as Currency,
                                exchangeRate: new Decimal(1), // Por ahora usar 1, después implementar conversiones
                                creditAccountId: entry.creditAccountId,
                                organizationId: data.organizationId,
                                sourceType: data.sourceType,
                                sourceId: data.sourceId,
                                isAutomatic: data.isAutomatic
                            }
                        })
                        createdEntries.push(journalEntry)
                    }
                }

                return createdEntries
            })

            console.log(`Asiento automático ${nextNumber} creado para ${data.sourceType}:${data.sourceId}`)
            return journalEntries

        } catch (error) {
            console.error('Error creating journal entry:', error)
            return null
        }
    }

    /**
     * Verifica si una transacción ya tiene asientos contables
     */
    static async hasJournalEntries(sourceType: string, sourceId: string): Promise<boolean> {
        try {
            const count = await prisma.journalEntry.count({
                where: {
                    sourceType,
                    sourceId
                }
            })
            return count > 0
        } catch (error) {
            console.error('Error checking journal entries:', error)
            return false
        }
    }

    /**
     * Elimina asientos automáticos asociados a una transacción
     */
    static async deleteAutomaticEntries(sourceType: string, sourceId: string) {
        try {
            await prisma.journalEntry.deleteMany({
                where: {
                    sourceType,
                    sourceId,
                    isAutomatic: true
                }
            })
            console.log(`Asientos automáticos eliminados para ${sourceType}:${sourceId}`)
        } catch (error) {
            console.error('Error deleting automatic entries:', error)
        }
    }
}