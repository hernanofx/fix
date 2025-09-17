import { useState, useEffect } from 'react'
import { XMarkIcon, CalendarIcon, PhoneIcon, UsersIcon, EnvelopeIcon, CheckCircleIcon, ArrowRightIcon, CurrencyDollarIcon, MapPinIcon } from '@heroicons/react/24/outline'

interface ActivityFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (activityData: any) => void
    prospectId: string
    activity?: any
}

export default function ActivityFormModal({ isOpen, onClose, onSave, prospectId, activity }: ActivityFormModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'CALL',
        priority: 'MEDIUM',
        dueDate: '',
        assignedToId: ''
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Populate form when editing
    useEffect(() => {
        if (activity) {
            setFormData({
                title: activity.title || '',
                description: activity.description || '',
                type: activity.type || 'CALL',
                priority: activity.priority || 'MEDIUM',
                dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString().slice(0, 16) : '',
                assignedToId: activity.assignedToId || ''
            })
        } else {
            setFormData({
                title: '',
                description: '',
                type: 'CALL',
                priority: 'MEDIUM',
                dueDate: '',
                assignedToId: ''
            })
        }
    }, [activity, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const activityData: any = {
                ...formData,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                assignedToId: formData.assignedToId || undefined,
                status: 'PENDING' // Default status for new activities
            }

            // Remove undefined values
            Object.keys(activityData).forEach(key => {
                if (activityData[key] === undefined) {
                    delete activityData[key]
                }
            })

            const method = activity ? 'PUT' : 'POST'
            const url = activity
                ? `/api/clients/prospects/${prospectId}/activities/${activity.id}`
                : `/api/clients/prospects/${prospectId}/activities`

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activityData)
            })

            if (response.ok) {
                const savedActivity = await response.json()
                onSave(savedActivity)
                onClose()
                // Reset form
                setFormData({
                    title: '',
                    description: '',
                    type: 'CALL',
                    priority: 'MEDIUM',
                    dueDate: '',
                    assignedToId: ''
                })
            } else {
                console.error('Error saving activity')
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
                            <CalendarIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{activity ? 'Editar Actividad' : 'Nueva Actividad'}</h2>
                            <p className="text-sm text-gray-600">{activity ? 'Modifica los detalles de la actividad' : 'Programa una nueva actividad para este prospecto'}</p>
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
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Título de la Actividad *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                                placeholder="Ej: Llamada de seguimiento, Reunión presencial..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Descripción
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
                                placeholder="Describe los detalles de la actividad..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Tipo de Actividad
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                            >
                                <option value="CALL">Llamada Telefónica</option>
                                <option value="MEETING">Reunión Presencial</option>
                                <option value="EMAIL">Correo Electrónico</option>
                                <option value="TASK">Tarea</option>
                                <option value="FOLLOW_UP">Seguimiento</option>
                                <option value="SEND_QUOTE">Enviar Cotización</option>
                                <option value="SITE_VISIT">Visita al Sitio</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Prioridad
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                            >
                                <option value="LOW">Baja</option>
                                <option value="MEDIUM">Media</option>
                                <option value="HIGH">Alta</option>
                                <option value="URGENT">Urgente</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Fecha de Vencimiento
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                            />
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
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Guardando...
                                </div>
                            ) : (
                                activity ? 'Actualizar Actividad' : 'Guardar Actividad'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
