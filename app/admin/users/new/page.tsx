'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminNavigation from '@/components/AdminNavigation'
import { Menu, X } from 'lucide-react'

interface Organization {
    id: string
    name: string
    email: string
}

export default function NewUserPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: '',
        role: 'USER',
        organizationId: '',
        status: 'ACTIVE',
        password: '',
        language: 'es',
        timezone: 'America/Santiago'
    })

    useEffect(() => {
        // Fetch organizations for the dropdown
        const fetchOrganizations = async () => {
            try {
                const response = await fetch('/api/organizations')
                if (response.ok) {
                    const data = await response.json()
                    setOrganizations(data)
                }
            } catch (error) {
                console.error('Error fetching organizations:', error)
            }
        }

        fetchOrganizations()
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password || 'TempPass123!',
                    role: formData.role,
                    status: formData.status,
                    phone: formData.phone,
                    position: formData.position,
                    organizationId: formData.organizationId,
                    language: formData.language,
                    timezone: formData.timezone
                }),
            })

            if (!response.ok) {
                throw new Error('Error creating user')
            }

            // Redirect to users list
            router.push('/admin/users')
        } catch (error) {
            console.error('Error creating user:', error)
            alert('Error al crear el usuario. Por favor, inténtalo de nuevo.')
        } finally {
            setLoading(false)
        }
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
                                        <p className="text-gray-600 text-sm">Sistema Multi-tenant</p>
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
            <div className={`hidden lg:block ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'} min-h-screen bg-white border-r border-gray-200 transition-all duration-300`}>
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
                                <p className="text-gray-600 text-sm">Sistema Multi-tenant</p>
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
                        <h1 className="text-lg font-semibold text-gray-900">Crear Nuevo Usuario</h1>
                        <div className="w-6" /> {/* Spacer */}
                    </div>
                </div>

                <div className="p-4 lg:p-8">
                    {/* Header */}
                    <div className="mb-6 lg:mb-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Crear Nuevo Usuario</h1>
                                <p className="text-gray-600 text-sm lg:text-base">Agrega un nuevo usuario al sistema Pix</p>
                            </div>
                            <Link
                                href="/admin/users"
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all duration-200 text-sm lg:text-base"
                            >
                                ← Volver a Usuarios
                            </Link>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
                                {/* Información Personal */}
                                <div>
                                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6 flex items-center">
                                        <svg className="w-5 h-5 lg:w-6 lg:h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Información Personal
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre Completo *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                                placeholder="Ingresa el nombre completo"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                                placeholder="usuario@empresa.com"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                                placeholder="+56 9 1234 5678"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Cargo
                                            </label>
                                            <input
                                                type="text"
                                                name="position"
                                                value={formData.position}
                                                onChange={handleInputChange}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                                placeholder="Ej: Gerente de Proyectos"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Información de la Cuenta */}
                                <div>
                                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6 flex items-center">
                                        <svg className="w-5 h-5 lg:w-6 lg:h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Información de la Cuenta
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Rol *
                                            </label>
                                            <select
                                                name="role"
                                                value={formData.role}
                                                onChange={handleInputChange}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                                required
                                            >
                                                <option value="USER">Usuario</option>
                                                <option value="MANAGER">Gerente</option>
                                                <option value="ADMIN">Administrador de Organización</option>
                                                <option value="SUPER_ADMIN">Administrador del Sistema</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Organización *
                                            </label>
                                            <select
                                                name="organizationId"
                                                value={formData.organizationId}
                                                onChange={handleInputChange}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                                required
                                            >
                                                <option value="">Seleccionar organización</option>
                                                {organizations.map((org) => (
                                                    <option key={org.id} value={org.id}>
                                                        {org.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Estado Inicial
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                            >
                                                <option value="ACTIVE">Activo</option>
                                                <option value="INACTIVE">Inactivo</option>
                                                <option value="PENDING">Pendiente de Activación</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contraseña Temporal
                                            </label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                                placeholder="Contraseña temporal"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                El usuario podrá cambiarla en su primer acceso
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Configuración Adicional */}
                                <div>
                                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6 flex items-center">
                                        <svg className="w-5 h-5 lg:w-6 lg:h-6 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Configuración Adicional
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Idioma Preferido
                                            </label>
                                            <select
                                                name="language"
                                                value={formData.language}
                                                onChange={handleInputChange}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                            >
                                                <option value="es">Español</option>
                                                <option value="en">English</option>
                                                <option value="pt">Português</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Zona Horaria
                                            </label>
                                            <select
                                                name="timezone"
                                                value={formData.timezone}
                                                onChange={handleInputChange}
                                                className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                            >
                                                <option value="America/Santiago">America/Santiago (GMT-3)</option>
                                                <option value="America/Buenos_Aires">America/Buenos_Aires (GMT-3)</option>
                                                <option value="America/Mexico_City">America/Mexico_City (GMT-6)</option>
                                                <option value="Europe/Madrid">Europe/Madrid (GMT+1)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-4 lg:pt-6 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                                    >
                                        {loading ? 'Creando...' : 'Crear Usuario'}
                                    </button>

                                    <Link
                                        href="/admin/users"
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all duration-200 text-center text-sm lg:text-base"
                                    >
                                        Cancelar
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
