'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Warehouse, TrendingUp, ArrowRight, DollarSign } from 'lucide-react'

interface StockData {
    id: string
    quantity: number
    available: number
    material: {
        id: string
        name: string
        costPrice: number | null
        currency: string
        rubro: {
            name: string
        } | null
    }
    warehouse: {
        id: string
        name: string
    }
}

interface StockStats {
    totalMaterials: number
    totalWarehouses: number
    lowStockItems: number
    totalValue: {
        PESOS: number
        USD: number
        EUR: number
    }
}

export default function StockPage() {
    const [activeTab, setActiveTab] = useState('materials')
    const [stockStats, setStockStats] = useState<StockStats>({
        totalMaterials: 0,
        totalWarehouses: 0,
        lowStockItems: 0,
        totalValue: {
            PESOS: 0,
            USD: 0,
            EUR: 0
        }
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStockData = async () => {
            try {
                // Fetch stocks data
                const stocksResponse = await fetch('/api/stock/stocks')
                const stocks: StockData[] = await stocksResponse.json()

                // Fetch materials data
                const materialsResponse = await fetch('/api/stock/materials')
                const materials = await materialsResponse.json()

                // Fetch warehouses data
                const warehousesResponse = await fetch('/api/stock/warehouses')
                const warehouses = await warehousesResponse.json()

                // Calculate statistics
                const totalMaterials = materials.length
                const totalWarehouses = warehouses.length

                // Calculate low stock items (materials with stock below minimum)
                const lowStockItems = materials.filter((material: any) => {
                    const materialStocks = stocks.filter((stock: StockData) => stock.material.id === material.id)
                    const totalQuantity = materialStocks.reduce((sum: number, stock: StockData) => sum + stock.quantity, 0)
                    return material.minStock && totalQuantity <= material.minStock
                }).length

                // Calculate total value by currency
                const totalValue = {
                    PESOS: 0,
                    USD: 0,
                    EUR: 0
                }

                stocks.forEach((stock: StockData) => {
                    if (stock.material.costPrice && stock.quantity > 0) {
                        const value = stock.material.costPrice * stock.quantity
                        const currency = stock.material.currency as keyof typeof totalValue
                        if (totalValue.hasOwnProperty(currency)) {
                            totalValue[currency] += value
                        }
                    }
                })

                setStockStats({
                    totalMaterials,
                    totalWarehouses,
                    lowStockItems,
                    totalValue
                })
            } catch (error) {
                console.error('Error fetching stock data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStockData()
    }, [])

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency === 'PESOS' ? 'ARS' : currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const modules = [
        {
            id: 'materials',
            title: 'Materiales',
            description: 'Catálogo de materiales y productos',
            icon: Package,
            href: '/stock/materials',
            color: 'bg-blue-500'
        },
        {
            id: 'warehouses',
            title: 'Almacenes',
            description: 'Gestión de almacenes y ubicaciones',
            icon: Warehouse,
            href: '/stock/warehouses',
            color: 'bg-green-500'
        },
        {
            id: 'stocks',
            title: 'Stocks',
            description: 'Control de inventarios y existencias',
            icon: TrendingUp,
            href: '/stock/stocks',
            color: 'bg-purple-500'
        }
    ]

    return (
        <Layout title="Módulo de Stock" subtitle="Gestión completa de materiales, almacenes e inventarios">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Módulo de Stock</h1>
                <p className="text-gray-600">Gestión completa de materiales, almacenes e inventarios</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => {
                    const Icon = module.icon
                    return (
                        <Card key={module.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-lg ${module.color}`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">{module.title}</CardTitle>
                                        <CardDescription>{module.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Link href={module.href}>
                                    <Button className="w-full">
                                        Acceder
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Resumen de estadísticas */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen General</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Materiales</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? '...' : stockStats.totalMaterials}
                            </div>
                            <p className="text-xs text-muted-foreground">Materiales registrados</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Almacenes</CardTitle>
                            <Warehouse className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? '...' : stockStats.totalWarehouses}
                            </div>
                            <p className="text-xs text-muted-foreground">Almacenes activos</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {loading ? '...' : stockStats.lowStockItems}
                            </div>
                            <p className="text-xs text-muted-foreground">Materiales con stock bajo</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {loading ? (
                                    <div className="text-2xl font-bold">...</div>
                                ) : (
                                    <>
                                        {stockStats.totalValue.PESOS > 0 && (
                                            <div className="text-lg font-bold text-green-600">
                                                {formatCurrency(stockStats.totalValue.PESOS, 'PESOS')}
                                            </div>
                                        )}
                                        {stockStats.totalValue.USD > 0 && (
                                            <div className="text-lg font-bold text-blue-600">
                                                {formatCurrency(stockStats.totalValue.USD, 'USD')}
                                            </div>
                                        )}
                                        {stockStats.totalValue.EUR > 0 && (
                                            <div className="text-lg font-bold text-purple-600">
                                                {formatCurrency(stockStats.totalValue.EUR, 'EUR')}
                                            </div>
                                        )}
                                        {stockStats.totalValue.PESOS === 0 && stockStats.totalValue.USD === 0 && stockStats.totalValue.EUR === 0 && (
                                            <div className="text-2xl font-bold">$0</div>
                                        )}
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Valor del inventario</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    )
}
