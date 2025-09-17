'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { Save, ArrowLeft, Plus, Trash2, AlertCircle, Calculator } from 'lucide-react'
import Link from 'next/link'

interface Account {
    id: string
    code: string
    name: string
    type: string
}

interface JournalEntryLine {
    id: string
    accountId: string
    description: string
    debitAmount: number
    creditAmount: number
}

export default function NewJournalEntry() {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [accounts, setAccounts] = useState<Account[]>([])
    const [formData, setFormData] = useState({
        description: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        currency: 'PESOS' // Nueva selección de moneda
    })
    const [lines, setLines] = useState<JournalEntryLine[]>([
        { id: '1', accountId: '', description: '', debitAmount: 0, creditAmount: 0 },
        { id: '2', accountId: '', description: '', debitAmount: 0, creditAmount: 0 }
    ])
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchAccounts()
    }, [session])

    const fetchAccounts = async () => {
        if (!session?.user?.organizationId) return

        try {
            setLoading(true)
            const response = await fetch('/api/accounting/accounts')
            if (response.ok) {
                const data = await response.json()
                setAccounts(data)
            }
        } catch (error) {
            console.error('Error loading accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    const addLine = () => {
        const newId = (lines.length + 1).toString()
        setLines([...lines, {
            id: newId,
            accountId: '',
            description: '',
            debitAmount: 0,
            creditAmount: 0
        }])
    }

    const removeLine = (lineId: string) => {
        if (lines.length <= 2) return // Mínimo 2 líneas
        setLines(lines.filter(line => line.id !== lineId))
    }

    const updateLine = (lineId: string, field: string, value: any) => {
        setLines(lines.map(line =>
            line.id === lineId ? { ...line, [field]: value } : line
        ))
        // Limpiar errores relacionados
        if (errors[`line_${lineId}_${field}`]) {
            setErrors({ ...errors, [`line_${lineId}_${field}`]: '' })
        }
    }

    const getTotalDebits = () => {
        return lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0)
    }

    const getTotalCredits = () => {
        return lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0)
    }

    const isBalanced = () => {
        const debits = getTotalDebits()
        const credits = getTotalCredits()
        return Math.abs(debits - credits) < 0.01 && debits > 0
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.description.trim()) {
            newErrors.description = 'La descripción es obligatoria'
        }

        if (!formData.date) {
            newErrors.date = 'La fecha es obligatoria'
        }

        // Validar líneas
        let hasValidLines = false
        lines.forEach(line => {
            if (!line.accountId) {
                newErrors[`line_${line.id}_account`] = 'Seleccione una cuenta'
            }

            if (!line.description.trim()) {
                newErrors[`line_${line.id}_description`] = 'Ingrese una descripción'
            }

            if ((line.debitAmount || 0) === 0 && (line.creditAmount || 0) === 0) {
                newErrors[`line_${line.id}_amount`] = 'Ingrese un monto'
            }

            if ((line.debitAmount || 0) > 0 && (line.creditAmount || 0) > 0) {
                newErrors[`line_${line.id}_amount`] = 'No puede tener débito y crédito al mismo tiempo'
            }

            if (line.accountId && line.description && ((line.debitAmount || 0) > 0 || (line.creditAmount || 0) > 0)) {
                hasValidLines = true
            }
        })

        if (!hasValidLines) {
            newErrors.lines = 'Debe tener al menos una línea válida'
        }

        if (!isBalanced()) {
            newErrors.balance = 'El asiento debe estar balanceado (débitos = créditos)'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        try {
            setSaving(true)

            const response = await fetch('/api/accounting/journal-entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    lines: lines.filter(line =>
                        line.accountId &&
                        line.description &&
                        ((line.debitAmount || 0) > 0 || (line.creditAmount || 0) > 0)
                    )
                })
            })

            if (response.ok) {
                router.push('/accounting/journal')
            } else {
                const error = await response.json()
                setErrors({ submit: error.message || 'Error al crear el asiento' })
            }
        } catch (error) {
            console.error('Error creating journal entry:', error)
            setErrors({ submit: 'Error de conexión' })
        } finally {
            setSaving(false)
        }
    }

    const formatCurrency = (amount: number) => {
        const currencyMap = {
            'PESOS': 'ARS',
            'USD': 'USD',
            'EUR': 'EUR'
        }
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currencyMap[formData.currency as keyof typeof currencyMap] || 'ARS',
            minimumFractionDigits: 2
        }).format(amount)
    }

    if (loading) {
        return (
            <Layout title="Nuevo Asiento" subtitle="Crear asiento contable manual">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Nuevo Asiento" subtitle="Crear asiento contable manual">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/accounting/journal"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al Libro Diario
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-red-700">{errors.submit}</span>
                        </div>
                    )}

                    {/* Información General */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha *
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.date && (
                                    <p className="text-red-600 text-sm mt-1">{errors.date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Referencia
                                </label>
                                <input
                                    type="text"
                                    value={formData.reference}
                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                    placeholder="Ej: Factura #001"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción *
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descripción del asiento"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.description && (
                                    <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Moneda *
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="PESOS">Pesos (ARS)</option>
                                    <option value="USD">Dólares (USD)</option>
                                    <option value="EUR">Euros (EUR)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Líneas del Asiento */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Líneas del Asiento</h3>
                                <button
                                    type="button"
                                    onClick={addLine}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar Línea
                                </button>
                            </div>
                            {errors.lines && (
                                <p className="text-red-600 text-sm mt-2">{errors.lines}</p>
                            )}
                            {errors.balance && (
                                <p className="text-red-600 text-sm mt-2">{errors.balance}</p>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cuenta</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Descripción</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Débito</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Crédito</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {lines.map((line, index) => (
                                        <tr key={line.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <select
                                                    value={line.accountId}
                                                    onChange={(e) => updateLine(line.id, 'accountId', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="">Seleccionar cuenta...</option>
                                                    {accounts.map(account => (
                                                        <option key={account.id} value={account.id}>
                                                            {account.code} - {account.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors[`line_${line.id}_account`] && (
                                                    <p className="text-red-600 text-xs mt-1">{errors[`line_${line.id}_account`]}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={line.description}
                                                    onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                                                    placeholder="Descripción de la línea"
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {errors[`line_${line.id}_description`] && (
                                                    <p className="text-red-600 text-xs mt-1">{errors[`line_${line.id}_description`]}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={line.debitAmount || ''}
                                                    onChange={(e) => updateLine(line.id, 'debitAmount', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {errors[`line_${line.id}_amount`] && (
                                                    <p className="text-red-600 text-xs mt-1">{errors[`line_${line.id}_amount`]}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={line.creditAmount || ''}
                                                    onChange={(e) => updateLine(line.id, 'creditAmount', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {lines.length > 2 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLine(line.id)}
                                                        className="text-red-600 hover:text-red-700 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 text-right font-medium text-gray-700">
                                            Totales:
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                            {formatCurrency(getTotalDebits())}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                            {formatCurrency(getTotalCredits())}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isBalanced() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                <Calculator className="h-3 w-3" />
                                                {isBalanced() ? 'Balanceado' : 'Desbalanceado'}
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Información de Balance */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Principio de Partida Doble</h4>
                        <div className="text-sm text-blue-800 space-y-1">
                            <p>• El total de débitos debe ser igual al total de créditos</p>
                            <p>• Cada línea debe tener solo débito O crédito, no ambos</p>
                            <p>• Debe haber al menos 2 líneas con importes</p>
                            <p>• <strong>Estado actual:</strong> Débitos: {formatCurrency(getTotalDebits())} | Créditos: {formatCurrency(getTotalCredits())}</p>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-4 pt-6 border-t border-gray-200">
                        <Link
                            href="/accounting/journal"
                            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={saving || !isBalanced()}
                            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Crear Asiento
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}