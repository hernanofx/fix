"use client"

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Calendar, DollarSign, Filter, ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import Layout from '@/components/Layout'
import PaymentTermModal from '@/components/modals/PaymentTermModal'
import Pagination from '@/components/ui/Pagination'

interface PaymentTerm {
    id: string
    type: 'INCOME' | 'EXPENSE'
    entityType: 'CLIENT' | 'PROVIDER'
    clientId?: string
    providerId?: string
    projectId?: string
    amount: number
    currency: string
    startDate: string
    recurrence: string
    periods: number
    status: string
    description?: string
    client?: { name: string }
    provider?: { name: string }
    project?: { name: string }
}

interface Client {
    id: string
    name: string
}

interface Provider {
    id: string
    name: string
}

interface Project {
    id: string
    name: string
}

export default function PaymentTerms() {
    const { data: session } = useSession()
    const [terms, setTerms] = useState<PaymentTerm[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [providers, setProviders] = useState<Provider[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTerm, setEditingTerm] = useState<PaymentTerm | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Estados para filtros y ordenamiento
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [entityFilter, setEntityFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('createdAt')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Estado para búsqueda
    const [searchTerm, setSearchTerm] = useState('')

    // Estados para importación
    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)

    useEffect(() => {
        if (session?.user?.organizationId) {
            console.log('Organization ID del usuario:', session.user.organizationId)
            fetchTerms()
            fetchEntities()
        }
    }, [session, sortField, sortDirection, typeFilter, entityFilter, statusFilter, searchTerm])

    const fetchTerms = async () => {
        try {
            const params = new URLSearchParams({
                organizationId: session?.user?.organizationId || '',
                sortField: sortField,
                sortDirection: sortDirection,
                ...(typeFilter !== 'all' && { typeFilter }),
                ...(entityFilter !== 'all' && { entityFilter }),
                ...(statusFilter !== 'all' && { statusFilter }),
                ...(searchTerm.trim() && { searchTerm: searchTerm.trim() })
            })

            const response = await fetch(`/api/payment-terms?${params}`)
            if (response.ok) {
                const data = await response.json()
                setTerms(data)
            } else {
                console.error('Error al cargar términos:', response.status)
            }
        } catch (error) {
            console.error('Error al cargar términos:', error)
            toast.error('Error al cargar términos de pago')
        }
    }

    const fetchEntities = async () => {
        try {
            const [clientsRes, providersRes, projectsRes] = await Promise.all([
                fetch(`/api/clients?organizationId=${session?.user?.organizationId}`),
                fetch(`/api/providers?organizationId=${session?.user?.organizationId}`),
                fetch(`/api/projects?organizationId=${session?.user?.organizationId}`)
            ])

            if (clientsRes.ok) {
                const clientsData = await clientsRes.json()
                console.log('Clientes cargados:', clientsData) // Debug log
                setClients(clientsData)
            } else {
                console.error('Error al cargar clientes:', clientsRes.status)
            }

            if (providersRes.ok) {
                const providersData = await providersRes.json()
                console.log('Proveedores cargados:', providersData) // Debug log
                setProviders(providersData)
            } else {
                console.error('Error al cargar proveedores:', providersRes.status)
            }

            if (projectsRes.ok) {
                const projectsData = await projectsRes.json()
                console.log('Proyectos cargados:', projectsData) // Debug log
                setProjects(projectsData)
            } else {
                console.error('Error al cargar proyectos:', projectsRes.status)
            }
        } catch (error) {
            console.error('Error al cargar entidades:', error)
            toast.error('Error al cargar entidades')
        }
    }

    // Filtered and sorted terms (simplified since filtering is done in backend)
    const filteredTerms = useMemo(() => {
        return terms
    }, [terms])

    // Datos paginados para mostrar
    const paginatedTerms = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredTerms.slice(startIndex, endIndex)
    }, [filteredTerms, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [typeFilter, entityFilter, statusFilter, sortField, sortDirection, searchTerm])

    // Calculate total pages
    const totalPages = Math.ceil(filteredTerms.length / itemsPerPage)

    // Obtener opciones únicas para filtros
    const uniqueTypes = useMemo(() => {
        const types = terms.map(t => t.type).filter(Boolean)
        return Array.from(new Set(types))
    }, [terms])

    const uniqueEntityTypes = useMemo(() => {
        const entityTypes = terms.map(t => t.entityType).filter(Boolean)
        return Array.from(new Set(entityTypes))
    }, [terms])

    const uniqueStatuses = useMemo(() => {
        const statuses = terms.map(t => t.status).filter(Boolean)
        return Array.from(new Set(statuses))
    }, [terms])

    // Función para manejar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
        fetchTerms()
    }

    const handleEdit = (term: PaymentTerm) => {
        setEditingTerm(term)
        setIsModalOpen(true)
    }

    const getEntityName = (term: PaymentTerm) => {
        if (term.entityType === 'CLIENT' && term.client) {
            return term.client.name
        } else if (term.entityType === 'PROVIDER' && term.provider) {
            return term.provider.name
        }
        return 'Entidad no encontrada'
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este término?')) return

        try {
            const response = await fetch(`/api/payment-terms?id=${id}`, { method: 'DELETE' })
            if (response.ok) {
                toast.success('Término eliminado')
                fetchTerms()
            } else {
                toast.error('Error al eliminar')
            }
        } catch (error) {
            toast.error('Error de conexión')
        }
    }

    // Función para manejar importación desde Excel
    const handleImportExcel = () => {
        setShowImportModal(true)
    }

    // Función para manejar exportación a Excel
    const handleExportExcel = async () => {
        try {
            const orgId = (session as any)?.user?.organizationId
            if (!orgId) {
                alert('No se pudo obtener la organización')
                return
            }

            const response = await fetch(`/api/payment-terms/export/excel?organizationId=${orgId}&typeFilter=${typeFilter}&entityFilter=${entityFilter}&statusFilter=${statusFilter}&searchTerm=${encodeURIComponent(searchTerm)}`)

            if (!response.ok) {
                throw new Error('Error al exportar')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `condiciones_pago_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error exporting to Excel:', error)
            alert('Error al exportar a Excel')
        }
    }

    // Función para manejar exportación a PDF
    const handleExportPDF = async () => {
        try {
            const orgId = (session as any)?.user?.organizationId
            if (!orgId) {
                alert('No se pudo obtener la organización')
                return
            }

            const response = await fetch(`/api/payment-terms/export/pdf?organizationId=${orgId}&typeFilter=${typeFilter}&entityFilter=${entityFilter}&statusFilter=${statusFilter}&searchTerm=${encodeURIComponent(searchTerm)}`)

            if (!response.ok) {
                throw new Error('Error al exportar')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `condiciones_pago_${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error exporting to PDF:', error)
            alert('Error al exportar a PDF')
        }
    }

    // Función para procesar el archivo importado
    const handleFileImport = async (file: File) => {
        if (!file) return

        setImporting(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('organizationId', (session as any)?.user?.organizationId)

            const endpoint = '/api/payment-terms/import/excel'

            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error || 'Error al importar archivo')
            }

            const result = await res.json()

            // Recargar los datos
            fetchTerms()

            alert(`Archivo importado exitosamente. ${result.importedCount || 0} registros procesados.`)
            setShowImportModal(false)
        } catch (error) {
            console.error('Error importing file:', error)
            alert(`Error al importar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        } finally {
            setImporting(false)
        }
    }

    return (
        <Layout title="Condiciones de Cobros/Pagos" subtitle="Gestiona términos recurrentes de ingresos y egresos">
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Condiciones de Cobros/Pagos</h1>
                        <p className="text-gray-600">Gestiona términos recurrentes de ingresos y egresos</p>
                    </div>

                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Término
                    </Button>
                </div>

                {/* Barra de filtros y búsqueda */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Filtros y Búsqueda</h3>

                        {/* Indicadores de filtros activos */}
                        {(typeFilter !== 'all' || entityFilter !== 'all' || statusFilter !== 'all' || sortField !== 'createdAt') && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Filtros activos:</span>
                                {typeFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Tipo: {typeFilter === 'INCOME' ? 'Ingreso' : 'Egreso'}
                                        <button
                                            onClick={() => setTypeFilter('all')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                            title="Quitar filtro de tipo"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {entityFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Entidad: {entityFilter === 'CLIENT' ? 'Cliente' : 'Proveedor'}
                                        <button
                                            onClick={() => setEntityFilter('all')}
                                            className="ml-1 text-green-600 hover:text-green-800"
                                            title="Quitar filtro de entidad"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {statusFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        Estado: {statusFilter}
                                        <button
                                            onClick={() => setStatusFilter('all')}
                                            className="ml-1 text-purple-600 hover:text-purple-800"
                                            title="Quitar filtro de estado"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {sortField !== 'createdAt' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        Orden: {sortField === 'amount' ? 'Monto' : sortField === 'startDate' ? 'Fecha' : 'Campo'} {sortDirection === 'asc' ? '↑' : '↓'}
                                        <button
                                            onClick={() => {
                                                setSortField('createdAt')
                                                setSortDirection('desc')
                                            }}
                                            className="ml-1 text-orange-600 hover:text-orange-800"
                                            title="Quitar ordenamiento"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Filtro de tipo */}
                        <div>
                            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo
                            </label>
                            <select
                                id="type-filter"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Todos</option>
                                {uniqueTypes.map(type => (
                                    <option key={type} value={type}>
                                        {type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro de entidad */}
                        <div>
                            <label htmlFor="entity-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Entidad
                            </label>
                            <select
                                id="entity-filter"
                                value={entityFilter}
                                onChange={(e) => setEntityFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Todas</option>
                                {uniqueEntityTypes.map(entityType => (
                                    <option key={entityType} value={entityType}>
                                        {entityType === 'CLIENT' ? 'Cliente' : 'Proveedor'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro de estado */}
                        <div>
                            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Estado
                            </label>
                            <select
                                id="status-filter"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Todos</option>
                                {uniqueStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Botón para limpiar filtros */}
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setTypeFilter('all')
                                    setEntityFilter('all')
                                    setStatusFilter('all')
                                    setSearchTerm('')
                                    setSortField('createdAt')
                                    setSortDirection('desc')
                                }}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla de términos */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Términos de Pago</h3>
                            <div className="text-sm text-gray-600">
                                {filteredTerms.length} términos encontrados
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('type')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Tipo
                                            {sortField === 'type' && (
                                                <span className="text-gray-400">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('entityType')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Entidad
                                            {sortField === 'entityType' && (
                                                <span className="text-gray-400">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th
                                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('amount')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Monto
                                            {sortField === 'amount' && (
                                                <span className="text-gray-400">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Recurrencia
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('startDate')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Inicio
                                            {sortField === 'startDate' && (
                                                <span className="text-gray-400">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedTerms.map((term) => (
                                    <tr key={term.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(term)}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${term.type === 'INCOME'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {term.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {term.entityType === 'CLIENT' ? 'Cliente' : 'Proveedor'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {getEntityName(term)}
                                            </div>
                                            {term.project && (
                                                <div className="text-xs text-gray-500">
                                                    Proyecto: {term.project.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <span className={term.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                                                ${term.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {term.currency}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {term.recurrence} ({term.periods} períodos)
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(term.startDate).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${term.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                term.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {term.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleEdit(term)
                                                    }}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDelete(term.id)
                                                        }}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mostrar mensaje si no hay términos filtrados */}
                    {filteredTerms.length === 0 && (
                        <div className="px-6 py-8 text-center">
                            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay términos encontrados</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm.trim()
                                    ? `No se encontraron términos que coincidan con "${searchTerm}".`
                                    : typeFilter !== 'all' || entityFilter !== 'all' || statusFilter !== 'all'
                                        ? 'No se encontraron términos con los filtros aplicados.'
                                        : 'No se encontraron términos de pago.'
                                }
                            </p>
                            {(searchTerm.trim() || typeFilter !== 'all' || entityFilter !== 'all' || statusFilter !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('')
                                        setTypeFilter('all')
                                        setEntityFilter('all')
                                        setStatusFilter('all')
                                    }}
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    )}

                    {/* Información de resumen */}
                    {filteredTerms.length > 0 && (
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Mostrando {Math.min(paginatedTerms.length, itemsPerPage)} de {filteredTerms.length} términos
                                {typeFilter !== 'all' && (
                                    <span className="ml-2 text-blue-600">
                                        (tipo: {typeFilter === 'INCOME' ? 'Ingreso' : 'Egreso'})
                                    </span>
                                )}
                                {entityFilter !== 'all' && (
                                    <span className="ml-2 text-green-600">
                                        (entidad: {entityFilter === 'CLIENT' ? 'Cliente' : 'Proveedor'})
                                    </span>
                                )}
                                {statusFilter !== 'all' && (
                                    <span className="ml-2 text-purple-600">
                                        (estado: {statusFilter})
                                    </span>
                                )}
                                {searchTerm.trim() && (
                                    <span className="ml-2 text-orange-600">
                                        (búsqueda: "{searchTerm}")
                                    </span>
                                )}
                                {sortField !== 'createdAt' && (
                                    <span className="ml-2 text-indigo-600">
                                        (ordenado por: {sortField === 'amount' ? 'Monto' : sortField === 'startDate' ? 'Fecha' : sortField} {sortDirection === 'asc' ? '↑' : '↓'})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Paginación */}
                {filteredTerms.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredTerms.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Buscar términos de pago..."
                        onImportExcel={handleImportExcel}
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
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
                                        <li>Columnas: Tipo, Entidad, Cliente/Proveedor, Monto, Moneda, FechaInicio, Recurrencia, Periodos, Descripcion</li>
                                        <li>Tipos válidos: INCOME, EXPENSE</li>
                                        <li>Entidades válidas: CLIENT, PROVIDER</li>
                                        <li>Monedas válidas: PESOS, USD, EUR</li>
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

                {/* Modal personalizado */}
                <PaymentTermModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setEditingTerm(null)
                    }}
                    onSave={(termData) => {
                        fetchTerms()
                        setIsModalOpen(false)
                        setEditingTerm(null)
                    }}
                    term={editingTerm}
                    clients={clients}
                    providers={providers}
                    projects={projects}
                />
            </div>
        </Layout>
    )
}
