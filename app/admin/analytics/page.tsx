'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Menu, X } from 'lucide-react'

interface Organization {
    id: string
    name: string
    slug: string
    status: string
    _count?: {
        users: number
        projects: number
    }
}

interface AnalyticsResponse {
    totalUsers: number
    totalOrganizations: number
    totalProjects: number
    activeProjects: number
    monthlyGrowth: number
    userGrowth: number
    revenue: number
    avgProjectValue: number
    pageViews: number
    sessions: number
    bounceRate: number
    avgSessionDuration: number
    topPages: Array<{
        pagePath: string
        pageViews: number
        activeUsers: number
    }>
    trafficSources: Array<{
        source: string
        sessions: number
        percentage: number
    }>
    userAcquisition: {
        newUsers: number
        returningUsers: number
        newUsersPercentage: number
    }
    deviceCategories: Array<{
        device: string
        sessions: number
        percentage: number
    }>
    // Nuevos campos para dimensiones avanzadas
    moduleUsage: Array<{
        module: string
        sessions: number
        pageViews: number
        avgSessionDuration: number
    }>
    actionTypes: Array<{
        action: string
        users: number
        sessions: number
    }>
    planUsage: Array<{
        plan: string
        users: number
        sessions: number
        pageViews: number
    }>
    recentActivity: Array<{
        action: string
        user: string
        time: string
        timestamp: string
    }>
    _meta?: {
        dataSource: 'google-analytics' | 'demo' | 'demo-fallback' | 'error'
        message: string
        lastUpdated: string
        error?: string
    }
    error?: string
    message?: string
    nextSteps?: string[]
    possibleReasons?: string[]
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [selectedOrganization, setSelectedOrganization] = useState<string>('')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    // Nuevos estados para filtros avanzados
    const [selectedModule, setSelectedModule] = useState<string>('')
    const [selectedAction, setSelectedAction] = useState<string>('')
    const [selectedPlan, setSelectedPlan] = useState<string>('')
    const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'actions' | 'plans'>('overview')

    // Funciones de mapeo para nombres amigables
    const mapModuleName = (module: string): string => {
        const moduleMappings: { [key: string]: string } = {
            'dashboard': 'Dashboard Ejecutivo',
            'projects': 'Proyectos',
            'clients': 'Clientes',
            'employees': 'Empleados',
            'invoices': 'Facturas',
            'budgets': 'Presupuestos',
            'inspections': 'Inspecciones',
            'time-tracking': 'Control de Tiempo',
            'cashflow': 'Flujo de Caja',
            'reports': 'Reportes',
            'settings': 'Configuración',
            'profile': 'Perfil',
            'support': 'Soporte',
            'notifications': 'Notificaciones',
            'planning': 'Planificación',
            'collections': 'Cobranzas',
            'providers': 'Proveedores',
            'stock': 'Inventario',
            'payrolls': 'Nóminas',
            'evaluations': 'Evaluaciones',
            'treasury': 'Tesorería',
            'assignments': 'Asignaciones',
            'bills': 'Gastos',
            'payment-terms': 'Términos de Pago',
            'rubros': 'Rubros'
        }
        return moduleMappings[module] || module.charAt(0).toUpperCase() + module.slice(1)
    }

    const mapActionType = (action: string): string => {
        const actionMappings: { [key: string]: string } = {
            'create': 'Crear',
            'update': 'Actualizar',
            'delete': 'Eliminar',
            'view': 'Ver',
            'page_view': 'Vista de Página',
            'login': 'Inicio de Sesión',
            'logout': 'Cierre de Sesión',
            'export': 'Exportar',
            'import': 'Importar',
            'search': 'Buscar',
            'filter': 'Filtrar'
        }
        return actionMappings[action] || action.charAt(0).toUpperCase() + action.slice(1)
    }

