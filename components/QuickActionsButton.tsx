"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Plus,
    X,
    FileText,
    Users,
    Calendar,
    DollarSign,
    Clock,
    Building,
    User,
    Truck,
    Receipt,
    Wrench,
    CheckSquare,
    Calculator,
    BarChart3,
    Package,
    FileSpreadsheet,
    Timer,
    ShieldCheck,
    ListChecks,
    Wallet,
    TrendingUp,
    UserPlus,
    Pickaxe,
    FolderKanban,
    Home,
    Banknote,
    ReceiptText,
    UserCheck,
    Warehouse,
    History,
    ChevronRight,
    BookOpen,
} from "lucide-react"

interface QuickAction {
    name: string
    href: string
    icon: React.ReactNode
    description: string
    category: string
    shortcut?: string
}

const quickActions: QuickAction[] = [
    // Principal
    { name: "Nuevo Proyecto", href: "/projects/new", icon: <Plus className="h-3 w-3" />, description: "Crear un nuevo proyecto", category: "Principal", shortcut: "Ctrl+N" },
    { name: "Nuevo Cliente", href: "/clients?modal=create", icon: <UserPlus className="h-3 w-3" />, description: "Agregar cliente", category: "Clientes" },
    { name: "Nueva Factura", href: "/bills?modal=create", icon: <ReceiptText className="h-3 w-3" />, description: "Crear factura", category: "Finanzas" },
    { name: "Nuevo Empleado", href: "/employees/new", icon: <User className="h-3 w-3" />, description: "Agregar empleado", category: "Personal" },
    { name: "Nueva Inspección", href: "/inspections/new", icon: <ShieldCheck className="h-3 w-3" />, description: "Programar inspección", category: "Personal" },
    { name: "Nuevo Presupuesto", href: "/budgets?modal=create", icon: <Calculator className="h-3 w-3" />, description: "Crear presupuesto", category: "Finanzas" },
    { name: "Nuevo Proveedor", href: "/providers?modal=create", icon: <Truck className="h-3 w-3" />, description: "Agregar proveedor", category: "Proveedores" },
    { name: "Nuevo Material", href: "/stock/materials?modal=create", icon: <Package className="h-3 w-3" />, description: "Agregar material", category: "Stock" },
    { name: "Nueva Tarea", href: "/planning?modal=create", icon: <CheckSquare className="h-3 w-3" />, description: "Crear tarea", category: "Principal" },
    { name: "Nuevo Rubro", href: "/rubros?modal=create", icon: <ListChecks className="h-3 w-3" />, description: "Agregar rubro", category: "Principal" },
    { name: "Nuevo APU", href: "/apu?modal=create", icon: <Calculator className="h-3 w-3" />, description: "Crear análisis de precios", category: "Finanzas" },
    { name: "Nuevo Pago", href: "/treasury?modal=create", icon: <DollarSign className="h-3 w-3" />, description: "Registrar pago", category: "Finanzas" },
    { name: "Wiki", href: "/wiki", icon: <BookOpen className="h-3 w-3" />, description: "Acceder a la documentación", category: "Documentación" },
]

const categoryColors = {
    Principal: "bg-blue-500",
    Clientes: "bg-green-500",
    Proveedores: "bg-orange-500",
    Finanzas: "bg-purple-500",
    Personal: "bg-red-500",
    Stock: "bg-yellow-500",
    Documentación: "bg-indigo-500",
}

