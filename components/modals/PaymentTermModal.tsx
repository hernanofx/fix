'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface PaymentTermModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (termData: any) => void
    term?: any
    clients: any[]
    providers: any[]
    projects: any[]
}

export default function PaymentTermModal({
    isOpen,
    onClose,
    onSave,
    term,
    clients,
    providers,
    projects
}: PaymentTermModalProps) {
    const { data: session } = useSession()
    const [isLoading, setIsLoading] = useState(false)

    // Verificar que haya datos disponibles
    const hasClients = clients && clients.length > 0
    const hasProviders = providers && providers.length > 0
    const hasAnyEntities = hasClients || hasProviders

    const [formData, setFormData] = useState({
        type: 'INCOME' as 'INCOME' | 'EXPENSE',
        entityType: 'CLIENT' as 'CLIENT' | 'PROVIDER',
        entityId: '',
        projectId: 'none',
        amount: '',
        currency: 'PESOS',
        startDate: '',
        recurrence: 'MENSUAL',
        periods: '',
        description: ''
    })

    useEffect(() => {
        if (term) {
            setFormData({
                type: term.type,
                entityType: term.entityType,
                entityId: term.clientId || term.providerId || '',
                projectId: term.projectId || 'none',
                amount: term.amount.toString(),
                currency: term.currency,
                startDate: term.startDate.split('T')[0], // Convertir a formato YYYY-MM-DD
                recurrence: term.recurrence,
                periods: term.periods.toString(),
                description: term.description || ''
            })
        } else {
            setFormData({
                type: 'INCOME',
                entityType: 'CLIENT',
                entityId: '',
                projectId: 'none',
                amount: '',
                currency: 'PESOS',
                startDate: '',
                recurrence: 'MENSUAL',
                periods: '',
                description: ''
            })
        }
    }, [term, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Validar que haya entidades disponibles
            if (!hasAnyEntities) {
                toast.error('No hay clientes ni proveedores disponibles. Crea uno primero.')
                setIsLoading(false)
                return
            }

            // Validaciones
            if (!formData.startDate) {
                toast.error('La fecha de inicio es requerida')
                setIsLoading(false)
                return
            }
            if (!formData.entityId) {
                toast.error('Debe seleccionar un cliente o proveedor')
                setIsLoading(false)
                return
            }

            // Validar que el entityId existe en la lista correspondiente
            const entityOptions = getEntityOptions()
            const selectedEntity = entityOptions.find(entity => entity.id === formData.entityId)
            if (!selectedEntity) {
                toast.error(`El ${formData.entityType === 'CLIENT' ? 'cliente' : 'proveedor'} seleccionado no existe`)
                setIsLoading(false)
                return
            }

            if (!formData.amount || parseFloat(formData.amount) <= 0) {
                toast.error('El monto debe ser mayor a 0')
                setIsLoading(false)
                return
            }
            if (!formData.periods || parseInt(formData.periods) <= 0) {
                toast.error('Los períodos deben ser mayor a 0')
                setIsLoading(false)
                return
            }

            const data = {
                ...formData,
                amount: parseFloat(formData.amount),
                periods: parseInt(formData.periods),
                startDate: new Date(formData.startDate + 'T00:00:00').toISOString(),
                projectId: formData.projectId === 'none' ? null : formData.projectId,
                ...(term && { id: term.id })
            }

            console.log('Enviando datos:', data) // Debug log

            const url = term ? '/api/payment-terms' : '/api/payment-terms'
            const method = term ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (response.ok) {
                toast.success(term ? 'Término actualizado correctamente' : 'Término creado correctamente')
                onSave(data)
                onClose()
            } else {
                const errorData = await response.json()
                console.error('Error del servidor:', errorData) // Debug log
                toast.error(errorData.error || 'Error al guardar el término')
            }
        } catch (error) {
            console.error('Error al guardar:', error)
            toast.error('Error de conexión. Intente nuevamente.')
        } finally {
            setIsLoading(false)
        }
    }

    const getEntityOptions = () => {
        return formData.entityType === 'CLIENT' ? clients : providers
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {!hasAnyEntities && (
                    <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    No hay entidades disponibles
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>
                                        Necesitas crear al menos un cliente o proveedor antes de poder crear términos de pago.
                                        <br />
                                        <a href="/clients" className="font-medium underline text-yellow-700 hover:text-yellow-600">
                                            Ir a Clientes
                                        </a>
                                        {' • '}
                                        <a href="/providers" className="font-medium underline text-yellow-700 hover:text-yellow-600">
                                            Ir a Proveedores
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tipo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo *
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="INCOME">Ingreso (Cobro)</option>
                                <option value="EXPENSE">Egreso (Pago)</option>
                            </select>
                        </div>

                        {/* Entidad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Entidad *
                            </label>
                            <select
                                value={formData.entityType}
                                onChange={(e) => setFormData({ ...formData, entityType: e.target.value as 'CLIENT' | 'PROVIDER', entityId: '' })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="CLIENT">Cliente</option>
                                <option value="PROVIDER">Proveedor</option>
                            </select>
                        </div>

                        {/* Cliente/Proveedor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {formData.entityType === 'CLIENT' ? 'Cliente' : 'Proveedor'} *
                            </label>
                            <select
                                value={formData.entityId}
                                onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">
                                    Seleccionar {formData.entityType === 'CLIENT' ? 'cliente' : 'proveedor'}
                                </option>
                                {getEntityOptions().length === 0 ? (
                                    <option value="" disabled>
                                        No hay {formData.entityType === 'CLIENT' ? 'clientes' : 'proveedores'} disponibles
                                    </option>
                                ) : (
                                    getEntityOptions().map((entity) => (
                                        <option key={entity.id} value={entity.id}>
                                            {entity.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            {getEntityOptions().length === 0 && (
                                <p className="text-xs text-red-600 mt-1">
                                    No hay {formData.entityType === 'CLIENT' ? 'clientes' : 'proveedores'} registrados.
                                    <a href={formData.entityType === 'CLIENT' ? '/clients' : '/providers'} className="text-blue-600 hover:underline">
                                        Crear uno primero
                                    </a>
                                </p>
                            )}
                        </div>

                        {/* Proyecto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Proyecto (opcional)
                            </label>
                            <select
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="none">Sin proyecto</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Monto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monto *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Moneda */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Moneda *
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="PESOS">PESOS</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>

                        {/* Períodos */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Períodos *
                            </label>
                            <input
                                type="number"
                                value={formData.periods}
                                onChange={(e) => setFormData({ ...formData, periods: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="12"
                                required
                            />
                        </div>

                        {/* Fecha Inicio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha Inicio *
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* Recurrencia */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Recurrencia *
                            </label>
                            <select
                                value={formData.recurrence}
                                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="MENSUAL">Mensual</option>
                                <option value="BIMESTRAL">Bimestral</option>
                                <option value="TRIMESTRAL">Trimestral</option>
                                <option value="CUATRIMESTRAL">Cuatrimestral</option>
                                <option value="SEMESTRAL">Semestral</option>
                                <option value="ANUAL">Anual</option>
                            </select>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Descripción del término de pago..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !hasAnyEntities}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Guardando...' : (term ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
