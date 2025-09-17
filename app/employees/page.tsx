'use client'

import Layout from '../../components/Layout'
import EmployeeFormModal from '../../components/modals/EmployeeFormModal'
import { EmployeeImportModal } from '../../components/modals/EmployeeImportModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import AssignmentFormModal from '../../components/modals/AssignmentFormModal'
import PayrollFormModal from '../../components/modals/PayrollFormModal'
import EvaluationFormModal from '../../components/modals/EvaluationFormModal'
import Pagination from '@/components/ui/Pagination'
import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '../../components/ToastProvider'
import { Suspense } from 'react'

function EmployeesContent() {
    const [employees, setEmployees] = useState<any[]>([])
    const toast = useToast()
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

    const [modals, setModals] = useState({
        create: false,
        edit: false,
        view: false,
        delete: false,
        assignment: false,
        payroll: false,
        evaluation: false
    })

    const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
    const [assignments, setAssignments] = useState<any[]>([])
    const [payrolls, setPayrolls] = useState<any[]>([])
    const [evaluations, setEvaluations] = useState<any[]>([])

    // Estados para filtros y ordenamiento
    const [positionFilter, setPositionFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const { data: session } = useSession()
    const searchParams = useSearchParams()

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = () => setDropdownOpen(null)
        if (dropdownOpen) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [dropdownOpen])

    useEffect(() => {
        const load = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const res = await fetch(`/api/employees?organizationId=${organizationId}`)
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Failed to load employees'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const data = await res.json()
                setEmployees(Array.isArray(data) ? data : [])
            } catch (err: any) {
                console.error(err)
                toast.error(err.message || 'No se pudieron cargar los empleados')
            }
        }

        load()
    }, [session])

    // Lógica de filtrado y ordenamiento (sin paginación para estadísticas)
    const filteredEmployees = useMemo(() => {
        let filtered = Array.isArray(employees) ? employees : []

        // Aplicar filtro de posición
        if (positionFilter !== 'all') {
            filtered = filtered.filter(employee => employee.position === positionFilter)
        }

        // Aplicar filtro de estado
        if (statusFilter !== 'all') {
            filtered = filtered.filter(employee => employee.status === statusFilter)
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            // Manejar casos especiales
            if (sortField === 'name') {
                aValue = (aValue || '').toLowerCase()
                bValue = (bValue || '').toLowerCase()
            } else if (sortField === 'hoursThisWeek') {
                aValue = aValue || 0
                bValue = bValue || 0
            } else if (sortField === 'joinDate') {
                aValue = new Date(aValue || 0).getTime()
                bValue = new Date(bValue || 0).getTime()
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [employees, positionFilter, statusFilter, sortField, sortDirection])

    // Datos paginados para mostrar en la tabla
    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredEmployees.slice(startIndex, endIndex)
    }, [filteredEmployees, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [positionFilter, statusFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)

    // Obtener posiciones únicas para el filtro
    const uniquePositions = useMemo(() => {
        const positions = employees.map(e => e.position).filter(Boolean)
        return Array.from(new Set(positions)).sort()
    }, [employees])

    // Obtener estados únicos para el filtro
    const uniqueStatuses = useMemo(() => {
        const statuses = employees.map(e => e.status).filter(Boolean)
        return Array.from(new Set(statuses)).sort()
    }, [employees])

    // Función para cambiar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Check for modal parameter in URL
    useEffect(() => {
        const modalParam = searchParams.get('modal')
        if (modalParam === 'create') {
            openModal('create')
        }
    }, [searchParams])

    const openModal = async (modalType: keyof typeof modals, employee?: any) => {
        // If editing or viewing, fetch fresh data from API
        if ((modalType === 'edit' || modalType === 'view') && employee?.id) {
            try {
                const res = await fetch(`/api/employees/${employee.id}`)
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Failed to fetch employee'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const data = await res.json()
                setSelectedEmployee(data)
                setModals({ ...modals, [modalType]: true })
                return
            } catch (err) {
                console.error(err)
                toast.error('No se pudo cargar el empleado para editar')
                return
            }
        }

        setSelectedEmployee(employee)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedEmployee(null)
    }

    const handleSaveEmployee = async (employeeData: any) => {
        try {
            const userId = session?.user?.id as string | undefined
            const organizationId = (session as any)?.user?.organizationId as string | undefined

            if (selectedEmployee?.id) {
                // update
                const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(employeeData)
                })
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Error updating employee'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const updated = await res.json()
                setEmployees(employees.map(emp => emp.id === updated.id ? updated : emp))
            } else {
                // create
                const payload = { ...employeeData, createdById: userId, organizationId }
                const res = await fetch('/api/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Error creating employee'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const created = await res.json()
                setEmployees([created, ...employees])
            }

            closeModal('create')
            closeModal('edit')
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || 'Error al guardar empleado')
        }
    }

    const handleDeleteEmployee = async () => {
        if (!selectedEmployee?.id) return
        try {
            const res = await fetch(`/api/employees/${selectedEmployee.id}`, { method: 'DELETE' })
            if (!res.ok) {
                const txt = await res.text().catch(() => null)
                let msg = 'Error deleting'
                try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                throw new Error(msg)
            }
            setEmployees(employees.filter(emp => emp.id !== selectedEmployee.id))
            closeModal('delete')
        } catch (err: any) {
            console.error(err)
            toast.error('No se pudo eliminar el empleado')
        }
    }

    const handleSaveAssignment = (assignmentData: any) => {
        if (assignments.find(a => a.id === assignmentData.id)) {
            // Edit existing assignment
            setAssignments(assignments.map(a => a.id === assignmentData.id ? assignmentData : a))
        } else {
            // Create new assignment
            setAssignments([...assignments, assignmentData])
        }
    }

    const handleSavePayroll = (payrollData: any) => {
        if (payrolls.find(p => p.id === payrollData.id)) {
            // Edit existing payroll
            setPayrolls(payrolls.map(p => p.id === payrollData.id ? payrollData : p))
        } else {
            // Create new payroll
            setPayrolls([...payrolls, payrollData])
        }
    }

    const handleSaveEvaluation = (evaluationData: any) => {
        if (evaluations.find(e => e.id === evaluationData.id)) {
            // Edit existing evaluation
            setEvaluations(evaluations.map(e => e.id === evaluationData.id ? evaluationData : e))
        } else {
            // Create new evaluation
            setEvaluations([...evaluations, evaluationData])
        }
    }

    const handleImportExcel = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/employees/import/excel', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                alert(`Importación exitosa: ${result.imported} empleados importados`)
                // Recargar los datos
                const orgId = session?.user?.organizationId
                if (orgId) {
                    const res = await fetch(`/api/employees?organizationId=${orgId}`)
                    if (res.ok) {
                        const data = await res.json()
                        setEmployees(data)
                    }
                }
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
                position: positionFilter,
                status: statusFilter,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/employees/export/excel?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `empleados_${new Date().toISOString().split('T')[0]}.xlsx`
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
                position: positionFilter,
                status: statusFilter,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/employees/export/pdf?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `empleados_${new Date().toISOString().split('T')[0]}.pdf`
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Activo': return 'bg-green-100 text-green-800'
            case 'Vacaciones': return 'bg-blue-100 text-blue-800'
            case 'Baja': return 'bg-red-100 text-red-800'
            case 'Enfermedad': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getInitials = (name?: string) => {
        if (!name) return ''
        try {
            return String(name).split(' ').map((n: string) => n?.[0] || '').join('').toUpperCase()
        } catch {
            return ''
        }
    }

    // compute real stats from employees
    const totalEmployees = filteredEmployees.length
    const activeCount = filteredEmployees.filter(e => e.status === 'ACTIVE' || e.status === 'Activo').length
    const onVacation = filteredEmployees.filter(e => e.status === 'VACACIONES' || e.status === 'Vacaciones').length
    const avgHours = filteredEmployees.length ? Math.round((filteredEmployees.reduce((s, e) => s + (Number(e.hoursThisWeek) || 0), 0) / filteredEmployees.length) * 10) / 10 : 0

    return (
        <Layout
            title="Empleados"
            subtitle="Gestiona el personal de tu empresa de construcción"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div></div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exportar
                    </button>
                    <button
                        onClick={() => openModal('create')}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Nuevo Empleado
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total empleados</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{totalEmployees}</dd>
                            {positionFilter !== 'all' || statusFilter !== 'all' ? (
                                <div className="text-xs text-gray-400">
                                    (filtrado de {Array.isArray(employees) ? employees.length : 0} total)
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
                            <dt className="text-sm font-medium text-gray-500 truncate">Activos</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{activeCount}</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11m-8 0H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-4" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">En vacaciones</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{onVacation}</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Horas promedio</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{avgHours}h</dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Employees Table - Desktop */}
            <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">Equipo de Trabajo</h2>

                        {/* Indicadores de filtros activos */}
                        {(positionFilter !== 'all' || statusFilter !== 'all' || sortField !== 'name') && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Filtros activos:</span>
                                {positionFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Cargo: {positionFilter}
                                        <button
                                            onClick={() => setPositionFilter('all')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                            title="Quitar filtro de cargo"
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
                                            sortField === 'position' ? 'Cargo' :
                                                sortField === 'status' ? 'Estado' :
                                                    sortField === 'hoursThisWeek' ? 'Horas' :
                                                        sortField === 'joinDate' ? 'Fecha' : sortField} {sortDirection === 'asc' ? '↑' : '↓'}
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
                                <label htmlFor="position-filter" className="text-sm font-medium text-gray-700">
                                    Cargo:
                                </label>
                                <select
                                    id="position-filter"
                                    value={positionFilter}
                                    onChange={(e) => setPositionFilter(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Todos</option>
                                    {uniquePositions.map(position => (
                                        <option key={position} value={position}>{position}</option>
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
                                        Empleado
                                        {sortField === 'name' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('position')}
                                >
                                    <div className="flex items-center gap-1">
                                        Cargo
                                        {sortField === 'position' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyecto</th>
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
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('hoursThisWeek')}
                                >
                                    <div className="flex items-center gap-1">
                                        Horas Semana
                                        {sortField === 'hoursThisWeek' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                <th className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedEmployees.map((employee) => (
                                <tr key={employee.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openModal('view', employee)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {getInitials(employee.name)}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                                <div className="text-sm text-gray-500">Desde {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('es-ES') : '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{employee.position}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {Array.isArray(employee.employeeProjects) && employee.employeeProjects.length > 0
                                                ? employee.employeeProjects.map((ep: any) => ep.project?.name || ep.projectId).join(', ')
                                                : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                                            {employee.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{employee.hoursThisWeek}h</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            <div>{employee.phone}</div>
                                            <div className="text-gray-500">{employee.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative inline-block text-left">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDropdownOpen(dropdownOpen === employee.id ? null : employee.id)
                                                }}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>

                                            {dropdownOpen === employee.id && (
                                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openModal('view', employee)
                                                                setDropdownOpen(null)
                                                            }}
                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                        >
                                                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            Ver perfil
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openModal('edit', employee)
                                                                setDropdownOpen(null)
                                                            }}
                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                        >
                                                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openModal('delete', employee)
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

                {/* Información de resumen */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Mostrando {paginatedEmployees.length} de {filteredEmployees.length} empleados
                        {positionFilter !== 'all' && (
                            <span className="ml-2 text-blue-600">
                                (filtrado por cargo: {positionFilter})
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
                                    sortField === 'position' ? 'Cargo' :
                                        sortField === 'status' ? 'Estado' :
                                            sortField === 'hoursThisWeek' ? 'Horas' :
                                                sortField === 'joinDate' ? 'Fecha' : sortField} {sortDirection === 'asc' ? '↑' : '↓'})
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Employees Cards - Mobile */}
            <div className="md:hidden space-y-4">
                <div className="px-4 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Equipo de Trabajo</h2>
                </div>
                {paginatedEmployees.map((employee) => (
                    <div key={employee.id} className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => openModal('view', employee)}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center flex-1">
                                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                                    <span className="text-white font-medium text-lg">
                                        {getInitials(employee.name)}
                                    </span>
                                </div>
                                <div className="ml-4">
                                    <div className="text-lg font-medium text-gray-900">{employee.name}</div>
                                    <div className="text-sm text-gray-500">{employee.position}</div>
                                    <div className="text-sm text-gray-500">Desde {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('es-ES') : '-'}</div>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                                    {employee.status}
                                </span>

                                {/* Menú de tres puntos para móvil */}
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setDropdownOpen(dropdownOpen === `mobile-${employee.id}` ? null : `mobile-${employee.id}`)
                                        }}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                        </svg>
                                    </button>

                                    {dropdownOpen === `mobile-${employee.id}` && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                            <div className="py-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openModal('view', employee)
                                                        setDropdownOpen(null)
                                                    }}
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                >
                                                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Ver perfil
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openModal('edit', employee)
                                                        setDropdownOpen(null)
                                                    }}
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                >
                                                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openModal('delete', employee)
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
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">Proyecto</div>
                                <div className="text-sm text-gray-900">{Array.isArray(employee.employeeProjects) && employee.employeeProjects.length > 0 ? employee.employeeProjects.map((ep: any) => ep.project?.name || ep.projectId).join(', ') : '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Horas Semana</div>
                                <div className="text-sm text-gray-900">{employee.hoursThisWeek}h</div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="text-sm font-medium text-gray-500 mb-2">Contacto</div>
                            <div className="text-sm text-gray-900">{employee.phone}</div>
                            <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Asignaciones</h3>
                    <p className="text-gray-600 mb-4">Asigna empleados a proyectos</p>
                    <button
                        onClick={() => window.location.href = '/assignments'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Gestionar Asignaciones
                    </button>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Nóminas</h3>
                    <p className="text-gray-600 mb-4">Genera y administra nóminas</p>
                    <button
                        onClick={() => window.location.href = '/payrolls'}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Ver Nóminas
                    </button>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluaciones</h3>
                    <p className="text-gray-600 mb-4">Realiza evaluaciones de desempeño</p>
                    <button
                        onClick={() => window.location.href = '/evaluations'}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Gestionar Evaluaciones
                    </button>
                </div>
            </div>

            {/* Pagination Component */}
            <div className="mt-6">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredEmployees.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    onImportExcel={() => setShowImportModal(true)}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />
            </div>

            {/* Modals */}
            <EmployeeFormModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSaveEmployee}
            />

            <EmployeeFormModal
                isOpen={modals.view}
                onClose={() => closeModal('view')}
                employee={selectedEmployee}
                onSave={handleSaveEmployee}
                readOnly={true}
            />

            <EmployeeFormModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                employee={selectedEmployee}
                onSave={handleSaveEmployee}
                readOnly={false}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteEmployee}
                title="Eliminar Empleado"
                message="¿Estás seguro de que quieres eliminar este empleado?"
                itemName={selectedEmployee?.name}
            />

            <AssignmentFormModal
                isOpen={modals.assignment}
                onClose={() => setModals({ ...modals, assignment: false })}
                onSave={handleSaveAssignment}
            />

            <PayrollFormModal
                isOpen={modals.payroll}
                onClose={() => setModals({ ...modals, payroll: false })}
                onSave={handleSavePayroll}
            />

            <EvaluationFormModal
                isOpen={modals.evaluation}
                onClose={() => setModals({ ...modals, evaluation: false })}
                onSave={handleSaveEvaluation}
            />

            {/* Modal de importación */}
            <EmployeeImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleFileImport}
            />
        </Layout>
    )
}

export default function Employees() {
    return (
        <Suspense fallback={
            <Layout title="Empleados" subtitle="Gestiona el personal de tu empresa de construcción">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        }>
            <EmployeesContent />
        </Suspense>
    )
}
