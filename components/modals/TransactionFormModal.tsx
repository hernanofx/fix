'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Modal from './Modal'

interface TransactionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transactionData: any) => void;
    type: 'income' | 'expense';
    projects: any[];
    transaction?: any;
}

export default function TransactionFormModal({ isOpen, onClose, onSave, type, projects, transaction }: TransactionFormModalProps) {
    const { data: session } = useSession()
    const [cashBoxes, setCashBoxes] = useState<any[]>([])
    const [bankAccounts, setBankAccounts] = useState<any[]>([])

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: '',
        currency: 'PESOS',
        date: new Date().toISOString().split('T')[0],
        account: '',
        project: '',
        notes: '',
        cashBoxId: '',
        bankAccountId: ''
    });

    // Actualizar formData cuando cambie la transacción o se abra el modal
    useEffect(() => {
        if (isOpen && transaction) {
            console.log('Loading transaction data:', transaction); // Debug log
            // Para edición: cargar datos de la transacción
            setFormData({
                description: transaction.description || '',
                amount: transaction.amount?.toString() || '',
                category: transaction.category || '',
                currency: transaction.currency || 'PESOS',
                date: transaction.date ? new Date(transaction.date).toLocaleDateString('sv-SE') : new Date().toLocaleDateString('sv-SE'),
                account: '',
                project: transaction.projectId || '',
                notes: transaction.notes || '',
                cashBoxId: transaction.cashBoxId || '',
                bankAccountId: transaction.bankAccountId || ''
            });
        } else if (isOpen && !transaction) {
            // Para nueva transacción: resetear formulario
            setFormData({
                description: '',
                amount: '',
                category: '',
                currency: 'PESOS',
                date: new Date().toLocaleDateString('sv-SE'),
                account: '',
                project: '',
                notes: '',
                cashBoxId: '',
                bankAccountId: ''
            });
        }
    }, [isOpen, transaction]);

    const categories = type === 'income'
        ? ['Cobros', 'Ventas', 'Intereses', 'Otros Ingresos']
        : ['Materiales', 'Personal', 'Equipos', 'Servicios', 'Impuestos', 'Otros Gastos'];

    // Cargar cajas y bancos
    useEffect(() => {
        const loadAccounts = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return

                const [cashBoxesRes, bankAccountsRes] = await Promise.all([
                    fetch(`/api/cash-boxes?organizationId=${organizationId}`),
                    fetch(`/api/bank-accounts?organizationId=${organizationId}`)
                ])

                if (cashBoxesRes.ok) {
                    const cashBoxesData = await cashBoxesRes.json()
                    setCashBoxes(cashBoxesData)
                }

                if (bankAccountsRes.ok) {
                    const bankAccountsData = await bankAccountsRes.json()
                    setBankAccounts(bankAccountsData)
                }
            } catch (error) {
                console.error('Error loading accounts:', error)
            }
        }

        if (isOpen) {
            loadAccounts()
        }
    }, [session, isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            amount: parseFloat(formData.amount),
            type: type === 'income' ? 'Ingreso' : 'Egreso',
            projectId: formData.project,
            cashBoxId: formData.cashBoxId,
            bankAccountId: formData.bankAccountId,
            currency: formData.currency
        });
        // Solo resetear si no estamos editando
        if (!transaction) {
            setFormData({
                description: '',
                amount: '',
                category: '',
                currency: 'PESOS',
                date: new Date().toISOString().split('T')[0],
                account: '',
                project: '',
                notes: '',
                cashBoxId: '',
                bankAccountId: ''
            });
        }
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={transaction ? `Editar ${type === 'income' ? 'Ingreso' : 'Egreso'}` : `${type === 'income' ? 'Registrar Ingreso' : 'Registrar Egreso'}`}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Descripción *
                    </label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        required
                        value={formData.description}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={type === 'income' ? 'Ej: Cobro cliente Proyecto A' : 'Ej: Pago proveedor materiales'}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                            Monto *
                        </label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            required
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                            Moneda *
                        </label>
                        <select
                            id="currency"
                            name="currency"
                            required
                            value={formData.currency}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="PESOS">PESOS (ARS)</option>
                            <option value="USD">USD (Dólares)</option>
                            <option value="EUR">EUR (Euros)</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                            Categoría *
                        </label>
                        <select
                            id="category"
                            name="category"
                            required
                            value={formData.category}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar categoría</option>
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            Fecha *
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            required
                            value={formData.date}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                        Proyecto Relacionado
                    </label>
                    <select
                        id="project"
                        name="project"
                        value={formData.project}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="">Seleccionar proyecto (opcional)</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="cashBoxId" className="block text-sm font-medium text-gray-700">
                            Caja
                        </label>
                        <select
                            id="cashBoxId"
                            name="cashBoxId"
                            value={formData.cashBoxId}
                            onChange={(e) => {
                                handleChange(e)
                                if (e.target.value) {
                                    // No auto-select currency - allow user to choose any currency for trimonetario accounts
                                    setFormData(prev => ({ ...prev, bankAccountId: '' }))
                                } else {
                                    setFormData(prev => ({ ...prev, bankAccountId: '' }))
                                }
                            }}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar caja (opcional)</option>
                            {cashBoxes.map(cashBox => (
                                <option key={cashBox.id} value={cashBox.id}>
                                    {cashBox.name} ({cashBox.currency}) - ${cashBox.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </option>
                            ))}
                        </select>
                        {formData.cashBoxId && (
                            <p className="mt-1 text-xs text-blue-600">
                                Balance actual: ${cashBoxes.find(cb => cb.id === formData.cashBoxId)?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="bankAccountId" className="block text-sm font-medium text-gray-700">
                            Cuenta Bancaria
                        </label>
                        <select
                            id="bankAccountId"
                            name="bankAccountId"
                            value={formData.bankAccountId}
                            onChange={(e) => {
                                handleChange(e)
                                if (e.target.value) {
                                    // No auto-select currency - allow user to choose any currency for trimonetario accounts
                                    setFormData(prev => ({ ...prev, cashBoxId: '' }))
                                } else {
                                    setFormData(prev => ({ ...prev, cashBoxId: '' }))
                                }
                            }}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar cuenta (opcional)</option>
                            {bankAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.name} - {account.bankName} ({account.currency}) - ${account.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </option>
                            ))}
                        </select>
                        {formData.bankAccountId && (
                            <p className="mt-1 text-xs text-blue-600">
                                Balance actual: ${bankAccounts.find(ba => ba.id === formData.bankAccountId)?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notas
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Notas adicionales..."
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${type === 'income'
                            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                            }`}
                    >
                        {transaction ? 'Actualizar' : (type === 'income' ? 'Registrar Ingreso' : 'Registrar Egreso')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
