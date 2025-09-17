'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import BillFormModal from '@/components/modals/BillFormModal'
import Pagination from '@/components/ui/Pagination'
import { DecimalUtils } from '@/lib/decimal-utils'
import { useToast } from '@/components/ToastProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'
import {
    PlusIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

interface Bill {
    id: string
    number: string
    type: 'CLIENT' | 'PROVIDER'
    status: 'DRAFT' | 'PENDING' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    amount: number
    total: number
    currency: string
    issueDate: string
    dueDate: string
    paidDate?: string
    description?: string
    project: { id: string; name: string }
    client?: { id: string; name: string }
    provider?: { id: string; name: string }
    createdBy: { id: string; name: string; email: string }
    billRubros: Array<{
        percentage: number
        amount: number
        rubro: { id: string; name: string; color?: string }
    }>
    payments: Array<{
        id: string
        amount: number
        method: string
        paymentDate: string
        cashBox?: { id: string; name: string }
        bankAccount?: { id: string; name: string }
    }>
    stockMovements: Array<{
        id: string
        quantity: number
        material: { id: string; name: string; unit: string }
        warehouse: { id: string; name: string }
    }>
}

interface Stats {
    total: number
    client: number
    provider: number
    paid: number
    partial: number
    pending: number
    overdue: number
    totalAmount: {
        PESOS: number
        USD: number
        EUR: number
    }
    paidAmount: {
        PESOS: number
        USD: number
        EUR: number
    }
    pendingAmount: {
        PESOS: number
        USD: number
        EUR: number
    }
    monthlyIncome: {
        PESOS: number
        USD: number
        EUR: number
    }
    monthlyExpense: {
        PESOS: number
        USD: number
        EUR: number
    }
    averageBill: {
        PESOS: number
        USD: number
        EUR: number
    }
}

const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    SENT: 'bg-blue-100 text-blue-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
    DRAFT: 'Borrador',
    PENDING: 'Pendiente',
    SENT: 'Enviada',
    PARTIAL: 'Pago Parcial',
    PAID: 'Pagada',
    OVERDUE: 'Vencida',
    CANCELLED: 'Cancelada'
}

const typeLabels = {
    CLIENT: 'Cliente',
    PROVIDER: 'Proveedor'
}

export default function BillsPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <BillsPageContent />
        </Suspense>
    )
}

