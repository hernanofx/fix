'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Modal from './Modal'

interface EmployeeFormModalProps {
    isOpen: boolean
    onClose: () => void
    employee?: any
    onSave: (employeeData: any) => void
    readOnly?: boolean
}

export default function EmployeeFormModal({ isOpen, onClose, employee, onSave, readOnly = false }: EmployeeFormModalProps) {
    const { data: session } = useSession()

    const [projects, setProjects] = useState<any[]>([])

    const [formData, setFormData] = useState({
        name: employee?.name || '',
        position: employee?.position || '',
        projectIds: employee?.employeeProjects ? employee.employeeProjects.map((ep: any) => ep.project?.id || ep.projectId) : (employee?.project ? [employee.project] : []),
        phone: employee?.phone || '',
        email: employee?.email || '',
        salary: employee?.salary || '',
        joinDate: employee?.joinDate || new Date().toISOString().split('T')[0],
        address: employee?.address || '',
        emergencyContact: employee?.emergencyContact || '',
        notes: employee?.notes || ''
    })

    useEffect(() => {
        setFormData((fd) => ({
            ...fd,
            name: employee?.name || '',
            position: employee?.position || '',
            projectIds: employee?.employeeProjects ? employee.employeeProjects.map((ep: any) => ep.project?.id || ep.projectId) : (employee?.project ? [employee.project] : []),
            phone: employee?.phone || '',
            email: employee?.email || '',
            salary: employee?.salary || '',
            joinDate: employee?.joinDate || new Date().toISOString().split('T')[0],
            address: employee?.address || '',
            emergencyContact: employee?.emergencyContact || '',
            notes: employee?.notes || ''
        }))
    }, [employee])

    useEffect(() => {
        const load = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const res = await fetch(`/api/projects?organizationId=${organizationId}`)
                if (!res.ok) return
                const data = await res.json()
                setProjects(Array.isArray(data) ? data : [])
            } catch (e) {
                console.error('Error loading projects for employee modal', e)
            }
        }

        if (isOpen) load()
    }, [isOpen, session])

    const positions = [
        'Maestro de Obra',
        'Arquitecta Técnica',
        'Ingeniera de Proyectos',
        'Electricista',
        'Capataz',
        'Albañil',
        'Pintor',
        'Fontanero',
        'Operador de Maquinaria',
        'Administrativo'
    ]

    // projects state is loaded from API

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({
            ...formData,
            id: employee?.id || Date.now(),
            status: employee?.status || 'Activo',
            hoursThisWeek: employee?.hoursThisWeek || 0,
            projectIds: formData.projectIds
        })
        onClose()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target as HTMLSelectElement
        if (target && target.name === 'projectIds' && target.multiple) {
            const selected = Array.from(target.selectedOptions).map(o => o.value)
            setFormData({ ...formData, projectIds: selected })
            return
        }

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={employee ? (readOnly ? 'Ver Empleado' : 'Editar Empleado') : 'Nuevo Empleado'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Nombre Completo *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            readOnly={/* @ts-ignore */ readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Ej: Juan Pérez García"
                        />
                    </div>

                    <div>
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                            Cargo *
                        </label>
                        <select
                            id="position"
                            name="position"
                            required
                            value={formData.position}
                            onChange={handleChange}
                            disabled={/* @ts-ignore */ readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar cargo</option>
                            {positions.map(position => (
                                <option key={position} value={position}>{position}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                            Proyecto Asignado
                        </label>
                        <select
                            id="projectIds"
                            name="projectIds"
                            multiple
                            value={formData.projectIds}
                            onChange={handleChange}
                            disabled={/* @ts-ignore */ readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-32"
                        >
                            {projects.length === 0 && <option value="">No hay proyectos</option>}
                            {projects.map((project: any) => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                            Salario Mensual (USD)
                        </label>
                        <input
                            type="number"
                            id="salary"
                            name="salary"
                            min="0"
                            step="0.01"
                            value={formData.salary}
                            onChange={handleChange}
                            readOnly={/* @ts-ignore */ readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Teléfono *
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            readOnly={/* @ts-ignore */ readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="+1 234 567 8900"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Correo Electrónico *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            readOnly={/* @ts-ignore */ readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="juan.perez@empresa.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700">
                            Fecha de Ingreso *
                        </label>
                        <input
                            type="date"
                            id="joinDate"
                            name="joinDate"
                            required
                            value={formData.joinDate}
                            onChange={handleChange}
                            readOnly={/* @ts-ignore */ readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                            Contacto de Emergencia
                        </label>
                        <input
                            type="text"
                            id="emergencyContact"
                            name="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={handleChange}
                            readOnly={/* @ts-ignore */ readOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Nombre y teléfono"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Dirección
                    </label>
                    <textarea
                        id="address"
                        name="address"
                        rows={2}
                        value={formData.address}
                        onChange={handleChange}
                        readOnly={/* @ts-ignore */ readOnly}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Dirección completa..."
                    />
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notas
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleChange}
                        readOnly={/* @ts-ignore */ readOnly}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Información adicional..."
                    />
                </div>
                {!/* @ts-ignore */ readOnly && (
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
                            {employee ? 'Actualizar Empleado' : 'Crear Empleado'}
                        </button>
                    </div>
                )}
            </form>
        </Modal>
    )
}
