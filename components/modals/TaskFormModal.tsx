'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Modal from './Modal'

interface TaskFormModalProps {
    isOpen: boolean
    onClose: () => void
    task?: any
    onSave: (taskData: any) => void
}

export default function TaskFormModal({ isOpen, onClose, task, onSave }: TaskFormModalProps) {
    const { data: session } = useSession()
    const [formData, setFormData] = useState({
        title: task?.title || '',
        projectId: (task && task.projectId) || '',
        assigneeId: (task && task.assigneeId) || '',
        description: task?.description || '',
        startDate: task?.startDate ? task.startDate.split('T')[0] : '',
        endDate: task?.endDate ? task.endDate.split('T')[0] : '',
        progress: task?.progress || 0,
        status: task?.status || 'PENDING',
        priority: task?.priority || 'MEDIUM',
        estimatedHours: task?.estimatedHours || '',
        notes: task?.notes || '',
        rubroId: task?.rubroId || '',
        providerId: task?.providerId || '',
        clientId: task?.clientId || '',
        externalLinks: task?.externalLinks || []
    })

    const [projects, setProjects] = useState<any[]>([])
    const [assignees, setAssignees] = useState<any[]>([])
    const [rubros, setRubros] = useState<any[]>([])
    const [providers, setProviders] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])

    // Keep form data in sync when editing a task (task prop may change after modal open)
    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                projectId: task.projectId || (task.project ? task.project.id : ''),
                assigneeId: task.assigneeId || (task.assignee ? task.assignee.id : ''),
                description: task.description || '',
                startDate: task.startDate ? String(task.startDate).split('T')[0] : '',
                endDate: task.endDate ? String(task.endDate).split('T')[0] : '',
                progress: task.progress ?? 0,
                status: task.status || 'PENDING',
                priority: task.priority || 'MEDIUM',
                estimatedHours: task.estimatedHours ?? '',
                notes: task.notes || '',
                rubroId: task.rubroId || '',
                providerId: task.providerId || '',
                clientId: task.clientId || '',
                externalLinks: task.externalLinks || []
            })
        } else if (isOpen) {
            // reset when opening for create
            setFormData({
                title: '',
                projectId: '',
                assigneeId: '',
                description: '',
                startDate: '',
                endDate: '',
                progress: 0,
                status: 'PENDING',
                priority: 'MEDIUM',
                estimatedHours: '',
                notes: '',
                rubroId: '',
                providerId: '',
                clientId: '',
                externalLinks: []
            })
        }
    }, [task, isOpen])

    useEffect(() => {
        async function loadOptions() {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) {
                    // Session not ready or no org — skip loading until we have org
                    return
                }
                const resP = await fetch(`/api/projects?organizationId=${organizationId}`)
                const listP = await resP.json()
                setProjects(listP || [])
            } catch (e) { console.error('load projects', e); setProjects([]) }

            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const resE = await fetch(`/api/employees?organizationId=${organizationId}`)
                const listE = await resE.json()
                setAssignees(listE || [])
            } catch (e) { console.error('load employees', e); setAssignees([]) }

            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const resR = await fetch(`/api/rubros?organizationId=${organizationId}`)
                const listR = await resR.json()
                setRubros(listR || [])
            } catch (e) { console.error('load rubros', e); setRubros([]) }

            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const resProv = await fetch(`/api/providers?organizationId=${organizationId}`)
                const listProv = await resProv.json()
                setProviders(listProv || [])
            } catch (e) { console.error('load providers', e); setProviders([]) }

            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const resC = await fetch(`/api/clients?organizationId=${organizationId}`)
                const listC = await resC.json()
                setClients(listC || [])
            } catch (e) { console.error('load clients', e); setClients([]) }
        }
        if (isOpen) loadOptions()
    }, [isOpen, session])

    const statuses = [
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'IN_PROGRESS', label: 'En progreso' },
        { value: 'COMPLETED', label: 'Completado' },
        { value: 'CANCELLED', label: 'Cancelado' }
    ]

    const priorities = [
        { value: 'LOW', label: 'Baja' },
        { value: 'MEDIUM', label: 'Media' },
        { value: 'HIGH', label: 'Alta' },
        { value: 'URGENT', label: 'Urgente' }
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({
            ...formData,
            title: formData.title,
            progress: parseInt(formData.progress.toString()),
            estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
            rubroId: formData.rubroId || null,
            providerId: formData.providerId || null,
            clientId: formData.clientId || null,
            externalLinks: formData.externalLinks || [],
            id: task?.id || undefined
        })
        onClose()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleAddLink = () => {
        setFormData(prev => ({
            ...prev,
            externalLinks: [...prev.externalLinks, '']
        }))
    }

    const handleLinkChange = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            externalLinks: prev.externalLinks.map((link: string, i: number) => i === index ? value : link)
        }))
    }

    const handleRemoveLink = (index: number) => {
        setFormData(prev => ({
            ...prev,
            externalLinks: prev.externalLinks.filter((_: string, i: number) => i !== index)
        }))
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={task ? 'Editar Tarea' : 'Nueva Tarea'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Nombre de la Tarea *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Ej: Excavación y cimentación"
                        />
                    </div>

                    <div>
                        <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                            Proyecto *
                        </label>
                        <select
                            id="projectId"
                            name="projectId"
                            required
                            value={formData.projectId}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar proyecto</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">
                            Asignado a *
                        </label>
                        <select
                            id="assigneeId"
                            name="assigneeId"
                            required
                            value={formData.assigneeId}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar asignado</option>
                            {assignees.map(a => (
                                <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="rubroId" className="block text-sm font-medium text-gray-700">
                            Rubro
                        </label>
                        <select
                            id="rubroId"
                            name="rubroId"
                            value={formData.rubroId}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar rubro</option>
                            {rubros.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="providerId" className="block text-sm font-medium text-gray-700">
                            Proveedor
                        </label>
                        <select
                            id="providerId"
                            name="providerId"
                            value={formData.providerId}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar proveedor</option>
                            {providers.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                            Cliente
                        </label>
                        <select
                            id="clientId"
                            name="clientId"
                            value={formData.clientId}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar cliente</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                            Prioridad *
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            required
                            value={formData.priority}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {priorities.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                            Fecha de Inicio *
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            required
                            value={formData.startDate}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                            Fecha de Fin *
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            required
                            value={formData.endDate}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Estado *
                        </label>
                        <select
                            id="status"
                            name="status"
                            required
                            value={formData.status}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            {statuses.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="progress" className="block text-sm font-medium text-gray-700">
                            Progreso (%)
                        </label>
                        <input
                            type="number"
                            id="progress"
                            name="progress"
                            min="0"
                            max="100"
                            value={formData.progress}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700">
                            Horas Estimadas
                        </label>
                        <input
                            type="number"
                            id="estimatedHours"
                            name="estimatedHours"
                            min="0"
                            step="0.5"
                            value={formData.estimatedHours}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0.0"
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
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Descripción detallada de la tarea..."
                    />
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notas
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        rows={2}
                        value={formData.notes}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Notas adicionales..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enlaces Externos
                    </label>
                    {formData.externalLinks.map((link: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                            <input
                                type="url"
                                value={link}
                                onChange={(e) => handleLinkChange(index, e.target.value)}
                                placeholder="https://ejemplo.com/archivo.xlsx"
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveLink(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Eliminar enlace"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={handleAddLink}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Agregar Enlace
                    </button>
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
                        {task ? 'Actualizar Tarea' : 'Crear Tarea'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
