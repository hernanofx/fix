import { prisma } from '@/lib/prisma'
import { AccountType } from '@prisma/client'

// Plan de cuentas estándar para empresas de construcción
export const STANDARD_CHART_OF_ACCOUNTS = [
    // ACTIVOS - Nivel 1
    { code: '1', name: 'ACTIVO', type: 'ACTIVO' as AccountType, parentCode: null, subType: null },

    // ACTIVOS CORRIENTES - Nivel 2
    { code: '1.1', name: 'Activo Corriente', type: 'ACTIVO' as AccountType, parentCode: '1', subType: 'CORRIENTE' },
    { code: '1.1.01', name: 'Caja y Bancos', type: 'ACTIVO' as AccountType, parentCode: '1.1', subType: 'CORRIENTE' },
    { code: '1.1.02', name: 'Inversiones Temporales', type: 'ACTIVO' as AccountType, parentCode: '1.1', subType: 'CORRIENTE' },
    { code: '1.1.03', name: 'Cuentas por Cobrar Comerciales', type: 'ACTIVO' as AccountType, parentCode: '1.1', subType: 'CORRIENTE' },
    { code: '1.1.04', name: 'Otras Cuentas por Cobrar', type: 'ACTIVO' as AccountType, parentCode: '1.1', subType: 'CORRIENTE' },
    { code: '1.1.05', name: 'Inventarios', type: 'ACTIVO' as AccountType, parentCode: '1.1', subType: 'CORRIENTE' },
    { code: '1.1.06', name: 'Gastos Pagados por Anticipado', type: 'ACTIVO' as AccountType, parentCode: '1.1', subType: 'CORRIENTE' },

    // ACTIVOS NO CORRIENTES - Nivel 2
    { code: '1.2', name: 'Activo No Corriente', type: 'ACTIVO' as AccountType, parentCode: '1', subType: 'NO_CORRIENTE' },
    { code: '1.2.01', name: 'Propiedades, Planta y Equipo', type: 'ACTIVO' as AccountType, parentCode: '1.2', subType: 'NO_CORRIENTE' },
    { code: '1.2.02', name: 'Depreciación Acumulada', type: 'ACTIVO' as AccountType, parentCode: '1.2', subType: 'NO_CORRIENTE' },
    { code: '1.2.03', name: 'Activos Intangibles', type: 'ACTIVO' as AccountType, parentCode: '1.2', subType: 'NO_CORRIENTE' },

    // PASIVOS - Nivel 1
    { code: '2', name: 'PASIVO', type: 'PASIVO' as AccountType, parentCode: null, subType: null },

    // PASIVOS CORRIENTES - Nivel 2
    { code: '2.1', name: 'Pasivo Corriente', type: 'PASIVO' as AccountType, parentCode: '2', subType: 'CORRIENTE' },
    { code: '2.1.01', name: 'Cuentas por Pagar Comerciales', type: 'PASIVO' as AccountType, parentCode: '2.1', subType: 'CORRIENTE' },
    { code: '2.1.02', name: 'Otras Cuentas por Pagar', type: 'PASIVO' as AccountType, parentCode: '2.1', subType: 'CORRIENTE' },
    { code: '2.1.03', name: 'Sueldos y Cargas Sociales por Pagar', type: 'PASIVO' as AccountType, parentCode: '2.1', subType: 'CORRIENTE' },
    { code: '2.1.04', name: 'Impuestos por Pagar', type: 'PASIVO' as AccountType, parentCode: '2.1', subType: 'CORRIENTE' },
    { code: '2.1.05', name: 'Préstamos a Corto Plazo', type: 'PASIVO' as AccountType, parentCode: '2.1', subType: 'CORRIENTE' },
    { code: '2.1.06', name: 'Ingresos Diferidos', type: 'PASIVO' as AccountType, parentCode: '2.1', subType: 'CORRIENTE' },

    // PASIVOS NO CORRIENTES - Nivel 2
    { code: '2.2', name: 'Pasivo No Corriente', type: 'PASIVO' as AccountType, parentCode: '2', subType: 'NO_CORRIENTE' },
    { code: '2.2.01', name: 'Préstamos a Largo Plazo', type: 'PASIVO' as AccountType, parentCode: '2.2', subType: 'NO_CORRIENTE' },
    { code: '2.2.02', name: 'Hipotecas por Pagar', type: 'PASIVO' as AccountType, parentCode: '2.2', subType: 'NO_CORRIENTE' },

    // PATRIMONIO - Nivel 1
    { code: '3', name: 'PATRIMONIO NETO', type: 'PATRIMONIO' as AccountType, parentCode: null, subType: null },
    { code: '3.1', name: 'Capital Social', type: 'PATRIMONIO' as AccountType, parentCode: '3', subType: null },
    { code: '3.2', name: 'Reservas', type: 'PATRIMONIO' as AccountType, parentCode: '3', subType: null },
    { code: '3.3', name: 'Resultados Acumulados', type: 'PATRIMONIO' as AccountType, parentCode: '3', subType: null },
    { code: '3.4', name: 'Resultado del Ejercicio', type: 'PATRIMONIO' as AccountType, parentCode: '3', subType: null },

    // INGRESOS - Nivel 1
    { code: '4', name: 'INGRESOS', type: 'INGRESO' as AccountType, parentCode: null, subType: null },

    // INGRESOS OPERACIONALES - Nivel 2
    { code: '4.1', name: 'Ingresos Operacionales', type: 'INGRESO' as AccountType, parentCode: '4', subType: 'OPERACIONAL' },
    { code: '4.1.01', name: 'Ingresos por Construcción', type: 'INGRESO' as AccountType, parentCode: '4.1', subType: 'OPERACIONAL' },
    { code: '4.1.02', name: 'Ingresos por Servicios', type: 'INGRESO' as AccountType, parentCode: '4.1', subType: 'OPERACIONAL' },
    { code: '4.1.03', name: 'Ingresos por Venta de Materiales', type: 'INGRESO' as AccountType, parentCode: '4.1', subType: 'OPERACIONAL' },

    // INGRESOS NO OPERACIONALES - Nivel 2
    { code: '4.2', name: 'Ingresos No Operacionales', type: 'INGRESO' as AccountType, parentCode: '4', subType: 'NO_OPERACIONAL' },
    { code: '4.2.01', name: 'Ingresos Financieros', type: 'INGRESO' as AccountType, parentCode: '4.2', subType: 'NO_OPERACIONAL' },
    { code: '4.2.02', name: 'Otros Ingresos', type: 'INGRESO' as AccountType, parentCode: '4.2', subType: 'NO_OPERACIONAL' },

    // EGRESOS - Nivel 1
    { code: '5', name: 'EGRESOS', type: 'EGRESO' as AccountType, parentCode: null, subType: null },

    // COSTOS DIRECTOS - Nivel 2
    { code: '5.1', name: 'Costos Directos', type: 'EGRESO' as AccountType, parentCode: '5', subType: 'COSTO_DIRECTO' },
    { code: '5.1.01', name: 'Materiales de Construcción', type: 'EGRESO' as AccountType, parentCode: '5.1', subType: 'COSTO_DIRECTO' },
    { code: '5.1.02', name: 'Mano de Obra Directa', type: 'EGRESO' as AccountType, parentCode: '5.1', subType: 'COSTO_DIRECTO' },
    { code: '5.1.03', name: 'Subcontratistas', type: 'EGRESO' as AccountType, parentCode: '5.1', subType: 'COSTO_DIRECTO' },
    { code: '5.1.04', name: 'Maquinaria y Equipos', type: 'EGRESO' as AccountType, parentCode: '5.1', subType: 'COSTO_DIRECTO' },

    // GASTOS ADMINISTRATIVOS - Nivel 2
    { code: '5.2', name: 'Gastos Administrativos', type: 'EGRESO' as AccountType, parentCode: '5', subType: 'GASTO_ADMIN' },
    { code: '5.2.01', name: 'Sueldos Administrativos', type: 'EGRESO' as AccountType, parentCode: '5.2', subType: 'GASTO_ADMIN' },
    { code: '5.2.02', name: 'Servicios Públicos', type: 'EGRESO' as AccountType, parentCode: '5.2', subType: 'GASTO_ADMIN' },
    { code: '5.2.03', name: 'Gastos de Oficina', type: 'EGRESO' as AccountType, parentCode: '5.2', subType: 'GASTO_ADMIN' },
    { code: '5.2.04', name: 'Depreciaciones', type: 'EGRESO' as AccountType, parentCode: '5.2', subType: 'GASTO_ADMIN' },

    // GASTOS FINANCIEROS - Nivel 2
    { code: '5.3', name: 'Gastos Financieros', type: 'EGRESO' as AccountType, parentCode: '5', subType: 'GASTO_FINANCIERO' },
    { code: '5.3.01', name: 'Intereses por Préstamos', type: 'EGRESO' as AccountType, parentCode: '5.3', subType: 'GASTO_FINANCIERO' },
    { code: '5.3.02', name: 'Comisiones Bancarias', type: 'EGRESO' as AccountType, parentCode: '5.3', subType: 'GASTO_FINANCIERO' },
]

