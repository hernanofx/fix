'use client'

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '../../components/Layout'
import RubroFormModal from '../../components/modals/RubroFormModal'
import Pagination from '@/components/ui/Pagination'
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'

interface Rubro {
    id: string
    name: string
    description?: string
    code?: string
    color?: string
    type: 'PROVIDER' | 'CLIENT'
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
    createdAt: string
}

export default function RubrosPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <RubrosContent />
        </Suspense>
    )
}

function RubrosContent() {
    const [rubros, setRubros] = useState<Rubro[]>([])
    const [loading, setLoading] = useState(true)
    // Filter and sort states
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [typeFilter, setTypeFilter] = useState('ALL')
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRubro, setSelectedRubro] = useState<Rubro | null>(null)
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
    const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>({})
    // Estados para importación
    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)

    const searchParams = useSearchParams()

    useEffect(() => {
        fetchRubros()
    }, [statusFilter, typeFilter])

    useEffect(() => {
        // Check URL parameters for automatic modal opening
        const rubroId = searchParams.get('rubroId')
        const mode = searchParams.get('mode')
        const modal = searchParams.get('modal')

        if (modal === 'create') {
            handleCreate()
        } else if (rubroId && mode) {
            const rubro = rubros.find(r => r.id === rubroId)
            if (rubro) {
                setSelectedRubro(rubro)
                setModalMode(mode === 'view' ? 'view' : 'edit')
                setIsModalOpen(true)
            }
        }
    }, [searchParams, rubros])

    // Cerrar dropdown al hacer click fuera (permitir clicks dentro del contenido del dropdown)
    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            const target = event.target as Element
            // Si el click fue en el trigger o dentro del contenido del dropdown, no cerrar
            if (target.closest('[data-dropdown-trigger]') || target.closest('[data-dropdown-content]')) {
                return
            }
            setDropdownStates({})
        }

        document.addEventListener('click', handleDocumentClick)
        return () => {
            document.removeEventListener('click', handleDocumentClick)
        }
    }, [])

    const toggleDropdown = useCallback((id: string) => {
        setDropdownStates(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }, [])

    const fetchRubros = async () => {
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'ALL') {
                params.append('status', statusFilter)
            }
            if (typeFilter !== 'ALL') {
                params.append('type', typeFilter)
            }

            const response = await fetch(`/api/rubros?${params}`)
            if (response.ok) {
                const data = await response.json()
                setRubros(data)
            }
        } catch (error) {
            console.error('Error fetching rubros:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filtered and sorted rubros (sin paginación para estadísticas)
    const filteredRubros = useMemo(() => {
        let filtered = rubros.filter(rubro =>
            rubro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (rubro.code && rubro.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (rubro.description && rubro.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )

        // Apply status filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(rubro => rubro.status === statusFilter)
        }

        // Apply type filter
        if (typeFilter !== 'ALL') {
            filtered = filtered.filter(rubro => rubro.type === typeFilter)
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
                case 'type':
                    aValue = a.type
                    bValue = b.type
                    break
                case 'status':
                    aValue = a.status
                    bValue = b.status
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
    }, [rubros, searchTerm, statusFilter, typeFilter, sortField, sortDirection])

    // Datos paginados para mostrar
    const paginatedRubros = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredRubros.slice(startIndex, endIndex)
    }, [filteredRubros, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, typeFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredRubros.length / itemsPerPage)

    const handleCreate = () => {
        setSelectedRubro(null)
        setModalMode('create')
        setIsModalOpen(true)
    }

    const handleView = (rubro: Rubro) => {
        // Abrir modal en modo sólo lectura
        setSelectedRubro(rubro)
        setModalMode('view')
        setIsModalOpen(true)
        setDropdownStates({})
    }

    const handleEdit = (rubro: Rubro) => {
        // Abrir modal en modo edición
        setSelectedRubro(rubro)
        setModalMode('edit')
        setIsModalOpen(true)
        setDropdownStates({})
    }

    const handleDelete = async (rubro: Rubro) => {
        setDropdownStates({})
        const ok = confirm(`¿Eliminar rubro: ${rubro.name}? Esta acción no se puede deshacer.`)
        if (!ok) return

        try {
            const res = await fetch(`/api/rubros/${rubro.id}`, { method: 'DELETE' })
            if (res.ok) {
                await fetchRubros()
            } else {
                const err = await res.json().catch(() => null)
                alert(err?.error || 'No se pudo eliminar el rubro')
            }
        } catch (error) {
            console.error('Error deleting rubro:', error)
            alert('Error al eliminar el rubro')
        }
    }

    const handleSave = async (rubroData: any) => {
        try {
            const url = selectedRubro ? `/api/rubros/${selectedRubro.id}` : '/api/rubros'
            const method = selectedRubro ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rubroData)
            })

            if (response.ok) {
                fetchRubros()
                setIsModalOpen(false)
                setSelectedRubro(null)
                setModalMode('create')
            } else {
                const error = await response.json()
                alert(error.error || 'Error al guardar el rubro')
            }
        } catch (error) {
            console.error('Error saving rubro:', error)
            alert('Error al guardar el rubro')
        }
    }

    // Función para manejar importación desde Excel
    const handleImportExcel = () => {
        setShowImportModal(true)
    }

    // Función para manejar exportación a Excel
    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'ALL') params.append('status', statusFilter)
            if (typeFilter !== 'ALL') params.append('type', typeFilter)
            if (searchTerm) params.append('searchTerm', searchTerm)
            params.append('sortField', sortField)
            params.append('sortDirection', sortDirection)

            const response = await fetch(`/api/rubros/export/excel?${params}`)

            if (!response.ok) {
                throw new Error('Error al exportar')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `rubros_${new Date().toISOString().split('T')[0]}.xlsx`
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
            const params = new URLSearchParams()
            if (statusFilter !== 'ALL') params.append('status', statusFilter)
            if (typeFilter !== 'ALL') params.append('type', typeFilter)
            if (searchTerm) params.append('searchTerm', searchTerm)
            params.append('sortField', sortField)
            params.append('sortDirection', sortDirection)

            const response = await fetch(`/api/rubros/export/pdf?${params}`)

            if (!response.ok) {
                throw new Error('Error al exportar')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `rubros_${new Date().toISOString().split('T')[0]}.pdf`
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

            const res = await fetch('/api/rubros/import/excel', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error || 'Error al importar archivo')
            }

            const result = await res.json()

            // Recargar los datos
            await fetchRubros()

            alert(`Archivo importado exitosamente. ${result.importedCount || 0} registros procesados.`)
            setShowImportModal(false)
        } catch (error) {
            console.error('Error importing file:', error)
            alert(`Error al importar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        } finally {
            setImporting(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800'
            case 'INACTIVE':
                return 'bg-yellow-100 text-yellow-800'
            case 'ARCHIVED':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'Activo'
            case 'INACTIVE':
                return 'Inactivo'
            case 'ARCHIVED':
                return 'Archivado'
            default:
                return status
        }
    }

    const getTypeText = (type: string) => {
        switch (type) {
            case 'PROVIDER':
                return 'Proveedor'
            case 'CLIENT':
                return 'Cliente'
            default:
                return type
        }
    }

    if (loading) {
        return (
            <Layout title="Rubros" subtitle="Gestiona las categorías y clasificaciones">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Rubros" subtitle="Gestiona las categorías y clasificaciones de tu organización">
            <div className="space-y-6">
                {/* Header and Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div></div>
                    <button
                        onClick={handleCreate}
                        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Rubro
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Rubros</p>
                                <p className="text-2xl font-bold text-gray-900">{filteredRubros.length}</p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Filter className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Rubros Activos</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {filteredRubros.filter((rubro: Rubro) => rubro.status === 'ACTIVE').length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Rubros Inactivos</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {filteredRubros.filter((rubro: Rubro) => rubro.status === 'INACTIVE').length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Rubros Proveedores</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {filteredRubros.filter((rubro: Rubro) => rubro.type === 'PROVIDER').length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Rubros Clientes</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {filteredRubros.filter((rubro: Rubro) => rubro.type === 'CLIENT').length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, código o descripción..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="ALL">Todos los estados</option>
                                <option value="ACTIVE">Activos</option>
                                <option value="INACTIVE">Inactivos</option>
                                <option value="ARCHIVED">Archivados</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="ALL">Todos los tipos</option>
                                <option value="PROVIDER">Proveedores</option>
                                <option value="CLIENT">Clientes</option>
                            </select>
                        </div>
                        <div className="flex space-x-2">
                            {(searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('')
                                        setStatusFilter('ALL')
                                        setTypeFilter('ALL')
                                        setSortField('name')
                                        setSortDirection('asc')
                                    }}
                                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                            Rubro
                                            {sortField === 'name' && (
                                                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Descripción
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                    </th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedRubros.map((rubro) => (
                                    <tr
                                        key={rubro.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleView(rubro)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {rubro.color && (
                                                    <div
                                                        className="w-4 h-4 rounded-full mr-3"
                                                        style={{ backgroundColor: rubro.color }}
                                                    ></div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{rubro.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{rubro.code || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${rubro.type === 'PROVIDER'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {getTypeText(rubro.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {rubro.description || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rubro.status)}`}>
                                                {getStatusText(rubro.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleDropdown(rubro.id)
                                                    }}
                                                    data-dropdown-trigger
                                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                                >
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </button>
                                                {dropdownStates[rubro.id] && (
                                                    <div
                                                        data-dropdown-content
                                                        className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                                    >
                                                        <div className="py-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleView(rubro)
                                                                }}
                                                                className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                                                            >
                                                                <Eye className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                                                Ver
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleEdit(rubro)
                                                                }}
                                                                className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                                                            >
                                                                <Edit className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDelete(rubro)
                                                                }}
                                                                className="group flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-100 hover:text-red-900 w-full text-left"
                                                            >
                                                                <Trash2 className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" />
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredRubros.length === 0 && (
                        <div className="text-center py-12">
                            <Filter className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron rubros</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                                    ? 'Intenta ajustar los filtros de búsqueda'
                                    : 'Comienza creando tu primer rubro'
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {paginatedRubros.map((rubro) => (
                        <div
                            key={rubro.id}
                            className="bg-white shadow-sm rounded-lg p-4 border cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleView(rubro)}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    {rubro.color && (
                                        <div
                                            className="w-6 h-6 rounded-full mr-3"
                                            style={{ backgroundColor: rubro.color }}
                                        ></div>
                                    )}
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{rubro.name}</div>
                                        <div className="text-xs text-gray-500">{rubro.code || 'Sin código'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${rubro.type === 'PROVIDER'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                        }`}>
                                        {getTypeText(rubro.type)}
                                    </span>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rubro.status)}`}>
                                        {getStatusText(rubro.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-medium text-gray-500">Descripción</div>
                                    <div className="text-sm text-gray-900">
                                        {rubro.description || 'Sin descripción'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggleDropdown(rubro.id)
                                        }}
                                        data-dropdown-trigger
                                        className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                                    >
                                        <EllipsisVerticalIcon className="h-5 w-5" />
                                    </button>
                                    {dropdownStates[rubro.id] && (
                                        <div
                                            data-dropdown-content
                                            className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                        >
                                            <div className="py-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleView(rubro)
                                                    }}
                                                    className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                                                >
                                                    <Eye className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                                    Ver
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleEdit(rubro)
                                                    }}
                                                    className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                                                >
                                                    <Edit className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDelete(rubro)
                                                    }}
                                                    className="group flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-100 hover:text-red-900 w-full text-left"
                                                >
                                                    <Trash2 className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" />
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredRubros.length === 0 && (
                        <div className="text-center py-12">
                            <Filter className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron rubros</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                                    ? 'Intenta ajustar los filtros de búsqueda'
                                    : 'Comienza creando tu primer rubro'
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {filteredRubros.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredRubros.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                        onImportExcel={handleImportExcel}
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                    />
                )}

                {/* Modal */}
                <RubroFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    rubro={selectedRubro}
                    readOnly={modalMode === 'view'}
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
                                        <li>Columnas: Nombre, Código, Tipo, Descripción, Estado, Color</li>
                                        <li>Tipos válidos: Proveedor, Cliente</li>
                                        <li>Estados válidos: Activo, Inactivo, Archivado</li>
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
