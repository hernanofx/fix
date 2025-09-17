import Layout from "../../components/Layout"
import Link from "next/link"

export default function Support() {
    return (
        <Layout title="Centro de Soporte" subtitle="Encuentra ayuda y resuelve tus dudas">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 rounded-3xl mb-8 shadow-2xl shadow-blue-500/25">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                            Centro de{" "}
                            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                                Soporte
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
                            Tu guía completa para dominar Pix. Encuentra tutoriales, guías prácticas y soluciones a problemas comunes.
                        </p>

                        <div className="max-w-2xl mx-auto">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                    <svg
                                        className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar tutoriales, guías o soluciones..."
                                    className="w-full pl-16 pr-32 py-5 border-0 rounded-2xl bg-white shadow-2xl shadow-gray-200/50 focus:ring-4 focus:ring-blue-100 focus:outline-none text-lg placeholder-gray-400 font-medium transition-all duration-300"
                                />
                                <button className="absolute right-3 top-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-2.5 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold">
                                    Buscar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-20">
                        {/* Configuración Inicial */}
                        <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100/50 overflow-hidden hover:-translate-y-2">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-4 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl shadow-xl shadow-purple-500/25">
                                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Configuración</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Configura tu organización, usuarios y preferencias del sistema.
                                </p>
                                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                                        Crear organización
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                                        Gestionar usuarios y roles
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                                        Configurar notificaciones
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                                        Personalizar dashboard
                                    </li>
                                </ul>
                                <Link
                                    href="/support/setup"
                                    className="inline-flex items-center text-purple-600 hover:text-purple-800 font-semibold group-hover:translate-x-2 transition-all duration-300"
                                >
                                    Ver tutoriales
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        {/* Proyectos */}
                        <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100/50 overflow-hidden hover:-translate-y-2">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 rounded-2xl shadow-xl shadow-blue-500/25">
                                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Proyectos</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Gestión completa de proyectos desde la planificación hasta el cierre.
                                </p>
                                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                                        Crear y configurar proyectos
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                                        Gestionar cronogramas
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                                        Control de progreso
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                                        Reportes de proyecto
                                    </li>
                                </ul>
                                <Link
                                    href="/support/projects"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold group-hover:translate-x-2 transition-all duration-300"
                                >
                                    Ver tutoriales
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        {/* Recursos Humanos */}
                        <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100/50 overflow-hidden hover:-translate-y-2">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-4 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl shadow-xl shadow-green-500/25">
                                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">RRHH</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Gestión de empleados, nóminas y control de asistencia.
                                </p>
                                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                                        Gestionar empleados
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                                        Control de asistencia
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                                        Procesar nóminas
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                                        Evaluaciones de desempeño
                                    </li>
                                </ul>
                                <Link
                                    href="/support/hr"
                                    className="inline-flex items-center text-green-600 hover:text-green-800 font-semibold group-hover:translate-x-2 transition-all duration-300"
                                >
                                    Ver tutoriales
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        {/* Finanzas */}
                        <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100/50 overflow-hidden hover:-translate-y-2">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-4 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-2xl shadow-xl shadow-amber-500/25">
                                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Finanzas</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Control financiero completo: presupuestos, facturas y tesorería.
                                </p>
                                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-3"></div>
                                        Gestionar presupuestos
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-3"></div>
                                        Crear facturas
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-3"></div>
                                        Control de pagos
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-3"></div>
                                        Reportes financieros
                                    </li>
                                </ul>
                                <Link
                                    href="/support/finance"
                                    className="inline-flex items-center text-amber-600 hover:text-amber-800 font-semibold group-hover:translate-x-2 transition-all duration-300"
                                >
                                    Ver tutoriales
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        {/* Clientes y Proveedores */}
                        <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100/50 overflow-hidden hover:-translate-y-2">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-4 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/25">
                                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Clientes</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Gestión de clientes, proveedores y relaciones comerciales.
                                </p>
                                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3"></div>
                                        Gestionar clientes
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3"></div>
                                        Administrar proveedores
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3"></div>
                                        CRM y prospectos
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3"></div>
                                        Historial de comunicaciones
                                    </li>
                                </ul>
                                <Link
                                    href="/support/clients"
                                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold group-hover:translate-x-2 transition-all duration-300"
                                >
                                    Ver tutoriales
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        {/* Inventario */}
                        <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100/50 overflow-hidden hover:-translate-y-2">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-4 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 rounded-2xl shadow-xl shadow-teal-500/25">
                                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Inventario</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Control de materiales, almacenes y órdenes de compra.
                                </p>
                                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-3"></div>
                                        Gestionar materiales
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-3"></div>
                                        Control de stock
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-3"></div>
                                        Órdenes de compra
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-3"></div>
                                        Movimientos de inventario
                                    </li>
                                </ul>
                                <Link
                                    href="/support/inventory"
                                    className="inline-flex items-center text-teal-600 hover:text-teal-800 font-semibold group-hover:translate-x-2 transition-all duration-300"
                                >
                                    Ver tutoriales
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        {/* Inspecciones */}
                        <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100/50 overflow-hidden hover:-translate-y-2">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-4 bg-gradient-to-br from-red-500 via-red-600 to-pink-600 rounded-2xl shadow-xl shadow-red-500/25">
                                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Inspecciones</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Realizar inspecciones técnicas y generar reportes de calidad.
                                </p>
                                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3"></div>
                                        Crear inspecciones
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3"></div>
                                        Usar checklists
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3"></div>
                                        Capturar evidencias
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3"></div>
                                        Generar reportes
                                    </li>
                                </ul>
                                <Link
                                    href="/support/inspections"
                                    className="inline-flex items-center text-red-600 hover:text-red-800 font-semibold group-hover:translate-x-2 transition-all duration-300"
                                >
                                    Ver tutoriales
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        {/* Planificación y APU */}
                        <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100/50 overflow-hidden hover:-translate-y-2">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-4 bg-gradient-to-br from-violet-500 via-violet-600 to-purple-600 rounded-2xl shadow-xl shadow-violet-500/25">
                                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">APU</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Análisis de precios unitarios y planificación de costos.
                                </p>
                                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-3"></div>
                                        Crear análisis de precios
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-3"></div>
                                        Gestionar partidas
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-3"></div>
                                        Calcular costos
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-3"></div>
                                        Presupuestos detallados
                                    </li>
                                </ul>
                                <Link
                                    href="/support/apu"
                                    className="inline-flex items-center text-violet-600 hover:text-violet-800 font-semibold group-hover:translate-x-2 transition-all duration-300"
                                >
                                    Ver tutoriales
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        {/* Reportes */}
                        <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100/50 overflow-hidden hover:-translate-y-2">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-4 bg-gradient-to-br from-slate-500 via-gray-600 to-slate-600 rounded-2xl shadow-xl shadow-slate-500/25">
                                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Reportes</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Dashboard ejecutivo, métricas y reportes personalizados.
                                </p>
                                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-3"></div>
                                        Dashboard ejecutivo
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-3"></div>
                                        Reportes financieros
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-3"></div>
                                        Análisis de proyectos
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-3"></div>
                                        Métricas de rendimiento
                                    </li>
                                </ul>
                                <Link
                                    href="/support/reports"
                                    className="inline-flex items-center text-slate-600 hover:text-slate-800 font-semibold group-hover:translate-x-2 transition-all duration-300"
                                >
                                    Ver tutoriales
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        {/* Técnico */}
                        <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100/50 overflow-hidden hover:-translate-y-2">
                            <div className="p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-4 bg-gradient-to-br from-gray-600 via-slate-700 to-gray-700 rounded-2xl shadow-xl shadow-gray-600/25">
                                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Técnico</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Solución de problemas técnicos, APIs y configuración avanzada.
                                </p>
                                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-3"></div>
                                        Problemas de acceso
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-3"></div>
                                        Configuración del sistema
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-3"></div>
                                        APIs y integraciones
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-3"></div>
                                        Actualizaciones
                                    </li>
                                </ul>
                                <Link
                                    href="/support/technical"
                                    className="inline-flex items-center text-gray-600 hover:text-gray-800 font-semibold group-hover:translate-x-2 transition-all duration-300"
                                >
                                    Ver tutoriales
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-12 mb-20 border border-gray-100/50">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">Tutoriales Destacados</h2>
                            <p className="text-gray-600 text-xl leading-relaxed">Los guías más populares para comenzar con Pix</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="group bg-gradient-to-br from-blue-50 via-blue-50 to-cyan-50 rounded-3xl p-8 border border-blue-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                                <div className="flex items-center mb-6">
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25">
                                        <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                            />
                                        </svg>
                                    </div>
                                    <span className="ml-4 text-sm font-semibold text-blue-800 bg-blue-200/80 px-4 py-2 rounded-full">
                                        Primeros Pasos
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Configuración Inicial de tu Organización</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Aprende a configurar tu organización, crear usuarios y establecer los permisos básicos para comenzar a
                                    usar Pix.
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 font-medium">15 min de lectura</span>
                                    <Link
                                        href="/support/tutorial/setup-organization"
                                        className="text-blue-600 hover:text-blue-800 font-semibold group-hover:translate-x-1 transition-transform"
                                    >
                                        Leer →
                                    </Link>
                                </div>
                            </div>

                            <div className="group bg-gradient-to-br from-green-50 via-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                                <div className="flex items-center mb-6">
                                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg shadow-green-500/25">
                                        <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                            />
                                        </svg>
                                    </div>
                                    <span className="ml-4 text-sm font-semibold text-green-800 bg-green-200/80 px-4 py-2 rounded-full">
                                        Proyectos
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Gestión Completa de Proyectos</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Desde la creación hasta el cierre: aprende todas las funcionalidades para gestionar proyectos
                                    exitosamente.
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 font-medium">25 min de lectura</span>
                                    <Link
                                        href="/support/tutorial/project-management"
                                        className="text-green-600 hover:text-green-800 font-semibold group-hover:translate-x-1 transition-transform"
                                    >
                                        Leer →
                                    </Link>
                                </div>
                            </div>

                            <div className="group bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50 rounded-3xl p-8 border border-purple-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                                <div className="flex items-center mb-6">
                                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/25">
                                        <svg className="h-7 w-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <span className="ml-4 text-sm font-semibold text-purple-800 bg-purple-200/80 px-4 py-2 rounded-full">
                                        Finanzas
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Control Financiero y Presupuestos</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Domina el control de costos, creación de presupuestos y gestión financiera de tus proyectos.
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 font-medium">20 min de lectura</span>
                                    <Link
                                        href="/support/tutorial/financial-control"
                                        className="text-purple-600 hover:text-purple-800 font-semibold group-hover:translate-x-1 transition-transform"
                                    >
                                        Leer →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 rounded-3xl p-12 text-white mb-20 shadow-2xl shadow-gray-900/25">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-6 tracking-tight">Preguntas Frecuentes</h2>
                            <p className="text-gray-300 text-xl leading-relaxed">Respuestas rápidas a las dudas más comunes</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                                    <h3 className="font-bold mb-3 text-lg">¿Cómo recupero mi contraseña?</h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        Ve a la página de login y haz clic en "¿Olvidaste tu contraseña?" para recibir un email de
                                        recuperación.
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                                    <h3 className="font-bold mb-3 text-lg">¿Puedo tener múltiples organizaciones?</h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        Sí, Pix soporta multi-tenancy. Puedes crear y gestionar múltiples organizaciones desde tu cuenta.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                                    <h3 className="font-bold mb-3 text-lg">¿Cómo exportar reportes?</h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        En cada módulo encontrarás opciones de exportación a PDF, Excel o CSV en el menú de acciones.
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                                    <h3 className="font-bold mb-3 text-lg">¿Hay límites de uso?</h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        Los límites dependen de tu plan. Contacta a soporte para conocer los detalles de tu suscripción.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-12">
                            <Link
                                href="/support/faq"
                                className="inline-flex items-center bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg"
                            >
                                Ver todas las preguntas →
                            </Link>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-3xl p-12 text-white text-center shadow-2xl shadow-blue-500/25">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-4xl font-bold mb-6 tracking-tight">¿Necesitas Ayuda Personalizada?</h2>
                            <p className="text-blue-100 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                                Nuestro equipo de expertos está listo para ayudarte. Obtén soporte prioritario y soluciones adaptadas a
                                tus necesidades específicas.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
                                    <div className="text-5xl mb-6">💬</div>
                                    <h3 className="font-bold mb-3 text-xl">Chat en Vivo</h3>
                                    <p className="text-blue-100 leading-relaxed">Disponible 24/7 para consultas urgentes</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
                                    <div className="text-5xl mb-6">📧</div>
                                    <h3 className="font-bold mb-3 text-xl">Email Premium</h3>
                                    <p className="text-blue-100 leading-relaxed">Respuesta garantizada en menos de 4 horas</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
                                    <div className="text-5xl mb-6">📞</div>
                                    <h3 className="font-bold mb-3 text-xl">Llamada Programada</h3>
                                    <p className="text-blue-100 leading-relaxed">Sesiones personalizadas con nuestros expertos</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <button className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-xl text-lg">
                                    🚀 Iniciar Chat en Vivo
                                </button>
                                <button className="border-2 border-white text-white px-10 py-5 rounded-2xl font-bold hover:bg-white hover:text-blue-600 hover:scale-105 transition-all duration-300 text-lg">
                                    📅 Programar Llamada
                                </button>
                            </div>

                            <div className="mt-12 text-blue-100">
                                <p className="text-lg font-medium">📧 soporte@pix.com • 📞 +34 900 123 456 • 🌐 Disponible 24/7</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
