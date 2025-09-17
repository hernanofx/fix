'use client'

import Layout from '../../../components/Layout'
import PurchaseOrderFormModal from '../../../components/modals/PurchaseOrderFormModal'
import ConfirmDeleteModal from '../../../components/modals/ConfirmDeleteModal'
import PurchaseOrderImportModal from '../../../components/modals/PurchaseOrderImportModal'
import Pagination from '../../../components/ui/Pagination'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '../../../components/ToastProvider'

export default function PurchaseOrders() {
    const { data: session } = useSession()
    const toast = useToast()
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false,
    })
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
    const [showImportModal, setShowImportModal] = useState(false)

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [searchTerm, setSearchTerm] = useState('')

    // Filter and sort states
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [providerFilter, setProviderFilter] = useState<string>('all')
    const [projectFilter, setProjectFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('deliveryDate')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    useEffect(() => {
        async function load() {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const res = await fetch(`/api/providers/orders?organizationId=${organizationId}`)
                const json = await res.json()
                setPurchaseOrders(json || [])
            } catch (err) {
                console.error('Load purchase orders error', err)
                toast.error('No se pudieron cargar las órdenes de pedido')
            }
        }
        load()
    }, [session])

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, providerFilter, projectFilter, searchTerm])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            if (!target.closest('.dropdown-container')) {
                setDropdownOpen(null)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    // Filtered and sorted orders
    const filteredAndSortedOrders = useMemo(() => {
        let filtered = purchaseOrders

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.description?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Apply filters
        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter)
        }
        if (providerFilter !== 'all') {
            filtered = filtered.filter(order => order.provider?.name === providerFilter)
        }
        if (projectFilter !== 'all') {
            filtered = filtered.filter(order => order.project?.name === projectFilter)
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortField) {
                case 'number':
                    aValue = a.number || ''
                    bValue = b.number || ''
                    break
                case 'provider':
                    aValue = a.provider?.name || ''
                    bValue = b.provider?.name || ''
                    break
                case 'deliveryDate':
                    aValue = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0
                    bValue = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0
                    break
                case 'status':
                    aValue = a.status || ''
                    bValue = b.status || ''
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [purchaseOrders, searchTerm, statusFilter, providerFilter, projectFilter, sortField, sortDirection])

    // Paginated orders
    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredAndSortedOrders.slice(startIndex, endIndex)
    }, [filteredAndSortedOrders, currentPage, itemsPerPage])

    // Pagination info
    const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage)

    // Get unique values for filters
    const uniqueStatuses = useMemo(() => {
        const statuses = Array.from(new Set(purchaseOrders.map(order => order.status).filter(Boolean)))
        return statuses
    }, [purchaseOrders])

    const uniqueProviders = useMemo(() => {
        const providers = Array.from(new Set(purchaseOrders.map(order => order.provider?.name).filter(Boolean)))
        return providers
    }, [purchaseOrders])

    const uniqueProjects = useMemo(() => {
        const projects = Array.from(new Set(purchaseOrders.map(order => order.project?.name).filter(Boolean)))
        return projects
    }, [purchaseOrders])

    const openModal = async (modalType: keyof typeof modals, order?: any) => {
        if (modalType === 'edit' && order?.id) {
            try {
                const res = await fetch(`/api/providers/orders/${order.id}?organizationId=${(session as any)?.user?.organizationId}`)
                const json = await res.json()
                if (!res.ok) throw new Error(json?.error || 'Error fetching order')
                setSelectedOrder(json)
                setModals({ ...modals, edit: true })
                return
            } catch (err) {
                console.error('Error loading order for edit', err)
                toast.error('No se pudo cargar la orden para editar')
                return
            }
        }

        setSelectedOrder(order)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedOrder(null)
    }

    const handleSaveOrder = async (orderData: any) => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            const createdById = (session as any)?.user?.id

            if (selectedOrder) {
                // Update existing order
                const res = await fetch(`/api/providers/orders/${selectedOrder.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ ...orderData, organizationId }),
                    headers: { 'Content-Type': 'application/json' }
                })
                const updated = await res.json()
                if (!res.ok) throw new Error(updated?.error || 'Error updating order')
                setPurchaseOrders(purchaseOrders.map(o => o.id === selectedOrder.id ? updated : o))
                toast.success('Orden actualizada')
            } else {
                // Create new order
                const payload = { ...orderData, organizationId, createdById }
                const res = await fetch('/api/providers/orders', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'application/json' }
                })
                const created = await res.json()
                if (!res.ok) throw new Error(created?.error || 'Error creating order')
                setPurchaseOrders([created, ...purchaseOrders])
                toast.success('Orden creada')
            }
            closeModal('create')
            closeModal('edit')
        } catch (err) {
            console.error('Save order error', err)
            toast.error('Error al guardar la orden')
        }
    }

    const handleDeleteOrder = async () => {
        try {
            if (!selectedOrder) return
            await fetch(`/api/providers/orders/${selectedOrder.id}?organizationId=${(session as any)?.user?.organizationId}`, {
                method: 'DELETE'
            })
            setPurchaseOrders(purchaseOrders.filter(order => order.id !== selectedOrder.id))
            toast.success('Orden eliminada')
            closeModal('delete')
        } catch (err) {
            console.error('Delete order error', err)
            toast.error('Error al eliminar la orden')
        }
    }

    // Import/Export handlers
    const handleImportExcel = () => {
        setShowImportModal(true)
    }

    const handleImportSuccess = () => {
        // Reload data after successful import
        async function reload() {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const res = await fetch(`/api/providers/orders?organizationId=${organizationId}`)
                const json = await res.json()
                setPurchaseOrders(json || [])
                toast.success('Datos importados exitosamente')
            } catch (err) {
                console.error('Reload purchase orders error', err)
                toast.error('Error al recargar los datos')
            }
        }
        reload()
    }

    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (providerFilter !== 'all') params.append('provider', providerFilter)
            if (projectFilter !== 'all') params.append('project', projectFilter)
            params.append('sortField', sortField)
            params.append('sortDirection', sortDirection)

            const response = await fetch(`/api/providers/orders/export/excel?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `ordenes_pedido_${new Date().toISOString().split('T')[0]}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success('Archivo Excel exportado exitosamente')
            } else {
                toast.error('Error al exportar Excel')
            }
        } catch (error) {
            console.error('Export Excel error:', error)
            toast.error('Error al exportar Excel')
        }
    }

    const handleExportPDF = async () => {
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (providerFilter !== 'all') params.append('provider', providerFilter)
            if (projectFilter !== 'all') params.append('project', projectFilter)
            params.append('sortField', sortField)
            params.append('sortDirection', sortDirection)

            const response = await fetch(`/api/providers/orders/export/pdf?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `ordenes_pedido_reporte_${new Date().toISOString().split('T')[0]}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success('Archivo PDF exportado exitosamente')
            } else {
                toast.error('Error al exportar PDF')
            }
        } catch (error) {
            console.error('Export PDF error:', error)
            toast.error('Error al exportar PDF')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800'
            case 'APPROVED': return 'bg-blue-100 text-blue-800'
            case 'ORDERED': return 'bg-purple-100 text-purple-800'
            case 'RECEIVED': return 'bg-green-100 text-green-800'
            case 'CANCELLED': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pendiente'
            case 'APPROVED': return 'Aprobada'
            case 'ORDERED': return 'Ordenada'
            case 'RECEIVED': return 'Recibida'
            case 'CANCELLED': return 'Cancelada'
            default: return status
        }
    }

    const pendingOrders = filteredAndSortedOrders.filter(o => o.status === 'PENDING').length
    const totalOrders = filteredAndSortedOrders.length

    return (
        <Layout
            title="Órdenes de Pedido"
            subtitle="Gestión de órdenes de compra a proveedores"
        >
            {/* header and actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div></div>
                <button
                    onClick={() => openModal('create')}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Orden
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white shadow-sm rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los estados</option>
                            {uniqueStatuses.map(status => (
                                <option key={status} value={status}>{getStatusText(status)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                        <select
                            value={providerFilter}
                            onChange={(e) => setProviderFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los proveedores</option>
                            {uniqueProviders.map(provider => (
                                <option key={provider} value={provider}>{provider}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
                        <select
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los proyectos</option>
                            {uniqueProjects.map(project => (
                                <option key={project} value={project}>{project}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex space-x-2">
                        {(statusFilter !== 'all' || providerFilter !== 'all' || projectFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setStatusFilter('all')
                                    setProviderFilter('all')
                                    setProjectFilter('all')
                                }}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total órdenes</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{totalOrders}</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{pendingOrders}</dd>
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
                            <dt className="text-sm font-medium text-gray-500 truncate">Completadas</dt>
                            <dd className="text-2xl font-semibold text-gray-900">
                                {filteredAndSortedOrders.filter(o => o.status === 'RECEIVED').length}
                            </dd>
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
                            <dt className="text-sm font-medium text-gray-500 truncate">Proveedores</dt>
                            <dd className="text-2xl font-semibold text-gray-900">
                                {new Set(filteredAndSortedOrders.map(o => o.provider?.id).filter(Boolean)).size}
                            </dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Lista de Órdenes</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => {
                                            if (sortField === 'number') {
                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                            } else {
                                                setSortField('number')
                                                setSortDirection('asc')
                                            }
                                        }}
                                        className="flex items-center hover:text-gray-700"
                                    >
                                        Orden
                                        {sortField === 'number' && (
                                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => {
                                            if (sortField === 'provider') {
                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                            } else {
                                                setSortField('provider')
                                                setSortDirection('asc')
                                            }
                                        }}
                                        className="flex items-center hover:text-gray-700"
                                    >
                                        Proveedor
                                        {sortField === 'provider' && (
                                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Proyecto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => {
                                            if (sortField === 'deliveryDate') {
                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                            } else {
                                                setSortField('deliveryDate')
                                                setSortDirection('asc')
                                            }
                                        }}
                                        className="flex items-center hover:text-gray-700"
                                    >
                                        Entrega
                                        {sortField === 'deliveryDate' && (
                                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
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
                            {paginatedOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openModal('edit', order)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{order.number}</div>
                                        <div className="text-sm text-gray-500">{order.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{order.provider?.name || 'Sin proveedor'}</div>
                                        <div className="text-sm text-gray-500">{order.provider?.email || ''}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{order.project?.name || 'Sin proyecto'}</div>
                                        <div className="text-sm text-gray-500">{order.project?.code || ''}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{order.items?.length || 0} items</div>
                                        <div className="text-sm text-gray-500">
                                            {order.items?.reduce((total: number, item: any) => total + item.quantity, 0) || 0} unidades
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('es-ES') : 'No especificada'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative dropdown-container">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDropdownOpen(dropdownOpen === order.id ? null : order.id)
                                                }}
                                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>
                                            {dropdownOpen === order.id && (
                                                <div
                                                    className="absolute right-0 top-10 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-48"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openModal('edit', order)
                                                            setDropdownOpen(null)
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedOrder(order)
                                                            setModals({ ...modals, delete: true })
                                                            setDropdownOpen(null)
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {paginatedOrders.map((order) => (
                    <div key={order.id} className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 cursor-pointer" onClick={() => openModal('edit', order)}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                        <span className="text-white font-medium text-sm">{order.number.slice(-2)}</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{order.number}</div>
                                    <div className="text-sm text-gray-500">{order.description}</div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                </span>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setDropdownOpen(dropdownOpen === order.id ? null : order.id)
                                        }}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                        </svg>
                                    </button>
                                    {dropdownOpen === order.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                            <div className="py-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setDropdownOpen(null)
                                                        openModal('edit', order)
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setDropdownOpen(null)
                                                        setSelectedOrder(order)
                                                        setModals({ ...modals, delete: true })
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
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
                                <div className="text-xs font-medium text-gray-500">Proveedor</div>
                                <div className="text-sm text-gray-900">{order.provider?.name || 'Sin proveedor'}</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-gray-500">Proyecto</div>
                                <div className="text-sm text-gray-900">{order.project?.name || 'Sin proyecto'}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredAndSortedOrders.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                    setItemsPerPage(value)
                    setCurrentPage(1)
                }}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar órdenes..."
                onImportExcel={handleImportExcel}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
            />

            {/* Modals */}
            <PurchaseOrderFormModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSaveOrder}
                order={null}
            />

            <PurchaseOrderFormModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                onSave={handleSaveOrder}
                order={selectedOrder}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteOrder}
                title="Eliminar Orden de Pedido"
                message={`¿Estás seguro de que quieres eliminar la orden "${selectedOrder?.number}"? Esta acción no se puede deshacer.`}
            />

            <PurchaseOrderImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportSuccess={handleImportSuccess}
            />
        </Layout>
    )
}
