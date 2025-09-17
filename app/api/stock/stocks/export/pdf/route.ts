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
        const sortField = searchParams.get('sortField') || 'material'
        const sortDirection = searchParams.get('sortDirection') || 'asc'

        // Construir filtros
        const where: any = {
            material: {
                organizationId: user.organizationId
            },
            warehouse: {
                organizationId: user.organizationId
            }
        }

        // Aplicar filtros de búsqueda
        if (searchTerm) {
            where.OR = [
                { material: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { material: { code: { contains: searchTerm, mode: 'insensitive' } } },
                { warehouse: { name: { contains: searchTerm, mode: 'insensitive' } } }
            ]
        }

        // Aplicar filtros de stock
        if (filterBy === 'low') {
            where.material.minStock = { not: null }
            where.quantity = { lte: where.material.minStock }
        } else if (filterBy === 'out') {
            where.quantity = { lte: 0 }
        }

        // Obtener stocks con relaciones
        const stocks = await prisma.stock.findMany({
            where,
            include: {
                material: {
                    include: {
                        rubro: true
                    }
                },
                warehouse: true
            },
            orderBy: {
                material: { name: 'asc' }
            }
        })

        // Generar contenido PDF manualmente
        let pdfContent = `CONTROL DE STOCKS - ${new Date().toLocaleDateString('es-ES')}\n\n`
        pdfContent += `Total de stocks: ${stocks.length}\n\n`

        // Estadísticas
        const lowStockCount = stocks.filter(stock => {
            const available = stock.quantity - stock.reserved
            return stock.material.minStock && available <= stock.material.minStock
        }).length

        const outOfStockCount = stocks.filter(stock => stock.quantity - stock.reserved <= 0).length
        const totalValue = stocks.reduce((total, stock) => {
            return total + (stock.quantity * (stock.material.costPrice || 0))
        }, 0)

        pdfContent += `Stock Bajo: ${lowStockCount} | Sin Stock: ${outOfStockCount} | Valor Total: $${totalValue.toLocaleString()}\n\n`

        // Encabezados
        pdfContent += 'MATERIAL'.padEnd(25) + 'ALMACEN'.padEnd(20) + 'CANTIDAD'.padEnd(10) + 'RESERVADO'.padEnd(10) + 'DISPONIBLE'.padEnd(12) + 'ESTADO\n'
        pdfContent += '='.repeat(100) + '\n'

        // Datos
        stocks.forEach(stock => {
            const available = stock.quantity - stock.reserved
            let status = 'Normal'
            if (available <= 0) {
                status = 'Sin Stock'
            } else if (stock.material.minStock && available <= stock.material.minStock) {
                status = 'Stock Bajo'
            } else if (stock.material.maxStock && available >= stock.material.maxStock) {
                status = 'Stock Alto'
            }

            const materialName = (stock.material.name || '').substring(0, 23).padEnd(25)
            const warehouseName = (stock.warehouse.name || '').substring(0, 18).padEnd(20)
            const quantity = stock.quantity.toString().padStart(8).padEnd(10)
            const reserved = stock.reserved.toString().padStart(8).padEnd(10)
            const availableStr = available.toString().padStart(10).padEnd(12)
            const statusStr = status.padEnd(10)

            pdfContent += `${materialName}${warehouseName}${quantity}${reserved}${availableStr}${statusStr}\n`
        })

        // Crear respuesta con contenido de texto plano
        const response = new NextResponse(pdfContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
                'Content-Disposition': `attachment; filename=stocks_${new Date().toISOString().split('T')[0]}.txt`
            }
        })

        return response

    } catch (error) {
        console.error('Error exporting stocks to PDF:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic'
