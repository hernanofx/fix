"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Building2,
    Users,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    Calculator,
    Menu,
    X,
    Home,
    ArrowLeft,
} from "lucide-react"

interface NavigationItem {
    name: string
    href: string
    icon: React.ReactNode
    description?: string
}

const adminNavigation: NavigationItem[] = [
    {
        name: "Dashboard",
        href: "/admin",
        description: "Vista general del sistema",
        icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
        name: "Organizaciones",
        href: "/admin/tenants",
        description: "Gestionar tenants y empresas",
        icon: <Building2 className="h-5 w-5" />,
    },
    {
        name: "Usuarios",
        href: "/admin/users",
        description: "Administrar usuarios del sistema",
        icon: <Users className="h-5 w-5" />,
    },
    {
        name: "Contabilidad",
        href: "/admin/accounting",
        description: "Gestión del módulo de contabilidad",
        icon: <Calculator className="h-5 w-5" />,
    },
    {
        name: "Analytics",
        href: "/admin/analytics",
        description: "Métricas y reportes",
        icon: <BarChart3 className="h-5 w-5" />,
    },
    {
        name: "Sistema",
        href: "/admin/system",
        description: "Configuración del sistema",
        icon: <Settings className="h-5 w-5" />,
    },
]

interface AdminNavigationProps {
    collapsed?: boolean
    onToggleCollapse?: () => void
    className?: string
}

export default function AdminNavigation({ collapsed = false, onToggleCollapse, className = "" }: AdminNavigationProps) {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false)
            }
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    const handleToggleCollapse = () => {
        if (isMobile) {
            setIsMobileMenuOpen(!isMobileMenuOpen)
        } else {
            onToggleCollapse?.()
        }
    }

    return (
        <>
            {isMobile && isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            <button
                onClick={handleToggleCollapse}
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200"
                aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
                {isMobileMenuOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
            </button>

            <nav
                className={`
        ${className}
        ${isMobile
                        ? `fixed top-0 left-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                        }`
                        : "relative bg-transparent"
                    }
        ${!isMobile && collapsed ? "w-16" : isMobile ? "w-80" : "w-full"}
        transition-all duration-300 ease-in-out
      `}
            >
                <div
                    className={`
          h-full flex flex-col
          ${isMobile ? "pt-16 px-4 pb-4" : "p-2"}
        `}
                >
                    {!isMobile && (
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={onToggleCollapse}
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 group"
                                title={collapsed ? "Expandir navegación" : "Colapsar navegación"}
                            >
                                {collapsed ? (
                                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-800 transition-colors" />
                                ) : (
                                    <ChevronLeft className="h-4 w-4 text-slate-600 group-hover:text-slate-800 transition-colors" />
                                )}
                            </button>
                        </div>
                    )}

                    <div className="space-y-1 flex-1">
                        {adminNavigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    group relative flex items-center text-sm font-medium rounded-xl 
                    transition-all duration-300 ease-out
                    ${isActive
                                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/25"
                                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                        }
                    ${!isMobile && collapsed ? "justify-center px-3 py-3" : "px-4 py-3.5"}
                    ${isMobile ? "w-full" : ""}
                  `}
                                    title={!isMobile && collapsed ? item.name : undefined}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-slate-600 to-slate-800 rounded-r-full" />
                                    )}

                                    <span
                                        className={`
                      transition-all duration-300 flex-shrink-0
                      ${isActive ? "text-slate-100" : "text-slate-500 group-hover:text-slate-700 group-hover:scale-110"}
                      ${!isMobile && collapsed ? "w-5 h-5" : "mr-4 w-5 h-5"}
                    `}
                                    >
                                        {item.icon}
                                    </span>

                                    {(isMobile || !collapsed) && (
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className={`
                          font-semibold tracking-tight transition-colors duration-300
                          ${isActive ? "text-white" : "text-slate-800 group-hover:text-slate-900"}
                        `}
                                            >
                                                {item.name}
                                            </div>
                                            <div
                                                className={`
                          text-xs font-medium tracking-wide transition-colors duration-300 mt-0.5
                          ${isActive ? "text-slate-300" : "text-slate-500 group-hover:text-slate-600"}
                        `}
                                            >
                                                {item.description}
                                            </div>
                                        </div>
                                    )}

                                    {isActive && (isMobile || !collapsed) && (
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full opacity-60" />
                                    )}

                                    <div
                                        className={`
                      absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none
                      ${isActive
                                                ? "bg-gradient-to-r from-slate-800/20 to-slate-700/20"
                                                : "bg-slate-100/0 group-hover:bg-slate-100/50"
                                            }
                    `}
                                    />
                                </Link>
                            )
                        })}
                    </div>

                    {/* Back to App Button */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <Link
                            href="/dashboard"
                            className={`
                                group relative flex items-center text-sm font-medium rounded-xl
                                transition-all duration-300 ease-out
                                bg-gradient-to-r from-blue-600 to-indigo-600 text-white
                                hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25
                                ${!isMobile && collapsed ? "justify-center px-3 py-3" : "px-4 py-3.5"}
                                ${isMobile ? "w-full" : ""}
                            `}
                            title={!isMobile && collapsed ? "Volver a la aplicación" : undefined}
                        >
                            <span
                                className={`
                                    transition-all duration-300 flex-shrink-0
                                    text-blue-100 group-hover:text-white group-hover:scale-110
                                    ${!isMobile && collapsed ? "w-5 h-5" : "mr-4 w-5 h-5"}
                                `}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </span>

                            {(isMobile || !collapsed) && (
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold tracking-tight text-white">
                                        Volver a la App
                                    </div>
                                    <div className="text-xs font-medium tracking-wide text-blue-100 mt-0.5">
                                        Dashboard principal
                                    </div>
                                </div>
                            )}

                            <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </Link>
                    </div>

                    {isMobile && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="text-xs text-slate-500 text-center">Panel de Administración ERP</div>
                        </div>
                    )}
                </div>
            </nav>
        </>
    )
}
