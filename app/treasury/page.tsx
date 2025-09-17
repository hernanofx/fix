"use client"

import Layout from '../../components/Layout'
import TransactionFormModal from '../../components/modals/TransactionFormModal'
import TransferModal from '../../components/modals/TransferModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '@/components/ui/Pagination'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    BanknotesIcon,
    BuildingLibraryIcon
} from '@heroicons/react/24/outline'

export default function Treasury() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <TreasuryContent />
        </Suspense>
    )
}

function TreasuryContent() {
    const { data: session } = useSession()
    const searchParams = useSearchParams()
    const [accounts, setAccounts] = useState<any[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [monthlyIncome, setMonthlyIncome] = useState<number>(0)
    const [monthlyExpense, setMonthlyExpense] = useState<number>(0)
    const [pesosBalance, setPesosBalance] = useState<number>(0)
    const [usdBalance, setUsdBalance] = useState<number>(0)
    const [eurBalance, setEurBalance] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    const [modals, setModals] = useState({
        income: false,
        expense: false,
        editTransaction: false,
        deleteTransaction: false,
        transfer: false,
    })

    const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

    // Estado para filtros y ordenamiento
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [projectFilter, setProjectFilter] = useState<string>('all')
    const [currencyFilter, setCurrencyFilter] = useState<string>('all')
    const [originFilter, setOriginFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('date')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Estado para búsqueda
    const [searchTerm, setSearchTerm] = useState('')

    // Estados para importación
    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setDropdownOpen(null)
        }

        if (dropdownOpen) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [dropdownOpen])

    useEffect(() => {
        const load = async () => {
            try {
                const orgId = (session as any)?.user?.organizationId
                if (!orgId) return

                // Incluir parámetros de ordenamiento en la llamada a la API
                const params = new URLSearchParams({
                    organizationId: orgId,
                    sortField: sortField,
                    sortDirection: sortDirection
                })

                const res = await fetch(`/api/treasury?${params}`)
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Failed to load accounts'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const data = await res.json()
                setAccounts(data.accounts || [])
                setTransactions(data.transactions || [])

                // Set monthly data
                setMonthlyIncome(data.monthlyIncome || 0)
                setMonthlyExpense(data.monthlyExpense || 0)

                // Set balances by currency
                const balancesByCurrency = data.balancesByCurrency || {}
                setPesosBalance(balancesByCurrency.PESOS || 0)
                setUsdBalance(balancesByCurrency.USD || 0)
                setEurBalance(balancesByCurrency.EUR || 0)

                // Load projects for selects
                const resProj = await fetch(`/api/projects?organizationId=${orgId}`)
                if (resProj.ok) {
                    const projs = await resProj.json()
                    setProjects(projs)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [session, sortField, sortDirection])

    // Detect modal parameter from URL
    useEffect(() => {
        const modal = searchParams.get('modal')
        if (modal === 'create') {
            openModal('income')
        }
    }, [searchParams])

    // Listen for cross-module events telling treasury to refresh (e.g., bill created with transaction)
    useEffect(() => {
        const handler = (e: any) => {
            const orgId = (session as any)?.user?.organizationId
            if (!orgId) return

            const createdTxId = e?.detail?.id

            const refreshParams = new URLSearchParams({ organizationId: orgId, sortField: sortField, sortDirection: sortDirection })

            // helper to fetch and update state
            const fetchAndUpdate = async () => {
                try {
                    const res = await fetch(`/api/treasury?${refreshParams}`)
                    if (!res.ok) return null
                    const data = await res.json()
                    setAccounts(data.accounts || [])
                    setTransactions(data.transactions || [])
                    setMonthlyIncome(data.monthlyIncome || 0)
                    setMonthlyExpense(data.monthlyExpense || 0)
                    const balancesByCurrency = data.balancesByCurrency || {}
                    setPesosBalance(balancesByCurrency.PESOS || 0)
                    setUsdBalance(balancesByCurrency.USD || 0)
                    setEurBalance(balancesByCurrency.EUR || 0)
                    return data
                } catch (err) {
                    console.error('Error refreshing treasury after event:', err)
                    return null
                }
            }

            // If we don't have a created transaction id, just fetch once
            if (!createdTxId) {
                fetchAndUpdate()
                return
            }

            // Try immediate fetch and, if the created transaction is not present yet, retry a few times
            ; (async () => {
                const maxRetries = 3
                const delays = [0, 300, 800] // ms
                for (let attempt = 0; attempt < Math.min(maxRetries, delays.length); attempt++) {
                    if (attempt > 0) await new Promise(res => setTimeout(res, delays[attempt]))
                    const data = await fetchAndUpdate()
                    if (!data) continue
                    const found = Array.isArray(data.transactions) && data.transactions.some((t: any) => t.id === createdTxId)
                    if (found) {
                        // Done
                        return
                    }
                    // otherwise continue retrying
                }
                // Final fallback: ensure UI refreshed even if tx not found
                const finalData = await fetchAndUpdate()

                // If after retries the transaction is still not present, try to insert the event detail into UI state
                try {
                    const createdTx = e?.detail
                    const txId = createdTx?.id
                    if (txId) {
                        const present = Array.isArray(finalData?.transactions) && finalData.transactions.some((t: any) => t.id === txId)
                        if (!present) {
                            // Normalize type for UI ('Ingreso'|'Egreso')
                            const uiTx = {
                                ...createdTx,
                                type: createdTx.type === 'INCOME' ? 'Ingreso' : (createdTx.type === 'EXPENSE' ? 'Egreso' : createdTx.type)
                            }

                            // Insert transaction at top if not already present
                            setTransactions(prev => {
                                if (prev.some(t => t.id === txId)) return prev
                                return [uiTx, ...prev]
                            })

                            // Update accounts state: adjust the affected account's balance and balancesByCurrency
                            const accountId = createdTx.cashBoxId || createdTx.bankAccountId
                            const isIncome = createdTx.type === 'INCOME'
                            const amount = typeof createdTx.amount === 'object' && createdTx.amount?.toNumber ? createdTx.amount.toNumber() : Number(createdTx.amount || 0)
                            const currency = createdTx.currency || 'PESOS'

                            setAccounts(prev => prev.map(acc => {
                                if (acc.id !== accountId) return acc
                                const prevBalance = Number(acc.balance || 0)
                                const newBalance = isIncome ? prevBalance + amount : prevBalance - amount
                                const prevBalancesByCurrency = acc.balancesByCurrency || { PESOS: 0, USD: 0, EUR: 0 }
                                const updatedBalancesByCurrency = { ...prevBalancesByCurrency }
                                updatedBalancesByCurrency[currency] = (updatedBalancesByCurrency[currency] || 0) + (isIncome ? amount : -amount)
                                return { ...acc, balance: newBalance, balancesByCurrency: updatedBalancesByCurrency }
                            }))

                            // Update global balances by currency
                            if (currency === 'PESOS') setPesosBalance(prev => prev + (isIncome ? amount : -amount))
                            if (currency === 'USD') setUsdBalance(prev => prev + (isIncome ? amount : -amount))
                            if (currency === 'EUR') setEurBalance(prev => prev + (isIncome ? amount : -amount))

                            // Update monthly metrics if date is in current month
                            try {
                                const txDate = createdTx.date ? new Date(createdTx.date) : new Date()
                                const now = new Date()
                                if (txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth()) {
                                    if (isIncome) setMonthlyIncome(prev => prev + amount)
                                    else setMonthlyExpense(prev => prev + amount)
                                }
                            } catch (err) {
                                // ignore date parsing errors
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error applying fallback createdTx to UI state:', err)
                }
            })()
        }

        const deleteHandler = (e: any) => {
            console.log('🔥 Treasury received treasury:transactionDeleted event', e.detail)

            const orgId = (session as any)?.user?.organizationId
            if (!orgId) {
                console.log('❌ No organizationId found, skipping refresh')
                return
            }

            // Método más agresivo: múltiples refreshes para asegurar actualización
            const forceRefresh = async () => {
                const refreshParams = new URLSearchParams({ organizationId: orgId, sortField: sortField, sortDirection: sortDirection })

                try {
                    console.log('🔄 Force refreshing treasury data after delete event...')
                    const res = await fetch(`/api/treasury?${refreshParams}&_t=${Date.now()}`) // Cache busting
                    if (!res.ok) {
                        console.log('❌ Failed to fetch treasury data:', res.status)
                        return
                    }
                    const data = await res.json()
                    console.log('✅ Treasury data force refreshed successfully', {
                        accountsCount: data.accounts?.length || 0,
                        transactionsCount: data.transactions?.length || 0,
                        pesosBalance: data.balancesByCurrency?.PESOS || 0
                    })
                    setAccounts(data.accounts || [])
                    setTransactions(data.transactions || [])
                    setMonthlyIncome(data.monthlyIncome || 0)
                    setMonthlyExpense(data.monthlyExpense || 0)
                    const balancesByCurrency = data.balancesByCurrency || {}
                    setPesosBalance(balancesByCurrency.PESOS || 0)
                    setUsdBalance(balancesByCurrency.USD || 0)
                    setEurBalance(balancesByCurrency.EUR || 0)
                } catch (err) {
                    console.error('Error force refreshing treasury after delete event:', err)
                }
            }

            // Múltiples refreshes con delays diferentes
            setTimeout(forceRefresh, 500)
            setTimeout(forceRefresh, 1500)
            setTimeout(forceRefresh, 3000)
        }

        window.addEventListener('treasury:transactionCreated', handler as EventListener)
        window.addEventListener('treasury:transactionDeleted', deleteHandler as EventListener)
        return () => {
            window.removeEventListener('treasury:transactionCreated', handler as EventListener)
            window.removeEventListener('treasury:transactionDeleted', deleteHandler as EventListener)
        }
    }, [session, sortField, sortDirection])

    // Función para determinar el origen de la transacción
    const getTransactionOrigin = (transaction: any) => {
        console.log('🔍 getTransactionOrigin:', {
            id: transaction.id,
            reference: transaction.reference,
            description: transaction.description,
            category: transaction.category,
            type: transaction.type
        })

        // Verificar por reference y categoría/tipo para mayor precisión
        if (transaction.reference?.startsWith('PAY-')) {
            // Distinguir entre collections y payrolls por categoría y tipo
            if (transaction.category === 'Cobranza' && transaction.type === 'Ingreso') {
                return 'Clientes'
            }
            if (transaction.category === 'Nómina' && transaction.type === 'Egreso') {
                return 'Empleados'
            }
        }

        // Verificar otros tipos de reference
        if (transaction.reference) {
            if (transaction.reference.startsWith('BILL-PAY-')) return 'Facturas'
            if (transaction.reference.startsWith('EXPENSE-')) return 'Gastos'
            if (transaction.reference.startsWith('PURCHASE-')) return 'Compras'
            if (transaction.reference.includes('MANUAL')) return 'Manual'
            if (transaction.reference.includes('IMPORT')) return 'Importación'
        }

        // Si no hay reference, intentar determinar por categoría y descripción
        if (transaction.category) {
            if (transaction.category === 'Nómina' || transaction.category === 'Nomina') return 'Empleados'
            if (transaction.category === 'Cobro' || transaction.category === 'Cobranza') return 'Clientes'
            if (transaction.category === 'Pago Factura' || transaction.category === 'Factura') return 'Facturas'
        }

        // También verificar por descripción si contiene palabras clave
        if (transaction.description) {
            if (transaction.description.toLowerCase().includes('nómina') ||
                transaction.description.toLowerCase().includes('nomina') ||
                transaction.description.toLowerCase().includes('salario')) return 'Empleados'
            if (transaction.description.toLowerCase().includes('cobro') ||
                transaction.description.toLowerCase().includes('cobranza') ||
                transaction.description.toLowerCase().includes('cliente')) return 'Clientes'
        }

        return 'Tesorería'
    }    // Filtered and sorted transactions (sin paginación para estadísticas)
    const filteredTransactions = useMemo(() => {
        let filtered = transactions

        // Aplicar filtro de categoría
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(transaction => transaction.category === categoryFilter)
        }

        // Aplicar filtro de proyecto
        if (projectFilter !== 'all') {
            filtered = filtered.filter(transaction => transaction.projectId === projectFilter)
        }

        // Aplicar filtro de moneda
        if (currencyFilter !== 'all') {
            filtered = filtered.filter(transaction => transaction.currency === currencyFilter)
        }

        // Aplicar filtro de origen
        if (originFilter !== 'all') {
            filtered = filtered.filter(transaction => getTransactionOrigin(transaction) === originFilter)
        }

        // Aplicar filtro de búsqueda
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim()
            filtered = filtered.filter(transaction =>
                transaction.description?.toLowerCase().includes(term) ||
                transaction.category?.toLowerCase().includes(term) ||
                transaction.type?.toLowerCase().includes(term) ||
                transaction.cashBox?.name?.toLowerCase().includes(term) ||
                transaction.bankAccount?.name?.toLowerCase().includes(term) ||
                transaction.amount?.toString().includes(term) ||
                getTransactionOrigin(transaction).toLowerCase().includes(term) ||
                (transaction.date && new Date(transaction.date).toLocaleDateString('es-ES').includes(term))
            )
        }

        // El ordenamiento ya se hace en el backend, no necesitamos ordenar aquí
        return filtered
    }, [transactions, categoryFilter, projectFilter, currencyFilter, originFilter, searchTerm])

    // Datos paginados para mostrar
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredTransactions.slice(startIndex, endIndex)
    }, [filteredTransactions, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [categoryFilter, projectFilter, currencyFilter, originFilter, sortField, sortDirection, searchTerm])

    // Calculate total pages
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

    // Obtener categorías únicas para el filtro
    const uniqueCategories = useMemo(() => {
        const categories = transactions.map(t => t.category).filter(Boolean)
        return Array.from(new Set(categories)).sort()
    }, [transactions])

    // Obtener orígenes únicos para el filtro
    const uniqueOrigins = useMemo(() => {
        const origins = transactions.map(t => getTransactionOrigin(t)).filter(Boolean)
        return Array.from(new Set(origins)).sort()
    }, [transactions])

    // Función para manejar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    // Función para manejar importación desde Excel
    const handleImportExcel = () => {
        setShowImportModal(true)
    }

    // Función para manejar exportación a Excel
    const handleExportExcel = async () => {
        try {
            const orgId = (session as any)?.user?.organizationId
            if (!orgId) {
                alert('No se pudo obtener la organización')
                return
            }

            const response = await fetch(`/api/treasury/export/excel?organizationId=${orgId}&categoryFilter=${categoryFilter}&searchTerm=${encodeURIComponent(searchTerm)}`)

            if (!response.ok) {
                throw new Error('Error al exportar')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `transacciones_tesoreria_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error exporting to Excel:', error)
            alert('Error al exportar a Excel')
        }
    }

    // Función para manejar exportación a PDF
    const handleExportPDF = async () => {
        try {
            const orgId = (session as any)?.user?.organizationId
            if (!orgId) {
                alert('No se pudo obtener la organización')
                return
            }

            const response = await fetch(`/api/treasury/export/pdf?organizationId=${orgId}&categoryFilter=${categoryFilter}&searchTerm=${encodeURIComponent(searchTerm)}`)

            if (!response.ok) {
                throw new Error('Error al exportar')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `transacciones_tesoreria_${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error exporting to PDF:', error)
            alert('Error al exportar a PDF')
        }
    }

    // Función para procesar el archivo importado
    const handleFileImport = async (file: File) => {
        if (!file) return

        setImporting(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('organizationId', (session as any)?.user?.organizationId)

            const endpoint = '/api/treasury/import/excel'

            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error || 'Error al importar archivo')
            }

            const result = await res.json()

            // Recargar los datos
            const orgId = (session as any)?.user?.organizationId
            if (orgId) {
                const refreshParams = new URLSearchParams({
                    organizationId: orgId,
                    sortField: sortField,
                    sortDirection: sortDirection
                })
                const refreshRes = await fetch(`/api/treasury?${refreshParams}`)
                if (refreshRes.ok) {
                    const data = await refreshRes.json()
                    setAccounts(data.accounts || [])
                    setTransactions(data.transactions || [])
                    setMonthlyIncome(data.monthlyIncome || 0)
                    setMonthlyExpense(data.monthlyExpense || 0)
                    const balancesByCurrency = data.balancesByCurrency || {}
                    setPesosBalance(balancesByCurrency.PESOS || 0)
                    setUsdBalance(balancesByCurrency.USD || 0)
                    setEurBalance(balancesByCurrency.EUR || 0)
                }
            }

            alert(`Archivo importado exitosamente. ${result.importedCount || 0} registros procesados.`)
            setShowImportModal(false)
        } catch (error) {
            console.error('Error importing file:', error)
            alert(`Error al importar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        } finally {
            setImporting(false)
        }
    }

    const openModal = (modalType: 'income' | 'expense' | 'editTransaction' | 'deleteTransaction' | 'transfer', transaction?: any) => {
        setSelectedTransaction(transaction)
        setModals((m) => ({ ...m, [modalType]: true }))
    }

    const closeModal = (modalType: 'income' | 'expense' | 'editTransaction' | 'deleteTransaction' | 'transfer') => {
        setModals((m) => ({ ...m, [modalType]: false }))
        setSelectedTransaction(null)
    }

    const handleSaveTransaction = async (transactionData: any) => {
        try {
            const orgId = (session as any)?.user?.organizationId
            const userId = (session as any)?.user?.id

            if (!orgId) {
                throw new Error('No organization ID found')
            }

            if (selectedTransaction?.id) {
                const res = await fetch(`/api/treasury/${selectedTransaction.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...transactionData, organizationId: orgId, createdById: userId }),
                })
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Error updating transaction'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const updated = await res.json()
                setTransactions(ts => ts.map(t => (t.id === updated.id ? updated : t)))

                // Refrescar los datos para actualizar balances después de editar
                const refreshParams = new URLSearchParams({
                    organizationId: orgId,
                    sortField: sortField,
                    sortDirection: sortDirection
                })
                const refreshRes = await fetch(`/api/treasury?${refreshParams}`)
                if (refreshRes.ok) {
                    const data = await refreshRes.json()
                    setAccounts(data.accounts || [])
                    setTransactions(data.transactions || [])
                    setMonthlyIncome(data.monthlyIncome || 0)
                    setMonthlyExpense(data.monthlyExpense || 0)
                    const balancesByCurrency = data.balancesByCurrency || {}
                    setPesosBalance(balancesByCurrency.PESOS || 0)
                    setUsdBalance(balancesByCurrency.USD || 0)
                    setEurBalance(balancesByCurrency.EUR || 0)
                }

                // Mostrar mensaje de éxito
                alert('Transacción actualizada exitosamente.')
            } else if (transactionData.type === 'transfer') {
                // Crear dos transacciones para la transferencia
                const transferDescription = `Transferencia: ${transactionData.description}`

                // Transacción de egreso
                const expensePayload = {
                    type: 'transaction',
                    amount: transactionData.amount,
                    description: `${transferDescription} (Egreso)`,
                    category: 'Transferencia',
                    date: transactionData.date,
                    projectId: transactionData.fromProject,
                    transactionType: 'EXPENSE',
                    organizationId: orgId,
                    createdById: userId,
                    currency: transactionData.currency // Remove fallback to ensure currency is always passed
                }

                const resExpense = await fetch('/api/treasury', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(expensePayload),
                })

                if (!resExpense.ok) {
                    throw new Error('Error creating expense transaction')
                }

                const expenseTransaction = await resExpense.json()

                // Transacción de ingreso
                const incomePayload = {
                    type: 'transaction',
                    amount: transactionData.amount,
                    description: `${transferDescription} (Ingreso)`,
                    category: 'Transferencia',
                    date: transactionData.date,
                    projectId: transactionData.toProject,
                    transactionType: 'INCOME',
                    organizationId: orgId,
                    createdById: userId,
                    currency: transactionData.currency // Remove fallback to ensure currency is always passed
                }

                const resIncome = await fetch('/api/treasury', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(incomePayload),
                })

                if (!resIncome.ok) {
                    throw new Error('Error creating income transaction')
                }

                const incomeTransaction = await resIncome.json()

                setTransactions(prev => [incomeTransaction, expenseTransaction, ...prev])
            } else {
                const payload = {
                    type: 'transaction',
                    amount: transactionData.amount,
                    description: transactionData.description,
                    category: transactionData.category,
                    date: transactionData.date,
                    projectId: transactionData.projectId,
                    notes: transactionData.notes,
                    transactionType: transactionData.type === 'Ingreso' ? 'INCOME' : 'EXPENSE',
                    organizationId: orgId,
                    createdById: userId,
                    cashBoxId: transactionData.cashBoxId,
                    bankAccountId: transactionData.bankAccountId,
                    currency: transactionData.currency // Remove fallback to ensure currency is always passed
                }
                const res = await fetch('/api/treasury', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Error creating transaction'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const created = await res.json()
                setTransactions(prev => [created, ...prev])
            }
        } catch (e) {
            console.error(e)
            alert('Error al guardar la transacción. Por favor, intenta nuevamente.')
        } finally {
            // Cerrar el modal correspondiente después de guardar (éxito o error)
            if (selectedTransaction?.id) {
                closeModal('editTransaction')
            } else if (transactionData.type === 'Ingreso') {
                closeModal('income')
            } else if (transactionData.type === 'Egreso') {
                closeModal('expense')
            }
        }
    }

    const [deleteMessage, setDeleteMessage] = useState<string>('')

    const handleDeleteTransaction = async () => {
        try {
            if (!selectedTransaction?.id) return

            // Determinar el origen de la transacción para eliminar registros relacionados
            const origin = getTransactionOrigin(selectedTransaction)
            const orgId = (session as any)?.user?.organizationId

            // Eliminar la transacción de tesorería
            const res = await fetch(`/api/treasury/${selectedTransaction.id}`, { method: 'DELETE' })
            if (!res.ok) {
                const txt = await res.text().catch(() => null)
                let msg = 'Error deleting'
                try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                throw new Error(msg)
            }

            // Eliminar registros relacionados según el origen
            if (origin === 'Clientes' && selectedTransaction.reference?.startsWith('PAY-') &&
                selectedTransaction.category === 'Cobranza' && selectedTransaction.type === 'Ingreso') {
                // Extraer el ID de la cobranza del reference (formato: PAY-{id})
                const collectionId = selectedTransaction.reference.replace('PAY-', '')
                try {
                    const deleteCollectionRes = await fetch(`/api/collections/${collectionId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ organizationId: orgId })
                    })
                    if (!deleteCollectionRes.ok) {
                        console.warn('No se pudo eliminar la cobranza relacionada:', collectionId)
                    } else {
                        console.log('✅ Cobranza eliminada:', collectionId)
                    }
                } catch (err) {
                    console.error('Error eliminando cobranza relacionada:', err)
                }
            }

            if (origin === 'Empleados' && selectedTransaction.reference?.startsWith('PAY-') &&
                selectedTransaction.category === 'Nómina' && selectedTransaction.type === 'Egreso') {
                // Extraer el ID de la nómina del reference (formato: PAY-{id})
                const payrollId = selectedTransaction.reference.replace('PAY-', '')
                try {
                    const deletePayrollRes = await fetch(`/api/payrolls/${payrollId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ organizationId: orgId })
                    })
                    if (!deletePayrollRes.ok) {
                        console.warn('No se pudo eliminar la nómina relacionada:', payrollId)
                    } else {
                        console.log('✅ Nómina eliminada:', payrollId)
                    }
                } catch (err) {
                    console.error('Error eliminando nómina relacionada:', err)
                }
            }

            // Eliminar cheque relacionado si es una transacción de cheque
            if ((selectedTransaction.category === 'CHEQUE_PAGADO' || selectedTransaction.category === 'CHEQUE_COBRADO')) {
                // Intentar extraer el ID del cheque del reference (formatos posibles: CHECK-PAY-{id}, CHECK-CLEAR-{id}, CHK-{id})
                let checkId = null

                if (selectedTransaction.reference?.startsWith('CHECK-PAY-')) {
                    checkId = selectedTransaction.reference.replace('CHECK-PAY-', '')
                } else if (selectedTransaction.reference?.startsWith('CHECK-CLEAR-')) {
                    checkId = selectedTransaction.reference.replace('CHECK-CLEAR-', '')
                } else if (selectedTransaction.reference?.startsWith('CHK-')) {
                    checkId = selectedTransaction.reference.replace('CHK-', '')
                }

                // Si no se pudo extraer del reference, intentar usar el campo checkId si existe
                if (!checkId && (selectedTransaction as any).checkId) {
                    checkId = (selectedTransaction as any).checkId
                }

                if (checkId) {
                    try {
                        const deleteCheckRes = await fetch(`/api/checks/${checkId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ organizationId: orgId })
                        })
                        if (!deleteCheckRes.ok) {
                            console.warn('No se pudo eliminar el cheque relacionado:', checkId)
                        } else {
                            console.log('✅ Cheque eliminado:', checkId)
                        }
                    } catch (err) {
                        console.error('Error eliminando cheque relacionado:', err)
                    }
                }
            }            // Actualizar la lista de transacciones
            setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id))

            // Disparar evento para actualizar otras páginas
            window.dispatchEvent(new CustomEvent('treasury:transactionDeleted', {
                detail: {
                    type: 'transaction',
                    id: selectedTransaction.id,
                    cashBoxId: selectedTransaction.cashBoxId,
                    bankAccountId: selectedTransaction.bankAccountId,
                    amount: selectedTransaction.amount,
                    currency: selectedTransaction.currency,
                    origin: origin
                }
            }))

            // Mostrar mensaje de éxito personalizado según el origen
            let successMessage = 'Transacción eliminada exitosamente.'

            if (origin === 'Clientes') {
                successMessage = 'Transacción y cobranza relacionada eliminadas exitosamente.'
            } else if (origin === 'Empleados') {
                successMessage = 'Transacción y nómina relacionada eliminadas exitosamente.'
            } else if (selectedTransaction.description?.includes('Pago') ||
                selectedTransaction.description?.includes('Factura') ||
                selectedTransaction.category === 'Pago Factura') {
                successMessage = 'Transacción eliminada exitosamente. El pago correspondiente ha sido eliminado y la factura ha vuelto a estado pendiente.'
            } else if (selectedTransaction.category === 'CHEQUE_PAGADO' || selectedTransaction.category === 'CHEQUE_COBRADO') {
                successMessage = 'Transacción y cheque relacionado eliminados exitosamente.'
            }

            alert(successMessage)
            setSelectedTransaction(null)
            closeModal('deleteTransaction')

            // Refrescar los datos para actualizar balances
            if (orgId) {
                const refreshParams = new URLSearchParams({
                    organizationId: orgId,
                    sortField: sortField,
                    sortDirection: sortDirection
                })
                const refreshRes = await fetch(`/api/treasury?${refreshParams}`)
                if (refreshRes.ok) {
                    const data = await refreshRes.json()
                    setAccounts(data.accounts || [])
                    setTransactions(data.transactions || [])
                    setMonthlyIncome(data.monthlyIncome || 0)
                    setMonthlyExpense(data.monthlyExpense || 0)
                    const balancesByCurrency = data.balancesByCurrency || {}
                    setPesosBalance(balancesByCurrency.PESOS || 0)
                    setUsdBalance(balancesByCurrency.USD || 0)
                    setEurBalance(balancesByCurrency.EUR || 0)
                }
            }
        } catch (e) {
            console.error(e)
            alert('Error al eliminar la transacción. Por favor, intenta nuevamente.')
        }
    }

    const openDeleteModal = (transaction: any) => {
        setSelectedTransaction(transaction)

        // Determinar el origen y el mensaje personalizado
        const origin = getTransactionOrigin(transaction)
        let message = '¿Estás seguro de que quieres eliminar esta transacción?'

        if (origin === 'Clientes' && transaction.reference?.startsWith('PAY-') &&
            transaction.category === 'Cobranza' && transaction.type === 'Ingreso') {
            message = 'Esta transacción proviene de una cobranza de clientes. Al eliminarla, también se eliminará la cobranza correspondiente del módulo de Collections.'
        } else if (origin === 'Empleados' && transaction.reference?.startsWith('PAY-') &&
            transaction.category === 'Nómina' && transaction.type === 'Egreso') {
            message = 'Esta transacción proviene de una nómina de empleados. Al eliminarla, también se eliminará la nómina correspondiente del módulo de Payroll.'
        } else if (transaction.description?.includes('Pago') ||
            transaction.description?.includes('Factura') ||
            transaction.category === 'Pago Factura') {
            message = 'Esta transacción está relacionada con un pago de factura. Al eliminarla, también se eliminará el pago correspondiente y la factura volverá a estado pendiente.'
        } else if (transaction.category === 'CHEQUE_PAGADO' || transaction.category === 'CHEQUE_COBRADO') {
            message = 'Esta transacción proviene de un cheque. Al eliminarla, también se eliminará el cheque correspondiente del módulo de Cheques.'
        }

        setDeleteMessage(message)
        setModals((m) => ({ ...m, deleteTransaction: true }))
    }

    const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0)
    // Per-currency balances are now managed by state

    if (loading) {
        return (
            <Layout title="Tesorería" subtitle="Cargando datos...">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout
            title="Tesorería"
            subtitle="Gestión financiera completa con cajas y bancos"
        >
            {/* Barra de acciones flotante */}
            <div className="fixed top-20 right-6 z-10 flex flex-col gap-2">
                <button
                    onClick={() => openModal('income')}
                    title="Nuevo Ingreso"
                    className="group relative w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 flex items-center justify-center"
                >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className="bg-gray-800 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
                            Nuevo Ingreso
                            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
                        </div>
                    </div>
                </button>                <button
                    onClick={() => openModal('expense')}
                    title="Nuevo Egreso"
                    className="group relative w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 flex items-center justify-center"
                >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                    <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className="bg-gray-800 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
                            Nuevo Egreso
                            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => openModal('transfer')}
                    title="Nueva Transferencia"
                    className="group relative w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 flex items-center justify-center"
                >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h7m5 0h2M10 7l5 5-5 5" />
                    </svg>
                    <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className="bg-gray-800 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
                            Nueva Transferencia
                            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
                        </div>
                    </div>
                </button>
            </div>

            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${pesosBalance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                <svg className={`h-8 w-8 ${pesosBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Balance PESOS</dt>
                            <dd className={`text-2xl font-semibold ${pesosBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {pesosBalance >= 0 ? '$' : '-$'}{Math.abs(pesosBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-blue-50">
                                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Balance USD</dt>
                            <dd className={`text-2xl font-semibold ${usdBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {usdBalance >= 0 ? '$' : '-$'}{Math.abs(usdBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-yellow-50">
                                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 10h12M4 14h9M19 8a5.7 5.7 0 0 0 -5.2 -2A5.9 5.9 0 0 0 6 12c0 3.4 2.5 6 5.8 6 2.1 0 4 -1 5.2 -2.5" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Balance EURO</dt>
                            <dd className={`text-2xl font-semibold ${eurBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {eurBalance >= 0 ? '$' : '-$'}{Math.abs(eurBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Transacciones</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{transactions.length}</dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accounts Section */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-8">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Cuentas y Balances</h3>
                    <div className="flex space-x-3">
                        <a
                            href="/treasury/cash-boxes"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                        >
                            Gestionar Cajas
                        </a>
                        <a
                            href="/treasury/bank-accounts"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                            Gestionar Bancos
                        </a>
                    </div>
                </div>
                <div className="px-6 py-4">
                    {accounts.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-full bg-gray-100">
                                    <BuildingLibraryIcon className="h-8 w-8 text-gray-400" />
                                </div>
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cuentas configuradas</h3>
                            <p className="mt-1 text-sm text-gray-500">Crea tus primeras cajas y cuentas bancarias para comenzar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {accounts.map((account) => (
                                <article key={account.id} className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                                    <header className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-medium text-gray-900 truncate">{account.name}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {account.type}
                                                {account.bankName && ` • ${account.bankName}`}
                                                {account.accountNumber && ` • ${account.accountNumber}`}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {account.lastUpdate
                                                    ? new Date(account.lastUpdate).toLocaleDateString('es-ES')
                                                    : (account.updatedAt
                                                        ? new Date(account.updatedAt).toLocaleDateString('es-ES')
                                                        : 'Nunca')
                                                }
                                            </p>
                                        </div>
                                        {/* Icono a la derecha */}
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ml-3 ${account.type === 'Caja' ? 'bg-green-50' : 'bg-blue-50'
                                            }`}>
                                            {account.type === 'Caja' ? (
                                                <BanknotesIcon className={`w-4 h-4 ${account.type === 'Caja' ? 'text-green-600' : 'text-blue-600'
                                                    }`} />
                                            ) : (
                                                <BuildingLibraryIcon className={`w-4 h-4 ${account.type === 'Caja' ? 'text-green-600' : 'text-blue-600'
                                                    }`} />
                                            )}
                                        </div>
                                    </header>

                                    <section className="mt-4">
                                        <div className="grid grid-cols-3 gap-2">
                                            {['PESOS', 'USD', 'EUR'].map((c) => {
                                                const balance = (account as any).balancesByCurrency?.[c] || 0
                                                return (
                                                    <div key={c} className={`rounded-md p-2 text-center border bg-gray-50 border-gray-100`}>
                                                        <div className="text-xs font-medium text-gray-600">{c}</div>
                                                        <div className={`text-sm font-semibold ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                                            {balance >= 0 ? '$' : '-$'}
                                                            {Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </section>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-lg font-medium text-gray-900">Transacciones Recientes</h3>

                        {/* Indicadores de filtros activos */}
                        {(categoryFilter !== 'all' || projectFilter !== 'all' || currencyFilter !== 'all' || sortField) && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Filtros activos:</span>
                                {categoryFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Categoría: {categoryFilter}
                                        <button
                                            onClick={() => setCategoryFilter('all')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                            title="Quitar filtro de categoría"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {projectFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        Proyecto: {projects.find(p => p.id === projectFilter)?.name || projectFilter}
                                        <button
                                            onClick={() => setProjectFilter('all')}
                                            className="ml-1 text-purple-600 hover:text-purple-800"
                                            title="Quitar filtro de proyecto"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {currencyFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        Moneda: {currencyFilter}
                                        <button
                                            onClick={() => setCurrencyFilter('all')}
                                            className="ml-1 text-orange-600 hover:text-orange-800"
                                            title="Quitar filtro de moneda"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {sortField && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Orden: {sortField === 'date' ? 'Fecha' :
                                            sortField === 'description' ? 'Descripción' :
                                                sortField === 'category' ? 'Categoría' :
                                                    sortField === 'type' ? 'Tipo' :
                                                        sortField === 'amount' ? 'Monto' : 'Fecha'} {sortDirection === 'asc' ? '↑' : '↓'}
                                        <button
                                            onClick={() => {
                                                setSortField('')
                                                setSortDirection('desc')
                                            }}
                                            className="ml-1 text-green-600 hover:text-green-800"
                                            title="Quitar ordenamiento"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabla de transacciones */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center gap-1">
                                        Fecha
                                        {sortField === 'date' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('description')}
                                >
                                    <div className="flex items-center gap-1">
                                        Descripción
                                        {sortField === 'description' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center gap-1">
                                        Categoría
                                        {sortField === 'category' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Origen
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('type')}
                                >
                                    <div className="flex items-center gap-1">
                                        Tipo
                                        {sortField === 'type' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Moneda
                                </th>
                                <th
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('amount')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Monto
                                        {sortField === 'amount' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {transaction.date ? new Date(transaction.date).toLocaleDateString('es-ES') : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                                        <div className="text-xs text-gray-500">
                                            {transaction.cashBox && `Caja: ${transaction.cashBox.name}`}
                                            {transaction.bankAccount && `Banco: ${transaction.bankAccount.name}`}
                                            {transaction.currency && ` (${transaction.currency})`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {transaction.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {getTransactionOrigin(transaction)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.type === 'Ingreso'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {transaction.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {transaction.currency || 'PESOS'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <span className={transaction.type === 'Ingreso' ? 'text-green-600' : 'text-red-600'}>
                                            {transaction.type === 'Ingreso' ? '+' : '-'}
                                            {Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="relative inline-block text-left">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDropdownOpen(dropdownOpen === transaction.id ? null : transaction.id)
                                                }}
                                                className="p-2 rounded-full hover:bg-gray-100"
                                            >
                                                <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                                            </button>

                                            {dropdownOpen === transaction.id && (
                                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                                    <div className="py-1">
                                                        {/* Solo mostrar editar para transacciones creadas manualmente desde tesorería */}
                                                        {/* Excluir transacciones de cheques que son generadas automáticamente */}
                                                        {(transaction.category === 'Transferencia' ||
                                                            (transaction.category !== 'CHEQUE_PAGADO' &&
                                                                transaction.category !== 'CHEQUE_COBRADO' &&
                                                                !transaction.description?.includes('factura') &&
                                                                transaction.category !== 'Pago Factura' &&
                                                                transaction.category !== 'Cobranza' &&
                                                                transaction.category !== 'Nómina' &&
                                                                transaction.category !== 'Pago Nómina' &&
                                                                !transaction.description?.includes('Pago') &&
                                                                !transaction.description?.includes('Nómina') &&
                                                                !transaction.description?.includes('nómina'))) && (
                                                                <button
                                                                    onClick={() => {
                                                                        openModal('editTransaction', transaction)
                                                                        setDropdownOpen(null)
                                                                    }}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                                >
                                                                    <PencilIcon className="w-4 h-4 mr-3 text-gray-400" />
                                                                    Editar
                                                                </button>
                                                            )}
                                                        <button
                                                            onClick={() => {
                                                                openDeleteModal(transaction)
                                                                setDropdownOpen(null)
                                                            }}
                                                            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                                        >
                                                            <TrashIcon className="w-4 h-4 mr-3 text-red-400" />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mostrar mensaje si no hay transacciones filtradas */}
                {filteredTransactions.length === 0 && (
                    <div className="px-6 py-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay transacciones</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm.trim()
                                ? `No se encontraron transacciones que coincidan con "${searchTerm}".`
                                : categoryFilter === 'all'
                                    ? 'No se encontraron transacciones recientes.'
                                    : `No se encontraron transacciones en la categoría "${categoryFilter}".`
                            }
                        </p>
                        {(searchTerm.trim() || categoryFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('')
                                    setCategoryFilter('all')
                                }}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                )}

                {/* Información de resumen con filtros */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        {/* Información de conteo */}
                        <div className="text-sm text-gray-600">
                            Mostrando {Math.min(paginatedTransactions.length, itemsPerPage)} de {filteredTransactions.length} transacciones
                            {categoryFilter !== 'all' && (
                                <span className="ml-2 text-blue-600">
                                    (filtrado por: {categoryFilter})
                                </span>
                            )}
                            {searchTerm.trim() && (
                                <span className="ml-2 text-green-600">
                                    (búsqueda: "{searchTerm}")
                                </span>
                            )}
                            {sortField && (
                                <span className="ml-2 text-purple-600">
                                    (ordenado por: {sortField === 'date' ? 'Fecha' :
                                        sortField === 'description' ? 'Descripción' :
                                            sortField === 'category' ? 'Categoría' :
                                                sortField === 'type' ? 'Tipo' :
                                                    sortField === 'amount' ? 'Monto' : 'Fecha'} {sortDirection === 'asc' ? '↑' : '↓'})
                                </span>
                            )}
                        </div>

                        {/* Filtros compactos */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Filtro de categoría */}
                            <div className="flex items-center gap-1">
                                <select
                                    id="category-filter"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                                >
                                    <option value="all">Todas las categorías</option>
                                    {uniqueCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                {categoryFilter !== 'all' && (
                                    <button
                                        onClick={() => setCategoryFilter('all')}
                                        className="text-gray-500 hover:text-red-600 text-xs ml-1"
                                        title="Limpiar filtro de categoría"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Filtro de proyecto */}
                            <div className="flex items-center gap-1">
                                <select
                                    id="project-filter"
                                    value={projectFilter}
                                    onChange={(e) => setProjectFilter(e.target.value)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[130px]"
                                >
                                    <option value="all">Todos los proyectos</option>
                                    <option value="">Sin proyecto</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>{project.name}</option>
                                    ))}
                                </select>
                                {projectFilter !== 'all' && (
                                    <button
                                        onClick={() => setProjectFilter('all')}
                                        className="text-gray-500 hover:text-red-600 text-xs ml-1"
                                        title="Limpiar filtro de proyecto"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Filtro de moneda */}
                            <div className="flex items-center gap-1">
                                <select
                                    id="currency-filter"
                                    value={currencyFilter}
                                    onChange={(e) => setCurrencyFilter(e.target.value)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                                >
                                    <option value="all">Todas las monedas</option>
                                    <option value="PESOS">PESOS</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                                {currencyFilter !== 'all' && (
                                    <button
                                        onClick={() => setCurrencyFilter('all')}
                                        className="text-gray-500 hover:text-red-600 text-xs ml-1"
                                        title="Limpiar filtro de moneda"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Filtro de origen */}
                            <div className="flex items-center gap-1">
                                <select
                                    id="origin-filter"
                                    value={originFilter}
                                    onChange={(e) => setOriginFilter(e.target.value)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                                >
                                    <option value="all">Todos los orígenes</option>
                                    {uniqueOrigins.map(origin => (
                                        <option key={origin} value={origin}>{origin}</option>
                                    ))}
                                </select>
                                {originFilter !== 'all' && (
                                    <button
                                        onClick={() => setOriginFilter('all')}
                                        className="text-gray-500 hover:text-red-600 text-xs ml-1"
                                        title="Limpiar filtro de origen"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Botón limpiar todo - solo si hay filtros activos */}
                            {(categoryFilter !== 'all' || projectFilter !== 'all' || currencyFilter !== 'all') && (
                                <button
                                    onClick={() => {
                                        setCategoryFilter('all')
                                        setProjectFilter('all')
                                        setCurrencyFilter('all')
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination */}
            {filteredTransactions.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredTransactions.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Buscar transacciones..."
                    onImportExcel={handleImportExcel}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />
            )}

            {/* Modal de importación */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Importar desde Excel
                            </h3>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Seleccionar archivo Excel (.xlsx, .xls)
                                </label>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            handleFileImport(file)
                                        }
                                    }}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                    disabled={importing}
                                />
                            </div>

                            {importing && (
                                <div className="flex items-center justify-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                    <span className="ml-2 text-sm text-gray-600">Procesando archivo...</span>
                                </div>
                            )}

                            <div className="text-xs text-gray-500">
                                <p>Formato esperado:</p>
                                <ul className="list-disc list-inside mt-1">
                                    <li>Columnas: Fecha, Descripción, Categoría, Tipo, Monto, Moneda</li>
                                    <li>Tipos válidos: Ingreso, Egreso</li>
                                    <li>Monedas válidas: PESOS, USD, EUR</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                disabled={importing}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <TransactionFormModal
                isOpen={modals.income}
                onClose={() => closeModal('income')}
                onSave={handleSaveTransaction}
                type="income"
                projects={projects}
            />

            <TransactionFormModal
                isOpen={modals.expense}
                onClose={() => closeModal('expense')}
                onSave={handleSaveTransaction}
                type="expense"
                projects={projects}
            />

            <TransactionFormModal
                isOpen={modals.editTransaction}
                onClose={() => closeModal('editTransaction')}
                onSave={handleSaveTransaction}
                type={selectedTransaction?.type === 'Ingreso' ? 'income' : 'expense'}
                projects={projects}
                transaction={selectedTransaction}
            />

            <ConfirmDeleteModal
                isOpen={modals.deleteTransaction}
                onClose={() => closeModal('deleteTransaction')}
                onConfirm={handleDeleteTransaction}
                title="Eliminar Transacción"
                message={deleteMessage}
                itemName={selectedTransaction?.description}
            />

            <TransferModal
                isOpen={modals.transfer}
                onClose={() => closeModal('transfer')}
                onSave={handleSaveTransaction}
                projects={projects}
            />
        </Layout>
    )
}
