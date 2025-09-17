'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface Account {
    id: string
    name: string
    currency: string
}

export default function NewCheckPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [cashBoxes, setCashBoxes] = useState<Account[]>([])
    const [bankAccounts, setBankAccounts] = useState<Account[]>([])

    const [formData, setFormData] = useState({
        checkNumber: '',
        amount: '',
        currency: 'PESOS',
        issuerName: '',
        issuerBank: '',
        issueDate: '',
        dueDate: '',
        cashBoxId: '',
        bankAccountId: '',
        receivedFrom: '',
        issuedTo: '',
        description: '',
        isReceived: false
    })

    useEffect(() => {
        fetchAccounts()
    }, [])

    const fetchAccounts = async () => {
        if (!session?.user?.organizationId) {
            console.error('No organization ID found in session')
            return
        }

        try {
            const [cashResponse, bankResponse] = await Promise.all([
                fetch(`/api/cash-boxes?organizationId=${session.user.organizationId}`),
                fetch(`/api/bank-accounts?organizationId=${session.user.organizationId}`)
            ])
            const cashData = await cashResponse.json()
            const bankData = await bankResponse.json()
            setCashBoxes(cashData || [])
            setBankAccounts(bankData || [])
        } catch (error) {
            console.error('Error fetching accounts:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                router.push('/checks')
            } else {
                const error = await response.json()
                alert(error.error || 'Error al crear cheque')
            }
        } catch (error) {
            console.error('Error creating check:', error)
            alert('Error al crear cheque')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    return (
        <Layout title="Nuevo Cheque" subtitle="Registra un cheque emitido o recibido">
            <div className="max-w-4xl mx-auto">
                {/* Header con botón de volver */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Volver a Cheques
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Información del Cheque</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Completa todos los campos requeridos para registrar el cheque
                            </p>
                        </div>

                        <div className="px-6 py-6 space-y-6">
                            {/* Tipo de cheque */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-3 block">Tipo de Cheque</label>
                                <div className="space-y-2">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="isReceived"
                                            checked={!formData.isReceived}
                                            onChange={() => setFormData(prev => ({ ...prev, isReceived: false }))}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Emitido (egreso)</span>
                                    </label>
                                    <label className="inline-flex items-center ml-6">
                                        <input
                                            type="radio"
                                            name="isReceived"
                                            checked={formData.isReceived}
                                            onChange={() => setFormData(prev => ({ ...prev, isReceived: true }))}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Recibido (ingreso)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Campos comunes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Cheque *</label>
                                    <input
                                        type="text"
                                        name="checkNumber"
                                        required
                                        value={formData.checkNumber}
                                        onChange={handleChange}
                                        placeholder="Ej: 00012345"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Emisión *</label>
                                    <input
                                        type="date"
                                        name="issueDate"
                                        required
                                        value={formData.issueDate}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Monto *</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        step="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="PESOS">PESOS</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Vencimiento *</label>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        required
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Emisor *</label>
                                    <input
                                        type="text"
                                        name="issuerName"
                                        required
                                        value={formData.issuerName}
                                        onChange={handleChange}
                                        placeholder="Nombre del emisor del cheque"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Banco Emisor *</label>
                                    <input
                                        type="text"
                                        name="issuerBank"
                                        required
                                        value={formData.issuerBank}
                                        onChange={handleChange}
                                        placeholder="Nombre del banco emisor"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Campos condicionales */}
                            {!formData.isReceived ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Receptor *</label>
                                        <input
                                            type="text"
                                            name="issuedTo"
                                            required={!formData.isReceived}
                                            placeholder="Nombre de la persona o empresa que recibe el cheque"
                                            value={formData.issuedTo}
                                            onChange={handleChange}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta de Origen *</label>
                                        <div className="space-y-3">
                                            <select
                                                name="cashBoxId"
                                                value={formData.cashBoxId}
                                                onChange={(e) => {
                                                    handleChange(e)
                                                    setFormData(prev => ({ ...prev, bankAccountId: '' }))
                                                }}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar caja</option>
                                                {cashBoxes.map(box => (
                                                    <option key={box.id} value={box.id}>{box.name} ({box.currency})</option>
                                                ))}
                                            </select>
                                            <select
                                                name="bankAccountId"
                                                value={formData.bankAccountId}
                                                onChange={(e) => {
                                                    handleChange(e)
                                                    setFormData(prev => ({ ...prev, cashBoxId: '' }))
                                                }}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar cuenta bancaria</option>
                                                {bankAccounts.map(account => (
                                                    <option key={account.id} value={account.id}>{account.name} ({account.currency})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Recibido de</label>
                                    <input
                                        type="text"
                                        name="receivedFrom"
                                        placeholder="Cliente o proveedor que emitió el cheque"
                                        value={formData.receivedFrom}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Descripción opcional del cheque"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creando...' : 'Crear Cheque'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    )
}