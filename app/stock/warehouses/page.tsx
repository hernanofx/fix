'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Warehouse, MapPin, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import WarehouseFormModal from '@/components/modals/WarehouseFormModal'
import Layout from '@/components/Layout'
import Pagination from '@/components/ui/Pagination'

interface Warehouse {
    id: string
    name: string
    code: string | null
    address: string | null
    description: string | null
    isActive: boolean
    createdAt: string
    stocks: Array<{
        material: {
            name: string
        }
        quantity: number
    }>
}

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [showModal, setShowModal] = useState(false)
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        fetchWarehouses()
    }, [])

    const fetchWarehouses = async () => {
        try {
            const response = await fetch('/api/stock/warehouses')
            if (response.ok) {
                const data = await response.json()
                setWarehouses(data)
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateWarehouse = () => {
        setEditingWarehouse(null)
        setShowModal(true)
    }

    const handleEditWarehouse = (warehouse: Warehouse) => {
        setEditingWarehouse(warehouse)
        setShowModal(true)
    }

    const handleDeleteWarehouse = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este almacén?')) return

        try {
            const response = await fetch(`/api/stock/warehouses/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setWarehouses(warehouses.filter(w => w.id !== id))
            }
        } catch (error) {
            console.error('Error deleting warehouse:', error)
        }
    }

    const handleImportExcel = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/stock/warehouses/import/excel', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                alert(`Importación exitosa: ${result.imported} almacenes importados`)
                fetchWarehouses()
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
                status: statusFilter,
                searchTerm: searchTerm,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/stock/warehouses/export/excel?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `almacenes_${new Date().toISOString().split('T')[0]}.xlsx`
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
                status: statusFilter,
                searchTerm: searchTerm,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/stock/warehouses/export/pdf?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `almacenes_${new Date().toISOString().split('T')[0]}.pdf`
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

    const getTotalItems = (stocks: Warehouse['stocks']) => {
        return stocks.reduce((total, stock) => total + stock.quantity, 0)
    }

    // Filtered and sorted warehouses (sin paginación para estadísticas)
    const filteredWarehouses = useMemo(() => {
        let filtered = warehouses.filter(warehouse =>
            warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (warehouse.code && warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()))
        )

        // Apply status filter
        if (statusFilter !== 'ALL') {
            const isActive = statusFilter === 'ACTIVE'
            filtered = filtered.filter(warehouse => warehouse.isActive === isActive)
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortField) {
                case 'name':
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
                    break
                case 'code':
                    aValue = (a.code || '').toLowerCase()
                    bValue = (b.code || '').toLowerCase()
                    break
                case 'items':
                    aValue = getTotalItems(a.stocks)
                    bValue = getTotalItems(b.stocks)
                    break
                case 'status':
                    aValue = a.isActive ? 1 : 0
                    bValue = b.isActive ? 1 : 0
                    break
                case 'createdAt':
                    aValue = new Date(a.createdAt).getTime()
                    bValue = new Date(b.createdAt).getTime()
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [warehouses, searchTerm, statusFilter, sortField, sortDirection])

    // Datos paginados para mostrar
    const paginatedWarehouses = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredWarehouses.slice(startIndex, endIndex)
    }, [filteredWarehouses, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage)

    if (loading) {
        return (
            <Layout
                title="Almacenes"
                subtitle="Gestión de almacenes y ubicaciones"
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Cargando almacenes...</div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout
            title="Almacenes"
            subtitle="Gestión de almacenes y ubicaciones"
        >
            <div className="space-y-6">
                {/* Estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Almacenes</CardTitle>
                            <Warehouse className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredWarehouses.length}</div>
                            <p className="text-xs text-muted-foreground">Registrados</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Activos</CardTitle>
                            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {filteredWarehouses.filter(w => w.isActive).length}
                            </div>
                            <p className="text-xs text-muted-foreground">Operativos</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
                            <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-600">
                                {filteredWarehouses.filter(w => !w.isActive).length}
                            </div>
                            <p className="text-xs text-muted-foreground">No operativos</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                            <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {filteredWarehouses.reduce((total: number, w: Warehouse) => total + getTotalItems(w.stocks), 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">En todos los almacenes</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div></div>
                    <Button onClick={handleCreateWarehouse} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Almacén
                    </Button>
                </div>

                {/* Barra de búsqueda y filtros */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Buscar por nombre o código..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="ALL">Todos los estados</option>
                                    <option value="ACTIVE">Activos</option>
                                    <option value="INACTIVE">Inactivos</option>
                                </select>
                            </div>
                            <div className="flex space-x-2">
                                {(searchTerm || statusFilter !== 'ALL') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSearchTerm('')
                                            setStatusFilter('ALL')
                                            setSortField('name')
                                            setSortDirection('asc')
                                        }}
                                    >
                                        Limpiar filtros
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de almacenes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Warehouse className="mr-2 h-5 w-5" />
                            Lista de Almacenes ({filteredWarehouses.length})
                        </CardTitle>
                        <CardDescription>
                            Gestiona tus almacenes y ubicaciones de almacenamiento
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredWarehouses.length === 0 ? (
                            <div className="text-center py-8">
                                <Warehouse className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No hay almacenes registrados
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Comienza creando tu primer almacén
                                </p>
                                <Button onClick={handleCreateWarehouse}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear Primer Almacén
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
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
                                                        if (sortField === 'name') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('name')
                                                            setSortDirection('asc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Nombre
                                                    {sortField === 'name' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead>Dirección</TableHead>
                                            <TableHead>
                                                <button
                                                    onClick={() => {
                                                        if (sortField === 'items') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('items')
                                                            setSortDirection('desc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Items Totales
                                                    {sortField === 'items' && (
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
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedWarehouses.map((warehouse: Warehouse) => (
                                            <TableRow
                                                key={warehouse.id}
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleEditWarehouse(warehouse)}
                                            >
                                                <TableCell className="font-medium">
                                                    {warehouse.code || '-'}
                                                </TableCell>
                                                <TableCell>{warehouse.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                                        {warehouse.address || 'Sin dirección'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getTotalItems(warehouse.stocks)} items
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                                                        {warehouse.isActive ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span className="sr-only">Abrir menú</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleEditWarehouse(warehouse)
                                                            }}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteWarehouse(warehouse.id)
                                                                }}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {filteredWarehouses.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredWarehouses.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                        onImportExcel={() => setShowImportModal(true)}
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                    />
                )}

                {/* Modal de formulario */}
                {showModal && (
                    <WarehouseFormModal
                        warehouse={editingWarehouse}
                        onClose={() => setShowModal(false)}
                        onSuccess={() => {
                            setShowModal(false)
                            fetchWarehouses()
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
                                        <li>Columnas: Nombre, Código, Dirección, Descripción, Estado</li>
                                        <li>Estados válidos: Activo, Inactivo</li>
                                        <li>La dirección es opcional</li>
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
