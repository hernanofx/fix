'use client'

import { useState, useEffect } from 'react'
import AdminNavigation from '@/components/AdminNavigation'
import { Menu, X, Search, Filter, Download, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface SystemLog {
    id: string
    action: string
    details: any
    ipAddress: string
    userAgent: string
    createdAt: string
    user?: {
        id: string
        name: string
        email: string
    }
    organization?: {
        id: string
        name: string
        slug: string
    }
}

interface LogStats {
    action: string
    count: number
}

export default function SystemLogsPage() {
    const { data: session } = useSession()
    const [logs, setLogs] = useState<SystemLog[]>([])
    const [stats, setStats] = useState<LogStats[]>([])
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedAction, setSelectedAction] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        if (session?.user) {
            fetchLogs()
        }
    }, [session, currentPage, selectedAction, startDate, endDate])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '50'
            })

            if (selectedAction) params.append('action', selectedAction)
            if (startDate) params.append('startDate', startDate)
            if (endDate) params.append('endDate', endDate)

            const response = await fetch(`/api/system/logs?${params}`)
            const result = await response.json()

            if (result.success) {
                setLogs(result.data.logs)
                setStats(result.data.stats)
                setTotalPages(result.data.pagination.totalPages)
                setTotalCount(result.data.pagination.totalCount)
            } else {
                console.error('Error fetching logs:', result.error)
            }
        } catch (error) {
            console.error('Error fetching logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleClearFilters = () => {
        setSelectedAction('')
        setStartDate('')
        setEndDate('')
        setSearchTerm('')
        setCurrentPage(1)
    }

    const handleExportLogs = async () => {
        try {
            const params = new URLSearchParams()
            if (selectedAction) params.append('action', selectedAction)
            if (startDate) params.append('startDate', startDate)
            if (endDate) params.append('endDate', endDate)

            const response = await fetch(`/api/system/logs?${params}&export=csv`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            }
        } catch (error) {
            console.error('Error exporting logs:', error)
            alert('Error al exportar logs')
        }
    }

    const handleDeleteOldLogs = async () => {
        if (!confirm('¿Está seguro de que desea eliminar los logs de más de 30 días? Esta acción no se puede deshacer.')) {
            return
        }

        try {
            const response = await fetch('/api/system/logs?olderThan=30', {
                method: 'DELETE'
            })

            const result = await response.json()

            if (result.success) {
                alert(result.data.message)
                fetchLogs()
            } else {
                alert(`Error: ${result.error}`)
            }
        } catch (error) {
            console.error('Error deleting logs:', error)
            alert('Error al eliminar logs antiguos')
        }
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch = searchTerm === '' ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())

        return matchesSearch
    })

    const getActionColor = (action: string) => {
        switch (action) {
            case 'USER_LOGIN':
                return 'bg-green-100 text-green-800'
            case 'USER_LOGOUT':
                return 'bg-gray-100 text-gray-800'
            case 'MAINTENANCE_ENABLED':
                return 'bg-yellow-100 text-yellow-800'
            case 'MAINTENANCE_DISABLED':
                return 'bg-blue-100 text-blue-800'
            case 'BACKUP_CREATED':
                return 'bg-purple-100 text-purple-800'
            case 'SYSTEM_ERROR':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading && logs.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando logs del sistema...</p>
                </div>
            </div>
        )
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                            <h1 className="text-xl font-bold text-gray-900">Logs del Sistema</h1>
                            <div className="w-10" />
                        </div>
                    </div>

                    <div className="p-4 lg:p-8">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Logs del Sistema</h1>
                                    <p className="text-gray-600">Monitoreo de actividades y eventos del sistema</p>
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={handleExportLogs}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Exportar</span>
                                    </button>
                                    <button
                                        onClick={handleDeleteOldLogs}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Limpiar Antiguos</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm">Total de Logs</p>
                                        <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {stats.slice(0, 3).map((stat, index) => (
                                <div key={stat.action} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-600 text-sm">{stat.action.replace('_', ' ')}</p>
                                            <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <span className="text-2xl">📊</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
                                >
                                    <Filter className="w-4 h-4" />
                                    <span>{showFilters ? 'Ocultar' : 'Mostrar'} filtros</span>
                                </button>
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Buscar en logs..."
                                                className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Acción</label>
                                        <select
                                            value={selectedAction}
                                            onChange={(e) => setSelectedAction(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Todas las acciones</option>
                                            {stats.map(stat => (
                                                <option key={stat.action} value={stat.action}>
                                                    {stat.action.replace('_', ' ')} ({stat.count})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {showFilters && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleClearFilters}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        Limpiar Filtros
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Logs Table */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha/Hora
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acción
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Usuario
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Organización
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Detalles
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                                                        {log.action.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {log.user ? (
                                                        <div>
                                                            <div className="font-medium">{log.user.name}</div>
                                                            <div className="text-gray-500">{log.user.email}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">Sistema</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {log.organization ? (
                                                        <div>
                                                            <div className="font-medium">{log.organization.name}</div>
                                                            <div className="text-gray-500">{log.organization.slug}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">Global</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                                    <div className="truncate">
                                                        {log.details ? JSON.stringify(log.details) : '-'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredLogs.length === 0 && !loading && (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron logs</h3>
                                    <p className="text-gray-500">No hay logs que coincidan con los filtros aplicados.</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-gray-700">
                                    Mostrando {((currentPage - 1) * 50) + 1} a {Math.min(currentPage * 50, totalCount)} de {totalCount} logs
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <span className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                                        {currentPage} de {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}