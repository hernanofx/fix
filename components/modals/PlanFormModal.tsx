'use client'

import { useState, useEffect } from 'react'
import { useToast } from '../ToastProvider'
import { useSession } from 'next-auth/react'

interface PlanFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (planData: any) => void
    plan: any
}

export default function PlanFormModal({ isOpen, onClose, onSave, plan }: PlanFormModalProps) {
    const toast = useToast()
    const { data: session } = useSession()
    const [projects, setProjects] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: '',
        project: '',
        type: 'ARQUITECTONICO',
        version: 'v1.0',
        status: 'DRAFT',
        description: '',
        file: null as File | null
    })

    const loadProjects = async () => {
        if (!session?.user?.organizationId) return

        try {
            const res = await fetch(`/api/projects?organizationId=${session.user.organizationId}`)
            if (res.ok) {
                const data = await res.json()
                setProjects(data)
            }
        } catch (error) {
            console.error('Error loading projects:', error)
        }
    }

    useEffect(() => {
        if (isOpen) {
            loadProjects()
        }
    }, [isOpen])

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name || '',
                project: plan.projectId || '',
                type: plan.type || 'ARQUITECTONICO',
                version: plan.version || 'v1.0',
                status: plan.status || 'DRAFT',
                description: plan.description || '',
                file: null
            })
        } else {
            setFormData({
                name: '',
                project: '',
                type: 'ARQUITECTONICO',
                version: 'v1.0',
                status: 'DRAFT',
                description: '',
                file: null
            })
        }
    }, [plan, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Solo requerir archivo si es creación nueva
        if (!plan && !formData.file) {
            toast.error('Por favor selecciona un archivo')
            return
        }

        try {
            // Si es edición y no hay archivo nuevo, solo actualizar metadatos
            if (plan && !formData.file) {
                const updateData = {
                    name: formData.name,
                    projectId: formData.project,
                    type: formData.type,
                    version: formData.version,
                    status: formData.status,
                    description: formData.description
                }

                const response = await fetch(`/api/plans/${plan.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                })

                if (!response.ok) {
                    throw new Error('Error updating plan')
                }

                const updatedPlan = await response.json()
                toast.success('Plano actualizado correctamente')
                onSave(updatedPlan)
                onClose()
                return
            }

            // Si hay archivo nuevo (creación o reemplazo), subir archivo
            const uploadFormData = new FormData()
            if (formData.file) {
                uploadFormData.append('file', formData.file)
            }
            uploadFormData.append('name', formData.name)
            uploadFormData.append('type', formData.type)
            uploadFormData.append('description', formData.description)
            uploadFormData.append('projectId', formData.project)

            const response = await fetch('/api/plans/upload', {
                method: 'POST',
                body: uploadFormData
            })

            if (!response.ok) {
                throw new Error('Error uploading file')
            }

            const uploadedPlan = await response.json()
            toast.success(plan ? 'Plano actualizado correctamente' : 'Plano subido correctamente')
            onSave(uploadedPlan)
            onClose()
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error al procesar el archivo')
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null
        setFormData({ ...formData, file })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        {plan ? 'Editar Plano' : 'Nuevo Plano'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Plano *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proyecto *
                        </label>
                        <select
                            value={formData.project}
                            onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Seleccionar proyecto</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="ARQUITECTONICO">Arquitectónico</option>
                            <option value="ESTRUCTURAL">Estructural</option>
                            <option value="ELECTRICO">Eléctrico</option>
                            <option value="INSTALACIONES">Instalaciones</option>
                            <option value="OTRO">Otro</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Versión
                            </label>
                            <input
                                type="text"
                                value={formData.version}
                                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="DRAFT">Borrador</option>
                                <option value="EN_REVISION">En revisión</option>
                                <option value="APROBADO">Aprobado</option>
                                <option value="ARCHIVADO">Archivado</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Descripción del plano..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Archivo
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.dwg,.jpg,.jpeg,.png"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Formatos aceptados: PDF, DWG, JPG, PNG
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            {plan ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
