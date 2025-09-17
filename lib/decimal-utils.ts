/**
 * Utilidades para manejo seguro de números decimales
 * Evita problemas de precisión inherentes a JavaScript con números flotantes
 */

export class DecimalUtils {
    /**
     * Convierte un string o número a decimal con precisión controlada
     * @param value - Valor a convertir
     * @param decimals - Número de decimales deseados (default: 2)
     * @returns Número con precisión decimal controlada
     */
    static toDecimal(value: string | number | null | undefined, decimals: number = 2): number {
        if (value === null || value === undefined || value === '') {
            return 0
        }

        const num = typeof value === 'string' ? parseFloat(value) : value

        if (isNaN(num)) {
            return 0
        }

        // Redondear al número de decimales especificado para evitar problemas de precisión
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
    }

    /**
     * Suma dos números decimales de forma segura
     * @param a - Primer número
     * @param b - Segundo número
     * @param decimals - Número de decimales deseados (default: 2)
     * @returns Resultado de la suma con precisión controlada
     */
    static add(a: number, b: number, decimals: number = 2): number {
        const factor = Math.pow(10, decimals)
        return Math.round((a + b) * factor) / factor
    }

    /**
     * Resta dos números decimales de forma segura
     * @param a - Primer número (minuendo)
     * @param b - Segundo número (sustraendo)
     * @param decimals - Número de decimales deseados (default: 2)
     * @returns Resultado de la resta con precisión controlada
     */
    static subtract(a: number, b: number, decimals: number = 2): number {
        const factor = Math.pow(10, decimals)
        return Math.round((a - b) * factor) / factor
    }

    /**
     * Multiplica dos números decimales de forma segura
     * @param a - Primer número
     * @param b - Segundo número
     * @param decimals - Número de decimales deseados (default: 2)
     * @returns Resultado de la multiplicación con precisión controlada
     */
    static multiply(a: number, b: number, decimals: number = 2): number {
        const factor = Math.pow(10, decimals)
        return Math.round((a * b) * factor) / factor
    }

    /**
     * Divide dos números decimales de forma segura
     * @param a - Dividendo
     * @param b - Divisor
     * @param decimals - Número de decimales deseados (default: 2)
     * @returns Resultado de la división con precisión controlada
     */
    static divide(a: number, b: number, decimals: number = 2): number {
        if (b === 0) {
            throw new Error('Division by zero')
        }

        const factor = Math.pow(10, decimals)
        return Math.round((a / b) * factor) / factor
    }

    /**
     * Compara dos números decimales con tolerancia
     * @param a - Primer número
     * @param b - Segundo número
     * @param tolerance - Tolerancia para la comparación (default: 0.01)
     * @returns true si los números son aproximadamente iguales
     */
    static equals(a: number, b: number, tolerance: number = 0.01): boolean {
        return Math.abs(a - b) < tolerance
    }

    /**
     * Formatea un número como moneda
     * @param value - Valor a formatear
     * @param currency - Moneda (default: 'USD')
     * @param locale - Locale para formateo (default: 'es-ES')
     * @returns String formateado como moneda
     */
    static formatCurrency(value: number, currency: string = 'USD', locale: string = 'es-ES'): string {
        // Mapear códigos personalizados a códigos ISO válidos
        const currencyMap: { [key: string]: string } = {
            'PESOS': 'ARS',
            'USD': 'USD',
            'EUR': 'EUR'
        }

        const isoCurrency = currencyMap[currency] || currency

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: isoCurrency,
        }).format(value)
    }

    /**
     * Formatea un número con separadores de miles y decimales fijos
     * @param value - Valor a formatear
     * @param decimals - Número de decimales (default: 2)
     * @param locale - Locale para formateo (default: 'es-ES')
     * @returns String formateado
     */
    static formatNumber(value: number, decimals: number = 2, locale: string = 'es-ES'): string {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value)
    }
}
