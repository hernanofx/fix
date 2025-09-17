"use client"

import Layout from '../../../components/Layout'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function CashBoxes() {
    const { data: session } = useSession()
    const router = useRouter()
    const [cashBoxes, setCashBoxes] = useState<any[]>([])
    const [showModal, setShowModal] = useState(false)
    const [editingBox, setEditingBox] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        initialBalance: '',
        description: ''
    })

    useEffect(() => {
        loadCashBoxes()
    }, [session])

    // Listen for transaction delete events
    useEffect(() => {
        const handleTransactionDeleted = () => {
            // Small delay to ensure database operations are complete
            setTimeout(() => {
                loadCashBoxes()
            }, 500)
        }

        window.addEventListener('treasury:transactionDeleted', handleTransactionDeleted)
        return () => window.removeEventListener('treasury:transactionDeleted', handleTransactionDeleted)
    }, [])

    const loadCashBoxes = async () => {
        try {
            const orgId = (session as any)?.user?.organizationId
            if (!orgId) return

            // Obtener las cajas básicas
            const cashBoxRes = await fetch(`/api/cash-boxes?organizationId=${orgId}`)
            if (!cashBoxRes.ok) return

            const cashBoxData = await cashBoxRes.json()

            // Obtener balances desde la API treasury (que ahora lee de AccountBalance)
            const treasuryRes = await fetch(`/api/treasury?organizationId=${orgId}`)
            if (!treasuryRes.ok) {
                setCashBoxes(cashBoxData)
                return
            }

            const treasuryData = await treasuryRes.json()
            const accounts = treasuryData.accounts || []

            // Filtrar solo las cajas y combinar con balances
            const cashBoxesWithBalances = cashBoxData.map((cashBox: any) => {
                const accountData = accounts.find((acc: any) => acc.id === cashBox.id && acc.type === 'Caja')

                if (accountData) {
                    return {
                        ...cashBox,
                        balancesByCurrency: accountData.balancesByCurrency || { PESOS: 0, USD: 0, EUR: 0 },
                        calculatedBalance: accountData.balance || 0
                    }
                }

                return {
                    ...cashBox,
                    balancesByCurrency: { PESOS: 0, USD: 0, EUR: 0 },
                    calculatedBalance: 0
                }
            })

            setCashBoxes(cashBoxesWithBalances)
        } catch (error) {
            console.error('Error loading cash boxes:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const orgId = (session as any)?.user?.organizationId
            const url = editingBox ? `/api/cash-boxes/${editingBox.id}` : '/api/cash-boxes'
            const method = editingBox ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    initialBalance: parseFloat(formData.initialBalance) || 0,
                    organizationId: orgId
                })
            })

            if (res.ok) {
                loadCashBoxes()
                setShowModal(false)
                setEditingBox(null)
                setFormData({ name: '', initialBalance: '', description: '' })
            }
        } catch (error) {
            console.error('Error saving cash box:', error)
        }
    }

    const handleEdit = (box: any) => {
        setEditingBox(box)
        setFormData({
            name: box.name,
            initialBalance: box.balance?.toString() || '0',
            description: box.description || ''
        })
        setShowModal(true)
    }

    const handleSyncBalances = async () => {
        try {
            const orgId = (session as any)?.user?.organizationId
            if (!orgId) return

            console.log('🔄 Syncing balances...')

            // Obtener transacciones actuales
            const treasuryRes = await fetch(`/api/treasury?organizationId=${orgId}`)
            if (!treasuryRes.ok) return

            const treasuryData = await treasuryRes.json()
            const transactions = treasuryData.transactions || []

            // Resetear balances a 0 y recalcular desde transacciones
            for (const cashBox of cashBoxes) {
                const cashBoxTransactions = transactions.filter((t: any) => t.cashBoxId === cashBox.id)

                // Calcular balances por moneda desde transacciones
                const balancesByCurrency = {
                    PESOS: 0,
                    USD: 0,
                    EUR: 0
                }

                cashBoxTransactions.forEach((transaction: any) => {
                    const currency = transaction.currency
                    const amount = transaction.amount

                    if (transaction.type === 'Ingreso') {
                        balancesByCurrency[currency as keyof typeof balancesByCurrency] += amount
                    } else {
                        balancesByCurrency[currency as keyof typeof balancesByCurrency] -= amount
                    }
                })

                // Actualizar AccountBalance para cada moneda
                for (const [currency, balance] of Object.entries(balancesByCurrency)) {
                    if (balance !== 0 || true) { // Siempre actualizar, incluso si es 0
                        console.log(`🔄 Updating cash box ${cashBox.name} ${currency}: ${balance}`)

                        const updateRes = await fetch('/api/account-balances', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                accountId: cashBox.id,
                                accountType: 'CASH_BOX',
                                currency,
                                balance,
                                organizationId: orgId
                            })
                        })

                        if (!updateRes.ok) {
                            console.error(`Failed to update ${currency} balance for cash box ${cashBox.name}`)
                        }
                    }
                }
            }

            // Recargar las cajas después de sincronizar
            loadCashBoxes()
            alert('Balances sincronizados correctamente')
        } catch (error) {
            console.error('Error syncing balances:', error)
            alert('Error al sincronizar balances')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta caja?')) return

        try {
            const res = await fetch(`/api/cash-boxes/${id}`, { method: 'DELETE' })
            if (res.ok) {
                loadCashBoxes()
            }
        } catch (error) {
            console.error('Error deleting cash box:', error)
        }
    }

    return (
        <Layout
            title="Cajas"
            subtitle="Gestión de cajas bimonetarias"
        >
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => router.push('/treasury')}
                        className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                        aria-label="Volver a Tesorería"
                    >
                        <span className="mr-2">←</span>
                        Tesorería
                    </button>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Nueva Caja
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cashBoxes.map((box) => {
                    const formatCurrency = (n: number | undefined) => `\$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    const currencies = ['PESOS', 'USD', 'EUR']

                    // Usar balances calculados dinámicamente
                    const balances = box.balancesByCurrency || { PESOS: 0, USD: 0, EUR: 0 }
                    const totalBalance = box.calculatedBalance !== undefined ? box.calculatedBalance : 0

                    return (
                        <article key={box.id} className="bg-white shadow-md rounded-xl p-5 border border-gray-200 hover:shadow-lg transition">
                            <header className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{box.name}</h3>
                                    {box.description && <p className="text-sm text-gray-500 mt-1">{box.description}</p>}
                                    <p className="text-xs text-gray-400 mt-2">Actualizado: {new Date(box.updatedAt || box.createdAt).toLocaleString()}</p>
                                </div>
                            </header>

                            <section className="mt-4">
                                <div className="grid grid-cols-3 gap-2">
                                    {currencies.map((c) => (
                                        <div key={c} className={`rounded-md p-2 text-center border ${Math.abs(balances[c as keyof typeof balances]) > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="text-xs font-medium text-gray-600">{c}</div>
                                            <div className={`text-sm font-semibold ${balances[c as keyof typeof balances] >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                                {formatCurrency(balances[c as keyof typeof balances])}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <footer className="mt-4 flex justify-between items-center">
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(box)} className="text-sm text-blue-600 hover:text-blue-800">Editar</button>
                                    <button onClick={() => handleDelete(box.id)} className="text-sm text-red-600 hover:text-red-800">Eliminar</button>
                                </div>
                                <button onClick={() => router.push(`/treasury?focus=cash-${box.id}`)} className="text-xs text-gray-500 hover:underline">Ver movimientos</button>
                            </footer>
                        </article>
                    )
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingBox ? 'Editar Caja' : 'Nueva Caja'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Balance Inicial
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.initialBalance}
                                        onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        setEditingBox(null)
                                        setFormData({ name: '', initialBalance: '', description: '' })
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {editingBox ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    )
}
