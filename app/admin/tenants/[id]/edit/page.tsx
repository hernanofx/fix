'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminNavigation from '@/components/AdminNavigation'
import Link from 'next/link'
import { ArrowLeft, Save, Menu, X } from 'lucide-react'

interface Organization {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
    city?: string
    country: string
    website?: string
    description?: string
    plan: string
    status: string
}

export default function EditOrganizationPage() {
    const params = useParams()
    const router = useRouter()
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
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
        status: 'ACTIVE'
    })

    useEffect(() => {
        if (params.id) {
            fetchOrganization()
        }
    }, [params.id])

    const fetchOrganization = async () => {
        try {
            const response = await fetch(`/api/organizations/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setOrganization(data)
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    city: data.city || '',
                    country: data.country || 'Chile',
                    website: data.website || '',
                    description: data.description || '',
                    plan: data.plan || 'BASIC',
                    status: data.status || 'ACTIVE'
                })
            } else {
                alert('Error al cargar los datos de la organización')
                router.push('/admin/tenants')
            }
        } catch (error) {
            console.error('Error fetching organization:', error)
            alert('Error al cargar los datos de la organización')
            router.push('/admin/tenants')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const response = await fetch(`/api/organizations/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                alert('Organización actualizada exitosamente')
                router.push(`/admin/tenants/${params.id}`)
            } else {
                alert('Error al actualizar la organización')
            }
        } catch (error) {
            console.error('Error updating organization:', error)
            alert('Error al actualizar la organización')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando organización...</p>
                </div>
            </div>
        )
    }

    if (!organization) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">Organización no encontrada</div>
                    <p className="text-gray-600">La organización solicitada no existe o ha sido eliminada.</p>
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
                        <h1 className="text-lg font-semibold text-gray-900">Editar Organización</h1>
                        <div className="w-6" /> {/* Spacer */}
                    </div>
                </div>

                <div className="p-4 lg:p-8">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm p-4 lg:p-6 mb-6 lg:mb-8 text-white">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href={`/admin/tenants/${organization.id}`}
                                    className="text-blue-100 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-bold">Editar Organización</h1>
                                    <p className="text-blue-100 mt-1 text-sm lg:text-base">Modificar la información de {organization.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://empresa.com"
                                    />
                                </div>
                            </div>

                            {/* Address Information */}
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                            {/* Plan and Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                <div>
                                    <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-2">
                                        Plan de Suscripción *
                                    </label>
                                    <select
                                        id="plan"
                                        name="plan"
                                        required
                                        value={formData.plan}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="BASIC">Básico</option>
                                        <option value="PROFESSIONAL">Profesional</option>
                                        <option value="ENTERPRISE">Empresarial</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                        Estado *
                                    </label>
                                    <select
                                        id="status"
                                        name="status"
                                        required
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="ACTIVE">Activo</option>
                                        <option value="PENDING">Pendiente</option>
                                        <option value="SUSPENDED">Suspendido</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Breve descripción de la empresa..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                                <Link
                                    href={`/admin/tenants/${organization.id}`}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
