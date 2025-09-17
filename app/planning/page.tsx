'use client'

import Layout from '../../components/Layout'
import TaskFormModal from '../../components/modals/TaskFormModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import PlanningImportModal from '../../components/modals/PlanningImportModal'
import Pagination from '@/components/ui/Pagination'
import React, { useState, useEffect, useMemo } from 'react'
import KanbanBoard from '../../components/KanbanBoard'
import { useSession } from 'next-auth/react'
import { useToast } from '../../components/ToastProvider'
import { useRouter } from 'next/navigation'

export default function Planning() {
    const { data: session } = useSession()
    const toast = useToast()
    const router = useRouter()
    const [tasks, setTasks] = useState<any[]>([])
    const [modals, setModals] = useState({ create: false, edit: false, delete: false })
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban')

    // Filter and sort states
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [projectFilter, setProjectFilter] = useState<string>('all')
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
    const [dateFromFilter, setDateFromFilter] = useState<string>('')
    const [dateToFilter, setDateToFilter] = useState<string>('')
    const [clientFilter, setClientFilter] = useState<string>('all')
    const [providerFilter, setProviderFilter] = useState<string>('all')
    const [rubroFilter, setRubroFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('startDate')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        async function load() {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const res = await fetch(`/api/planning?organizationId=${organizationId}`)
                const json = await res.json()
                setTasks(json || [])
            } catch (err) {
                console.error('Load planning error', err)
                toast.error('No se pudieron cargar las tareas')
            }
        }
        load()
    }, [session])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            if (!target.closest('.dropdown-container')) {
                setDropdownOpen(null)
            }
            if (!target.closest('.advanced-filters-container')) {
                setShowAdvancedFilters(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    // Filtered and sorted tasks (sin paginación para estadísticas)
    const filteredTasks = useMemo(() => {
        let filtered = tasks

        // Apply filters
        if (statusFilter !== 'all') {
            filtered = filtered.filter(task => task.status === statusFilter)
        }
        if (projectFilter !== 'all') {
            filtered = filtered.filter(task => task.project === projectFilter)
        }
        if (assigneeFilter !== 'all') {
            filtered = filtered.filter(task => task.assignee === assigneeFilter)
        }
        if (dateFromFilter) {
            const fromDate = new Date(dateFromFilter)
            filtered = filtered.filter(task => {
                if (!task.startDate) return false
                return new Date(task.startDate) >= fromDate
            })
        }
        if (dateToFilter) {
            const toDate = new Date(dateToFilter)
            toDate.setHours(23, 59, 59, 999) // Include the entire day
            filtered = filtered.filter(task => {
                if (!task.startDate) return false
                return new Date(task.startDate) <= toDate
            })
        }
        if (clientFilter !== 'all') {
            filtered = filtered.filter(task => task.client === clientFilter)
        }
        if (providerFilter !== 'all') {
            filtered = filtered.filter(task => task.provider === providerFilter)
        }
        if (rubroFilter !== 'all') {
            filtered = filtered.filter(task => task.rubro === rubroFilter)
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortField) {
                case 'title':
                    aValue = a.title || ''
                    bValue = b.title || ''
                    break
                case 'project':
                    aValue = a.project || ''
                    bValue = b.project || ''
                    break
                case 'startDate':
                    aValue = a.startDate ? new Date(a.startDate).getTime() : 0
                    bValue = b.startDate ? new Date(b.startDate).getTime() : 0
                    break
                case 'endDate':
                    aValue = a.endDate ? new Date(a.endDate).getTime() : 0
                    bValue = b.endDate ? new Date(b.endDate).getTime() : 0
                    break
                case 'progress':
                    aValue = a.progress || 0
                    bValue = b.progress || 0
                    break
                case 'assignee':
                    aValue = a.assignee || ''
                    bValue = b.assignee || ''
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [tasks, statusFilter, projectFilter, assigneeFilter, dateFromFilter, dateToFilter, clientFilter, providerFilter, rubroFilter, sortField, sortDirection])

    // Datos paginados para mostrar
    const paginatedTasks = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredTasks.slice(startIndex, endIndex)
    }, [filteredTasks, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, projectFilter, assigneeFilter, dateFromFilter, dateToFilter, clientFilter, providerFilter, rubroFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)

    // Get unique values for filters
    const uniqueStatuses = useMemo(() => {
        const statuses = Array.from(new Set(tasks.map(task => task.status).filter(Boolean)))
        return statuses
    }, [tasks])

    const uniqueProjects = useMemo(() => {
        const projects = Array.from(new Set(tasks.map(task => task.project).filter(Boolean)))
        return projects
    }, [tasks])

    const uniqueAssignees = useMemo(() => {
        const assignees = Array.from(new Set(tasks.map(task => task.assignee).filter(Boolean)))
        return assignees
    }, [tasks])

    const uniqueClients = useMemo(() => {
        const clients = Array.from(new Set(tasks.map(task => task.client).filter(Boolean)))
        return clients
    }, [tasks])

    const uniqueProviders = useMemo(() => {
        const providers = Array.from(new Set(tasks.map(task => task.provider).filter(Boolean)))
        return providers
    }, [tasks])

    const uniqueRubros = useMemo(() => {
        const rubros = Array.from(new Set(tasks.map(task => task.rubro).filter(Boolean)))
        return rubros
    }, [tasks])

    const openModal = async (modalType: keyof typeof modals, task?: any) => {
        if (modalType === 'edit' && task?.id) {
            try {
                const res = await fetch(`/api/planning/${task.id}`)
                const json = await res.json()
                if (!res.ok) throw new Error(json?.error || 'Error fetching task')
                setSelectedTask(json)
                setModals({ ...modals, edit: true })
                return
            } catch (err) {
                console.error('Error loading task for edit', err)
                toast.error('No se pudo cargar la tarea para editar')
                return
            }
        }

        setSelectedTask(task)
        setModals({ ...modals, [modalType]: true })
    }

    // Kanban handlers
    const handleStatusChange = async (taskId: string, newStatus: string, opts?: { progress?: number }) => {
        try {
            const payload: any = { status: newStatus }
            if (opts?.progress !== undefined) payload.progress = opts.progress
            const res = await fetch(`/api/planning/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const updated = await res.json()
            if (!res.ok) throw new Error(updated?.error || 'Error updating status')
            setTasks(prev => prev.map(t => t.id === taskId ? updated : t))
            toast.success('Estado actualizado')
        } catch (err) {
            console.error('Status change error', err)
            toast.error('No se pudo actualizar el estado')
        }
    }

    const handleEditFromKanban = (task?: any) => {
        openModal('edit', task)
    }

    const openDeleteModal = (task: any) => {
        setSelectedTask(task)
        setModals({ ...modals, delete: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedTask(null)
    }

    const handleSaveTask = async (taskData: any) => {
        try {
            if (selectedTask) {
                // Update existing task - don't include organizationId or createdById
                const res = await fetch(`/api/planning/${selectedTask.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(taskData),
                    headers: { 'Content-Type': 'application/json' }
                })
                const updated = await res.json()
                if (!res.ok) throw new Error(updated?.error || 'Error updating task')
                setTasks(tasks.map(t => t.id === selectedTask.id ? updated : t))
                toast.success('Tarea actualizada')
            } else {
                // Create new task - include organizationId and createdById
                const organizationId = (session as any)?.user?.organizationId
                const createdById = (session as any)?.user?.id
                const payload = { ...taskData, organizationId, createdById }
                const res = await fetch('/api/planning', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'application/json' }
                })
                const created = await res.json()
                if (!res.ok) throw new Error(created?.error || 'Error creating task')
                setTasks([created, ...tasks])
                toast.success('Tarea creada')
            }
            closeModal('create')
            closeModal('edit')
        } catch (err) {
            console.error('Save task error', err)
            toast.error('Error al guardar la tarea')
        }
    }

    const handleDeleteTask = async () => {
        try {
            if (!selectedTask) return
            await fetch(`/api/planning/${selectedTask.id}`, { method: 'DELETE' })
            setTasks(tasks.filter(task => task.id !== selectedTask.id))
            toast.success('Tarea eliminada')
            closeModal('delete')
        } catch (err) {
            console.error('Delete task error', err)
            toast.error('Error al eliminar la tarea')
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
                const res = await fetch(`/api/planning?organizationId=${organizationId}`)
                const json = await res.json()
                setTasks(json || [])
                toast.success('Datos importados exitosamente')
            } catch (err) {
                console.error('Reload planning error', err)
                toast.error('Error al recargar los datos')
            }
        }
        reload()
    }

    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (projectFilter !== 'all') params.append('projectId', projectFilter)
            if (assigneeFilter !== 'all') params.append('assigneeId', assigneeFilter)
            params.append('sortField', sortField)
            params.append('sortDirection', sortDirection)

            const response = await fetch(`/api/planning/export/excel?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `tareas_planning_${new Date().toISOString().split('T')[0]}.xlsx`
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
            if (projectFilter !== 'all') params.append('projectId', projectFilter)
            if (assigneeFilter !== 'all') params.append('assigneeId', assigneeFilter)
            params.append('sortField', sortField)
            params.append('sortDirection', sortDirection)

            const response = await fetch(`/api/planning/export/pdf?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `tareas_planning_reporte_${new Date().toISOString().split('T')[0]}.pdf`
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
            case 'completed': return 'bg-green-100 text-green-800'
            case 'in-progress': return 'bg-blue-100 text-blue-800'
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <Layout
            title="Planificación de Proyectos"
            subtitle="Gestiona tus tareas y cronogramas de obra"
        >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                    {/* Botón de filtros avanzados */}
                    <div className="relative advanced-filters-container">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowAdvancedFilters(!showAdvancedFilters)
                            }}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                            </svg>
                            <span>Filtros</span>
                            <svg className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown de filtros avanzados */}
                        {showAdvancedFilters && (
                            <div
                                className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 advanced-filters-container"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {/* Primera fila: Estado, Proyecto, Asignado */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">Todos los estados</option>
                                                {uniqueStatuses.map(status => (
                                                    <option key={status} value={status}>
                                                        {status === 'completed' ? 'Completada' : status === 'in-progress' ? 'En Progreso' : 'Pendiente'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
                                            <select
                                                value={projectFilter}
                                                onChange={(e) => setProjectFilter(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">Todos los proyectos</option>
                                                {uniqueProjects.map(project => (
                                                    <option key={project} value={project}>{project}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Asignado</label>
                                            <select
                                                value={assigneeFilter}
                                                onChange={(e) => setAssigneeFilter(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">Todos los asignados</option>
                                                {uniqueAssignees.map(assignee => (
                                                    <option key={assignee} value={assignee}>{assignee}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Segunda fila: Cliente, Proveedor, Rubro */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                            <select
                                                value={clientFilter}
                                                onChange={(e) => setClientFilter(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">Todos los clientes</option>
                                                {uniqueClients.map(client => (
                                                    <option key={client} value={client}>{client}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                            <select
                                                value={providerFilter}
                                                onChange={(e) => setProviderFilter(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">Todos los proveedores</option>
                                                {uniqueProviders.map(provider => (
                                                    <option key={provider} value={provider}>{provider}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
                                            <select
                                                value={rubroFilter}
                                                onChange={(e) => setRubroFilter(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">Todos los rubros</option>
                                                {uniqueRubros.map(rubro => (
                                                    <option key={rubro} value={rubro}>{rubro}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Tercera fila: Fechas */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
                                            <input
                                                type="date"
                                                value={dateFromFilter}
                                                onChange={(e) => setDateFromFilter(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
                                            <input
                                                type="date"
                                                value={dateToFilter}
                                                onChange={(e) => setDateToFilter(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <button onClick={() => router.push('/planning/calendar')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Vista Calendario</span>
                    </button>
                    <button onClick={() => setViewMode(viewMode === 'table' ? 'kanban' : 'table')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap flex items-center gap-2">
                        {viewMode === 'table' ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span>Vista Kanban</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Vista Tabla</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => openModal('create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Nueva Tarea</span>
                    </button>
                </div>
            </div>

            {/* Chips de filtros activos */}
            {(statusFilter !== 'all' || projectFilter !== 'all' || assigneeFilter !== 'all' || dateFromFilter || dateToFilter || clientFilter !== 'all' || providerFilter !== 'all' || rubroFilter !== 'all') && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-medium text-gray-700 mr-2">Filtros activos:</span>

                        {statusFilter !== 'all' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Estado: {statusFilter === 'completed' ? 'Completada' : statusFilter === 'in-progress' ? 'En Progreso' : 'Pendiente'}
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {projectFilter !== 'all' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Proyecto: {projectFilter}
                                <button
                                    onClick={() => setProjectFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {assigneeFilter !== 'all' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Asignado: {assigneeFilter}
                                <button
                                    onClick={() => setAssigneeFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {clientFilter !== 'all' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Cliente: {clientFilter}
                                <button
                                    onClick={() => setClientFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-yellow-400 hover:bg-yellow-200 hover:text-yellow-500"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {providerFilter !== 'all' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                Proveedor: {providerFilter}
                                <button
                                    onClick={() => setProviderFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {rubroFilter !== 'all' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                Rubro: {rubroFilter}
                                <button
                                    onClick={() => setRubroFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-pink-400 hover:bg-pink-200 hover:text-pink-500"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {(dateFromFilter || dateToFilter) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Fechas: {dateFromFilter ? new Date(dateFromFilter).toLocaleDateString('es-ES') : '...'} - {dateToFilter ? new Date(dateToFilter).toLocaleDateString('es-ES') : '...'}
                                <button
                                    onClick={() => {
                                        setDateFromFilter('')
                                        setDateToFilter('')
                                    }}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-500"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        <button
                            onClick={() => {
                                setStatusFilter('all')
                                setProjectFilter('all')
                                setAssigneeFilter('all')
                                setDateFromFilter('')
                                setDateToFilter('')
                                setClientFilter('all')
                                setProviderFilter('all')
                                setRubroFilter('all')
                            }}
                            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 ml-2"
                        >
                            Limpiar todo
                        </button>
                    </div>
                </div>
            )}

            {/* Tasks List */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Cronograma de Tareas</h2>
                </div>
                <div className="p-4">
                    {viewMode === 'kanban' ? (
                        // Lazy load Kanban component
                        <React.Suspense fallback={<div>Cargando Kanban...</div>}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {/* Dynamically import to keep bundle small */}
                            <KanbanBoard tasks={filteredTasks} onStatusChange={handleStatusChange} onEdit={handleEditFromKanban} onCreate={() => openModal('create')} />
                        </React.Suspense>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => {
                                                    if (sortField === 'title') {
                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                    } else {
                                                        setSortField('title')
                                                        setSortDirection('asc')
                                                    }
                                                }}
                                                className="flex items-center hover:text-gray-700"
                                            >
                                                Tarea
                                                {sortField === 'title' && (
                                                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => {
                                                    if (sortField === 'project') {
                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                    } else {
                                                        setSortField('project')
                                                        setSortDirection('asc')
                                                    }
                                                }}
                                                className="flex items-center hover:text-gray-700"
                                            >
                                                Proyecto
                                                {sortField === 'project' && (
                                                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rubro
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => {
                                                    if (sortField === 'startDate') {
                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                    } else {
                                                        setSortField('startDate')
                                                        setSortDirection('asc')
                                                    }
                                                }}
                                                className="flex items-center hover:text-gray-700"
                                            >
                                                Fechas
                                                {sortField === 'startDate' && (
                                                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => {
                                                    if (sortField === 'progress') {
                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                    } else {
                                                        setSortField('progress')
                                                        setSortDirection('desc')
                                                    }
                                                }}
                                                className="flex items-center hover:text-gray-700"
                                            >
                                                Progreso
                                                {sortField === 'progress' && (
                                                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => {
                                                    if (sortField === 'assignee') {
                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                    } else {
                                                        setSortField('assignee')
                                                        setSortDirection('asc')
                                                    }
                                                }}
                                                className="flex items-center hover:text-gray-700"
                                            >
                                                Asignado
                                                {sortField === 'assignee' && (
                                                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Enlaces Externos
                                        </th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Acciones</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedTasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{task.project}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{task.rubro || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {task.startDate && task.endDate ? (
                                                        <div>
                                                            <div>Inicio: {new Date(task.startDate).toLocaleDateString('es-ES')}</div>
                                                            <div>Fin: {new Date(task.endDate).toLocaleDateString('es-ES')}</div>
                                                        </div>
                                                    ) : task.startDate ? (
                                                        <div>Inicio: {new Date(task.startDate).toLocaleDateString('es-ES')}</div>
                                                    ) : task.endDate ? (
                                                        <div>Fin: {new Date(task.endDate).toLocaleDateString('es-ES')}</div>
                                                    ) : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${task.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-gray-900">{task.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                                    {task.status === 'completed' ? 'Completada' :
                                                        task.status === 'in-progress' ? 'En Progreso' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{task.assignee}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {task.externalLinks && task.externalLinks.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {task.externalLinks.slice(0, 2).map((link: string, index: number) => (
                                                                <a
                                                                    key={index}
                                                                    href={link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 underline text-xs truncate max-w-24"
                                                                    title={link}
                                                                >
                                                                    Link {index + 1}
                                                                </a>
                                                            ))}
                                                            {task.externalLinks.length > 2 && (
                                                                <span className="text-gray-500 text-xs">+{task.externalLinks.length - 2}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="relative dropdown-container">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setDropdownOpen(dropdownOpen === task.id ? null : task.id)
                                                        }}
                                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                        </svg>
                                                    </button>
                                                    {dropdownOpen === task.id && (
                                                        <div
                                                            className="absolute right-0 top-10 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-48"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    openModal('edit', task)
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
                                                                    openDeleteModal(task)
                                                                    setDropdownOpen(null)
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
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
                    )}
                </div>
            </div>

            {/* Pagination */}
            {filteredTasks.length > 0 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredTasks.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                        onImportExcel={handleImportExcel}
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                    />
                </div>
            )}

            {/* Summary */}
            <div className="mt-4 text-sm text-gray-600 text-center">
                Mostrando {paginatedTasks.length} de {filteredTasks.length} tareas
            </div>

            {/* Modals */}
            <TaskFormModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSaveTask}
                task={null}
            />

            <TaskFormModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                onSave={handleSaveTask}
                task={selectedTask}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteTask}
                title="Eliminar Tarea"
                message={`¿Estás seguro de que quieres eliminar la tarea "${selectedTask?.title}"? Esta acción no se puede deshacer.`}
            />

            <PlanningImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportSuccess={handleImportSuccess}
            />
        </Layout>
    )
}
