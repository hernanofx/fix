'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, TrendingUp, Package, Warehouse, AlertTriangle, ArrowDown, ArrowUp, ArrowRightLeft, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import StockEntryModal from '@/components/modals/StockEntryModal'
import StockExitModal from '@/components/modals/StockExitModal'
import StockTransferModal from '@/components/modals/StockTransferModal'
import Layout from '@/components/Layout'
import Pagination from '@/components/ui/Pagination'
import { DecimalUtils } from '@/lib/decimal-utils'

interface StockItem {
    id: string
    material: {
        id: string
        name: string
        code: string | null
        unit: string
        minStock: number | null
        maxStock: number | null
        costPrice: number | null
        currency: string
        rubro: {
            id: string
            name: string
        } | null
    }
    warehouse: {
        id: string
        name: string
        code: string | null
    }
    quantity: number
    reserved: number
    available: number
}

export default function StocksPage() {
    const [stocks, setStocks] = useState<StockItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterBy, setFilterBy] = useState<'all' | 'low' | 'out'>('all')
    const [sortField, setSortField] = useState<string>('material')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [showEntryModal, setShowEntryModal] = useState(false)
    const [showExitModal, setShowExitModal] = useState(false)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        fetchStocks()
    }, [])

    const fetchStocks = async () => {
        try {
            const response = await fetch('/api/stock/stocks')
            if (response.ok) {
                const data = await response.json()
                setStocks(data)
            }
        } catch (error) {
            console.error('Error fetching stocks:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleImportExcel = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/stock/stocks/import/excel', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                alert(`Importación exitosa: ${result.imported} stocks importados`)
                fetchStocks()
            } else {
                const error = await response.json()
                alert(`Error en la importación: ${error.error}`)
            }
        } catch (error) {
            console.error('Error importing Excel:', error)
            alert('Error al importar el archivo Excel')
        }
    }

    const handleFileImport = async (file: File) => {
        setImporting(true)
        try {
            await handleImportExcel(file)
            setShowImportModal(false)
        } catch (error) {
            console.error('Error in file import:', error)
        } finally {
            setImporting(false)
        }
    }

    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams({
                filterBy: filterBy,
                searchTerm: searchTerm,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/stock/stocks/export/excel?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `stocks_${new Date().toISOString().split('T')[0]}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert('Error al exportar a Excel')
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error)
            alert('Error al exportar a Excel')
        }
    }

    const handleExportPDF = async () => {
        try {
            const params = new URLSearchParams({
                filterBy: filterBy,
                searchTerm: searchTerm,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/stock/stocks/export/pdf?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `stocks_${new Date().toISOString().split('T')[0]}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert('Error al exportar a PDF')
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error)
            alert('Error al exportar a PDF')
        }
    }

    const filteredStocks = useMemo(() => {
        let filtered = stocks.filter(stock => {
            const matchesSearch = stock.material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (stock.material.code && stock.material.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                stock.warehouse.name.toLowerCase().includes(searchTerm.toLowerCase())

            if (!matchesSearch) return false

            switch (filterBy) {
                case 'low':
                    return stock.material.minStock && stock.available <= stock.material.minStock
                case 'out':
                    return stock.available <= 0
                default:
                    return true
            }
        })

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortField) {
                case 'material':
                    aValue = a.material.name.toLowerCase()
                    bValue = b.material.name.toLowerCase()
                    break
                case 'code':
                    aValue = (a.material.code || '').toLowerCase()
                    bValue = (b.material.code || '').toLowerCase()
                    break
                case 'rubro':
                    aValue = a.material.rubro?.name || ''
                    bValue = b.material.rubro?.name || ''
                    break
                case 'warehouse':
                    aValue = a.warehouse.name.toLowerCase()
                    bValue = b.warehouse.name.toLowerCase()
                    break
                case 'quantity':
                    aValue = a.quantity
                    bValue = b.quantity
                    break
                case 'available':
                    aValue = a.available
                    bValue = b.available
                    break
                case 'status':
                    const aStatus = getStockStatus(a).status
                    const bStatus = getStockStatus(b).status
                    const statusOrder = { 'out': 0, 'low': 1, 'high': 2, 'normal': 3 }
                    aValue = statusOrder[aStatus as keyof typeof statusOrder] || 3
                    bValue = statusOrder[bStatus as keyof typeof statusOrder] || 3
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [stocks, searchTerm, filterBy, sortField, sortDirection])

    const getStockStatus = (stock: StockItem) => {
        if (stock.available <= 0) {
            return { status: 'out', label: 'Sin Stock', variant: 'destructive' as const }
        }
        if (stock.material.minStock && stock.available <= stock.material.minStock) {
            return { status: 'low', label: 'Stock Bajo', variant: 'secondary' as const }
        }
        if (stock.material.maxStock && stock.available >= stock.material.maxStock) {
            return { status: 'high', label: 'Stock Alto', variant: 'outline' as const }
        }
        return { status: 'normal', label: 'Normal', variant: 'default' as const }
    }

    const getTotalValue = () => {
        const totalByCurrency = {
            PESOS: 0,
            USD: 0,
            EUR: 0
        }

        stocks.forEach(stock => {
            const costPrice = stock.material.costPrice || 0
            const currency = stock.material.currency || 'PESOS'
            if (totalByCurrency.hasOwnProperty(currency)) {
                totalByCurrency[currency as keyof typeof totalByCurrency] += DecimalUtils.multiply(stock.quantity, costPrice)
            }
        })

        return totalByCurrency
    }

    const getLowStockCount = () => {
        return stocks.filter(stock =>
            stock.material.minStock && stock.available <= stock.material.minStock
        ).length
    }

    const getOutOfStockCount = () => {
        return stocks.filter(stock => stock.available <= 0).length
    }

    if (loading) {
        return (
            <Layout
                title="Control de Stocks"
                subtitle="Monitoreo de inventarios y existencias"
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Cargando stocks...</div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout
            title="Control de Stocks"
            subtitle="Monitoreo de inventarios y existencias"
        >
            <div className="space-y-6">
                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stocks.length}</div>
                            <p className="text-xs text-muted-foreground">Materiales en stock</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{getLowStockCount()}</div>
                            <p className="text-xs text-muted-foreground">Necesitan reposición</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{getOutOfStockCount()}</div>
                            <p className="text-xs text-muted-foreground">Agotados</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {(() => {
                                    const totalValue = getTotalValue()
                                    const currencies = [
                                        { key: 'PESOS', label: 'ARS', color: 'text-green-600' },
                                        { key: 'USD', label: 'USD', color: 'text-blue-600' },
                                        { key: 'EUR', label: 'EUR', color: 'text-purple-600' }
                                    ]

                                    return currencies.map(({ key, label, color }) => {
                                        const value = totalValue[key as keyof typeof totalValue]
                                        if (value > 0) {
                                            return (
                                                <div key={key} className={`text-lg font-bold ${color}`}>
                                                    {DecimalUtils.formatCurrency(value)} {label}
                                                </div>
                                            )
                                        }
                                        return null
                                    }).filter(Boolean)
                                })()}
                                {(() => {
                                    const totalValue = getTotalValue()
                                    const hasAnyValue = Object.values(totalValue).some(v => v > 0)
                                    if (!hasAnyValue) {
                                        return <div className="text-2xl font-bold">$0</div>
                                    }
                                    return null
                                })()}
                            </div>
                            <p className="text-xs text-muted-foreground">Valor del inventario</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Acciones Rápidas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="mr-2 h-5 w-5" />
                            Movimientos de Stock
                        </CardTitle>
                        <CardDescription>
                            Registra entradas, salidas y transferencias de materiales
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button
                                onClick={() => setShowEntryModal(true)}
                                className="h-20 flex flex-col items-center justify-center space-y-2"
                                variant="outline"
                            >
                                <ArrowDown className="h-6 w-6 text-green-600" />
                                <span className="text-sm font-medium">Entrada</span>
                                <span className="text-xs text-gray-500">Recibir materiales</span>
                            </Button>

                            <Button
                                onClick={() => setShowExitModal(true)}
                                className="h-20 flex flex-col items-center justify-center space-y-2"
                                variant="outline"
                            >
                                <ArrowUp className="h-6 w-6 text-red-600" />
                                <span className="text-sm font-medium">Salida</span>
                                <span className="text-xs text-gray-500">Consumir materiales</span>
                            </Button>

                            <Button
                                onClick={() => setShowTransferModal(true)}
                                className="h-20 flex flex-col items-center justify-center space-y-2"
                                variant="outline"
                            >
                                <ArrowRightLeft className="h-6 w-6 text-blue-600" />
                                <span className="text-sm font-medium">Transferencia</span>
                                <span className="text-xs text-gray-500">Entre almacenes</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Filtros */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Buscar por material, código o almacén..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant={filterBy === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterBy('all')}
                                >
                                    Todos
                                </Button>
                                <Button
                                    variant={filterBy === 'low' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterBy('low')}
                                >
                                    Stock Bajo
                                </Button>
                                <Button
                                    variant={filterBy === 'out' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterBy('out')}
                                >
                                    Sin Stock
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de stocks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="mr-2 h-5 w-5" />
                            Lista de Stocks ({filteredStocks.length})
                        </CardTitle>
                        <CardDescription>
                            Control de inventarios por material y almacén
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredStocks.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {stocks.length === 0 ? 'No hay stocks registrados' : 'No se encontraron resultados'}
                                </h3>
                                <p className="text-gray-500">
                                    {stocks.length === 0
                                        ? 'Comienza agregando materiales y almacenes'
                                        : 'Intenta con otros términos de búsqueda'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                <button
                                                    onClick={() => {
                                                        if (sortField === 'material') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('material')
                                                            setSortDirection('asc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Material
                                                    {sortField === 'material' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead>
                                                <button
                                                    onClick={() => {
                                                        if (sortField === 'code') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('code')
                                                            setSortDirection('asc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Código
                                                    {sortField === 'code' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead>
                                                <button
                                                    onClick={() => {
                                                        if (sortField === 'rubro') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('rubro')
                                                            setSortDirection('asc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Rubro
                                                    {sortField === 'rubro' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead>
                                                <button
                                                    onClick={() => {
                                                        if (sortField === 'warehouse') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('warehouse')
                                                            setSortDirection('asc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Almacén
                                                    {sortField === 'warehouse' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead>
                                                <button
                                                    onClick={() => {
                                                        if (sortField === 'quantity') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('quantity')
                                                            setSortDirection('desc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Cantidad
                                                    {sortField === 'quantity' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead>Reservado</TableHead>
                                            <TableHead>
                                                <button
                                                    onClick={() => {
                                                        if (sortField === 'available') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('available')
                                                            setSortDirection('desc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Disponible
                                                    {sortField === 'available' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead>
                                                <button
                                                    onClick={() => {
                                                        if (sortField === 'status') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('status')
                                                            setSortDirection('asc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Estado
                                                    {sortField === 'status' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStocks.map((stock) => {
                                            const stockStatus = getStockStatus(stock)
                                            return (
                                                <TableRow key={stock.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                                                    // For stocks, we'll open a simple view modal or use edit modal
                                                    // Since there's no dedicated view modal, we'll use edit modal in read-only mode
                                                    alert(`Stock: ${stock.material.name}\nAlmacén: ${stock.warehouse.name}\nCantidad: ${stock.quantity} ${stock.material.unit}\nDisponible: ${stock.available} ${stock.material.unit}`)
                                                }}>
                                                    <TableCell className="font-medium">{stock.material.name}</TableCell>
                                                    <TableCell>{stock.material.code || '-'}</TableCell>
                                                    <TableCell>{stock.material.rubro?.name || '-'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Warehouse className="h-4 w-4 text-gray-400 mr-2" />
                                                            {stock.warehouse.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{stock.quantity} {stock.material.unit}</TableCell>
                                                    <TableCell>{stock.reserved} {stock.material.unit}</TableCell>
                                                    <TableCell className="font-medium">{stock.available} {stock.material.unit}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={stockStatus.variant}>
                                                            {stockStatus.label}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {filteredStocks.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredStocks.length / itemsPerPage)}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredStocks.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                        onImportExcel={() => setShowImportModal(true)}
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                    />
                )}

                {/* Modales de movimientos */}
                {showEntryModal && (
                    <StockEntryModal
                        onClose={() => setShowEntryModal(false)}
                        onSuccess={() => {
                            setShowEntryModal(false)
                            fetchStocks()
                        }}
                    />
                )}

                {showExitModal && (
                    <StockExitModal
                        onClose={() => setShowExitModal(false)}
                        onSuccess={() => {
                            setShowExitModal(false)
                            fetchStocks()
                        }}
                    />
                )}

                {showTransferModal && (
                    <StockTransferModal
                        onClose={() => setShowTransferModal(false)}
                        onSuccess={() => {
                            setShowTransferModal(false)
                            fetchStocks()
                        }}
                    />
                )}

                {/* Modal de importación */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Importar desde Excel
                                </h3>
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seleccionar archivo Excel (.xlsx, .xls)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                handleFileImport(file)
                                            }
                                        }}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                        disabled={importing}
                                    />
                                </div>

                                {importing && (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                        <span className="ml-2 text-sm text-gray-600">Procesando archivo...</span>
                                    </div>
                                )}

                                <div className="text-xs text-gray-500">
                                    <p>Formato esperado:</p>
                                    <ul className="list-disc list-inside mt-1">
                                        <li>Columnas: Material, Código, Almacén, Cantidad, Reservado</li>
                                        <li>Los materiales y almacenes deben existir previamente</li>
                                        <li>Las cantidades deben ser números positivos</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                    disabled={importing}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}
