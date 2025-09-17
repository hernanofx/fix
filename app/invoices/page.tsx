'use client'

import Layout from '../../components/Layout'
import InvoiceFormModal from '../../components/modals/InvoiceFormModal'
import { InvoiceImportModal } from '../../components/modals/InvoiceImportModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '@/components/ui/Pagination'
import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '../../components/ToastProvider'
import { Suspense } from 'react'

function InvoicesContent() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [providers, setProviders] = useState<any[]>([])
    const [rubros, setRubros] = useState<any[]>([])
    const [stats, setStats] = useState<any>({})
    const toast = useToast()

    const [modals, setModals] = useState({
        create: false,
        view: false,
        edit: false,
        delete: false,
        import: false
    })

    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

    // Estados para filtros y ordenamiento
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [projectFilter, setProjectFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('issueDate')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const { data: session } = useSession()
    const searchParams = useSearchParams()

    useEffect(() => {
        const load = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const res = await fetch(`/api/invoices?organizationId=${organizationId}`)
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Failed to load invoices'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const data = await res.json()
                setInvoices(data.invoices)
                setStats(data.stats)

                // Load projects
                const resProj = await fetch(`/api/projects?organizationId=${organizationId}`)
                if (resProj.ok) {
                    const projs = await resProj.json()
                    setProjects(projs)
                }

                // Load providers
                const resProviders = await fetch(`/api/providers?organizationId=${organizationId}`)
                if (resProviders.ok) {
                    const provs = await resProviders.json()
                    setProviders(provs)
                }

                // Load rubros
                const resRubros = await fetch(`/api/rubros?organizationId=${organizationId}`)
                if (resRubros.ok) {
                    const rubs = await resRubros.json()
                    setRubros(rubs)
                }
            } catch (err: any) {
                console.error(err)
                toast.error(err.message || 'No se pudieron cargar las facturas')
            }
        }
        load()
    }, [session])

    // Lógica de filtrado y ordenamiento (sin paginación para estadísticas)
    const filteredInvoices = useMemo(() => {
        let filtered = invoices

        // Aplicar filtro de estado
        if (statusFilter !== 'all') {
            filtered = filtered.filter(invoice => invoice.status === statusFilter)
        }

        // Aplicar filtro de proyecto
        if (projectFilter !== 'all') {
            filtered = filtered.filter(invoice => invoice.projectId === projectFilter)
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            // Manejar casos especiales
            if (sortField === 'amount') {
                aValue = aValue || 0
                bValue = bValue || 0
            } else if (sortField === 'issueDate' || sortField === 'dueDate' || sortField === 'paidDate') {
                aValue = new Date(aValue || 0).getTime()
                bValue = new Date(bValue || 0).getTime()
            } else if (sortField === 'number') {
                aValue = (aValue || '').toString()
                bValue = (bValue || '').toString()
            } else if (sortField === 'project') {
                aValue = a.project?.name || ''
                bValue = b.project?.name || ''
            } else if (sortField === 'provider') {
                aValue = a.provider?.name || ''
                bValue = b.provider?.name || ''
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [invoices, statusFilter, projectFilter, sortField, sortDirection])

    // Datos paginados para mostrar en la tabla
    const paginatedInvoices = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredInvoices.slice(startIndex, endIndex)
    }, [filteredInvoices, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, projectFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)

    // Obtener estados únicos para el filtro
    const uniqueStatuses = useMemo(() => {
        const statuses = invoices.map(i => i.status).filter(Boolean)
        return Array.from(new Set(statuses)).sort()
    }, [invoices])

    // Función para cambiar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    // Estadísticas basadas en datos filtrados
    const filteredStats = useMemo(() => {
        const filtered = filteredInvoices
        return {
            total: filtered.length,
            paid: filtered.filter(inv => inv.status === 'PAID').length,
            partial: filtered.filter(inv => inv.status === 'PARTIAL').length,
            pending: filtered.filter(inv => inv.status === 'PENDING').length,
            overdue: filtered.filter(inv => inv.status === 'OVERDUE').length,
            totalAmount: filtered.reduce((sum, inv) => sum + (inv.amount || 0), 0),
            pendingAmount: filtered.filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE').reduce((sum, inv) => sum + (inv.amount || 0), 0),
            averageInvoice: filtered.length > 0 ? filtered.reduce((sum, inv) => sum + (inv.amount || 0), 0) / filtered.length : 0
        }
    }, [filteredInvoices])

    // Check for modal parameter in URL
    useEffect(() => {
        const modalParam = searchParams.get('modal')
        if (modalParam === 'create') {
            openModal('create')
        }
    }, [searchParams])

    const openModal = async (modalType: keyof typeof modals, invoice?: any) => {
        if ((modalType === 'edit' || modalType === 'view') && invoice?.id) {
            try {
                const res = await fetch(`/api/invoices/${invoice.id}`)
                if (!res.ok) throw new Error('Failed to fetch invoice')
                const data = await res.json()
                setSelectedInvoice(data)
                setModals({ ...modals, [modalType]: true })
                return
            } catch (err) {
                console.error(err)
                toast.error('No se pudo cargar la factura')
                return
            }
        }

        setSelectedInvoice(invoice)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedInvoice(null)
    }

    const handleSaveInvoice = async (invoiceData: any) => {
        try {
            const userId = session?.user?.id as string | undefined
            const organizationId = (session as any)?.user?.organizationId as string | undefined

            if (selectedInvoice?.id) {
                console.log('Updating invoice:', selectedInvoice.id, 'with data:', invoiceData)
                const res = await fetch(`/api/invoices/${selectedInvoice.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                })
                if (!res.ok) {
                    const errorText = await res.text()
                    console.error('API Error:', res.status, errorText)
                    throw new Error(`Error updating invoice: ${errorText}`)
                }
                const updated = await res.json()
                console.log('Invoice updated successfully:', updated)
                setInvoices(invoices.map(inv => inv.id === updated.id ? updated : inv))
                toast.success('Factura actualizada correctamente')
            } else {
                const payload = { ...invoiceData, createdById: userId, organizationId }
                console.log('Creating invoice with payload:', payload)
                const res = await fetch('/api/invoices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                if (!res.ok) {
                    const errorText = await res.text()
                    console.error('API Error:', res.status, errorText)
                    throw new Error(`Error creating invoice: ${errorText}`)
                }
                const created = await res.json()
                console.log('Invoice created successfully:', created)
                setInvoices([created, ...invoices])
                toast.success('Factura creada correctamente')
            }

            closeModal('create')
            closeModal('edit')
            closeModal('view')
        } catch (err: any) {
            console.error('Error saving invoice:', err)
            toast.error(err.message || 'Error al guardar factura')
        }
    }

    const handleDeleteInvoice = async () => {
        if (!selectedInvoice?.id) return
        try {
            const res = await fetch(`/api/invoices/${selectedInvoice.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Error deleting')
            setInvoices(invoices.filter(inv => inv.id !== selectedInvoice.id))
            closeModal('delete')
        } catch (err: any) {
            console.error(err)
            toast.error('No se pudo eliminar la factura')
        }
    }

    const handleImportExcel = () => {
        setModals({ ...modals, import: true })
    }

    const handleImportInvoices = async (file: File) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/invoices/import/excel', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al importar facturas')
            }

            const result = await response.json()

            // Reload invoices
            const organizationId = (session as any)?.user?.organizationId
            if (organizationId) {
                const res = await fetch(`/api/invoices?organizationId=${organizationId}`)
                if (res.ok) {
                    const data = await res.json()
                    setInvoices(data.invoices)
                    setStats(data.stats)
                }
            }

            toast.success(`Se importaron ${result.imported} facturas exitosamente`)

            if (result.errors && result.errors.length > 0) {
                console.warn('Import errors:', result.errors)
                toast.error(`Se encontraron ${result.errors.length} errores durante la importación`)
            }

            closeModal('import')
        } catch (error) {
            console.error('Import error:', error)
            toast.error(error instanceof Error ? error.message : 'Error al importar facturas')
        }
    }

    const handleExportExcel = async () => {
        try {
            const response = await fetch('/api/invoices/export/excel')

            if (!response.ok) {
                throw new Error('Error al exportar facturas')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `invoices_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('Facturas exportadas exitosamente')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Error al exportar facturas')
        }
    }

    const handleExportPDF = async () => {
        try {
            const response = await fetch('/api/invoices/export/pdf')

            if (!response.ok) {
                throw new Error('Error al exportar facturas en PDF')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `invoices_report_${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('Reporte de facturas generado exitosamente')
        } catch (error) {
            console.error('Export PDF error:', error)
            toast.error('Error al generar reporte PDF')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800'
            case 'PENDING': return 'bg-yellow-100 text-yellow-800'
            case 'PARTIAL': return 'bg-blue-100 text-blue-800'
            case 'OVERDUE': return 'bg-red-100 text-red-800'
            case 'CANCELLED': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PAID': return 'Pagada'
            case 'PENDING': return 'Pendiente'
            case 'PARTIAL': return 'Pago Parcial'
            case 'OVERDUE': return 'Vencida'
            case 'CANCELLED': return 'Cancelada'
            case 'DRAFT': return 'Borrador'
            case 'SENT': return 'Enviada'
            default: return status
        }
    }

    return (
        <Layout
            title="Facturación"
            subtitle="Gestión de facturas y pagos"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div></div>
                <button
                    onClick={() => openModal('create')}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Nueva Factura
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total facturas</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{filteredStats.total || 0}</dd>
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
                            <dt className="text-sm font-medium text-gray-500 truncate">Pagadas</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{filteredStats.paid || 0}</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Pago Parcial</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{filteredStats.partial || 0}</dd>
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
                            <dd className="text-2xl font-semibold text-gray-900">{filteredStats.pending || 0}</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Vencidas</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{filteredStats.overdue || 0}</dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Proyecto:</label>
                        <select
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los proyectos</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Estado:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos</option>
                            {uniqueStatuses.map(status => (
                                <option key={status} value={status}>{getStatusText(status)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Active Filters Display */}
                    <div className="flex flex-wrap gap-2">
                        {projectFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Proyecto: {projects.find(p => p.id === projectFilter)?.name || 'Desconocido'}
                                <button
                                    onClick={() => setProjectFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {statusFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Estado: {getStatusText(statusFilter)}
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>

                    <div className="ml-auto text-sm text-gray-500">
                        Mostrando {paginatedInvoices.length} de {filteredInvoices.length} facturas
                    </div>
                </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white shadow-sm overflow-hidden sm:rounded-lg border border-gray-200">
                {/* Table Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-4 text-sm font-medium text-gray-700">
                        <button
                            onClick={() => handleSort('number')}
                            className="flex items-center gap-1 hover:text-gray-900"
                        >
                            Número
                            {sortField === 'number' && (
                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </button>
                        <button
                            onClick={() => handleSort('project')}
                            className="flex items-center gap-1 hover:text-gray-900"
                        >
                            Proyecto
                            {sortField === 'project' && (
                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </button>
                        <button
                            onClick={() => handleSort('provider')}
                            className="flex items-center gap-1 hover:text-gray-900"
                        >
                            Proveedor
                            {sortField === 'provider' && (
                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </button>
                        <button
                            onClick={() => handleSort('amount')}
                            className="flex items-center gap-1 hover:text-gray-900"
                        >
                            Monto
                            {sortField === 'amount' && (
                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </button>
                        <div className="text-center">
                            Cuotas
                        </div>
                        <button
                            onClick={() => handleSort('dueDate')}
                            className="flex items-center gap-1 hover:text-gray-900"
                        >
                            Vencimiento
                            {sortField === 'dueDate' && (
                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </button>
                        <button
                            onClick={() => handleSort('paidDate')}
                            className="flex items-center gap-1 hover:text-gray-900"
                        >
                            Pagada
                            {sortField === 'paidDate' && (
                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </button>
                    </div>
                </div>

                <ul className="divide-y divide-gray-200">
                    {paginatedInvoices.map((invoice) => (
                        <li key={invoice.id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center min-w-0 flex-1">
                                        <div className="flex-shrink-0">
                                            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                                                <span className="text-white font-medium text-lg">{((invoice.number || invoice.id) || 'N/A').slice(-3)}</span>
                                            </div>
                                        </div>
                                        <div className="ml-4 min-w-0 flex-1">
                                            <div className="text-lg font-medium text-gray-900 truncate">{invoice.number || `Factura ${(invoice.id || 'N/A').slice(-8)}`}</div>
                                            <div className="text-sm text-gray-500 truncate">{invoice.project?.name || '-'}</div>
                                            <div className="text-sm text-gray-500 truncate">{invoice.provider?.name || '-'}</div>
                                            <div className="text-sm text-gray-500">
                                                Emitida: {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('es-ES') : '-'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-6 flex-1">
                                        <div className="text-xl font-semibold text-gray-900 text-center">
                                            ${(invoice.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                        </div>
                                        <div className="text-center">
                                            {invoice.paymentTerm ? (
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-blue-600">
                                                        {invoice.paymentTerm.payments?.length || 0}/{invoice.paymentTerm.periods}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {invoice.paymentTerm.recurrence}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 text-center">
                                            Vence: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : '-'}
                                        </div>
                                        <div className="text-center">
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                                {getStatusText(invoice.status)}
                                            </div>
                                        </div>
                                        <div className="text-sm text-center">
                                            {invoice.paidDate ? (
                                                <span className="text-green-600">
                                                    {new Date(invoice.paidDate).toLocaleDateString('es-ES')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-4">
                                    <button
                                        onClick={() => openModal('view', invoice)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        Ver factura
                                    </button>
                                    <button
                                        onClick={() => openModal('edit', invoice)}
                                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => openModal('delete', invoice)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Pagination Component */}
            <div className="mt-6">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredInvoices.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    onImportExcel={handleImportExcel}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Egresos del Mes</h3>
                    <div className="text-3xl font-bold text-red-600">${(filteredStats.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="text-sm text-gray-500 mt-2">Facturas de compra</div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Pendiente de Pago</h3>
                    <div className="text-3xl font-bold text-yellow-600">${(filteredStats.pendingAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="text-sm text-gray-500 mt-2">{filteredStats.pending || 0} facturas pendientes</div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Promedio por Factura</h3>
                    <div className="text-3xl font-bold text-blue-600">${(filteredStats.averageInvoice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="text-sm text-gray-500 mt-2">En resultados filtrados</div>
                </div>
            </div>

            {/* Modals */}
            <InvoiceFormModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSaveInvoice}
                projects={projects}
                providers={providers}
                rubros={rubros}
                mode="create"
            />

            <InvoiceFormModal
                isOpen={modals.view}
                onClose={() => closeModal('view')}
                invoice={selectedInvoice}
                onSave={handleSaveInvoice}
                projects={projects}
                providers={providers}
                rubros={rubros}
                mode="view"
            />

            <InvoiceFormModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                invoice={selectedInvoice}
                onSave={handleSaveInvoice}
                projects={projects}
                providers={providers}
                rubros={rubros}
                mode="edit"
            />

            <InvoiceImportModal
                isOpen={modals.import}
                onClose={() => closeModal('import')}
                onImport={handleImportInvoices}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteInvoice}
                title="Eliminar Factura"
                message="¿Estás seguro de que quieres eliminar esta factura?"
                itemName={selectedInvoice?.number || selectedInvoice?.id}
            />
        </Layout>
    )
}

export default function Invoices() {
    return (
        <Suspense fallback={
            <Layout title="Facturación" subtitle="Gestión de facturas y pagos">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        }>
            <InvoicesContent />
        </Suspense>
    )
}