// Mapeo de rubros a cuentas contables (para automatización)
export const RUBRO_TO_ACCOUNT_MAPPING: Record<string, { income: string; expense: string }> = {
    // Materiales
    'MATERIALES': { income: '4.1.03', expense: '5.1.01' },
    'MATERIALES_CONSTRUCCION': { income: '4.1.03', expense: '5.1.01' },

    // Mano de obra
    'MANO_OBRA': { income: '4.1.01', expense: '5.1.02' },
    'PERSONAL': { income: '4.1.01', expense: '5.1.02' },

    // Subcontratistas
    'SUBCONTRATISTAS': { income: '4.1.01', expense: '5.1.03' },
    'TERCEROS': { income: '4.1.01', expense: '5.1.03' },

    // Maquinaria
    'MAQUINARIA': { income: '4.1.02', expense: '5.1.04' },
    'EQUIPOS': { income: '4.1.02', expense: '5.1.04' },

    // Administrativos
    'ADMINISTRATIVOS': { income: '4.2.02', expense: '5.2.03' },
    'OFICINA': { income: '4.2.02', expense: '5.2.03' },

    // Default para rubros no categorizados
    'DEFAULT': { income: '4.1.01', expense: '5.1.01' }
}

export interface StandardAccountData {
    code: string
    name: string
    type: AccountType
    parentCode: string | null
    subType: string | null
}

