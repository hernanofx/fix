'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from 'next-auth/react'

interface Material {
    id: string
    name: string
    code: string | null
    unit: string
    minStock: number | null
    maxStock: number | null
    costPrice: number | null
    costCurrency: string | null
    salePrice: number | null
    saleCurrency: string | null
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
    rubroId: string | null
}

interface Rubro {
    id: string
    name: string
}

interface MaterialFormModalProps {
    material: Material | null
    onClose: () => void
    onSuccess: () => void
}

export default function MaterialFormModal({ material, onClose, onSuccess }: MaterialFormModalProps) {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [rubros, setRubros] = useState<Rubro[]>([])
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        unit: '',
        minStock: '',
        maxStock: '',
        costPrice: '',
        costCurrency: 'PESOS',
        salePrice: '',
        saleCurrency: 'PESOS',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
        rubroId: ''
    })

    useEffect(() => {
        if (material) {
            setFormData({
                name: material.name,
                code: material.code || '',
                unit: material.unit,
                minStock: material.minStock?.toString() || '',
                maxStock: material.maxStock?.toString() || '',
                costPrice: material.costPrice?.toString() || '',
                costCurrency: material.costCurrency || 'PESOS',
                salePrice: material.salePrice?.toString() || '',
                saleCurrency: material.saleCurrency || 'PESOS',
                status: material.status,
                rubroId: material.rubroId || 'none'
            })
        } else {
            // Reset form for new material
            setFormData({
                name: '',
                code: '',
                unit: '',
                minStock: '',
                maxStock: '',
                costPrice: '',
                costCurrency: 'PESOS',
                salePrice: '',
                saleCurrency: 'PESOS',
                status: 'ACTIVE',
                rubroId: 'none'
            })
        }
        fetchRubros()
    }, [material])

    const fetchRubros = async () => {
        try {
            const response = await fetch('/api/rubros')
            if (response.ok) {
                const data = await response.json()
                setRubros(data)
            }
        } catch (error) {
            console.error('Error fetching rubros:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const data = {
                ...formData,
                minStock: formData.minStock ? parseFloat(formData.minStock) : null,
                maxStock: formData.maxStock ? parseFloat(formData.maxStock) : null,
                costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
                costCurrency: formData.costCurrency,
                salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
                saleCurrency: formData.saleCurrency,
                rubroId: formData.rubroId || null
            }

            const url = material ? `/api/stock/materials/${material.id}` : '/api/stock/materials'
            const method = material ? 'PUT' : 'POST'

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
                alert(error.message || 'Error al guardar el material')
            }
        } catch (error) {
            console.error('Error saving material:', error)
            alert('Error al guardar el material')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        {material ? 'Editar Material' : 'Crear Nuevo Material'}
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unidad *</Label>
                            <Input
                                id="unit"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                placeholder="kg, m2, unidades, etc."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rubroId">Rubro</Label>
                            <Select value={formData.rubroId || "none"} onValueChange={(value) => setFormData({ ...formData, rubroId: value === "none" ? "" : value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rubro" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin rubro</SelectItem>
                                    {rubros.map((rubro) => (
                                        <SelectItem key={rubro.id} value={rubro.id}>
                                            {rubro.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="minStock">Stock Mínimo</Label>
                            <Input
                                id="minStock"
                                type="number"
                                step="0.01"
                                value={formData.minStock}
                                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxStock">Stock Máximo</Label>
                            <Input
                                id="maxStock"
                                type="number"
                                step="0.01"
                                value={formData.maxStock}
                                onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Activo</SelectItem>
                                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                    <SelectItem value="ARCHIVED">Archivado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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

                        <div className="space-y-2">
                            <Label htmlFor="costCurrency">Moneda Costo</Label>
                            <Select value={formData.costCurrency} onValueChange={(value) => setFormData({ ...formData, costCurrency: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PESOS">PESOS</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="salePrice">Precio Venta</Label>
                            <Input
                                id="salePrice"
                                type="number"
                                step="0.01"
                                value={formData.salePrice}
                                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="saleCurrency">Moneda Venta</Label>
                            <Select value={formData.saleCurrency} onValueChange={(value) => setFormData({ ...formData, saleCurrency: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PESOS">PESOS</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : (material ? 'Actualizar' : 'Crear')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