export default function QuickActionsButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isHovered, setIsHovered] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const modalRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const pathname = usePathname()

    // Filtrar acciones según búsqueda
    const filteredActions = quickActions.filter(action =>
        action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Agrupar acciones por categoría
    const groupedActions = filteredActions.reduce((acc, action) => {
        if (!acc[action.category]) {
            acc[action.category] = []
        }
        acc[action.category].push(action)
        return acc
    }, {} as Record<string, QuickAction[]>)

    // Reset selected index when search changes
    useEffect(() => {
        setSelectedIndex(0)
    }, [searchQuery])

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault()
                setSelectedIndex(prev => Math.min(prev + 1, filteredActions.length - 1))
            } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setSelectedIndex(prev => Math.max(prev - 1, 0))
            } else if (event.key === 'Enter' && filteredActions[selectedIndex]) {
                event.preventDefault()
                window.location.href = filteredActions[selectedIndex].href
                setIsOpen(false)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, selectedIndex, filteredActions])

    return (
        <>
            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-50">
                {/* Enhanced Tooltip */}
                <div
                    className={`absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl shadow-2xl border border-gray-700/50 transition-all duration-300 transform ${isHovered && !isOpen
                        ? 'opacity-100 translate-y-0 scale-100'
                        : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="font-medium text-xs">Acciones rápidas</span>
                            <span className="text-[10px] text-gray-300">Acceso directo a funciones</span>
                        </div>
                        <div className="flex gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-800/80 rounded text-[10px] border border-gray-600">Ctrl</kbd>
                            <kbd className="px-1.5 py-0.5 bg-gray-800/80 rounded text-[10px] border border-gray-600">Shift</kbd>
                            <kbd className="px-1.5 py-0.5 bg-gray-800/80 rounded text-[10px] border border-gray-600">A</kbd>
                        </div>
                    </div>
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
                </div>

                {/* Enhanced Main Button */}
                <button
                    ref={buttonRef}
                    onClick={() => setIsOpen(true)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`
                        relative group w-10 h-10 rounded-full
                        bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700
                        hover:from-blue-600 hover:via-purple-700 hover:to-indigo-800
                        shadow-2xl hover:shadow-3xl hover:shadow-blue-500/25
                        transition-all duration-500 ease-out
                        transform hover:scale-110 active:scale-95
                        focus:outline-none focus:ring-4 focus:ring-blue-300/50
                        border-2 border-white/20 hover:border-white/30
                        ${isOpen ? 'rotate-45 scale-110 shadow-blue-500/30' : 'hover:rotate-12'}
                        before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                    `}
                    aria-label="Abrir acciones rápidas"
                >
                    {/* Pulse Animation */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 animate-ping opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>

                    {/* Glow Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-600/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Icon Container */}
                    <div className="relative z-10 flex items-center justify-center">
                        {isOpen ? (
                            <X className="w-4 h-4 text-white transition-all duration-300 drop-shadow-lg" />
                        ) : (
                            <Plus className="w-4 h-4 text-white transition-all duration-300 group-hover:scale-110 drop-shadow-lg" />
                        )}
                    </div>

                    {/* Notification Badge */}
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg border-2 border-white animate-pulse">
                        {quickActions.length}
                    </div>

                    {/* Ripple Effect */}
                    <div className="absolute inset-0 rounded-full bg-white/30 scale-0 group-active:scale-100 transition-transform duration-200"></div>
                </button>
            </div>

            {/* Enhanced Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-40 flex items-end justify-center p-4 bg-black/30 backdrop-blur-md animate-in fade-in duration-300">
                    <div
                        ref={modalRef}
                        className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-in slide-in-from-bottom-6 duration-500 ease-out"
                        style={{
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        {/* Enhanced Header */}
                        <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Acciones Rápidas</h2>
                                    <p className="text-sm text-gray-600 mt-1">Acceso directo a las funciones principales</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                                    aria-label="Cerrar"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Enhanced Search Field */}
                            <div className="mt-4 relative">
                                <input
                                    type="text"
                                    placeholder="Buscar acciones, categorías o descripciones..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm bg-white/50 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400"
                                    autoFocus
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Enhanced Content */}
                        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {Object.keys(groupedActions).length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron acciones</h3>
                                    <p className="text-sm text-gray-500">Intenta con otros términos de búsqueda</p>
                                </div>
                            ) : (
                                <div className="p-3 space-y-4">
                                    {Object.entries(groupedActions).map(([category, actions], categoryIndex) => (
                                        <div
                                            key={category}
                                            className="animate-in slide-in-from-left duration-300"
                                            style={{ animationDelay: `${categoryIndex * 50}ms` }}
                                        >
                                            {/* Enhanced Category Header */}
                                            <div className="flex items-center gap-3 px-3 py-2 mb-2">
                                                <div className={`w-3 h-3 rounded-full ${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-400'} shadow-sm`}></div>
                                                <h3 className="text-base font-semibold text-gray-900">{category}</h3>
                                                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
                                                <span className="text-xs text-gray-500 bg-gray-100/80 px-3 py-1 rounded-full font-medium border border-gray-200/50">
                                                    {actions.length}
                                                </span>
                                            </div>

                                            {/* Enhanced Actions Grid */}
                                            <div className="grid grid-cols-1 gap-2 px-3">
                                                {actions.map((action, actionIndex) => {
                                                    const globalIndex = Object.values(groupedActions).slice(0, Object.keys(groupedActions).indexOf(category)).reduce((acc, catActions) => acc + catActions.length, 0) + actionIndex
                                                    const isSelected = globalIndex === selectedIndex

                                                    return (
                                                        <Link
                                                            key={action.href}
                                                            href={action.href}
                                                            onClick={() => setIsOpen(false)}
                                                            className={`group flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border ${isSelected
                                                                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 shadow-md scale-[1.02]'
                                                                : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-transparent hover:border-blue-100/50'
                                                                }`}
                                                            style={{ animationDelay: `${(categoryIndex * 50) + (actionIndex * 25)}ms` }}
                                                        >
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${isSelected
                                                                ? 'bg-gradient-to-br from-blue-200 to-indigo-200 scale-110'
                                                                : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:scale-110'
                                                                }`}>
                                                                <div className={`transition-colors duration-300 ${isSelected
                                                                    ? 'text-blue-700'
                                                                    : 'text-gray-600 group-hover:text-blue-600'
                                                                    }`}>
                                                                    {action.icon}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <p className={`text-sm font-semibold truncate transition-colors ${isSelected
                                                                        ? 'text-blue-900'
                                                                        : 'text-gray-900 group-hover:text-blue-900'
                                                                        }`}>
                                                                        {action.name}
                                                                    </p>
                                                                    {action.shortcut && (
                                                                        <span className={`text-xs px-2 py-1 rounded-md text-xs font-mono border transition-colors ${isSelected
                                                                            ? 'bg-blue-200/50 text-blue-700 border-blue-300/50'
                                                                            : 'bg-gray-100/80 text-gray-400 border-gray-200/50 group-hover:bg-blue-100/50 group-hover:text-blue-600'
                                                                            }`}>
                                                                            {action.shortcut}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className={`text-xs truncate transition-colors ${isSelected
                                                                    ? 'text-blue-700'
                                                                    : 'text-gray-500 group-hover:text-gray-600'
                                                                    }`}>
                                                                    {action.description}
                                                                </p>
                                                            </div>
                                                            <ChevronRight className={`h-5 w-5 transition-all duration-300 ${isSelected
                                                                ? 'text-blue-500 translate-x-1'
                                                                : 'text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1'
                                                                }`} />
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Enhanced Footer */}
                        <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm">Esc</kbd>
                                        <span>Cerrar</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm">↑↓</kbd>
                                        <span>Navegar</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm">Enter</kbd>
                                        <span>Seleccionar</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {Object.keys(groupedActions).length} categorías • {filteredActions.length} acciones
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}