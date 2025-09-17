'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface PurchaseOrderFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (orderData: any) => void
    order?: any
}

interface OrderItem {
    id?: string
    materialId: string
    material?: any
    quantity: number
    unit: string
    rubroId?: string
    rubro?: any
    notes?: string
}

export default function PurchaseOrderFormModal({
    isOpen,
    onClose,
    onSave,
    order
}: PurchaseOrderFormModalProps) {
    const { data: session } = useSession()
    const [formData, setFormData] = useState({
        description: '',
        providerId: '',
        projectId: '',
        deliveryDate: '',
        notes: '',
        status: 'PENDING'
    })
    const [items, setItems] = useState<OrderItem[]>([])
    const [providers, setProviders] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [materials, setMaterials] = useState<any[]>([])
    const [rubros, setRubros] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadData()
            if (order) {
                setFormData({
                    description: order.description || '',
                    providerId: order.providerId || '',
                    projectId: order.projectId || '',
                    deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
                    notes: order.notes || '',
                    status: order.status || 'PENDING'
                })
                setItems(order.items?.map((item: any) => ({
                    id: item.id,
                    materialId: item.materialId,
                    material: item.material,
                    quantity: item.quantity,
                    unit: item.unit,
                    rubroId: item.rubroId,
                    rubro: item.rubro,
                    notes: item.notes
                })) || [])
            } else {
                setFormData({
                    description: '',
                    providerId: '',
                    projectId: '',
                    deliveryDate: '',
                    notes: '',
                    status: 'PENDING'
                })
                setItems([])
            }
        }
    }, [isOpen, order])

    const loadData = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) return

            // Load providers
            const providersRes = await fetch(`/api/providers?organizationId=${organizationId}`)
            const providersData = await providersRes.json()
            setProviders(providersData || [])

            // Load projects
            const projectsRes = await fetch(`/api/projects?organizationId=${organizationId}`)
            const projectsData = await projectsRes.json()
            setProjects(projectsData || [])

            // Load materials
            const materialsRes = await fetch(`/api/stock/materials?organizationId=${organizationId}`)
            const materialsData = await materialsRes.json()
            setMaterials(materialsData || [])

            // Load rubros (only provider type)
            const rubrosRes = await fetch(`/api/rubros?organizationId=${organizationId}&type=PROVIDER`)
            const rubrosData = await rubrosRes.json()
            setRubros(rubrosData || [])
        } catch (error) {
            console.error('Error loading data:', error)
        }
    }

    const addItem = () => {
        setItems([...items, {
            materialId: '',
            quantity: 1,
            unit: '',
            notes: ''
        }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }

        // Auto-fill unit when material is selected
        if (field === 'materialId' && value) {
            const material = materials.find(m => m.id === value)
            if (material) {
                newItems[index].unit = material.unit
                newItems[index].material = material
            }
        }

        setItems(newItems)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return

        if (items.length === 0) {
            alert('Debe agregar al menos un item')
            return
        }

        // Validate items
        for (const item of items) {
            if (!item.materialId || !item.quantity || item.quantity <= 0) {
                alert('Todos los items deben tener material y cantidad válida')
                return
            }
        }

        setLoading(true)
        try {
            const orderData = {
                ...formData,
                items: items.map(item => ({
                    materialId: item.materialId,
                    quantity: item.quantity,
                    unit: item.unit,
                    rubroId: item.rubroId || null,
                    notes: item.notes || ''
                }))
            }
            await onSave(orderData)
            onClose()
        } catch (error) {
            console.error('Error saving order:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {order ? 'Editar Orden de Pedido' : 'Nueva Orden de Pedido'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción *
                            </label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Descripción de la orden"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Proveedor
                            </label>
                            <select
                                value={formData.providerId}
                                onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Sin proveedor asignado</option>
                                {providers.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Proyecto
                            </label>
                            <select
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Sin proyecto asignado</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.name} {project.code ? `(${project.code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Entrega
                            </label>
                            <input
                                type="date"
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {order && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estado
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="PENDING">Pendiente</option>
                                    <option value="APPROVED">Aprobada</option>
                                    <option value="ORDERED">Ordenada</option>
                                    <option value="RECEIVED">Recibida</option>
                                    <option value="CANCELLED">Cancelada</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notas
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Notas adicionales"
                        />
                    </div>

                    {/* Items Section */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Materiales de la Orden</h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Agregar Material
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No hay materiales agregados. Haz clic en "Agregar Material" para comenzar.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-medium text-gray-900">Material {index + 1}</h4>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Material *
                                                </label>
                                                <select
                                                    value={item.materialId}
                                                    onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="">Seleccionar material</option>
                                                    {materials.map(material => (
                                                        <option key={material.id} value={material.id}>
                                                            {material.name} {material.code ? `(${material.code})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cantidad *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unidad
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="kg, m2, unidades, etc."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Rubro
                                                </label>
                                                <select
                                                    value={item.rubroId || ''}
                                                    onChange={(e) => updateItem(index, 'rubroId', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Sin rubro</option>
                                                    {rubros.map(rubro => (
                                                        <option key={rubro.id} value={rubro.id}>
                                                            {rubro.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Notas del Item
                                            </label>
                                            <input
                                                type="text"
                                                value={item.notes || ''}
                                                onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Notas específicas para este item"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : (order ? 'Actualizar Orden' : 'Crear Orden')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
