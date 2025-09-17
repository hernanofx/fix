'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Tooltip } from 'react-tooltip'
import {
    BarChart3,
    Building2,
    Users,
    DollarSign,
    UserCheck,
    CheckCircle,
    Package,
    HelpCircle,
    TrendingUp,
    Shield,
    Zap,
    Target,
    Bell
} from 'lucide-react'

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <Image
                                src="/favicon.png"
                                alt="Fix Logo"
                                width={48}
                                height={48}
                                className="h-12 w-auto bg-transparent"
                                style={{ backgroundColor: 'transparent' }}
                                priority
                            />
                            <div className="ml-3">
                                <span className="text-sm text-gray-500">Gestión Inteligente de Mantenimiento</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/login"
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                Acceder al Sistema
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <div className="text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Software #1 en Gestión de Mantenimiento
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
                            Toma el Control de
                            <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                tus Servicios
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                            Fix es más que software: es tu aliado humano en la gestión de mantenimiento.
                            Diseñado por profesionales del mantenimiento para profesionales, con el foco en lo que realmente importa:
                            <strong className="text-gray-900">tu control, tus decisiones, tus resultados</strong>.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/login"
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
                            >
                                Comenzar Gratis
                            </Link>
                            <button className="bg-white border-2 border-gray-300 text-gray-700 font-bold py-4 px-8 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-lg">
                                Ver Demo
                            </button>
                        </div>
                    </div>
                </div>

                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
                </div>
            </section>

            {/* Enfoque Humano Section */}
            <section className="py-16 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Construido por Humanos, para Humanos
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            No somos solo otra app de gestión. Somos la herramienta que entienden tus equipos,
                            que se adapta a tus procesos y que pone el poder de decisión en tus manos.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors duration-300">Colaboración Real</h3>
                            <p className="text-gray-600">
                                Conecta equipos en obra y oficina con comunicación clara y herramientas compartidas.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-green-600 transition-colors duration-300">Tu Control Total</h3>
                            <p className="text-gray-600">
                                Accede a toda la información cuando la necesites, toma decisiones informadas y mantén el mando.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-purple-600 transition-colors duration-300">Eficiencia Humana</h3>
                            <p className="text-gray-600">
                                Automatiza lo repetitivo para que te enfoques en lo que realmente importa: mantener mejor.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Módulos Completos para tu Gestión Integral
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Desde la planificación hasta la entrega, Fix cubre todos los aspectos de tu negocio de mantenimiento
                            con herramientas especializadas que se adaptan a tus necesidades reales.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Dashboard */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl border border-blue-100 hover:shadow-xl transition-all duration-500 group hover:-translate-y-2 cursor-pointer"
                            data-tooltip-id="dashboard-tooltip"
                            data-tooltip-content="Vista completa de tu empresa con métricas en tiempo real, reportes automáticos y alertas inteligentes para decisiones estratégicas.">
                            <div className="bg-blue-500 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                <BarChart3 className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">Dashboard Ejecutivo</h3>
                            <p className="text-gray-600 mb-4">
                                Vista panorámica en tiempo real de todos tus proyectos, KPIs y métricas clave para toma de decisiones.
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center group-hover:text-blue-600 transition-colors duration-300">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    Indicadores en tiempo real
                                </li>
                                <li className="flex items-center group-hover:text-blue-600 transition-colors duration-300">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                                    Reportes automáticos
                                </li>
                                <li className="flex items-center group-hover:text-blue-600 transition-colors duration-300">
                                    <Target className="w-4 h-4 text-green-500 mr-2" />
                                    Alertas inteligentes
                                </li>
                            </ul>
                        </div>

                        {/* Gestión de Proyectos */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100 hover:shadow-xl transition-all duration-500 group hover:-translate-y-2 cursor-pointer"
                            data-tooltip-id="proyectos-tooltip"
                            data-tooltip-content="Gestión integral de proyectos con cronogramas detallados, asignación de recursos, seguimiento de progreso y control de calidad en cada etapa.">
                            <div className="bg-green-500 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">Gestión de Proyectos</h3>
                            <p className="text-gray-600 mb-4">
                                Control total de tus servicios con seguimiento detallado de tareas, recursos y cronogramas.
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center group-hover:text-green-600 transition-colors duration-300">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    Programación preventiva
                                </li>
                                <li className="flex items-center group-hover:text-green-600 transition-colors duration-300">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                                    Control de recursos
                                </li>
                                <li className="flex items-center group-hover:text-green-600 transition-colors duration-300">
                                    <Target className="w-4 h-4 text-green-500 mr-2" />
                                    Monitoreo de cumplimiento
                                </li>
                            </ul>
                        </div>

                        {/* Gestión de Clientes */}
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-500 group hover:-translate-y-2 cursor-pointer"
                            data-tooltip-id="clientes-tooltip"
                            data-tooltip-content="CRM completo para gestionar clientes, contratos, oportunidades de venta y mantener un historial detallado de todas las interacciones.">
                            <div className="bg-purple-500 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors duration-300">Gestión de Clientes</h3>
                            <p className="text-gray-600 mb-4">
                                CRM completo para gestionar relaciones con clientes, contratos y seguimiento de proyectos.
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center group-hover:text-purple-600 transition-colors duration-300">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    Base de datos centralizada
                                </li>
                                <li className="flex items-center group-hover:text-purple-600 transition-colors duration-300">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                                    Historial de interacciones
                                </li>
                                <li className="flex items-center group-hover:text-purple-600 transition-colors duration-300">
                                    <Target className="w-4 h-4 text-green-500 mr-2" />
                                    Seguimiento de oportunidades
                                </li>
                            </ul>
                        </div>

                        {/* Gestión Financiera */}
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-2xl border border-yellow-100 hover:shadow-xl transition-all duration-500 group hover:-translate-y-2 cursor-pointer"
                            data-tooltip-id="financiera-tooltip"
                            data-tooltip-content="Sistema financiero completo con presupuestos, facturación automática, control de flujo de caja, análisis de rentabilidad y reportes financieros detallados.">
                            <div className="bg-yellow-500 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                <DollarSign className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-yellow-600 transition-colors duration-300">Gestión Financiera</h3>
                            <p className="text-gray-600 mb-4">
                                Control absoluto de presupuestos, facturación, cobros y análisis financiero de tus proyectos.
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center group-hover:text-yellow-600 transition-colors duration-300">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    Presupuestos detallados
                                </li>
                                <li className="flex items-center group-hover:text-yellow-600 transition-colors duration-300">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                                    Facturación automática
                                </li>
                                <li className="flex items-center group-hover:text-yellow-600 transition-colors duration-300">
                                    <Target className="w-4 h-4 text-green-500 mr-2" />
                                    Control de cobros y flujo de caja
                                </li>
                                <li className="flex items-center group-hover:text-yellow-600 transition-colors duration-300">
                                    <Shield className="w-4 h-4 text-green-500 mr-2" />
                                    Análisis financiero avanzado
                                </li>
                            </ul>
                        </div>

                        {/* Notificaciones por Email */}
                        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-8 rounded-2xl border border-red-100 hover:shadow-xl transition-all duration-500 group hover:-translate-y-2 cursor-pointer"
                            data-tooltip-id="notificaciones-tooltip"
                            data-tooltip-content="Sistema inteligente de notificaciones por email con alertas personalizables para eventos críticos, vencimientos, cambios en proyectos y actualizaciones importantes.">
                            <div className="bg-red-500 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                <Bell className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors duration-300">Notificaciones por Email</h3>
                            <p className="text-gray-600 mb-4">
                                Sistema inteligente de alertas por email para mantenerte informado de todo lo importante en tus proyectos.
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center group-hover:text-red-600 transition-colors duration-300">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    Alertas de vencimientos
                                </li>
                                <li className="flex items-center group-hover:text-red-600 transition-colors duration-300">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                                    Notificaciones de proyectos
                                </li>
                                <li className="flex items-center group-hover:text-red-600 transition-colors duration-300">
                                    <Target className="w-4 h-4 text-green-500 mr-2" />
                                    Recordatorios automáticos
                                </li>
                                <li className="flex items-center group-hover:text-red-600 transition-colors duration-300">
                                    <Bell className="w-4 h-4 text-green-500 mr-2" />
                                    Configuración personalizable
                                </li>
                            </ul>
                        </div>

                        {/* Gestión de Personal */}
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-8 rounded-2xl border border-pink-100 hover:shadow-xl transition-all duration-500 group hover:-translate-y-2 cursor-pointer"
                            data-tooltip-id="personal-tooltip"
                            data-tooltip-content="Administración completa del equipo con nóminas, control de tiempo, evaluaciones de desempeño, asignaciones de tareas y seguimiento de asistencia.">
                            <div className="bg-pink-500 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                <UserCheck className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors duration-300">Gestión de Personal</h3>
                            <p className="text-gray-600 mb-4">
                                Administración completa del equipo: nóminas, evaluaciones, asignaciones y control de asistencia.
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center group-hover:text-pink-600 transition-colors duration-300">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    Nóminas y pagos automáticos
                                </li>
                                <li className="flex items-center group-hover:text-pink-600 transition-colors duration-300">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                                    Control de tiempo y asistencia
                                </li>
                                <li className="flex items-center group-hover:text-pink-600 transition-colors duration-300">
                                    <Target className="w-4 h-4 text-green-500 mr-2" />
                                    Evaluaciones y asignaciones
                                </li>
                            </ul>
                        </div>

                        {/* Planificación e Inspecciones */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100 hover:shadow-xl transition-all duration-500 group hover:-translate-y-2 cursor-pointer"
                            data-tooltip-id="planificacion-tooltip"
                            data-tooltip-content="Herramientas avanzadas para planificar cronogramas con diagramas de Gantt, gestionar planos técnicos, realizar inspecciones de calidad y controlar el progreso de obras.">
                            <div className="bg-indigo-500 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300">Planificación e Inspecciones</h3>
                            <p className="text-gray-600 mb-4">
                                Herramientas avanzadas para mantenimiento preventivo, gestión de equipos y control de calidad.
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center group-hover:text-indigo-600 transition-colors duration-300">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    Mantenimiento preventivo
                                </li>
                                <li className="flex items-center group-hover:text-indigo-600 transition-colors duration-300">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                                    Gestión de equipos
                                </li>
                                <li className="flex items-center group-hover:text-indigo-600 transition-colors duration-300">
                                    <Target className="w-4 h-4 text-green-500 mr-2" />
                                    Control de calidad
                                </li>
                            </ul>
                        </div>

                        {/* Inventario y Logística */}
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-8 rounded-2xl border border-teal-100 hover:shadow-xl transition-all duration-500 group hover:-translate-y-2 cursor-pointer"
                            data-tooltip-id="inventario-tooltip"
                            data-tooltip-content="Sistema completo de inventario con control de stock en tiempo real, gestión de proveedores, órdenes de compra y seguimiento de movimientos de materiales.">
                            <div className="bg-teal-500 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                <Package className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors duration-300">Inventario y Logística</h3>
                            <p className="text-gray-600 mb-4">
                                Gestión completa de materiales, proveedores y almacenes con control de stock en tiempo real.
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center group-hover:text-teal-600 transition-colors duration-300">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    Control de stock y materiales
                                </li>
                                <li className="flex items-center group-hover:text-teal-600 transition-colors duration-300">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                                    Gestión de proveedores
                                </li>
                                <li className="flex items-center group-hover:text-teal-600 transition-colors duration-300">
                                    <Target className="w-4 h-4 text-green-500 mr-2" />
                                    Órdenes y movimientos
                                </li>
                            </ul>
                        </div>

                        {/* Centro de Soporte */}
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-500 group hover:-translate-y-2 cursor-pointer"
                            data-tooltip-id="soporte-tooltip"
                            data-tooltip-content="Centro completo de soporte con documentación técnica, tutoriales, soporte 24/7, comunidad de usuarios y recursos para maximizar el uso de Fix.">
                            <div className="bg-gray-500 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                <HelpCircle className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-600 transition-colors duration-300">Centro de Soporte</h3>
                            <p className="text-gray-600 mb-4">
                                Base de conocimientos completa, soporte técnico y recursos para maximizar tu experiencia con Fix.
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center group-hover:text-gray-600 transition-colors duration-300">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    Documentación completa
                                </li>
                                <li className="flex items-center group-hover:text-gray-600 transition-colors duration-300">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                                    Soporte técnico 24/7
                                </li>
                                <li className="flex items-center group-hover:text-gray-600 transition-colors duration-300">
                                    <Target className="w-4 h-4 text-green-500 mr-2" />
                                    Comunidad de usuarios
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonios Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Lo que dicen nuestros usuarios
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Empresas de mantenimiento como tú que han transformado su gestión con Fix
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center mb-4">
                                <div className="bg-blue-100 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                                    <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="font-semibold text-gray-900">Carlos Mendoza</p>
                                    <p className="text-sm text-gray-600">Director de Mantenimiento</p>
                                </div>
                            </div>
                            <p className="text-gray-600 italic">
                                "Fix nos dio el control que necesitábamos. Ya no dependemos de hojas de cálculo desactualizadas.
                                Ahora tenemos visibilidad real de nuestros servicios de mantenimiento."
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center mb-4">
                                <div className="bg-green-100 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                                    <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="font-semibold text-gray-900">Ana García</p>
                                    <p className="text-sm text-gray-600">Gerente de Operaciones</p>
                                </div>
                            </div>
                            <p className="text-gray-600 italic">
                                "La plataforma es intuitiva y se adapta a cómo trabajamos. Finalmente tenemos una herramienta
                                que entiende las necesidades reales del mantenimiento."
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center mb-4">
                                <div className="bg-purple-100 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                                    <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="font-semibold text-gray-900">Roberto Silva</p>
                                    <p className="text-sm text-gray-600">Propietario Empresa de Mantenimiento</p>
                                </div>
                            </div>
                            <p className="text-gray-600 italic">
                                "Desde que usamos Fix, nuestros márgenes han mejorado un 25%. El control financiero
                                y la eficiencia en servicios es incomparable."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="text-center hover:scale-105 transition-transform duration-300">
                            <div className="text-4xl font-bold text-blue-600 mb-2 hover:text-blue-700 transition-colors duration-300">500+</div>
                            <div className="text-gray-600">Empresas confían en Fix</div>
                        </div>
                        <div className="text-center hover:scale-105 transition-transform duration-300">
                            <div className="text-4xl font-bold text-green-600 mb-2 hover:text-green-700 transition-colors duration-300">25%</div>
                            <div className="text-gray-600">Mejora en eficiencia promedio</div>
                        </div>
                        <div className="text-center hover:scale-105 transition-transform duration-300">
                            <div className="text-4xl font-bold text-purple-600 mb-2 hover:text-purple-700 transition-colors duration-300">10k+</div>
                            <div className="text-gray-600">Servicios gestionados</div>
                        </div>
                        <div className="text-center hover:scale-105 transition-transform duration-300">
                            <div className="text-4xl font-bold text-orange-600 mb-2 hover:text-orange-700 transition-colors duration-300">24/7</div>
                            <div className="text-gray-600">Soporte disponible</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-r from-blue-600 to-cyan-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        ¿Listo para recuperar el control de tus servicios?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Únete a cientos de empresas de mantenimiento que ya han transformado su forma de trabajar.
                        Fix no es solo software, es el aliado que necesitas para mantener mejor.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/login"
                            className="bg-white text-blue-600 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg text-lg"
                        >
                            Comenzar Gratis Ahora
                        </Link>
                        <button className="bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200 text-lg">
                            Agendar Demo Personalizada
                        </button>
                    </div>
                    <p className="text-blue-200 text-sm mt-4">
                        Sin compromiso • Configuración en 24 horas • Soporte incluido
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <Image
                                    src="/favicon.png"
                                    alt="Fix Logo"
                                    width={32}
                                    height={32}
                                    className="h-8 w-auto bg-transparent"
                                    style={{ backgroundColor: 'transparent' }}
                                />
                            </div>
                            <p className="text-gray-400">
                                La plataforma integral para la gestión inteligente de servicios de mantenimiento.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Producto</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Características</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Precios</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Integraciones</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Empresa</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Sobre nosotros</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Carreras</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Soporte</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Centro de ayuda</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Estado del sistema</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Soporte técnico</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 Fix. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
            <Tooltip />
        </div>
    )
}