    const mapSubscriptionPlan = (plan: string): string => {
        const planMappings: { [key: string]: string } = {
            'basic': 'Plan Básico',
            'professional': 'Plan Profesional',
            'enterprise': 'Plan Empresarial',
            'premium': 'Plan Premium',
            'starter': 'Plan Inicial',
            'advanced': 'Plan Avanzado'
        }
        return planMappings[plan] || plan.charAt(0).toUpperCase() + plan.slice(1)
    }

    useEffect(() => {
        fetchOrganizations()
        fetchAnalytics()
    }, [])

    useEffect(() => {
        if (selectedOrganization) {
            fetchAnalytics()
        }
    }, [selectedOrganization])

    const fetchOrganizations = async () => {
        try {
            const response = await fetch('/api/organizations')
            const data = await response.json()
            setOrganizations(data)
        } catch (error) {
            console.error('Error fetching organizations:', error)
        }
    }

    const fetchAnalytics = async () => {
        try {
            const url = selectedOrganization
                ? `/api/analytics?organizationId=${selectedOrganization}`
                : '/api/analytics'

            const response = await fetch(url)
            const data = await response.json()

            // Handle all response types consistently
            setAnalytics(data)
        } catch (error) {
            console.error('Error fetching analytics:', error)
            setAnalytics({
                error: 'Network error',
                message: 'Could not connect to analytics service',
                _meta: {
                    dataSource: 'error',
                    message: 'Network error',
                    lastUpdated: new Date().toISOString()
                }
            } as AnalyticsResponse)
        } finally {
            setLoading(false)
        }
    }

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    const toggleSidebarCollapse = () => {
        setSidebarCollapsed(!sidebarCollapsed)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando analytics...</p>
                </div>
            </div>
        )
    }

    return (
        <AdminLayout
            title="Analytics & Reportes"
            subtitle="Métricas avanzadas y análisis del sistema multi-tenant"
        >
            {/* Organization Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <label className="text-sm font-medium text-gray-700">Filtrar por Organización:</label>
                    </div>
                    <select
                        value={selectedOrganization}
                        onChange={(e) => setSelectedOrganization(e.target.value)}
                        className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        <option value="">Todas las organizaciones</option>
                        {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                                {org.name} ({org._count?.users || 0} usuarios, {org._count?.projects || 0} proyectos)
                            </option>
                        ))}
                    </select>
                    {selectedOrganization && (
                        <button
                            onClick={() => setSelectedOrganization('')}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpiar filtro
                        </button>
                    )}
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => {
                                setSelectedModule('')
                                setSelectedAction('')
                                setSelectedPlan('')
                            }}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpiar todos
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Module Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Módulo</label>
                        <select
                            value={selectedModule}
                            onChange={(e) => setSelectedModule(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="">Todos los módulos</option>
                            {analytics?.moduleUsage?.map((module) => (
                                <option key={module.module} value={module.module}>
                                    {mapModuleName(module.module)} ({module.sessions} sesiones)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Action Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Acción</label>
                        <select
                            value={selectedAction}
                            onChange={(e) => setSelectedAction(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="">Todas las acciones</option>
                            {analytics?.actionTypes?.map((action) => (
                                <option key={action.action} value={action.action}>
                                    {mapActionType(action.action)} ({action.users} usuarios)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Plan Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Plan de Suscripción</label>
                        <select
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="">Todos los planes</option>
                            {analytics?.planUsage?.map((plan) => (
                                <option key={plan.plan} value={plan.plan}>
                                    {mapSubscriptionPlan(plan.plan)} ({plan.users} usuarios)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex flex-wrap">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 md:flex-none py-4 px-4 md:px-8 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="hidden md:inline">Resumen General</span>
                                <span className="md:hidden">Resumen</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('modules')}
                            className={`flex-1 md:flex-none py-4 px-4 md:px-8 border-b-2 font-medium text-sm transition-colors ${activeTab === 'modules'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span className="hidden md:inline">Uso por Módulo</span>
                                <span className="md:hidden">Módulos</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('actions')}
                            className={`flex-1 md:flex-none py-4 px-4 md:px-8 border-b-2 font-medium text-sm transition-colors ${activeTab === 'actions'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="hidden md:inline">Tipos de Acción</span>
                                <span className="md:hidden">Acciones</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('plans')}
                            className={`flex-1 md:flex-none py-4 px-4 md:px-8 border-b-2 font-medium text-sm transition-colors ${activeTab === 'plans'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="hidden md:inline">Planes de Suscripción</span>
                                <span className="md:hidden">Planes</span>
                            </div>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && analytics?._meta && (
                <div className={`mb-6 p-4 rounded-lg border-l-4 shadow-sm ${analytics._meta.dataSource === 'google-analytics'
                    ? 'bg-green-50 border-green-500 text-green-800'
                    : analytics._meta.dataSource === 'demo'
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                        : 'bg-red-50 border-red-500 text-red-800'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {analytics._meta.dataSource === 'google-analytics' ? (
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            )}
                            <div>
                                <span className="font-semibold">
                                    {analytics._meta.dataSource === 'google-analytics' ? 'Datos en Vivo' :
                                        analytics._meta.dataSource === 'demo' ? 'Datos de Demostración' : 'Error de Configuración'}
                                </span>
                                <p className="text-sm opacity-90 mt-1">{analytics._meta.message}</p>
                            </div>
                        </div>
                        <span className="text-xs opacity-75">
                            Actualizado: {new Date(analytics._meta.lastUpdated).toLocaleString('es-ES')}
                        </span>
                    </div>
                    {analytics._meta.error && (
                        <p className="text-xs mt-2 opacity-75">Error: {analytics._meta.error}</p>
                    )}
                </div>
            )}

            {/* Analytics Error Display */}
            {analytics?.error && (
                <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-800 mb-2">{analytics.error}</h3>
                            <p className="text-red-700 mb-4">{analytics.message}</p>

                            {/* Next Steps */}
                            {analytics.nextSteps && analytics.nextSteps.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-red-800 mb-2">Pasos para solucionar:</h4>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-red-700 pl-4">
                                        {analytics.nextSteps.map((step, index) => (
                                            <li key={index}>{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* Possible Reasons */}
                            {analytics.possibleReasons && analytics.possibleReasons.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-red-800 mb-2">Posibles causas:</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700 pl-4">
                                        {analytics.possibleReasons.map((reason, index) => (
                                            <li key={index}>{reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={() => fetchAnalytics()}
                                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Key Metrics */}
            {analytics && !analytics.error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                                <p className="text-2xl md:text-3xl font-bold text-gray-900">{analytics?.totalUsers.toLocaleString()}</p>
                                <p className="text-green-600 text-sm">+{analytics?.userGrowth}% este mes</p>
                            </div>
                            <div className="p-2 md:p-3 bg-blue-50 rounded-full">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Organizaciones</p>
                                <p className="text-2xl md:text-3xl font-bold text-gray-900">{analytics?.totalOrganizations}</p>
                                <p className="text-green-600 text-sm">+{analytics?.monthlyGrowth}% crecimiento</p>
                            </div>
                            <div className="p-2 md:p-3 bg-green-50 rounded-full">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Page Views</p>
                                <p className="text-2xl md:text-3xl font-bold text-gray-900">{analytics?.pageViews?.toLocaleString()}</p>
                                <p className="text-green-600 text-sm">+18.2% vs mes anterior</p>
                            </div>
                            <div className="p-2 md:p-3 bg-blue-50 rounded-full">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Sesiones</p>
                                <p className="text-2xl md:text-3xl font-bold text-gray-900">{analytics?.sessions?.toLocaleString()}</p>
                                <p className="text-green-600 text-sm">+12.8% vs mes anterior</p>
                            </div>
                            <div className="p-2 md:p-3 bg-green-50 rounded-full">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tasa de Rebote</p>
                                <p className="text-2xl md:text-3xl font-bold text-gray-900">{analytics?.bounceRate?.toFixed(1)}%</p>
                                <p className="text-red-600 text-sm">-2.1% vs mes anterior</p>
                            </div>
                            <div className="p-2 md:p-3 bg-red-50 rounded-full">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Duración Promedio</p>
                                <p className="text-2xl md:text-3xl font-bold text-gray-900">{Math.floor((analytics?.avgSessionDuration || 0) / 60)}:{String(Math.floor((analytics?.avgSessionDuration || 0) % 60)).padStart(2, '0')}</p>
                                <p className="text-green-600 text-sm">+5.4% vs mes anterior</p>
                            </div>
                            <div className="p-2 md:p-3 bg-purple-50 rounded-full">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            {analytics && !analytics.error && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
                    {/* User Growth Chart */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Crecimiento de Usuarios</h3>
                        <div className="h-48 md:h-64 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                    <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <p className="text-gray-600 text-sm md:text-base">Gráfico de crecimiento mensual</p>
                                <p className="text-gray-900 font-semibold">Próximamente</p>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Ingresos por Mes</h3>
                        <div className="h-48 md:h-64 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                    <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <p className="text-gray-600 text-sm md:text-base">Análisis de ingresos</p>
                                <p className="text-gray-900 font-semibold">Próximamente</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Actividad Reciente</h3>
                {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                        {analytics.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                            {activity.user.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-gray-900 text-sm">{activity.action}</p>
                                        <p className="text-gray-500 text-xs">{activity.user}</p>
                                    </div>
                                </div>
                                <span className="text-gray-500 text-xs">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 md:w-8 md:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 mb-2">No hay actividad reciente</p>
                        <p className="text-gray-500 text-sm">La actividad del sistema aparecerá aquí cuando haya acciones realizadas</p>
                    </div>
                )}
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                {/* Top Pages */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Páginas Más Visitadas</h3>
                    <div className="space-y-3">
                        {analytics?.topPages?.slice(0, 5).map((page, index) => (
                            <div key={index} className="flex items-center justify-between py-2">
                                <div className="flex-1">
                                    <p className="text-gray-900 text-sm font-medium truncate">
                                        {page.pagePath === '/' ? 'Inicio' : page.pagePath}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        {page.activeUsers} usuarios activos
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-900 text-sm font-bold">
                                        {page.pageViews.toLocaleString()}
                                    </p>
                                    <p className="text-gray-500 text-xs">visitas</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Traffic Sources */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Fuentes de Tráfico</h3>
                    <div className="space-y-3">
                        {analytics?.trafficSources?.slice(0, 5).map((source, index) => (
                            <div key={index} className="flex items-center justify-between py-2">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${source.source === 'organic' ? 'bg-green-400' :
                                        source.source === 'direct' ? 'bg-blue-400' :
                                            source.source === 'referral' ? 'bg-purple-400' :
                                                source.source === 'social' ? 'bg-pink-400' : 'bg-gray-400'
                                        }`}></div>
                                    <span className="text-gray-900 text-sm capitalize">
                                        {source.source === 'organic' ? 'Orgánico' :
                                            source.source === 'direct' ? 'Directo' :
                                                source.source === 'referral' ? 'Referencia' :
                                                    source.source === 'social' ? 'Redes Sociales' :
                                                        source.source}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-900 text-sm font-bold">
                                        {source.sessions.toLocaleString()}
                                    </p>
                                    <p className="text-gray-500 text-xs">{source.percentage}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Acquisition */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Adquisición de Usuarios</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Usuarios Nuevos</span>
                            <div className="text-right">
                                <p className="text-gray-900 font-bold">{analytics?.userAcquisition?.newUsers?.toLocaleString()}</p>
                                <p className="text-green-600 text-sm">{analytics?.userAcquisition?.newUsersPercentage}% del total</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Usuarios Retornantes</span>
                            <div className="text-right">
                                <p className="text-gray-900 font-bold">{analytics?.userAcquisition?.returningUsers?.toLocaleString()}</p>
                                <p className="text-gray-500 text-sm">{100 - (analytics?.userAcquisition?.newUsersPercentage || 0)}% del total</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                                    style={{ width: `${analytics?.userAcquisition?.newUsersPercentage}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Nuevos</span>
                                <span>Retornantes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Device Categories */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Dispositivos</h3>
                    <div className="space-y-3">
                        {analytics?.deviceCategories?.map((device, index) => (
                            <div key={index} className="flex items-center justify-between py-2">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${device.device === 'desktop' ? 'bg-blue-400' :
                                        device.device === 'mobile' ? 'bg-green-400' :
                                            device.device === 'tablet' ? 'bg-purple-400' : 'bg-gray-400'
                                        }`}></div>
                                    <span className="text-gray-900 text-sm capitalize">
                                        {device.device === 'desktop' ? 'Escritorio' :
                                            device.device === 'mobile' ? 'Móvil' :
                                                device.device === 'tablet' ? 'Tablet' :
                                                    device.device}
                                    </span>
                                </div>
                                <div className="flex-1 ml-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${device.device === 'desktop' ? 'bg-blue-400' :
                                                device.device === 'mobile' ? 'bg-green-400' :
                                                    device.device === 'tablet' ? 'bg-purple-400' : 'bg-gray-400'
                                                }`}
                                            style={{ width: `${device.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="text-gray-900 text-sm font-bold">
                                        {device.sessions.toLocaleString()}
                                    </p>
                                    <p className="text-gray-500 text-xs">{device.percentage}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modules Tab */}
            {activeTab === 'modules' && (
                <div className="space-y-6 md:space-y-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Uso por Módulos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {analytics?.moduleUsage?.map((module, index) => (
                                <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 md:p-6 border border-blue-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-base md:text-lg font-semibold text-gray-900 capitalize">
                                            {mapModuleName(module.module)}
                                        </h4>
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Sesiones</span>
                                            <span className="text-base md:text-lg font-bold text-gray-900">{module.sessions.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Page Views</span>
                                            <span className="text-base md:text-lg font-bold text-gray-900">{module.pageViews.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Duración Promedio</span>
                                            <span className="text-base md:text-lg font-bold text-gray-900">
                                                {Math.floor(module.avgSessionDuration / 60)}:{String(Math.floor(module.avgSessionDuration % 60)).padStart(2, '0')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
                <div className="space-y-6 md:space-y-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Tipos de Acción</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {analytics?.actionTypes?.map((action, index) => (
                                <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 md:p-6 border border-green-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-base md:text-lg font-semibold text-gray-900 capitalize">
                                            {mapActionType(action.action)}
                                        </h4>
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Usuarios</span>
                                            <span className="text-base md:text-lg font-bold text-gray-900">{action.users.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Sesiones</span>
                                            <span className="text-base md:text-lg font-bold text-gray-900">{action.sessions.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Tasa de Conversión</span>
                                            <span className="text-base md:text-lg font-bold text-gray-900">
                                                {action.sessions > 0 ? ((action.users / action.sessions) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
                <div className="space-y-6 md:space-y-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Planes de Suscripción</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {analytics?.planUsage?.map((plan, index) => (
                                <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 md:p-6 border border-purple-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-base md:text-lg font-semibold text-gray-900 capitalize">
                                            {mapSubscriptionPlan(plan.plan)}
                                        </h4>
                                        <div className="p-2 bg-purple-100 rounded-full">
                                            <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Usuarios</span>
                                            <span className="text-base md:text-lg font-bold text-gray-900">{plan.users.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Sesiones</span>
                                            <span className="text-base md:text-lg font-bold text-gray-900">{plan.sessions.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Page Views</span>
                                            <span className="text-base md:text-lg font-bold text-gray-900">{plan.pageViews.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Sesiones por Usuario</span>
                                            <span className="text-base md:text-lg font-bold text-gray-900">
                                                {plan.users > 0 ? (plan.sessions / plan.users).toFixed(1) : 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
