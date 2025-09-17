'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ToastProvider'

interface MovementFormModalProps {
    isOpen: boolean
    onClose: () => void
    movement?: any
    onSuccess: () => void
}

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

export default function MovementFormModal({ isOpen, onClose, movement, onSuccess }: MovementFormModalProps) {
    const [loading, setLoading] = useState(false)
    const [dataLoading, setDataLoading] = useState(false)
    const [materials, setMaterials] = useState<Material[]>([])
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [providers, setProviders] = useState<any[]>([])
    const { data: session } = useSession()
    const toast = useToast()

    const [formData, setFormData] = useState({
        type: 'ENTRADA',
        materialId: '',
        fromWarehouseId: null as string | null,
        toWarehouseId: null as string | null,
        quantity: '',
        description: '',
        reference: '',
        costPrice: '',
        originType: 'CUSTOM',
        originId: null as string | null,
        originName: '',
        destType: 'CUSTOM',
        destId: null as string | null,
        destName: ''
    })

    useEffect(() => {
        if (isOpen && session?.user?.organizationId) {
            console.log('MovementFormModal opened, movement:', movement)
            fetchAllData()
        }
    }, [isOpen, session])

    // Si no está abierto, no renderizar nada
    if (!isOpen) {
        return null
    }

    // Si estamos editando pero no hay movimiento, mostrar mensaje de carga
    if (movement && !movement.id) {
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4">
                    <div className="text-center">Cargando datos del movimiento...</div>
                </div>
            </div>
        )
    }

    const fetchAllData = async () => {
        setDataLoading(true)
        try {
            console.log('Fetching all data for form...')

            const [materialsRes, warehousesRes, clientsRes, providersRes] = await Promise.all([
                fetch('/api/stock/materials'),
                fetch('/api/stock/warehouses'),
                fetch(`/api/clients?organizationId=${session?.user?.organizationId}`),
                fetch(`/api/providers?organizationId=${session?.user?.organizationId}`)
            ])

            if (materialsRes.ok) {
                const materialsData = await materialsRes.json()
                console.log('Materials loaded:', materialsData.length)
                setMaterials(materialsData)
            }

            if (warehousesRes.ok) {
                const warehousesData = await warehousesRes.json()
                console.log('Warehouses loaded:', warehousesData.length)
                setWarehouses(warehousesData)
            }

            if (clientsRes.ok) {
                const clientsData = await clientsRes.json()
                console.log('Clients loaded:', clientsData.length)
                setClients(clientsData)
            }

            if (providersRes.ok) {
                const providersData = await providersRes.json()
                console.log('Providers loaded:', providersData.length)
                setProviders(providersData)
            }

            // Una vez que todos los datos están cargados, configurar el formulario
            if (movement) {
                console.log('Setting form data for existing movement:', movement)
                setFormData({
                    type: movement.type || 'ENTRADA',
                    materialId: movement.material?.id || movement.materialId || '',
                    fromWarehouseId: movement.fromWarehouse?.id || movement.fromWarehouseId || null,
                    toWarehouseId: movement.toWarehouse?.id || movement.toWarehouseId || null,
                    quantity: movement.quantity ? movement.quantity.toString() : '',
                    description: movement.description || '',
                    reference: movement.reference || '',
                    costPrice: movement.material?.costPrice ? movement.material.costPrice.toString() : '',
                    originType: movement.originType || 'CUSTOM',
                    originId: movement.originId || null,
                    originName: movement.originName || '',
                    destType: movement.destType || 'CUSTOM',
                    destId: movement.destId || null,
                    destName: movement.destName || ''
                })
            } else {
                console.log('Setting form data for new movement')
                setFormData({
                    type: 'ENTRADA',
                    materialId: '',
                    fromWarehouseId: null,
                    toWarehouseId: null,
                    quantity: '',
                    description: '',
                    reference: '',
                    costPrice: '',
                    originType: 'CUSTOM',
                    originId: null,
                    originName: '',
                    destType: 'CUSTOM',
                    destId: null,
                    destName: ''
                })
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setDataLoading(false)
        }
    }

    // Mostrar loading mientras se cargan los datos
    if (dataLoading) {
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p>Cargando datos del formulario...</p>
                    </div>
                </div>
            </div>
        )
    }

    const handleTypeChange = (type: string) => {
        setFormData(prev => ({
            ...prev,
            type,
            // Limpiar almacenes según el tipo de movimiento
            fromWarehouseId: type === 'ENTRADA' ? null : prev.fromWarehouseId,
            toWarehouseId: type === 'SALIDA' ? null : prev.toWarehouseId
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const data: any = {
                ...formData,
                quantity: parseFloat(formData.quantity)
            }

            // Solo incluir costPrice si es una entrada y tiene valor
            if (formData.type === 'ENTRADA' && formData.costPrice) {
                data.costPrice = parseFloat(formData.costPrice)
            }

            if (movement) {
                data.id = movement.id
            }

            console.log('Submitting data:', data)

            const response = await fetch('/api/stock/movements', {
                method: movement ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (response.ok) {
                toast.success(movement ? 'Movimiento actualizado exitosamente' : 'Movimiento creado exitosamente')
                onSuccess()
                onClose()
            } else {
                const error = await response.json()
                console.error('API Error:', error)
                toast.error(error.message || 'Error al guardar el movimiento')
            }
        } catch (error) {
            console.error('Error saving movement:', error)
            toast.error('Error al guardar el movimiento')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        {movement ? 'Editar Movimiento' : 'Nuevo Movimiento'}
                    </h3>
                    <div className="flex items-center gap-2">
                        {dataLoading && (
                            <span className="text-sm text-blue-600">Cargando datos...</span>
                        )}
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
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="type">Tipo de Movimiento</Label>
                            <Select value={formData.type} onValueChange={handleTypeChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ENTRADA">Entrada</SelectItem>
                                    <SelectItem value="SALIDA">Salida</SelectItem>
                                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                </SelectContent>
                            </Select>
                            {movement && <div className="text-xs text-gray-500 mt-1">Actual: {movement.type}</div>}
                        </div>

                        <div>
                            <Label htmlFor="materialId">Material</Label>
                            <Select value={formData.materialId} onValueChange={(value) => setFormData(prev => ({ ...prev, materialId: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar material" />
                                </SelectTrigger>
                                <SelectContent>
                                    {materials.map((material) => (
                                        <SelectItem key={material.id} value={material.id}>
                                            {material.name} {material.code && `(${material.code})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {movement && <div className="text-xs text-gray-500 mt-1">Actual: {movement.material?.name}</div>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {formData.type !== 'ENTRADA' && (
                            <div>
                                <Label htmlFor="fromWarehouseId">Almacén Origen</Label>
                                <Select value={formData.fromWarehouseId || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, fromWarehouseId: value || null }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar almacén" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name} {warehouse.code && `(${warehouse.code})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {movement && <div className="text-xs text-gray-500 mt-1">Actual: {movement.fromWarehouse?.name}</div>}
                            </div>
                        )}

                        {formData.type !== 'SALIDA' && (
                            <div>
                                <Label htmlFor="toWarehouseId">Almacén Destino</Label>
                                <Select value={formData.toWarehouseId || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, toWarehouseId: value || null }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar almacén" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name} {warehouse.code && `(${warehouse.code})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {movement && <div className="text-xs text-gray-500 mt-1">Actual: {movement.toWarehouse?.name}</div>}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="quantity">Cantidad</Label>
                            <Input
                                id="quantity"
                                type="number"
                                step="0.01"
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                required
                            />
                            {movement && <div className="text-xs text-gray-500 mt-1">Actual: {movement.quantity}</div>}
                        </div>

                        {formData.type === 'ENTRADA' && (
                            <div>
                                <Label htmlFor="costPrice">Precio Costo (opcional)</Label>
                                <Input
                                    id="costPrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.costPrice}
                                    onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                                />
                                {movement && movement.material?.costPrice && <div className="text-xs text-gray-500 mt-1">Actual: ${movement.material.costPrice}</div>}
                            </div>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                        />
                        {movement && movement.description && <div className="text-xs text-gray-500 mt-1">Actual: {movement.description}</div>}
                    </div>

                    <div>
                        <Label htmlFor="reference">Referencia</Label>
                        <Input
                            id="reference"
                            value={formData.reference}
                            onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                        />
                        {movement && movement.reference && <div className="text-xs text-gray-500 mt-1">Actual: {movement.reference}</div>}
                    </div>

                    {/* Origin section */}
                    <div className="space-y-2">
                        <Label>Origen</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <Select value={formData.originType} onValueChange={(value) => setFormData(prev => ({ ...prev, originType: value, originId: null, originName: '' }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CUSTOM">Personalizado</SelectItem>
                                    <SelectItem value="CLIENT">Cliente</SelectItem>
                                    <SelectItem value="PROVIDER">Proveedor</SelectItem>
                                </SelectContent>
                            </Select>

                            {formData.originType === 'CUSTOM' ? (
                                <Input
                                    placeholder="Nombre del origen"
                                    value={formData.originName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, originName: e.target.value }))}
                                />
                            ) : (
                                <Select value={formData.originId || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, originId: value || null }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(formData.originType === 'CLIENT' ? clients : providers).map((item: any) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        {movement && (
                            <div className="text-xs text-gray-500 mt-1">
                                Actual: {movement.originType === 'CUSTOM' ? movement.originName :
                                    movement.originType === 'CLIENT' ? `Cliente: ${clients.find(c => c.id === movement.originId)?.name || movement.originId}` :
                                        movement.originType === 'PROVIDER' ? `Proveedor: ${providers.find(p => p.id === movement.originId)?.name || movement.originId}` :
                                            'No definido'}
                            </div>
                        )}
                    </div>

                    {/* Destination section */}
                    <div className="space-y-2">
                        <Label>Destino</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <Select value={formData.destType} onValueChange={(value) => setFormData(prev => ({ ...prev, destType: value, destId: null, destName: '' }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CUSTOM">Personalizado</SelectItem>
                                    <SelectItem value="CLIENT">Cliente</SelectItem>
                                    <SelectItem value="PROVIDER">Proveedor</SelectItem>
                                </SelectContent>
                            </Select>

                            {formData.destType === 'CUSTOM' ? (
                                <Input
                                    placeholder="Nombre del destino"
                                    value={formData.destName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, destName: e.target.value }))}
                                />
                            ) : (
                                <Select value={formData.destId || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, destId: value || null }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(formData.destType === 'CLIENT' ? clients : providers).map((item: any) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        {movement && (
                            <div className="text-xs text-gray-500 mt-1">
                                Actual: {movement.destType === 'CUSTOM' ? movement.destName :
                                    movement.destType === 'CLIENT' ? `Cliente: ${clients.find(c => c.id === movement.destId)?.name || movement.destId}` :
                                        movement.destType === 'PROVIDER' ? `Proveedor: ${providers.find(p => p.id === movement.destId)?.name || movement.destId}` :
                                            'No definido'}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : (movement ? 'Actualizar' : 'Crear')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
