'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Package, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import MaterialFormModal from '@/components/modals/MaterialFormModal'
import Layout from '@/components/Layout'
import Pagination from '@/components/ui/Pagination'

interface Material {
    id: string
    name: string
    code: string | null
    unit: string
    minStock: number | null
    maxStock: number | null
    costPrice: number | null
    costCurrency: string | null
    salePrice: number | null
    saleCurrency: string | null
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
    rubroId: string | null
    rubro: {
        id: string
        name: string
        type: 'CLIENT' | 'PROVIDER'
    } | null
    stocks: Array<{
        quantity: number
        warehouse: {
            name: string
        }
    }>
}

export default function MaterialsPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <MaterialsContent />
        </Suspense>
    )
}

function MaterialsContent() {
    const [materials, setMaterials] = useState<Material[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [rubroFilter, setRubroFilter] = useState('ALL')
    const [rubroTypeFilter, setRubroTypeFilter] = useState('ALL')
    const [stockFilter, setStockFilter] = useState('ALL')
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [showModal, setShowModal] = useState(false)
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const searchParams = useSearchParams()

    useEffect(() => {
        fetchMaterials()
    }, [])

    // Detectar parámetro modal=create en la URL y abrir modal automáticamente
    useEffect(() => {
        const modal = searchParams.get('modal')
        if (modal === 'create') {
            handleCreateMaterial()
        }
    }, [searchParams])

    const fetchMaterials = async () => {
        try {
            console.log('Iniciando fetchMaterials...')
            const response = await fetch('/api/stock/materials')
            if (response.ok) {
                const data = await response.json()
                console.log('Datos obtenidos:', data.length, 'materiales')
                setMaterials(data)
            } else {
                console.error('Error en respuesta:', response.status)
            }
        } catch (error) {
            console.error('Error fetching materials:', error)
        } finally {
            console.log('Finalizando fetchMaterials, setting loading to false')
            setLoading(false)
        }
    }

    const handleCreateMaterial = () => {
        setEditingMaterial(null)
        setShowModal(true)
    }

    const handleEditMaterial = (material: Material) => {
        setEditingMaterial(material)
        setShowModal(true)
    }

    const handleDeleteMaterial = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este material?')) return

        try {
            const response = await fetch(`/api/stock/materials/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setMaterials(materials.filter(m => m.id !== id))
            }
        } catch (error) {
            console.error('Error deleting material:', error)
        }
    }

    const handleImportExcel = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/stock/materials/import/excel', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                alert(`Importación exitosa: ${result.imported} materiales importados`)
                fetchMaterials()
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
                rubro: rubroFilter,
                rubroType: rubroTypeFilter,
                stock: stockFilter,
                searchTerm: searchTerm,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/stock/materials/export/excel?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `materiales_${new Date().toISOString().split('T')[0]}.xlsx`
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
                rubro: rubroFilter,
                rubroType: rubroTypeFilter,
                stock: stockFilter,
                searchTerm: searchTerm,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/stock/materials/export/pdf?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `materiales_${new Date().toISOString().split('T')[0]}.pdf`
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

    const getTotalStock = (stocks: Material['stocks']) => {
        return stocks.reduce((total, stock) => total + stock.quantity, 0)
    }

    // Filtered materials (without pagination for stats)
    const filteredMaterials = useMemo(() => {
        let filtered = materials.filter(material =>
            material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (material.code && material.code.toLowerCase().includes(searchTerm.toLowerCase()))
        )

        // Apply status filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(material => material.status === statusFilter)
        }

        // Apply rubro filter
        if (rubroFilter !== 'ALL') {
            filtered = filtered.filter(material => material.rubroId === rubroFilter)
        }

        // Apply rubro type filter
        if (rubroTypeFilter !== 'ALL') {
            filtered = filtered.filter(material => {
                if (!material.rubro) return false
                return material.rubro.type === rubroTypeFilter
            })
        }

        // Apply stock filter
        if (stockFilter !== 'ALL') {
            filtered = filtered.filter(material => {
                const totalStock = getTotalStock(material.stocks)
                switch (stockFilter) {
                    case 'LOW':
                        return material.minStock && totalStock <= material.minStock
                    case 'OUT':
                        return totalStock <= 0
                    case 'NORMAL':
                        return (!material.minStock || totalStock > material.minStock) && (!material.maxStock || totalStock < material.maxStock)
                    case 'HIGH':
                        return material.maxStock && totalStock >= material.maxStock
                    default:
                        return true
                }
            })
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
                case 'rubro':
                    aValue = a.rubro?.name || ''
                    bValue = b.rubro?.name || ''
                    break
                case 'stock':
                    aValue = getTotalStock(a.stocks)
                    bValue = getTotalStock(b.stocks)
                    break
                case 'status':
                    aValue = a.status
                    bValue = b.status
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [materials, searchTerm, statusFilter, rubroFilter, rubroTypeFilter, stockFilter, sortField, sortDirection])

    // Paginated materials for display
    const paginatedMaterials = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredMaterials.slice(startIndex, endIndex)
    }, [filteredMaterials, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, rubroFilter, rubroTypeFilter, stockFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage)

    // Get unique rubros for filter
    const uniqueRubros = useMemo(() => {
        const rubros = Array.from(new Set(
            materials
                .filter(material => material.rubro)
                .map(material => material.rubro!)
        ))
        return rubros
    }, [materials])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="default">Activo</Badge>
            case 'INACTIVE':
                return <Badge variant="secondary">Inactivo</Badge>
            case 'ARCHIVED':
                return <Badge variant="outline">Archivado</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <Layout
                title="Materiales"
                subtitle="Catálogo de materiales y productos"
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Cargando materiales...</div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout
            title="Materiales"
            subtitle="Catálogo de materiales y productos"
        >
            <div className="space-y-6">
                {/* Estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Materiales</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredMaterials.length}</div>
                            <p className="text-xs text-muted-foreground">En catálogo</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Activos</CardTitle>
                            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {filteredMaterials.filter(m => m.status === 'ACTIVE').length}
                            </div>
                            <p className="text-xs text-muted-foreground">Disponibles</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
                            <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {filteredMaterials.filter(m => getTotalStock(m.stocks) <= 0).length}
                            </div>
                            <p className="text-xs text-muted-foreground">Agotados</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                            <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {filteredMaterials.filter(m => m.minStock && getTotalStock(m.stocks) <= m.minStock).length}
                            </div>
                            <p className="text-xs text-muted-foreground">Necesitan reposición</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rubros</CardTitle>
                            <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {uniqueRubros.length}
                            </div>
                            <p className="text-xs text-muted-foreground">Categorías</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div></div>
                    <Button onClick={handleCreateMaterial} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Material
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
                                    <option value="ARCHIVED">Archivados</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
                                <select
                                    value={rubroFilter}
                                    onChange={(e) => setRubroFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="ALL">Todos los rubros</option>
                                    {uniqueRubros.map(rubro => (
                                        <option key={rubro.id} value={rubro.id}>{rubro.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Rubro</label>
                                <select
                                    value={rubroTypeFilter}
                                    onChange={(e) => setRubroTypeFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="ALL">Todos los tipos</option>
                                    <option value="CLIENT">Cliente</option>
                                    <option value="PROVIDER">Proveedor</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                <select
                                    value={stockFilter}
                                    onChange={(e) => setStockFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="ALL">Todo stock</option>
                                    <option value="OUT">Sin stock</option>
                                    <option value="LOW">Stock bajo</option>
                                    <option value="NORMAL">Stock normal</option>
                                    <option value="HIGH">Stock alto</option>
                                </select>
                            </div>
                            <div className="flex space-x-2">
                                {(searchTerm || statusFilter !== 'ALL' || rubroFilter !== 'ALL' || rubroTypeFilter !== 'ALL' || stockFilter !== 'ALL') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSearchTerm('')
                                            setStatusFilter('ALL')
                                            setRubroFilter('ALL')
                                            setRubroTypeFilter('ALL')
                                            setStockFilter('ALL')
                                            setSortField('name')
                                            setSortDirection('asc')
                                            setCurrentPage(1)
                                        }}
                                    >
                                        Limpiar filtros
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de materiales */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Package className="mr-2 h-5 w-5" />
                            Lista de Materiales ({filteredMaterials.length})
                        </CardTitle>
                        <CardDescription>
                            Gestiona tu catálogo de materiales y productos
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredMaterials.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No hay materiales registrados
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Comienza creando tu primer material
                                </p>
                                <Button onClick={handleCreateMaterial}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear Primer Material
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
                                            <TableHead>Unidad</TableHead>
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
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>
                                                <button
                                                    onClick={() => {
                                                        if (sortField === 'stock') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('stock')
                                                            setSortDirection('desc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Stock Total
                                                    {sortField === 'stock' && (
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
                                        {paginatedMaterials.map((material) => (
                                            <TableRow
                                                key={material.id}
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleEditMaterial(material)}
                                            >
                                                <TableCell className="font-medium">
                                                    {material.code || '-'}
                                                </TableCell>
                                                <TableCell>{material.name}</TableCell>
                                                <TableCell>{material.unit}</TableCell>
                                                <TableCell>
                                                    {material.rubro?.name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {material.rubro ? (
                                                        <Badge variant={material.rubro.type === 'CLIENT' ? 'default' : 'secondary'}>
                                                            {material.rubro.type === 'CLIENT' ? 'Cliente' : 'Proveedor'}
                                                        </Badge>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {getTotalStock(material.stocks)} {material.unit}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(material.status)}
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
                                                                handleEditMaterial(material)
                                                            }}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteMaterial(material.id)
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

                {/* Paginación */}
                {filteredMaterials.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredMaterials.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(items) => {
                            setItemsPerPage(items)
                            setCurrentPage(1)
                        }}
                        onImportExcel={() => setShowImportModal(true)}
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                    />
                )}

                {/* Modal de formulario */}
                {showModal && (
                    <MaterialFormModal
                        material={editingMaterial}
                        onClose={() => setShowModal(false)}
                        onSuccess={() => {
                            setShowModal(false)
                            fetchMaterials()
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
                                        <li>Columnas: Nombre, Código, Unidad, Rubro, Stock Mínimo, Stock Máximo, Precio Costo, Precio Venta, Estado</li>
                                        <li>Estados válidos: Activo, Inactivo, Archivado</li>
                                        <li>Los precios deben ser números positivos</li>
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
