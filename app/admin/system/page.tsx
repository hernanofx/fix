'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Menu, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface SystemInfo {
    version: string
    uptime: string
    databaseStatus: 'online' | 'offline' | 'maintenance'
    serverLoad: number
    memoryUsage: number
    diskUsage: number
    lastBackup: string
    activeConnections: number
}

interface SystemConfig {
    maintenanceMode: boolean
    emailNotifications: boolean
    autoBackup: boolean
    debugMode: boolean
    maxFileSize: number
    sessionTimeout: number
}

interface SystemHealth {
    overallStatus: 'healthy' | 'warning' | 'critical'
    timestamp: string
    version: string
    environment: string
    healthChecks: Array<{
        service: string
        status: 'healthy' | 'warning' | 'critical'
        responseTime?: number
        message: string
    }>
    metrics: {
        totalOrganizations: number
        totalUsers: number
        totalProjects: number
        activeUsers: number
        recentErrors: number
        systemLoad: number
    }
    summary: {
        totalServices: number
        healthyServices: number
        unhealthyServices: number
        healthPercentage: number
    }
}

interface MaintenanceTask {
    id: string
    name: string
    description: string
    type: 'cache_cleanup' | 'database_optimization' | 'filesystem_check' | 'log_cleanup' | 'backup' | 'dependency_update'
    status: 'ready' | 'running' | 'completed' | 'failed' | 'scheduled'
    lastExecuted?: string
    nextScheduled?: string
    executionTime?: number
    result?: string
}

interface SecurityConfig {
    maxLoginAttempts: number
    lockoutDuration: number
    passwordMinLength: number
    passwordExpiryDays: number
    sessionTimeout: number
    requireTwoFactor: boolean
    enableRateLimiting: boolean
    rateLimitRequests: number
    rateLimitWindow: number
    enableAuditLogging: boolean
    enableBruteForceProtection: boolean
}

interface SystemReports {
    summary: {
        totalOrganizations: number
        totalUsers: number
        totalProjects: number
        activeUsers: number
        newUsers: number
        newProjects: number
        totalBills: number
        paidBills: number
        totalRevenue: number
        conversionRate: number
    }
    distributions: {
        plans: Array<{
            plan: string
            count: number
            percentage: number
        }>
    }
    trends: {
        dailyActivity: Array<{
            date: string
            newUsers: number
            newProjects: number
            newBills: number
            totalActivity: number
        }>
    }
}

