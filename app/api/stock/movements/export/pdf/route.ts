import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verificar que el usuario pertenece a una organización
        const user = await prisma.user.findFirst({
            where: {
                id: session.user.id
            },
            include: {
                organization: true
            }
        })

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'Usuario no autorizado para esta organización' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const filterBy = searchParams.get('filterBy') || 'all'
        const searchTerm = searchParams.get('searchTerm') || ''
        const sortField = searchParams.get('sortField') || 'date'
        const sortDirection = searchParams.get('sortDirection') || 'desc'

        // Construir filtros
        const where: any = {
            organizationId: user.organizationId
        }

        // Aplicar filtros de tipo
        if (filterBy !== 'all') {
            where.type = filterBy
        }

        // Aplicar filtros de búsqueda
        if (searchTerm) {
            where.OR = [
                { material: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { material: { code: { contains: searchTerm, mode: 'insensitive' } } },
                { reference: { contains: searchTerm, mode: 'insensitive' } },
                { fromWarehouse: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { toWarehouse: { name: { contains: searchTerm, mode: 'insensitive' } } }
            ]
        }

        // Obtener movimientos con relaciones
        const movements = await prisma.stockMovement.findMany({
            where,
            include: {
                material: true,
                fromWarehouse: true,
                toWarehouse: true
            },
            orderBy: {
                date: 'desc'
            }
        })

        // Generar contenido PDF manualmente
        let pdfContent = `MOVIMIENTOS DE STOCK - ${new Date().toLocaleDateString('es-ES')}\n\n`
        pdfContent += `Total de movimientos: ${movements.length}\n\n`

        // Estadísticas
        const entradas = movements.filter(m => m.type === 'ENTRADA').length
        const salidas = movements.filter(m => m.type === 'SALIDA').length
        const transferencias = movements.filter(m => m.type === 'TRANSFERENCIA').length
        const totalCantidad = movements.reduce((total, m) => total + m.quantity, 0)

        pdfContent += `Entradas: ${entradas} | Salidas: ${salidas} | Transferencias: ${transferencias}\n`
        pdfContent += `Total de unidades movidas: ${totalCantidad}\n\n`

        // Encabezados
        pdfContent += 'FECHA'.padEnd(12) + 'TIPO'.padEnd(15) + 'MATERIAL'.padEnd(25) + 'CANTIDAD'.padEnd(10) + 'ORIGEN'.padEnd(20) + 'DESTINO\n'
        pdfContent += '='.repeat(95) + '\n'

        // Datos
        movements.forEach(movement => {
            const formatDate = (date: Date) => {
                return date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
            }

            const tipo = movement.type === 'ENTRADA' ? 'Entrada' :
                movement.type === 'SALIDA' ? 'Salida' : 'Transferencia'

            const fecha = formatDate(new Date(movement.date)).padEnd(12)
            const tipoStr = tipo.padEnd(15)
            const material = (movement.material.name || '').substring(0, 23).padEnd(25)
            const cantidad = movement.quantity.toString().padStart(8).padEnd(10)
            const origen = (movement.fromWarehouse?.name || '-').substring(0, 18).padEnd(20)
            const destino = (movement.toWarehouse?.name || '-').substring(0, 18)

            pdfContent += `${fecha}${tipoStr}${material}${cantidad}${origen}${destino}\n`
        })

        // Crear respuesta con contenido de texto plano
        const response = new NextResponse(pdfContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
                'Content-Disposition': `attachment; filename=movimientos_${new Date().toISOString().split('T')[0]}.txt`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting movements to PDF:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'
