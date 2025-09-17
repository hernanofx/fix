"use client"

import Layout from '../../components/Layout'
import ProviderFormModal from '../../components/modals/ProviderFormModal'
import { ProviderImportModal } from '../../components/modals/ProviderImportModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '@/components/ui/Pagination'
import { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, EyeIcon, PlusIcon } from '@heroicons/react/24/outline'

function ProvidersContent() {
    const { data: session } = useSession()
    const searchParams = useSearchParams()
    const [providers, setProviders] = useState<any[]>([])

    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false,
        details: false,
        import: false,
    })

    const [selectedProvider, setSelectedProvider] = useState<any>(null)
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Estados para filtros y ordenamiento
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        const load = async () => {
            try {
                const orgId = session?.user?.organizationId
                if (!orgId) return
                const res = await fetch(`/api/providers?organizationId=${orgId}`)
                if (!res.ok) return
                const data = await res.json()
                setProviders(data)
            } catch (e) {
                console.error(e)
            }
        }
        load()
    }, [session])

    // Detectar parámetro modal=create en la URL y abrir modal automáticamente
    useEffect(() => {
        const modal = searchParams.get('modal')
        if (modal === 'create') {
            openModal('create')
        }
    }, [searchParams])

    // Lógica de filtrado y ordenamiento (sin paginación para estadísticas)
    const filteredProviders = useMemo(() => {
        let filtered = providers

        // Aplicar filtro de categoría
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(provider => provider.category === categoryFilter)
        }

        // Aplicar filtro de estado
        if (statusFilter !== 'all') {
            filtered = filtered.filter(provider => provider.status === statusFilter)
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            // Manejar casos especiales
            if (sortField === 'name') {
                aValue = (aValue || '').toLowerCase()
                bValue = (bValue || '').toLowerCase()
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [providers, categoryFilter, statusFilter, sortField, sortDirection])

    // Datos paginados para mostrar en la tabla
    const paginatedProviders = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredProviders.slice(startIndex, endIndex)
    }, [filteredProviders, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [categoryFilter, statusFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredProviders.length / itemsPerPage)

    // Obtener categorías únicas para el filtro
    const uniqueCategories = useMemo(() => {
        const categories = providers.map(p => p.category).filter(Boolean)
        return Array.from(new Set(categories)).sort()
    }, [providers])

    // Obtener estados únicos para el filtro
    const uniqueStatuses = useMemo(() => {
        const statuses = providers.map(p => p.status).filter(Boolean)
        return Array.from(new Set(statuses)).sort()
    }, [providers])

    // Función para cambiar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleDropdown = (id: string) => {
        setOpenDropdownId(openDropdownId === id ? null : id)
    }

    const openModal = async (modalType: keyof typeof modals, provider?: any) => {
        setSelectedProvider(null)
        if (modalType === 'edit' && provider?.id) {
            try {
                const res = await fetch(`/api/providers/${provider.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setSelectedProvider(data)
                } else {
                    setSelectedProvider(provider)
                }
            } catch (e) {
                setSelectedProvider(provider)
            }
        } else {
            setSelectedProvider(provider)
        }
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedProvider(null)
    }

    const handleSaveProvider = async (providerData: any) => {
        try {
            const orgId = session?.user?.organizationId
            const userId = session?.user?.id
            if (selectedProvider?.id) {
                const res = await fetch(`/api/providers/${selectedProvider.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(providerData),
                })
                if (!res.ok) throw new Error('failed')
                const updated = await res.json()
                setProviders(providers.map(p => (p.id === updated.id ? updated : p)))
            } else {
                const payload = { ...providerData, organizationId: orgId, createdById: userId }
                const res = await fetch(`/api/providers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                if (!res.ok) throw new Error('failed')
                const created = await res.json()
                setProviders(prev => [created, ...prev])
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteProvider = async () => {
        try {
            if (!selectedProvider?.id) return
            const res = await fetch(`/api/providers/${selectedProvider.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('delete failed')
            setProviders(providers.filter(provider => provider.id !== selectedProvider.id))
            setSelectedProvider(null)
        } catch (e) {
            console.error(e)
        }
    }

    const handleImportExcel = () => {
        setModals({ ...modals, import: true })
    }

    const handleImportProviders = async (file: File) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/providers/import/excel', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al importar proveedores')
            }

            const result = await response.json()

            // Reload providers
            const orgId = session?.user?.organizationId
            if (orgId) {
                const res = await fetch(`/api/providers?organizationId=${orgId}`)
                if (res.ok) {
                    const data = await res.json()
                    setProviders(data)
                }
            }

            alert(`Se importaron ${result.imported} proveedores exitosamente`)

            if (result.errors && result.errors.length > 0) {
                console.warn('Import errors:', result.errors)
                alert(`Se encontraron ${result.errors.length} errores durante la importación`)
            }

            closeModal('import')
        } catch (error) {
            console.error('Import error:', error)
            alert(error instanceof Error ? error.message : 'Error al importar proveedores')
        }
    }

    const handleExportExcel = async () => {
        try {
            const response = await fetch('/api/providers/export/excel')

            if (!response.ok) {
                throw new Error('Error al exportar proveedores')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `providers_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            alert('Proveedores exportados exitosamente')
        } catch (error) {
            console.error('Export error:', error)
            alert('Error al exportar proveedores')
        }
    }

    const handleExportPDF = async () => {
        try {
            const response = await fetch('/api/providers/export/pdf')

            if (!response.ok) {
                throw new Error('Error al exportar proveedores en PDF')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `providers_report_${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            alert('Reporte de proveedores generado exitosamente')
        } catch (error) {
            console.error('Export PDF error:', error)
            alert('Error al generar reporte PDF')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'Activo':
                return 'bg-green-100 text-green-800'
            case 'INACTIVE':
            case 'Inactivo':
                return 'bg-gray-100 text-gray-800'
            case 'SUSPENDED':
            case 'Suspendido':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const activeProviders = filteredProviders.filter(p => p.status === 'ACTIVE' || p.status === 'Activo').length
    const totalProviders = filteredProviders.length

    return (
        <Layout title="Proveedores" subtitle="Gestión completa de proveedores y suministros">
            {/* header and actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div></div>
                <button
                    onClick={() => openModal('create')}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nuevo Proveedor
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total proveedores</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{totalProviders}</dd>
                            {categoryFilter !== 'all' || statusFilter !== 'all' ? (
                                <div className="text-xs text-gray-400">
                                    (filtrado de {providers.length} total)
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Proveedores activos</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{activeProviders}</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Categorías</dt>
                            <dd className="text-2xl font-semibold text-gray-900">
                                {new Set(filteredProviders.map(p => p.category).filter(Boolean)).size}
                            </dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Pendiente de pago</dt>
                            <dd className="text-2xl font-semibold text-gray-900">$0</dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">Lista de Proveedores</h2>

                        {/* Indicadores de filtros activos */}
                        {(categoryFilter !== 'all' || statusFilter !== 'all' || sortField !== 'name') && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Filtros activos:</span>
                                {categoryFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Categoría: {categoryFilter}
                                        <button
                                            onClick={() => setCategoryFilter('all')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                            title="Quitar filtro de categoría"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {statusFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Estado: {statusFilter}
                                        <button
                                            onClick={() => setStatusFilter('all')}
                                            className="ml-1 text-green-600 hover:text-green-800"
                                            title="Quitar filtro de estado"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {sortField !== 'name' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        Orden: {sortField === 'name' ? 'Nombre' :
                                            sortField === 'contactName' ? 'Contacto' :
                                                sortField === 'category' ? 'Categoría' :
                                                    sortField === 'status' ? 'Estado' : sortField} {sortDirection === 'asc' ? '↑' : '↓'}
                                        <button
                                            onClick={() => {
                                                setSortField('name')
                                                setSortDirection('asc')
                                            }}
                                            className="ml-1 text-purple-600 hover:text-purple-800"
                                            title="Quitar ordenamiento"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Filtros */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
                                    Categoría:
                                </label>
                                <select
                                    id="category-filter"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Todas</option>
                                    {uniqueCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                                    Estado:
                                </label>
                                <select
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Todos</option>
                                    {uniqueStatuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Ver todos
                            </button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Proveedor
                                        {sortField === 'name' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('contactName')}
                                >
                                    <div className="flex items-center gap-1">
                                        Contacto
                                        {sortField === 'contactName' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center gap-1">
                                        Categoría
                                        {sortField === 'category' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Estado
                                        {sortField === 'status' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Términos de Pago</th>
                                <th className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedProviders.map(provider => (
                                <tr
                                    key={provider.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => openModal('details', provider)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                                                    <span className="text-white font-medium text-sm">{(provider.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                                                <div className="text-sm text-gray-500">{provider.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{provider.contactName}</div>
                                        <div className="text-sm text-gray-500">{provider.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {provider.category || 'Sin categoría'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(provider.status)}`}>
                                            {provider.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {provider.paymentTerms || 'No especificado'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative" ref={dropdownRef}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleDropdown(provider.id)
                                                }}
                                                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                            >
                                                <EllipsisVerticalIcon className="h-5 w-5" />
                                            </button>
                                            {openDropdownId === provider.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setOpenDropdownId(null)
                                                                openModal('details', provider)
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <EyeIcon className="h-4 w-4 mr-2" />
                                                            Ver Detalles
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setOpenDropdownId(null)
                                                                openModal('edit', provider)
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <PencilIcon className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setOpenDropdownId(null)
                                                                setSelectedProvider(provider)
                                                                openModal('delete', provider)
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                        >
                                                            <TrashIcon className="h-4 w-4 mr-2" />
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

                {/* Información de resumen */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Mostrando {paginatedProviders.length} de {filteredProviders.length} proveedores
                        {categoryFilter !== 'all' && (
                            <span className="ml-2 text-blue-600">
                                (filtrado por categoría: {categoryFilter})
                            </span>
                        )}
                        {statusFilter !== 'all' && (
                            <span className="ml-2 text-green-600">
                                (filtrado por estado: {statusFilter})
                            </span>
                        )}
                        {sortField && (
                            <span className="ml-2 text-purple-600">
                                (ordenado por: {sortField === 'name' ? 'Nombre' :
                                    sortField === 'contactName' ? 'Contacto' :
                                        sortField === 'category' ? 'Categoría' :
                                            sortField === 'status' ? 'Estado' : sortField} {sortDirection === 'asc' ? '↑' : '↓'})
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {paginatedProviders.map(provider => (
                    <div
                        key={provider.id}
                        className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => openModal('details', provider)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                                        <span className="text-white font-medium text-sm">{(provider.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                                    <div className="text-sm text-gray-500">{provider.email}</div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getStatusColor(provider.status)}`}>
                                    {provider.status}
                                </span>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggleDropdown(provider.id)
                                        }}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                    >
                                        <EllipsisVerticalIcon className="h-5 w-5" />
                                    </button>
                                    {openDropdownId === provider.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                            <div className="py-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenDropdownId(null)
                                                        openModal('details', provider)
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver Detalles
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenDropdownId(null)
                                                        openModal('edit', provider)
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenDropdownId(null)
                                                        setSelectedProvider(provider)
                                                        openModal('delete', provider)
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                >
                                                    <TrashIcon className="h-4 w-4 mr-2" />
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs font-medium text-gray-500">Contacto</div>
                                <div className="text-sm text-gray-900">{provider.contactName}</div>
                                <div className="text-sm text-gray-500">{provider.phone}</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-gray-500">Categoría</div>
                                <div className="text-sm text-gray-900">{provider.category || 'Sin categoría'}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Component */}
            <div className="mt-6">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredProviders.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    onImportExcel={handleImportExcel}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />
            </div>

            {/* Modals */}
            <ProviderFormModal isOpen={modals.create} onClose={() => closeModal('create')} onSave={handleSaveProvider} provider={null} />
            <ProviderFormModal isOpen={modals.edit} onClose={() => closeModal('edit')} onSave={handleSaveProvider} provider={selectedProvider} />
            <ProviderFormModal isOpen={modals.details} onClose={() => closeModal('details')} onSave={() => { }} provider={selectedProvider} readOnly />

            <ProviderImportModal
                isOpen={modals.import}
                onClose={() => closeModal('import')}
                onImport={handleImportProviders}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteProvider}
                title="Eliminar Proveedor"
                message={`¿Estás seguro de que quieres eliminar al proveedor "${selectedProvider?.name}"? Esta acción no se puede deshacer.`}
            />
        </Layout>
    )
}

export default function Providers() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ProvidersContent />
        </Suspense>
    )
}
