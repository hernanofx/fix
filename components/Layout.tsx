'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Navigation from '../components/Navigation'
import ToastProvider from './ToastProvider'
import { LoadingProvider, useLoading } from './LoadingProvider'
import { Menu, Bell, Search, ChevronLeft, ChevronDown, AlertTriangle, FileText, Calendar, DollarSign, Clock, Users, Building, User, Truck, Receipt, Wrench, CheckSquare } from 'lucide-react'
import { useAuth } from '../lib/hooks/useAuth'
import { signOut } from 'next-auth/react'
import QuickActionsButton from '../components/QuickActionsButton'

interface LayoutProps {
    children: React.ReactNode
    title: string
    subtitle?: string
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
    return (
        <LoadingProvider>
            <LayoutContent children={children} title={title} subtitle={subtitle} />
        </LoadingProvider>
    )
}

function LayoutContent({ children, title, subtitle }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [alerts, setAlerts] = useState({
        overdueInvoices: 0,
        pendingInspections: 0,
        overdueCollections: 0,
        overduePaymentTerms: 0,
        total: 0
    })
    const dropdownRef = useRef<HTMLDivElement>(null)
    const notificationsRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const { user } = useAuth()
    const { setLoading } = useLoading()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false)
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Obtener alertas del dashboard
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await fetch('/api/dashboard')
                if (response.ok) {
                    const data = await response.json()
                    setAlerts(data.alerts)
                }
            } catch (error) {
                console.error('Error fetching alerts:', error)
            }
        }

        if (user) {
            fetchAlerts()
            // Actualizar cada 5 minutos
            const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
            return () => clearInterval(interval)
        }
    }, [user])

    // Función para obtener el icono según el tipo
    const getSearchIcon = (type: string) => {
        switch (type) {
            case 'project': return <Building className="w-4 h-4 text-blue-600" />
            case 'client': return <Users className="w-4 h-4 text-green-600" />
            case 'employee': return <User className="w-4 h-4 text-purple-600" />
            case 'provider': return <Truck className="w-4 h-4 text-orange-600" />
            case 'invoice': return <Receipt className="w-4 h-4 text-red-600" />
            case 'inspection': return <Wrench className="w-4 h-4 text-yellow-600" />
            default: return <Search className="w-4 h-4 text-gray-600" />
        }
    }

    // Función para obtener el color del badge según el tipo
    const getStatusColor = (type: string, status: string) => {
        if (type === 'project') {
            switch (status) {
                case 'COMPLETED': return 'bg-green-100 text-green-800'
                case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
                case 'PLANNING': return 'bg-yellow-100 text-yellow-800'
                default: return 'bg-gray-100 text-gray-800'
            }
        }
        if (type === 'invoice') {
            switch (status) {
                case 'PAID': return 'bg-green-100 text-green-800'
                case 'PENDING': return 'bg-yellow-100 text-yellow-800'
                case 'OVERDUE': return 'bg-red-100 text-red-800'
                default: return 'bg-gray-100 text-gray-800'
            }
        }
        if (type === 'inspection') {
            switch (status) {
                case 'COMPLETED': return 'bg-green-100 text-green-800'
                case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
                case 'PENDING': return 'bg-yellow-100 text-yellow-800'
                default: return 'bg-gray-100 text-gray-800'
            }
        }
        return status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
    }

    // Atajo de teclado para búsqueda (tecla "/")
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Solo activar si no estamos en un input/textarea
            if (event.key === '/' &&
                event.target instanceof HTMLElement &&
                !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
                event.preventDefault()
                searchInputRef.current?.focus()
            }
            // Escape para cerrar búsqueda
            if (event.key === 'Escape') {
                setSearchOpen(false)
                setSearchQuery('')
                setSearchResults([])
                searchInputRef.current?.blur()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Manejar búsqueda
    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim() || searchQuery.length < 2) {
                setSearchResults([])
                setSearchOpen(false)
                return
            }

            setIsSearching(true)
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
                if (response.ok) {
                    const data = await response.json()
                    setSearchResults(data.results)
                    setSearchOpen(data.results.length > 0)
                }
            } catch (error) {
                console.error('Error searching:', error)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }

        const debounceTimer = setTimeout(performSearch, 300) // Debounce de 300ms
        return () => clearTimeout(debounceTimer)
    }, [searchQuery])

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 antialiased flex">
            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <button
                    aria-label="Close sidebar overlay"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-gray-900/40 md:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={[
                    'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-[transform,width] duration-300 ease-in-out',
                    'w-64 md:translate-x-0 md:static md:inset-auto',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
                    sidebarCollapsed ? 'md:w-16' : 'md:w-64',
                ].join(' ')}
                aria-label="Sidebar"
            >
                <div className="flex h-full flex-col">
                    {/* Sidebar header */}
                    <div className="flex items-center justify-between h-14 px-3 border-b border-gray-200">
                        <Link
                            href="/"
                            className="flex items-center gap-2"
                        >
                            <img
                                src="/favicon.png"
                                alt="Pix Logo"
                                className="h-6 w-6 flex-shrink-0 logo-transparent"
                                style={{ backgroundColor: 'transparent', background: 'none' }}
                            />
                            <span className={`font-semibold tracking-tight text-gray-900 transition-opacity ${sidebarCollapsed ? 'md:opacity-0' : 'opacity-100'}`}>PIX</span>
                        </Link>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setSidebarCollapsed((v) => !v)}
                                className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-pressed={sidebarCollapsed}
                                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                title={sidebarCollapsed ? 'Expandir' : 'Colapsar'}
                            >
                                <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                            </button>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Close sidebar"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation tree */}
                    <div className="flex-1 overflow-y-auto py-3">
                        <Navigation collapsed={sidebarCollapsed} />
                    </div>
                </div>
            </aside>

            {/* Main column */}
            <div className="flex-1 flex min-w-0 flex-col">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-14">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Open sidebar"
                                >
                                    <Menu className="h-5 w-5" />
                                </button>
                                <div>
                                    <h1 className="text-lg font-semibold leading-none">{title}</h1>
                                    {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Campo de búsqueda */}
                                <div className="relative" ref={searchRef}>
                                    <div className="hidden sm:flex h-9 items-center gap-2 rounded-md border border-gray-200 px-3 bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
                                        <Search className="h-4 w-4 text-gray-400" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Buscar proyectos, clientes, empleados... (presiona /)"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                                            className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none min-w-0"
                                            aria-label="Buscar en la plataforma"
                                        />
                                        {isSearching && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                                        )}
                                    </div>

                                    {/* Dropdown de resultados de búsqueda */}
                                    {searchOpen && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 w-96 max-w-md bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                                            <div className="p-3 border-b border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-medium text-gray-900">Resultados de búsqueda</h3>
                                                    <span className="text-xs text-gray-500">{searchResults.length} encontrados</span>
                                                </div>
                                            </div>
                                            <div className="py-1">
                                                {searchResults.map((result: any, index: number) => (
                                                    <Link
                                                        key={`${result.type}-${result.id}-${index}`}
                                                        href={result.url}
                                                        className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                                                        onClick={() => {
                                                            setSearchOpen(false)
                                                            setSearchQuery('')
                                                            setSearchResults([])
                                                        }}
                                                    >
                                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                                                            {getSearchIcon(result.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                                                                {result.status && (
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.type, result.status)}`}>
                                                                        {result.status.toLowerCase().replace('_', ' ')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {result.subtitle && (
                                                                <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                                                            )}
                                                            <p className="text-xs text-gray-400 capitalize">{result.type}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                            {searchResults.length >= 10 && (
                                                <div className="p-3 border-t border-gray-200">
                                                    <p className="text-xs text-gray-500 text-center">
                                                        Mostrando los primeros 10 resultados
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
                                    aria-label="Notifications"
                                    title="Ver notificaciones"
                                >
                                    <Bell className="h-4 w-4" />
                                    {/* Badge para notificaciones no leídas */}
                                    {alerts.total > 0 && (
                                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                                            <span className="text-xs text-white font-medium">{alerts.total > 99 ? '99+' : alerts.total}</span>
                                        </span>
                                    )}
                                </button>
                                {/* Dropdown de Notificaciones */}
                                {notificationsOpen && (
                                    <div
                                        ref={notificationsRef}
                                        className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                                    >
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                                                <span className="text-sm text-gray-500">{alerts.total} pendientes</span>
                                            </div>
                                        </div>
                                        <div className="py-2">
                                            {alerts.overdueInvoices > 0 && (
                                                <Link
                                                    href="/invoices?status=overdue"
                                                    className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setNotificationsOpen(false)}
                                                >
                                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <FileText className="w-4 h-4 text-red-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">Facturas vencidas</p>
                                                        <p className="text-xs text-gray-500">{alerts.overdueInvoices} facturas requieren atención</p>
                                                    </div>
                                                </Link>
                                            )}
                                            {alerts.overdueCollections > 0 && (
                                                <Link
                                                    href="/collections?status=overdue"
                                                    className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setNotificationsOpen(false)}
                                                >
                                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <DollarSign className="w-4 h-4 text-orange-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">Cobranzas vencidas</p>
                                                        <p className="text-xs text-gray-500">{alerts.overdueCollections} cobranzas pendientes</p>
                                                    </div>
                                                </Link>
                                            )}
                                            {alerts.overduePaymentTerms > 0 && (
                                                <Link
                                                    href="/payment-terms?status=overdue"
                                                    className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setNotificationsOpen(false)}
                                                >
                                                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Clock className="w-4 h-4 text-yellow-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">Condiciones de pago vencidas</p>
                                                        <p className="text-xs text-gray-500">{alerts.overduePaymentTerms} condiciones pendientes</p>
                                                    </div>
                                                </Link>
                                            )}
                                            {alerts.pendingInspections > 0 && (
                                                <Link
                                                    href="/inspections?status=pending"
                                                    className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setNotificationsOpen(false)}
                                                >
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Calendar className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">Inspecciones pendientes</p>
                                                        <p className="text-xs text-gray-500">{alerts.pendingInspections} inspecciones programadas</p>
                                                    </div>
                                                </Link>
                                            )}
                                            {alerts.total === 0 && (
                                                <div className="flex items-start space-x-3 px-4 py-3">
                                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <AlertTriangle className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">Todo al día</p>
                                                        <p className="text-xs text-gray-500">No hay notificaciones pendientes</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 border-t border-gray-200">
                                            <Link
                                                href="/dashboard"
                                                className="block w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                onClick={() => setNotificationsOpen(false)}
                                            >
                                                Ver todas las alertas
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 pl-2 pr-3 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        aria-label="Account"
                                    >
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-semibold">
                                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                        <span className="hidden sm:inline text-gray-700">{user?.name || 'Usuario'}</span>
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                    </button>
                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                                            {/* Header del dropdown */}
                                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white font-semibold text-sm">
                                                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {user?.name || 'Usuario'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {user?.email || 'usuario@pix.com'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Opciones del menú */}
                                            <div className="py-2">
                                                <Link
                                                    href="/notifications"
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    <span>Configurar Notificaciones</span>
                                                </Link>

                                                <Link
                                                    href="/profile"
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                    <span>Ver Mis Datos</span>
                                                </Link>

                                                <Link
                                                    href="/wiki"
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <span>Centro de Ayuda</span>
                                                </Link>
                                            </div>

                                            {/* Separador */}
                                            <div className="border-t border-gray-200"></div>

                                            {/* Opción de cerrar sesión */}
                                            <div className="py-2">
                                                <button
                                                    onClick={() => {
                                                        setDropdownOpen(false)
                                                        signOut({ callbackUrl: '/' })
                                                    }}
                                                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                                >
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                    </div>
                                                    <span>Cerrar Sesión</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto w-full py-4 px-4 sm:px-6 lg:px-8">
                        <ToastProvider>{children}</ToastProvider>
                    </div>
                </main>
            </div>

            {/* Quick Actions Button - Flotante */}
            <QuickActionsButton />
        </div>
    )
}
