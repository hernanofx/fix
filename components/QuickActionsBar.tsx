"use client"

import Link from "next/link"
import {
    Building2,
    UserPlus,
    FileText,
    Calculator,
    Users,
    CheckCircle2,
    Truck,
    CreditCard,
    DollarSign,
    BarChart3,
    CheckSquare,
    Package,
    ChevronLeft,
    ChevronRight,
    UserCheck,
} from "lucide-react"
import { useState, useEffect } from "react"

interface QuickAction {
    href: string
    icon: React.ReactNode
    label: string
    color: string
    bgColor: string
}

const quickActions: QuickAction[] = [
    {
        href: "/projects?modal=create",
        icon: <Building2 className="h-2 w-2" />,
        label: "Nuevo Proyecto",
        color: "#0ea5e9",
        bgColor: "rgba(14, 165, 233, 0.1)",
    },
    {
        href: "/employees?modal=create",
        icon: <UserPlus className="h-2 w-2" />,
        label: "Nuevo Empleado",
        color: "#10b981",
        bgColor: "rgba(16, 185, 129, 0.1)",
    },
    {
        href: "/assignments?modal=create",
        icon: <UserCheck className="h-2 w-2" />,
        label: "Nueva Asignación",
        color: "#8b5cf6",
        bgColor: "rgba(139, 92, 246, 0.1)",
    },
    {
        href: "/bills?modal=create",
        icon: <FileText className="h-2 w-2" />,
        label: "Nueva Factura",
        color: "#0ea5e9",
        bgColor: "rgba(14, 165, 233, 0.1)",
    },
    {
        href: "/budgets?modal=create",
        icon: <Calculator className="h-2 w-2" />,
        label: "Nuevo Presupuesto",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)",
    },
    {
        href: "/clients?modal=create",
        icon: <Users className="h-2 w-2" />,
        label: "Nuevo Cliente",
        color: "#10b981",
        bgColor: "rgba(16, 185, 129, 0.1)",
    },
    {
        href: "/inspections?modal=create",
        icon: <CheckCircle2 className="h-2 w-2" />,
        label: "Nueva Inspección",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)",
    },
    {
        href: "/providers?modal=create",
        icon: <Truck className="h-2 w-2" />,
        label: "Nuevo Proveedor",
        color: "#334155",
        bgColor: "rgba(51, 65, 85, 0.1)",
    },
    {
        href: "/bills?modal=create",
        icon: <CreditCard className="h-2 w-2" />,
        label: "Nuevo Pago",
        color: "#0ea5e9",
        bgColor: "rgba(14, 165, 233, 0.1)",
    },
    {
        href: "/collections?modal=create",
        icon: <DollarSign className="h-2 w-2" />,
        label: "Nuevo Cobro",
        color: "#10b981",
        bgColor: "rgba(16, 185, 129, 0.1)",
    },
    {
        href: "/reports",
        icon: <BarChart3 className="h-2 w-2" />,
        label: "Ver Reportes",
        color: "#334155",
        bgColor: "rgba(51, 65, 85, 0.1)",
    },
    {
        href: "/planning?modal=create",
        icon: <CheckSquare className="h-2 w-2" />,
        label: "Nueva Tarea",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)",
    },
    {
        href: "/stock",
        icon: <Package className="h-2 w-2" />,
        label: "Inventario",
        color: "#334155",
        bgColor: "rgba(51, 65, 85, 0.1)",
    },
]

export default function QuickActionsBar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    // Auto-collapse after 3 seconds of inactivity
    useEffect(() => {
        if (!isHovered && !isCollapsed) {
            const timer = setTimeout(() => {
                setIsCollapsed(true)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [isHovered, isCollapsed])

    return (
        <div
            className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-50 transition-all duration-300 ease-in-out ${isCollapsed ? "translate-x-24" : "translate-x-0"
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Main Bar */}
            <div className={`bg-white/95 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? "w-6" : "w-24"
                }`}>
                {/* Collapsed View - Minimal Interface */}
                {isCollapsed ? (
                    <div className="p-0.5 flex flex-col items-center gap-0.5">
                        <div className="w-4 h-4 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Building2 className="h-2 w-2 text-white" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            {quickActions.slice(0, 6).map((action, index) => (
                                <Link
                                    key={index}
                                    href={action.href}
                                    className="group relative w-4 h-4 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md"
                                    style={{ backgroundColor: action.bgColor }}
                                    title={action.label}
                                >
                                    <div style={{ color: action.color }}>{action.icon}</div>
                                    {/* Tooltip on hover */}
                                    <div className="absolute left-full ml-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                        {action.label}
                                        <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-r-4 border-t-4 border-b-4 border-transparent border-r-gray-900"></div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsCollapsed(false)}
                            className="w-4 h-4 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200 mt-0.5"
                            title="Expandir todas las acciones"
                        >
                            <ChevronRight className="h-2 w-2 text-gray-500" />
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header - Expanded View */}
                        <div className="flex items-center justify-between p-0.5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
                            <div className="flex items-center gap-0.5">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-md flex items-center justify-center">
                                    <Building2 className="h-1 w-1 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[6px] font-semibold text-gray-900">Acciones</span>
                                    <span className="text-[6px] text-gray-500">Rápidas</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCollapsed(true)}
                                className="w-2.5 h-2.5 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center transition-colors duration-200 group"
                                title="Vista mínima"
                            >
                                <ChevronLeft className="h-1 w-1 text-gray-500 group-hover:text-gray-700" />
                            </button>
                        </div>

                        {/* Actions Grid - Single Column */}
                        <div className="p-0.25">
                            <div className="grid grid-cols-1 gap-0.25">
                                {quickActions.map((action, index) => (
                                    <Link
                                        key={index}
                                        href={action.href}
                                        className="group relative flex items-center gap-0.25 p-0.25 bg-white hover:bg-gray-50 border border-gray-200 rounded-md transition-all duration-200 hover:shadow-sm hover:scale-105 hover:border-blue-300"
                                        title={action.label}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                                            style={{ backgroundColor: action.bgColor }}
                                        >
                                            <div style={{ color: action.color }}>{action.icon}</div>
                                        </div>
                                        <span className="text-[6px] font-medium text-gray-700 group-hover:text-gray-900 flex-1 truncate">
                                            {action.label}
                                        </span>

                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                            {action.label}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-0.25 bg-gray-50 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-[6px] text-gray-500 font-medium">
                                    {quickActions.length}
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <div className="w-0.5 h-0.5 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Collapse Handle with Counter */}
            <div
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full transition-all duration-300 ${isCollapsed ? "opacity-100" : "opacity-0"
                    }`}
            >
                <div className="relative">
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-l-xl shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                        title="Expandir barra de acciones"
                    >
                        <ChevronRight className="h-2 w-2" />
                    </button>
                    {/* Action Counter Badge */}
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-[6px] font-bold rounded-full flex items-center justify-center shadow-md">
                        {quickActions.length}
                    </div>
                </div>
            </div>
        </div>
    )
}