'use client'

import { useState } from 'react'

interface ReportModalProps {
    isOpen: boolean
    onClose: () => void
    inspections: any[]
}

export default function ReportModal({ isOpen, onClose, inspections }: ReportModalProps) {
    const [reportType, setReportType] = useState('general')
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    })
    const [filters, setFilters] = useState({
        project: '',
        type: '',
        status: '',
        inspector: ''
    })

    const generateReport = () => {
        // Filter inspections based on criteria
        let filteredInspections = inspections

        if (filters.project) {
            filteredInspections = filteredInspections.filter(i => i.project === filters.project)
        }
        if (filters.type) {
            filteredInspections = filteredInspections.filter(i => i.type === filters.type)
        }
        if (filters.status) {
            filteredInspections = filteredInspections.filter(i => i.status === filters.status)
        }
        if (filters.inspector) {
            filteredInspections = filteredInspections.filter(i => i.inspector === filters.inspector)
        }

        if (dateRange.start && dateRange.end) {
            filteredInspections = filteredInspections.filter(i => {
                const inspectionDate = new Date(i.scheduledDate)
                const startDate = new Date(dateRange.start)
                const endDate = new Date(dateRange.end)
                return inspectionDate >= startDate && inspectionDate <= endDate
            })
        }

        // Generate report data
        const reportData = {
            type: reportType,
            generatedAt: new Date().toISOString(),
            filters: { ...filters, dateRange },
            summary: {
                total: filteredInspections.length,
                completed: filteredInspections.filter(i => i.status === 'Completada').length,
                inProgress: filteredInspections.filter(i => i.status === 'En proceso').length,
                scheduled: filteredInspections.filter(i => i.status === 'Programada').length,
                pending: filteredInspections.filter(i => i.status === 'Pendiente').length
            },
            inspections: filteredInspections
        }

        // In a real app, this would generate a PDF or Excel file
        console.log('Generated Report:', reportData)

        // For now, just download as JSON
        const dataStr = JSON.stringify(reportData, null, 2)
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

        const exportFileDefaultName = `reporte-inspecciones-${new Date().toISOString().split('T')[0]}.json`

        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()

        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Generar Reporte de Inspecciones</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Report Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Reporte
                        </label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="general">General</option>
                            <option value="completed">Completadas</option>
                            <option value="pending">Pendientes</option>
                            <option value="by-project">Por Proyecto</option>
                            <option value="by-inspector">Por Inspector</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rango de Fechas
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Desde</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filtros
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={filters.project}
                                onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos los proyectos</option>
                                <option value="Residencial Los Álamos">Residencial Los Álamos</option>
                                <option value="Centro Comercial Plaza">Centro Comercial Plaza</option>
                                <option value="Oficinas Corporativas">Oficinas Corporativas</option>
                            </select>

                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos los tipos</option>
                                <option value="Estructural">Estructural</option>
                                <option value="Instalaciones">Instalaciones</option>
                                <option value="Final">Final</option>
                                <option value="Seguridad">Seguridad</option>
                            </select>

                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos los estados</option>
                                <option value="Programada">Programada</option>
                                <option value="En proceso">En proceso</option>
                                <option value="Completada">Completada</option>
                                <option value="Pendiente">Pendiente</option>
                            </select>

                            <select
                                value={filters.inspector}
                                onChange={(e) => setFilters({ ...filters, inspector: e.target.value })}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos los inspectores</option>
                                <option value="Dr. Ana Martínez">Dr. Ana Martínez</option>
                                <option value="Ing. Carlos Ruiz">Ing. Carlos Ruiz</option>
                                <option value="Dra. Laura Sánchez">Dra. Laura Sánchez</option>
                                <option value="Sr. Miguel Torres">Sr. Miguel Torres</option>
                            </select>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Vista Previa</h3>
                        <div className="text-sm text-gray-600">
                            <p>Inspecciones encontradas: {inspections.length}</p>
                            <p>Tipo de reporte: {reportType}</p>
                            {dateRange.start && dateRange.end && (
                                <p>Rango: {dateRange.start} - {dateRange.end}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={generateReport}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        Generar Reporte
                    </button>
                </div>
            </div>
        </div>
    )
}