function BillsPageContent() {
    const { data: session } = useSession()
    const toast = useToast()
    const [bills, setBills] = useState<Bill[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
    const searchParams = useSearchParams()

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Filtros y búsqueda
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [projectFilter, setProjectFilter] = useState('all')
    const [currencyFilter, setCurrencyFilter] = useState('all')
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Estados para datos relacionados
    const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
    const [clients, setClients] = useState([])
    const [providers, setProviders] = useState([])
    const [rubros, setRubros] = useState([])
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (session && mounted) {
            loadBills()
            loadRelatedData()
        }
    }, [session, statusFilter, typeFilter, projectFilter, currencyFilter, mounted])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setDropdownOpen(null)
        }

        if (dropdownOpen) {
            document.addEventListener('click', handleClickOutside)
            return () => {
                document.removeEventListener('click', handleClickOutside)
            }
        }
    }, [dropdownOpen])

    // Check for modal parameter in URL
    useEffect(() => {
        const modalParam = searchParams.get("modal")
        if (modalParam === "create") {
            handleCreateBill()
        }
    }, [searchParams])

    const loadBills = async () => {
        try {
            setLoading(true)
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) return

            const params = new URLSearchParams({ organizationId })
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
            if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)
            if (projectFilter && projectFilter !== 'all') params.append('projectId', projectFilter)
            if (currencyFilter && currencyFilter !== 'all') params.append('currency', currencyFilter)

            const response = await fetch(`/api/bills?${params}`)
            if (response.ok) {
                const data = await response.json()
                setBills(data.bills || [])
                setStats(data.stats || null)
            } else {
                console.error('Failed to load bills')
                setBills([])
                setStats(null)
            }
        } catch (error) {
            console.error('Error loading bills:', error)
            setBills([])
            setStats(null)
        } finally {
            setLoading(false)
        }
    }

    const loadRelatedData = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) return

            // Cargar proyectos, clientes, proveedores y rubros en paralelo
            const [projectsRes, clientsRes, providersRes, rubrosRes] = await Promise.all([
                fetch(`/api/projects?organizationId=${organizationId}`),
                fetch(`/api/clients?organizationId=${organizationId}`),
                fetch(`/api/providers?organizationId=${organizationId}`),
                fetch(`/api/rubros?organizationId=${organizationId}`)
            ])

            if (projectsRes.ok) {
                const projectsData = await projectsRes.json()
                // Handle both direct array response and object with projects property
                const projectsArray = Array.isArray(projectsData) ? projectsData : (projectsData.projects || [])
                setProjects(projectsArray.filter((project: any) => project && project.id && project.name))
            }

            if (clientsRes.ok) {
                const clientsData = await clientsRes.json()
                const clientsArray = Array.isArray(clientsData) ? clientsData : (clientsData.clients || [])
                setClients(clientsArray.filter((client: any) => client && client.id && client.name))
            }

            if (providersRes.ok) {
                const providersData = await providersRes.json()
                const providersArray = Array.isArray(providersData) ? providersData : (providersData.providers || [])
                setProviders(providersArray.filter((provider: any) => provider && provider.id && provider.name))
            }

            if (rubrosRes.ok) {
                const rubrosData = await rubrosRes.json()
                const rubrosArray = Array.isArray(rubrosData) ? rubrosData : (rubrosData.rubros || [])
                setRubros(rubrosArray.filter((rubro: any) => rubro && rubro.id && rubro.name))
            }
        } catch (error) {
            console.error('Error loading related data:', error)
        }
    }

    const handleCreateBill = () => {
        setSelectedBill(null)
        setModalMode('create')
        setIsModalOpen(true)
    }

    const handleEditBill = (bill: Bill) => {
        setSelectedBill(bill)
        setModalMode('edit')
        setIsModalOpen(true)
    }

    const handleViewBill = (bill: Bill) => {
        setSelectedBill(bill)
        setModalMode('view')
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedBill(null)
        setModalMode('create')
    }

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
    }

    const handleDeleteBill = async (bill: Bill) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar la factura ${bill.number}?`)) {
            return
        }

        try {
            const response = await fetch(`/api/bills/${bill.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                await loadBills()
                alert('Factura eliminada exitosamente')
            } else {
                const errorData = await response.json()
                alert(`Error al eliminar la factura: ${errorData.error}`)
            }
        } catch (error) {
            console.error('Error deleting bill:', error)
            alert('Error al eliminar la factura')
        }
    }

    const handleSaveBill = async (billData: any) => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            const createdById = (session as any)?.user?.id

            if (!organizationId || !createdById) {
                alert('Error: Datos de sesión no válidos')
                return
            }

            const payload = {
                ...billData,
                organizationId,
                createdById
            }

            const url = modalMode === 'edit' && selectedBill
                ? `/api/bills/${selectedBill.id}`
                : '/api/bills'

            const method = modalMode === 'edit' ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                const respJson = await response.json()
                await loadBills()
                // If API returned a created treasury transaction, notify other windows/components
                if (respJson?.transaction) {
                    try {
                        window.dispatchEvent(new CustomEvent('treasury:transactionCreated', { detail: respJson.transaction }))
                    } catch (e) { /* ignore in non-browser contexts */ }
                }
                setIsModalOpen(false)
                const action = modalMode === 'edit' ? 'actualizada' : 'creada'
                alert(`Factura ${action} exitosamente`)
            } else {
                const errorData = await response.json()
                alert(`Error al ${modalMode === 'edit' ? 'actualizar' : 'crear'} la factura: ${errorData.error}`)
            }
        } catch (error) {
            console.error('Error saving bill:', error)
            alert('Error al guardar la factura')
        }
    }

    // Export functions
    const handleExportExcel = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) {
                toast.error("No se pudo obtener la organización")
                return
            }

            const params = new URLSearchParams({
                organizationId,
                status: statusFilter !== 'all' ? statusFilter : '',
                type: typeFilter !== 'all' ? typeFilter : '',
                projectId: projectFilter !== 'all' ? projectFilter : '',
                currency: currencyFilter !== 'all' ? currencyFilter : '',
                search: searchTerm
            })

            const response = await fetch(`/api/bills/export/excel?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `facturas_${new Date().toISOString().split('T')[0]}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                toast.success("El archivo Excel se ha descargado correctamente")
            } else {
                throw new Error('Error al exportar')
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error)
            toast.error("No se pudo exportar el archivo Excel")
        }
    }

    const handleExportPDF = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) {
                toast.error("No se pudo obtener la organización")
                return
            }

            const params = new URLSearchParams({
                organizationId,
                status: statusFilter !== 'all' ? statusFilter : '',
                type: typeFilter !== 'all' ? typeFilter : '',
                projectId: projectFilter !== 'all' ? projectFilter : '',
                currency: currencyFilter !== 'all' ? currencyFilter : '',
                search: searchTerm
            })

            const response = await fetch(`/api/bills/export/pdf?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `facturas_${new Date().toISOString().split('T')[0]}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                toast.success("El archivo PDF se ha descargado correctamente")
            } else {
                throw new Error('Error al exportar')
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error)
            toast.error("No se pudo exportar el archivo PDF")
        }
    }

    const filteredBills = bills.filter(bill => {
        const matchesSearch = !searchTerm ||
            bill.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.provider?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.project.name.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || bill.status === statusFilter
        const matchesType = typeFilter === 'all' || bill.type === typeFilter
        const matchesProject = projectFilter === 'all' || bill.project.id === projectFilter
        const matchesCurrency = currencyFilter === 'all' || bill.currency === currencyFilter

        return matchesSearch && matchesStatus && matchesType && matchesProject && matchesCurrency
    })

    const sortedBills = [...filteredBills].sort((a, b) => {
        let valueA: any, valueB: any

        switch (sortBy) {
            case 'number':
                valueA = a.number
                valueB = b.number
                break
            case 'total':
                valueA = a.total
                valueB = b.total
                break
            case 'issueDate':
                valueA = new Date(a.issueDate)
                valueB = new Date(b.issueDate)
                break
            case 'dueDate':
                valueA = new Date(a.dueDate)
                valueB = new Date(b.dueDate)
                break
            case 'entity':
                valueA = a.client?.name || a.provider?.name || ''
                valueB = b.client?.name || b.provider?.name || ''
                break
            default:
                valueA = new Date(a.issueDate)
                valueB = new Date(b.issueDate)
        }

        if (sortOrder === 'asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
        } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
        }
    })

    // Pagination logic
    const totalItems = sortedBills.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedBills = sortedBills.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage)
        setCurrentPage(1) // Reset to first page when changing items per page
    }

    const formatCurrency = (amount: number, currency: string = 'PESOS') => {
        return DecimalUtils.formatCurrency(amount, currency)
    }

    const getEntityName = (bill: Bill) => {
        return bill.client?.name || bill.provider?.name || 'N/A'
    }

    const isOverdue = (bill: Bill) => {
        return (bill.status === 'PENDING' || bill.status === 'PARTIAL') &&
            new Date(bill.dueDate) < new Date()
    }

    if (loading) {
        return (
            <Layout title="Facturas">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        )
    }

    if (!mounted) {
        return (
            <Layout title="Facturas">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Facturas">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
                        <p className="text-gray-600">Gestiona todas tus facturas de clientes y proveedores</p>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total Facturas
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.total}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Pagadas
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.paid}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ClockIcon className="h-8 w-8 text-yellow-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Pendientes
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.pending}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Vencidas
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.overdue}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Número, cliente, proveedor..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ordenar por
                            </label>
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split('-')
                                    setSortBy(field)
                                    setSortOrder(order as 'asc' | 'desc')
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="issueDate-desc">Fecha emisión (más reciente)</option>
                                <option value="issueDate-asc">Fecha emisión (más antigua)</option>
                                <option value="dueDate-asc">Fecha vencimiento (próxima)</option>
                                <option value="dueDate-desc">Fecha vencimiento (lejana)</option>
                                <option value="total-desc">Monto (mayor)</option>
                                <option value="total-asc">Monto (menor)</option>
                                <option value="number-asc">Número</option>
                            </select>
                        </div>
                    </div>
                </div>                    {/* Bills Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('number')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Número</span>
                                            {sortBy === 'number' && (
                                                sortOrder === 'asc' ?
                                                    <ArrowUpIcon className="h-4 w-4" /> :
                                                    <ArrowDownIcon className="h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('type')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Tipo</span>
                                            {sortBy === 'type' && (
                                                sortOrder === 'asc' ?
                                                    <ArrowUpIcon className="h-4 w-4" /> :
                                                    <ArrowDownIcon className="h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('entity')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Cliente/Proveedor</span>
                                            {sortBy === 'entity' && (
                                                sortOrder === 'asc' ?
                                                    <ArrowUpIcon className="h-4 w-4" /> :
                                                    <ArrowDownIcon className="h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('project')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Proyecto</span>
                                            {sortBy === 'project' && (
                                                sortOrder === 'asc' ?
                                                    <ArrowUpIcon className="h-4 w-4" /> :
                                                    <ArrowDownIcon className="h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('total')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Monto Total</span>
                                            {sortBy === 'total' && (
                                                sortOrder === 'asc' ?
                                                    <ArrowUpIcon className="h-4 w-4" /> :
                                                    <ArrowDownIcon className="h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Estado</span>
                                            {sortBy === 'status' && (
                                                sortOrder === 'asc' ?
                                                    <ArrowUpIcon className="h-4 w-4" /> :
                                                    <ArrowDownIcon className="h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('dueDate')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Vencimiento</span>
                                            {sortBy === 'dueDate' && (
                                                sortOrder === 'asc' ?
                                                    <ArrowUpIcon className="h-4 w-4" /> :
                                                    <ArrowDownIcon className="h-4 w-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedBills.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            {bills.length === 0 ? 'No hay facturas registradas' : 'No se encontraron facturas con los filtros aplicados'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedBills.map((bill) => (
                                        <tr key={bill.id} className={`hover:bg-gray-50 cursor-pointer ${isOverdue(bill) ? 'bg-red-50' : ''}`} onClick={() => handleViewBill(bill)}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {bill.number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bill.type === 'CLIENT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {typeLabels[bill.type]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {getEntityName(bill)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {bill.project.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {formatCurrency(bill.total, bill.currency)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[bill.status]}`}>
                                                    {statusLabels[bill.status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>
                                                    {new Date(bill.dueDate).toLocaleDateString('es-AR', {
                                                        timeZone: 'America/Argentina/Buenos_Aires'
                                                    })}
                                                    {isOverdue(bill) && (
                                                        <span className="block text-xs text-red-600 font-medium">
                                                            ¡Vencida!
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setDropdownOpen(dropdownOpen === bill.id ? null : bill.id)
                                                        }}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                        </svg>
                                                    </button>

                                                    {dropdownOpen === bill.id && (
                                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={() => {
                                                                        handleViewBill(bill)
                                                                        setDropdownOpen(null)
                                                                    }}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                                >
                                                                    <EyeIcon className="w-4 h-4 mr-3 text-gray-400" />
                                                                    Ver
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleEditBill(bill)
                                                                        setDropdownOpen(null)
                                                                    }}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                                >
                                                                    <PencilIcon className="w-4 h-4 mr-3 text-gray-400" />
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleDeleteBill(bill)
                                                                        setDropdownOpen(null)
                                                                    }}
                                                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                                                >
                                                                    <TrashIcon className="w-4 h-4 mr-3 text-red-400" />
                                                                    Eliminar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Column Filters */}
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Filtrar por Estado
                                </label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Todos los estados" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los estados</SelectItem>
                                        <SelectItem value="PENDING">Pendiente</SelectItem>
                                        <SelectItem value="PAID">Pagada</SelectItem>
                                        <SelectItem value="PARTIAL">Pago Parcial</SelectItem>
                                        <SelectItem value="OVERDUE">Vencida</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Filtrar por Tipo
                                </label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Todos los tipos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los tipos</SelectItem>
                                        <SelectItem value="CLIENT">Cliente</SelectItem>
                                        <SelectItem value="PROVIDER">Proveedor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Filtrar por Proyecto
                                </label>
                                <Select value={projectFilter} onValueChange={setProjectFilter}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Todos los proyectos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los proyectos</SelectItem>
                                        {projects.filter((project: any) => project && project.id && project.name).map(project => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Filtrar por Moneda
                                </label>
                                <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Todas las monedas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las monedas</SelectItem>
                                        <SelectItem value="PESOS">PESOS</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pagination */}
                {totalItems > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Buscar facturas..."
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                    />
                )}

                {/* Summary */}
                {stats && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen Financiero</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Ingresos del mes</p>
                                <div className="space-y-1">
                                    {stats.monthlyIncome.PESOS > 0 && (
                                        <p className="text-lg font-semibold text-green-600">
                                            {formatCurrency(stats.monthlyIncome.PESOS, 'PESOS')}
                                        </p>
                                    )}
                                    {stats.monthlyIncome.USD > 0 && (
                                        <p className="text-lg font-semibold text-green-600">
                                            {formatCurrency(stats.monthlyIncome.USD, 'USD')}
                                        </p>
                                    )}
                                    {stats.monthlyIncome.EUR > 0 && (
                                        <p className="text-lg font-semibold text-green-600">
                                            {formatCurrency(stats.monthlyIncome.EUR, 'EUR')}
                                        </p>
                                    )}
                                    {stats.monthlyIncome.PESOS === 0 && stats.monthlyIncome.USD === 0 && stats.monthlyIncome.EUR === 0 && (
                                        <p className="text-lg font-semibold text-green-600">
                                            {formatCurrency(0, 'PESOS')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Egresos del mes</p>
                                <div className="space-y-1">
                                    {stats.monthlyExpense.PESOS > 0 && (
                                        <p className="text-lg font-semibold text-red-600">
                                            {formatCurrency(stats.monthlyExpense.PESOS, 'PESOS')}
                                        </p>
                                    )}
                                    {stats.monthlyExpense.USD > 0 && (
                                        <p className="text-lg font-semibold text-red-600">
                                            {formatCurrency(stats.monthlyExpense.USD, 'USD')}
                                        </p>
                                    )}
                                    {stats.monthlyExpense.EUR > 0 && (
                                        <p className="text-lg font-semibold text-red-600">
                                            {formatCurrency(stats.monthlyExpense.EUR, 'EUR')}
                                        </p>
                                    )}
                                    {stats.monthlyExpense.PESOS === 0 && stats.monthlyExpense.USD === 0 && stats.monthlyExpense.EUR === 0 && (
                                        <p className="text-lg font-semibold text-red-600">
                                            {formatCurrency(0, 'PESOS')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Monto pendiente</p>
                                <div className="space-y-1">
                                    {stats.pendingAmount.PESOS > 0 && (
                                        <p className="text-lg font-semibold text-yellow-600">
                                            {formatCurrency(stats.pendingAmount.PESOS, 'PESOS')}
                                        </p>
                                    )}
                                    {stats.pendingAmount.USD > 0 && (
                                        <p className="text-lg font-semibold text-yellow-600">
                                            {formatCurrency(stats.pendingAmount.USD, 'USD')}
                                        </p>
                                    )}
                                    {stats.pendingAmount.EUR > 0 && (
                                        <p className="text-lg font-semibold text-yellow-600">
                                            {formatCurrency(stats.pendingAmount.EUR, 'EUR')}
                                        </p>
                                    )}
                                    {stats.pendingAmount.PESOS === 0 && stats.pendingAmount.USD === 0 && stats.pendingAmount.EUR === 0 && (
                                        <p className="text-lg font-semibold text-yellow-600">
                                            {formatCurrency(0, 'PESOS')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-6 right-6 z-50">
                <div className="flex items-center space-x-3 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
                    <Button
                        onClick={handleCreateBill}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                        size="sm"
                    >
                        <PlusIcon className="h-4 w-4" />
                        <span>Nueva Factura</span>
                    </Button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <Button
                        onClick={handleExportExcel}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                    >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        <span>Excel</span>
                    </Button>
                    <Button
                        onClick={handleExportPDF}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                    >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        <span>PDF</span>
                    </Button>
                </div>
            </div>

            {/* Modal */}
            <BillFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                bill={selectedBill}
                onSave={handleSaveBill}
                mode={modalMode}
                projects={projects}
                clients={clients}
                providers={providers}
                rubros={rubros}
            />
        </Layout>
    )
}
