import { useState, useEffect } from 'react'
import { XMarkIcon, ChatBubbleLeftRightIcon, EnvelopeIcon, PhoneIcon, UsersIcon, DevicePhoneMobileIcon, LinkIcon, DocumentIcon } from '@heroicons/react/24/outline'

interface CommunicationFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (communicationData: any) => void
    prospectId: string
    communication?: any
}

export default function CommunicationFormModal({ isOpen, onClose, onSave, prospectId, communication }: CommunicationFormModalProps) {
    const [formData, setFormData] = useState({
        type: 'EMAIL',
        direction: 'OUTBOUND',
        subject: '',
        content: '',
        duration: '',
        status: 'SENT'
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Populate form when editing
    useEffect(() => {
        if (communication) {
            setFormData({
                type: communication.type || 'EMAIL',
                direction: communication.direction || 'OUTBOUND',
                subject: communication.subject || '',
                content: communication.content || '',
                duration: communication.duration ? communication.duration.toString() : '',
                status: communication.status || 'SENT'
            })
        } else {
            setFormData({
                type: 'EMAIL',
                direction: 'OUTBOUND',
                subject: '',
                content: '',
                duration: '',
                status: 'SENT'
            })
        }
    }, [communication, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const communicationData: any = {
                ...formData,
                duration: formData.duration ? parseInt(formData.duration) : undefined,
                subject: formData.subject || undefined,
                content: formData.content || undefined
            }

            // Remove undefined values
            Object.keys(communicationData).forEach(key => {
                if (communicationData[key] === undefined) {
                    delete communicationData[key]
                }
            })

            const method = communication ? 'PUT' : 'POST'
            const url = communication
                ? `/api/clients/prospects/${prospectId}/communications/${communication.id}`
                : `/api/clients/prospects/${prospectId}/communications`

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(communicationData)
            })

            if (response.ok) {
                const savedCommunication = await response.json()
                onSave(savedCommunication)
                onClose()
                // Reset form
                setFormData({
                    type: 'EMAIL',
                    direction: 'OUTBOUND',
                    subject: '',
                    content: '',
                    duration: '',
                    status: 'SENT'
                })
            } else {
                console.error('Error saving communication')
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gray-100 rounded-xl">
                            <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{communication ? 'Editar Comunicación' : 'Nueva Comunicación'}</h2>
                            <p className="text-sm text-gray-600">{communication ? 'Modifica los detalles de la comunicación' : 'Registra una nueva interacción con el prospecto'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Tipo de Comunicación
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                            >
                                <option value="EMAIL">Correo Electrónico</option>
                                <option value="CALL">Llamada Telefónica</option>
                                <option value="MEETING">Reunión</option>
                                <option value="WHATSAPP">WhatsApp</option>
                                <option value="LINKEDIN">LinkedIn</option>
                                <option value="OTHER">Otro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Dirección
                            </label>
                            <select
                                value={formData.direction}
                                onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                            >
                                <option value="INBOUND">Entrante</option>
                                <option value="OUTBOUND">Saliente</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Asunto
                        </label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                            placeholder="Asunto de la comunicación..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Contenido
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
                            placeholder="Describe el contenido de la comunicación..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {formData.type === 'CALL' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Duración (minutos)
                                </label>
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
                                    placeholder="15"
                                    min="0"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Estado
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                            >
                                <option value="SENT">Enviado</option>
                                <option value="RECEIVED">Recibido</option>
                                <option value="MISSED">Perdido</option>
                                <option value="VOICEMAIL">Buzón</option>
                                <option value="SCHEDULED">Programado</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Guardando...
                                </div>
                            ) : (
                                communication ? 'Actualizar Comunicación' : 'Guardar Comunicación'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
