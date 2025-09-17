'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DecimalUtils } from '@/lib/decimal-utils'

interface StockItem {
    id: string
    material: {
        id: string
        name: string
        code: string | null
        unit: string
    }
    warehouse: {
        id: string
        name: string
        code: string | null
    }
    quantity: number
    available: number
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

interface StockExitModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function StockExitModal({ onClose, onSuccess }: StockExitModalProps) {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [stocks, setStocks] = useState<StockItem[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [providers, setProviders] = useState<Provider[]>([])
    const [selectedStock, setSelectedStock] = useState<StockItem | null>(null)
    const [formData, setFormData] = useState({
        stockId: '',
        quantity: '',
        description: '',
        reference: '',
        destType: '',
        destId: '',
        destName: ''
    })

    useEffect(() => {
        if (session?.user?.organizationId) {
            fetchStocks()
            fetchClients()
            fetchProviders()
        }
    }, [session])

    const fetchStocks = async () => {
        try {
            const response = await fetch('/api/stock/stocks')
            if (response.ok) {
                const data = await response.json()
                // Filtrar solo stocks con cantidad disponible > 0
                const availableStocks = data.filter((stock: StockItem) => stock.available > 0)
                setStocks(availableStocks)
            }
        } catch (error) {
            console.error('Error fetching stocks:', error)
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

    const handleStockChange = (stockId: string) => {
        const stock = stocks.find(s => s.id === stockId)
        setSelectedStock(stock || null)
        setFormData({ ...formData, stockId, quantity: '' })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const quantity = DecimalUtils.toDecimal(formData.quantity)

            if (selectedStock && quantity > selectedStock.available) {
                alert('La cantidad solicitada excede el stock disponible')
                setLoading(false)
                return
            }

            const data = {
                type: 'SALIDA',
                materialId: selectedStock?.material.id,
                fromWarehouseId: selectedStock?.warehouse.id,
                quantity: quantity,
                description: formData.description,
                reference: formData.reference,
                destType: formData.destType || null,
                destId: formData.destId || null,
                destName: formData.destName || null
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
                alert(error.message || 'Error al registrar salida de stock')
            }
        } catch (error) {
            console.error('Error creating stock exit:', error)
            alert('Error al registrar salida de stock')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        Salida de Stock
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
                        <Label htmlFor="stockId">Material y Almacén *</Label>
                        <Select value={formData.stockId} onValueChange={handleStockChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar material disponible" />
                            </SelectTrigger>
                            <SelectContent>
                                {stocks.map((stock) => (
                                    <SelectItem key={stock.id} value={stock.id}>
                                        {stock.material.name} ({stock.material.code || 'Sin código'}) - {stock.warehouse.name} - Disponible: {stock.available} {stock.material.unit}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity">Cantidad *</Label>
                        <Input
                            id="quantity"
                            type="number"
                            step="0.01"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            max={selectedStock?.available || undefined}
                            required
                        />
                        {selectedStock && (
                            <p className="text-sm text-gray-500">
                                Disponible: {selectedStock.available} {selectedStock.material.unit}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Referencia</Label>
                        <Input
                            id="reference"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="Número de orden, proyecto, etc."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Motivo de la salida, destino, etc."
                        />
                    </div>

                    {/* Campos de Destino */}
                    <div className="space-y-2">
                        <Label htmlFor="destType">Tipo de Destino (Opcional)</Label>
                        <Select
                            value={formData.destType}
                            onValueChange={(value) => setFormData({ ...formData, destType: value, destId: '', destName: '' })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo de destino" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CLIENT">Cliente</SelectItem>
                                <SelectItem value="PROVIDER">Proveedor</SelectItem>
                                <SelectItem value="CUSTOM">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.destType === 'CLIENT' && (
                        <div className="space-y-2">
                            <Label htmlFor="destId">Cliente Destino</Label>
                            <Select
                                value={formData.destId}
                                onValueChange={(value) => setFormData({ ...formData, destId: value })}
                            >
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

                    {formData.destType === 'PROVIDER' && (
                        <div className="space-y-2">
                            <Label htmlFor="destId">Proveedor Destino</Label>
                            <Select
                                value={formData.destId}
                                onValueChange={(value) => setFormData({ ...formData, destId: value })}
                            >
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

                    {formData.destType === 'CUSTOM' && (
                        <div className="space-y-2">
                            <Label htmlFor="destName">Nombre del Destino</Label>
                            <Input
                                id="destName"
                                value={formData.destName}
                                onChange={(e) => setFormData({ ...formData, destName: e.target.value })}
                                placeholder="Nombre del destino personalizado"
                            />
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrar Salida'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
