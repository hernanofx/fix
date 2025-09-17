'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Building2, DollarSign, CreditCard, Users, TrendingUp, AlertTriangle, Clock, CheckCircle2, Plus, UserPlus, FileText, Search, MoreHorizontal, ArrowUpRight, ArrowDownRight, Activity, Calculator, User, ShoppingCart, BarChart3, Package, CheckSquare, Calendar, Truck, Filter, Download, Printer, Mail } from 'lucide-react'
import Layout from '@/components/Layout'
import RevenueExpenseChart from '@/components/RevenueExpenseChart'
import ExpensesByCategoryChart from '@/components/ExpensesByCategoryChart'
import ProjectProgressChart from '@/components/ProjectProgressChart'

// Componente para reportes financieros
function FinancialReports({ data }: { data: DashboardData }) {
    const [selectedReport, setSelectedReport] = useState<'revenue' | 'expenses' | 'profitability'>('revenue')

    return (
        <div className="space-y-8">
            {/* Report Selection */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Reportes Financieros</h3>
                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => setSelectedReport('revenue')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${selectedReport === 'revenue'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Ingresos
                    </button>
                    <button
                        onClick={() => setSelectedReport('expenses')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${selectedReport === 'expenses'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Egresos
                    </button>
                    <button
                        onClick={() => setSelectedReport('profitability')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${selectedReport === 'profitability'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Rentabilidad
                    </button>
                </div>

                {/* Report Actions */}
                <div className="flex space-x-3">
                    <button className="flex items-center space-x-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                        <Download className="h-4 w-4" />
                        <span>Exportar PDF</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                        <Printer className="h-4 w-4" />
                        <span>Imprimir</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                        <Mail className="h-4 w-4" />
                        <span>Enviar por Email</span>
                    </button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue vs Expenses Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-6">Ingresos vs Egresos</h4>
                    <RevenueExpenseChart data={data} />
                </div>

                {/* Expenses by Category */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-6">Distribución de Egresos</h4>
                    <ExpensesByCategoryChart data={data} />
                </div>
            </div>
        </div>
    )
}

// Componente para reportes de proyectos
function ProjectReports({ data }: { data: DashboardData }) {
    return (
        <div className="space-y-8">
            {/* Project Status Overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Estado de Proyectos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2">
                            {data.charts.projectProgress.filter(p => p.progress === 100).length}
                        </div>
                        <p className="text-slate-600">Completados</p>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                            {data.charts.projectProgress.filter(p => p.progress > 0 && p.progress < 100).length}
                        </div>
                        <p className="text-slate-600">En Progreso</p>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-slate-600 mb-2">
                            {data.charts.projectProgress.filter(p => p.progress === 0).length}
                        </div>
                        <p className="text-slate-600">Sin Iniciar</p>
                    </div>
                </div>
            </div>

            {/* Project Progress Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
                <h4 className="text-lg font-bold text-slate-900 mb-6">Progreso por Proyecto</h4>
                <ProjectProgressChart data={data} />
            </div>
        </div>
    )
}

// Componente para reportes de empleados
function EmployeeReports({ data }: { data: DashboardData }) {
    return (
        <div className="space-y-8">
            {/* Employee Overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Resumen de Empleados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="text-3xl font-bold text-slate-900 mb-2">{data.metrics.activeEmployees}</div>
                        <p className="text-slate-600">Empleados Activos</p>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">{data.metrics.employeesOnSite}</div>
                        <p className="text-slate-600">En Obra Hoy</p>
                    </div>
                </div>
            </div>

            {/* Assignments Overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
                <h4 className="text-lg font-bold text-slate-900 mb-6">Asignaciones de Empleados</h4>
                <div className="space-y-4">
                    {data.tasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-semibold text-slate-900">{task.employeeName}</p>
                                <p className="text-sm text-slate-600">{task.role} • {task.projectName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-900">{task.hoursPerWeek}h/semana</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${task.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {task.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

interface DashboardData {
    metrics: {
        activeProjects: number
        monthlyRevenue: number
        monthlyExpense: number
        monthlyRevenueByCurrency: { PESOS: number; USD: number; EUR: number }
        monthlyExpenseByCurrency: { PESOS: number; USD: number; EUR: number }
        activeEmployees: number
        employeesOnSite: number
        efficiency: number
        currentBalances?: {
            cashBoxes: { PESOS: number; USD: number; EUR: number }
            bankAccounts: { PESOS: number; USD: number; EUR: number }
            total: { PESOS: number; USD: number; EUR: number }
        }
    }
    recentProjects: Array<{
        id: string
        name: string
        status: string
        progress: number
        inspectionsCount: number
        timeTrackingCount: number
        invoicesCount: number
    }>
    alerts: {
        overdueInvoices: number
        pendingInspections: number
        overdueCollections: number
        overduePaymentTerms: number
        total: number
    }
    tasks: Array<{
        id: string
        employeeName: string
        employeePosition: string
        projectName: string
        role: string
        startDate: string
        endDate: string | null
        hoursPerWeek: number
        status: string
    }>
    planningTasks: Array<{
        id: string
        title: string
        description: string | null
        startDate: string | null
        endDate: string | null
        estimatedHours: number | null
        progress: number
        priority: string
        status: string
        projectName: string | null
        assigneeName: string | null
        rubroName: string | null
    }>
    charts: {
        monthlyRevenues: Array<{
            month: string
            revenue: number
            budgeted: number
            consumedByCurrency?: { PESOS: number; USD: number; EUR: number }
            budgetedByCurrency?: { PESOS: number; USD: number; EUR: number }
        }>
        projectProgress: Array<{ name: string; progress: number }>
        expensesByCategory: {
            labels: string[]
            data: number[]
            colors: string[]
            total: number
        }
    }
}

export default function ReportsPage() {
    const { data: session } = useSession()
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeReportType, setActiveReportType] = useState<'financial' | 'projects' | 'employees'>('financial')

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch('/api/dashboard')
                if (!res.ok) throw new Error('Error al cargar datos')
                const data = await res.json()
                setDashboardData(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        if (session) {
            fetchDashboardData()
        }
    }, [session])

    if (loading) {
        return (
            <Layout title="Reportes" subtitle="Análisis y reportes del sistema">
                <div className="flex justify-center items-center h-96">
                    <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
                        <span className="text-slate-600 font-medium">Cargando reportes...</span>
                    </div>
                </div>
            </Layout>
        )
    }

    if (error) {
        return (
            <Layout title="Reportes" subtitle="Análisis y reportes del sistema">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-red-800 font-medium">Error al cargar datos: {error}</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!dashboardData) {
        return (
            <Layout title="Reportes" subtitle="Análisis y reportes del sistema">
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
                    <span className="text-slate-600 font-medium">Cargando datos...</span>
                </div>
            </Layout>
        )
    }

    const data = dashboardData

    return (
        <Layout title="Reportes" subtitle="Análisis y reportes del sistema">
            <div className="space-y-8">
                {/* Header with Report Type Selection */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Centro de Reportes</h1>
                            <p className="text-slate-600">Análisis detallado de tu empresa de construcción</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setActiveReportType('financial')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${activeReportType === 'financial'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Financieros
                            </button>
                            <button
                                onClick={() => setActiveReportType('projects')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${activeReportType === 'projects'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Proyectos
                            </button>
                            <button
                                onClick={() => setActiveReportType('employees')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${activeReportType === 'employees'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Empleados
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600 mb-1">
                                ${data.metrics.monthlyRevenueByCurrency.PESOS.toLocaleString()}
                            </div>
                            <p className="text-sm text-slate-600">Ingresos del Mes</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-rose-600 mb-1">
                                ${data.metrics.monthlyExpenseByCurrency.PESOS.toLocaleString()}
                            </div>
                            <p className="text-sm text-slate-600">Egresos del Mes</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900 mb-1">
                                {data.metrics.activeProjects}
                            </div>
                            <p className="text-sm text-slate-600">Proyectos Activos</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900 mb-1">
                                {data.metrics.activeEmployees}
                            </div>
                            <p className="text-sm text-slate-600">Empleados Activos</p>
                        </div>
                    </div>

                    {/* Current Balances Section */}
                    {data.metrics.currentBalances && (
                        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <h4 className="text-lg font-semibold text-slate-900 mb-4">Saldos Actuales</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-blue-600 mb-1">
                                        ${data.metrics.currentBalances.cashBoxes.PESOS.toLocaleString()}
                                    </div>
                                    <p className="text-sm text-slate-600">Saldo en Cajas</p>
                                    <div className="text-xs text-slate-500 mt-1">
                                        USD: ${data.metrics.currentBalances.cashBoxes.USD.toLocaleString()} |
                                        EUR: ${data.metrics.currentBalances.cashBoxes.EUR.toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-green-600 mb-1">
                                        ${data.metrics.currentBalances.bankAccounts.PESOS.toLocaleString()}
                                    </div>
                                    <p className="text-sm text-slate-600">Saldo en Bancos</p>
                                    <div className="text-xs text-slate-500 mt-1">
                                        USD: ${data.metrics.currentBalances.bankAccounts.USD.toLocaleString()} |
                                        EUR: ${data.metrics.currentBalances.bankAccounts.EUR.toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-purple-600 mb-1">
                                        ${data.metrics.currentBalances.total.PESOS.toLocaleString()}
                                    </div>
                                    <p className="text-sm text-slate-600">Saldo Total</p>
                                    <div className="text-xs text-slate-500 mt-1">
                                        USD: ${data.metrics.currentBalances.total.USD.toLocaleString()} |
                                        EUR: ${data.metrics.currentBalances.total.EUR.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Report Content */}
                {activeReportType === 'financial' && <FinancialReports data={data} />}
                {activeReportType === 'projects' && <ProjectReports data={data} />}
                {activeReportType === 'employees' && <EmployeeReports data={data} />}
            </div>
        </Layout>
    )
}
