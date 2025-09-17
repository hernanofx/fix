'use client'

import { PencilIcon, EyeIcon, UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface ClientActionsModalProps {
    isOpen: boolean
    onClose: () => void
    client: any
    onEdit: (client: any) => void
    onViewDetails: (client: any) => void
    onConvertToProspect: (client: any) => void
    onDelete: (client: any) => void
}

export default function ClientActionsModal({
    isOpen,
    onClose,
    client,
    onEdit,
    onViewDetails,
    onConvertToProspect,
    onDelete
}: ClientActionsModalProps) {
    if (!isOpen || !client) return null

    const handleAction = (action: () => void) => {
        // close the actions modal first, then run the action so modal state updates don't overwrite each other
        onClose()
        action()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                                {(client.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                            <p className="text-sm text-gray-500">{client.email}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <div className="space-y-2">
                        <button
                            onClick={() => handleAction(() => onEdit(client))}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                            <PencilIcon className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <div className="font-medium">Editar Cliente</div>
                                <div className="text-sm text-gray-500">Modificar información del cliente</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleAction(() => onViewDetails(client))}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                        >
                            <EyeIcon className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <div className="font-medium">Ver Detalles CRM</div>
                                <div className="text-sm text-gray-500">Facturas, pagos y condiciones</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleAction(() => onConvertToProspect(client))}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                            <UserPlusIcon className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <div className="font-medium">Convertir a Prospecto</div>
                                <div className="text-sm text-gray-500">Cambiar estado a prospecto</div>
                            </div>
                        </button>

                        <div className="border-t border-gray-100 my-2"></div>

                        <button
                            onClick={() => handleAction(() => onDelete(client))}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <TrashIcon className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <div className="font-medium">Eliminar Cliente</div>
                                <div className="text-sm text-gray-500">Esta acción no se puede deshacer</div>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}
