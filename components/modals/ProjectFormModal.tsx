'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'

interface ProjectFormModalProps {
    isOpen: boolean
    onClose: () => void
    project?: any
    onSave: (projectData: any) => void
}

export default function ProjectFormModal({ isOpen, onClose, project, onSave }: ProjectFormModalProps) {
    const [formData, setFormData] = useState({
        name: project?.name || '',
        address: project?.address || '',
        city: project?.city || '',
        coordinates: project?.coordinates || '',
        status: project?.status || 'PLANNING',
        priority: project?.priority || 'MEDIUM',
        budget: project?.budget || '',
        startDate: project?.startDate || '',
        endDate: project?.endDate || '',
        description: project?.description || ''
    })

    // Keep form in sync when editing an existing project
    useEffect(() => {
        if (!project) return
        const fmtDate = (d: any) => {
            if (!d) return ''
            try {
                const dt = new Date(d)
                if (isNaN(dt.getTime())) return ''
                return dt.toISOString().slice(0, 10)
            } catch {
                return String(d).slice(0, 10)
            }
        }

        setFormData({
            name: project?.name || '',
            address: project?.address || '',
            city: project?.city || '',
            coordinates: project?.coordinates || '',
            status: project?.status || 'PLANNING',
            priority: project?.priority || 'MEDIUM',
            budget: project?.budget ?? '',
            startDate: fmtDate(project?.startDate),
            endDate: fmtDate(project?.endDate),
            description: project?.description || ''
        })
    }, [project])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({
            name: formData.name,
            description: formData.description,
            code: '', // Optional field
            status: formData.status,
            priority: formData.priority,
            startDate: formData.startDate,
            endDate: formData.endDate,
            budget: formData.budget ? parseFloat(formData.budget) : null,
            address: formData.address,
            city: formData.city,
            coordinates: formData.coordinates
        })
        onClose()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Nombre del Proyecto *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Ej: Residencial Los Álamos"
                        />
                    </div>

                    {/* Location removed per requirements */}

                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Dirección
                        </label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Calle, número, barrio"
                        />
                    </div>

                    <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                            Ciudad
                        </label>
                        <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Ej: Santiago"
                        />
                    </div>

                    <div>
                        <label htmlFor="coordinates" className="block text-sm font-medium text-gray-700">
                            Coordenadas
                        </label>
                        <input
                            type="text"
                            id="coordinates"
                            name="coordinates"
                            value={formData.coordinates}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="lat,lng"
                        />
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Estado</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="PLANNING">Planificación</option>
                            <option value="IN_PROGRESS">En Progreso</option>
                            <option value="ON_HOLD">En Espera</option>
                            <option value="COMPLETED">Completado</option>
                            <option value="CANCELLED">Cancelado</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Prioridad</label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="LOW">Baja</option>
                            <option value="MEDIUM">Media</option>
                            <option value="HIGH">Alta</option>
                            <option value="URGENT">Urgente</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                            Presupuesto (USD)
                        </label>
                        <input
                            type="number"
                            id="budget"
                            name="budget"
                            min="0"
                            step="0.01"
                            value={formData.budget}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                            Fecha de Inicio
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                            Fecha de Fin
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Descripción
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Descripción detallada del proyecto..."
                    />
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
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {project ? 'Actualizar Proyecto' : 'Crear Proyecto'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
