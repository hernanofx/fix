'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, TrendingUp, TrendingDown, DollarSign, Filter, Plus, Edit, Trash2, Wallet, Target } from 'lucide-react'
import { toast } from 'sonner'
import Layout from '@/components/Layout'
import Pagination from '@/components/ui/Pagination'

interface CashflowItem {
    id: string
    date: string
    amount: number
    type: 'INCOME' | 'EXPENSE'
    currency: string
    entityName: string
    entityType: string
    projectName?: string
    paymentTermId: string
    periodNumber: number
    description?: string
}

interface MonthlySummary {
    month: string
    totalIncome: number
    totalExpense: number
    incomeByCurrency: Record<string, number>
    expenseByCurrency: Record<string, number>
    items: CashflowItem[]
}

interface CashflowData {
    summary: MonthlySummary[]
    details: CashflowItem[]
    totalsByCurrency: Record<string, {
        totalIncome: number
        totalExpense: number
        netCashflow: number
    }>
}

interface Project {
    id: string
    name: string
}

export default function Cashflow() {
    const { data: session } = useSession()
    const [cashflowData, setCashflowData] = useState<CashflowData | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProject, setSelectedProject] = useState<string>('all')
    const [monthsAhead, setMonthsAhead] = useState<string>('3')
    const [isLoading, setIsLoading] = useState(false)

    // Estados para filtros y ordenamiento
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [entityFilter, setEntityFilter] = useState<string>('all')
    const [currencyFilter, setCurrencyFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('date')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(5)

    // Estado para búsqueda
    const [searchTerm, setSearchTerm] = useState('')

    // Estados para importación
    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)

    // Estados para datos de cajas y bancos
    const [cashBoxes, setCashBoxes] = useState<any[]>([])
    const [bankAccounts, setBankAccounts] = useState<any[]>([])
    const [loadingBalances, setLoadingBalances] = useState(false)

    useEffect(() => {
        if (session?.user?.organizationId) {
            fetchProjects()
            fetchCashflow()
            fetchBalances()
        }
    }, [session])

    useEffect(() => {
        if (session?.user?.organizationId) {
            fetchCashflow()
        }
    }, [selectedProject, monthsAhead, typeFilter, entityFilter, currencyFilter, searchTerm])

    const fetchProjects = async () => {
        try {
            const response = await fetch(`/api/projects?organizationId=${session?.user?.organizationId}`)
            if (response.ok) {
                const data = await response.json()
                setProjects(data)
            }
        } catch (error) {
            toast.error('Error al cargar proyectos')
        }
    }

    const fetchBalances = async () => {
        setLoadingBalances(true)
        try {
            const orgId = session?.user?.organizationId

            // Usar la nueva API de balances unificada
            const balancesResponse = await fetch(`/api/treasury/balances?organizationId=${orgId}`)
            if (balancesResponse.ok) {
                const balancesData = await balancesResponse.json()

                // Separar cajas y bancos desde la respuesta unificada
                const cashBoxesData = Object.values(balancesData.accounts).filter((account: any) => account.type === 'CASH_BOX')
                const bankAccountsData = Object.values(balancesData.accounts).filter((account: any) => account.type === 'BANK_ACCOUNT')

                setCashBoxes(cashBoxesData)
                setBankAccounts(bankAccountsData)
            }
        } catch (error) {
            console.error('Error al cargar saldos:', error)
        } finally {
            setLoadingBalances(false)
        }
    }

    const fetchCashflow = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                organizationId: session?.user?.organizationId || '',
                monthsAhead,
                ...(selectedProject && selectedProject !== 'all' && { projectId: selectedProject }),
                ...(typeFilter && typeFilter !== 'all' && { typeFilter }),
                ...(entityFilter && entityFilter !== 'all' && { entityFilter }),
                ...(currencyFilter && currencyFilter !== 'all' && { currencyFilter }),
                ...(searchTerm && searchTerm.trim() && { searchTerm: searchTerm.trim() })
            })

            const response = await fetch(`/api/cashflow?${params}`)
            if (response.ok) {
                const data = await response.json()
                setCashflowData(data)
            } else {
                toast.error('Error al cargar cashflow')
            }
        } catch (error) {
            toast.error('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    // Filtered and sorted cashflow items (simplified since filtering is done in backend)
    const filteredItems = useMemo(() => {
        if (!cashflowData?.details) return []

        let filtered = cashflowData.details

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortField) {
                case 'date':
                    aValue = new Date(a.date).getTime()
                    bValue = new Date(b.date).getTime()
                    break
                case 'amount':
                    aValue = a.amount
                    bValue = b.amount
                    break
                case 'entityName':
                    aValue = a.entityName?.toLowerCase() || ''
                    bValue = b.entityName?.toLowerCase() || ''
                    break
                case 'type':
                    aValue = a.type
                    bValue = b.type
                    break
                case 'currency':
                    aValue = a.currency
                    bValue = b.currency
                    break
                default:
                    aValue = a.date
                    bValue = b.date
            }

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })

        return filtered
    }, [cashflowData?.details, sortField, sortDirection])

    // Datos paginados
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredItems.slice(startIndex, endIndex)
    }, [filteredItems, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [typeFilter, entityFilter, currencyFilter, sortField, sortDirection, searchTerm])

    // Calculate total pages
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

    // Obtener opciones únicas para filtros
    const uniqueTypes = useMemo(() => {
        if (!cashflowData?.details) return []
        const types = cashflowData.details.map(item => item.type).filter(Boolean)
        return Array.from(new Set(types))
    }, [cashflowData?.details])

    const uniqueEntityTypes = useMemo(() => {
        if (!cashflowData?.details) return []
        const entityTypes = cashflowData.details.map(item => item.entityType).filter(Boolean)
        return Array.from(new Set(entityTypes))
    }, [cashflowData?.details])

    const uniqueCurrencies = useMemo(() => {
        if (!cashflowData?.details) return []
        const currencies = cashflowData.details.map(item => item.currency).filter(Boolean)
        return Array.from(new Set(currencies))
    }, [cashflowData?.details])

    // Función para manejar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
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

            const response = await fetch(`/api/cashflow/export/excel?organizationId=${orgId}&monthsAhead=${monthsAhead}&projectId=${selectedProject}&typeFilter=${typeFilter}&entityFilter=${entityFilter}&currencyFilter=${currencyFilter}&searchTerm=${encodeURIComponent(searchTerm)}`)

            if (!response.ok) {
                throw new Error('Error al exportar')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `cashflow_proyectado_${new Date().toISOString().split('T')[0]}.xlsx`
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

            const response = await fetch(`/api/cashflow/export/pdf?organizationId=${orgId}&monthsAhead=${monthsAhead}&projectId=${selectedProject}&typeFilter=${typeFilter}&entityFilter=${entityFilter}&currencyFilter=${currencyFilter}&searchTerm=${encodeURIComponent(searchTerm)}`)

            if (!response.ok) {
                throw new Error('Error al exportar')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `cashflow_proyectado_${new Date().toISOString().split('T')[0]}.pdf`
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

            const endpoint = '/api/cashflow/import/excel'

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
            fetchCashflow()

            alert(`Archivo importado exitosamente. ${result.importedCount || 0} registros procesados.`)
            setShowImportModal(false)
        } catch (error) {
            console.error('Error importing file:', error)
            alert(`Error al importar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        } finally {
            setImporting(false)
        }
    }

    const formatCurrency = (amount: number, currency: string) => {
        const currencySymbols = {
            'PESOS': 'CLP',
            'USD': 'USD',
            'EUR': 'EUR'
        }

        const currencyCode = currencySymbols[currency as keyof typeof currencySymbols] || currency

        try {
            return new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount)
        } catch (error) {
            // Fallback si hay problemas con el formato de moneda
            return `${currency === 'PESOS' ? '$' : currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : currency} ${amount.toLocaleString('es-CL')}`
        }
    }

    const formatMonth = (monthKey: string) => {
        const [year, month] = monthKey.split('-')
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long'
        })
    }

    const getNetCashflow = (summary: MonthlySummary) => {
        return summary.totalIncome - summary.totalExpense
    }

    // Calcular saldos proyectados por moneda
    const projectedBalancesByCurrency = useMemo(() => {
        if (!cashflowData?.totalsByCurrency) return {}

        const balances: Record<string, {
            currentBalance: number
            projectedBalance: number
            netCashflow: number
        }> = {}

        // Obtener saldos actuales por moneda
        const currentBalances: Record<string, number> = {}

        // Sumar saldos de cajas usando balancesByCurrency
        cashBoxes.forEach((box: any) => {
            if (box.balancesByCurrency) {
                Object.entries(box.balancesByCurrency).forEach(([currency, balance]: [string, any]) => {
                    currentBalances[currency] = (currentBalances[currency] || 0) + balance
                })
            }
        })

        // Sumar saldos de cuentas bancarias usando balancesByCurrency
        bankAccounts.forEach((account: any) => {
            if (account.balancesByCurrency) {
                Object.entries(account.balancesByCurrency).forEach(([currency, balance]: [string, any]) => {
                    currentBalances[currency] = (currentBalances[currency] || 0) + balance
                })
            }
        })

        // Calcular saldos proyectados
        Object.entries(cashflowData.totalsByCurrency).forEach(([currency, totals]) => {
            const currentBalance = currentBalances[currency] || 0
            const projectedBalance = currentBalance + totals.netCashflow

            balances[currency] = {
                currentBalance,
                projectedBalance,
                netCashflow: totals.netCashflow
            }
        })

        return balances
    }, [cashflowData?.totalsByCurrency, cashBoxes, bankAccounts])

    if (!cashflowData) {
        return (
            <Layout title="Cashflow Proyectado" subtitle="Visualiza tus ingresos y egresos futuros">
                <div className="container mx-auto p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Cargando cashflow...</p>
                        </div>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Cashflow Proyectado" subtitle="Visualiza tus ingresos y egresos futuros">
            <div className="container mx-auto p-6">
                {/* Barra de filtros y búsqueda */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Filtros y Búsqueda</h3>
                            <button
                                onClick={() => {
                                    setSelectedProject('all')
                                    setTypeFilter('all')
                                    setEntityFilter('all')
                                    setCurrencyFilter('all')
                                    setSearchTerm('')
                                    setSortField('date')
                                    setSortDirection('desc')
                                    setMonthsAhead('3')
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                        </div>

                        {/* Indicadores de filtros activos */}
                        {(typeFilter !== 'all' || entityFilter !== 'all' || currencyFilter !== 'all' || sortField !== 'date') && (
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
                                {currencyFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        Moneda: {currencyFilter}
                                        <button
                                            onClick={() => setCurrencyFilter('all')}
                                            className="ml-1 text-purple-600 hover:text-purple-800"
                                            title="Quitar filtro de moneda"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {sortField !== 'date' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        Orden: {sortField === 'amount' ? 'Monto' : sortField === 'entityName' ? 'Entidad' : 'Campo'} {sortDirection === 'asc' ? '↑' : '↓'}
                                        <button
                                            onClick={() => {
                                                setSortField('date')
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

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Filtro de proyecto */}
                        <div>
                            <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Proyecto
                            </label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todos los proyectos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los proyectos</SelectItem>
                                    {projects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

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

                        {/* Filtro de moneda */}
                        <div>
                            <label htmlFor="currency-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Moneda
                            </label>
                            <select
                                id="currency-filter"
                                value={currencyFilter}
                                onChange={(e) => setCurrencyFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Todas</option>
                                {uniqueCurrencies.map(currency => (
                                    <option key={currency} value={currency}>{currency}</option>
                                ))}
                            </select>
                        </div>

                        {/* Meses adelante */}
                        <div>
                            <label htmlFor="months-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Período
                            </label>
                            <Select value={monthsAhead} onValueChange={setMonthsAhead}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 mes</SelectItem>
                                    <SelectItem value="2">2 meses</SelectItem>
                                    <SelectItem value="3">3 meses</SelectItem>
                                    <SelectItem value="6">6 meses</SelectItem>
                                    <SelectItem value="12">12 meses</SelectItem>
                                    <SelectItem value="24">24 meses</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {cashflowData && cashflowData.totalsByCurrency && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Total Ingresos por Moneda */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(cashflowData.totalsByCurrency)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([currency, totals]) => (
                                            <div key={currency} className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">{currency}:</span>
                                                <span className="text-sm font-medium text-green-600">
                                                    {formatCurrency(totals.totalIncome, currency)}
                                                </span>
                                            </div>
                                        ))}
                                    {Object.keys(cashflowData.totalsByCurrency).length > 1 && (
                                        <div className="border-t pt-2 mt-2">
                                            <div className="text-xs text-gray-500 text-center">
                                                Totales por moneda (sin conversión)
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Egresos por Moneda */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Egresos</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(cashflowData.totalsByCurrency)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([currency, totals]) => (
                                            <div key={currency} className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">{currency}:</span>
                                                <span className="text-sm font-medium text-red-600">
                                                    {formatCurrency(totals.totalExpense, currency)}
                                                </span>
                                            </div>
                                        ))}
                                    {Object.keys(cashflowData.totalsByCurrency).length > 1 && (
                                        <div className="border-t pt-2 mt-2">
                                            <div className="text-xs text-gray-500 text-center">
                                                Totales por moneda (sin conversión)
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Flujo Neto por Moneda */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Flujo Neto</CardTitle>
                                <DollarSign className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(cashflowData.totalsByCurrency)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([currency, totals]) => (
                                            <div key={currency} className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">{currency}:</span>
                                                <span className={`text-sm font-medium ${totals.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(totals.netCashflow, currency)}
                                                </span>
                                            </div>
                                        ))}
                                    {Object.keys(cashflowData.totalsByCurrency).length > 1 && (
                                        <div className="border-t pt-2 mt-2">
                                            <div className="text-xs text-gray-500 text-center">
                                                Flujo neto por moneda
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Balance Projection Cards */}
                {Object.keys(projectedBalancesByCurrency).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Saldo Actual por Moneda */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Saldo Actual</CardTitle>
                                <Wallet className="h-4 w-4 text-indigo-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(projectedBalancesByCurrency)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([currency, balances]) => (
                                            <div key={currency} className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">{currency}:</span>
                                                <span className="text-sm font-medium text-indigo-600">
                                                    {formatCurrency(balances.currentBalance, currency)}
                                                </span>
                                            </div>
                                        ))}
                                    {Object.keys(projectedBalancesByCurrency).length > 1 && (
                                        <div className="border-t pt-2 mt-2">
                                            <div className="text-xs text-gray-500 text-center">
                                                Saldos actuales en cajas y bancos
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Flujo Neto Proyectado por Moneda */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Flujo Neto Proyectado</CardTitle>
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(projectedBalancesByCurrency)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([currency, balances]) => (
                                            <div key={currency} className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">{currency}:</span>
                                                <span className={`text-sm font-medium ${balances.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {balances.netCashflow >= 0 ? '+' : ''}{formatCurrency(balances.netCashflow, currency)}
                                                </span>
                                            </div>
                                        ))}
                                    {Object.keys(projectedBalancesByCurrency).length > 1 && (
                                        <div className="border-t pt-2 mt-2">
                                            <div className="text-xs text-gray-500 text-center">
                                                Flujo neto del período proyectado
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Saldo Proyectado Final por Moneda */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Saldo Proyectado Final</CardTitle>
                                <Target className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(projectedBalancesByCurrency)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([currency, balances]) => (
                                            <div key={currency} className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">{currency}:</span>
                                                <span className={`text-sm font-medium ${balances.projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(balances.projectedBalance, currency)}
                                                </span>
                                            </div>
                                        ))}
                                    {Object.keys(projectedBalancesByCurrency).length > 1 && (
                                        <div className="border-t pt-2 mt-2">
                                            <div className="text-xs text-gray-500 text-center">
                                                Saldo final proyectado
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabla de cashflow */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden mt-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Proyección de Cashflow</h3>
                            <div className="text-sm text-gray-600">
                                {filteredItems.length} proyecciones encontradas
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('date')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Fecha
                                            {sortField === 'date' && (
                                                <span className="text-gray-400">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
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
                                        onClick={() => handleSort('entityName')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Entidad
                                            {sortField === 'entityName' && (
                                                <span className="text-gray-400">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Descripción
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
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('currency')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Moneda
                                            {sortField === 'currency' && (
                                                <span className="text-gray-400">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Proyecto
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(item.date).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={item.type === 'INCOME' ? 'default' : 'secondary'}>
                                                {item.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <span>{item.entityName}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {item.entityType === 'CLIENT' ? 'Cliente' : 'Proveedor'}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div>
                                                <div className="font-medium">{item.description || `Período ${item.periodNumber}`}</div>
                                                <div className="text-xs text-gray-500">ID: {item.periodNumber}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <span className={item.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                                                {item.type === 'INCOME' ? '+' : '-'}
                                                ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.currency}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.projectName || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mostrar mensaje si no hay proyecciones filtradas */}
                    {filteredItems.length === 0 && (
                        <div className="px-6 py-8 text-center">
                            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proyecciones encontradas</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm.trim()
                                    ? `No se encontraron proyecciones que coincidan con "${searchTerm}".`
                                    : typeFilter !== 'all' || entityFilter !== 'all' || currencyFilter !== 'all'
                                        ? 'No se encontraron proyecciones con los filtros aplicados.'
                                        : 'No se encontraron proyecciones de cashflow.'
                                }
                            </p>
                        </div>
                    )}

                    {/* Información de resumen */}
                    {filteredItems.length > 0 && (
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Mostrando {Math.min(paginatedItems.length, itemsPerPage)} de {filteredItems.length} proyecciones
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
                                {currencyFilter !== 'all' && (
                                    <span className="ml-2 text-purple-600">
                                        (moneda: {currencyFilter})
                                    </span>
                                )}
                                {searchTerm.trim() && (
                                    <span className="ml-2 text-orange-600">
                                        (búsqueda: "{searchTerm}")
                                    </span>
                                )}
                                {sortField !== 'date' && (
                                    <span className="ml-2 text-indigo-600">
                                        (ordenado por: {sortField === 'amount' ? 'Monto' : sortField === 'entityName' ? 'Entidad' : sortField} {sortDirection === 'asc' ? '↑' : '↓'})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Paginación */}
                {filteredItems.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredItems.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Buscar proyecciones..."
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
                                        <li>Columnas: Fecha, Tipo, Entidad, Monto, Moneda, Descripcion, Proyecto</li>
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
            </div>
        </Layout>
    )
}
