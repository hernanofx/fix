'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Organization {
    id: string
    name: string
    email: string
    phone?: string
    plan: string
    status: string
    createdAt: string
    _count: {
        users: number
        projects: number
    }
}

export default function TenantsManagement() {
    const router = useRouter()
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPlan, setSelectedPlan] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean
        organization: Organization | null
        confirmText: string
    }>({
        isOpen: false,
        organization: null,
        confirmText: ''
    })

    useEffect(() => {
        fetchOrganizations()
    }, [])

    const fetchOrganizations = async () => {
        try {
            const response = await fetch('/api/organizations')
            const data = await response.json()
            setOrganizations(data)
        } catch (error) {
            console.error('Error fetching organizations:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredOrganizations = organizations.filter(org => {
        const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPlan = !selectedPlan || org.plan === selectedPlan
        const matchesStatus = !selectedStatus || org.status === selectedStatus

        return matchesSearch && matchesPlan && matchesStatus
    })

    // Pagination logic
    const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentOrganizations = filteredOrganizations.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items)
        setCurrentPage(1)
    }

    const handleStatusChange = async (orgId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/organizations/${orgId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            })

            if (response.ok) {
                setOrganizations(prev => prev.map(org =>
                    org.id === orgId ? { ...org, status: newStatus } : org
                ))
            } else {
                alert('Error al actualizar el estado de la organización')
            }
        } catch (error) {
            console.error('Error updating organization status:', error)
            alert('Error al actualizar el estado de la organización')
        }
    }

    const handleDeleteOrganization = async (org: any) => {
        const confirmMessage = `
¿Estás completamente seguro de que quieres eliminar la organización "${org.name}"?

⚠️  ATENCIÓN: Esta acción ELIMINARÁ PERMANENTEMENTE todos los datos asociados:

• Todos los usuarios y sus cuentas
• Todos los proyectos y presupuestos
• Todas las facturas, pagos y transacciones
• Todos los empleados y registros de tiempo
• Todos los clientes y proveedores
• Todo el inventario y almacenes
• Todas las configuraciones y notificaciones

Esta acción NO SE PUEDE DESHACER y afectará únicamente a esta organización.

¿Deseas continuar?
        `.trim()

        if (!confirm(confirmMessage)) {
            return
        }

        // Segunda confirmación
        const finalConfirm = prompt(`Para confirmar la eliminación, escribe el nombre de la organización: "${org.name}"`)
        if (finalConfirm !== org.name) {
            alert('Eliminación cancelada. El nombre no coincide.')
            return
        }

        try {
            const response = await fetch(`/api/admin/organizations/${org.id}/delete-complete`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (data.success) {
                setOrganizations(prev => prev.filter(o => o.id !== org.id))
                alert(`✅ Organización "${org.name}" eliminada completamente.\n\n${data.stats.totalRecords} registros eliminados.`)
            } else {
                alert(`❌ Error al eliminar la organización: ${data.error}`)
            }
        } catch (error) {
            console.error('Error deleting organization:', error)
            alert('❌ Error de conexión al eliminar la organización')
        }
    }

    const getVisiblePages = () => {
        const delta = 2
        const range = []
        const rangeWithDots = []

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i)
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...')
        } else {
            rangeWithDots.push(1)
        }

        rangeWithDots.push(...range)

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages)
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages)
        }

        return rangeWithDots
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando organizaciones...</p>
                </div>
            </div>
        )
    }

    return (
        <AdminLayout
            title="Gestión de Organizaciones"
            subtitle="Administra todos los tenants y empresas del sistema"
        >
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
                <Link
                    href="/admin/tenants/new"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                >
                    Nueva Organización
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Organizaciones</p>
                            <p className="text-2xl font-bold text-gray-900">{filteredOrganizations.length}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Organizaciones Activas</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredOrganizations.filter(org => org.status === 'ACTIVE').length}
                            </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Suspendidas</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredOrganizations.filter(org => org.status === 'SUSPENDED').length}
                            </p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Crecimiento Mensual</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredOrganizations.filter(org => {
                                    const monthAgo = new Date()
                                    monthAgo.setMonth(monthAgo.getMonth() - 1)
                                    return new Date(org.createdAt) > monthAgo
                                }).length}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar organizaciones..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-80 pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <select
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos los planes</option>
                            <option value="BASIC">Básico</option>
                            <option value="PROFESSIONAL">Profesional</option>
                            <option value="ENTERPRISE">Empresarial</option>
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos los estados</option>
                            <option value="ACTIVE">Activo</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="SUSPENDED">Suspendido</option>
                        </select>
                    </div>

                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200">
                        Exportar
                    </button>
                </div>
            </div>

            {/* Organizations Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organización</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuarios</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyectos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actividad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentOrganizations.map((org) => (
                                <tr key={org.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-white font-medium text-sm">
                                                    {org.name.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="ml-4 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">{org.name}</div>
                                                <div className="text-sm text-gray-500 truncate">{org.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${org.plan === 'PROFESSIONAL' ? 'bg-green-100 text-green-800' :
                                            org.plan === 'ENTERPRISE' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {org.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{org._count.users}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{org._count.projects}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={org.status}
                                            onChange={(e) => handleStatusChange(org.id, e.target.value)}
                                            className={`px-3 py-1 text-xs font-semibold rounded-full border border-gray-300 bg-white text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${org.status === 'ACTIVE' ? 'text-green-600' :
                                                org.status === 'SUSPENDED' ? 'text-red-600' :
                                                    'text-yellow-600'
                                                }`}
                                        >
                                            <option value="ACTIVE" className="bg-white text-gray-900">Activo</option>
                                            <option value="PENDING" className="bg-white text-gray-900">Pendiente</option>
                                            <option value="SUSPENDED" className="bg-white text-gray-900">Suspendido</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(org.createdAt).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Hace 2 horas</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                                                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/admin/tenants/${org.id}`)}
                                                    className="cursor-pointer"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver detalles
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/admin/tenants/${org.id}/edit`)}
                                                    className="cursor-pointer"
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteOrganization(org)}
                                                    className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span className="font-medium">Eliminar completamente</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-6 gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <span>Mostrar</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                            className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span>registros por página</span>
                    </div>
                    <div>
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredOrganizations.length)} de {filteredOrganizations.length} resultados
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>

                    <div className="flex items-center gap-1">
                        {getVisiblePages().map((page, index) => (
                            <div key={index}>
                                {page === '...' ? (
                                    <span className="px-3 py-2 text-gray-400">...</span>
                                ) : (
                                    <button
                                        onClick={() => handlePageChange(page as number)}
                                        className={`px-3 py-2 rounded-lg transition-colors duration-200 ${currentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </AdminLayout>
    )
}
