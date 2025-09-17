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

interface StockTransferModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function StockTransferModal({ onClose, onSuccess }: StockTransferModalProps) {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [stocks, setStocks] = useState<StockItem[]>([])
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [selectedStock, setSelectedStock] = useState<StockItem | null>(null)
    const [formData, setFormData] = useState({
        stockId: '',
        toWarehouseId: '',
        quantity: '',
        description: '',
        reference: ''
    })

    useEffect(() => {
        fetchStocks()
        fetchWarehouses()
    }, [])

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

    const handleStockChange = (stockId: string) => {
        const stock = stocks.find(s => s.id === stockId)
        setSelectedStock(stock || null)
        setFormData({ ...formData, stockId, toWarehouseId: '', quantity: '' })
    }

    const handleToWarehouseChange = (toWarehouseId: string) => {
        setFormData({ ...formData, toWarehouseId })
    }

    const availableWarehouses = warehouses.filter(w =>
        selectedStock && w.id !== selectedStock.warehouse.id
    )

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

            if (formData.toWarehouseId === selectedStock?.warehouse.id) {
                alert('El almacén de destino debe ser diferente al de origen')
                setLoading(false)
                return
            }

            const data = {
                type: 'TRANSFERENCIA',
                materialId: selectedStock?.material.id,
                fromWarehouseId: selectedStock?.warehouse.id,
                toWarehouseId: formData.toWarehouseId,
                quantity: quantity,
                description: formData.description,
                reference: formData.reference
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
                alert(error.message || 'Error al registrar transferencia')
            }
        } catch (error) {
            console.error('Error creating stock transfer:', error)
            alert('Error al registrar transferencia')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        Transferencia de Stock
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
                        <Label htmlFor="stockId">Material y Almacén Origen *</Label>
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
                        <Label htmlFor="toWarehouseId">Almacén de Destino *</Label>
                        <Select
                            value={formData.toWarehouseId}
                            onValueChange={handleToWarehouseChange}
                            disabled={!selectedStock}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar almacén destino" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableWarehouses.map((warehouse) => (
                                    <SelectItem key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name} {warehouse.code ? `(${warehouse.code})` : ''}
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
                            placeholder="Número de orden, solicitud, etc."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Motivo de la transferencia"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrar Transferencia'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
