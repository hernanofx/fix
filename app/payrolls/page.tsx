'use client'

import Layout from '../../components/Layout'
import PayrollFormModal from '../../components/modals/PayrollFormModal'
import { PayrollImportModal } from '../../components/modals/PayrollImportModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '@/components/ui/Pagination'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '../../components/ToastProvider'

function PayrollsContent() {
    const { data: session } = useSession()
    const searchParams = useSearchParams()
    const toast = useToast()
    const [payrolls, setPayrolls] = useState<any[]>([])
    const [modals, setModals] = useState({ create: false, edit: false, delete: false, import: false })
    const [selectedPayroll, setSelectedPayroll] = useState<any>(null)
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

    // Estados para filtrado y ordenamiento
    const [periodFilter, setPeriodFilter] = useState<string>('all')
    const [employeeFilter, setEmployeeFilter] = useState<string>('')
    const [projectFilter, setProjectFilter] = useState<string>('')
    const [currencyFilter, setCurrencyFilter] = useState<string>('all')
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
    const [startDateFilter, setStartDateFilter] = useState<string>('')
    const [endDateFilter, setEndDateFilter] = useState<string>('')
    const [sortField, setSortField] = useState<string>('period')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Aux data for filters
    const [employees, setEmployees] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const res = await fetch(`/api/payrolls?organizationId=${organizationId}`)
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Failed to load payrolls'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const data = await res.json()
                setPayrolls(data)
            } catch (err: any) {
                console.error(err)
                toast.error(err.message || 'No se pudieron cargar las nóminas')
            }
        }
        load()
    }, [])

    // Detect modal parameter from URL
    useEffect(() => {
        const modal = searchParams.get('modal')
        if (modal === 'create') {
            openModal('create')
        }
    }, [searchParams])

    // Load employees and projects for filters
    useEffect(() => {
        const orgId = (session as any)?.user?.organizationId
        if (!orgId) return
        let mounted = true
            ; (async () => {
                try {
                    const [eRes, pRes] = await Promise.all([
                        fetch(`/api/employees?organizationId=${orgId}`),
                        fetch(`/api/projects?organizationId=${orgId}`)
                    ])
                    if (eRes.ok) {
                        const eData = await eRes.json()
                        if (mounted) setEmployees(Array.isArray(eData) ? eData : [])
                    }
                    if (pRes.ok) {
                        const pData = await pRes.json()
                        if (mounted) setProjects(Array.isArray(pData) ? pData : [])
                    }
                } catch (err) {
                    console.error('Error loading filter data:', err)
                }
            })()
        return () => { mounted = false }
    }, [session])

    // Lógica de filtrado y ordenamiento (sin paginación para estadísticas)
    const filteredPayrolls = useMemo(() => {
        let filtered = payrolls

        // Aplicar filtro de período
        if (periodFilter !== 'all') {
            filtered = filtered.filter(payroll => payroll.period === periodFilter)
        }

        // Filtros adicionales
        if (currencyFilter !== 'all') {
            filtered = filtered.filter(payroll => (payroll.currency || '').toString() === currencyFilter)
        }

        if (employeeFilter) {
            filtered = filtered.filter(payroll => String(payroll.employeeId) === String(employeeFilter))
        }

        if (projectFilter) {
            filtered = filtered.filter(payroll => String(payroll.projectId) === String(projectFilter))
        }

        if (paymentMethodFilter !== 'all') {
            filtered = filtered.filter(payroll => (payroll.paymentMethod || '') === paymentMethodFilter)
        }

        // Date range filter (using createdAt if available)
        if (startDateFilter && endDateFilter) {
            const start = new Date(startDateFilter)
            const end = new Date(endDateFilter)
            filtered = filtered.filter(payroll => {
                if (!payroll.createdAt) return false
                const created = new Date(payroll.createdAt)
                return created >= start && created <= end
            })
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            // Manejar casos especiales
            if (sortField === 'period') {
                // Ordenar por período (YYYY-MM)
                aValue = aValue || ''
                bValue = bValue || ''
            } else if (sortField === 'baseSalary' || sortField === 'overtimePay' || sortField === 'bonuses' || sortField === 'deductions' || sortField === 'netPay') {
                aValue = aValue || 0
                bValue = bValue || 0
            } else if (sortField === 'overtimeHours') {
                aValue = aValue || 0
                bValue = bValue || 0
            } else if (sortField === 'employeeName') {
                aValue = (aValue || '').toString().toLowerCase()
                bValue = (bValue || '').toString().toLowerCase()
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [payrolls, periodFilter, sortField, sortDirection])

    // Totals grouped by currency (for current filtered view)
    const totalsByCurrency = useMemo(() => {
        const map: Record<string, { count: number; netPay: number; baseSalary: number; bonuses: number; overtimePay: number }> = {}
        filteredPayrolls.forEach(p => {
            const cur = p.currency || 'PESOS'
            if (!map[cur]) map[cur] = { count: 0, netPay: 0, baseSalary: 0, bonuses: 0, overtimePay: 0 }
            map[cur].count += 1
            map[cur].netPay += Number(p.netPay || 0)
            map[cur].baseSalary += Number(p.baseSalary || 0)
            map[cur].bonuses += Number(p.bonuses || 0)
            map[cur].overtimePay += Number(p.overtimePay || 0)
        })
        return map
    }, [filteredPayrolls])

    // Datos paginados para mostrar en la tabla
    const paginatedPayrolls = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredPayrolls.slice(startIndex, endIndex)
    }, [filteredPayrolls, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [periodFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage)

    // Obtener períodos únicos para el filtro
    const uniquePeriods = useMemo(() => {
        const periods = payrolls.map(p => p.period).filter(Boolean)
        return Array.from(new Set(periods)).sort().reverse() // Más reciente primero
    }, [payrolls])

    // Función para cambiar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = () => setDropdownOpen(null)
        if (dropdownOpen) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [dropdownOpen])

    const openModal = (modalType: keyof typeof modals, payroll?: any) => {
        const organizationId = (session as any)?.user?.organizationId
        if (!organizationId) {
            toast.error('No se encontró la organización en la sesión. Reingresa o selecciona una organización.')
            return
        }
        setSelectedPayroll(payroll)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedPayroll(null)
    }

    const handleSavePayroll = async (payrollData: any) => {
        try {
            const userId = session?.user?.id as string | undefined
            const organizationId = (session as any)?.user?.organizationId as string | undefined

            if (!userId) {
                toast.error('No se encontró el usuario en la sesión')
                return
            }

            if (!organizationId) {
                toast.error('No se encontró la organización en la sesión')
                return
            }

            if (selectedPayroll) {
                const res = await fetch(`/api/payrolls/${selectedPayroll.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payrollData)
                })

                if (!res.ok) {
                    const errorText = await res.text()
                    throw new Error(`Error ${res.status}: ${errorText}`)
                }

                const updated = await res.json()
                setPayrolls(payrolls.map(p => p.id === selectedPayroll.id ? updated : p))
                toast.success('Nómina actualizada')
            } else {
                const payload = { ...payrollData, organizationId, createdById: userId }
                console.log('Sending payroll data:', payload)

                const res = await fetch('/api/payrolls', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                if (!res.ok) {
                    const errorText = await res.text()
                    console.error('Payroll creation failed:', errorText)
                    throw new Error(`Error ${res.status}: ${errorText}`)
                }

                const created = await res.json()
                console.log('Payroll created successfully:', created)
                setPayrolls([created, ...payrolls])
                toast.success('Nómina creada exitosamente')
            }
            closeModal('create')
            closeModal('edit')
        } catch (err: any) {
            console.error('Save payroll error:', err)
            toast.error(err?.message || 'Error al guardar la nómina')
        }
    }

    const handleDeletePayroll = async () => {
        try {
            if (!selectedPayroll) return
            await fetch(`/api/payrolls/${selectedPayroll.id}`, { method: 'DELETE' })
            setPayrolls(payrolls.filter(p => p.id !== selectedPayroll.id))
            toast.success('Nómina eliminada')
            closeModal('delete')
        } catch (err) {
            console.error('Delete payroll error', err)
            toast.error('Error al eliminar la nómina')
        }
    }

    const handleImportExcel = () => {
        setModals({ ...modals, import: true })
    }

    const handleImportPayrolls = async (file: File) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/payrolls/import/excel', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al importar nóminas')
            }

            const result = await response.json()

            // Reload payrolls
            const organizationId = (session as any)?.user?.organizationId
            if (organizationId) {
                const res = await fetch(`/api/payrolls?organizationId=${organizationId}`)
                if (res.ok) {
                    const data = await res.json()
                    setPayrolls(data)
                }
            }

            toast.success(`Se importaron ${result.imported} nóminas exitosamente`)

            if (result.errors && result.errors.length > 0) {
                console.warn('Import errors:', result.errors)
                toast.error(`Se encontraron ${result.errors.length} errores durante la importación`)
            }

            closeModal('import')
        } catch (error) {
            console.error('Import error:', error)
            toast.error(error instanceof Error ? error.message : 'Error al importar nóminas')
        }
    }

    const handleExportExcel = async () => {
        try {
            const response = await fetch('/api/payrolls/export/excel')

            if (!response.ok) {
                throw new Error('Error al exportar nóminas')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `payrolls_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('Nóminas exportadas exitosamente')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Error al exportar nóminas')
        }
    }

    const handleExportPDF = async () => {
        try {
            const response = await fetch('/api/payrolls/export/pdf')

            if (!response.ok) {
                throw new Error('Error al exportar nóminas en PDF')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `payrolls_report_${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('Reporte de nóminas generado exitosamente')
        } catch (error) {
            console.error('Export PDF error:', error)
            toast.error('Error al generar reporte PDF')
        }
    }

    const currencyCodeMap: Record<string, string> = {
        PESOS: 'ARS',
        USD: 'USD',
        EUR: 'EUR'
    }

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        const code = currencyCodeMap[currency] || currency || 'USD'
        try {
            return new Intl.NumberFormat('es-AR', { style: 'currency', currency: code }).format(amount)
        } catch (e) {
            return amount.toFixed(2)
        }
    }

    const formatPeriod = (period: string) => {
        const [year, month] = (period || '').split('-')
        const date = new Date(parseInt(year || '1970'), (parseInt(month || '1') - 1) || 0)
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
    }

    const getTotalSalaries = () => filteredPayrolls.reduce((total, payroll) => total + (payroll.netPay || 0), 0)
    const getTotalOvertime = () => filteredPayrolls.reduce((total, payroll) => total + (payroll.overtimePay || 0), 0)
    const getTotalBonuses = () => filteredPayrolls.reduce((total, payroll) => total + (payroll.bonuses || 0), 0)

    return (
        <Layout
            title="Nóminas"
            subtitle="Gestiona y administra las nóminas de empleados"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div></div>
                <button
                    onClick={() => openModal('create')}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Nueva Nómina
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                {/* If we have totals per currency, render one card per currency */}
                {Object.keys(totalsByCurrency).length > 0 ? (
                    Object.entries(totalsByCurrency).map(([cur, vals]) => (
                        <div key={cur} className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500 truncate">{cur} - Nóminas</dt>
                                    <dd className="text-2xl font-semibold text-gray-900">{vals.count}</dd>
                                    <dd className="text-sm text-gray-600">Neto: {formatCurrency(vals.netPay, cur)}</dd>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total nóminas</dt>
                                    <dd className="text-2xl font-semibold text-gray-900">{filteredPayrolls.length}</dd>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total salarios</dt>
                                    <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(getTotalSalaries())}</dd>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500 truncate">Horas extra</dt>
                                    <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(getTotalOvertime())}</dd>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500 truncate">Bonos totales</dt>
                                    <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(getTotalBonuses())}</dd>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Filter Controls */}
            <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Período:</label>
                        <select
                            value={periodFilter}
                            onChange={(e) => setPeriodFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos</option>
                            {uniquePeriods.map(period => (
                                <option key={period} value={period}>{formatPeriod(period)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Empleado:</label>
                        <select
                            value={employeeFilter}
                            onChange={(e) => setEmployeeFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Proyecto:</label>
                        <select
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            {projects.map(proj => (
                                <option key={proj.id} value={proj.id}>{proj.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Moneda:</label>
                        <select
                            value={currencyFilter}
                            onChange={(e) => setCurrencyFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todas</option>
                            {Object.keys(totalsByCurrency).map(cur => (
                                <option key={cur} value={cur}>{cur}</option>
                            ))}
                            <option value="PESOS">PESOS</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Método Pago:</label>
                        <select
                            value={paymentMethodFilter}
                            onChange={(e) => setPaymentMethodFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos</option>
                            <option value="cashBox">Caja</option>
                            <option value="bankAccount">Cuenta Bancaria</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Rango creado:</label>
                        <input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1 text-sm" />
                        <input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1 text-sm" />
                    </div>

                    {/* Active Filters Display */}
                    <div className="flex flex-wrap gap-2">
                        {periodFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Período: {formatPeriod(periodFilter)}
                                <button
                                    onClick={() => setPeriodFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>

                    <div className="ml-auto text-sm text-gray-500">
                        Mostrando {paginatedPayrolls.length} de {filteredPayrolls.length} nóminas
                    </div>
                </div>
            </div>

            {/* Payrolls Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Nóminas Generadas</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('employeeName')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Empleado
                                        {sortField === 'employeeName' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('period')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Período
                                        {sortField === 'period' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('baseSalary')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Salario Base
                                        {sortField === 'baseSalary' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('overtimeHours')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Horas Extra
                                        {sortField === 'overtimeHours' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('bonuses')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Bonos
                                        {sortField === 'bonuses' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Deducciones
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('netPay')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Salario Neto
                                        {sortField === 'netPay' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedPayrolls.map((payroll: any) => (
                                <tr key={payroll.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openModal('edit', payroll)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {(payroll.employeeName || '').split(' ').map((n: string) => n[0] || '').join('').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{payroll.employeeName}</div>
                                                <div className="text-sm text-gray-500">{payroll.employeePosition}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatPeriod(payroll.period)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatCurrency(payroll.baseSalary, payroll.currency || 'PESOS')}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            <div>{payroll.overtimeHours}h</div>
                                            <div className="text-gray-500">{formatCurrency(payroll.overtimePay, payroll.currency || 'PESOS')}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatCurrency(payroll.bonuses || 0, payroll.currency || 'PESOS')}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-red-600">-{formatCurrency(Number(payroll.deductions || 0), payroll.currency || 'PESOS')}</div>
                                        {payroll.deductionsDetail && (
                                            <div className="text-xs text-gray-500">{payroll.deductionsDetail}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-green-600">{formatCurrency(payroll.netPay, payroll.currency || 'PESOS')}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative inline-block text-left">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDropdownOpen(dropdownOpen === payroll.id ? null : payroll.id)
                                                }}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>

                                            {dropdownOpen === payroll.id && (
                                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openModal('edit', payroll)
                                                                setDropdownOpen(null)
                                                            }}
                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                        >
                                                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Ver/Editar
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openModal('delete', payroll)
                                                                setDropdownOpen(null)
                                                            }}
                                                            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                                        >
                                                            <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
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
            </div>

            {/* Pagination Component */}
            <div className="mt-6">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredPayrolls.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    onImportExcel={handleImportExcel}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />
            </div>

            {/* Modals */}
            <PayrollFormModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSavePayroll}
            />

            <PayrollFormModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                payroll={selectedPayroll}
                onSave={handleSavePayroll}
            />

            <PayrollImportModal
                isOpen={modals.import}
                onClose={() => closeModal('import')}
                onImport={handleImportPayrolls}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeletePayroll}
                title="Eliminar Nómina"
                message="¿Estás seguro de que quieres eliminar esta nómina?"
                itemName={`${selectedPayroll?.employeeName} - ${selectedPayroll?.period ? formatPeriod(selectedPayroll.period) : ''}`}
            />
        </Layout>
    )
}

export default function Payrolls() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <PayrollsContent />
        </Suspense>
    )
}
