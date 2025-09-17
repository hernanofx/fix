"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import type React from "react"
import {
    LayoutDashboard,
    FolderKanban,
    CalendarDays,
    FileSpreadsheet,
    Timer,
    ShieldCheck,
    Users,
    ListChecks,
    Wallet,
    BarChart3,
    FileText,
    UsersRound,
    UserCheck,
    Banknote,
    ReceiptText,
    ChevronRight,
    Home,
    Building2,
    Truck,
    Package,
    Warehouse,
    History,
    TrendingUp,
    UserPlus,
    UserSearch,
    Calculator,
    BookOpen,
    PieChart,
    Settings,
    LifeBuoy,
    Plug,
    Star,
    Clock,
    Building,
    CalendarClock,
    Menu,
    ChartNetwork,
    FolderInput,
    BadgeQuestionMark,
    ListOrdered,
    Handshake,
    Receipt,
} from "lucide-react"

interface NavigationItem {
    name: string
    href: string
    icon: React.ReactNode
    tooltip?: string
}

interface NavigationGroup {
    name: string
    items: NavigationItem[]
}

interface NavigationProps {
    collapsed?: boolean
}

// Navigation data function to make it dynamic
const getNavigationGroups = (enableAccounting: boolean = false, isAdmin: boolean = false): NavigationGroup[] => {
    const baseNavigation: NavigationGroup[] = [
        {
            name: "Dashboard",
            items: [
                { name: "Vista General", href: "/dashboard", icon: <Home className="h-4 w-4" />, tooltip: "Métricas y KPIs principales" },
            ],
        },
        {
            name: "Ventas",
            items: [
                { name: "Clientes", href: "/clients", icon: <UsersRound className="h-4 w-4" />, tooltip: "Ver y gestionar clientes activos" },
                { name: "Prospectos & Oportunidades", href: "/clients/prospects", icon: <UserSearch className="h-4 w-4" />, tooltip: "Gestionar leads y oportunidades de venta" },
                { name: "Facturación", href: "/bills", icon: <Receipt className="h-4 w-4" />, tooltip: "Crear y gestionar facturas de venta" },
                { name: "Cobros", href: "/collections", icon: <Banknote className="h-4 w-4" />, tooltip: "Seguimiento de pagos pendientes y cobros" },
                { name: "Condiciones de Pago", href: "/payment-terms", icon: <Handshake className="h-4 w-4" />, tooltip: "Configurar términos y plazos de pago" },
            ],
        },
        {
            name: "Compras",
            items: [
                { name: "Proveedores", href: "/providers", icon: <Building2 className="h-4 w-4" />, tooltip: "Ver y gestionar directorio de proveedores" },
                { name: "Órdenes de Compra", href: "/providers/orders", icon: <FileText className="h-4 w-4" />, tooltip: "Crear y gestionar órdenes de compra" },
                { name: "Facturación y Pagos", href: "/bills", icon: <Receipt className="h-4 w-4" />, tooltip: "Facturas de proveedores y gestión de pagos" },
                { name: "Condiciones de Pago", href: "/payment-terms", icon: <Handshake className="h-4 w-4" />, tooltip: "Configurar términos y plazos de pago a proveedores" },
            ],
        },
        {
            name: "Obra / Proyectos",
            items: [
                { name: "Proyectos", href: "/projects", icon: <FolderKanban className="h-4 w-4" />, tooltip: "Gestión de obras y contratos" },
                { name: "Tareas & Calendario", href: "/planning", icon: <CalendarClock className="h-4 w-4" />, tooltip: "Planificación y seguimiento de tareas" },
                { name: "APU – Precios Unitarios", href: "/apu", icon: <Calculator className="h-4 w-4" />, tooltip: "Cálculos de costos unitarios" },
                { name: "Categorías (Rubros)", href: "/rubros", icon: <ListOrdered className="h-4 w-4" />, tooltip: "Clasificación de proyectos y materiales" },
            ],
        },
        {
            name: "Inventario",
            items: [
                { name: "Catálogo", href: "/stock/materials", icon: <Package className="h-4 w-4" />, tooltip: "Productos y materiales disponibles" },
                { name: "Almacenes", href: "/stock/warehouses", icon: <Warehouse className="h-4 w-4" />, tooltip: "Gestión de ubicaciones de stock" },
                { name: "Stocks & Movimientos", href: "/stock/stocks", icon: <BarChart3 className="h-4 w-4" />, tooltip: "Control de niveles y movimientos de inventario" },
                { name: "Historial de Movimientos", href: "/stock/movements", icon: <History className="h-4 w-4" />, tooltip: "Registro histórico de entradas y salidas" },
            ],
        },
        {
            name: "Finanzas",
            items: [
                { name: "Tesorería", href: "/treasury", icon: <Wallet className="h-4 w-4" />, tooltip: "Cuentas y transacciones" },
                { name: "Cheques", href: "/checks", icon: <Receipt className="h-4 w-4" />, tooltip: "Gestión de cheques emitidos" },
                { name: "Presupuestos", href: "/budgets", icon: <BarChart3 className="h-4 w-4" />, tooltip: "Planificación financiera por proyecto" },
                { name: "Flujo de Caja", href: "/cashflow", icon: <TrendingUp className="h-4 w-4" />, tooltip: "Proyecciones de ingresos y egresos" },
            ],
        },
        {
            name: "RR. HH.",
            items: [
                { name: "Empleados", href: "/employees", icon: <Users className="h-4 w-4" />, tooltip: "Equipo y recursos humanos" },
                { name: "Asignaciones", href: "/assignments", icon: <Menu className="h-4 w-4" />, tooltip: "Distribución de tareas por empleado" },
                { name: "Partes de Horas", href: "/time-tracking", icon: <Timer className="h-4 w-4" />, tooltip: "Registro de tiempo trabajado" },
                { name: "Nómina", href: "/payrolls", icon: <Wallet className="h-4 w-4" />, tooltip: "Salarios y pagos a empleados" },
                { name: "Evaluaciones", href: "/evaluations", icon: <BarChart3 className="h-4 w-4" />, tooltip: "Rendimiento y feedback" },
                { name: "Seguridad & Calidad", href: "/inspections", icon: <ShieldCheck className="h-4 w-4" />, tooltip: "Control de calidad y seguridad" },
            ],
        },
        {
            name: "Reportes & BI",
            items: [
                { name: "Centro de Reportes", href: "/reports", icon: <ChartNetwork className="h-4 w-4" />, tooltip: "Análisis y exportaciones" },
            ],
        },
        {
            name: "Documentos",
            items: [
                { name: "Planos", href: "/plans", icon: <FolderInput className="h-4 w-4" />, tooltip: "Documentos técnicos y planos" },
            ],
        },
        {
            name: "Ayuda",
            items: [
                { name: "Base de Conocimiento", href: "/wiki", icon: <BookOpen className="h-4 w-4" />, tooltip: "Documentación y guías" },
                { name: "Soporte", href: "/support", icon: <LifeBuoy className="h-4 w-4" />, tooltip: "Centro de soporte técnico" },
            ],
        },
    ]

    // Add configuration group only for admins (at the end)
    if (isAdmin) {
        const configGroup: NavigationGroup = {
            name: "Configuración",
            items: [
                { name: "Empresa", href: "/admin/tenants", icon: <Home className="h-4 w-4" />, tooltip: "Configuración de la organización" },
                { name: "Usuarios & Permisos", href: "/admin/users", icon: <UserPlus className="h-4 w-4" />, tooltip: "Gestión de usuarios del sistema" },
                { name: "Sistema", href: "/admin/system", icon: <Settings className="h-4 w-4" />, tooltip: "Configuración del sistema" },
            ],
        }
        baseNavigation.push(configGroup)
    }

    // Add accounting group if enabled
    if (enableAccounting) {
        const accountingGroup: NavigationGroup = {
            name: "Contabilidad",
            items: [
                { name: "Tablero Contable", href: "/accounting", icon: <Calculator className="h-4 w-4" />, tooltip: "Vista general contable" },
                { name: "Plan de Cuentas", href: "/accounting/chart-of-accounts", icon: <BookOpen className="h-4 w-4" />, tooltip: "Estructura de cuentas" },
                { name: "Libro Diario", href: "/accounting/journal", icon: <FileText className="h-4 w-4" />, tooltip: "Registro de transacciones" },
                { name: "Mayores & Balances", href: "/accounting/reports", icon: <PieChart className="h-4 w-4" />, tooltip: "Estados financieros" },
            ],
        }

        // Insert after Finanzas
        const insertIndex = baseNavigation.findIndex(group => group.name === "Finanzas") + 1
        baseNavigation.splice(insertIndex, 0, accountingGroup)
    }

    return baseNavigation
}

