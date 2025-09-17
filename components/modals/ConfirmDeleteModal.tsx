'use client'

import Modal from './Modal'

interface ConfirmDeleteModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    itemName?: string
}

export default function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    itemName
}: ConfirmDeleteModalProps) {
    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
        >
            <div className="space-y-4">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    </div>
                    <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">
                            {message}
                        </h3>
                        {itemName && (
                            <p className="text-sm text-gray-500 mt-1">
                                {itemName}
                            </p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                            Esta acción no se puede deshacer.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </Modal>
    )
}
