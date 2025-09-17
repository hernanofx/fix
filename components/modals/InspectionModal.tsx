
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface InspectionModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (inspectionData: any) => void
    inspection: any
    readOnly?: boolean
}

export default function InspectionModal({ isOpen, onClose, onSave, inspection, readOnly }: InspectionModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        project: '',
        type: 'Estructural',
        scheduledDate: '',
        inspector: '',
        priority: 'Media',
        location: '',
        description: '',
        requirements: '',
        status: 'Programada'
    })

    const { data: session } = useSession()

    const [projects, setProjects] = useState<any[]>([])
    const [loadingProjects, setLoadingProjects] = useState(false)
    const isReadOnly = !!readOnly

    useEffect(() => {
        if (inspection) {
            setFormData({
                title: inspection.title || '',
                project: inspection.projectId || '',
                type: inspection.type || 'Estructural',
                scheduledDate: inspection.scheduledDate ? inspection.scheduledDate.split('T')[0] : '',
                inspector: inspection.inspector || '', // Usar el campo inspector de texto libre
                priority: inspection.priority || 'Media',
                location: inspection.location || '',
                description: inspection.description || '',
                requirements: inspection.requirements || '',
                status: inspection.status || 'Programada'
            })
        } else {
            const today = new Date().toISOString().split('T')[0]
            setFormData({
                title: '',
                project: '',
                type: 'Estructural',
                scheduledDate: today,
                inspector: '',
                priority: 'Media',
                location: '',
                description: '',
                requirements: '',
                status: 'Programada'
            })
        }
    }, [inspection, isOpen])

    // Load projects for org when modal opens
    useEffect(() => {
        if (!isOpen) return
        const orgId = (session as any)?.user?.organizationId
        if (!orgId) return
        let mounted = true

            // Load projects
            ; (async () => {
                setLoadingProjects(true)
                try {
                    const res = await fetch(`/api/projects?organizationId=${orgId}`)
                    if (!res.ok) throw new Error('No se pudieron cargar los proyectos')
                    const data = await res.json()
                    if (mounted) setProjects(Array.isArray(data) ? data : [])
                } catch (err) {
                    console.error('Error loading projects for inspection modal', err)
                } finally {
                    if (mounted) setLoadingProjects(false)
                }
            })()

        return () => { mounted = false }
    }, [inspection, isOpen, session])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isReadOnly) return

        const inspectionData = {
            id: inspection?.id || Date.now(),
            title: formData.title,
            projectId: formData.project, // Enviar projectId
            type: formData.type,
            scheduledDate: formData.scheduledDate,
            inspector: formData.inspector, // Enviar inspector como texto libre
            priority: formData.priority,
            location: formData.location,
            description: formData.description,
            requirements: formData.requirements,
            status: formData.status
        }

        onSave(inspectionData)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        {inspection ? 'Editar Inspección' : 'Nueva Inspección'}
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
                            Título de la Inspección *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Inspección de Cimentación"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                                {loadingProjects && <option disabled>Cargando proyectos...</option>}
                                {!loadingProjects && projects.length === 0 && <option disabled>No hay proyectos</option>}
                                {projects.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
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
                                <option value="Estructural">Estructural</option>
                                <option value="Instalaciones">Instalaciones</option>
                                <option value="Final">Final</option>
                                <option value="Seguridad">Seguridad</option>
                                <option value="Calidad">Calidad</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Programada *
                            </label>
                            <input
                                type="date"
                                value={formData.scheduledDate}
                                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prioridad
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                                <option value="Crítica">Crítica</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Inspector
                        </label>
                        <input
                            type="text"
                            value={formData.inspector}
                            onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nombre del inspector"
                            disabled={isReadOnly}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ubicación
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Zona A - Parcela 1"
                        />
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
                            placeholder="Descripción detallada de la inspección..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Requisitos
                        </label>
                        <textarea
                            value={formData.requirements}
                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                            rows={2}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Documentos y requisitos necesarios..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        {!isReadOnly && (
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                {inspection ? 'Actualizar' : 'Crear'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
