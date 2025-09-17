"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import {
    Building2,
    DollarSign,
    CreditCard,
    Users,
    TrendingUp,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Plus,
    UserPlus,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Calculator,
    BarChart3,
    CheckSquare,
    Calendar,
    Filter,
    Truck,
    Package,
} from "lucide-react"
import { Bar, Doughnut, Chart as ChartComponent } from "react-chartjs-2"
import {
    Chart as ChartLib,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
} from "chart.js"

ChartLib.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
)
import Layout from "@/components/Layout"
import type { DashboardData } from "@/types"
import styles from "./dashboard.module.css"
import WeatherWidget from "@/components/WeatherWidget"

// Componente para la pestaña General
function GeneralTab({ data }: { data: DashboardData }) {
    return (
        <div className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Projects */}
                <div
                    className={`${styles.dashboardCard} bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group relative overflow-hidden`}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="p-2.5 rounded-lg group-hover:transition-colors"
                                    style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }}
                                >
                                    <Building2 className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
                                </div>
                                <p
                                    className="text-sm font-semibold uppercase tracking-wide"
                                    style={{ color: "hsl(var(--muted-foreground))" }}
                                >
                                    Proyectos Activos
                                </p>
                            </div>
                            <p className="text-3xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
                                {data.metrics.activeProjects}
                            </p>
                            <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-primary" />
                                <span className="text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
                                    +12% vs mes anterior
                                </span>
                            </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                    </div>
                </div>

                {/* Revenue */}
                <div
                    className={`${styles.dashboardCard} bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:shadow-chart-2/5 transition-all duration-300 group relative overflow-hidden`}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="p-2.5 rounded-lg group-hover:transition-colors"
                                    style={{ backgroundColor: "hsl(var(--chart-2) / 0.1)" }}
                                >
                                    <DollarSign className="h-5 w-5" style={{ color: "hsl(var(--chart-2))" }} />
                                </div>
                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ingresos del Mes</p>
                            </div>
                            <div className="space-y-1 mb-2">
                                {data.metrics.monthlyRevenueByCurrency.PESOS > 0 && (
                                    <p className="text-2xl font-bold text-foreground">
                                        ${data.metrics.monthlyRevenueByCurrency.PESOS.toLocaleString()}
                                    </p>
                                )}
                                {data.metrics.monthlyRevenueByCurrency.USD > 0 && (
                                    <p className="text-lg font-semibold text-chart-2">
                                        ${data.metrics.monthlyRevenueByCurrency.USD.toLocaleString()} USD
                                    </p>
                                )}
                                {data.metrics.monthlyRevenueByCurrency.EUR > 0 && (
                                    <p className="text-lg font-semibold text-chart-2">
                                        ${data.metrics.monthlyRevenueByCurrency.EUR.toLocaleString()} EUR
                                    </p>
                                )}
                                {data.metrics.monthlyRevenueByCurrency.PESOS === 0 &&
                                    data.metrics.monthlyRevenueByCurrency.USD === 0 &&
                                    data.metrics.monthlyRevenueByCurrency.EUR === 0 && (
                                        <p className="text-2xl font-bold text-foreground">$0</p>
                                    )}
                            </div>
                            <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-chart-2" />
                                <span className="text-xs font-medium text-chart-2">Cobranzas e ingresos</span>
                            </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-chart-2 group-hover:scale-110 transition-all duration-200" />
                    </div>
                </div>

                {/* Expenses */}
                <div
                    className={`${styles.dashboardCard} bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:shadow-destructive/5 transition-all duration-300 group relative overflow-hidden`}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="p-2.5 rounded-lg group-hover:transition-colors"
                                    style={{ backgroundColor: "hsl(var(--destructive) / 0.1)" }}
                                >
                                    <CreditCard className="h-5 w-5" style={{ color: "hsl(var(--destructive))" }} />
                                </div>
                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Egresos del Mes</p>
                            </div>
                            <div className="space-y-1 mb-2">
                                {data.metrics.monthlyExpenseByCurrency.PESOS > 0 && (
                                    <p className="text-2xl font-bold text-foreground">
                                        ${data.metrics.monthlyExpenseByCurrency.PESOS.toLocaleString()}
                                    </p>
                                )}
                                {data.metrics.monthlyExpenseByCurrency.USD > 0 && (
                                    <p className="text-lg font-semibold text-destructive">
                                        ${data.metrics.monthlyExpenseByCurrency.USD.toLocaleString()} USD
                                    </p>
                                )}
                                {data.metrics.monthlyExpenseByCurrency.EUR > 0 && (
                                    <p className="text-lg font-semibold text-destructive">
                                        ${data.metrics.monthlyExpenseByCurrency.EUR.toLocaleString()} EUR
                                    </p>
                                )}
                                {data.metrics.monthlyExpenseByCurrency.PESOS === 0 &&
                                    data.metrics.monthlyExpenseByCurrency.USD === 0 &&
                                    data.metrics.monthlyExpenseByCurrency.EUR === 0 && (
                                        <p className="text-2xl font-bold text-foreground">$0</p>
                                    )}
                            </div>
                            <div className="flex items-center gap-1">
                                <ArrowDownRight className="h-3 w-3" style={{ color: "hsl(var(--destructive))" }} />
                                <span className="text-xs font-medium" style={{ color: "hsl(var(--destructive))" }}>
                                    Pagos y gastos
                                </span>
                            </div>
                        </div>
                        <ArrowDownRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-destructive group-hover:scale-110 transition-all duration-200" />
                    </div>
                </div>

                {/* Employees */}
                <div
                    className={`${styles.dashboardCard} bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:shadow-chart-4/5 transition-all duration-300 group relative overflow-hidden`}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-chart-4/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-chart-4/10 rounded-lg group-hover:bg-chart-4/15 transition-colors">
                                    <Users className="h-5 w-5 text-chart-4" />
                                </div>
                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Empleados Activos</p>
                            </div>
                            <p className="text-3xl font-bold text-foreground mb-2">{data.metrics.activeEmployees}</p>
                            <div className="flex items-center gap-1">
                                <Activity className="h-3 w-3 text-chart-4" />
                                <span className="text-xs font-medium text-chart-4">{data.metrics.employeesOnSite} en obra hoy</span>
                            </div>
                        </div>
                        <Activity className="h-4 w-4 text-muted-foreground/40 group-hover:text-chart-4 group-hover:scale-110 transition-all duration-200" />
                    </div>
                </div>
            </div>

            {/* Main Dashboard Layout */}
            <div className="space-y-8">
                {/* Top Row: Alerts */}
                <div className="grid grid-cols-1 gap-8">
                    {/* Alerts */}
                    <div
                        className={`${styles.dashboardCard} bg-card border border-border rounded-xl p-8 hover:shadow-md transition-shadow duration-200`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-destructive/10 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                </div>
                                <h3 className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
                                    Alertas Importantes
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-destructive/10 text-destructive text-xs font-bold px-3 py-1.5 rounded-full border border-destructive/20">
                                    {data.alerts.total} nuevas
                                </span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {data.alerts.overdueInvoices > 0 && (
                                <div
                                    className={`${styles.dashboardAlert} flex items-start gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors`}
                                >
                                    <div className="w-2 h-2 bg-destructive rounded-full mt-3 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground mb-1">Facturas vencidas</p>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {data.alerts.overdueInvoices} facturas pendientes de pago
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-destructive" />
                                            <span className="text-xs font-medium text-destructive">Requieren atención inmediata</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {data.alerts.overdueCollections > 0 && (
                                <div
                                    className={`${styles.dashboardAlert} flex items-start gap-4 p-4 rounded-xl bg-chart-3/5 border border-chart-3/10 hover:bg-chart-3/10 transition-colors`}
                                >
                                    <div className="w-2 h-2 bg-chart-3 rounded-full mt-3 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground mb-1">Cobranzas vencidas</p>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {data.alerts.overdueCollections} cobranzas pendientes
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-chart-3" />
                                            <span className="text-xs font-medium text-chart-3">Revisar estado de pagos</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {data.alerts.overduePaymentTerms > 0 && (
                                <div
                                    className={`${styles.dashboardAlert} flex items-start gap-4 p-4 rounded-xl bg-chart-3/5 border border-chart-3/10 hover:bg-chart-3/10 transition-colors`}
                                >
                                    <div className="w-2 h-2 bg-chart-3 rounded-full mt-3 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground mb-1">Condiciones de pago vencidas</p>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {data.alerts.overduePaymentTerms} condiciones pendientes
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-chart-3" />
                                            <span className="text-xs font-medium text-chart-3">Verificar términos de pago</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {data.alerts.pendingInspections > 0 && (
                                <div
                                    className={`${styles.dashboardAlert} flex items-start gap-4 p-4 rounded-xl bg-chart-2/5 border border-chart-2/10 hover:bg-chart-2/10 transition-colors`}
                                >
                                    <div className="w-2 h-2 bg-chart-2 rounded-full mt-3 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground mb-1">Inspecciones pendientes</p>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {data.alerts.pendingInspections} inspecciones programadas
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 text-chart-2" />
                                            <span className="text-xs font-medium text-chart-2">Programar revisiones</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {data.alerts.pendingTasks > 0 && (
                                <div
                                    className={`${styles.dashboardAlert} flex items-start gap-4 p-4 rounded-xl bg-chart-4/5 border border-chart-4/10 hover:bg-chart-4/10 transition-colors`}
                                >
                                    <div className="w-2 h-2 bg-chart-4 rounded-full mt-3 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground mb-1">Tareas pendientes</p>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {data.alerts.pendingTasks} tareas asignadas
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <CheckSquare className="h-3 w-3 text-chart-4" />
                                            <span className="text-xs font-medium text-chart-4">Revisar asignaciones</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Tasks and Planning */}
                {/* Recent Projects and Tasks */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Recent Projects */}
                    <div className={`${styles.dashboardCard} bg-card border border-border rounded-xl p-8 hover:shadow-md transition-shadow duration-200`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Proyectos</h3>
                            </div>
                            <Link
                                href="/projects"
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                            >
                                Ver todos
                                <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {data.recentProjects.slice(0, 5).map((project) => (
                                <div
                                    key={project.id}
                                    className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-semibold text-foreground truncate">{project.name}</h4>
                                            <span
                                                className={`text-xs font-medium px-2 py-1 rounded-full ${project.status === "ACTIVE"
                                                    ? "bg-primary/10 text-primary border border-primary/20"
                                                    : project.status === "COMPLETED"
                                                        ? "bg-chart-2/10 text-chart-2 border border-chart-2/20"
                                                        : "bg-muted text-muted-foreground border border-border"
                                                    }`}
                                            >
                                                {project.status === "ACTIVE"
                                                    ? "Activo"
                                                    : project.status === "COMPLETED"
                                                        ? "Completado"
                                                        : project.status === "PAUSED"
                                                            ? "Pausado"
                                                            : "Planificado"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <BarChart3 className="h-3 w-3" />
                                                {project.progress}% completado
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                {project.invoicesCount} facturas
                                            </span>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Assignments */}
                    <div className={`${styles.dashboardCard} bg-card border border-border rounded-xl p-8 hover:shadow-md transition-shadow duration-200`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-chart-4/10 rounded-lg">
                                    <CheckSquare className="h-5 w-5 text-chart-4" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Asignaciones</h3>
                            </div>
                            <Link
                                href="https://pixerp.app/assignments"
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                            >
                                Ver todas
                                <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {data.tasks.slice(0, 5).map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-start gap-4 p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors group"
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <div
                                            className={`w-2 h-2 rounded-full ${task.status === "ACTIVE"
                                                ? "bg-primary"
                                                : task.status === "COMPLETED"
                                                    ? "bg-chart-2"
                                                    : "bg-muted-foreground"
                                                }`}
                                        ></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-foreground text-sm">{task.employeeName}</h4>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs text-muted-foreground">{task.employeePosition}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">{task.projectName}</p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(task.startDate).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {task.hoursPerWeek}h/sem
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Planning Tasks */}
                    <div className={`${styles.dashboardCard} bg-card border border-border rounded-xl p-8 hover:shadow-md transition-shadow duration-200`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-chart-3/10 rounded-lg">
                                    <Calendar className="h-5 w-5 text-chart-3" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Tareas</h3>
                            </div>
                            <Link
                                href="https://pixerp.app/planning"
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                            >
                                Ver todas
                                <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {data.planningTasks.slice(0, 5).map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-start gap-4 p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors group"
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <div
                                            className={`w-2 h-2 rounded-full ${task.status === "Pendiente"
                                                ? "bg-yellow-500"
                                                : task.status === "En Progreso"
                                                    ? "bg-primary"
                                                    : "bg-chart-2"
                                                }`}
                                        ></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-foreground text-sm">{task.title}</h4>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs text-muted-foreground">{task.priority}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">{task.projectName || 'Sin proyecto'}</p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Sin fecha'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {task.estimatedHours}h estimadas
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Componente para la pestaña Reportes
function ReportsTab({ data, timeFilter }: { data: DashboardData; timeFilter: "month" | "quarter" | "year" }) {
    const getHarmoniousColors = (count: number, opacity = 0.8) => {
        const colors = [
            `rgba(14, 165, 233, ${opacity})` /* Primary blue */,
            `rgba(16, 185, 129, ${opacity})` /* Success green */,
            `rgba(245, 158, 11, ${opacity})` /* Warning amber */,
            `rgba(51, 65, 85, ${opacity})` /* Secondary dark */,
            `rgba(15, 23, 42, ${opacity})` /* Primary dark */,
        ]
        return Array.from({ length: count }, (_, index) => colors[index % colors.length])
    }

    const getHarmoniousBorderColors = (count: number) => {
        return getHarmoniousColors(count, 1)
    }

    return (
        <div className="space-y-8">
            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Project Progress Chart */}
                <div
                    className={`${styles.dashboardCard} ${styles.chartContainer} bg-card border border-border rounded-xl p-8 hover:shadow-md transition-shadow duration-200`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Progreso de Proyectos</h3>
                        </div>
                    </div>
                    <div className="h-80">
                        <Bar
                            data={{
                                labels: data.charts.projectProgress.map((project) => project.name),
                                datasets: [
                                    {
                                        label: "Progreso (%)",
                                        data: data.charts.projectProgress.map((project) => project.progress),
                                        backgroundColor: getHarmoniousColors(data.charts.projectProgress.length, 0.8),
                                        borderColor: getHarmoniousBorderColors(data.charts.projectProgress.length),
                                        borderWidth: 2,
                                        borderRadius: 8,
                                        borderSkipped: false,
                                        barThickness: 32,
                                    },
                                ],
                            }}
                            options={{
                                indexAxis: "y" as const,
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                    tooltip: {
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        titleColor: "#0f172a",
                                        bodyColor: "#64748b",
                                        borderColor: "#e2e8f0",
                                        borderWidth: 1,
                                        cornerRadius: 12,
                                        padding: 16,
                                        titleFont: {
                                            size: 14,
                                            weight: "600",
                                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        },
                                        bodyFont: {
                                            size: 13,
                                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        },
                                        callbacks: {
                                            label: (context: any) => {
                                                const value = context.parsed.x
                                                return `Progreso: ${value}%`
                                            },
                                            afterBody: (context: any) => {
                                                const project = data.charts.projectProgress[context[0].dataIndex]
                                                return [
                                                    `Proyecto: ${project.name}`,
                                                    `Estado: ${project.progress === 100 ? "Completado" : project.progress > 75 ? "Avanzado" : project.progress > 50 ? "En progreso" : "Iniciando"}`,
                                                ]
                                            },
                                        },
                                    },
                                },
                                scales: {
                                    x: {
                                        beginAtZero: true,
                                        max: 100,
                                        grid: {
                                            color: "#e2e8f0",
                                            lineWidth: 1,
                                        },
                                        border: {
                                            display: false,
                                        },
                                        ticks: {
                                            callback: (value: any) => value + "%",
                                            font: {
                                                size: 11,
                                                weight: "500",
                                                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                            },
                                            color: "#64748b",
                                            padding: 10,
                                        },
                                    },
                                    y: {
                                        grid: {
                                            display: false,
                                        },
                                        ticks: {
                                            font: {
                                                size: 12,
                                                weight: "600",
                                                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                            },
                                            color: "#0f172a",
                                            padding: 15,
                                        },
                                        border: {
                                            display: false,
                                        },
                                    },
                                },
                                animation: {
                                    duration: 2000,
                                    easing: "easeInOutQuart",
                                    delay: (context: any) => {
                                        return context.dataIndex * 150
                                    },
                                },
                            }}
                        />
                    </div>
                    <div className="mt-6 pt-6 border-t border-border">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <span className="text-2xl font-bold text-slate-900 block">
                                    {data.charts.projectProgress.filter((p: any) => p.progress === 100).length}
                                </span>
                                <p className="text-sm text-slate-500 mt-1">Completados</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                <span className="text-2xl font-bold text-slate-900 block">
                                    {data.charts.projectProgress.filter((p: any) => p.progress > 0 && p.progress < 100).length}
                                </span>
                                <p className="text-sm text-slate-500 mt-1">En progreso</p>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <span className="text-2xl font-bold text-slate-900 block">
                                    {Math.round(
                                        data.charts.projectProgress.reduce((acc: number, p: any) => acc + p.progress, 0) /
                                        data.charts.projectProgress.length,
                                    )}
                                    %
                                </span>
                                <p className="text-sm text-slate-500 mt-1">Promedio</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Chart */}
                <div
                    className={`${styles.dashboardCard} ${styles.chartContainer} bg-card border border-border rounded-xl p-8 hover:shadow-md transition-shadow duration-200`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-chart-2/10 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-chart-2" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Evolución de Presupuesto</h3>
                        </div>
                    </div>
                    <div className="h-80">
                        <ChartComponent
                            type="bar"
                            data={{
                                labels: data.charts.monthlyRevenues.map((month, index) => {
                                    const now = new Date()
                                    const currentMonth = now.getMonth()
                                    const currentYear = now.getFullYear()

                                    const monthIndex = currentMonth - (5 - index)
                                    const year = monthIndex < 0 ? currentYear - 1 : currentYear
                                    const adjustedMonthIndex = monthIndex < 0 ? monthIndex + 12 : monthIndex

                                    const monthNames = [
                                        "ene",
                                        "feb",
                                        "mar",
                                        "abr",
                                        "may",
                                        "jun",
                                        "jul",
                                        "ago",
                                        "sep",
                                        "oct",
                                        "nov",
                                        "dic",
                                    ]
                                    return `${monthNames[adjustedMonthIndex]} ${year}`
                                }),
                                datasets: [
                                    {
                                        type: "bar" as const,
                                        label: "Consumido",
                                        data: data.charts.monthlyRevenues.map((month: any) => month.revenue),
                                        backgroundColor: "rgba(14, 165, 233, 0.8)",
                                        borderColor: "#0ea5e9",
                                        borderWidth: 2,
                                        borderRadius: 6,
                                        borderSkipped: false,
                                    },
                                    {
                                        type: "bar" as const,
                                        label: "Presupuestado",
                                        data: data.charts.monthlyRevenues.map((month: any) => month.budgeted),
                                        backgroundColor: "rgba(16, 185, 129, 0.3)",
                                        borderColor: "#10b981",
                                        borderWidth: 2,
                                        borderRadius: 6,
                                        borderSkipped: false,
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: "top" as const,
                                        labels: {
                                            usePointStyle: true,
                                            pointStyle: "circle",
                                            font: {
                                                size: 12,
                                                weight: "500",
                                                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                            },
                                            color: "#0f172a",
                                            padding: 20,
                                        },
                                    },
                                    tooltip: {
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        titleColor: "#0f172a",
                                        bodyColor: "#64748b",
                                        borderColor: "#e2e8f0",
                                        borderWidth: 1,
                                        cornerRadius: 12,
                                        padding: 16,
                                        titleFont: {
                                            size: 14,
                                            weight: "600",
                                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        },
                                        bodyFont: {
                                            size: 13,
                                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        },
                                    },
                                },
                                scales: {
                                    x: {
                                        grid: {
                                            display: false,
                                        },
                                        ticks: {
                                            font: {
                                                size: 11,
                                                weight: "500",
                                                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                            },
                                            color: "#64748b",
                                        },
                                        border: {
                                            display: false,
                                        },
                                    },
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: "#e2e8f0",
                                            lineWidth: 1,
                                        },
                                        ticks: {
                                            font: {
                                                size: 11,
                                                weight: "500",
                                                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                            },
                                            color: "#64748b",
                                            callback: (value: any) => "$" + value.toLocaleString(),
                                        },
                                        border: {
                                            display: false,
                                        },
                                    },
                                },
                                animation: {
                                    duration: 1500,
                                    easing: "easeInOutQuart",
                                },
                            }}
                        />
                    </div>
                </div>

                {/* Expenses by Category */}
                <div
                    className={`${styles.dashboardCard} ${styles.chartContainer} bg-card border border-border rounded-xl p-8 hover:shadow-md transition-shadow duration-200`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <Calculator className="h-5 w-5 text-destructive" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Gastos por Categoría</h3>
                        </div>
                    </div>
                    <div className="h-80">
                        <Doughnut
                            data={{
                                labels: data.charts.expensesByCategory.labels,
                                datasets: [
                                    {
                                        data: data.charts.expensesByCategory.data,
                                        backgroundColor: getHarmoniousColors(data.charts.expensesByCategory.labels.length, 0.8),
                                        borderColor: getHarmoniousBorderColors(data.charts.expensesByCategory.labels.length),
                                        borderWidth: 2,
                                        hoverBorderWidth: 3,
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: "bottom" as const,
                                        labels: {
                                            usePointStyle: true,
                                            pointStyle: "circle",
                                            font: {
                                                size: 11,
                                                weight: "500",
                                                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                            },
                                            color: "#0f172a",
                                            padding: 15,
                                        },
                                    },
                                    tooltip: {
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        titleColor: "#0f172a",
                                        bodyColor: "#64748b",
                                        borderColor: "#e2e8f0",
                                        borderWidth: 1,
                                        cornerRadius: 12,
                                        padding: 16,
                                        titleFont: {
                                            size: 14,
                                            weight: "600",
                                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        },
                                        bodyFont: {
                                            size: 13,
                                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        },
                                        callbacks: {
                                            label: (context: any) => {
                                                const value = context.parsed
                                                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                                                const percentage = ((value / total) * 100).toFixed(1)
                                                return `${context.label}: $${value.toLocaleString()} (${percentage}%)`
                                            },
                                        },
                                    },
                                },
                                animation: {
                                    animateRotate: true,
                                    duration: 2000,
                                    easing: "easeInOutQuart",
                                },
                            }}
                        />
                    </div>
                    <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Total consumido:</span>
                            <span className="text-xl font-bold text-slate-900">
                                ${data.charts.expensesByCategory.total.toLocaleString("es-ES")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function PremiumDashboard() {
    const { data: session } = useSession()
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [isClient, setIsClient] = useState(false)
    const [activeTab, setActiveTab] = useState<"general" | "reports">("general")
    const [timeFilter, setTimeFilter] = useState<"month" | "quarter" | "year">("month")
    const [organization, setOrganization] = useState<{
        id: string
        name: string
        city?: string
        country?: string
        address?: string
    } | null>(null)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch(`/api/dashboard?period=${timeFilter}`)
                if (!res.ok) throw new Error("Error al cargar datos")
                const data = await res.json()
                setDashboardData(data)
                setOrganization(data.organization)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        if (session) {
            fetchDashboardData()
        }
    }, [session, timeFilter])

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex justify-center items-center h-screen">
                    <div className="flex items-center space-x-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                        <span className="text-muted-foreground font-medium">Cargando dashboard...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                        <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <p className="text-destructive font-medium">Error al cargar datos: {error}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex justify-center items-center h-screen">
                    <div className="flex items-center space-x-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                        <span className="text-muted-foreground font-medium">Cargando datos...</span>
                    </div>
                </div>
            </div>
        )
    }

    const data = dashboardData

    return (
        <div className={styles.dashboardPage}>
            <Layout title="Dashboard Ejecutivo" subtitle="Vista panorámica de tu empresa de construcción">
                <div className="space-y-8">
                    {/* Minimalist Welcome Section */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl">
                        {/* Subtle background pattern */}
                        <div className="absolute inset-0 opacity-5">
                            <div
                                className="w-full h-full"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                }}
                            ></div>
                        </div>

                        <div className="relative">
                            {/* Single row with greeting, buttons, and weather */}
                            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                                {/* Greeting section */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                                        <div className="min-w-0">
                                            <h1 className="text-2xl lg:text-3xl font-light text-white tracking-tight">
                                                Bienvenido de vuelta
                                            </h1>
                                            <p className="text-lg font-medium text-white/90 mt-1">
                                                {isClient ? session?.user?.name || "Usuario" : "Usuario"}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-white/70 text-sm leading-relaxed max-w-md">
                                        Tienes <span className="font-medium text-white bg-white/10 px-2 py-1 rounded-md text-xs">{data.alerts.pendingTasks}</span> tareas pendientes y
                                        <span className="font-medium text-white bg-white/10 px-2 py-1 rounded-md text-xs ml-1">
                                            {data.alerts.total - data.alerts.pendingTasks}
                                        </span> alertas importantes
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 xl:flex-shrink-0">
                                    <Link
                                        href="/projects?modal=create"
                                        className="group flex items-center justify-center space-x-3 px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-white/10 w-full sm:w-[280px] xl:w-[280px]"
                                    >
                                        <Plus className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-200" />
                                        <span className="text-white font-medium">Nuevo Proyecto</span>
                                    </Link>

                                    <Link
                                        href="/reports"
                                        className="group flex items-center justify-center space-x-3 px-6 py-4 bg-transparent hover:bg-white/5 border border-white/30 hover:border-white/50 rounded-xl transition-all duration-300 backdrop-blur-sm w-full sm:w-[280px] xl:w-[280px]"
                                    >
                                        <FileText className="h-5 w-5 text-white/80 group-hover:text-white transition-colors duration-200" />
                                        <span className="text-white/80 font-medium group-hover:text-white transition-colors duration-200">Ver Reportes</span>
                                    </Link>
                                </div>

                                {/* Weather Widget */}
                                <div className="flex-shrink-0 w-full sm:w-[280px] xl:w-[280px]">
                                    <WeatherWidget
                                        city={organization?.city}
                                        country={organization?.country}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                            <div className="flex space-x-2 p-1 bg-muted/50 rounded-lg w-full sm:w-auto">
                                <button
                                    onClick={() => setActiveTab("general")}
                                    className={`${styles.dashboardBtn} px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex-1 sm:flex-none ${activeTab === "general"
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                                        }`}
                                >
                                    General
                                </button>
                                <button
                                    onClick={() => setActiveTab("reports")}
                                    className={`${styles.dashboardBtn} px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex-1 sm:flex-none ${activeTab === "reports"
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                                        }`}
                                >
                                    Reportes
                                </button>
                            </div>

                            {/* Global Time Filter */}
                            <div className="flex items-center space-x-3 min-w-0">
                                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <select
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value as "month" | "quarter" | "year")}
                                    className={`${styles.dashboardFocus} text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors w-full sm:w-auto min-w-0`}
                                >
                                    <option value="month">Este mes</option>
                                    <option value="quarter">Últimos 3 meses</option>
                                    <option value="year">Este año</option>
                                </select>
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === "general" && <GeneralTab data={data} />}

                        {activeTab === "reports" && <ReportsTab data={data} timeFilter={timeFilter} />}
                    </div>
                </div>
            </Layout>
        </div>
    )
}
