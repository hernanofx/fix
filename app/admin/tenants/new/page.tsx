'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminNavigation from '@/components/AdminNavigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function NewTenant() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Chile',
        website: '',
        description: '',
        plan: 'BASIC',
        enableAccounting: false,
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        adminPosition: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // First create the organization
            const orgResponse = await fetch('/api/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    country: formData.country,
                    website: formData.website,
                    description: formData.description,
                    plan: formData.plan,
                    enableAccounting: formData.enableAccounting
                }),
            })

            if (!orgResponse.ok) {
                throw new Error('Error creating organization')
            }

            const organization = await orgResponse.json()

            // Then create the admin user
            const userResponse = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.adminName,
                    email: formData.adminEmail,
                    password: 'TempPass123!', // Temporary password
                    role: 'MANAGER', // Changed from ADMIN to MANAGER
                    status: 'ACTIVE',
                    phone: formData.adminPhone,
                    position: formData.adminPosition,
                    organizationId: organization.id,
                    sendWelcomeEmail: true // Habilitado para probar envío de emails
                }),
            })

            if (!userResponse.ok) {
                throw new Error('Error creating admin user')
            }

            // Redirect to tenants list
            router.push('/admin/tenants')
        } catch (error) {
            console.error('Error creating tenant:', error)
            alert('Error al crear la organización. Por favor, inténtalo de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex">
                {/* Sidebar */}
                <div className={`
                    fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
                    w-80 lg:w-80 min-h-screen bg-white border-r border-gray-200 shadow-sm
                    transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                    transition-transform duration-300 ease-in-out
                    ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'}
                `}>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3">
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
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                    className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Menu className="w-5 h-5 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        <AdminNavigation
                            collapsed={sidebarCollapsed}
                            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 lg:ml-0">
                    {/* Mobile header */}
                    <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Menu className="w-6 h-6 text-gray-600" />
                            </button>
                            <h1 className="text-xl font-bold text-gray-900">Nueva Organización</h1>
                            <div className="w-10" /> {/* Spacer */}
                        </div>
                    </div>

                    <div className="p-4 lg:p-8">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Nueva Organización</h1>
                                    <p className="text-gray-600">Configure un nuevo tenant para una empresa cliente</p>
                                </div>
                                <Link
                                    href="/admin/tenants"
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 border border-gray-300 text-center"
                                >
                                    ← Cancelar
                                </Link>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Información Básica</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre de la Empresa *
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Constructora XYZ S.A."
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Corporativo *
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="contacto@empresa.com"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="+56 9 1234 5678"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                                                Sitio Web
                                            </label>
                                            <input
                                                type="url"
                                                id="website"
                                                name="website"
                                                value={formData.website}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="https://empresa.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Address Information */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Información de Dirección</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                        <div className="md:col-span-2">
                                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                                Dirección
                                            </label>
                                            <input
                                                type="text"
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Av. Principal 123"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                                Ciudad
                                            </label>
                                            <input
                                                type="text"
                                                id="city"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Santiago"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                                                País
                                            </label>
                                            <select
                                                id="country"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="Chile">Chile</option>
                                                <option value="Argentina">Argentina</option>
                                                <option value="México">México</option>
                                                <option value="Colombia">Colombia</option>
                                                <option value="Perú">Perú</option>
                                                <option value="España">España</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Plan Selection */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Plan de Suscripción</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                                        <div className={`border rounded-lg p-4 lg:p-6 transition-colors cursor-pointer ${formData.plan === 'BASIC' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`} onClick={() => setFormData(prev => ({ ...prev, plan: 'BASIC' }))}>
                                            <div className="flex items-center mb-3 lg:mb-4">
                                                <input
                                                    type="radio"
                                                    id="basic"
                                                    name="plan"
                                                    value="BASIC"
                                                    checked={formData.plan === 'BASIC'}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <label htmlFor="basic" className="ml-2 text-base lg:text-lg font-medium text-gray-900">
                                                    Básico
                                                </label>
                                            </div>
                                            <p className="text-gray-600 mb-3 lg:mb-4 text-sm">Perfecto para pequeñas empresas</p>
                                            <ul className="text-xs lg:text-sm text-gray-600 space-y-1 mb-3 lg:mb-4">
                                                <li>• Hasta 10 usuarios</li>
                                                <li>• 5 proyectos activos</li>
                                                <li>• Soporte básico</li>
                                                <li>• Reportes estándar</li>
                                            </ul>
                                            <div className="text-xl lg:text-2xl font-bold text-gray-900">$29<span className="text-xs lg:text-sm font-normal">/mes</span></div>
                                        </div>

                                        <div className={`border rounded-lg p-4 lg:p-6 transition-colors cursor-pointer ${formData.plan === 'PROFESSIONAL' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`} onClick={() => setFormData(prev => ({ ...prev, plan: 'PROFESSIONAL' }))}>
                                            <div className="flex items-center mb-3 lg:mb-4">
                                                <input
                                                    type="radio"
                                                    id="professional"
                                                    name="plan"
                                                    value="PROFESSIONAL"
                                                    checked={formData.plan === 'PROFESSIONAL'}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <label htmlFor="professional" className="ml-2 text-base lg:text-lg font-medium text-gray-900">
                                                    Profesional
                                                </label>
                                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Más popular</span>
                                            </div>
                                            <p className="text-gray-600 mb-3 lg:mb-4 text-sm">Ideal para empresas en crecimiento</p>
                                            <ul className="text-xs lg:text-sm text-gray-600 space-y-1 mb-3 lg:mb-4">
                                                <li>• Hasta 50 usuarios</li>
                                                <li>• Proyectos ilimitados</li>
                                                <li>• Soporte prioritario</li>
                                                <li>• Reportes avanzados</li>
                                                <li>• API access</li>
                                            </ul>
                                            <div className="text-xl lg:text-2xl font-bold text-gray-900">$99<span className="text-xs lg:text-sm font-normal">/mes</span></div>
                                        </div>

                                        <div className={`border rounded-lg p-4 lg:p-6 transition-colors cursor-pointer ${formData.plan === 'ENTERPRISE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`} onClick={() => setFormData(prev => ({ ...prev, plan: 'ENTERPRISE' }))}>
                                            <div className="flex items-center mb-3 lg:mb-4">
                                                <input
                                                    type="radio"
                                                    id="enterprise"
                                                    name="enterprise"
                                                    value="ENTERPRISE"
                                                    checked={formData.plan === 'ENTERPRISE'}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <label htmlFor="enterprise" className="ml-2 text-base lg:text-lg font-medium text-gray-900">
                                                    Empresarial
                                                </label>
                                            </div>
                                            <p className="text-gray-600 mb-3 lg:mb-4 text-sm">Para grandes corporaciones</p>
                                            <ul className="text-xs lg:text-sm text-gray-600 space-y-1 mb-3 lg:mb-4">
                                                <li>• Usuarios ilimitados</li>
                                                <li>• Funciones personalizadas</li>
                                                <li>• Soporte 24/7</li>
                                                <li>• SLA garantizado</li>
                                                <li>• On-premise opcional</li>
                                            </ul>
                                            <div className="text-xl lg:text-2xl font-bold text-gray-900">Contactar</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Configuration Options */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Configuración de Módulos</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-start">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id="enableAccounting"
                                                        name="enableAccounting"
                                                        type="checkbox"
                                                        checked={formData.enableAccounting}
                                                        onChange={handleInputChange}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm">
                                                    <label htmlFor="enableAccounting" className="font-medium text-gray-900">
                                                        Habilitar Módulo de Contabilidad
                                                    </label>
                                                    <p className="text-gray-500 mt-1">
                                                        Activa el sistema contable con plan de cuentas estándar, asientos automáticos y reportes financieros.
                                                        Se creará automáticamente el plan de cuentas para empresas de construcción.
                                                    </p>
                                                    {formData.enableAccounting && (
                                                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                            <div className="flex">
                                                                <div className="flex-shrink-0">
                                                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                                <div className="ml-3">
                                                                    <h4 className="text-sm font-medium text-blue-800">
                                                                        ¿Qué incluye el módulo contable?
                                                                    </h4>
                                                                    <div className="mt-2 text-sm text-blue-700">
                                                                        <ul className="list-disc list-inside space-y-1">
                                                                            <li>Plan de cuentas estándar para construcción</li>
                                                                            <li>Asientos automáticos desde facturas y pagos</li>
                                                                            <li>Libro diario y mayor</li>
                                                                            <li>Balance general y estado de resultados</li>
                                                                            <li>Reportes contables en PDF/Excel</li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin User Setup */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Usuario Administrador</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                        <div>
                                            <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre Completo *
                                            </label>
                                            <input
                                                type="text"
                                                id="adminName"
                                                name="adminName"
                                                required
                                                value={formData.adminName}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Juan Pérez García"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                                Email del Administrador *
                                            </label>
                                            <input
                                                type="email"
                                                id="adminEmail"
                                                name="adminEmail"
                                                required
                                                value={formData.adminEmail}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="juan.perez@empresa.com"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="adminPhone" className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                id="adminPhone"
                                                name="adminPhone"
                                                value={formData.adminPhone}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="+56 9 1234 5678"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="adminPosition" className="block text-sm font-medium text-gray-700 mb-2">
                                                Cargo
                                            </label>
                                            <input
                                                type="text"
                                                id="adminPosition"
                                                name="adminPosition"
                                                value={formData.adminPosition}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Gerente General"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 lg:pt-6 border-t border-gray-200">
                                    <Link
                                        href="/admin/tenants"
                                        className="px-4 lg:px-6 py-2 lg:py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                                    >
                                        {loading ? 'Creando...' : 'Crear Organización'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
