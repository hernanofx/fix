'use client'

import Layout from '../../components/Layout'
import PlanFormModal from '../../components/modals/PlanFormModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '../../components/ui/Pagination'
import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '../../components/ToastProvider'

function PlansContent() {
    const [plans, setPlans] = useState<any[]>([])
    const toast = useToast()
    const searchParams = useSearchParams()

    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false
    })

    const [selectedPlan, setSelectedPlan] = useState<any>(null)

    // Estado para el menú desplegable
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

    // Filter and sort states
    const [projectFilter, setProjectFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const { data: session } = useSession()

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/plans')
                if (!res.ok) throw new Error('Failed to load plans')
                const data = await res.json()
                setPlans(data)
            } catch (err: any) {
                console.error(err)
                toast.error(err.message || 'No se pudieron cargar los planos')
            }
        }
        load()
    }, [])

    // Check URL parameters for automatic modal opening
    useEffect(() => {
        const modal = searchParams.get('modal')
        if (modal === 'create') {
            openModal('create')
        }
    }, [searchParams])

    // Event listener para cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
                setDropdownOpen(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [dropdownOpen])

    // Filtered and sorted plans (sin paginación para estadísticas)
    const filteredPlans = useMemo(() => {
        let filtered = plans

        // Apply filters
        if (projectFilter !== 'all') {
            filtered = filtered.filter(plan => plan.project?.name === projectFilter)
        }
        if (typeFilter !== 'all') {
            filtered = filtered.filter(plan => plan.type === typeFilter)
        }
        if (statusFilter !== 'all') {
            filtered = filtered.filter(plan => plan.status === statusFilter)
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortField) {
                case 'name':
                    aValue = a.name || ''
                    bValue = b.name || ''
                    break
                case 'project':
                    aValue = a.project?.name || ''
                    bValue = b.project?.name || ''
                    break
                case 'type':
                    aValue = a.type || ''
                    bValue = b.type || ''
                    break
                case 'version':
                    aValue = a.version || ''
                    bValue = b.version || ''
                    break
                case 'lastModified':
                    aValue = a.lastModified ? new Date(a.lastModified).getTime() : 0
                    bValue = b.lastModified ? new Date(b.lastModified).getTime() : 0
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [plans, projectFilter, typeFilter, statusFilter, sortField, sortDirection])

    // Datos paginados para mostrar
    const paginatedPlans = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredPlans.slice(startIndex, endIndex)
    }, [filteredPlans, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [projectFilter, typeFilter, statusFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage)

    // Get unique values for filters
    const uniqueProjects = useMemo(() => {
        const projects = Array.from(new Set(plans.map(plan => plan.project?.name).filter(Boolean)))
        return projects
    }, [plans])

    const uniqueTypes = useMemo(() => {
        const types = Array.from(new Set(plans.map(plan => plan.type).filter(Boolean)))
        return types
    }, [plans])

    const uniqueStatuses = useMemo(() => {
        const statuses = Array.from(new Set(plans.map(plan => plan.status).filter(Boolean)))
        return statuses
    }, [plans])

    const openModal = async (modalType: keyof typeof modals, plan?: any) => {
        if (modalType === 'edit' && plan?.id) {
            try {
                const res = await fetch(`/api/plans/${plan.id}`)
                if (!res.ok) throw new Error('Failed to fetch plan')
                const data = await res.json()
                setSelectedPlan(data)
                setModals({ ...modals, [modalType]: true })
                return
            } catch (err) {
                console.error(err)
                toast.error('No se pudo cargar el plano para editar')
                return
            }
        }

        setSelectedPlan(plan)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedPlan(null)
    }

    const openDeleteModal = (plan: any) => {
        setSelectedPlan(plan)
        setModals({ ...modals, delete: true })
    }

    // Función para manejar el menú desplegable
    const toggleDropdown = (planId: string) => {
        setDropdownOpen(dropdownOpen === planId ? null : planId)
    }

    // Función para cerrar el dropdown cuando se hace clic fuera
    const closeDropdown = () => {
        setDropdownOpen(null)
    }

    const handleSavePlan = async (planData: any) => {
        try {
            // Si planData ya tiene un id, significa que ya fue procesado por el modal
            // Solo necesitamos actualizar la lista local
            if (planData?.id) {
                setPlans(prevPlans => {
                    const existingIndex = prevPlans.findIndex(p => p.id === planData.id)
                    if (existingIndex >= 0) {
                        // Actualizar plano existente
                        const updatedPlans = [...prevPlans]
                        updatedPlans[existingIndex] = planData
                        return updatedPlans
                    } else {
                        // Agregar nuevo plano
                        return [planData, ...prevPlans]
                    }
                })
                closeModal('create')
                closeModal('edit')
                return
            }

            // Flujo legacy para creación básica (sin archivo)
            if (selectedPlan?.id) {
                const res = await fetch(`/api/plans/${selectedPlan.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(planData)
                })
                if (!res.ok) throw new Error('Error updating plan')
                const updated = await res.json()
                setPlans(plans.map(p => p.id === updated.id ? updated : p))
            } else {
                const res = await fetch('/api/plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(planData)
                })
                if (!res.ok) throw new Error('Error creating plan')
                const created = await res.json()
                setPlans([created, ...plans])
            }

            closeModal('create')
            closeModal('edit')
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || 'Error al guardar plano')
        }
    }

    const handleDeletePlan = async () => {
        if (!selectedPlan?.id) return
        try {
            const res = await fetch(`/api/plans/${selectedPlan.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Error deleting')
            setPlans(plans.filter(plan => plan.id !== selectedPlan.id))
            closeModal('delete')
            toast.success('Plano eliminado correctamente')
        } catch (err: any) {
            console.error(err)
            toast.error('No se pudo eliminar el plano')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APROBADO': return 'bg-green-100 text-green-800'
            case 'EN_REVISION': return 'bg-yellow-100 text-yellow-800'
            case 'DRAFT': return 'bg-blue-100 text-blue-800'
            case 'ARCHIVADO': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'ARQUITECTONICO':
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                )
            case 'ESTRUCTURAL':
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H8v-2h4v2zm0-4H8v-2h4v2zm0-4H8V7h4v2z" />
                    </svg>
                )
            case 'ELECTRICO':
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                    </svg>
                )
            case 'INSTALACIONES':
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )
            case 'OTRO':
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                )
            default:
                return (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z" />
                    </svg>
                )
        }
    }

    return (
        <Layout
            title="Planos"
            subtitle="Gestión de planos y documentos"
        >
            <div className="flex justify-between items-center mb-8">
                <div></div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => openModal('create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Nuevo Plano
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow-sm rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex flex-wrap gap-4 items-end">
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los tipos</option>
                            {uniqueTypes.map(type => (
                                <option key={type} value={type}>
                                    {type === 'ARQUITECTONICO' ? 'Arquitectónico' :
                                        type === 'ESTRUCTURAL' ? 'Estructural' :
                                            type === 'ELECTRICO' ? 'Eléctrico' :
                                                type === 'INSTALACIONES' ? 'Instalaciones' :
                                                    type === 'OTRO' ? 'Otro' : type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los estados</option>
                            {uniqueStatuses.map(status => (
                                <option key={status} value={status}>
                                    {status === 'DRAFT' ? 'Borrador' :
                                        status === 'EN_REVISION' ? 'En revisión' :
                                            status === 'APROBADO' ? 'Aprobado' :
                                                status === 'ARCHIVADO' ? 'Archivado' : status}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex space-x-2">
                        {(projectFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setProjectFilter('all')
                                    setTypeFilter('all')
                                    setStatusFilter('all')
                                }}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Plans Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plano
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Proyecto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Versión
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tamaño
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Modificado
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedPlans.map((plan) => (
                                <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                                    {getTypeIcon(plan.type)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                                                <div className="text-sm text-gray-500">{plan.description || 'Sin descripción'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{plan.project?.name || 'Sin proyecto'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {plan.type === 'ARQUITECTONICO' ? 'Arquitectónico' :
                                                plan.type === 'ESTRUCTURAL' ? 'Estructural' :
                                                    plan.type === 'ELECTRICO' ? 'Eléctrico' :
                                                        plan.type === 'INSTALACIONES' ? 'Instalaciones' :
                                                            plan.type === 'OTRO' ? 'Otro' : plan.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                                            {plan.status === 'DRAFT' ? 'Borrador' :
                                                plan.status === 'EN_REVISION' ? 'En revisión' :
                                                    plan.status === 'APROBADO' ? 'Aprobado' :
                                                        plan.status === 'ARCHIVADO' ? 'Archivado' : plan.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {plan.version}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {plan.fileSize}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {plan.lastModified ? new Date(plan.lastModified).toLocaleDateString('es-ES') : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                        <div className="relative dropdown-container">
                                            <button
                                                onClick={() => toggleDropdown(plan.id)}
                                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                title="Más opciones"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>

                                            {dropdownOpen === plan.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                if (plan.fileUrl) {
                                                                    window.open(plan.fileUrl, '_blank')
                                                                }
                                                                closeDropdown()
                                                            }}
                                                            disabled={!plan.fileUrl}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-white"
                                                        >
                                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            Ver plano
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (plan.fileUrl) {
                                                                    window.open(plan.fileUrl, '_blank')
                                                                }
                                                                closeDropdown()
                                                            }}
                                                            disabled={!plan.fileUrl}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-white"
                                                        >
                                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m-3 3V4m0 6v6m0 0l-3-3m3 3l3-3" />
                                                            </svg>
                                                            Descargar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                openModal('edit', plan)
                                                                closeDropdown()
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                openDeleteModal(plan)
                                                                closeDropdown()
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                        >
                                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                {/* Empty State */}
                {paginatedPlans.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay planos</h3>
                        <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer plano.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredPlans.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                </div>
            )}

            {/* Summary */}
            <div className="mt-4 text-sm text-gray-600 text-center">
                Mostrando {paginatedPlans.length} de {filteredPlans.length} planos
            </div>

            {/* Upload Area - Now opens create modal */}
            <div
                onClick={() => openModal('create')}
                className="mt-8 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <div className="mt-4">
                    <p className="text-lg font-medium text-gray-900">Crear Nuevo Plano</p>
                    <p className="text-gray-600">Haz clic aquí para subir y organizar tus planos</p>
                </div>
                <div className="mt-4">
                    <span className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Nuevo Plano
                    </span>
                </div>
            </div>

            {/* Modals */}
            <PlanFormModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSavePlan}
                plan={null}
            />

            <PlanFormModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                onSave={handleSavePlan}
                plan={selectedPlan}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeletePlan}
                title="Eliminar Plano"
                message={`¿Estás seguro de que quieres eliminar el plano "${selectedPlan?.name}"? Esta acción no se puede deshacer.`}
            />
        </Layout>
    )
}

export default function Plans() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <PlansContent />
        </Suspense>
    )
}
