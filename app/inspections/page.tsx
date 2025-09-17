'use client'

import Layout from '../../components/Layout'
import InspectionModal from '../../components/modals/InspectionModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import ReportModal from '../../components/modals/ReportModal'
import TemplateModal from '../../components/modals/TemplateModal'
import Pagination from '@/components/ui/Pagination'
import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '../../components/ToastProvider'
import { Suspense } from 'react'

function InspectionsContent() {
    const [inspections, setInspections] = useState<any[]>([])
    const toast = useToast()
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false,
        start: false,
        report: false,
        templates: false,
        view: false
    })

    const [selectedInspection, setSelectedInspection] = useState<any>(null)

    // Estados para filtrado y ordenamiento
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('scheduledDate')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const [templates, setTemplates] = useState([
        {
            id: 1,
            name: 'Inspección Estructural Básica',
            type: 'Estructural',
            description: 'Plantilla para inspecciones de cimentación y estructura',
            checklist: [
                'Verificación de cimientos',
                'Análisis de vigas y columnas',
                'Control de calidad del hormigón',
                'Mediciones de tolerancias'
            ],
            estimatedDuration: 120
        },
        {
            id: 2,
            name: 'Inspección Eléctrica Completa',
            type: 'Instalaciones',
            description: 'Plantilla completa para inspecciones eléctricas',
            checklist: [
                'Verificación de tierra',
                'Control de tensiones',
                'Pruebas de continuidad',
                'Certificación de instalaciones'
            ],
            estimatedDuration: 90
        }
    ])

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
                const res = await fetch(`/api/inspections?organizationId=${organizationId}`)
                if (!res.ok) throw new Error('Failed to load inspections')
                const data = await res.json()
                setInspections(data)
            } catch (err: any) {
                console.error(err)
                toast.error(err.message || 'No se pudieron cargar las inspecciones')
            }
        }
        load()
    }, [session])

    // Check for modal parameter in URL
    useEffect(() => {
        const modalParam = searchParams.get('modal')
        if (modalParam === 'create') {
            openModal('create')
        }
    }, [searchParams])

    // Lógica de filtrado y ordenamiento (sin paginación para estadísticas)
    const filteredInspections = useMemo(() => {
        let filtered = inspections

        // Aplicar filtro de estado
        if (statusFilter !== 'all') {
            filtered = filtered.filter(inspection => inspection.status === statusFilter)
        }

        // Aplicar filtro de tipo
        if (typeFilter !== 'all') {
            filtered = filtered.filter(inspection => inspection.type === typeFilter)
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            // Manejar casos especiales
            if (sortField === 'scheduledDate') {
                aValue = new Date(aValue || 0).getTime()
                bValue = new Date(bValue || 0).getTime()
            } else if (sortField === 'title') {
                aValue = (aValue || '').toString().toLowerCase()
                bValue = (bValue || '').toString().toLowerCase()
            } else if (sortField === 'project') {
                aValue = a.project?.name || ''
                bValue = b.project?.name || ''
            } else if (sortField === 'inspector') {
                aValue = (aValue || '').toString().toLowerCase()
                bValue = (bValue || '').toString().toLowerCase()
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [inspections, statusFilter, typeFilter, sortField, sortDirection])

    // Datos paginados para mostrar en la tabla
    const paginatedInspections = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredInspections.slice(startIndex, endIndex)
    }, [filteredInspections, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, typeFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredInspections.length / itemsPerPage)

    // Obtener estados únicos para el filtro
    const uniqueStatuses = useMemo(() => {
        const statuses = inspections.map(i => i.status).filter(Boolean)
        return Array.from(new Set(statuses)).sort()
    }, [inspections])

    // Obtener tipos únicos para el filtro
    const uniqueTypes = useMemo(() => {
        const types = inspections.map(i => i.type).filter(Boolean)
        return Array.from(new Set(types)).sort()
    }, [inspections])

    // Función para cambiar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    // Calcular estadísticas reales basadas en los datos filtrados
    const stats = {
        total: filteredInspections.length,
        completed: filteredInspections.filter((i: any) => i.status === 'COMPLETED').length,
        pending: filteredInspections.filter((i: any) => i.status === 'PENDING' || i.status === 'SCHEDULED').length,
        inProgress: filteredInspections.filter((i: any) => i.status === 'IN_PROGRESS').length,
        withIncidents: filteredInspections.filter((i: any) => i.findings && i.findings.length > 0).length
    }

    const openModal = async (modalType: keyof typeof modals, inspection?: any) => {
        // For edit/view we fetch fresh data to ensure organization-scoped data
        if ((modalType === 'edit' || modalType === 'view') && inspection?.id) {
            try {
                const res = await fetch(`/api/inspections/${inspection.id}`)
                if (!res.ok) throw new Error('Failed to fetch inspection')
                const data = await res.json()
                setSelectedInspection(data)
                setModals({ ...modals, [modalType]: true })
                return
            } catch (err) {
                console.error(err)
                toast.error('No se pudo cargar la inspección')
                return
            }
        }

        setSelectedInspection(inspection)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedInspection(null)
    }

    const openDeleteModal = (inspection: any) => {
        setSelectedInspection(inspection)
        setModals({ ...modals, delete: true })
    }

    const handleSaveInspection = async (inspectionData: any) => {
        try {
            const userId = session?.user?.id as string | undefined
            const organizationId = (session as any)?.user?.organizationId as string | undefined

            if (selectedInspection?.id) {
                const res = await fetch(`/api/inspections/${selectedInspection.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(inspectionData)
                })
                if (!res.ok) throw new Error('Error updating inspection')
                const updated = await res.json()
                setInspections(inspections.map(i => i.id === updated.id ? updated : i))
            } else {
                const payload = { ...inspectionData, createdById: userId, organizationId }
                const res = await fetch('/api/inspections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                if (!res.ok) throw new Error('Error creating inspection')
                const created = await res.json()
                setInspections([created, ...inspections])
            }

            closeModal('create')
            closeModal('edit')
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || 'Error al guardar inspección')
        }
    }

    const handleDeleteInspection = async () => {
        if (!selectedInspection?.id) return
        try {
            const res = await fetch(`/api/inspections/${selectedInspection.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Error deleting')
            setInspections(inspections.filter(inspection => inspection.id !== selectedInspection.id))
            closeModal('delete')
            toast.success('Inspección eliminada')
        } catch (err: any) {
            console.error(err)
            toast.error('No se pudo eliminar la inspección')
        }
    }

    const handleStartInspection = (inspection: any) => {
        ; (async () => {
            try {
                const updatedInspection = {
                    ...inspection,
                    status: 'IN_PROGRESS',
                    startDate: new Date().toISOString().split('T')[0]
                }
                const res = await fetch(`/api/inspections/${inspection.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedInspection)
                })
                if (!res.ok) throw new Error('Error updating inspection status')
                const updated = await res.json()
                setInspections(inspections.map(i => i.id === inspection.id ? updated : i))
                toast.success('Inspección iniciada')
            } catch (err: any) {
                console.error(err)
                toast.error('No se pudo iniciar la inspección')
            }
        })()
    }

    const handleCompleteInspection = (inspection: any) => {
        ; (async () => {
            try {
                const updatedInspection = {
                    ...inspection,
                    status: 'COMPLETED',
                    completedDate: new Date().toISOString().split('T')[0]
                }
                const res = await fetch(`/api/inspections/${inspection.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedInspection)
                })
                if (!res.ok) throw new Error('Error updating inspection status')
                const updated = await res.json()
                setInspections(inspections.map(i => i.id === inspection.id ? updated : i))
                toast.success('Inspección completada')
            } catch (err: any) {
                console.error(err)
                toast.error('No se pudo completar la inspección')
            }
        })()
    }

    const handleSaveTemplate = (templateData: any) => {
        if (templateData.id) {
            // Edit existing template
            setTemplates(templates.map(template => template.id === templateData.id ? templateData : template))
        } else {
            // Create new template
            setTemplates([...templates, { ...templateData, id: Date.now() }])
        }
    }

    const handleGenerateReport = () => {
        // Generate report logic with real data
        const reportData = {
            totalInspections: stats.total,
            completedInspections: stats.completed,
            pendingInspections: stats.pending,
            inProgressInspections: stats.inProgress,
            withIncidents: stats.withIncidents,
            inspectionsByType: inspections.reduce((acc: Record<string, number>, inspection) => {
                const typeLabel = getTypeLabel(inspection.type)
                acc[typeLabel] = (acc[typeLabel] || 0) + 1
                return acc
            }, {}),
            inspectionsByPriority: inspections.reduce((acc: Record<string, number>, inspection) => {
                const priorityLabel = getPriorityLabel(inspection.priority)
                acc[priorityLabel] = (acc[priorityLabel] || 0) + 1
                return acc
            }, {}),
            inspectionsByStatus: inspections.reduce((acc: Record<string, number>, inspection) => {
                const statusLabel = getStatusLabel(inspection.status)
                acc[statusLabel] = (acc[statusLabel] || 0) + 1
                return acc
            }, {}),
            generatedAt: new Date().toISOString()
        }

        // In a real app, this would generate a PDF or send to server
        console.log('Report generated:', reportData)
        toast.success('Reporte generado exitosamente')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800'
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
            case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800'
            case 'PENDING': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'Completada'
            case 'IN_PROGRESS': return 'En Progreso'
            case 'SCHEDULED': return 'Programada'
            case 'PENDING': return 'Pendiente'
            default: return 'Pendiente'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-100 text-red-800'
            case 'HIGH': return 'bg-orange-100 text-orange-800'
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
            case 'LOW': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'Crítica'
            case 'HIGH': return 'Alta'
            case 'MEDIUM': return 'Media'
            case 'LOW': return 'Baja'
            default: return 'Media'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'PROGRESS': return '🏗️'
            case 'MAINTENANCE': return '⚡'
            case 'FINAL': return '✅'
            case 'SAFETY': return '🛡️'
            case 'QUALITY': return '🔍'
            default: return '🔍'
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'PROGRESS': return 'Estructural'
            case 'MAINTENANCE': return 'Instalaciones'
            case 'FINAL': return 'Final'
            case 'SAFETY': return 'Seguridad'
            case 'QUALITY': return 'Calidad'
            default: return type
        }
    }

    return (
        <Layout
            title="Inspecciones"
            subtitle="Planifica y gestiona todas tus inspecciones de obra"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div></div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        Plantilla
                    </button>
                    <button
                        onClick={() => openModal('create')}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Nueva Inspección
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total inspecciones</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{stats.total}</dd>
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
                            <dd className="text-2xl font-semibold text-gray-900">{stats.completed}</dd>
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
                            <dd className="text-2xl font-semibold text-gray-900">{stats.pending}</dd>
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
                            <dt className="text-sm font-medium text-gray-500 truncate">Con incidencias</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{stats.withIncidents}</dd>
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
                                <option key={status} value={status}>{getStatusLabel(status)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Tipo:</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos</option>
                            {uniqueTypes.map(type => (
                                <option key={type} value={type}>{getTypeLabel(type)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Active Filters Display */}
                    <div className="flex flex-wrap gap-2">
                        {statusFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Estado: {getStatusLabel(statusFilter)}
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {typeFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Tipo: {getTypeLabel(typeFilter)}
                                <button
                                    onClick={() => setTypeFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>

                    <div className="ml-auto text-sm text-gray-500">
                        Mostrando {paginatedInspections.length} de {filteredInspections.length} inspecciones
                    </div>
                </div>
            </div>

            {/* Inspections Table - Desktop */}
            <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Próximas Inspecciones</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('title')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Inspección
                                        {sortField === 'title' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('project')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Proyecto
                                        {sortField === 'project' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('scheduledDate')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Fecha Programada
                                        {sortField === 'scheduledDate' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('inspector')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Inspector
                                        {sortField === 'inspector' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Prioridad
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
                            {paginatedInspections.map((inspection: any) => (
                                <tr key={inspection.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openModal('view', inspection)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-xl mr-3">{getTypeIcon(inspection.type)}</span>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{inspection.title}</div>
                                                <div className="text-sm text-gray-500">{inspection.location || 'Sin ubicación'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{inspection.project?.name || 'Sin proyecto'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{getTypeLabel(inspection.type)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{inspection.scheduledDate ? new Date(inspection.scheduledDate).toLocaleDateString('es-ES') : '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{inspection.inspector || 'Sin asignar'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(inspection.priority)}`}>
                                            {getPriorityLabel(inspection.priority)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                                            {getStatusLabel(inspection.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative inline-block text-left">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDropdownOpen(dropdownOpen === inspection.id ? null : inspection.id)
                                                }}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                aria-label="Opciones"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>

                                            {dropdownOpen === inspection.id && (
                                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openModal('view', inspection)
                                                                setDropdownOpen(null)
                                                            }}
                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                        >
                                                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            Ver detalles
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openModal('edit', inspection)
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
                                                                openDeleteModal(inspection)
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

            {/* Inspections Cards - Mobile */}
            <div className="md:hidden space-y-4">
                <div className="px-4 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Próximas Inspecciones</h2>
                </div>
                {paginatedInspections.map((inspection: any) => (
                    <div key={inspection.id} className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => openModal('view', inspection)}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center flex-1">
                                <span className="text-2xl mr-3">{getTypeIcon(inspection.type)}</span>
                                <div>
                                    <div className="text-lg font-medium text-gray-900">{inspection.title}</div>
                                    <div className="text-sm text-gray-500">{inspection.location || 'Sin ubicación'}</div>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2">
                                <div className="flex flex-col gap-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(inspection.priority)}`}>
                                        {getPriorityLabel(inspection.priority)}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                                        {getStatusLabel(inspection.status)}
                                    </span>
                                </div>

                                {/* Menú de tres puntos para móvil */}
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setDropdownOpen(dropdownOpen === `mobile-${inspection.id}` ? null : `mobile-${inspection.id}`)
                                        }}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                        </svg>
                                    </button>

                                    {dropdownOpen === `mobile-${inspection.id}` && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                            <div className="py-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openModal('view', inspection)
                                                        setDropdownOpen(null)
                                                    }}
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                >
                                                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    Ver detalles
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openModal('edit', inspection)
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
                                                        openDeleteModal(inspection)
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

                        <div className="grid grid-cols-1 gap-3 mb-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">Proyecto</div>
                                <div className="text-sm text-gray-900">{inspection.project?.name || 'Sin proyecto'}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Fecha</div>
                                    <div className="text-sm text-gray-900">{inspection.scheduledDate ? new Date(inspection.scheduledDate).toLocaleDateString('es-ES') : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Tipo</div>
                                    <div className="text-sm text-gray-900">{getTypeLabel(inspection.type)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="text-sm font-medium text-gray-500 mb-2">Inspector</div>
                            <div className="text-sm text-gray-900">{inspection.inspector || 'Sin asignar'}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                        onClick={() => openModal('create')}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Programar Inspección</div>
                            <div className="text-sm text-gray-600">Crear nueva inspección</div>
                        </div>
                    </button>

                    <button
                        onClick={() => setModals({ ...modals, report: true })}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Generar Reporte</div>
                            <div className="text-sm text-gray-600">Informe de inspecciones</div>
                        </div>
                    </button>

                    <button
                        onClick={() => setModals({ ...modals, templates: true })}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-8 h-8 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11m-8 0H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-4" />
                        </svg>
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Plantillas</div>
                            <div className="text-sm text-gray-600">Gestionar plantillas</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Pagination Component */}
            <div className="mt-6">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredInspections.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>

            {/* Modals */}
            <InspectionModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSaveInspection}
                inspection={null}
            />

            <InspectionModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                onSave={handleSaveInspection}
                inspection={selectedInspection}
            />

            {/* Read-only view modal */}
            <InspectionModal
                isOpen={modals.view}
                onClose={() => closeModal('view')}
                onSave={() => { }}
                inspection={selectedInspection}
                readOnly
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteInspection}
                title="Eliminar Inspección"
                message={`¿Estás seguro de que quieres eliminar la inspección "${selectedInspection?.title}"? Esta acción no se puede deshacer.`}
            />

            <ReportModal
                isOpen={modals.report}
                onClose={() => setModals({ ...modals, report: false })}
                inspections={inspections}
            />

            <TemplateModal
                isOpen={modals.templates}
                onClose={() => setModals({ ...modals, templates: false })}
                onSave={handleSaveTemplate}
                templates={templates}
            />
        </Layout>
    )
}

export default function Inspections() {
    return (
        <Suspense fallback={
            <Layout title="Inspecciones" subtitle="Planifica y gestiona todas tus inspecciones de obra">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        }>
            <InspectionsContent />
        </Suspense>
    )
}
