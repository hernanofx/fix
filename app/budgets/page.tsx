'use client'

import Layout from '../../components/Layout'
import BudgetFormModal from '../../components/modals/BudgetFormModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '@/components/ui/Pagination'
import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '../../components/ToastProvider'
import ErrorBoundary from '../../components/ErrorBoundary'
import { Suspense } from 'react'

export default function Budgets() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <BudgetsContent />
        </Suspense>
    )
}

function BudgetsContent() {
    const [budgets, setBudgets] = useState<any[]>([])
    const toast = useToast()

    const [modals, setModals] = useState({
        create: false,
        edit: false,
        view: false,
        delete: false
    })

    const [selectedBudget, setSelectedBudget] = useState<any>(null)

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const { data: session } = useSession()
    const searchParams = useSearchParams()

    useEffect(() => {
        const load = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const res = await fetch(`/api/budgets?organizationId=${organizationId}`)
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Failed to load budgets'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const data = await res.json()
                setBudgets(Array.isArray(data) ? data : [])
            } catch (err: any) {
                console.error(err)
                toast.error(err.message || 'No se pudieron cargar los presupuestos')
            }
        }
        load()
    }, [session])

    // Detectar parámetro modal=create en la URL y abrir modal automáticamente
    useEffect(() => {
        const modal = searchParams.get('modal')
        if (modal === 'create') {
            openModal('create')
        }
    }, [searchParams])

    // Datos paginados para mostrar
    const paginatedBudgets = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return Array.isArray(budgets) ? budgets.slice(startIndex, endIndex) : []
    }, [budgets, currentPage, itemsPerPage])

    // Reset to first page when budgets change
    useEffect(() => {
        setCurrentPage(1)
    }, [budgets])

    // Calculate total pages
    const totalPages = Math.ceil((Array.isArray(budgets) ? budgets.length : 0) / itemsPerPage)

    const openModal = async (modalType: keyof typeof modals, budget?: any) => {
        if ((modalType === 'edit' || modalType === 'view') && budget?.id) {
            try {
                const res = await fetch(`/api/budgets/${budget.id}`)
                if (!res.ok) throw new Error('Failed to fetch budget')
                const data = await res.json()
                setSelectedBudget(data)
                setModals({ ...modals, [modalType]: true })
                return
            } catch (err) {
                console.error(err)
                toast.error('No se pudo cargar el presupuesto para visualizar')
                return
            }
        }

        setSelectedBudget(budget)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedBudget(null)
    }

    const handleSaveBudget = async (budgetData: any) => {
        try {
            const userId = session?.user?.id as string | undefined
            const organizationId = (session as any)?.user?.organizationId as string | undefined

            if (selectedBudget?.id) {
                const res = await fetch(`/api/budgets/${selectedBudget.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(budgetData)
                })
                if (!res.ok) throw new Error('Error updating budget')
                const updated = await res.json()
                setBudgets(budgets.map(b => b.id === updated.id ? updated : b))
            } else {
                const payload = { ...budgetData, createdById: userId, organizationId }
                const res = await fetch('/api/budgets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                if (!res.ok) throw new Error('Error creating budget')
                const created = await res.json()
                setBudgets([created, ...budgets])
            }

            closeModal('create')
            closeModal('edit')
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || 'Error al guardar presupuesto')
        }
    }

    const handleDeleteBudget = async () => {
        if (!selectedBudget?.id) return
        try {
            const res = await fetch(`/api/budgets/${selectedBudget.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Error deleting')
            setBudgets(budgets.filter(b => b.id !== selectedBudget.id))
            closeModal('delete')
        } catch (err: any) {
            console.error(err)
            toast.error('No se pudo eliminar el presupuesto')
        }
    }

    // Export handlers (Excel / PDF) - placed same as other views
    const handleExportExcel = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) throw new Error('Organization not found')
            const response = await fetch(`/api/budgets/export/excel?organizationId=${organizationId}`)
            if (!response.ok) throw new Error('Error al exportar presupuestos')
            const blob = await response.blob()
            const a = document.createElement('a')
            const url = window.URL.createObjectURL(blob)
            a.href = url
            a.download = `presupuestos_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            toast.success('Presupuestos exportados exitosamente')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Error al exportar presupuestos')
        }
    }

    const handleExportPDF = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) throw new Error('Organization not found')
            const response = await fetch(`/api/budgets/export/pdf?organizationId=${organizationId}`)
            if (!response.ok) throw new Error('Error al exportar presupuestos en PDF')
            const blob = await response.blob()
            const a = document.createElement('a')
            const url = window.URL.createObjectURL(blob)
            a.href = url
            a.download = `presupuestos_report_${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            toast.success('Presupuestos exportados (PDF) exitosamente')
        } catch (error) {
            console.error('Export PDF error:', error)
            toast.error('Error al exportar presupuestos en PDF')
        }
    }

    return (
        <Layout
            title="Presupuestos"
            subtitle="Control de costos y presupuestos"
        >
            <div className="flex justify-between items-center mb-8">
                <div></div>
                <button
                    onClick={() => openModal('create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Nuevo Presupuesto
                </button>
            </div>

            {/* Budgets List */}
            <div className="space-y-6">
                <ErrorBoundary>
                    {paginatedBudgets.map((budget, idx) => {
                        try {
                            // Totals grouped by currency (do not sum across different currencies)
                            const items = Array.isArray(budget?.items) ? budget.items : []
                            const totalsByCurrency: Record<string, { count: number; amount: number }> = {}
                            items.forEach((it: any) => {
                                const cur = it?.currency || 'PESOS'
                                if (!totalsByCurrency[cur]) totalsByCurrency[cur] = { count: 0, amount: 0 }
                                totalsByCurrency[cur].count += 1
                                totalsByCurrency[cur].amount += Number(it?.cost || 0)
                            })

                            const currencies = Object.keys(totalsByCurrency)

                            // Support spent stored per-currency (object) or as a single numeric value
                            let spentByCurrency: Record<string, number> = {}
                            if (budget?.spent && typeof budget.spent === 'object' && !Array.isArray(budget.spent)) {
                                try {
                                    Object.entries(budget.spent).forEach(([k, v]) => {
                                        spentByCurrency[k] = Number(v || 0)
                                    })
                                } catch (e) {
                                    // fallback
                                }
                            } else if (budget?.spent != null && currencies.length === 1) {
                                // legacy single numeric spent
                                spentByCurrency[currencies[0]] = Number(budget.spent || 0)
                            } else {
                                // default 0 for each currency
                                currencies.forEach(c => { spentByCurrency[c] = 0 })
                            }
                            const spentTotalForSingleCurrency = currencies.length === 1 ? (spentByCurrency[currencies[0]] || 0) : 0
                            const projectName = budget?.project?.name || 'Sin proyecto'

                            // If single currency, compute amount/progress for progress bar
                            const amount = currencies.length === 1 ? (totalsByCurrency[currencies[0]].amount || 0) : 0
                            const progress = amount > 0 ? Math.round((spentTotalForSingleCurrency / amount) * 100) : 0

                            const currencyCodeMap: Record<string, string> = { PESOS: 'ARS', USD: 'USD', EUR: 'EUR' }
                            const formatCurrency = (n: number, cur = 'PESOS') => {
                                const code = currencyCodeMap[cur] || cur || 'USD'
                                try { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: code }).format(n) }
                                catch { return `$${Number(n || 0).toFixed(2)}` }
                            }

                            return (
                                <div key={budget?.id ?? `b-${idx}`} className="bg-white shadow-sm rounded-lg border border-gray-200">
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">{budget?.name || `Presupuesto ${budget?.id?.slice(-8) || idx + 1}`}</h3>
                                                <p className="text-sm text-gray-600">{projectName}</p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${budget?.status === 'Completado' ? 'bg-green-100 text-green-800' : (budget?.status === 'En curso' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800')}`}>
                                                {budget?.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="min-w-0">
                                                <dt className="text-sm font-medium text-gray-500">Presupuesto Total</dt>
                                                <dd className="text-2xl font-semibold text-gray-900">
                                                    {currencies.length === 0 && '-'}
                                                    {currencies.length === 1 && (
                                                        <>{formatCurrency(totalsByCurrency[currencies[0]].amount, currencies[0])}</>
                                                    )}
                                                    {currencies.length > 1 && (
                                                        <div className="flex flex-col gap-1">
                                                            {currencies.map(cur => (
                                                                <div key={cur} className="text-sm text-gray-700">{cur}: {formatCurrency(totalsByCurrency[cur].amount, cur)}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="min-w-0 text-right">
                                                <dt className="text-sm font-medium text-gray-500">Gastado</dt>
                                                <dd className="text-2xl font-semibold text-red-600">
                                                    {currencies.length === 1 ? (
                                                        Number.isFinite(spentTotalForSingleCurrency) ? formatCurrency(spentTotalForSingleCurrency, currencies[0]) : '-'
                                                    ) : (
                                                        <div className="flex flex-col gap-1 text-sm text-gray-700">
                                                            {currencies.map(cur => (
                                                                <div key={cur}>{cur}: {formatCurrency(spentByCurrency[cur] || 0, cur)}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="min-w-0 text-right">
                                                <dt className="text-sm font-medium text-gray-500">Restante</dt>
                                                <dd className="text-2xl font-semibold text-green-600">
                                                    {currencies.length === 1 ? (
                                                        (() => {
                                                            const total = totalsByCurrency[currencies[0]].amount || 0
                                                            const rem = total - (spentTotalForSingleCurrency || 0)
                                                            return formatCurrency(rem, currencies[0])
                                                        })()
                                                    ) : (
                                                        <div className="flex flex-col gap-1 text-sm text-gray-700">
                                                            {currencies.map(cur => {
                                                                const total = totalsByCurrency[cur]?.amount || 0
                                                                const rem = total - (spentByCurrency[cur] || 0)
                                                                return <div key={cur}>{cur}: {formatCurrency(rem, cur)}</div>
                                                            })}
                                                        </div>
                                                    )}
                                                </dd>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                <span>Progreso</span>
                                                <span>{amount > 0 ? `${progress}%` : '-'}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-blue-600 h-3 rounded-full"
                                                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="flex space-x-4">
                                            <button
                                                onClick={() => openModal('view', budget)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                Ver detalles
                                            </button>
                                            <button
                                                onClick={() => openModal('edit', budget)}
                                                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                            >
                                                Editar presupuesto
                                            </button>
                                            <button
                                                onClick={() => openModal('delete', budget)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        } catch (e) {
                            // Surface the problematic budget item in the console for debugging
                            console.error('Error rendering budget item', { idx, budget, error: e })
                            return (
                                <div key={budget?.id ?? `err-${idx}`} className="p-4 bg-red-50 rounded">
                                    <div className="text-red-700">Error al renderizar este presupuesto. Revise la consola.</div>
                                </div>
                            )
                        }
                    })}
                </ErrorBoundary>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={Array.isArray(budgets) ? budgets.length : 0}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                </div>
            )}

            {/* Summary */}
            <div className="mt-4 text-sm text-gray-600 text-center">
                Mostrando {paginatedBudgets.length} de {Array.isArray(budgets) ? budgets.length : 0} presupuestos
            </div>

            {/* Modals */}
            <BudgetFormModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSaveBudget}
            />

            <BudgetFormModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                budget={selectedBudget}
                onSave={handleSaveBudget}
            />

            <BudgetFormModal
                isOpen={modals.view}
                onClose={() => closeModal('view')}
                budget={selectedBudget}
                onSave={handleSaveBudget}
                readOnly={true}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteBudget}
                title="Eliminar Presupuesto"
                message="¿Estás seguro de que quieres eliminar este presupuesto?"
                itemName={selectedBudget?.project?.name || 'este presupuesto'}
            />
        </Layout>
    )
}
