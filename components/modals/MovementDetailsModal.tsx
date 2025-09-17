'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { ArrowDown, ArrowUp, ArrowRightLeft } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface MovementDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    movement: any
}

export default function MovementDetailsModal({ isOpen, onClose, movement }: MovementDetailsModalProps) {
    const [clients, setClients] = useState<{ [key: string]: string }>({})
    const [providers, setProviders] = useState<{ [key: string]: string }>({})
    const [dataLoading, setDataLoading] = useState(false)
    const { data: session } = useSession()

    useEffect(() => {
        if (isOpen && session?.user?.organizationId && movement) {
            console.log('MovementDetailsModal - Opening modal with movement:', movement)
            fetchClientsAndProviders()
        }
    }, [isOpen, session, movement])

    // Si no está abierto o no hay movimiento, no renderizar nada
    if (!isOpen) {
        return null
    }

    // Si no hay movimiento, mostrar mensaje de carga
    if (!movement) {
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4">
                    <div className="text-center">Cargando detalles del movimiento...</div>
                </div>
            </div>
        )
    }

    // Verificar que el movement tenga la estructura mínima requerida
    if (!movement.id || !movement.type) {
        console.error('MovementDetailsModal - Movement data incomplete:', movement)
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4">
                    <div className="text-center text-red-600">
                        Error: Datos del movimiento incompletos
                    </div>
                </div>
            </div>
        )
    }

    // Debug: verificar la estructura del movement
    console.log('MovementDetailsModal - Rendering with movement:', movement)

    const fetchClientsAndProviders = async () => {
        if (!session?.user?.organizationId) {
            console.error('MovementDetailsModal - No organization ID available')
            return
        }

        setDataLoading(true)
        try {
            console.log('MovementDetailsModal - Fetching clients and providers...')

            const [clientsRes, providersRes] = await Promise.all([
                fetch(`/api/clients?organizationId=${session.user.organizationId}`),
                fetch(`/api/providers?organizationId=${session.user.organizationId}`)
            ])

            if (clientsRes.ok) {
                const clientsData = await clientsRes.json()
                console.log('MovementDetailsModal - Clients loaded:', clientsData.length)
                const clientsMap: { [key: string]: string } = {}
                clientsData.forEach((client: any) => {
                    clientsMap[client.id] = client.name
                })
                setClients(clientsMap)
                console.log('MovementDetailsModal - Clients map created:', Object.keys(clientsMap).length, 'entries')
            } else {
                console.error('MovementDetailsModal - Failed to fetch clients:', clientsRes.status)
            }

            if (providersRes.ok) {
                const providersData = await providersRes.json()
                console.log('MovementDetailsModal - Providers loaded:', providersData.length)
                const providersMap: { [key: string]: string } = {}
                providersData.forEach((provider: any) => {
                    providersMap[provider.id] = provider.name
                })
                setProviders(providersMap)
                console.log('MovementDetailsModal - Providers map created:', Object.keys(providersMap).length, 'entries')
            } else {
                console.error('MovementDetailsModal - Failed to fetch providers:', providersRes.status)
            }
        } catch (error) {
            console.error('MovementDetailsModal - Error fetching clients and providers:', error)
        } finally {
            setDataLoading(false)
        }
    }

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'ENTRADA':
                return <ArrowDown className="h-6 w-6 text-green-600" />
            case 'SALIDA':
                return <ArrowUp className="h-6 w-6 text-red-600" />
            case 'TRANSFERENCIA':
                return <ArrowRightLeft className="h-6 w-6 text-blue-600" />
            default:
                return null
        }
    }

    const getMovementBadge = (type: string) => {
        switch (type) {
            case 'ENTRADA':
                return <Badge variant="default" className="bg-green-100 text-green-800">Entrada</Badge>
            case 'SALIDA':
                return <Badge variant="destructive">Salida</Badge>
            case 'TRANSFERENCIA':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Transferencia</Badge>
            default:
                return <Badge variant="secondary">{type}</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getOriginName = () => {
        if (!movement) return '-'

        if (movement.originType === 'CUSTOM' && movement.originName) {
            return movement.originName
        }
        if (movement.originType === 'CLIENT' && movement.originId) {
            const clientName = clients[movement.originId]
            if (clientName) {
                return `Cliente: ${clientName}`
            }
            return dataLoading ? 'Cargando cliente...' : `Cliente (ID: ${movement.originId})`
        }
        if (movement.originType === 'PROVIDER' && movement.originId) {
            const providerName = providers[movement.originId]
            if (providerName) {
                return `Proveedor: ${providerName}`
            }
            return dataLoading ? 'Cargando proveedor...' : `Proveedor (ID: ${movement.originId})`
        }
        return movement.fromWarehouse?.name || '-'
    }

    const getDestName = () => {
        if (!movement) return '-'

        if (movement.destType === 'CUSTOM' && movement.destName) {
            return movement.destName
        }
        if (movement.destType === 'CLIENT' && movement.destId) {
            const clientName = clients[movement.destId]
            if (clientName) {
                return `Cliente: ${clientName}`
            }
            return dataLoading ? 'Cargando cliente...' : `Cliente (ID: ${movement.destId})`
        }
        if (movement.destType === 'PROVIDER' && movement.destId) {
            const providerName = providers[movement.destId]
            if (providerName) {
                return `Proveedor: ${providerName}`
            }
            return dataLoading ? 'Cargando proveedor...' : `Proveedor (ID: ${movement.destId})`
        }
        return movement.toWarehouse?.name || '-'
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        {getMovementIcon(movement.type)}
                        Detalles del Movimiento
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

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Tipo</label>
                            <div className="mt-1">{movement?.type ? getMovementBadge(movement.type) : '-'}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Fecha</label>
                            <div className="mt-1 text-sm">{movement?.date ? formatDate(movement.date) : '-'}</div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500">Material</label>
                        <div className="mt-1">
                            <div className="font-medium">{movement?.material?.name || '-'}</div>
                            {movement?.material?.code && (
                                <div className="text-sm text-gray-500">Código: {movement.material.code}</div>
                            )}
                            {movement?.material?.unit && (
                                <div className="text-sm text-gray-500">Unidad: {movement.material.unit}</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Cantidad</label>
                            <div className="mt-1 font-medium">
                                {movement?.quantity || '-'} {movement?.material?.unit || ''}
                            </div>
                        </div>
                        {movement?.reference && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Referencia</label>
                                <div className="mt-1 text-sm">{movement.reference}</div>
                            </div>
                        )}
                    </div>

                    {movement?.description && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Descripción</label>
                            <div className="mt-1 text-sm">{movement.description}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {movement?.fromWarehouse && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Almacén Origen</label>
                                <div className="mt-1">
                                    <div className="font-medium">{movement.fromWarehouse.name}</div>
                                    {movement.fromWarehouse.code && (
                                        <div className="text-sm text-gray-500">Código: {movement.fromWarehouse.code}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {movement?.toWarehouse && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Almacén Destino</label>
                                <div className="mt-1">
                                    <div className="font-medium">{movement.toWarehouse.name}</div>
                                    {movement.toWarehouse.code && (
                                        <div className="text-sm text-gray-500">Código: {movement.toWarehouse.code}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {(movement?.originName || movement?.originId || movement?.originType) && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Origen</label>
                            <div className="mt-1 text-sm">
                                {getOriginName()}
                            </div>
                        </div>
                    )}

                    {(movement?.destName || movement?.destId || movement?.destType) && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Destino</label>
                            <div className="mt-1 text-sm">
                                {getDestName()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
