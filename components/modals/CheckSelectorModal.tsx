'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Modal from './Modal'

interface Check {
    id: string
    checkNumber: string
    amount: number
    currency: string
    issuerName: string
    issuerBank: string
    issueDate: string
    dueDate: string
    status: string
    receivedFrom?: string
    issuedTo?: string
    description?: string
    cashBox?: { id: string, name: string }
    bankAccount?: { id: string, name: string }
}

interface CheckSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (check: Check | null) => void
    context: 'payment' | 'collection' // Para filtrar cheques disponibles
    currency?: string
    amount?: number
}

export default function CheckSelectorModal({
    isOpen,
    onClose,
    onSelect,
    context,
    currency = 'PESOS',
    amount
}: CheckSelectorModalProps) {
    const { data: session } = useSession()
    const [checks, setChecks] = useState<Check[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedCheck, setSelectedCheck] = useState<Check | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [createFormData, setCreateFormData] = useState({
        checkNumber: '',
        amount: amount?.toString() || '',
        currency: currency,
        issuerName: '',
        issuerBank: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        receivedFrom: '',
        issuedTo: '',
        description: '',
        cashBoxId: '',
        bankAccountId: ''
    })
    const [cashBoxes, setCashBoxes] = useState<any[]>([])
    const [bankAccounts, setBankAccounts] = useState<any[]>([])

    // Load available checks and accounts
    useEffect(() => {
        if (isOpen && session) {
            loadData()
        }
    }, [isOpen, session, context])

    const loadData = async () => {
        setLoading(true)
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) return

            // Load checks filtered by context
            const status = context === 'payment' ? 'ISSUED' : 'PENDING'
            const checksRes = await fetch(`/api/checks?status=${status}&limit=100&organizationId=${organizationId}`)
            if (checksRes.ok) {
                const data = await checksRes.json()
                setChecks(data.checks || [])
            }

            // Load cash boxes and bank accounts
            const [cashBoxesRes, bankAccountsRes] = await Promise.all([
                fetch(`/api/cash-boxes?organizationId=${organizationId}`),
                fetch(`/api/bank-accounts?organizationId=${organizationId}`)
            ])

            if (cashBoxesRes.ok) {
                const data = await cashBoxesRes.json()
                setCashBoxes(data.cashBoxes || data || [])
            }

            if (bankAccountsRes.ok) {
                const data = await bankAccountsRes.json()
                setBankAccounts(data.bankAccounts || data || [])
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectCheck = (check: Check) => {
        setSelectedCheck(check)
    }

    const handleConfirmSelection = () => {
        if (selectedCheck) {
            onSelect(selectedCheck)
            onClose()
        }
    }

    const handleCreateCheck = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) return

            const response = await fetch('/api/checks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...createFormData,
                    amount: parseFloat(createFormData.amount),
                    isReceived: context === 'collection',
                    organizationId
                })
            })

            if (response.ok) {
                const data = await response.json()
                onSelect(data.check)
                onClose()
            } else {
                const error = await response.json()
                alert(`Error creando cheque: ${error.error}`)
            }
        } catch (error) {
            console.error('Error creating check:', error)
            alert('Error creando cheque')
        }
    }

    const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setCreateFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const resetModal = () => {
        setSelectedCheck(null)
        setShowCreateForm(false)
        setCreateFormData({
            checkNumber: '',
            amount: amount?.toString() || '',
            currency: currency,
            issuerName: '',
            issuerBank: '',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            receivedFrom: '',
            issuedTo: '',
            description: '',
            cashBoxId: '',
            bankAccountId: ''
        })
    }

    const handleClose = () => {
        resetModal()
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Seleccionar Cheque - ${context === 'payment' ? 'Pago' : 'Cobranza'}`}
            size="xl"
        >
            <div className="space-y-6">
                {/* Header with create option */}
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Cheques {context === 'payment' ? 'Emitidos' : 'Recibidos'} Disponibles
                        </h3>
                        <p className="text-sm text-gray-600">
                            Selecciona un cheque existente o crea uno nuevo
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                        {showCreateForm ? 'Ver Cheques' : 'Crear Nuevo Cheque'}
                    </button>
                </div>

                {showCreateForm ? (
                    /* Create Check Form */
                    <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Crear Nuevo Cheque</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Número de Cheque *
                                </label>
                                <input
                                    type="text"
                                    name="checkNumber"
                                    value={createFormData.checkNumber}
                                    onChange={handleCreateFormChange}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="12345678"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Monto *
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={createFormData.amount}
                                    onChange={handleCreateFormChange}
                                    min="0"
                                    step="0.01"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Moneda *
                                </label>
                                <select
                                    name="currency"
                                    value={createFormData.currency}
                                    onChange={handleCreateFormChange}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="PESOS">PESOS</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Banco Emisor *
                                </label>
                                <input
                                    type="text"
                                    name="issuerBank"
                                    value={createFormData.issuerBank}
                                    onChange={handleCreateFormChange}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Banco Nación"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {context === 'payment' ? 'Emitido A' : 'Recibido De'} *
                                </label>
                                <input
                                    type="text"
                                    name={context === 'payment' ? 'issuedTo' : 'receivedFrom'}
                                    value={context === 'payment' ? createFormData.issuedTo : createFormData.receivedFrom}
                                    onChange={handleCreateFormChange}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder={context === 'payment' ? 'Proveedor S.A.' : 'Cliente S.A.'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Fecha de Emisión *
                                </label>
                                <input
                                    type="date"
                                    name="issueDate"
                                    value={createFormData.issueDate}
                                    onChange={handleCreateFormChange}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Fecha de Vencimiento *
                                </label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={createFormData.dueDate}
                                    onChange={handleCreateFormChange}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Descripción
                                </label>
                                <textarea
                                    name="description"
                                    value={createFormData.description}
                                    onChange={handleCreateFormChange}
                                    rows={2}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Descripción del cheque..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateCheck}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                            >
                                Crear y Seleccionar
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Check Selection List */
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-sm text-gray-600">Cargando cheques...</p>
                            </div>
                        ) : checks.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No hay cheques {context === 'payment' ? 'emitidos' : 'recibidos'} disponibles</p>
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                >
                                    Crear Nuevo Cheque
                                </button>
                            </div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {checks.map((check) => (
                                    <div
                                        key={check.id}
                                        onClick={() => handleSelectCheck(check)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedCheck?.id === check.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-4">
                                                    <span className="font-medium text-gray-900">
                                                        #{check.checkNumber}
                                                    </span>
                                                    <span className="text-lg font-semibold text-green-600">
                                                        ${check.amount.toLocaleString()} {check.currency}
                                                    </span>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${check.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                                                            check.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                check.status === 'CLEARED' ? 'bg-green-100 text-green-800' :
                                                                    'bg-red-100 text-red-800'
                                                        }`}>
                                                        {check.status === 'ISSUED' ? 'Emitido' :
                                                            check.status === 'PENDING' ? 'Pendiente' :
                                                                check.status === 'CLEARED' ? 'Cobrados' :
                                                                    check.status}
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-sm text-gray-600">
                                                    <p>Banco: {check.issuerBank}</p>
                                                    <p>{context === 'payment' ? `Emitido a: ${check.issuedTo}` : `Recibido de: ${check.receivedFrom}`}</p>
                                                    <p>Vence: {new Date(check.dueDate).toLocaleDateString('es-AR')}</p>
                                                    {check.description && <p>Nota: {check.description}</p>}
                                                </div>
                                            </div>
                                            {selectedCheck?.id === check.id && (
                                                <div className="text-blue-600">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                {!showCreateForm && (
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmSelection}
                            disabled={!selectedCheck}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Seleccionar Cheque
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    )
}