export default function Navigation({ collapsed = false }: NavigationProps) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [expanded, setExpanded] = useState<Set<string>>(() => {
        // Restore from localStorage to keep user preference persistent
        if (typeof window !== "undefined") {
            try {
                const raw = window.localStorage.getItem("nav:expanded")
                if (raw) return new Set(JSON.parse(raw))
            } catch { }
        }
        return new Set([])
    })

    // Get organization's accounting settings and navigation
    const enableAccounting = session?.user?.organization?.enableAccounting || false
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'
    const navigation = getNavigationGroups(enableAccounting, isAdmin)

    // Persist expanded groups
    useEffect(() => {
        try {
            window.localStorage.setItem("nav:expanded", JSON.stringify(Array.from(expanded)))
        } catch { }
    }, [expanded])

    // Auto-expand group that contains the active route
    useEffect(() => {
        const activeGroup = navigation.find((group) => group.items.some((i) => pathname?.startsWith(i.href)))
        if (activeGroup && !expanded.has(activeGroup.name)) {
            setExpanded((prev) => new Set(prev).add(activeGroup.name))
        }
    }, [pathname, expanded, navigation])

    const isActive = useMemo(
        () => (href: string) => {
            // Exact match - highest priority
            if (pathname === href) return true

            // For parent routes, check if we're on a sub-route
            if (href !== "/" && pathname?.startsWith(href + "/")) {
                // If this href is a parent route and we're on a sub-route,
                // only mark it as active if it's a direct child
                const pathParts = pathname.split("/").filter(Boolean)
                const hrefParts = href.split("/").filter(Boolean)

                // If the path has more than one additional segment, don't mark parent as active
                if (pathParts.length > hrefParts.length + 1) {
                    return false
                }

                // If there's a more specific route active, don't mark this parent as active
                // Check if any navigation item has a more specific href that matches current path
                const hasMoreSpecificRoute = navigation.some((group) =>
                    group.items.some(
                        (item) =>
                            item.href !== href &&
                            item.href.startsWith(href + "/") &&
                            (pathname === item.href || pathname?.startsWith(item.href + "/")),
                    ),
                )

                return !hasMoreSpecificRoute
            }

            return false
        },
        [pathname, navigation],
    )

    // Check if group has active items, but exclude parent items when child items are active
    const hasActiveGroup = useMemo(
        () => (group: NavigationGroup) => {
            const activeItems = group.items.filter((item) => isActive(item.href))
            if (activeItems.length === 0) return false

            // If there's only one active item and it's the parent route, don't mark group as active
            if (activeItems.length === 1) {
                const activeItem = activeItems[0]
                // Check if this is a parent route (like /providers) and we're actually on a sub-route
                if (pathname?.startsWith(activeItem.href + "/") && pathname !== activeItem.href) {
                    return false
                }
            }

            return true
        },
        [isActive, pathname],
    )

    const groupIcon: Record<string, React.ReactNode> = {
        Dashboard: <LayoutDashboard className="h-4 w-4" />,
        Ventas: <UserCheck className="h-4 w-4" />,
        Compras: <Truck className="h-4 w-4" />,
        "Obra / Proyectos": <Building className="h-4 w-4" />,
        Inventario: <Package className="h-4 w-4" />,
        Finanzas: <Banknote className="h-4 w-4" />,
        Contabilidad: <Calculator className="h-4 w-4" />,
        "RR. HH.": <Users className="h-4 w-4" />,
        "Reportes & BI": <PieChart className="h-4 w-4" />,
        Documentos: <FileText className="h-4 w-4" />,
        Configuración: <Settings className="h-4 w-4" />,
        Ayuda: <BadgeQuestionMark className="h-4 w-4" />,
    }

    const toggle = (name: string) =>
        setExpanded((prev) => {
            if (prev.has(name)) {
                return new Set()
            } else {
                return new Set([name])
            }
        })

    return (
        <nav className="space-y-1 px-3 py-2">
            {navigation.map((group, index) => {
                const open = expanded.has(group.name)
                const hasActive = hasActiveGroup(group)
                const isConfigGroup = group.name === "Configuración"

                return (
                    <section key={group.name} className="select-none">
                        {/* Separator line before Configuración */}
                        {isConfigGroup && (
                            <div className="my-4 border-t-2 border-slate-200/50"></div>
                        )}

                        <button
                            onClick={() => toggle(group.name)}
                            className={[
                                "group w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all duration-200 ease-out",
                                "hover:bg-slate-100/60 hover:shadow-sm",
                                hasActive
                                    ? isConfigGroup
                                        ? "bg-gradient-to-r from-amber-900/10 to-amber-800/10 text-amber-900 shadow-sm border border-amber-200/60 hover:bg-amber-100/80"
                                        : "bg-gradient-to-r from-slate-900/5 to-slate-800/5 text-slate-900 shadow-sm border border-slate-200/60 hover:bg-slate-100/80"
                                    : isConfigGroup
                                        ? "text-amber-700 hover:text-amber-900 hover:bg-amber-50/80"
                                        : "text-slate-400 hover:text-slate-900",
                                collapsed ? "justify-center px-2 py-2" : "",
                            ].join(" ")}
                            aria-expanded={open}
                            aria-controls={`group-${group.name}`}
                            title={collapsed ? group.name : undefined}
                        >
                            <div className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
                                <span
                                    className={[
                                        "transition-colors duration-200",
                                        hasActive
                                            ? isConfigGroup
                                                ? "text-amber-700"
                                                : "text-slate-700"
                                            : isConfigGroup
                                                ? "text-amber-500 group-hover:text-amber-700"
                                                : "text-slate-400 group-hover:text-slate-600",
                                        collapsed ? "w-5 h-5" : "w-4 h-4",
                                    ].join(" ")}
                                >
                                    {groupIcon[group.name] ?? null}
                                </span>
                                {!collapsed && (
                                    <>
                                        <span className={`text-sm font-semibold tracking-wide group-hover:text-slate-900 ${isConfigGroup ? "text-amber-800" : "text-slate-400"
                                            }`}>
                                            {group.name}
                                        </span>
                                        <span className={`text-xs bg-slate-100/60 px-2 py-1 rounded-lg font-medium group-hover:bg-slate-200/60 ${isConfigGroup ? "text-amber-700 bg-amber-100/60" : "text-slate-400"
                                            }`}>
                                            {group.items.length}
                                        </span>
                                    </>
                                )}
                            </div>
                            {!collapsed && (
                                <ChevronRight
                                    className={[
                                        "h-4 w-4 transition-all duration-200 ease-out group-hover:text-slate-600",
                                        isConfigGroup ? "text-amber-400 group-hover:text-amber-600" : "text-slate-400",
                                        open ? "rotate-90" : "",
                                    ].join(" ")}
                                    aria-hidden
                                />
                            )}
                        </button>

                        <div
                            id={`group-${group.name}`}
                            className={[
                                "grid transition-all duration-300 ease-out",
                                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                                collapsed ? "mt-1" : "",
                            ].join(" ")}
                        >
                            <div className="overflow-hidden">
                                <ul className={`mt-2 ${collapsed ? 'ml-2' : 'ml-6'} space-y-1 ${collapsed ? 'space-y-0.5' : ''} ${collapsed ? 'border-l-0' : 'border-l border-slate-100'}`}>
                                    {group.items.map((item) => {
                                        const active = isActive(item.href)
                                        const isConfigItem = isConfigGroup

                                        return (
                                            <li key={item.name} className={`relative ${collapsed ? 'flex justify-center' : ''}`}>
                                                {active && !collapsed && (
                                                    <div className={`absolute -left-[1px] top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full ${isConfigItem ? "bg-amber-800" : "bg-slate-800"
                                                        }`} />
                                                )}
                                                {active && collapsed && (
                                                    <div className={`absolute left-1/2 -translate-x-1/2 -top-1 w-8 h-0.5 rounded-full ${isConfigItem ? "bg-amber-800" : "bg-slate-800"
                                                        }`} />
                                                )}
                                                <Link
                                                    href={item.href}
                                                    className={[
                                                        "group flex items-center rounded-lg px-4 py-2.5 text-sm transition-all duration-200 ease-out ml-4",
                                                        "hover:bg-slate-100/60 hover:shadow-sm hover:translate-x-0.5",
                                                        active
                                                            ? isConfigItem
                                                                ? "bg-amber-900 text-white shadow-lg shadow-amber-900/10 hover:bg-amber-800"
                                                                : "bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800"
                                                            : isConfigItem
                                                                ? "text-amber-600 hover:text-amber-900 hover:bg-amber-50/80"
                                                                : "text-slate-400 hover:text-slate-900 hover:bg-slate-50/80",
                                                        collapsed ? "justify-center px-2 py-2 mx-2" : "",
                                                    ].join(" ")}
                                                    title={collapsed ? item.name : item.tooltip}
                                                    aria-current={active ? "page" : undefined}
                                                >
                                                    <span
                                                        className={[
                                                            "shrink-0 transition-colors duration-200",
                                                            active
                                                                ? "text-white"
                                                                : isConfigItem
                                                                    ? "text-amber-400 group-hover:text-amber-700"
                                                                    : "text-slate-400 group-hover:text-slate-700",
                                                            collapsed ? "w-5 h-5" : "w-4 h-4 mr-3",
                                                        ].join(" ")}
                                                        aria-hidden
                                                    >
                                                        {item.icon}
                                                    </span>
                                                    {!collapsed && (
                                                        <span
                                                            className={[
                                                                "font-medium tracking-wide transition-colors duration-200",
                                                                active
                                                                    ? "text-white font-semibold"
                                                                    : isConfigItem
                                                                        ? "text-amber-700 group-hover:text-amber-900"
                                                                        : "text-slate-400 group-hover:text-slate-900",
                                                            ].join(" ")}
                                                        >
                                                            {item.name}
                                                        </span>
                                                    )}
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    </section>
                )
            })}
        </nav>
    )
}
