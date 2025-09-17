'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'

interface RubroFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (rubroData: any) => void
    rubro: any
    readOnly?: boolean
}

export default function RubroFormModal({ isOpen, onClose, onSave, rubro, readOnly = false }: RubroFormModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        code: '',
        color: '#3B82F6',
        type: 'PROVIDER',
        status: 'ACTIVE'
    })

    useEffect(() => {
        if (rubro) {
            setFormData({
                name: rubro.name || '',
                description: rubro.description || '',
                code: rubro.code || '',
                color: rubro.color || '#3B82F6',
                type: rubro.type || 'PROVIDER',
                status: rubro.status || 'ACTIVE'
            })
        } else {
            setFormData({
                name: '',
                description: '',
                code: '',
                color: '#3B82F6',
                type: 'PROVIDER',
                status: 'ACTIVE'
            })
        }
    }, [rubro, isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (readOnly) return

        const rubroData = {
            ...formData
        }
        onSave(rubroData)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const colorOptions = [
        '#3B82F6', // Blue
        '#EF4444', // Red
        '#10B981', // Green
        '#F59E0B', // Yellow
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#6B7280', // Gray
        '#F97316', // Orange
    ]

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={rubro ? (readOnly ? 'Ver Rubro' : 'Editar Rubro') : 'Nuevo Rubro'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Nombre del Rubro *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            readOnly={readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Ej: Materiales de Construcción"
                        />
                    </div>

                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                            Código
                        </label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            readOnly={readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Ej: MAT001"
                        />
                        <p className="text-xs text-gray-500 mt-1">Código único opcional para identificar el rubro</p>
                    </div>

                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                            Tipo *
                        </label>
                        <select
                            id="type"
                            name="type"
                            required
                            value={formData.type}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="PROVIDER">Proveedor</option>
                            <option value="CLIENT">Cliente</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Tipo de rubro para clasificar facturas</p>
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Estado
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="ACTIVE">Activo</option>
                            <option value="INACTIVE">Inactivo</option>
                            <option value="ARCHIVED">Archivado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Color
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                            <input
                                type="color"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                className={`w-12 h-10 border border-gray-300 rounded cursor-pointer ${readOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                                disabled={readOnly}
                            />
                            <div className="flex gap-1">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => !readOnly && setFormData(prev => ({ ...prev, color }))}
                                        className={`w-6 h-6 rounded-full border-2 ${formData.color === color ? 'border-gray-800' : 'border-gray-300'} ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 transition-transform'}`}
                                        style={{ backgroundColor: color }}
                                        disabled={readOnly}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Descripción
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        readOnly={readOnly}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Descripción detallada del rubro..."
                    />
                </div>

                {!readOnly && (
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {rubro ? 'Actualizar Rubro' : 'Crear Rubro'}
                        </button>
                    </div>
                )}
            </form>
        </Modal>
    )
}
