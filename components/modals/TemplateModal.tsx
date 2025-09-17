'use client'

import { useState } from 'react'

interface TemplateModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (template: any) => void
    templates: any[]
}

export default function TemplateModal({ isOpen, onClose, onSave, templates }: TemplateModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        type: 'Estructural',
        description: '',
        requirements: '',
        estimatedDuration: '',
        checklist: [] as string[]
    })

    const defaultTemplates = [
        {
            id: 'template-1',
            name: 'Inspección Estructural Básica',
            type: 'Estructural',
            description: 'Inspección estándar de elementos estructurales',
            requirements: 'Planos estructurales, certificados de materiales',
            estimatedDuration: '2 horas',
            checklist: [
                'Verificar cimentación',
                'Revisar columnas y vigas',
                'Comprobar uniones',
                'Evaluar estado general'
            ]
        },
        {
            id: 'template-2',
            name: 'Inspección Eléctrica Completa',
            type: 'Instalaciones',
            description: 'Inspección completa del sistema eléctrico',
            requirements: 'Planos eléctricos, certificados de instalación',
            estimatedDuration: '3 horas',
            checklist: [
                'Verificar tablero principal',
                'Comprobar circuitos',
                'Revisar tomas y interruptores',
                'Evaluar sistema de puesta a tierra'
            ]
        },
        {
            id: 'template-3',
            name: 'Inspección de Seguridad',
            type: 'Seguridad',
            description: 'Evaluación de medidas de seguridad',
            requirements: 'Plan de seguridad, equipos de protección',
            estimatedDuration: '1.5 horas',
            checklist: [
                'Verificar señalización',
                'Comprobar equipos de protección',
                'Evaluar acceso restringido',
                'Revisar extintores y salidas'
            ]
        }
    ]

    const handleCreateFromTemplate = (template: any) => {
        const inspectionData = {
            id: Date.now(),
            title: `${template.name} - ${new Date().toLocaleDateString('es-ES')}`,
            project: '',
            type: template.type,
            scheduledDate: new Date().toISOString().split('T')[0],
            inspector: '',
            status: 'Programada',
            priority: 'Media',
            location: '',
            description: template.description,
            requirements: template.requirements,
            estimatedDuration: template.estimatedDuration,
            checklist: template.checklist
        }

        onSave(inspectionData)
        onClose()
    }

    const handleSaveCustomTemplate = () => {
        if (newTemplate.name && newTemplate.description) {
            const template = {
                id: `custom-${Date.now()}`,
                ...newTemplate
            }
            // In a real app, this would save to a database
            console.log('Template saved:', template)
            setIsCreating(false)
            setNewTemplate({
                name: '',
                type: 'Estructural',
                description: '',
                requirements: '',
                estimatedDuration: '',
                checklist: []
            })
        }
    }

    const addChecklistItem = () => {
        setNewTemplate({
            ...newTemplate,
            checklist: [...newTemplate.checklist, '']
        })
    }

    const updateChecklistItem = (index: number, value: string) => {
        const updatedChecklist = [...newTemplate.checklist]
        updatedChecklist[index] = value
        setNewTemplate({
            ...newTemplate,
            checklist: updatedChecklist
        })
    }

    const removeChecklistItem = (index: number) => {
        setNewTemplate({
            ...newTemplate,
            checklist: newTemplate.checklist.filter((_, i) => i !== index)
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Plantillas de Inspección</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Plantillas Disponibles</h3>
                        <p className="text-sm text-gray-600">Selecciona una plantilla para crear una nueva inspección</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        {isCreating ? 'Cancelar' : 'Crear Plantilla'}
                    </button>
                </div>

                {isCreating ? (
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Nueva Plantilla</h4>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre de la Plantilla *
                                    </label>
                                    <input
                                        type="text"
                                        value={newTemplate.name}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej: Inspección de Fachada"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo *
                                    </label>
                                    <select
                                        value={newTemplate.type}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Estructural">Estructural</option>
                                        <option value="Instalaciones">Instalaciones</option>
                                        <option value="Final">Final</option>
                                        <option value="Seguridad">Seguridad</option>
                                        <option value="Calidad">Calidad</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción *
                                </label>
                                <textarea
                                    value={newTemplate.description}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Describe el propósito de esta plantilla..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Requisitos
                                    </label>
                                    <textarea
                                        value={newTemplate.requirements}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, requirements: e.target.value })}
                                        rows={2}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Documentos necesarios..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Duración Estimada
                                    </label>
                                    <input
                                        type="text"
                                        value={newTemplate.estimatedDuration}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, estimatedDuration: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej: 2 horas"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Lista de Verificación
                                    </label>
                                    <button
                                        onClick={addChecklistItem}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        + Agregar Material
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {newTemplate.checklist.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => updateChecklistItem(index, e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Ítem de verificación..."
                                            />
                                            <button
                                                onClick={() => removeChecklistItem(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveCustomTemplate}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Guardar Plantilla
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {defaultTemplates.map((template) => (
                            <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="text-md font-medium text-gray-900">{template.name}</h4>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {template.type}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                                <div className="text-xs text-gray-500 mb-3">
                                    <p>Duración: {template.estimatedDuration}</p>
                                    <p>Materiales: {template.checklist.length}</p>
                                </div>

                                <button
                                    onClick={() => handleCreateFromTemplate(template)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                                >
                                    Usar Plantilla
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
