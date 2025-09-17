'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Modal from './Modal'

interface EvaluationFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (evaluationData: any) => void
    evaluation?: any
}

// Employees will be loaded for the current user's organization

const evaluationCriteria = [
    { id: 'productivity', name: 'Productividad', description: 'Capacidad para completar tareas eficientemente' },
    { id: 'quality', name: 'Calidad del Trabajo', description: 'Precisión y atención al detalle' },
    { id: 'teamwork', name: 'Trabajo en Equipo', description: 'Colaboración y comunicación con compañeros' },
    { id: 'leadership', name: 'Liderazgo', description: 'Capacidad para guiar y motivar al equipo' },
    { id: 'initiative', name: 'Iniciativa', description: 'Proactividad y resolución de problemas' },
    { id: 'attendance', name: 'Asistencia y Puntualidad', description: 'Presencia y cumplimiento de horarios' }
]

export default function EvaluationFormModal({ isOpen, onClose, onSave, evaluation }: EvaluationFormModalProps) {
    const [formData, setFormData] = useState({
        employeeId: evaluation?.employeeId || '',
        evaluationDate: evaluation?.evaluationDate || new Date().toISOString().split('T')[0],
        evaluationPeriod: evaluation?.evaluationPeriod || '',
        evaluator: evaluation?.evaluator || '',
        overallRating: evaluation?.overallRating || '',
        strengths: evaluation?.strengths || '',
        areasForImprovement: evaluation?.areasForImprovement || '',
        goals: evaluation?.goals || '',
        comments: evaluation?.comments || '',
        criteria: evaluation?.criteria || evaluationCriteria.reduce((acc, criterion) => ({
            ...acc,
            [criterion.id]: { rating: '', comments: '' }
        }), {})
    })

    const { data: session } = useSession()
    const [employees, setEmployees] = useState<any[]>([])

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const orgId = (session as any)?.user?.organizationId
                if (!orgId) return
                const res = await fetch(`/api/employees?organizationId=${orgId}`)
                if (!res.ok) return
                const data = await res.json()
                setEmployees(data)
            } catch (err) {
                console.error('Failed to load employees for evaluation modal', err)
            }
        }

        loadEmployees()
    }, [session])

    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.employeeId) newErrors.employeeId = 'Empleado es requerido'
        if (!formData.evaluationDate) newErrors.evaluationDate = 'Fecha de evaluación es requerida'
        if (!formData.evaluator) newErrors.evaluator = 'Evaluador es requerido'
        if (!formData.overallRating) newErrors.overallRating = 'Calificación general es requerida'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            const selectedEmployee = employees.find((emp: any) => emp.id?.toString() === formData.employeeId?.toString())
            const evaluationData = {
                ...formData,
                id: evaluation?.id || Date.now(),
                employeeName: selectedEmployee?.name || '',
                employeePosition: selectedEmployee?.position || '',
                createdAt: new Date().toISOString()
            }
            onSave(evaluationData)
            onClose()
            // Reset form
            setFormData({
                employeeId: '',
                evaluationDate: new Date().toISOString().split('T')[0],
                evaluationPeriod: '',
                evaluator: '',
                overallRating: '',
                strengths: '',
                areasForImprovement: '',
                goals: '',
                comments: '',
                criteria: evaluationCriteria.reduce((acc, criterion) => ({
                    ...acc,
                    [criterion.id]: { rating: '', comments: '' }
                }), {})
            })
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleCriteriaChange = (criterionId: string, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            criteria: {
                ...prev.criteria,
                [criterionId]: {
                    ...prev.criteria[criterionId],
                    [field]: value
                }
            }
        }))
    }

    const calculateAverageRating = () => {
        const ratings = Object.values(formData.criteria)
            .map((criterion: any) => parseFloat(criterion.rating))
            .filter(rating => !isNaN(rating))

        if (ratings.length === 0) return 0
        return (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={evaluation ? 'Editar Evaluación' : 'Nueva Evaluación de Desempeño'}>
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
                                    {employee.name} - {employee.position}
                                </option>
                            ))}
                        </select>
                        {errors.employeeId && (
                            <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
                        )}
                    </div>

                    {/* Evaluation Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha de Evaluación *
                        </label>
                        <input
                            type="date"
                            value={formData.evaluationDate}
                            onChange={(e) => handleInputChange('evaluationDate', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.evaluationDate ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.evaluationDate && (
                            <p className="mt-1 text-sm text-red-600">{errors.evaluationDate}</p>
                        )}
                    </div>

                    {/* Evaluation Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Período Evaluado
                        </label>
                        <select
                            value={formData.evaluationPeriod}
                            onChange={(e) => handleInputChange('evaluationPeriod', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccionar período...</option>
                            <option value="Q1">Primer Trimestre</option>
                            <option value="Q2">Segundo Trimestre</option>
                            <option value="Q3">Tercer Trimestre</option>
                            <option value="Q4">Cuarto Trimestre</option>
                            <option value="annual">Anual</option>
                        </select>
                    </div>

                    {/* Evaluator */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Evaluador *
                        </label>
                        <input
                            type="text"
                            value={formData.evaluator}
                            onChange={(e) => handleInputChange('evaluator', e.target.value)}
                            placeholder="Nombre del evaluador"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.evaluator ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.evaluator && (
                            <p className="mt-1 text-sm text-red-600">{errors.evaluator}</p>
                        )}
                    </div>
                </div>

                {/* Evaluation Criteria */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Criterios de Evaluación</h3>
                    {evaluationCriteria.map(criterion => (
                        <div key={criterion.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-medium text-gray-900">{criterion.name}</h4>
                                    <p className="text-sm text-gray-600">{criterion.description}</p>
                                </div>
                                <select
                                    value={formData.criteria[criterion.id]?.rating || ''}
                                    onChange={(e) => handleCriteriaChange(criterion.id, 'rating', e.target.value)}
                                    className="ml-4 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">--</option>
                                    <option value="1">1 - Deficiente</option>
                                    <option value="2">2 - Mejorable</option>
                                    <option value="3">3 - Bueno</option>
                                    <option value="4">4 - Muy Bueno</option>
                                    <option value="5">5 - Excelente</option>
                                </select>
                            </div>
                            <textarea
                                value={formData.criteria[criterion.id]?.comments || ''}
                                onChange={(e) => handleCriteriaChange(criterion.id, 'comments', e.target.value)}
                                placeholder="Comentarios específicos..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    ))}
                </div>

                {/* Overall Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calificación General (1-5) *
                    </label>
                    <div className="flex items-center space-x-4">
                        <input
                            type="number"
                            value={formData.overallRating}
                            onChange={(e) => handleInputChange('overallRating', e.target.value)}
                            min="1"
                            max="5"
                            step="0.1"
                            className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.overallRating ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        <span className="text-sm text-gray-600">
                            Promedio calculado: {calculateAverageRating()}/5
                        </span>
                    </div>
                    {errors.overallRating && (
                        <p className="mt-1 text-sm text-red-600">{errors.overallRating}</p>
                    )}
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fortalezas
                        </label>
                        <textarea
                            value={formData.strengths}
                            onChange={(e) => handleInputChange('strengths', e.target.value)}
                            placeholder="Aspectos positivos destacados..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Areas for Improvement */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Áreas de Mejora
                        </label>
                        <textarea
                            value={formData.areasForImprovement}
                            onChange={(e) => handleInputChange('areasForImprovement', e.target.value)}
                            placeholder="Aspectos que requieren atención..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Goals */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Objetivos para el Próximo Período
                        </label>
                        <textarea
                            value={formData.goals}
                            onChange={(e) => handleInputChange('goals', e.target.value)}
                            placeholder="Metas y objetivos específicos..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Comments */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comentarios Adicionales
                        </label>
                        <textarea
                            value={formData.comments}
                            onChange={(e) => handleInputChange('comments', e.target.value)}
                            placeholder="Observaciones generales..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
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
                        {evaluation ? 'Actualizar Evaluación' : 'Guardar Evaluación'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
