'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Modal from './Modal'

interface AssignmentFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (assignmentData: any) => void
    assignment?: any
}

// will be loaded from API by organization
const initialProjects: string[] = []
const initialEmployees: any[] = []

export default function AssignmentFormModal({ isOpen, onClose, onSave, assignment }: AssignmentFormModalProps) {
    const [formData, setFormData] = useState({
        employeeId: assignment?.employeeId || '',
        projectId: assignment?.projectId || '',
        role: assignment?.role || '',
        startDate: assignment?.startDate || '',
        endDate: assignment?.endDate || '',
        hoursPerWeek: assignment?.hoursPerWeek || '',
        status: assignment?.status || 'Activo'
    })

    const { data: session } = useSession()
    const [projects, setProjects] = useState<any[]>(initialProjects)
    const [employees, setEmployees] = useState<any[]>(initialEmployees)
    const [loading, setLoading] = useState(false)

    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.employeeId) newErrors.employeeId = 'Empleado es requerido'
        if (!formData.projectId) newErrors.projectId = 'Proyecto es requerido'
        if (!formData.role) newErrors.role = 'Rol es requerido'
        if (!formData.startDate) newErrors.startDate = 'Fecha de inicio es requerida'
        if (!formData.hoursPerWeek) newErrors.hoursPerWeek = 'Horas por semana es requerido'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            const selectedEmployee = employees.find(emp => emp.id.toString() === formData.employeeId)
            const assignmentData = {
                employeeId: formData.employeeId,
                projectId: formData.projectId,
                role: formData.role,
                startDate: formData.startDate,
                endDate: formData.endDate,
                hoursPerWeek: formData.hoursPerWeek,
                status: formData.status,
                employeeName: selectedEmployee?.firstName + ' ' + selectedEmployee?.lastName || '',
                employeePosition: selectedEmployee?.position || ''
            }
            onSave(assignmentData)
            onClose()
            // Reset form
            setFormData({
                employeeId: '',
                projectId: '',
                role: '',
                startDate: '',
                endDate: '',
                hoursPerWeek: '',
                status: 'Activo'
            })
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    // When assignment prop changes (e.g., opening edit), update the form
    useEffect(() => {
        if (assignment) {
            setFormData({
                employeeId: assignment.employeeId || '',
                projectId: assignment.projectId || '',
                role: assignment.role || '',
                startDate: assignment.startDate || '',
                endDate: assignment.endDate || '',
                hoursPerWeek: assignment.hoursPerWeek || '',
                status: assignment.status || 'Activo'
            })
        }
    }, [assignment])

    // Load employees & projects for current org when modal opens
    useEffect(() => {
        if (!isOpen) return
        const orgId = (session as any)?.user?.organizationId
        if (!orgId) return
        let mounted = true
            ; (async () => {
                setLoading(true)
                try {
                    const [eRes, pRes] = await Promise.all([
                        fetch(`/api/employees?organizationId=${orgId}`),
                        fetch(`/api/projects?organizationId=${orgId}`)
                    ])
                    const [eData, pData] = await Promise.all([eRes.ok ? eRes.json() : [], pRes.ok ? pRes.json() : []])
                    if (!mounted) return
                    setEmployees(Array.isArray(eData) ? eData : [])
                    setProjects(Array.isArray(pData) ? pData : [])
                } catch (err) {
                    console.error('Error loading employees/projects for assignment modal', err)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [isOpen, session])

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={assignment ? 'Editar Asignación' : 'Nueva Asignación'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employee Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Empleado *
                        </label>
                        <select
                            value={formData.employeeId}
                            onChange={(e) => handleInputChange('employeeId', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.employeeId ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Seleccionar empleado...</option>
                            {employees.map(employee => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.firstName} {employee.lastName} - {employee.position}
                                </option>
                            ))}
                        </select>
                        {errors.employeeId && (
                            <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
                        )}
                    </div>

                    {/* Project Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Proyecto *
                        </label>
                        <select
                            value={formData.projectId}
                            onChange={(e) => handleInputChange('projectId', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.projectId ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Seleccionar proyecto...</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                        {errors.projectId && (
                            <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>
                        )}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rol en el Proyecto *
                        </label>
                        <input
                            type="text"
                            value={formData.role}
                            onChange={(e) => handleInputChange('role', e.target.value)}
                            placeholder="Ej: Maestro de obra, Electricista, etc."
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.role ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.role && (
                            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                        )}
                    </div>

                    {/* Hours per Week */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Horas por Semana *
                        </label>
                        <input
                            type="number"
                            value={formData.hoursPerWeek}
                            onChange={(e) => handleInputChange('hoursPerWeek', e.target.value)}
                            placeholder="40"
                            min="1"
                            max="60"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.hoursPerWeek ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.hoursPerWeek && (
                            <p className="mt-1 text-sm text-red-600">{errors.hoursPerWeek}</p>
                        )}
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha de Inicio *
                        </label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.startDate ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.startDate && (
                            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                        )}
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha de Fin
                        </label>
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-sm text-gray-500">Opcional - dejar vacío si es indefinido</p>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                            <option value="Completado">Completado</option>
                        </select>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {assignment ? 'Actualizar Asignación' : 'Crear Asignación'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
