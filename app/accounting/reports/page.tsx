'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { FileText, Download, Calendar, TrendingUp, BarChart3, PieChart, Calculator } from 'lucide-react'

interface BalanceSheetData {
    assets: Array<{
        code: string
        name: string
        balance: number
        children?: Array<{ code: string; name: string; balance: number }>
    }>
    liabilities: Array<{
        code: string
        name: string
        balance: number
        children?: Array<{ code: string; name: string; balance: number }>
    }>
    equity: Array<{
        code: string
        name: string
        balance: number
        children?: Array<{ code: string; name: string; balance: number }>
    }>
    totalAssets: number
    totalLiabilities: number
    totalEquity: number
}

interface IncomeStatementData {
    revenue: Array<{
        code: string
        name: string
        balance: number
        children?: Array<{ code: string; name: string; balance: number }>
    }>
    expenses: Array<{
        code: string
        name: string
        balance: number
        children?: Array<{ code: string; name: string; balance: number }>
    }>
    totalRevenue: number
    totalExpenses: number
    netIncome: number
}

export default function AccountingReports() {
    const { data: session } = useSession()
    const [activeReport, setActiveReport] = useState<'balance' | 'income' | 'trial'>('balance')
    const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null)
    const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData | null>(null)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchReportData()
    }, [session, activeReport, dateRange])

    const fetchReportData = async () => {
        if (!session?.user?.organizationId) return

        try {
            setLoading(true)

            const params = new URLSearchParams({
                type: activeReport,
                from: dateRange.from,
                to: dateRange.to
            })

            const response = await fetch(`/api/accounting/reports?${params}`)
            if (response.ok) {
                const data = await response.json()

                if (activeReport === 'balance') {
                    setBalanceSheet(data)
                } else if (activeReport === 'income') {
                    setIncomeStatement(data)
                }
            }
        } catch (error) {
            console.error('Error loading report data:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(amount)
    }

    const downloadReport = async () => {
        try {
            const params = new URLSearchParams({
                type: activeReport,
                from: dateRange.from,
                to: dateRange.to,
                format: 'pdf'
            })

            const response = await fetch(`/api/accounting/reports/export?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `reporte-${activeReport}-${dateRange.from}-${dateRange.to}.pdf`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error('Error downloading report:', error)
        }
    }

    const renderBalanceSheet = () => {
        if (!balanceSheet) return null

        return (
            <div className="space-y-8">
                {/* Assets */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Activos
                    </h3>
                    <div className="space-y-2">
                        {balanceSheet.assets.map((account) => (
                            <div key={account.code} className="border-b border-gray-100 last:border-b-0 pb-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-900">
                                        {account.code} - {account.name}
                                    </span>
                                    <span className="font-bold text-green-600">
                                        {formatCurrency(account.balance)}
                                    </span>
                                </div>
                                {account.children?.map((child) => (
                                    <div key={child.code} className="ml-6 flex justify-between items-center text-sm text-gray-600 mt-1">
                                        <span>{child.code} - {child.name}</span>
                                        <span>{formatCurrency(child.balance)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div className="border-t-2 border-gray-300 pt-2 mt-4">
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total Activos</span>
                                <span className="text-green-600">{formatCurrency(balanceSheet.totalAssets)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liabilities */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-red-600" />
                        Pasivos
                    </h3>
                    <div className="space-y-2">
                        {balanceSheet.liabilities.map((account) => (
                            <div key={account.code} className="border-b border-gray-100 last:border-b-0 pb-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-900">
                                        {account.code} - {account.name}
                                    </span>
                                    <span className="font-bold text-red-600">
                                        {formatCurrency(account.balance)}
                                    </span>
                                </div>
                                {account.children?.map((child) => (
                                    <div key={child.code} className="ml-6 flex justify-between items-center text-sm text-gray-600 mt-1">
                                        <span>{child.code} - {child.name}</span>
                                        <span>{formatCurrency(child.balance)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div className="border-t-2 border-gray-300 pt-2 mt-4">
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total Pasivos</span>
                                <span className="text-red-600">{formatCurrency(balanceSheet.totalLiabilities)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Equity */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-blue-600" />
                        Patrimonio Neto
                    </h3>
                    <div className="space-y-2">
                        {balanceSheet.equity.map((account) => (
                            <div key={account.code} className="border-b border-gray-100 last:border-b-0 pb-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-900">
                                        {account.code} - {account.name}
                                    </span>
                                    <span className="font-bold text-blue-600">
                                        {formatCurrency(account.balance)}
                                    </span>
                                </div>
                                {account.children?.map((child) => (
                                    <div key={child.code} className="ml-6 flex justify-between items-center text-sm text-gray-600 mt-1">
                                        <span>{child.code} - {child.name}</span>
                                        <span>{formatCurrency(child.balance)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div className="border-t-2 border-gray-300 pt-2 mt-4">
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total Patrimonio</span>
                                <span className="text-blue-600">{formatCurrency(balanceSheet.totalEquity)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Balance Check */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Balance</span>
                        <span className={`text-lg font-bold ${Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) < 0.01 ? '✓ Balanceado' : '✗ Desbalanceado'}
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    const renderIncomeStatement = () => {
        if (!incomeStatement) return null

        return (
            <div className="space-y-8">
                {/* Revenue */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Ingresos
                    </h3>
                    <div className="space-y-2">
                        {incomeStatement.revenue.map((account) => (
                            <div key={account.code} className="border-b border-gray-100 last:border-b-0 pb-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-900">
                                        {account.code} - {account.name}
                                    </span>
                                    <span className="font-bold text-green-600">
                                        {formatCurrency(account.balance)}
                                    </span>
                                </div>
                                {account.children?.map((child) => (
                                    <div key={child.code} className="ml-6 flex justify-between items-center text-sm text-gray-600 mt-1">
                                        <span>{child.code} - {child.name}</span>
                                        <span>{formatCurrency(child.balance)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div className="border-t-2 border-gray-300 pt-2 mt-4">
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total Ingresos</span>
                                <span className="text-green-600">{formatCurrency(incomeStatement.totalRevenue)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expenses */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-red-600" />
                        Gastos
                    </h3>
                    <div className="space-y-2">
                        {incomeStatement.expenses.map((account) => (
                            <div key={account.code} className="border-b border-gray-100 last:border-b-0 pb-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-900">
                                        {account.code} - {account.name}
                                    </span>
                                    <span className="font-bold text-red-600">
                                        {formatCurrency(Math.abs(account.balance))}
                                    </span>
                                </div>
                                {account.children?.map((child) => (
                                    <div key={child.code} className="ml-6 flex justify-between items-center text-sm text-gray-600 mt-1">
                                        <span>{child.code} - {child.name}</span>
                                        <span>{formatCurrency(Math.abs(child.balance))}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div className="border-t-2 border-gray-300 pt-2 mt-4">
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total Gastos</span>
                                <span className="text-red-600">{formatCurrency(Math.abs(incomeStatement.totalExpenses))}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Net Income */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">Resultado Neto</span>
                        <span className={`text-xl font-bold ${incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(incomeStatement.netIncome)}
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Layout title="Reportes Contables" subtitle="Estados financieros y reportes">
            <div className="space-y-6">
                {/* Header Controls */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveReport('balance')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeReport === 'balance'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <FileText className="h-4 w-4 inline mr-2" />
                                Balance General
                            </button>
                            <button
                                onClick={() => setActiveReport('income')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeReport === 'income'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <TrendingUp className="h-4 w-4 inline mr-2" />
                                Estado de Resultados
                            </button>
                            <button
                                onClick={() => setActiveReport('trial')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeReport === 'trial'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Calculator className="h-4 w-4 inline mr-2" />
                                Balance de Sumas y Saldos
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                                />
                            </div>
                            <button
                                onClick={downloadReport}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                            >
                                <Download className="h-4 w-4" />
                                Exportar PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {activeReport === 'balance' && renderBalanceSheet()}
                        {activeReport === 'income' && renderIncomeStatement()}
                        {activeReport === 'trial' && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="text-center py-12">
                                    <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Balance de Sumas y Saldos
                                    </h3>
                                    <p className="text-gray-500">
                                        Próximamente disponible
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}