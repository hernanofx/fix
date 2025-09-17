import { useState, useEffect } from 'react'
import { XMarkIcon, DocumentTextIcon, UserIcon, ExclamationTriangleIcon, BuildingOfficeIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline'

interface NoteFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (noteData: any) => void
    prospectId: string
    note?: any
}

export default function NoteFormModal({ isOpen, onClose, onSave, prospectId, note }: NoteFormModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'GENERAL',
        isPrivate: false
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Populate form when editing
    useEffect(() => {
        if (note) {
            setFormData({
                title: note.title || '',
                content: note.content || '',
                type: note.type || 'GENERAL',
                isPrivate: note.isPrivate || false
            })
        } else {
            setFormData({
                title: '',
                content: '',
                type: 'GENERAL',
                isPrivate: false
            })
        }
    }, [note, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const noteData: any = {
                ...formData,
                title: formData.title || undefined
            }

            // Remove undefined values
            Object.keys(noteData).forEach(key => {
                if (noteData[key] === undefined) {
                    delete noteData[key]
                }
            })

            const method = note ? 'PUT' : 'POST'
            const url = note
                ? `/api/clients/prospects/${prospectId}/notes/${note.id}`
                : `/api/clients/prospects/${prospectId}/notes`

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            })

            if (response.ok) {
                const savedNote = await response.json()
                onSave(savedNote)
                onClose()
                // Reset form
                setFormData({
                    title: '',
                    content: '',
                    type: 'GENERAL',
                    isPrivate: false
                })
            } else {
                console.error('Error saving note')
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
                            <DocumentTextIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{note ? 'Editar Nota' : 'Nueva Nota'}</h2>
                            <p className="text-sm text-gray-600">{note ? 'Modifica el contenido de la nota' : 'Registra información importante sobre este prospecto'}</p>
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
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Título de la Nota
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                            placeholder="Título opcional para la nota..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Contenido de la Nota *
                        </label>
                        <textarea
                            required
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
                            placeholder="Escribe los detalles importantes que quieres recordar..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Tipo de Nota
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                            >
                                <option value="GENERAL">General</option>
                                <option value="FOLLOW_UP">Seguimiento</option>
                                <option value="DECISION_MAKER">Tomador de Decisión</option>
                                <option value="OBJECTION">Objeción</option>
                                <option value="COMPETITION">Competencia</option>
                                <option value="BUDGET">Presupuesto</option>
                                <option value="TIMELINE">Plazo</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl w-full">
                                <input
                                    type="checkbox"
                                    id="isPrivate"
                                    checked={formData.isPrivate}
                                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <div>
                                    <label htmlFor="isPrivate" className="text-sm font-bold text-gray-700 cursor-pointer">
                                        Nota Privada
                                    </label>
                                    <p className="text-xs text-gray-500">Solo visible para ti</p>
                                </div>
                            </div>
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
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Guardando...
                                </div>
                            ) : (
                                note ? 'Actualizar Nota' : 'Guardar Nota'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
