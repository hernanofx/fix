'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Account {
    id: string
    code: string
    name: string
    type: string
    subType?: string
    parentId?: string
    parent?: { code: string; name: string }
    currency: string
    description?: string
    isActive: boolean
}

interface ParentAccount {
    id: string
    code: string
    name: string
    type: string
}

export default function EditAccountPage({ params }: { params: { id: string } }) {
    const { data: session } = useSession()
    const router = useRouter()
    const [account, setAccount] = useState<Account | null>(null)
    const [parentAccounts, setParentAccounts] = useState<ParentAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: '',
        subType: '',
        parentId: '',
        currency: 'PESOS',
        description: '',
        isActive: true
    })

    useEffect(() => {
        if (session) {
            fetchAccount()
            fetchParentAccounts()
        }
    }, [session, params.id])

    const fetchAccount = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/accounting/accounts/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setAccount(data)
                setFormData({
                    code: data.code,
                    name: data.name,
                    type: data.type,
                    subType: data.subType || '',
                    parentId: data.parentId || '',
                    currency: data.currency,
                    description: data.description || '',
                    isActive: data.isActive
                })
            } else {
                console.error('Error fetching account')
                router.push('/accounting/chart-of-accounts')
            }
        } catch (error) {
            console.error('Error fetching account:', error)
            router.push('/accounting/chart-of-accounts')
        } finally {
            setLoading(false)
        }
    }

    const fetchParentAccounts = async () => {
        try {
            const response = await fetch('/api/accounting/accounts?includeChildren=false')
            if (response.ok) {
                const data = await response.json()
                // Filtrar cuentas que no sean la cuenta actual y que puedan ser padres
                const filtered = data.filter((acc: Account) =>
                    acc.id !== params.id &&
                    (acc.type === 'ACTIVO' || acc.type === 'PASIVO' || acc.type === 'PATRIMONIO' || acc.type === 'INGRESO' || acc.type === 'EGRESO')
                )
                setParentAccounts(filtered)
            }
        } catch (error) {
            console.error('Error fetching parent accounts:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.code || !formData.name || !formData.type) {
            alert('Por favor complete todos los campos obligatorios')
            return
        }

        try {
            setSaving(true)
            const response = await fetch(`/api/accounting/accounts/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                router.push('/accounting/chart-of-accounts')
            } else {
                const error = await response.json()
                alert(error.error || 'Error al actualizar la cuenta')
            }
        } catch (error) {
            console.error('Error updating account:', error)
            alert('Error al actualizar la cuenta')
        } finally {
            setSaving(false)
        }
    }

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const accountTypes = [
        { value: 'ACTIVO', label: 'Activo' },
        { value: 'PASIVO', label: 'Pasivo' },
        { value: 'PATRIMONIO', label: 'Patrimonio' },
        { value: 'INGRESO', label: 'Ingreso' },
        { value: 'EGRESO', label: 'Egreso' },
        { value: 'OTHER_INCOME', label: 'Otros Ingresos' },
        { value: 'OTHER_EXPENSE', label: 'Otros Egresos' }
    ]

    if (loading) {
        return (
            <Layout title="Editar Cuenta" subtitle="Cargando...">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </Layout>
        )
    }

    if (!account) {
        return (
            <Layout title="Editar Cuenta" subtitle="Cuenta no encontrada">
                <div className="text-center py-12">
                    <p className="text-gray-500">La cuenta solicitada no existe o no tienes permisos para acceder a ella.</p>
                    <Link
                        href="/accounting/chart-of-accounts"
                        className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-800"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver al Plan de Cuentas
                    </Link>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Editar Cuenta" subtitle={`Editando cuenta ${account.code} - ${account.name}`}>
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/accounting/chart-of-accounts"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver al Plan de Cuentas
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Editar Cuenta Contable</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Modifique los datos de la cuenta según sea necesario
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Código <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => handleInputChange('code', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: 1.1.01"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nombre de la cuenta"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Seleccionar tipo</option>
                                    {accountTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subtipo
                                </label>
                                <input
                                    type="text"
                                    value={formData.subType}
                                    onChange={(e) => handleInputChange('subType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: Corriente, No Corriente"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cuenta Padre
                                </label>
                                <select
                                    value={formData.parentId}
                                    onChange={(e) => handleInputChange('parentId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Sin padre (cuenta raíz)</option>
                                    {parentAccounts.map(parent => (
                                        <option key={parent.id} value={parent.id}>
                                            {parent.code} - {parent.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Moneda
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => handleInputChange('currency', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="PESOS">Pesos Argentinos</option>
                                    <option value="USD">Dólares Americanos</option>
                                    <option value="EUR">Euros</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Descripción opcional de la cuenta"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                Cuenta activa
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                            <Link
                                href="/accounting/chart-of-accounts"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Guardar Cambios
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