"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardChartService = exports.RUBRO_TO_ACCOUNT_MAPPING = exports.STANDARD_CHART_OF_ACCOUNTS = void 0;
const prisma_1 = require("@/lib/prisma");
// Plan de cuentas estándar para empresas de construcción
exports.STANDARD_CHART_OF_ACCOUNTS = [
    // ACTIVOS - Nivel 1
    { code: '1', name: 'ACTIVO', type: 'ACTIVO', parentCode: null, subType: null },
    // ACTIVOS CORRIENTES - Nivel 2
    { code: '1.1', name: 'Activo Corriente', type: 'ACTIVO', parentCode: '1', subType: 'CORRIENTE' },
    { code: '1.1.01', name: 'Caja y Bancos', type: 'ACTIVO', parentCode: '1.1', subType: 'CORRIENTE' },
    { code: '1.1.02', name: 'Inversiones Temporales', type: 'ACTIVO', parentCode: '1.1', subType: 'CORRIENTE' },
    { code: '1.1.03', name: 'Cuentas por Cobrar Comerciales', type: 'ACTIVO', parentCode: '1.1', subType: 'CORRIENTE' },
    { code: '1.1.04', name: 'Otras Cuentas por Cobrar', type: 'ACTIVO', parentCode: '1.1', subType: 'CORRIENTE' },
    { code: '1.1.05', name: 'Inventarios', type: 'ACTIVO', parentCode: '1.1', subType: 'CORRIENTE' },
    { code: '1.1.06', name: 'Gastos Pagados por Anticipado', type: 'ACTIVO', parentCode: '1.1', subType: 'CORRIENTE' },
    // ACTIVOS NO CORRIENTES - Nivel 2
    { code: '1.2', name: 'Activo No Corriente', type: 'ACTIVO', parentCode: '1', subType: 'NO_CORRIENTE' },
    { code: '1.2.01', name: 'Propiedades, Planta y Equipo', type: 'ACTIVO', parentCode: '1.2', subType: 'NO_CORRIENTE' },
    { code: '1.2.02', name: 'Depreciación Acumulada', type: 'ACTIVO', parentCode: '1.2', subType: 'NO_CORRIENTE' },
    { code: '1.2.03', name: 'Activos Intangibles', type: 'ACTIVO', parentCode: '1.2', subType: 'NO_CORRIENTE' },
    // PASIVOS - Nivel 1
    { code: '2', name: 'PASIVO', type: 'PASIVO', parentCode: null, subType: null },
    // PASIVOS CORRIENTES - Nivel 2
    { code: '2.1', name: 'Pasivo Corriente', type: 'PASIVO', parentCode: '2', subType: 'CORRIENTE' },
    { code: '2.1.01', name: 'Cuentas por Pagar Comerciales', type: 'PASIVO', parentCode: '2.1', subType: 'CORRIENTE' },
    { code: '2.1.02', name: 'Otras Cuentas por Pagar', type: 'PASIVO', parentCode: '2.1', subType: 'CORRIENTE' },
    { code: '2.1.03', name: 'Sueldos y Cargas Sociales por Pagar', type: 'PASIVO', parentCode: '2.1', subType: 'CORRIENTE' },
    { code: '2.1.04', name: 'Impuestos por Pagar', type: 'PASIVO', parentCode: '2.1', subType: 'CORRIENTE' },
    { code: '2.1.05', name: 'Préstamos a Corto Plazo', type: 'PASIVO', parentCode: '2.1', subType: 'CORRIENTE' },
    { code: '2.1.06', name: 'Ingresos Diferidos', type: 'PASIVO', parentCode: '2.1', subType: 'CORRIENTE' },
    // PASIVOS NO CORRIENTES - Nivel 2
    { code: '2.2', name: 'Pasivo No Corriente', type: 'PASIVO', parentCode: '2', subType: 'NO_CORRIENTE' },
    { code: '2.2.01', name: 'Préstamos a Largo Plazo', type: 'PASIVO', parentCode: '2.2', subType: 'NO_CORRIENTE' },
    { code: '2.2.02', name: 'Hipotecas por Pagar', type: 'PASIVO', parentCode: '2.2', subType: 'NO_CORRIENTE' },
    // PATRIMONIO - Nivel 1
    { code: '3', name: 'PATRIMONIO NETO', type: 'PATRIMONIO', parentCode: null, subType: null },
    { code: '3.1', name: 'Capital Social', type: 'PATRIMONIO', parentCode: '3', subType: null },
    { code: '3.2', name: 'Reservas', type: 'PATRIMONIO', parentCode: '3', subType: null },
    { code: '3.3', name: 'Resultados Acumulados', type: 'PATRIMONIO', parentCode: '3', subType: null },
    { code: '3.4', name: 'Resultado del Ejercicio', type: 'PATRIMONIO', parentCode: '3', subType: null },
    // INGRESOS - Nivel 1
    { code: '4', name: 'INGRESOS', type: 'INGRESO', parentCode: null, subType: null },
    // INGRESOS OPERACIONALES - Nivel 2
    { code: '4.1', name: 'Ingresos Operacionales', type: 'INGRESO', parentCode: '4', subType: 'OPERACIONAL' },
    { code: '4.1.01', name: 'Ingresos por Construcción', type: 'INGRESO', parentCode: '4.1', subType: 'OPERACIONAL' },
    { code: '4.1.02', name: 'Ingresos por Servicios', type: 'INGRESO', parentCode: '4.1', subType: 'OPERACIONAL' },
    { code: '4.1.03', name: 'Ingresos por Venta de Materiales', type: 'INGRESO', parentCode: '4.1', subType: 'OPERACIONAL' },
    // INGRESOS NO OPERACIONALES - Nivel 2
    { code: '4.2', name: 'Ingresos No Operacionales', type: 'INGRESO', parentCode: '4', subType: 'NO_OPERACIONAL' },
    { code: '4.2.01', name: 'Ingresos Financieros', type: 'INGRESO', parentCode: '4.2', subType: 'NO_OPERACIONAL' },
    { code: '4.2.02', name: 'Otros Ingresos', type: 'INGRESO', parentCode: '4.2', subType: 'NO_OPERACIONAL' },
    // EGRESOS - Nivel 1
    { code: '5', name: 'EGRESOS', type: 'EGRESO', parentCode: null, subType: null },
    // COSTOS DIRECTOS - Nivel 2
    { code: '5.1', name: 'Costos Directos', type: 'EGRESO', parentCode: '5', subType: 'COSTO_DIRECTO' },
    { code: '5.1.01', name: 'Materiales de Construcción', type: 'EGRESO', parentCode: '5.1', subType: 'COSTO_DIRECTO' },
    { code: '5.1.02', name: 'Mano de Obra Directa', type: 'EGRESO', parentCode: '5.1', subType: 'COSTO_DIRECTO' },
    { code: '5.1.03', name: 'Subcontratistas', type: 'EGRESO', parentCode: '5.1', subType: 'COSTO_DIRECTO' },
    { code: '5.1.04', name: 'Maquinaria y Equipos', type: 'EGRESO', parentCode: '5.1', subType: 'COSTO_DIRECTO' },
    // GASTOS ADMINISTRATIVOS - Nivel 2
    { code: '5.2', name: 'Gastos Administrativos', type: 'EGRESO', parentCode: '5', subType: 'GASTO_ADMIN' },
    { code: '5.2.01', name: 'Sueldos Administrativos', type: 'EGRESO', parentCode: '5.2', subType: 'GASTO_ADMIN' },
    { code: '5.2.02', name: 'Servicios Públicos', type: 'EGRESO', parentCode: '5.2', subType: 'GASTO_ADMIN' },
    { code: '5.2.03', name: 'Gastos de Oficina', type: 'EGRESO', parentCode: '5.2', subType: 'GASTO_ADMIN' },
    { code: '5.2.04', name: 'Depreciaciones', type: 'EGRESO', parentCode: '5.2', subType: 'GASTO_ADMIN' },
    // GASTOS FINANCIEROS - Nivel 2
    { code: '5.3', name: 'Gastos Financieros', type: 'EGRESO', parentCode: '5', subType: 'GASTO_FINANCIERO' },
    { code: '5.3.01', name: 'Intereses por Préstamos', type: 'EGRESO', parentCode: '5.3', subType: 'GASTO_FINANCIERO' },
    { code: '5.3.02', name: 'Comisiones Bancarias', type: 'EGRESO', parentCode: '5.3', subType: 'GASTO_FINANCIERO' },
];
// Mapeo de rubros a cuentas contables (para automatización)
exports.RUBRO_TO_ACCOUNT_MAPPING = {
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
};
class StandardChartService {
    /**
     * Crea el plan de cuentas estándar para una organización
     */
    static async setupStandardChart(organizationId) {
        const accountsMap = new Map();
        try {
            // Crear cuentas en orden jerárquico
            for (const accountData of exports.STANDARD_CHART_OF_ACCOUNTS) {
                const parentId = accountData.parentCode
                    ? accountsMap.get(accountData.parentCode)?.id
                    : null;
                const account = await prisma_1.prisma.account.create({
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
                });
                accountsMap.set(accountData.code, account);
            }
            console.log(`Plan de cuentas estándar creado para organización ${organizationId}`);
            return accountsMap;
        }
        catch (error) {
            console.error('Error creando plan de cuentas estándar:', error);
            throw error;
        }
    }
    /**
     * Obtiene la cuenta contable para un rubro específico
     */
    static async getAccountForRubro(organizationId, rubroName, isIncome = false) {
        try {
            // Normalizar nombre del rubro
            const normalizedRubro = rubroName.toUpperCase().replace(/\s+/g, '_');
            // Buscar mapeo específico o usar default
            const mapping = exports.RUBRO_TO_ACCOUNT_MAPPING[normalizedRubro] || exports.RUBRO_TO_ACCOUNT_MAPPING['DEFAULT'];
            const accountCode = isIncome ? mapping.income : mapping.expense;
            // Buscar cuenta en la base de datos
            const account = await prisma_1.prisma.account.findFirst({
                where: {
                    organizationId,
                    code: accountCode,
                    isActive: true
                }
            });
            return account;
        }
        catch (error) {
            console.error('Error obteniendo cuenta para rubro:', error);
            return null;
        }
    }
    /**
     * Obtiene cuenta por código
     */
    static async getAccountByCode(organizationId, code) {
        try {
            return await prisma_1.prisma.account.findFirst({
                where: {
                    organizationId,
                    code,
                    isActive: true
                }
            });
        }
        catch (error) {
            console.error('Error obteniendo cuenta por código:', error);
            return null;
        }
    }
    /**
     * Obtiene cuentas principales para automatización de transacciones
     */
    static async getMainAccounts(organizationId) {
        try {
            const [cashAccount, clientsAccount, providersAccount, incomeAccount, expenseAccount] = await Promise.all([
                this.getAccountByCode(organizationId, '1.1.01'), // Caja y Bancos
                this.getAccountByCode(organizationId, '1.1.03'), // Cuentas por Cobrar
                this.getAccountByCode(organizationId, '2.1.01'), // Cuentas por Pagar
                this.getAccountByCode(organizationId, '4.1.01'), // Ingresos por Construcción
                this.getAccountByCode(organizationId, '5.1.01'), // Materiales de Construcción
            ]);
            return {
                cashAccount,
                clientsAccount,
                providersAccount,
                incomeAccount,
                expenseAccount
            };
        }
        catch (error) {
            console.error('Error obteniendo cuentas principales:', error);
            return null;
        }
    }
    /**
     * Verifica si una organización tiene el plan de cuentas configurado
     */
    static async hasStandardChart(organizationId) {
        try {
            const accountsCount = await prisma_1.prisma.account.count({
                where: { organizationId }
            });
            return accountsCount > 0;
        }
        catch (error) {
            console.error('Error verificando plan de cuentas:', error);
            return false;
        }
    }
    /**
     * Obtiene estadísticas del plan de cuentas
     */
    static async getChartStats(organizationId) {
        try {
            const [totalAccounts, activeAccounts, accountsByType] = await Promise.all([
                prisma_1.prisma.account.count({
                    where: { organizationId }
                }),
                prisma_1.prisma.account.count({
                    where: { organizationId, isActive: true }
                }),
                prisma_1.prisma.account.groupBy({
                    by: ['type'],
                    where: { organizationId, isActive: true },
                    _count: true
                })
            ]);
            return {
                totalAccounts,
                activeAccounts,
                accountsByType: accountsByType.reduce((acc, item) => {
                    acc[item.type] = item._count;
                    return acc;
                }, {})
            };
        }
        catch (error) {
            console.error('Error obteniendo estadísticas del plan de cuentas:', error);
            return null;
        }
    }
}
exports.StandardChartService = StandardChartService;