export class StandardChartService {

    /**
     * Crea el plan de cuentas estándar para una organización
     */
    static async setupStandardChart(organizationId: string): Promise<Map<string, any>> {
        const accountsMap = new Map()

        try {
            // Crear cuentas en orden jerárquico
            for (const accountData of STANDARD_CHART_OF_ACCOUNTS) {
                const parentId = accountData.parentCode
                    ? accountsMap.get(accountData.parentCode)?.id
                    : null

                const account = await prisma.account.create({
                    data: {
                        code: accountData.code,
                        name: accountData.name,
                        type: accountData.type,
                        subType: accountData.subType,
                        parentId,
                        organizationId,
                        isActive: true,
                        description: `Cuenta estándar del plan contable - ${accountData.name}`
                    }
                })

                accountsMap.set(accountData.code, account)
            }

            console.log(`Plan de cuentas estándar creado para organización ${organizationId}`)
            return accountsMap
        } catch (error) {
            console.error('Error creando plan de cuentas estándar:', error)
            throw error
        }
    }

    /**
     * Obtiene la cuenta contable para un rubro específico
     */
    static async getAccountForRubro(
        organizationId: string,
        rubroName: string,
        isIncome: boolean = false
    ): Promise<any | null> {
        try {
            // Normalizar nombre del rubro
            const normalizedRubro = rubroName.toUpperCase().replace(/\s+/g, '_')

            // Buscar mapeo específico o usar default
            const mapping = RUBRO_TO_ACCOUNT_MAPPING[normalizedRubro] || RUBRO_TO_ACCOUNT_MAPPING['DEFAULT']
            const accountCode = isIncome ? mapping.income : mapping.expense

            // Buscar cuenta en la base de datos
            const account = await prisma.account.findFirst({
                where: {
                    organizationId,
                    code: accountCode,
                    isActive: true
                }
            })

            return account
        } catch (error) {
            console.error('Error obteniendo cuenta para rubro:', error)
            return null
        }
    }