export default function SystemPage() {
    const { data: session } = useSession()
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
    const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
    const [systemReports, setSystemReports] = useState<SystemReports | null>(null)
    const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([])
    const [securityConfig, setSecurityConfig] = useState<SecurityConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [maintenanceLoading, setMaintenanceLoading] = useState<string | null>(null)
    const [securityLoading, setSecurityLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (session?.user) {
            fetchSystemData()
        }
    }, [session])

    const fetchSystemData = async () => {
        if (!session?.user?.organizationId) {
            setError('No se pudo obtener la información de la organización')
            setLoading(false)
            return
        }

        const organizationId = session.user.organizationId

        try {
            setError(null)

            // Fetch real system metrics from API
            const [metricsResponse, reportsResponse, maintenanceResponse, securityResponse, maintenanceModeResponse] = await Promise.all([
                fetch('/api/system/metrics'),
                fetch('/api/system/reports?type=usage&period=30d'),
                fetch(`/api/system/maintenance?organizationId=${organizationId}`),
                fetch(`/api/system/security?organizationId=${organizationId}`),
                fetch('/api/system/maintenance-mode')
            ])

            const metricsData = await metricsResponse.json()
            const reportsData = await reportsResponse.json()
            const maintenanceData = await maintenanceResponse.json()
            const securityData = await securityResponse.json()
            const maintenanceModeData = await maintenanceModeResponse.json()

            if (metricsData.success) {
                const realData = metricsData.data

                // Map API response to component state
                const systemInfo: SystemInfo = {
                    version: realData.version,
                    uptime: realData.uptime,
                    databaseStatus: realData.databaseStatus,
                    serverLoad: realData.serverLoad,
                    memoryUsage: realData.memoryUsage,
                    diskUsage: realData.diskUsage,
                    lastBackup: realData.lastBackup,
                    activeConnections: realData.activeConnections
                }

                const systemConfig: SystemConfig = {
                    maintenanceMode: maintenanceModeData.success ? maintenanceModeData.data.maintenanceMode : false,
                    emailNotifications: true,
                    autoBackup: true,
                    debugMode: false,
                    maxFileSize: 50,
                    sessionTimeout: 30
                }

                const systemHealth: SystemHealth = {
                    overallStatus: realData.overallStatus,
                    timestamp: realData.timestamp,
                    version: realData.version,
                    environment: realData.environment,
                    healthChecks: realData.healthChecks,
                    metrics: realData.metrics,
                    summary: realData.summary
                }

                setSystemInfo(systemInfo)
                setSystemConfig(systemConfig)
                setSystemHealth(systemHealth)
            } else {
                console.error('API Error:', metricsData.error)
                setError(`Error al cargar métricas del sistema: ${metricsData.error}`)
            }

            if (reportsData.success) {
                setSystemReports(reportsData.data)
            } else {
                console.error('Reports API Error:', reportsData.error)
            }

            if (maintenanceData.success) {
                setMaintenanceTasks(maintenanceData.data || [])
            } else {
                console.error('Maintenance API Error:', maintenanceData.error)
                setError(`Error al cargar tareas de mantenimiento: ${maintenanceData.error}`)
            }

            if (securityData.success) {
                setSecurityConfig(securityData.data)
            } else {
                console.error('Security API Error:', securityData.error)
                setError(`Error al cargar configuración de seguridad: ${securityData.error}`)
            }

        } catch (error) {
            console.error('Error fetching system data:', error)
            setError('Error al cargar la información del sistema. Verifica tu conexión a internet.')
        } finally {
            setLoading(false)
        }
    }

    const handleConfigChange = (key: keyof SystemConfig, value: any) => {
        if (systemConfig) {
            setSystemConfig({
                ...systemConfig,
                [key]: value
            })
        }
    }

    const handleSecurityConfigChange = (key: keyof SecurityConfig, value: any) => {
        if (securityConfig) {
            setSecurityConfig({
                ...securityConfig,
                [key]: value
            })
        }
    }

    const saveConfiguration = async () => {
        if (!session?.user?.organizationId) {
            alert('No se pudo obtener la información de la organización')
            return
        }

        try {
            // Si se está cambiando el modo mantenimiento, usar la API específica
            if (systemConfig && systemConfig.maintenanceMode !== (process.env.MAINTENANCE_MODE === 'true')) {
                const response = await fetch('/api/system/maintenance-mode', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: systemConfig.maintenanceMode ? 'enable' : 'disable',
                        reason: 'Configurado desde panel de administración',
                        organizationId: session.user.organizationId,
                        userId: session.user.id
                    })
                })

                const result = await response.json()

                if (!result.success) {
                    alert(`Error al cambiar modo mantenimiento: ${result.error}`)
                    return
                }

                alert(result.data.message)
            } else {
                // Para otras configuraciones, mostrar mensaje genérico
                alert('Configuración guardada exitosamente')
            }

            // Recargar datos para mostrar cambios
            await fetchSystemData()

        } catch (error) {
            console.error('Error saving configuration:', error)
            alert('Error al guardar la configuración')
        }
    }

    const executeMaintenanceTask = async (taskId: string) => {
        if (!session?.user?.organizationId) {
            alert('No se pudo obtener la información de la organización')
            return
        }

        try {
            setMaintenanceLoading(taskId)

            // Update task status to running
            setMaintenanceTasks(prev => prev.map(task =>
                task.id === taskId ? { ...task, status: 'running' as const } : task
            ))

            const response = await fetch('/api/system/maintenance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    taskId,
                    organizationId: session.user.organizationId,
                    userId: session.user.id
                })
            })

            const result = await response.json()

            if (result.success) {
                // Update task status and result
                setMaintenanceTasks(prev => prev.map(task =>
                    task.id === taskId ? {
                        ...task,
                        status: 'completed' as const,
                        lastExecuted: new Date().toISOString(),
                        executionTime: result.data.executionTime,
                        result: result.data.result
                    } : task
                ))

                alert(`Tarea "${result.data.taskName}" ejecutada exitosamente`)
            } else {
                // Update task status to failed
                setMaintenanceTasks(prev => prev.map(task =>
                    task.id === taskId ? {
                        ...task,
                        status: 'failed' as const,
                        result: result.error
                    } : task
                ))

                alert(`Error al ejecutar tarea: ${result.error}`)
            }
        } catch (error) {
            console.error('Error executing maintenance task:', error)
            alert('Error al ejecutar la tarea de mantenimiento')

            // Reset task status
            setMaintenanceTasks(prev => prev.map(task =>
                task.id === taskId ? { ...task, status: 'ready' as const } : task
            ))
        } finally {
            setMaintenanceLoading(null)
        }
    }

    const saveSecurityConfiguration = async () => {
        if (!securityConfig || !session?.user?.organizationId) {
            alert('Configuración o información de organización no disponible')
            return
        }

        try {
            setSecurityLoading(true)

            const response = await fetch('/api/system/security', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    organizationId: session.user.organizationId,
                    userId: session.user.id,
                    config: securityConfig
                })
            })

            const result = await response.json()

            if (result.success) {
                alert('Configuración de seguridad guardada exitosamente')
                // Recargar configuración para mostrar los cambios
                await fetchSystemData()
            } else {
                alert(`Error al guardar configuración: ${result.error}`)
            }
        } catch (error) {
            console.error('Error saving security configuration:', error)
            alert('Error al guardar la configuración de seguridad')
        } finally {
            setSecurityLoading(false)
        }
    }

    const handleViewLogs = async () => {
        try {
            // Abrir logs en una nueva ventana o modal
            window.open('/admin/system/logs', '_blank')
        } catch (error) {
            console.error('Error al abrir logs:', error)
            alert('Error al abrir la vista de logs')
        }
    }

    const handleManualBackup = async () => {
        if (!confirm('¿Está seguro de que desea crear un backup manual? Esta operación puede tomar varios minutos.')) {
            return
        }

        try {
            const response = await fetch('/api/system/backup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'database'
                })
            })

            const result = await response.json()

            if (result.success) {
                alert(`Backup creado exitosamente:\n${result.data.message}\n\nArchivo: ${result.data.filename}`)
                // Recargar datos para mostrar el nuevo backup
                await fetchSystemData()
            } else {
                alert(`Error al crear backup: ${result.error}`)
            }
        } catch (error) {
            console.error('Error al crear backup:', error)
            alert('Error al crear backup manual')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información del sistema...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar el sistema</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => {
                            setLoading(true)
                            setError(null)
                            fetchSystemData()
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <AdminLayout
            title="Sistema & Configuración"
            subtitle="Monitoreo y configuración del sistema Pix"
        >
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-4">
                    <button
                        onClick={handleViewLogs}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                        Ver Logs
                    </button>
                    <button
                        onClick={handleManualBackup}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                    >
                        Backup Manual
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    {[
                        { id: 'overview', label: 'Vista General', icon: '📊' },
                        { id: 'reports', label: 'Reportes', icon: '📈' },
                        { id: 'config', label: 'Configuración', icon: '⚙️' },
                        { id: 'maintenance', label: 'Mantenimiento', icon: '🔧' },
                        { id: 'security', label: 'Seguridad', icon: '🔒' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    {/* System Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Estado Base de Datos</p>
                                    <p className={`text-lg font-bold ${systemInfo?.databaseStatus === 'online' ? 'text-green-600' :
                                        systemInfo?.databaseStatus === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {systemInfo?.databaseStatus === 'online' ? 'En línea' :
                                            systemInfo?.databaseStatus === 'maintenance' ? 'Mantenimiento' : 'Fuera de línea'}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${systemInfo?.databaseStatus === 'online' ? 'bg-green-50' :
                                    systemInfo?.databaseStatus === 'maintenance' ? 'bg-yellow-50' : 'bg-red-50'
                                    }`}>
                                    <svg className={`w-6 h-6 ${systemInfo?.databaseStatus === 'online' ? 'text-green-600' :
                                        systemInfo?.databaseStatus === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Carga del Servidor</p>
                                    <p className="text-2xl font-bold text-gray-900">{systemInfo?.serverLoad}%</p>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                                            style={{ width: `${systemInfo?.serverLoad}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Memoria RAM</p>
                                    <p className="text-2xl font-bold text-gray-900">{systemInfo?.memoryUsage}%</p>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                                            style={{ width: `${systemInfo?.memoryUsage}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Conexiones Activas</p>
                                    <p className="text-2xl font-bold text-gray-900">{systemInfo?.activeConnections}</p>
                                    <p className="text-gray-500 text-sm">Usuarios conectados</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Información del Sistema</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Versión del Sistema:</span>
                                    <span className="text-gray-900 font-medium">{systemInfo?.version}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tiempo de Actividad:</span>
                                    <span className="text-gray-900 font-medium">{systemInfo?.uptime}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Último Backup:</span>
                                    <span className="text-gray-900 font-medium">{systemInfo?.lastBackup}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Uso de Disco:</span>
                                    <span className="text-gray-900 font-medium">{systemInfo?.diskUsage}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Estado de Servicios</h3>
                            <div className="space-y-3">
                                {systemHealth?.healthChecks.map((service, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-gray-600">{service.service}</span>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${service.status === 'healthy' ? 'bg-green-400' :
                                                service.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                                                }`} />
                                            <span className={`text-sm font-medium ${service.status === 'healthy' ? 'text-green-600' :
                                                service.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {service.status === 'healthy' ? 'En línea' :
                                                    service.status === 'warning' ? 'Advertencia' : 'Fuera de línea'}
                                            </span>
                                            {service.responseTime && (
                                                <span className="text-xs text-gray-500">
                                                    {service.responseTime}ms
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="space-y-8">
                    {/* Report Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Organizaciones</p>
                                    <p className="text-2xl font-bold text-gray-900">{systemReports?.summary.totalOrganizations || 0}</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Usuarios Activos</p>
                                    <p className="text-2xl font-bold text-gray-900">{systemReports?.summary.activeUsers || 0}</p>
                                    <p className="text-gray-500 text-sm">+{systemReports?.summary.newUsers || 0} nuevos</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Ingresos Totales</p>
                                    <p className="text-2xl font-bold text-gray-900">${(systemReports?.summary.totalRevenue || 0).toLocaleString()}</p>
                                    <p className="text-gray-500 text-sm">{systemReports?.summary.conversionRate.toFixed(1) || 0}% conversión</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Proyectos Activos</p>
                                    <p className="text-2xl font-bold text-gray-900">{systemReports?.summary.totalProjects || 0}</p>
                                    <p className="text-gray-500 text-sm">+{systemReports?.summary.newProjects || 0} nuevos</p>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-lg">
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Plan Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Distribución por Plan</h3>
                            <div className="space-y-4">
                                {systemReports?.distributions.plans.map((plan, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-3 h-3 rounded-full ${plan.plan === 'BASIC' ? 'bg-blue-400' :
                                                plan.plan === 'PROFESSIONAL' ? 'bg-green-400' : 'bg-purple-400'
                                                }`} />
                                            <span className="text-gray-900 font-medium">{plan.plan}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-600">{plan.count} orgs</span>
                                            <span className="text-sm text-gray-500">({plan.percentage}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                            <div className="space-y-3">
                                {systemReports?.trends.dailyActivity.slice(-7).map((day, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                        <span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                                        <div className="flex items-center space-x-4 text-sm">
                                            <span className="text-blue-600">+{day.newUsers} usuarios</span>
                                            <span className="text-green-600">+{day.newProjects} proyectos</span>
                                            <span className="text-purple-600">+{day.newBills} facturas</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Export Options */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Exportar Reportes</h3>
                        <div className="flex flex-wrap gap-4">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                📊 Reporte Completo (PDF)
                            </button>
                            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                📈 Datos en Excel
                            </button>
                            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                📧 Enviar por Email
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'config' && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Configuración del Sistema</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-gray-900 font-medium">Modo Mantenimiento</label>
                                    <p className="text-gray-500 text-sm">Deshabilitar acceso público</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={systemConfig?.maintenanceMode}
                                        onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-gray-900 font-medium">Notificaciones Email</label>
                                    <p className="text-gray-500 text-sm">Enviar alertas por email</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={systemConfig?.emailNotifications}
                                        onChange={(e) => handleConfigChange('emailNotifications', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-gray-900 font-medium">Backup Automático</label>
                                    <p className="text-gray-500 text-sm">Realizar backups diarios</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={systemConfig?.autoBackup}
                                        onChange={(e) => handleConfigChange('autoBackup', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-gray-900 font-medium">Modo Debug</label>
                                    <p className="text-gray-500 text-sm">Logs detallados del sistema</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={systemConfig?.debugMode}
                                        onChange={(e) => handleConfigChange('debugMode', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-900 font-medium mb-2">Tamaño Máximo de Archivo (MB)</label>
                                <input
                                    type="number"
                                    value={systemConfig?.maxFileSize}
                                    onChange={(e) => handleConfigChange('maxFileSize', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-900 font-medium mb-2">Tiempo de Sesión (minutos)</label>
                                <input
                                    type="number"
                                    value={systemConfig?.sessionTimeout}
                                    onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            onClick={saveConfiguration}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                        >
                            Guardar Configuración
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'maintenance' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Tareas de Mantenimiento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {maintenanceTasks.map((task) => (
                                <div key={task.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-gray-900 font-medium">{task.name}</h4>
                                        <div className={`w-2 h-2 rounded-full ${task.status === 'running' ? 'bg-blue-400' :
                                            task.status === 'scheduled' ? 'bg-yellow-400' :
                                                task.status === 'completed' ? 'bg-green-400' :
                                                    task.status === 'failed' ? 'bg-red-400' : 'bg-gray-400'
                                            }`} />
                                    </div>
                                    <p className="text-gray-500 text-sm mb-3">{task.description}</p>
                                    {task.lastExecuted && (
                                        <p className="text-xs text-gray-400 mb-2">
                                            Última ejecución: {new Date(task.lastExecuted).toLocaleString()}
                                        </p>
                                    )}
                                    {task.executionTime && (
                                        <p className="text-xs text-gray-400 mb-2">
                                            Tiempo: {task.executionTime}ms
                                        </p>
                                    )}
                                    <button
                                        onClick={() => executeMaintenanceTask(task.id)}
                                        disabled={task.status === 'running' || maintenanceLoading === task.id}
                                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${task.status === 'running' || maintenanceLoading === task.id
                                            ? 'bg-blue-600 text-white cursor-not-allowed'
                                            : task.status === 'scheduled'
                                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                                            }`}
                                    >
                                        {task.status === 'running' || maintenanceLoading === task.id ? 'Ejecutando...' :
                                            task.status === 'scheduled' ? 'Programado' :
                                                task.status === 'completed' ? 'Completado' : 'Ejecutar'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Historial de Mantenimiento</h3>
                        <div className="space-y-3">
                            {maintenanceTasks
                                .filter(task => task.lastExecuted)
                                .sort((a, b) => new Date(b.lastExecuted!).getTime() - new Date(a.lastExecuted!).getTime())
                                .map((task) => (
                                    <div key={task.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${task.status === 'completed' ? 'bg-green-50' :
                                                task.status === 'failed' ? 'bg-red-50' :
                                                    task.status === 'running' ? 'bg-blue-50' : 'bg-gray-50'
                                                }`}>
                                                <svg className={`w-4 h-4 ${task.status === 'completed' ? 'text-green-600' :
                                                    task.status === 'failed' ? 'text-red-600' :
                                                        task.status === 'running' ? 'text-blue-600' : 'text-gray-600'
                                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d={task.status === 'completed' ? "M5 13l4 4L19 7" :
                                                            task.status === 'failed' ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" :
                                                                "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-gray-900 text-sm font-medium">{task.name}</p>
                                                <p className="text-gray-500 text-xs">
                                                    {task.lastExecuted ? new Date(task.lastExecuted).toLocaleString() : 'Nunca ejecutado'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {task.executionTime && (
                                                <span className="text-xs text-gray-500">
                                                    {task.executionTime}ms
                                                </span>
                                            )}
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                task.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                    task.status === 'running' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {task.status === 'completed' ? 'Exitoso' :
                                                    task.status === 'failed' ? 'Error' :
                                                        task.status === 'running' ? 'Ejecutando' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Estado de Seguridad</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Firewall</span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                                        <span className="text-green-600 text-sm">Activo</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">SSL/TLS</span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                                        <span className="text-green-600 text-sm">Configurado</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">2FA Obligatorio</span>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${securityConfig?.requireTwoFactor ? 'bg-green-400' : 'bg-yellow-400'}`} />
                                        <span className={`text-sm ${securityConfig?.requireTwoFactor ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {securityConfig?.requireTwoFactor ? 'Habilitado' : 'Opcional'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Rate Limiting</span>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${securityConfig?.enableRateLimiting ? 'bg-green-400' : 'bg-red-400'}`} />
                                        <span className={`text-sm ${securityConfig?.enableRateLimiting ? 'text-green-600' : 'text-red-600'}`}>
                                            {securityConfig?.enableRateLimiting ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Protección Brute Force</span>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${securityConfig?.enableBruteForceProtection ? 'bg-green-400' : 'bg-red-400'}`} />
                                        <span className={`text-sm ${securityConfig?.enableBruteForceProtection ? 'text-green-600' : 'text-red-600'}`}>
                                            {securityConfig?.enableBruteForceProtection ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Auditoría</span>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${securityConfig?.enableAuditLogging ? 'bg-green-400' : 'bg-yellow-400'}`} />
                                        <span className={`text-sm ${securityConfig?.enableAuditLogging ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {securityConfig?.enableAuditLogging ? 'Habilitada' : 'Deshabilitada'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Últimas Alertas</h3>
                            <div className="space-y-3">
                                {[
                                    { type: 'Intento de acceso fallido', severity: 'medium', time: 'Hace 5 min', count: 3 },
                                    { type: 'IP bloqueada por rate limit', severity: 'low', time: 'Hace 1 hora', count: 1 },
                                    { type: 'Sesión sospechosa detectada', severity: 'high', time: 'Hace 2 horas', count: 1 },
                                    { type: 'Backup de seguridad completado', severity: 'info', time: 'Hace 4 horas', count: 1 }
                                ].map((alert, index) => (
                                    <div key={index} className="flex items-center justify-between py-2">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-2 h-2 rounded-full ${alert.severity === 'high' ? 'bg-red-400' :
                                                alert.severity === 'medium' ? 'bg-yellow-400' :
                                                    alert.severity === 'low' ? 'bg-blue-400' : 'bg-green-400'
                                                }`} />
                                            <span className="text-gray-900 text-sm">{alert.type}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500">{alert.time}</span>
                                            {alert.count > 1 && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                    {alert.count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Configuración de Seguridad</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-900 font-medium mb-2">Intentos Máximos de Login</label>
                                    <input
                                        type="number"
                                        value={securityConfig?.maxLoginAttempts || 5}
                                        onChange={(e) => handleSecurityConfigChange('maxLoginAttempts', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-900 font-medium mb-2">Tiempo de Bloqueo (minutos)</label>
                                    <input
                                        type="number"
                                        value={securityConfig?.lockoutDuration || 15}
                                        onChange={(e) => handleSecurityConfigChange('lockoutDuration', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-900 font-medium mb-2">Longitud Mínima Contraseña</label>
                                    <input
                                        type="number"
                                        value={securityConfig?.passwordMinLength || 8}
                                        onChange={(e) => handleSecurityConfigChange('passwordMinLength', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-900 font-medium mb-2">Días para Cambiar Contraseña</label>
                                    <input
                                        type="number"
                                        value={securityConfig?.passwordExpiryDays || 90}
                                        onChange={(e) => handleSecurityConfigChange('passwordExpiryDays', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-gray-900 font-medium">2FA Obligatorio</label>
                                        <p className="text-gray-500 text-sm">Requiere autenticación de dos factores</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={securityConfig?.requireTwoFactor || false}
                                            onChange={(e) => handleSecurityConfigChange('requireTwoFactor', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-gray-900 font-medium">Rate Limiting</label>
                                        <p className="text-gray-500 text-sm">Limitar solicitudes por IP</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={securityConfig?.enableRateLimiting || false}
                                            onChange={(e) => handleSecurityConfigChange('enableRateLimiting', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-gray-900 font-medium mb-2">Límite de Solicitudes</label>
                                    <input
                                        type="number"
                                        value={securityConfig?.rateLimitRequests || 100}
                                        onChange={(e) => handleSecurityConfigChange('rateLimitRequests', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-900 font-medium mb-2">Ventana de Rate Limit (min)</label>
                                    <input
                                        type="number"
                                        value={securityConfig?.rateLimitWindow || 15}
                                        onChange={(e) => handleSecurityConfigChange('rateLimitWindow', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={saveSecurityConfiguration}
                                disabled={securityLoading}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                            >
                                {securityLoading ? 'Guardando...' : 'Actualizar Seguridad'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
