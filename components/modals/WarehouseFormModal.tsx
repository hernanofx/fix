'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Warehouse {
    id: string
    name: string
    code: string | null
    address: string | null
    description: string | null
    isActive: boolean
}

interface WarehouseFormModalProps {
    warehouse: Warehouse | null
    onClose: () => void
    onSuccess: () => void
}

export default function WarehouseFormModal({ warehouse, onClose, onSuccess }: WarehouseFormModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        description: '',
        isActive: true
    })

    useEffect(() => {
        if (warehouse) {
            setFormData({
                name: warehouse.name,
                code: warehouse.code || '',
                address: warehouse.address || '',
                description: warehouse.description || '',
                isActive: warehouse.isActive
            })
        }
    }, [warehouse])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const data = {
                ...formData,
                code: formData.code || null,
                address: formData.address || null,
                description: formData.description || null
            }

            const url = warehouse ? `/api/stock/warehouses/${warehouse.id}` : '/api/stock/warehouses'
            const method = warehouse ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (response.ok) {
                onSuccess()
            } else {
                const error = await response.json()
                alert(error.message || 'Error al guardar el almacén')
            }
        } catch (error) {
            console.error('Error saving warehouse:', error)
            alert('Error al guardar el almacén')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        {warehouse ? 'Editar Almacén' : 'Crear Nuevo Almacén'}
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">Código</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <Label htmlFor="isActive">Almacén activo</Label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : (warehouse ? 'Actualizar' : 'Crear')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