    /**
     * Obtiene cuenta por código
     */
    static async getAccountByCode(organizationId: string, code: string): Promise<any | null> {
        try {
            return await prisma.account.findFirst({
                where: {
                    organizationId,
                    code,
                    isActive: true
                }
            })
        } catch (error) {
            console.error('Error obteniendo cuenta por código:', error)
            return null
        }
    }

    /**
     * Obtiene cuentas principales para automatización de transacciones
     */
    static async getMainAccounts(organizationId: string) {
        try {
            const [cashAccount, clientsAccount, providersAccount, incomeAccount, expenseAccount] = await Promise.all([
                this.getAccountByCode(organizationId, '1.1.01'), // Caja y Bancos
                this.getAccountByCode(organizationId, '1.1.03'), // Cuentas por Cobrar
                this.getAccountByCode(organizationId, '2.1.01'), // Cuentas por Pagar
                this.getAccountByCode(organizationId, '4.1.01'), // Ingresos por Construcción
                this.getAccountByCode(organizationId, '5.1.01'), // Materiales de Construcción
            ])

            // Cuentas adicionales útiles para nómina
            const payrollExpenseAccount = await this.getAccountByCode(organizationId, '5.2.01') // Sueldos Administrativos
            const payrollDeductionsAccount = await this.getAccountByCode(organizationId, '2.1.03') // Sueldos y Cargas Sociales por Pagar
            const payrollLiabilityAccount = payrollDeductionsAccount
            const payableAccount = providersAccount

            return {
                cashAccount,
                clientsAccount,
                providersAccount,
                incomeAccount,
                expenseAccount,
                // payroll specific
                payrollExpenseAccount,
                payrollDeductionsAccount,
                payrollLiabilityAccount,
                payableAccount
            }
        } catch (error) {
            console.error('Error obteniendo cuentas principales:', error)
            return null
        }
    }

    /**
     * Verifica si una organización tiene el plan de cuentas configurado
     */
    static async hasStandardChart(organizationId: string): Promise<boolean> {
        try {
            const accountsCount = await prisma.account.count({
                where: { organizationId }
            })

            return accountsCount > 0
        } catch (error) {
            console.error('Error verificando plan de cuentas:', error)
            return false
        }
    }

    /**
     * Obtiene estadísticas del plan de cuentas
     */
    static async getChartStats(organizationId: string) {
        try {
            const [totalAccounts, activeAccounts, accountsByType] = await Promise.all([
                prisma.account.count({
                    where: { organizationId }
                }),
                prisma.account.count({
                    where: { organizationId, isActive: true }
                }),
                prisma.account.groupBy({
                    by: ['type'],
                    where: { organizationId, isActive: true },
                    _count: true
                })
            ])

            return {
                totalAccounts,
                activeAccounts,
                accountsByType: accountsByType.reduce((acc, item) => {
                    acc[item.type] = item._count
                    return acc
                }, {} as Record<string, number>)
            }
        } catch (error) {
            console.error('Error obteniendo estadísticas del plan de cuentas:', error)
            return null
        }
    }
}