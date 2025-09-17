'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminLayout from '../../components/AdminLayout'

interface Organization {
    id: string
    name: string
    email: string
    plan: string
    status: string
    createdAt: string
    _count: {
        users: number
        projects: number
    }
}

interface DashboardStats {
    totalOrganizations: number
    activeUsers: number
    systemHealth: string
    revenue: number
}

export default function AdminDashboard() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [stats, setStats] = useState<DashboardStats>({
        totalOrganizations: 0,
        activeUsers: 0,
        systemHealth: '99.9%',
        revenue: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // Fetch organizations
            const orgResponse = await fetch('/api/organizations')
            const orgData = await orgResponse.json()
            setOrganizations(orgData.slice(0, 3)) // Show only first 3 for recent organizations

            // Calculate stats
            const totalOrgs = orgData.length
            const activeUsers = orgData.reduce((sum: number, org: Organization) => sum + org._count.users, 0)

            setStats({
                totalOrganizations: totalOrgs,
                activeUsers,
                systemHealth: '99.9%',
                revenue: totalOrgs * 47.2 // Mock revenue calculation
            })
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando panel de administración...</p>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout
            title="Dashboard Administrativo"
            subtitle="Vista general del sistema multi-tenant"
        >
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm p-4 md:p-6 mb-6 md:mb-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">¡Bienvenido, Administrador Maestro!</h1>
                        <p className="text-blue-100 mt-1 text-sm md:text-base">Sistema multi-tenant • Control total del ecosistema</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/admin/tenants/new"
                            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors text-center"
                        >
                            Nueva Organización
                        </Link>
                        <Link
                            href="/admin/analytics"
                            className="border border-white text-white px-4 py-2 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors text-center"
                        >
                            Ver Analytics
                        </Link>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                {/* Total Organizations */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Organizaciones</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.totalOrganizations}</p>
                            <p className="text-sm text-green-600 mt-1">+3 esta semana</p>
                        </div>
                        <div className="p-2 md:p-3 bg-purple-100 rounded-full">
                            <svg className="h-6 w-6 md:h-8 md:w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Active Users */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
                            <p className="text-sm text-blue-600 mt-1">+28 hoy</p>
                        </div>
                        <div className="p-2 md:p-3 bg-blue-100 rounded-full">
                            <svg className="h-6 w-6 md:h-8 md:w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Salud del Sistema</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.systemHealth}</p>
                            <p className="text-sm text-green-600 mt-1">Uptime mensual</p>
                        </div>
                        <div className="p-2 md:p-3 bg-green-100 rounded-full">
                            <svg className="h-6 w-6 md:h-8 md:w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Revenue */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900">${stats.revenue.toFixed(1)}K</p>
                            <p className="text-sm text-green-600 mt-1">+15% vs mes anterior</p>
                        </div>
                        <div className="p-2 md:p-3 bg-emerald-100 rounded-full">
                            <svg className="h-6 w-6 md:h-8 md:w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
                {/* Organization Management */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Gestión de Organizaciones</h3>
                        <Link href="/admin/tenants" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                            Ver todas →
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <Link
                            href="/admin/tenants/new"
                            className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                <svg className="h-5 w-5 md:h-6 md:w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-medium text-purple-900 text-sm md:text-base">Crear Nueva Organización</h4>
                                <p className="text-xs md:text-sm text-purple-700">Configurar tenant para nueva empresa</p>
                            </div>
                        </Link>
                        <Link
                            href="/admin/tenants"
                            className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                <svg className="h-5 w-5 md:h-6 md:w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-medium text-blue-900 text-sm md:text-base">Gestionar Organizaciones</h4>
                                <p className="text-xs md:text-sm text-blue-700">Ver y editar tenants existentes</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* System Management */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Administración del Sistema</h3>
                        <Link href="/admin/system" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            Configurar →
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <Link
                            href="/admin/users"
                            className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                                <svg className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-medium text-indigo-900 text-sm md:text-base">Gestión de Usuarios</h4>
                                <p className="text-xs md:text-sm text-indigo-700">Administrar usuarios del sistema</p>
                            </div>
                        </Link>
                        <Link
                            href="/admin/analytics"
                            className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                            <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                                <svg className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-medium text-emerald-900 text-sm md:text-base">Analytics Global</h4>
                                <p className="text-xs md:text-sm text-emerald-700">Métricas del sistema completo</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Organizations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Organizaciones Recientes</h3>
                    <Link href="/admin/tenants" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                        Ver todas →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Organización
                                </th>
                                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plan
                                </th>
                                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuarios
                                </th>
                                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Creado
                                </th>
                                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {organizations.map((org) => (
                                <tr key={org.id}>
                                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-purple-600 font-semibold text-sm">{org.name.charAt(0)}</span>
                                            </div>
                                            <div className="ml-3 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">{org.name}</div>
                                                <div className="text-sm text-gray-500 truncate">{org.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {org.plan}
                                        </span>
                                    </td>
                                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{org._count.users}</td>
                                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${org.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {org.status}
                                        </span>
                                    </td>
                                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(org.createdAt).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link href={`/admin/tenants/${org.id}`} className="text-purple-600 hover:text-purple-900">
                                            Ver detalles
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 md:mb-6">Estado del Sistema</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div className="text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="h-6 w-6 md:h-8 md:w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm md:text-base">Base de Datos</h4>
                        <p className="text-xs md:text-sm text-gray-600">Conectada y operativa</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="h-6 w-6 md:h-8 md:w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm md:text-base">API Services</h4>
                        <p className="text-xs md:text-sm text-gray-600">Todos los servicios activos</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="h-6 w-6 md:h-8 md:w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm md:text-base">Seguridad</h4>
                        <p className="text-xs md:text-sm text-gray-600">Protecciones activas</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
