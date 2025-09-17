'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, History, ArrowDown, ArrowUp, ArrowRightLeft, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import MovementFormModal from '@/components/modals/MovementFormModal'
import MovementDetailsModal from '@/components/modals/MovementDetailsModal'
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal'
import { useToast } from '@/components/ToastProvider'
import Layout from '@/components/Layout'
import { useSession } from 'next-auth/react'
import Pagination from '@/components/ui/Pagination'

interface StockMovement {
    id: string
    type: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA'
    quantity: number
    description: string | null
    reference: string | null
    date: string
    originType: 'CLIENT' | 'PROVIDER' | 'CUSTOM' | null
    originId: string | null
    originName: string | null
    destType: 'CLIENT' | 'PROVIDER' | 'CUSTOM' | null
    destId: string | null
    destName: string | null
    material: {
        id: string
        name: string
        code: string | null
        unit: string
    }
    fromWarehouse: {
        id: string
        name: string
        code: string | null
    } | null
    toWarehouse: {
        id: string
        name: string
        code: string | null
    } | null
}

export default function MovementsPage() {
    const [movements, setMovements] = useState<StockMovement[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterBy, setFilterBy] = useState<'all' | 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA'>('all')
    const [sortField, setSortField] = useState<string>('date')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [clients, setClients] = useState<{ [key: string]: string }>({})
    const [providers, setProviders] = useState<{ [key: string]: string }>({})
    const [dataLoading, setDataLoading] = useState(false)

    // Modal states
    const [selectedMovement, setSelectedMovement] = useState<any>(null)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)
    const { data: session } = useSession()
    const toast = useToast()

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        if (session?.user?.organizationId) {
            fetchMovements(true)
            // Cargar clientes y proveedores de forma diferida para ahorrar recursos
            setTimeout(() => fetchClientsAndProviders(), 1000)
        }
    }, [session])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, filterBy, sortField, sortDirection])

    const fetchMovements = async (isInitialLoad = false) => {
        try {
            const response = await fetch('/api/stock/movements')
            if (response.ok) {
                const data = await response.json()
                setMovements(data)
            }
        } catch (error) {
            console.error('Error fetching movements:', error)
        } finally {
            if (isInitialLoad) {
                setLoading(false)
            }
        }
    }

    const handleViewMovement = (movement: any) => {
        console.log('handleViewMovement called with:', movement)
        setSelectedMovement(movement)
        setIsDetailsModalOpen(true)
    }

    const handleEditMovement = (movement: any) => {
        console.log('handleEditMovement called with:', movement)
        setSelectedMovement(movement)
        setIsEditModalOpen(true)
    }

    const handleDeleteMovement = (movement: any) => {
        setSelectedMovement(movement)
        setIsDeleteModalOpen(true)
    }

    const confirmDeleteMovement = async () => {
        if (!selectedMovement) return

        try {
            const response = await fetch(`/api/stock/movements?id=${selectedMovement.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success('Movimiento eliminado exitosamente')
                fetchMovements()
                setIsDeleteModalOpen(false)
                setSelectedMovement(null)
            } else {
                const error = await response.json()
                toast.error(error.message || 'Error al eliminar el movimiento')
            }
        } catch (error) {
            console.error('Error deleting movement:', error)
            toast.error('Error al eliminar el movimiento')
        }
    }

    const handleMovementSuccess = () => {
        fetchMovements()
    }

    const handleImportExcel = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/stock/movements/import/excel', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                alert(`Importación exitosa: ${result.imported} movimientos importados`)
                fetchMovements()
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

            const response = await fetch(`/api/stock/movements/export/excel?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `movimientos_${new Date().toISOString().split('T')[0]}.xlsx`
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

            const response = await fetch(`/api/stock/movements/export/pdf?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `movimientos_${new Date().toISOString().split('T')[0]}.pdf`
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

    const fetchClientsAndProviders = async () => {
        if (!session?.user?.organizationId) {
            console.error('No organization ID available in session')
            return
        }

        setDataLoading(true)
        try {
            console.log('Fetching clients and providers...')

            // Fetch clients
            const clientsResponse = await fetch(`/api/clients?organizationId=${session.user.organizationId}`)
            if (clientsResponse.ok) {
                const clientsData = await clientsResponse.json()
                console.log('Clients loaded:', clientsData.length)
                const clientsMap: { [key: string]: string } = {}
                clientsData.forEach((client: any) => {
                    clientsMap[client.id] = client.name
                })
                setClients(clientsMap)
                console.log('Clients map created:', Object.keys(clientsMap).length, 'entries')
            } else {
                console.error('Failed to fetch clients:', clientsResponse.status)
            }

            // Fetch providers
            const providersResponse = await fetch(`/api/providers?organizationId=${session.user.organizationId}`)
            if (providersResponse.ok) {
                const providersData = await providersResponse.json()
                console.log('Providers loaded:', providersData.length)
                const providersMap: { [key: string]: string } = {}
                providersData.forEach((provider: any) => {
                    providersMap[provider.id] = provider.name
                })
                setProviders(providersMap)
                console.log('Providers map created:', Object.keys(providersMap).length, 'entries')
            } else {
                console.error('Failed to fetch providers:', providersResponse.status)
            }
        } catch (error) {
            console.error('Error fetching clients and providers:', error)
        } finally {
            setDataLoading(false)
        }
    }

    const filteredMovements = useMemo(() => {
        let filtered = movements.filter(movement => {
            const matchesSearch = movement.material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (movement.material.code && movement.material.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (movement.reference && movement.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (movement.fromWarehouse?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (movement.toWarehouse?.name.toLowerCase().includes(searchTerm.toLowerCase()))

            if (!matchesSearch) return false

            if (filterBy === 'all') return true
            return movement.type === filterBy
        })

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortField) {
                case 'date':
                    aValue = new Date(a.date).getTime()
                    bValue = new Date(b.date).getTime()
                    break
                case 'material':
                    aValue = a.material.name.toLowerCase()
                    bValue = b.material.name.toLowerCase()
                    break
                case 'type':
                    aValue = a.type
                    bValue = b.type
                    break
                case 'quantity':
                    aValue = a.quantity
                    bValue = b.quantity
                    break
                case 'warehouse':
                    aValue = (a.fromWarehouse?.name || a.toWarehouse?.name || '').toLowerCase()
                    bValue = (b.fromWarehouse?.name || b.toWarehouse?.name || '').toLowerCase()
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [movements, searchTerm, filterBy, sortField, sortDirection])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, filterBy, sortField, sortDirection])

    const paginatedMovements = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredMovements.slice(startIndex, endIndex)
    }, [filteredMovements, currentPage, itemsPerPage])

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'ENTRADA':
                return <ArrowDown className="h-4 w-4 text-green-600" />
            case 'SALIDA':
                return <ArrowUp className="h-4 w-4 text-red-600" />
            case 'TRANSFERENCIA':
                return <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            default:
                return null
        }
    }

    const getMovementBadge = (type: string) => {
        switch (type) {
            case 'ENTRADA':
                return <Badge variant="default" className="bg-green-100 text-green-800">Entrada</Badge>
            case 'SALIDA':
                return <Badge variant="destructive">Salida</Badge>
            case 'TRANSFERENCIA':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Transferencia</Badge>
            default:
                return <Badge variant="secondary">{type}</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getOriginName = (movement: StockMovement) => {
        if (movement.originType === 'CUSTOM' && movement.originName) {
            return movement.originName
        }
        if (movement.originType === 'CLIENT' && movement.originId) {
            const clientName = clients[movement.originId]
            if (clientName) {
                return `Cliente: ${clientName}`
            }
            return dataLoading ? 'Cargando cliente...' : `Cliente no encontrado (ID: ${movement.originId})`
        }
        if (movement.originType === 'PROVIDER' && movement.originId) {
            const providerName = providers[movement.originId]
            if (providerName) {
                return `Proveedor: ${providerName}`
            }
            return dataLoading ? 'Cargando proveedor...' : `Proveedor no encontrado (ID: ${movement.originId})`
        }
        return movement.fromWarehouse?.name || '-'
    }

    const getDestName = (movement: StockMovement) => {
        if (movement.destType === 'CUSTOM' && movement.destName) {
            return movement.destName
        }
        if (movement.destType === 'CLIENT' && movement.destId) {
            const clientName = clients[movement.destId]
            if (clientName) {
                return `Cliente: ${clientName}`
            }
            return dataLoading ? 'Cargando cliente...' : `Cliente no encontrado (ID: ${movement.destId})`
        }
        if (movement.destType === 'PROVIDER' && movement.destId) {
            const providerName = providers[movement.destId]
            if (providerName) {
                return `Proveedor: ${providerName}`
            }
            return dataLoading ? 'Cargando proveedor...' : `Proveedor no encontrado (ID: ${movement.destId})`
        }
        return movement.toWarehouse?.name || '-'
    }

    if (!session) {
        return (
            <Layout
                title="Movimientos de Stock"
                subtitle="Registro de entradas, salidas y transferencias"
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Cargando sesión...</div>
                </div>
            </Layout>
        )
    }

    if (loading) {
        return (
            <Layout
                title="Movimientos de Stock"
                subtitle="Registro de entradas, salidas y transferencias"
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Cargando movimientos...</div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout
            title="Movimientos de Stock"
            subtitle="Registro de entradas, salidas y transferencias"
        >
            <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Total Movimientos</CardTitle>
                            <History className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold">{filteredMovements.length}</div>
                            <p className="text-xs text-muted-foreground">Operaciones realizadas</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Entradas</CardTitle>
                            <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-green-600">
                                {filteredMovements.filter(m => m.type === 'ENTRADA').length}
                            </div>
                            <p className="text-xs text-muted-foreground">Materiales recibidos</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Salidas</CardTitle>
                            <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-red-600">
                                {filteredMovements.filter(m => m.type === 'SALIDA').length}
                            </div>
                            <p className="text-xs text-muted-foreground">Materiales consumidos</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Transferencias</CardTitle>
                            <ArrowRightLeft className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-blue-600">
                                {filteredMovements.filter(m => m.type === 'TRANSFERENCIA').length}
                            </div>
                            <p className="text-xs text-muted-foreground">Entre almacenes</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                        <div className="flex flex-col space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Buscar por material, almacén o referencia..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={filterBy === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterBy('all')}
                                    className="flex-1 sm:flex-none min-w-0"
                                >
                                    Todos
                                </Button>
                                <Button
                                    variant={filterBy === 'ENTRADA' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterBy('ENTRADA')}
                                    className="flex-1 sm:flex-none min-w-0"
                                >
                                    Entradas
                                </Button>
                                <Button
                                    variant={filterBy === 'SALIDA' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterBy('SALIDA')}
                                    className="flex-1 sm:flex-none min-w-0"
                                >
                                    Salidas
                                </Button>
                                <Button
                                    variant={filterBy === 'TRANSFERENCIA' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterBy('TRANSFERENCIA')}
                                    className="flex-1 sm:flex-none min-w-0"
                                >
                                    Transferencias
                                </Button>
                                {(searchTerm || filterBy !== 'all') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSearchTerm('')
                                            setFilterBy('all')
                                            setSortField('date')
                                            setSortDirection('desc')
                                        }}
                                        className="flex-1 sm:flex-none min-w-0"
                                    >
                                        Limpiar
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de movimientos */}
                <Card>
                    <CardHeader className="px-4 sm:px-6">
                        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="flex items-center">
                                <History className="mr-2 h-5 w-5" />
                                <span className="text-sm sm:text-base">Movimientos ({filteredMovements.length})</span>
                            </div>
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            {dataLoading && <span className="text-blue-600">(Cargando datos...)</span>}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        {filteredMovements.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 px-4">
                                <History className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-4" />
                                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                                    {movements.length === 0 ? 'No hay movimientos registrados' : 'No se encontraron resultados'}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    {movements.length === 0
                                        ? 'Comienza registrando entradas, salidas o transferencias'
                                        : 'Intenta con otros términos de búsqueda'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16 sm:w-20">
                                                <button
                                                    onClick={() => {
                                                        if (sortField === 'date') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('date')
                                                            setSortDirection('desc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Fecha
                                                    {sortField === 'date' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead className="w-20 sm:w-24">
                                                <button
                                                    onClick={() => {
                                                        if (sortField === 'type') {
                                                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                        } else {
                                                            setSortField('type')
                                                            setSortDirection('asc')
                                                        }
                                                    }}
                                                    className="flex items-center hover:text-gray-700"
                                                >
                                                    Tipo
                                                    {sortField === 'type' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead className="w-32 sm:w-48">
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
                                            <TableHead className="w-16 sm:w-20">
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
                                                    Cant.
                                                    {sortField === 'quantity' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead className="hidden sm:table-cell w-32">Origen</TableHead>
                                            <TableHead className="hidden sm:table-cell w-32">
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
                                                    Destino
                                                    {sortField === 'warehouse' && (
                                                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </button>
                                            </TableHead>
                                            <TableHead className="hidden md:table-cell w-24">Referencia</TableHead>
                                            <TableHead className="w-16">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedMovements.map((movement) => (
                                            <TableRow key={movement.id}>
                                                <TableCell className="font-medium text-xs sm:text-sm">
                                                    {formatDate(movement.date)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        {getMovementIcon(movement.type)}
                                                        <span className="ml-1 sm:ml-2 text-xs sm:text-sm">
                                                            {getMovementBadge(movement.type)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium text-xs sm:text-sm">{movement.material.name}</div>
                                                        <div className="text-xs text-gray-500 hidden sm:block">
                                                            {movement.material.code || 'Sin código'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {movement.quantity} {movement.material.unit}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                                                    {getOriginName(movement)}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                                                    {getDestName(movement)}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                                                    {movement.reference || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleViewMovement(movement)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Ver detalles
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleEditMovement(movement)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteMovement(movement)}
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

                        {/* Pagination */}
                        {filteredMovements.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredMovements.length / itemsPerPage)}
                                totalItems={filteredMovements.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                                onImportExcel={() => setShowImportModal(true)}
                                onExportExcel={handleExportExcel}
                                onExportPDF={handleExportPDF}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modals */}
            <MovementDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    console.log('Closing details modal')
                    setIsDetailsModalOpen(false)
                    setSelectedMovement(null)
                }}
                movement={selectedMovement}
            />

            <MovementFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                movement={selectedMovement}
                onSuccess={handleMovementSuccess}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteMovement}
                title="Eliminar Movimiento"
                message={`¿Estás seguro de que quieres eliminar este movimiento de ${selectedMovement?.quantity} ${selectedMovement?.material?.unit} de ${selectedMovement?.material?.name}? Esta acción afectará el inventario y no se puede deshacer.`}
            />

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
                                    <li>Columnas: Fecha, Tipo, Material, Cantidad, Origen, Destino, Descripción, Referencia</li>
                                    <li>Tipos válidos: Entrada, Salida, Transferencia</li>
                                    <li>Los materiales y almacenes deben existir previamente</li>
                                    <li>La fecha debe estar en formato DD/MM/YYYY</li>
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
        </Layout>
    )
}
