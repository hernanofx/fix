"use client"

import Layout from '../../../components/Layout'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function BankAccounts() {
    const { data: session } = useSession()
    const router = useRouter()
    const [bankAccounts, setBankAccounts] = useState<any[]>([])
    const [showModal, setShowModal] = useState(false)
    const [editingAccount, setEditingAccount] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        bankName: '',
        accountNumber: '',
        initialBalance: '',
        description: ''
    })

    const formatCurrency = (n: number | undefined) => `\$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    const currencies = ['PESOS', 'USD', 'EUR']

    useEffect(() => {
        loadBankAccounts()
    }, [session])

    const loadBankAccounts = async () => {
        try {
            const orgId = (session as any)?.user?.organizationId
            if (!orgId) return

            // Obtener las cuentas bancarias básicas
            const bankAccountRes = await fetch(`/api/bank-accounts?organizationId=${orgId}`)
            if (!bankAccountRes.ok) return

            const bankAccountData = await bankAccountRes.json()

            // Obtener balances desde la API treasury
            const treasuryRes = await fetch(`/api/treasury?organizationId=${orgId}`)
            if (!treasuryRes.ok) {
                setBankAccounts(bankAccountData)
                return
            }

            const treasuryData = await treasuryRes.json()
            const accounts = treasuryData.accounts || []

            // Combinar con balances
            const bankAccountsWithBalances = bankAccountData.map((account: any) => {
                const accountData = accounts.find((acc: any) => acc.id === account.id && acc.type === 'Banco')

                if (accountData) {
                    return {
                        ...account,
                        balancesByCurrency: accountData.balancesByCurrency || { PESOS: 0, USD: 0, EUR: 0 },
                        calculatedBalance: accountData.balance || 0
                    }
                }

                return {
                    ...account,
                    balancesByCurrency: { PESOS: 0, USD: 0, EUR: 0 },
                    calculatedBalance: 0
                }
            })

            setBankAccounts(bankAccountsWithBalances)
        } catch (error) {
            console.error('Error loading bank accounts:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const orgId = (session as any)?.user?.organizationId
            const url = editingAccount ? `/api/bank-accounts/${editingAccount.id}` : '/api/bank-accounts'
            const method = editingAccount ? 'PUT' : 'POST'

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
                loadBankAccounts()
                setShowModal(false)
                setEditingAccount(null)
                setFormData({ name: '', bankName: '', accountNumber: '', initialBalance: '', description: '' })
            }
        } catch (error) {
            console.error('Error saving bank account:', error)
        }
    }

    const handleEdit = (account: any) => {
        setEditingAccount(account)
        setFormData({
            name: account.name,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            initialBalance: account.balance?.toString() || '0',
            description: account.description || ''
        })
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta cuenta bancaria?')) return

        try {
            const res = await fetch(`/api/bank-accounts/${id}`, { method: 'DELETE' })
            if (res.ok) {
                loadBankAccounts()
            }
        } catch (error) {
            console.error('Error deleting bank account:', error)
        }
    }

    return (
        <Layout
            title="Cuentas Bancarias"
            subtitle="Gestión de cuentas bancarias"
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
                    Nueva Cuenta Bancaria
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bankAccounts.map((account) => (
                    <article key={account.id} className="bg-white shadow-md rounded-xl p-5 border border-gray-200 hover:shadow-lg transition">
                        <header className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                                <p className="text-sm text-gray-500">{account.bankName} • <span className="text-xs text-gray-400">Nº {account.accountNumber}</span></p>
                                {account.description && <p className="text-sm text-gray-500 mt-2">{account.description}</p>}
                                <p className="text-xs text-gray-400 mt-2">Actualizado: {new Date(account.updatedAt || account.createdAt).toLocaleString()}</p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm text-gray-500">Saldo</p>
                                <p className="text-xl font-semibold text-gray-900">{formatCurrency(account.calculatedBalance)}</p>
                            </div>
                        </header>

                        <section className="mt-4">
                            <div className="grid grid-cols-3 gap-2">
                                {currencies.map((c) => {
                                    const balance = account.balancesByCurrency?.[c] || 0
                                    return (
                                        <div key={c} className={`rounded-md p-2 text-center border ${Math.abs(balance) > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="text-xs font-medium text-gray-600">{c}</div>
                                            <div className={`text-sm font-semibold ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                                {formatCurrency(balance)}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>

                        <footer className="mt-4 flex justify-between items-center">
                            <div className="flex space-x-2">
                                <button onClick={() => handleEdit(account)} className="text-sm text-blue-600 hover:text-blue-800">Editar</button>
                                <button onClick={() => handleDelete(account.id)} className="text-sm text-red-600 hover:text-red-800">Eliminar</button>
                            </div>
                            <button onClick={() => router.push(`/treasury?focus=bank-${account.id}`)} className="text-xs text-gray-500 hover:underline">Ver movimientos</button>
                        </footer>
                    </article>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingAccount ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre de la Cuenta
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
                                        Banco
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Número de Cuenta
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
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
                                        setEditingAccount(null)
                                        setFormData({ name: '', bankName: '', accountNumber: '', initialBalance: '', description: '' })
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {editingAccount ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    )
}
