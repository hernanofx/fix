import { prisma } from '@/lib/prisma'

/**
 * Genera un código automático secuencial para una organización
 * @param organizationId - ID de la organización
 * @param type - Tipo de entidad ('material' | 'warehouse')
 * @returns El siguiente código numérico disponible
 */
export async function generateAutoCode(organizationId: string, type: 'material' | 'warehouse'): Promise<string> {
    try {
        let existingCodes: string[] = []

        if (type === 'material') {
            const materials = await prisma.material.findMany({
                where: {
                    organizationId,
                    code: {
                        not: null
                    }
                },
                select: {
                    code: true
                }
            })
            existingCodes = materials.map(m => m.code!).filter(Boolean)
        } else if (type === 'warehouse') {
            const warehouses = await prisma.warehouse.findMany({
                where: {
                    organizationId,
                    code: {
                        not: null
                    }
                },
                select: {
                    code: true
                }
            })
            existingCodes = warehouses.map(w => w.code!).filter(Boolean)
        }

        // Extraer números de los códigos existentes
        const numbers = existingCodes
            .map(code => {
                const match = code.match(/^(\d+)/)
                return match ? parseInt(match[1], 10) : null
            })
            .filter((num): num is number => num !== null && !isNaN(num))

        // Encontrar el número más alto
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0

        // Retornar el siguiente número
        return (maxNumber + 1).toString()
    } catch (error) {
        console.error('Error generating auto code:', error)
        // En caso de error, retornar un código basado en timestamp como fallback
        return Date.now().toString().slice(-6)
    }
}
