'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DecimalUtils } from '@/lib/decimal-utils'

interface Material {
    id: string
    name: string
    code: string | null
    unit: string
}

interface Warehouse {
    id: string
    name: string
    code: string | null
}

interface Client {
    id: string
    name: string
    email?: string
}

interface Provider {
    id: string
    name: string
    email?: string
}

interface StockEntryModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function StockEntryModal({ onClose, onSuccess }: StockEntryModalProps) {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [materials, setMaterials] = useState<Material[]>([])
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [providers, setProviders] = useState<Provider[]>([])
    const [formData, setFormData] = useState({
        materialId: '',
        warehouseId: '',
        quantity: '',
        costPrice: '',
        currency: 'PESOS',
        description: '',
        reference: '',
        originType: '',
        originId: '',
        originName: ''
    })

    useEffect(() => {
        if (session?.user?.organizationId) {
            fetchMaterials()
            fetchWarehouses()
            fetchClients()
            fetchProviders()
        }
    }, [session])

    const fetchMaterials = async () => {
        try {
            const response = await fetch('/api/stock/materials')
            if (response.ok) {
                const data = await response.json()
                setMaterials(data)
            }
        } catch (error) {
            console.error('Error fetching materials:', error)
        }
    }

    const fetchWarehouses = async () => {
        try {
            const response = await fetch('/api/stock/warehouses')
            if (response.ok) {
                const data = await response.json()
                setWarehouses(data)
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error)
        }
    }

    const fetchClients = async () => {
        if (!session?.user?.organizationId) return

        try {
            const response = await fetch(`/api/clients?organizationId=${session.user.organizationId}`)
            if (response.ok) {
                const data = await response.json()
                setClients(data)
            }
        } catch (error) {
            console.error('Error fetching clients:', error)
        }
    }

    const fetchProviders = async () => {
        if (!session?.user?.organizationId) return

        try {
            const response = await fetch(`/api/providers?organizationId=${session.user.organizationId}`)
            if (response.ok) {
                const data = await response.json()
                setProviders(data)
            }
        } catch (error) {
            console.error('Error fetching providers:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validar que la moneda sea obligatoria si hay precio de costo
        if (formData.costPrice && !formData.currency) {
            alert('La moneda es obligatoria cuando se especifica un precio de costo')
            setLoading(false)
            return
        }

        try {
            const data = {
                type: 'ENTRADA',
                materialId: formData.materialId,
                toWarehouseId: formData.warehouseId,
                quantity: DecimalUtils.toDecimal(formData.quantity),
                costPrice: formData.costPrice ? DecimalUtils.toDecimal(formData.costPrice) : null,
                currency: formData.currency,
                description: formData.description,
                reference: formData.reference,
                originType: formData.originType || null,
                originId: formData.originId || null,
                originName: formData.originName || null
            }

            const response = await fetch('/api/stock/movements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (response.ok) {
                onSuccess()
            } else {
                const error = await response.json()
                alert(error.message || 'Error al registrar entrada de stock')
            }
        } catch (error) {
            console.error('Error creating stock entry:', error)
            alert('Error al registrar entrada de stock')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        Entrada de Stock
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <span className="sr-only">Cerrar</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="materialId">Material *</Label>
                        <Select value={formData.materialId} onValueChange={(value) => setFormData({ ...formData, materialId: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar material" />
                            </SelectTrigger>
                            <SelectContent>
                                {materials.map((material) => (
                                    <SelectItem key={material.id} value={material.id}>
                                        {material.name} {material.code ? `(${material.code})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="warehouseId">Almacén de Destino *</Label>
                        <Select value={formData.warehouseId} onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar almacén" />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map((warehouse) => (
                                    <SelectItem key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name} {warehouse.code ? `(${warehouse.code})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="originType">Origen (Opcional)</Label>
                        <Select value={formData.originType} onValueChange={(value) => setFormData({ ...formData, originType: value, originId: '', originName: '' })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo de origen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CLIENT">Cliente</SelectItem>
                                <SelectItem value="PROVIDER">Proveedor</SelectItem>
                                <SelectItem value="CUSTOM">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.originType === 'CLIENT' && (
                        <div className="space-y-2">
                            <Label htmlFor="originId">Cliente</Label>
                            <Select value={formData.originId} onValueChange={(value) => setFormData({ ...formData, originId: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {formData.originType === 'PROVIDER' && (
                        <div className="space-y-2">
                            <Label htmlFor="originId">Proveedor</Label>
                            <Select value={formData.originId} onValueChange={(value) => setFormData({ ...formData, originId: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar proveedor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {providers.map((provider) => (
                                        <SelectItem key={provider.id} value={provider.id}>
                                            {provider.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {formData.originType === 'CUSTOM' && (
                        <div className="space-y-2">
                            <Label htmlFor="originName">Nombre del Origen</Label>
                            <Input
                                id="originName"
                                value={formData.originName}
                                onChange={(e) => setFormData({ ...formData, originName: e.target.value })}
                                placeholder="Ingrese el nombre del origen"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Cantidad *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                step="0.01"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="costPrice">Precio Costo</Label>
                            <Input
                                id="costPrice"
                                type="number"
                                step="0.01"
                                value={formData.costPrice}
                                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currency">Moneda *</Label>
                        <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar moneda" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PESOS">PESOS</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                        </Select>
                        {formData.costPrice && !formData.currency && (
                            <p className="text-sm text-red-600">La moneda es obligatoria cuando se especifica un precio de costo</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Referencia</Label>
                        <Input
                            id="reference"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="Número de orden, factura, etc."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Detalles adicionales del movimiento"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrar Entrada'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
