'use client'

import Modal from './Modal'

interface ProjectDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    project: any
}

export default function ProjectDetailsModal({ isOpen, onClose, project }: ProjectDetailsModalProps) {
    if (!project) return null

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completado': return 'bg-green-100 text-green-800'
            case 'En progreso': return 'bg-blue-100 text-blue-800'
            case 'Planificación': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    // Defensive sanitization
    const progress = Number(project?.progress ?? 0)
    const budgetNumber = Number(String(project?.budget ?? '0').replace(/[^0-9.-]+/g, '')) || 0
    const formatCurrency = (n: number) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '-'

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Detalles del Proyecto: ${project?.name ?? '-'}`}
            size="lg"
        >
            <div className="space-y-6">
                {/* Project Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Información General
                        </h4>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                                <dd className="text-sm text-gray-900 mt-1">{project.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
                                <dd className="text-sm text-gray-900 mt-1">{project.location}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                                <dd className="text-sm text-gray-900 mt-1">{project.client || 'No especificado'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Gerente</dt>
                                <dd className="text-sm text-gray-900 mt-1">{project.manager || 'No asignado'}</dd>
                            </div>
                        </dl>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Estado y Fechas
                        </h4>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Progreso</dt>
                                <dd className="text-sm text-gray-900 mt-1">
                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-gray-500">{Number.isFinite(progress) ? `${progress}%` : '-'}</span>
                                    </div>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Fecha de Inicio</dt>
                                <dd className="text-sm text-gray-900 mt-1">
                                    {formatDate(project?.startDate)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Fecha de Fin</dt>
                                <dd className="text-sm text-gray-900 mt-1">
                                    {formatDate(project?.endDate)}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Budget and Financial Info */}
                <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Información Financiera
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="min-w-0">
                                <dt className="text-sm font-medium text-gray-500">Presupuesto Total</dt>
                                <dd className="text-2xl font-semibold text-gray-900 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                    {formatCurrency(budgetNumber)}
                                </dd>
                            </div>
                            <div className="min-w-0 text-right">
                                <dt className="text-sm font-medium text-gray-500">Gastado</dt>
                                <dd className="text-2xl font-semibold text-red-600 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                    {formatCurrency(budgetNumber * (progress / 100))}
                                </dd>
                            </div>
                            <div className="min-w-0 text-right">
                                <dt className="text-sm font-medium text-gray-500">Restante</dt>
                                <dd className="text-2xl font-semibold text-green-600 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                    {formatCurrency(budgetNumber * (1 - progress / 100))}
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {project.description && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Descripción
                        </h4>
                        <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4">
                            {project.description}
                        </p>
                    </div>
                )}

                {/* Recent Activities */}
                <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Actividad Reciente
                    </h4>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">Proyecto creado</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(project.startDate).toLocaleDateString('es-ES')}
                                </p>
                            </div>
                        </div>
                        {project.progress > 0 && (
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">Progreso actualizado al {project.progress}%</p>
                                    <p className="text-xs text-gray-500">Hace 2 días</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    )
}
