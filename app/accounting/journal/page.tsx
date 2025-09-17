'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { FileText, Plus, Search, Calendar, Filter, Download, Eye, Building2, User, Tag, MoreVertical, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Pagination from '@/components/ui/Pagination'

interface JournalEntry {
    id: string
    entryNumber: string
    date: string
    description: string
    debit: number
    credit: number
    currency: string
    isAutomatic: boolean
    sourceType?: string
    debitAccount?: { code: string; name: string }
    creditAccount?: { code: string; name: string }
    project?: { id: string; name: string }
    organization?: { id: string; name: string }
}

interface JournalResponse {
    entries: JournalEntry[]
    pagination: {
        page: number
        limit: number
        totalCount: number
        totalPages: number
    }
}

interface Project {
    id: string
    name: string
}

interface Account {
    id: string
    code: string
    name: string
}

export default function JournalPage() {
    const { data: session } = useSession()
    const [journalData, setJournalData] = useState<JournalResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState<Project[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [filters, setFilters] = useState({
        entryNumber: '',
        fromDate: '',
        toDate: '',
        projectId: '',
        accountId: '',
        sourceType: '',
        entryType: 'ALL', // ALL, AUTOMATIC, MANUAL
        amountFrom: '',
        amountTo: '',
        currency: '' // Nuevo filtro por moneda
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [showFilters, setShowFilters] = useState(false)
    const [openMenu, setOpenMenu] = useState<string | null>(null)

    useEffect(() => {
        fetchJournalEntries()
        fetchProjects()
        fetchAccounts()
    }, [session, currentPage])

    useEffect(() => {
        // Auto-fetch when filters change (debounced)
        const timeoutId = setTimeout(() => {
            if (currentPage === 1) {
                fetchJournalEntries()
            } else {
                setCurrentPage(1)
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [filters])

    // Cerrar menú cuando se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenu && !(event.target as Element).closest('.relative')) {
                setOpenMenu(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [openMenu])

    const fetchJournalEntries = async () => {
        try {
            setLoading(true)

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '25'
            })

            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'ALL') {
                    params.append(key, value)
                }
            })

            const response = await fetch(`/api/accounting/journal-entries?${params}`)
            if (response.ok) {
                const data = await response.json()
                setJournalData(data)
            }
        } catch (error) {
            console.error('Error fetching journal entries:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchProjects = async () => {
        try {
            const response = await fetch(`/api/projects?organizationId=${session?.user?.organizationId}`)
            if (response.ok) {
                const data = await response.json()
                setProjects(data)
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        }
    }

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/accounting/accounts')
            if (response.ok) {
                const data = await response.json()
                setAccounts(data)
            }
        } catch (error) {
            console.error('Error fetching accounts:', error)
        }
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const clearFilters = () => {
        setFilters({
            entryNumber: '',
            fromDate: '',
            toDate: '',
            projectId: '',
            accountId: '',
            sourceType: '',
            entryType: 'ALL',
            amountFrom: '',
            amountTo: '',
            currency: ''
        })
    }

    const deleteJournalEntry = async (entryId: string, entryNumber: string) => {
        if (!confirm(`¿Está seguro de que desea eliminar el asiento ${entryNumber}? Esta acción no se puede deshacer.`)) {
            return
        }

        try {
            const response = await fetch(`/api/accounting/journal-entries/${entryId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                // Recargar los datos
                fetchJournalEntries()
                alert(`Asiento ${entryNumber} eliminado exitosamente`)
            } else {
                const error = await response.json()
                alert(`Error eliminando asiento: ${error.error}`)
            }
        } catch (error) {
            console.error('Error deleting journal entry:', error)
            alert('Error de conexión al eliminar asiento')
        }
    }

    const getSourceTypeColor = (sourceType?: string) => {
        switch (sourceType) {
            case 'BILL':
                return 'bg-blue-100 text-blue-800'
            case 'PAYMENT':
                return 'bg-green-100 text-green-800'
            case 'TRANSACTION':
                return 'bg-purple-100 text-purple-800'
            case 'BILL_PAYMENT':
                return 'bg-indigo-100 text-indigo-800'
            case 'PAYROLL':
                return 'bg-orange-100 text-orange-800'
            case 'MANUAL':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const formatCurrency = (amount: number, currency: string) => {
        const formatter = new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: currency === 'PESOS' ? 'CLP' : currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })
        return formatter.format(amount)
    }

    // Group entries by entry number for cleaner display
    const groupedEntries = journalData?.entries.reduce((groups, entry) => {
        if (!groups[entry.entryNumber]) {
            groups[entry.entryNumber] = []
        }
        groups[entry.entryNumber].push(entry)
        return groups
    }, {} as Record<string, JournalEntry[]>) || {}

    const filteredGroups = Object.entries(groupedEntries).filter(([_, entries]) => {
        if (filters.entryType === 'AUTOMATIC') {
            return entries.some(e => e.isAutomatic)
        }
        if (filters.entryType === 'MANUAL') {
            return entries.some(e => !e.isAutomatic)
        }
        return true
    })

    const sourceTypes = [
        { value: '', label: 'Todos los tipos' },
        { value: 'BILL', label: 'Facturas' },
        { value: 'PAYMENT', label: 'Pagos' },
        { value: 'TRANSACTION', label: 'Transacciones' },
        { value: 'BILL_PAYMENT', label: 'Pagos de Facturas' },
        { value: 'PAYROLL', label: 'Nóminas' },
        { value: 'MANUAL', label: 'Manuales' }
    ]

    return (
        <Layout title="Libro Diario" subtitle="Registro cronológico de operaciones contables">
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Filter className="h-4 w-4" />
                            <span>Filtros</span>
                        </button>

                        <button className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Download className="h-4 w-4" />
                            <span>Exportar</span>
                        </button>

                        <Link
                            href="/accounting/journal/new"
                            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nuevo Asiento</span>
                        </Link>
                    </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Número de Asiento
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: 000001"
                                    value={filters.entryNumber}
                                    onChange={(e) => handleFilterChange('entryNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha Desde
                                </label>
                                <input
                                    type="date"
                                    value={filters.fromDate}
                                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha Hasta
                                </label>
                                <input
                                    type="date"
                                    value={filters.toDate}
                                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Proyecto
                                </label>
                                <select
                                    value={filters.projectId}
                                    onChange={(e) => handleFilterChange('projectId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Todos los proyectos</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cuenta Contable
                                </label>
                                <select
                                    value={filters.accountId}
                                    onChange={(e) => handleFilterChange('accountId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Todas las cuentas</option>
                                    {accounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.code} - {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Origen
                                </label>
                                <select
                                    value={filters.sourceType}
                                    onChange={(e) => handleFilterChange('sourceType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {sourceTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Asiento
                                </label>
                                <select
                                    value={filters.entryType}
                                    onChange={(e) => handleFilterChange('entryType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="ALL">Todos</option>
                                    <option value="AUTOMATIC">Automáticos</option>
                                    <option value="MANUAL">Manuales</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Moneda
                                </label>
                                <select
                                    value={filters.currency}
                                    onChange={(e) => handleFilterChange('currency', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Todas las monedas</option>
                                    <option value="PESOS">ARS</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monto Desde
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={filters.amountFrom}
                                    onChange={(e) => handleFilterChange('amountFrom', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monto Hasta
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={filters.amountTo}
                                    onChange={(e) => handleFilterChange('amountTo', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                )}

                {/* Summary Stats */}
                {journalData && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Asientos</p>
                                    <p className="text-2xl font-bold text-gray-900">{journalData.pagination.totalCount}</p>
                                </div>
                                <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Automáticos</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {filteredGroups.filter(([_, entries]) => entries.some(e => e.isAutomatic)).length}
                                    </p>
                                </div>
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Manuales</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {filteredGroups.filter(([_, entries]) => entries.some(e => !e.isAutomatic)).length}
                                    </p>
                                </div>
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Esta Página</p>
                                    <p className="text-2xl font-bold text-purple-600">{filteredGroups.length}</p>
                                </div>
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Journal Table - Professional ERP Style */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Asiento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Descripción
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cuenta
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Débito
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Crédito
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Origen
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                <span className="ml-2 text-gray-500">Cargando asientos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                No se encontraron asientos
                                            </h3>
                                            <p className="text-gray-500">
                                                No hay asientos contables para los filtros seleccionados
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredGroups.map(([entryNumber, entries]) => {
                                        const firstEntry = entries[0]
                                        const isFirstRow = true

                                        return entries.map((entry, index) => (
                                            <tr key={`${entry.id}-${index}`} className="hover:bg-gray-50">
                                                {index === 0 && (
                                                    <>
                                                        <td rowSpan={entries.length} className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col items-center space-y-1">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${firstEntry.isAutomatic
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {firstEntry.isAutomatic ? 'Auto' : 'Manual'}
                                                                </span>
                                                                <span className="font-mono text-sm font-bold text-gray-900">
                                                                    #{entryNumber}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td rowSpan={entries.length} className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                                            {formatDate(firstEntry.date)}
                                                        </td>
                                                        <td rowSpan={entries.length} className="px-6 py-4">
                                                            <div className="max-w-xs">
                                                                <p className="text-xs text-gray-700 truncate">
                                                                    {firstEntry.description}
                                                                </p>
                                                                {firstEntry.project && (
                                                                    <div className="flex items-center mt-1">
                                                                        <Building2 className="h-3 w-3 text-gray-400 mr-1" />
                                                                        <span className="text-xs text-gray-500">
                                                                            {firstEntry.project.name}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </>
                                                )}

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        {entry.debitAccount && (
                                                            <>
                                                                <span className="font-mono text-xs text-blue-600">
                                                                    {entry.debitAccount.code}
                                                                </span>
                                                                <span className="text-sm text-gray-600 max-w-48 truncate">
                                                                    {entry.debitAccount.name}
                                                                </span>
                                                            </>
                                                        )}
                                                        {entry.creditAccount && (
                                                            <>
                                                                <span className="font-mono text-xs text-green-600">
                                                                    {entry.creditAccount.code}
                                                                </span>
                                                                <span className="text-sm text-gray-600 max-w-48 truncate">
                                                                    {entry.creditAccount.name}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                                                    {entry.debit > 0 && (
                                                        <span className="font-medium text-blue-600">
                                                            {formatCurrency(entry.debit, entry.currency)}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                                                    {entry.credit > 0 && (
                                                        <span className="font-medium text-green-600">
                                                            {formatCurrency(entry.credit, entry.currency)}
                                                        </span>
                                                    )}
                                                </td>

                                                {index === 0 && (
                                                    <td rowSpan={entries.length} className="px-6 py-4 whitespace-nowrap">
                                                        {firstEntry.sourceType && (
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceTypeColor(firstEntry.sourceType)}`}>
                                                                {firstEntry.sourceType}
                                                            </span>
                                                        )}
                                                    </td>
                                                )}

                                                {index === 0 && (
                                                    <td rowSpan={entries.length} className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setOpenMenu(openMenu === entryNumber ? null : entryNumber)}
                                                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>

                                                            {openMenu === entryNumber && (
                                                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                deleteJournalEntry(firstEntry.id, entryNumber)
                                                                                setOpenMenu(null)
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                        >
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Eliminar Asiento
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {journalData && journalData.pagination.totalPages > 1 && (
                        <Pagination
                            currentPage={journalData.pagination.page}
                            totalPages={journalData.pagination.totalPages}
                            totalItems={journalData.pagination.totalCount}
                            itemsPerPage={journalData.pagination.limit}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={(items) => {
                                // Aquí puedes implementar el cambio de items por página si es necesario
                                console.log('Items per page changed to:', items)
                            }}
                            onExportExcel={() => {
                                // Implementar exportación Excel
                                console.log('Exportar Excel')
                            }}
                            onExportPDF={() => {
                                // Implementar exportación PDF
                                console.log('Exportar PDF')
                            }}
                        />
                    )}
                </div>
            </div>
        </Layout>
    )
}