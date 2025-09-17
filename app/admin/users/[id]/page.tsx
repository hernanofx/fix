'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminNavigation from '@/components/AdminNavigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User, Building, Menu, X } from 'lucide-react'

interface User {
    id: string
    name: string
    email: string
    role: string
    status: string
    phone?: string
    position?: string
    language?: string
    timezone?: string
    createdAt: string
    updatedAt: string
    organization: {
        id: string
        name: string
        slug: string
        plan: string
        status: string
    }
    _count: {
        projects: number
        employees: number
        budgets: number
        invoices: number
        inspectionCreatedBy: number
        inspectionInspectedBy: number
        timeTrackings: number
    }
}

export default function UserDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    useEffect(() => {
        if (params.id) {
            fetchUser()
        }
    }, [params.id])

    const fetchUser = async () => {
        try {
            const response = await fetch(`/api/users/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setUser(data)
            } else {
                alert('Error al cargar los datos del usuario')
                router.push('/admin/users')
            }
        } catch (error) {
            console.error('Error fetching user:', error)
            alert('Error al cargar los datos del usuario')
            router.push('/admin/users')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando usuario...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">Usuario no encontrado</div>
                    <p className="text-gray-600">El usuario solicitado no existe o ha sido eliminado.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
                    <div className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-gray-200 shadow-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-gray-900">Panel Maestro</h1>
                                        <p className="text-gray-500 text-sm">Sistema Multi-tenant</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <AdminNavigation collapsed={false} onToggleCollapse={() => { }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className={`hidden lg:block ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'} min-h-screen bg-white border-r border-gray-200 shadow-sm transition-all duration-300`}>
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        {!sidebarCollapsed && (
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Panel Maestro</h1>
                                <p className="text-gray-500 text-sm">Sistema Multi-tenant</p>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="text-gray-400 hover:text-gray-600 ml-auto"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                    <AdminNavigation collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-0'}`}>
                {/* Mobile header */}
                <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">Detalles del Usuario</h1>
                        <div className="w-6" /> {/* Spacer */}
                    </div>
                </div>

                <div className="p-4 lg:p-8">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm p-4 lg:p-6 mb-6 lg:mb-8 text-white">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/admin/users"
                                    className="text-blue-100 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-bold">Detalles del Usuario</h1>
                                    <p className="text-blue-100 mt-1 text-sm lg:text-base">Información completa de {user.name}</p>
                                </div>
                            </div>
                            <Link
                                href={`/admin/users/${user.id}/edit`}
                                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm lg:text-base"
                            >
                                Editar Usuario
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* User Info Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
                                <div className="text-center mb-6">
                                    <div className="w-16 lg:w-20 h-16 lg:h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-white font-bold text-xl lg:text-2xl">
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">{user.name}</h2>
                                    <p className="text-gray-600 mb-4 text-sm lg:text-base">{user.position || 'Sin cargo especificado'}</p>
                                    <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                            user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'}`}>
                                            {user.role}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {user.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center text-gray-600">
                                        <Mail className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm lg:text-base break-all">{user.email}</span>
                                    </div>
                                    {user.phone && (
                                        <div className="flex items-center text-gray-600">
                                            <Phone className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm lg:text-base">{user.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center text-gray-600">
                                        <Building className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm lg:text-base">{user.organization.name}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Calendar className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm lg:text-base">Miembro desde {new Date(user.createdAt).toLocaleDateString('es-ES')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats and Activity */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
                                    <div className="text-xl lg:text-2xl font-bold text-gray-900">{user._count.projects}</div>
                                    <div className="text-gray-600 text-xs lg:text-sm">Proyectos</div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
                                    <div className="text-xl lg:text-2xl font-bold text-gray-900">{user._count.employees}</div>
                                    <div className="text-gray-600 text-xs lg:text-sm">Empleados</div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
                                    <div className="text-xl lg:text-2xl font-bold text-gray-900">{user._count.budgets}</div>
                                    <div className="text-gray-600 text-xs lg:text-sm">Presupuestos</div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
                                    <div className="text-xl lg:text-2xl font-bold text-gray-900">{user._count.invoices}</div>
                                    <div className="text-gray-600 text-xs lg:text-sm">Facturas</div>
                                </div>
                            </div>

                            {/* Organization Info */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organización</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
                                        <p className="text-gray-900 text-sm lg:text-base">{user.organization.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Plan</label>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.organization.plan === 'PROFESSIONAL' ? 'bg-green-100 text-green-800' :
                                            user.organization.plan === 'ENTERPRISE' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'}`}>
                                            {user.organization.plan}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Estado</label>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.organization.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.organization.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Idioma</label>
                                        <p className="text-gray-900 text-sm lg:text-base">{user.language || 'No especificado'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Zona Horaria</label>
                                        <p className="text-gray-900 text-sm lg:text-base">{user.timezone || 'No especificada'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Última Actualización</label>
                                        <p className="text-gray-900 text-sm lg:text-base">{new Date(user.updatedAt).toLocaleDateString('es-ES')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
