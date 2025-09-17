'use client'

import Layout from '../../components/Layout'
import AssignmentFormModal from '../../components/modals/AssignmentFormModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '@/components/ui/Pagination'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '../../components/ToastProvider'
import { Suspense } from 'react'

export default function Assignments() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <AssignmentsContent />
        </Suspense>
    )
}

function AssignmentsContent() {
    const { data: session } = useSession()
    const toast = useToast()
    const searchParams = useSearchParams()
    const [assignments, setAssignments] = useState<any[]>([])
    const [modals, setModals] = useState({ create: false, edit: false, delete: false })
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

    // Estados para filtrado y ordenamiento
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('startDate')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        const load = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                const res = await fetch(`/api/assignments?organizationId=${organizationId}`)
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Failed to load assignments'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const data = await res.json()
                setAssignments(data)
            } catch (err: any) {
                console.error(err)
                toast.error(err.message || 'No se pudieron cargar las asignaciones')
            }
        }
        load()
    }, [])

    // Detectar query param modal=create y abrir modal
    useEffect(() => {
        const modal = searchParams.get('modal')
        if (modal === 'create') {
            setModals(prev => ({ ...prev, create: true }))
        }
    }, [searchParams])

    // Lógica de filtrado y ordenamiento (sin paginación para estadísticas)
    const filteredAssignments = useMemo(() => {
        let filtered = assignments

        // Aplicar filtro de estado
        if (statusFilter !== 'all') {
            filtered = filtered.filter(assignment => assignment.status === statusFilter)
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            // Manejar casos especiales
            if (sortField === 'startDate' || sortField === 'endDate') {
                aValue = new Date(aValue || 0).getTime()
                bValue = new Date(bValue || 0).getTime()
            } else if (sortField === 'hoursPerWeek') {
                aValue = aValue || 0
                bValue = bValue || 0
            } else if (sortField === 'employeeName') {
                aValue = (aValue || '').toString().toLowerCase()
                bValue = (bValue || '').toString().toLowerCase()
            } else if (sortField === 'projectName') {
                aValue = (aValue || '').toString().toLowerCase()
                bValue = (bValue || '').toString().toLowerCase()
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [assignments, statusFilter, sortField, sortDirection])

    // Datos paginados para mostrar en la tabla
    const paginatedAssignments = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredAssignments.slice(startIndex, endIndex)
    }, [filteredAssignments, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage)

    // Obtener estados únicos para el filtro
    const uniqueStatuses = useMemo(() => {
        const statuses = assignments.map(a => a.status).filter(Boolean)
        return Array.from(new Set(statuses)).sort()
    }, [assignments])

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

    const openModal = (modalType: keyof typeof modals, assignment?: any) => {
        // if editing fetch fresh assignment by id to ensure org scoping
        if (modalType === 'edit' && assignment?.id) {
            ; (async () => {
                try {
                    const organizationId = (session as any)?.user?.organizationId
                    const res = await fetch(`/api/assignments?id=${assignment.id}&organizationId=${organizationId}`)
                    if (!res.ok) throw new Error('Failed to fetch assignment')
                    const data = await res.json()
                    setSelectedAssignment(data)
                    setModals({ ...modals, [modalType]: true })
                } catch (err) {
                    console.error(err)
                    toast.error('No se pudo cargar la asignación')
                }
            })()
            return
        }

        setSelectedAssignment(assignment)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedAssignment(null)
    }

    const handleSaveAssignment = async (assignmentData: any) => {
        try {
            if (selectedAssignment && selectedAssignment.id) {
                console.log('Updating assignment with ID:', selectedAssignment.id)
                const res = await fetch(`/api/assignments/${selectedAssignment.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(assignmentData)
                })
                const updated = await res.json()
                setAssignments(assignments.map(a => a.id === selectedAssignment.id ? updated : a))
                toast.success('Asignación actualizada')
            } else {
                console.log('Creating new assignment')
                const res = await fetch('/api/assignments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(assignmentData)
                })
                const created = await res.json()
                setAssignments([created, ...assignments])
                toast.success('Asignación creada')
            }
            closeModal('create')
            closeModal('edit')
        } catch (err) {
            console.error('Save assignment error', err)
            toast.error('Error al guardar la asignación')
        }
    }

    const handleDeleteAssignment = async () => {
        try {
            if (!selectedAssignment || !selectedAssignment.id) {
                console.error('No assignment selected for deletion')
                return
            }
            console.log('Deleting assignment with ID:', selectedAssignment.id)
            await fetch(`/api/assignments/${selectedAssignment.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            setAssignments(assignments.filter(a => a.id !== selectedAssignment.id))
            toast.success('Asignación eliminada')
            closeModal('delete')
        } catch (err) {
            console.error('Delete assignment error', err)
            toast.error('Error al eliminar la asignación')
        }
    }

    // Export assignments to CSV (Excel-compatible)
    const handleExportExcel = () => {
        try {
            const rows = filteredAssignments.map(a => ({
                Empleado: a.employeeName || '',
                Puesto: a.employeePosition || '',
                Proyecto: a.projectName || '',
                Rol: a.role || '',
                Inicio: a.startDate ? new Date(a.startDate).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : '',
                Fin: a.endDate ? new Date(a.endDate).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : '',
                HorasPorSemana: a.hoursPerWeek || '',
                Estado: a.status || ''
            }))

            if (rows.length === 0) {
                alert('No hay asignaciones para exportar')
                return
            }

            const headers = Object.keys(rows[0])
            const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${(r as any)[h]?.toString().replace(/"/g, '""') || ''}"`).join(','))).join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `asignaciones_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Error exporting assignments to Excel', err)
            alert('Error al exportar asignaciones')
        }
    }

    const handleExportPDF = () => {
        try {
            if (filteredAssignments.length === 0) {
                alert('No hay asignaciones para exportar')
                return
            }

            const html = `
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Asignaciones</title>
                    <style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style>
                </head>
                <body>
                    <h2>Asignaciones</h2>
                    <table>
                        <thead><tr>${['Empleado', 'Proyecto', 'Rol', 'Inicio', 'Fin', 'HorasPorSemana', 'Estado'].map(h => `<th>${h}</th>`).join('')}</tr></thead>
                        <tbody>
                        ${filteredAssignments.map(a => `<tr>
                            <td>${a.employeeName || ''}</td>
                            <td>${a.projectName || ''}</td>
                            <td>${a.role || ''}</td>
                            <td>${a.startDate ? new Date(a.startDate).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : ''}</td>
                            <td>${a.endDate ? new Date(a.endDate).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : ''}</td>
                            <td>${a.hoursPerWeek || ''}</td>
                            <td>${a.status || ''}</td>
                        </tr>`).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `

            const w = window.open('', '_blank')
            if (!w) {
                alert('El navegador bloqueó la apertura de nueva ventana. Permite popups para exportar PDF.')
                return
            }
            w.document.open()
            w.document.write(html)
            w.document.close()
            w.print()
        } catch (err) {
            console.error('Error exporting assignments to PDF', err)
            alert('Error al exportar asignaciones a PDF')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Activo': return 'bg-green-100 text-green-800'
            case 'Inactivo': return 'bg-gray-100 text-gray-800'
            case 'Completado': return 'bg-blue-100 text-blue-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Activo':
                return (
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            case 'Inactivo':
                return (
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            case 'Completado':
                return (
                    <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                )
            default:
                return (
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
        }
    }

    return (
        <Layout
            title="Asignaciones"
            subtitle="Gestiona las asignaciones de empleados a proyectos"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div></div>
                <button
                    onClick={() => openModal('create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Nueva Asignación
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total asignaciones</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{filteredAssignments.length}</dd>
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
                            <dt className="text-sm font-medium text-gray-500 truncate">Activas</dt>
                            <dd className="text-2xl font-semibold text-gray-900">
                                {filteredAssignments.filter((a: any) => a.status === 'Activo').length}
                            </dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Completadas</dt>
                            <dd className="text-2xl font-semibold text-gray-900">
                                {filteredAssignments.filter((a: any) => a.status === 'Completado').length}
                            </dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Estado:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos</option>
                            {uniqueStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    {/* Active Filters Display */}
                    <div className="flex flex-wrap gap-2">
                        {statusFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Estado: {statusFilter}
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
                        Mostrando {paginatedAssignments.length} de {filteredAssignments.length} asignaciones
                    </div>
                </div>
            </div>

            {/* Assignments Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Asignaciones de Empleados</h2>
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
                                        onClick={() => handleSort('projectName')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Proyecto
                                        {sortField === 'projectName' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rol
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('startDate')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Período
                                        {sortField === 'startDate' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('hoursPerWeek')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Horas/Semana
                                        {sortField === 'hoursPerWeek' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('status')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Estado
                                        {sortField === 'status' && (
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
                            {paginatedAssignments.map((assignment: any) => (
                                <tr key={assignment.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openModal('edit', assignment)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {(assignment.employeeName || '').split(' ').map((n: string) => n[0] || '').join('').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{assignment.employeeName}</div>
                                                <div className="text-sm text-gray-500">{assignment.employeePosition}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{assignment.projectName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{assignment.role}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            <div>{new Date(assignment.startDate).toLocaleDateString('es-ES')}</div>
                                            {assignment.endDate && (
                                                <div className="text-gray-500">al {new Date(assignment.endDate).toLocaleDateString('es-ES')}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{assignment.hoursPerWeek}h</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                                            {getStatusIcon(assignment.status)}
                                            <span className="ml-1">{assignment.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative inline-block text-left">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDropdownOpen(dropdownOpen === assignment.id ? null : assignment.id)
                                                }}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>

                                            {dropdownOpen === assignment.id && (
                                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openModal('edit', assignment)
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
                                                                openModal('delete', assignment)
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
                    totalItems={filteredAssignments.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />
            </div>

            {/* Modals */}
            <AssignmentFormModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSaveAssignment}
            />

            <AssignmentFormModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                assignment={selectedAssignment}
                onSave={handleSaveAssignment}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteAssignment}
                title="Eliminar Asignación"
                message="¿Estás seguro de que quieres eliminar esta asignación?"
                itemName={`${selectedAssignment?.employeeName} - ${selectedAssignment?.projectName}`}
            />
        </Layout>
    )
}