'use client'

import Layout from '../../../components/Layout'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '../../../components/ToastProvider'

interface Employee {
    id: string
    firstName: string
    lastName: string
    position?: string
    department?: string
    hireDate?: string
    salary?: number
    email?: string
    phone?: string
}

interface TimeEntry {
    id: string
    date: string
    startTime: string
    endTime: string
    duration: number
    status: string
    employee: Employee
    project?: {
        id: string
        name: string
    }
}

interface Project {
    id: string
    name: string
    code?: string
    status: string
    startDate?: string
    endDate?: string
}

export default function EmployeeDashboard() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(false)
    const { data: session } = useSession()
    const toast = useToast()

    useEffect(() => {
        if (session?.user?.organizationId) {
            loadDashboardData()
        }
    }, [session])

    const loadDashboardData = async () => {
        if (!session?.user?.organizationId) return

        setLoading(true)
        try {
            const [employeesRes, timeRes, projectsRes] = await Promise.all([
                fetch(`/api/employees?organizationId=${session.user.organizationId}`),
                fetch(`/api/time-tracking?organizationId=${session.user.organizationId}`),
                fetch(`/api/projects?organizationId=${session.user.organizationId}`)
            ])

            if (employeesRes.ok) {
                const employeesData = await employeesRes.json()
                setEmployees(employeesData)
            }

            if (timeRes.ok) {
                const timeData = await timeRes.json()
                setTimeEntries(timeData)
            }

            if (projectsRes.ok) {
                const projectsData = await projectsRes.json()
                setProjects(projectsData)
            }
        } catch (error: any) {
            console.error(error)
            toast.error('Error al cargar datos del dashboard')
        } finally {
            setLoading(false)
        }
    }

    const dashboardStats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0]
        const thisWeek = new Date()
        thisWeek.setDate(thisWeek.getDate() - 7)
        const weekStart = thisWeek.toISOString().split('T')[0]

        // Active employees today
        const activeToday = timeEntries.filter(entry =>
            entry.date === today && entry.status === 'ACTIVO'
        ).length

        // Total hours this week
        const weeklyHours = timeEntries
            .filter(entry => entry.date >= weekStart)
            .reduce((sum, entry) => sum + (entry.duration || 0) / 60, 0)

        // Employees with completed entries today
        const completedToday = new Set(
            timeEntries
                .filter(entry => entry.date === today && entry.status === 'COMPLETADO')
                .map(entry => entry.employee.id)
        ).size

        // Active projects
        const activeProjects = projects.filter(project =>
            project.status === 'IN_PROGRESS' || project.status === 'PLANNING'
        ).length

        // Average hours per employee this week
        const avgHoursPerEmployee = employees.length > 0 ? weeklyHours / employees.length : 0

        return {
            totalEmployees: employees.length,
            activeToday,
            completedToday,
            weeklyHours,
            activeProjects,
            avgHoursPerEmployee
        }
    }, [employees, timeEntries, projects])

    const recentActivity = useMemo(() => {
        return timeEntries
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
    }, [timeEntries])

    const topEmployees = useMemo(() => {
        const employeeStats = timeEntries.reduce((acc, entry) => {
            const employeeId = entry.employee.id
            const employeeName = `${entry.employee.firstName} ${entry.employee.lastName}`

            if (!acc[employeeId]) {
                acc[employeeId] = {
                    name: employeeName,
                    hours: 0,
                    entries: 0,
                    position: entry.employee.position
                }
            }

            acc[employeeId].hours += (entry.duration || 0) / 60
            acc[employeeId].entries += 1

            return acc
        }, {} as Record<string, { name: string, hours: number, entries: number, position?: string }>)

        return Object.values(employeeStats)
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 5)
    }, [timeEntries])

    if (loading) {
        return (
            <Layout title="Dashboard de Empleados" subtitle="Cargando datos...">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout
            title="Dashboard de Empleados"
            subtitle="Vista general del control de personal y tiempo"
        >
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Empleados</dt>
                                <dd className="text-2xl font-semibold text-gray-900">
                                    {dashboardStats.totalEmployees}
                                </dd>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <dt className="text-sm font-medium text-gray-500 truncate">Activos Hoy</dt>
                                <dd className="text-2xl font-semibold text-gray-900">
                                    {dashboardStats.activeToday}
                                </dd>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <dt className="text-sm font-medium text-gray-500 truncate">Horas Semanales</dt>
                                <dd className="text-2xl font-semibold text-gray-900">
                                    {dashboardStats.weeklyHours.toFixed(1)}h
                                </dd>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <dt className="text-sm font-medium text-gray-500 truncate">Proyectos Activos</dt>
                                <dd className="text-2xl font-semibold text-gray-900">
                                    {dashboardStats.activeProjects}
                                </dd>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <dt className="text-sm font-medium text-gray-500 truncate">Promedio por Empleado</dt>
                                <dd className="text-2xl font-semibold text-gray-900">
                                    {dashboardStats.avgHoursPerEmployee.toFixed(1)}h
                                </dd>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <dt className="text-sm font-medium text-gray-500 truncate">Completados Hoy</dt>
                                <dd className="text-2xl font-semibold text-gray-900">
                                    {dashboardStats.completedToday}
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Employees */}
                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Empleados Más Activos</h3>
                        <div className="space-y-3">
                            {topEmployees.map((employee, index) => (
                                <div key={employee.name} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">
                                                    {employee.name.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                                            <p className="text-sm text-gray-500">{employee.position || 'Sin posición'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{employee.hours.toFixed(1)}h</p>
                                        <p className="text-sm text-gray-500">{employee.entries} registros</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                        <div className="space-y-3">
                            {recentActivity.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className={`h-2 w-2 rounded-full ${entry.status === 'ACTIVO' ? 'bg-green-500' :
                                                    entry.status === 'COMPLETADO' ? 'bg-blue-500' : 'bg-gray-500'
                                                }`}></div>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">
                                                {entry.employee.firstName} {entry.employee.lastName}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {entry.project?.name || 'Sin proyecto'} • {new Date(entry.date).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.status === 'ACTIVO' ? 'bg-green-100 text-green-800' :
                                                entry.status === 'COMPLETADO' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {entry.status}
                                        </span>
                                        {entry.duration && (
                                            <p className="text-sm text-gray-500 mt-1">{(entry.duration / 60).toFixed(1)}h</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="/time-tracking"
                            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Control de Horas
                        </a>
                        <a
                            href="/time-tracking/reports"
                            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Ver Reportes
                        </a>
                        <a
                            href="/employees"
                            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Gestionar Empleados
                        </a>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
