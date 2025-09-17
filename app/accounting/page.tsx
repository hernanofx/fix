'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Calculator, BookOpen, FileText, TrendingUp, DollarSign, PieChart } from 'lucide-react'
import Link from 'next/link'

interface AccountingStats {
    totalAccounts: number
    monthlyEntries: number
    lastEntry: string | null
    lastEntryDate: string | null
    isBalanced: boolean
}

export default function AccountingDashboard() {
    const { data: session } = useSession()
    const [organization, setOrganization] = useState<any>(null)
    const [stats, setStats] = useState<AccountingStats>({
        totalAccounts: 0,
        monthlyEntries: 0,
        lastEntry: null,
        lastEntryDate: null,
        isBalanced: true
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAccountingData()
    }, [session])

    const fetchAccountingData = async () => {
        if (!session?.user?.organizationId) return

        try {
            setLoading(true)

            // Verificar si la contabilidad está habilitada
            const setupRes = await fetch('/api/accounting/setup')
            const setupData = await setupRes.json()

            if (!setupData.isEnabled) {
                setOrganization({ enableAccounting: false })
                return
            }

            setOrganization({ enableAccounting: true })

            // Cargar estadísticas
            const statsRes = await fetch('/api/accounting/reports?type=stats')
            if (statsRes.ok) {
                const statsData = await statsRes.json()
                setStats(statsData)
            }
        } catch (error) {
            console.error('Error loading accounting data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEnableAccounting = async () => {
        try {
            const response = await fetch('/api/accounting/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: session?.user?.organizationId })
            })

            if (response.ok) {
                await fetchAccountingData()
            }
        } catch (error) {
            console.error('Error enabling accounting:', error)
        }
    }

    if (loading) {
        return (
            <Layout title="General" subtitle="Panel general de contabilidad">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        )
    }

    if (!organization?.enableAccounting) {
        return (
            <Layout title="General" subtitle="Panel general de contabilidad">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center max-w-md">
                        <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Módulo de Contabilidad No Habilitado
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Active el módulo contable para acceder a un sistema completo de gestión financiera con plan de cuentas estándar y reportes automáticos.
                        </p>
                        <button
                            onClick={handleEnableAccounting}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Habilitar Contabilidad
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="General" subtitle="Panel general de contabilidad">
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Cuentas Activas</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalAccounts}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FileText className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Asientos este Mes</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.monthlyEntries}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Estado Contable</p>
                                <p className={`text-lg font-bold ${stats.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                    {stats.isBalanced ? 'Balanceado' : 'Desbalanceado'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Calculator className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Último Asiento</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {stats.lastEntry || 'Sin asientos'}
                                </p>
                                {stats.lastEntryDate && (
                                    <p className="text-xs text-gray-500">
                                        {new Date(stats.lastEntryDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/accounting/chart-of-accounts"
                        className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-blue-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className="text-sm text-gray-400">→</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan de Cuentas</h3>
                        <p className="text-sm text-gray-600">
                            Gestiona la estructura contable de tu organización con el plan de cuentas estándar.
                        </p>
                    </Link>

                    <Link href="/accounting/journal"
                        className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-green-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                <FileText className="h-6 w-6 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-400">→</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Libro Diario</h3>
                        <p className="text-sm text-gray-600">
                            Visualiza todos los asientos contables, tanto automáticos como manuales.
                        </p>
                    </Link>

                    <Link href="/accounting/reports"
                        className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-purple-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                <PieChart className="h-6 w-6 text-purple-600" />
                            </div>
                            <span className="text-sm text-gray-400">→</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reportes</h3>
                        <p className="text-sm text-gray-600">
                            Balance general, estado de resultados y otros reportes financieros.
                        </p>
                    </Link>

                    <Link href="/accounting/journal/new"
                        className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-indigo-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                <DollarSign className="h-6 w-6 text-indigo-600" />
                            </div>
                            <span className="text-sm text-gray-400">→</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Asiento Manual</h3>
                        <p className="text-sm text-gray-600">
                            Crea asientos contables manuales para ajustes y correcciones.
                        </p>
                    </Link>

                    <Link href="/accounting/accounts/new"
                        className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-yellow-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                                <BookOpen className="h-6 w-6 text-yellow-600" />
                            </div>
                            <span className="text-sm text-gray-400">→</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nueva Cuenta</h3>
                        <p className="text-sm text-gray-600">
                            Agrega cuentas personalizadas al plan contable estándar.
                        </p>
                    </Link>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gray-200 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-gray-500" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Próximamente</h3>
                        <p className="text-sm text-gray-500">
                            Análisis financieros avanzados, ratios y métricas de negocio.
                        </p>
                    </div>
                </div>

                {/* Recent Entries Preview */}
                {stats.lastEntry && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
                            <Link href="/accounting/journal" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Ver todo →
                            </Link>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p>Último asiento: <span className="font-medium">#{stats.lastEntry}</span></p>
                            <p>Fecha: {stats.lastEntryDate && new Date(stats.lastEntryDate).toLocaleDateString()}</p>
                            <p className="mt-2">
                                Se han registrado <span className="font-medium">{stats.monthlyEntries}</span> asientos este mes.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}