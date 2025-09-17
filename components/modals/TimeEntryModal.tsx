'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface TimeEntryModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (entryData: any) => void
    entry: any
}

interface Employee {
    id: string
    name: string
    firstName: string
    lastName: string
    position?: string
}

interface Project {
    id: string
    name: string
    code?: string
}

export default function TimeEntryModal({ isOpen, onClose, onSave, entry }: TimeEntryModalProps) {
    const { data: session } = useSession()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        employeeId: '',
        projectId: '',
        date: '',
        checkIn: '',
        checkOut: '',
        location: '',
        description: ''
    })

    // Load employees and projects when modal opens
    useEffect(() => {
        if (isOpen && session?.user?.organizationId) {
            loadEmployeesAndProjects()
        }
    }, [isOpen, session])

    // Load form data when entry is provided
    useEffect(() => {
        if (entry) {
            setFormData({
                employeeId: entry.employeeId || '',
                projectId: entry.projectId || '',
                date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
                checkIn: entry.startTime ? new Date(entry.startTime).toTimeString().slice(0, 5) : '',
                checkOut: entry.endTime ? new Date(entry.endTime).toTimeString().slice(0, 5) : '',
                location: entry.location || '',
                description: entry.description || ''
            })
        } else {
            const today = new Date().toISOString().split('T')[0]
            setFormData({
                employeeId: '',
                projectId: '',
                date: today,
                checkIn: '',
                checkOut: '',
                location: '',
                description: ''
            })
        }
    }, [entry, isOpen])

    const loadEmployeesAndProjects = async () => {
        if (!session?.user?.organizationId) return

        setLoading(true)
        try {
            const [employeesRes, projectsRes] = await Promise.all([
                fetch(`/api/employees?organizationId=${session.user.organizationId}`),
                fetch(`/api/projects?organizationId=${session.user.organizationId}`)
            ])

            if (employeesRes.ok) {
                const employeesData = await employeesRes.json()
                setEmployees(employeesData)
            }

            if (projectsRes.ok) {
                const projectsData = await projectsRes.json()
                setProjects(projectsData)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.employeeId || !formData.projectId) {
            alert('Por favor selecciona un empleado y un proyecto')
            return
        }

        const entryData = {
            employeeId: formData.employeeId,
            projectId: formData.projectId,
            date: formData.date,
            startTime: formData.checkIn ? `${formData.date}T${formData.checkIn}:00.000Z` : null,
            endTime: formData.checkOut ? `${formData.date}T${formData.checkOut}:00.000Z` : null,
            location: formData.location,
            description: formData.description,
            totalHours: calculateTotalHours(formData.checkIn, formData.checkOut),
            status: formData.checkOut ? 'Completado' : 'Activo'
        }

        onSave(entryData)
        onClose()
    }

    const calculateTotalHours = (checkIn: string, checkOut: string) => {
        if (!checkIn || !checkOut) return 0

        const [inHours, inMinutes] = checkIn.split(':').map(Number)
        const [outHours, outMinutes] = checkOut.split(':').map(Number)

        const inTime = inHours * 60 + inMinutes
        const outTime = outHours * 60 + outMinutes

        const diffMinutes = outTime - inTime
        return Math.round((diffMinutes / 60) * 100) / 100
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        {entry ? 'Editar Registro' : 'Nuevo Registro Horario'}
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

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Empleado *
                            </label>
                            <select
                                value={formData.employeeId}
                                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Seleccionar empleado</option>
                                {employees.map(employee => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.name} {employee.position ? `(${employee.position})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Proyecto *
                            </label>
                            <select
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Seleccionar proyecto</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.name} {project.code ? `(${project.code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha *
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hora Entrada *
                                </label>
                                <input
                                    type="time"
                                    value={formData.checkIn}
                                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hora Salida
                                </label>
                                <input
                                    type="time"
                                    value={formData.checkOut}
                                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
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
                                placeholder="Ej: Madrid, España"
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
                                placeholder="Descripción del trabajo realizado..."
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
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                {entry ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
