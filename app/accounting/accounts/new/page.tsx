'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { Save, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Account {
    id: string
    code: string
    name: string
    type: string
    parent?: {
        id: string
        code: string
        name: string
    }
}

const ACCOUNT_TYPES = [
    { value: 'ASSET', label: 'Activo' },
    { value: 'LIABILITY', label: 'Pasivo' },
    { value: 'EQUITY', label: 'Patrimonio Neto' },
    { value: 'REVENUE', label: 'Ingreso' },
    { value: 'EXPENSE', label: 'Gasto' },
    { value: 'OTHER_INCOME', label: 'Otros Ingresos' },
    { value: 'OTHER_EXPENSE', label: 'Otros Gastos' }
]

export default function NewAccount() {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [accounts, setAccounts] = useState<Account[]>([])
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'ASSET',
        parentId: ''
    })
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

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.code.trim()) {
            newErrors.code = 'El código de cuenta es obligatorio'
        } else if (!/^[0-9.]+$/.test(formData.code)) {
            newErrors.code = 'El código debe contener solo números y puntos'
        } else if (accounts.some(acc => acc.code === formData.code)) {
            newErrors.code = 'Ya existe una cuenta con este código'
        }

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre de la cuenta es obligatorio'
        }

        if (!formData.type) {
            newErrors.type = 'Debe seleccionar un tipo de cuenta'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        try {
            setSaving(true)

            const response = await fetch('/api/accounting/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    parentId: formData.parentId || null
                })
            })

            if (response.ok) {
                router.push('/accounting/chart-of-accounts')
            } else {
                const error = await response.json()
                setErrors({ submit: error.message || 'Error al crear la cuenta' })
            }
        } catch (error) {
            console.error('Error creating account:', error)
            setErrors({ submit: 'Error de conexión' })
        } finally {
            setSaving(false)
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value })
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' })
        }
    }

    const getParentAccounts = () => {
        // Allow any account of the same type to be parent
        return accounts.filter(acc => acc.type === formData.type)
    }

    const suggestCode = () => {
        if (!formData.type) return ''

        const typeAccounts = accounts.filter(acc => acc.type === formData.type)
        if (typeAccounts.length === 0) {
            // Códigos base por tipo
            const baseCodes = {
                'ASSET': '1',
                'LIABILITY': '2',
                'EQUITY': '3',
                'REVENUE': '4',
                'EXPENSE': '5',
                'OTHER_INCOME': '6',
                'OTHER_EXPENSE': '7'
            }
            return baseCodes[formData.type as keyof typeof baseCodes] || '1'
        }

        // Si hay cuenta padre seleccionada
        if (formData.parentId) {
            const parent = accounts.find(acc => acc.id === formData.parentId)
            if (parent) {
                const siblings = accounts.filter(acc =>
                    acc.parent?.id === formData.parentId
                )
                const nextNumber = siblings.length + 1
                return `${parent.code}.${nextNumber.toString().padStart(2, '0')}`
            }
        }

        // Sugerir siguiente código de primer nivel
        const firstLevelCodes = typeAccounts
            .filter(acc => !acc.parent)
            .map(acc => parseInt(acc.code.split('.')[0]))
            .sort((a, b) => a - b)

        const typeBaseCodes = {
            'ASSET': 1,
            'LIABILITY': 2,
            'EQUITY': 3,
            'REVENUE': 4,
            'EXPENSE': 5,
            'OTHER_INCOME': 6,
            'OTHER_EXPENSE': 7
        }

        const baseCode = typeBaseCodes[formData.type as keyof typeof typeBaseCodes] || 1
        let suggestedCode = baseCode

        for (const code of firstLevelCodes) {
            if (code >= baseCode) {
                suggestedCode = code + 1
                break
            }
        }

        return suggestedCode.toString()
    }

    if (loading) {
        return (
            <Layout title="Nueva Cuenta" subtitle="Crear cuenta contable">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Nueva Cuenta" subtitle="Crear cuenta contable">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/accounting/chart-of-accounts"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al Plan de Cuentas
                    </Link>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <span className="text-red-700">{errors.submit}</span>
                            </div>
                        )}

                        {/* Tipo de Cuenta */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Cuenta *
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {ACCOUNT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            {errors.type && (
                                <p className="text-red-600 text-sm mt-1">{errors.type}</p>
                            )}
                        </div>

                        {/* Cuenta Padre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cuenta Padre (Opcional)
                            </label>
                            <select
                                value={formData.parentId}
                                onChange={(e) => handleInputChange('parentId', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Sin cuenta padre</option>
                                {getParentAccounts().map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.code} - {account.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Código */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Código de Cuenta *
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => handleInputChange('code', e.target.value)}
                                    placeholder="Ej: 1.01.001"
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('code', suggestCode())}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                >
                                    Sugerir
                                </button>
                            </div>
                            {errors.code && (
                                <p className="text-red-600 text-sm mt-1">{errors.code}</p>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                                Use números y puntos para crear jerarquía (ej: 1.01.001)
                            </p>
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre de la Cuenta *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Ej: Caja y Bancos"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.name && (
                                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Información Adicional */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">Información sobre Códigos</h4>
                            <div className="text-sm text-blue-800 space-y-1">
                                <p>• <strong>1.xx.xxx:</strong> Activos (Efectivo, Inventarios, Equipos)</p>
                                <p>• <strong>2.xx.xxx:</strong> Pasivos (Proveedores, Préstamos)</p>
                                <p>• <strong>3.xx.xxx:</strong> Patrimonio Neto (Capital, Utilidades)</p>
                                <p>• <strong>4.xx.xxx:</strong> Ingresos (Ventas, Servicios)</p>
                                <p>• <strong>5.xx.xxx:</strong> Gastos (Operativos, Administrativos)</p>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-4 pt-6 border-t border-gray-200">
                            <Link
                                href="/accounting/chart-of-accounts"
                                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Crear Cuenta
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    )
}