'use client'

import { useState, useEffect } from 'react'

interface ProspectFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (prospectData: any) => void
    prospect: any
    readOnly?: boolean
}

export default function ProspectFormModal({ isOpen, onClose, onSave, prospect, readOnly = false }: ProspectFormModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Argentina',
        rut: '',
        contactName: '',
        contactPhone: '',
        status: 'PROSPECT',
        prospectStatus: 'A_CONTACTAR',
        projectInterests: [] as string[],
        materialInterests: [] as string[],
        rubroInterests: [] as string[],
        prospectNotes: ''
    })

    const [projects, setProjects] = useState<any[]>([])
    const [materials, setMaterials] = useState<any[]>([])
    const [rubros, setRubros] = useState<any[]>([])

    useEffect(() => {
        if (prospect) {
            setFormData({
                name: prospect.name || '',
                email: prospect.email || '',
                phone: prospect.phone || '',
                address: prospect.address || '',
                city: prospect.city || '',
                country: prospect.country || 'Argentina',
                rut: prospect.rut || '',
                contactName: prospect.contactName || '',
                contactPhone: prospect.contactPhone || '',
                status: prospect.status || 'PROSPECT',
                prospectStatus: prospect.situacion || 'A_CONTACTAR', // Map situacion to prospectStatus
                projectInterests: prospect.projectInterests || [],
                materialInterests: prospect.materialInterests || [],
                rubroInterests: prospect.rubroInterests || [],
                prospectNotes: prospect.prospectNotes || ''
            })
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                country: 'Argentina',
                rut: '',
                contactName: '',
                contactPhone: '',
                status: 'PROSPECT',
                prospectStatus: 'A_CONTACTAR',
                projectInterests: [],
                materialInterests: [],
                rubroInterests: [],
                prospectNotes: ''
            })
        }
    }, [prospect, isOpen])

    // Load options for interests
    useEffect(() => {
        const loadOptions = async () => {
            try {
                // Load projects
                const projectsRes = await fetch('/api/projects')
                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json()
                    setProjects(projectsData)
                }

                // Load materials
                const materialsRes = await fetch('/api/stock/materials')
                if (materialsRes.ok) {
                    const materialsData = await materialsRes.json()
                    setMaterials(materialsData)
                }

                // Load rubros
                const rubrosRes = await fetch('/api/rubros')
                if (rubrosRes.ok) {
                    const rubrosData = await rubrosRes.json()
                    setRubros(rubrosData)
                }
            } catch (error) {
                console.error('Error loading options:', error)
            }
        }

        if (isOpen) {
            loadOptions()
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (readOnly) return

        const prospectData = {
            ...formData,
            situacion: formData.prospectStatus // Map prospectStatus to situacion for backend
        }
        onSave(prospectData)
        onClose()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleArrayChange = (field: string, values: string[]) => {
        setFormData(prev => ({
            ...prev,
            [field]: values
        }))
    }

    const handleMultiSelectChange = (field: string, e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = e.target.options
        const values: string[] = []
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                values.push(options[i].value)
            }
        }
        handleArrayChange(field, values)
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        {readOnly ? 'Detalles del Prospecto' : (prospect ? 'Editar Prospecto' : 'Crear Prospecto')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <span className="sr-only">Cerrar</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre de la Empresa */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre de la Empresa *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                                required
                            />
                        </div>

                        {/* CUIT */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CUIT
                            </label>
                            <input
                                type="text"
                                name="rut"
                                value={formData.rut}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                                placeholder="12-34567890-1"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Persona de Contacto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Persona de Contacto
                            </label>
                            <input
                                type="text"
                                name="contactName"
                                value={formData.contactName}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Teléfono de Contacto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono de Contacto
                            </label>
                            <input
                                type="tel"
                                name="contactPhone"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Estado del Prospecto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado
                            </label>
                            <select
                                name="prospectStatus"
                                value={formData.prospectStatus}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                disabled={readOnly}
                            >
                                <option value="A_CONTACTAR">A Contactar</option>
                                <option value="CONTACTADO_ESPERANDO">Contactado - Esperando</option>
                                <option value="COTIZANDO">Cotizando</option>
                                <option value="NEGOCIANDO">Negociando</option>
                                <option value="GANADO">Ganado</option>
                                <option value="PERDIDO">Perdido</option>
                                <option value="SIN_INTERES">Sin Interés</option>
                            </select>
                        </div>

                        {/* Dirección */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dirección
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Ciudad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ciudad
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>
                    </div>

                    {/* Intereses del Prospecto */}
                    <div className="border-t pt-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Intereses del Prospecto</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Proyectos de Interés */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Proyectos de Interés
                                </label>
                                <select
                                    multiple
                                    value={formData.projectInterests}
                                    onChange={(e) => handleMultiSelectChange('projectInterests', e)}
                                    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                    disabled={readOnly}
                                    size={4}
                                >
                                    {projects.map(project => (
                                        <option key={project.id} value={project.name}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Mantén Ctrl para seleccionar múltiples</p>
                            </div>

                            {/* Materiales de Interés */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Materiales de Interés
                                </label>
                                <select
                                    multiple
                                    value={formData.materialInterests}
                                    onChange={(e) => handleMultiSelectChange('materialInterests', e)}
                                    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                    disabled={readOnly}
                                    size={4}
                                >
                                    {materials.map(material => (
                                        <option key={material.id} value={material.name}>
                                            {material.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Mantén Ctrl para seleccionar múltiples</p>
                            </div>

                            {/* Rubros de Interés */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rubros de Interés
                                </label>
                                <select
                                    multiple
                                    value={formData.rubroInterests}
                                    onChange={(e) => handleMultiSelectChange('rubroInterests', e)}
                                    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                    disabled={readOnly}
                                    size={4}
                                >
                                    {rubros.map(rubro => (
                                        <option key={rubro.id} value={rubro.name}>
                                            {rubro.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Mantén Ctrl para seleccionar múltiples</p>
                            </div>
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Notas del Prospecto
                        </label>
                        <textarea
                            name="prospectNotes"
                            value={formData.prospectNotes}
                            onChange={handleChange}
                            rows={4}
                            className={`w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none ${readOnly ? 'bg-gray-100' : ''}`}
                            readOnly={readOnly}
                            placeholder="Notas específicas para el seguimiento del prospecto..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {readOnly ? 'Cerrar' : 'Cancelar'}
                        </button>
                        {!readOnly && (
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {prospect ? 'Actualizar' : 'Crear'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
