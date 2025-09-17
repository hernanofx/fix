'use client'

import Layout from '../../components/Layout'
import EvaluationFormModal from '../../components/modals/EvaluationFormModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '@/components/ui/Pagination'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '../../components/ToastProvider'

function EvaluationsContent() {
    const { data: session } = useSession()
    const toast = useToast()
    const [evaluations, setEvaluations] = useState<any[]>([])
    const [modals, setModals] = useState({ create: false, edit: false, delete: false })
    const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null)
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
    const searchParams = useSearchParams()

    // Estados para filtrado y ordenamiento
    const [ratingFilter, setRatingFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('evaluationDate')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Obtener parámetros de búsqueda de la URL
    const modalType = searchParams.get('modal')
    const evaluationId = searchParams.get('id')

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/evaluations')
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Failed to load evaluations'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const data = await res.json()
                setEvaluations(data)
            } catch (err: any) {
                console.error(err)
                toast.error(err.message || 'No se pudieron cargar las evaluaciones')
            }
        }
        load()
    }, [])

    // Check URL parameters for automatic modal opening
    useEffect(() => {
        const modal = searchParams.get('modal')
        if (modal === 'create') {
            openModal('create')
        }
    }, [searchParams])

    // Lógica de filtrado y ordenamiento (sin paginación para estadísticas)
    const filteredEvaluations = useMemo(() => {
        let filtered = evaluations

        // Aplicar filtro de calificación
        if (ratingFilter !== 'all') {
            const [min, max] = ratingFilter.split('-').map(Number)
            filtered = filtered.filter(evaluation => {
                const rating = evaluation.overallRating || 0
                if (ratingFilter === 'excellent') return rating >= 4.5
                if (ratingFilter === 'good') return rating >= 3.5 && rating < 4.5
                if (ratingFilter === 'average') return rating >= 2.5 && rating < 3.5
                if (ratingFilter === 'poor') return rating < 2.5
                return rating >= min && rating <= max
            })
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            // Manejar casos especiales
            if (sortField === 'evaluationDate') {
                aValue = new Date(aValue || 0).getTime()
                bValue = new Date(bValue || 0).getTime()
            } else if (sortField === 'overallRating') {
                aValue = aValue || 0
                bValue = bValue || 0
            } else if (sortField === 'employeeName' || sortField === 'evaluator') {
                aValue = (aValue || '').toString().toLowerCase()
                bValue = (bValue || '').toString().toLowerCase()
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [evaluations, ratingFilter, sortField, sortDirection])

    // Datos paginados para mostrar en la tabla
    const paginatedEvaluations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredEvaluations.slice(startIndex, endIndex)
    }, [filteredEvaluations, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [ratingFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredEvaluations.length / itemsPerPage)

    // Función para cambiar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = () => setDropdownOpen(null)
        if (dropdownOpen) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [dropdownOpen])

    const openModal = (modalType: keyof typeof modals, evaluation?: any) => {
        setSelectedEvaluation(evaluation)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedEvaluation(null)
    }

    const handleSaveEvaluation = async (evaluationData: any) => {
        try {
            if (selectedEvaluation) {
                const res = await fetch(`/api/evaluations/${selectedEvaluation.id}`, { method: 'PUT', body: JSON.stringify(evaluationData) })
                const updated = await res.json()
                setEvaluations(evaluations.map(e => e.id === selectedEvaluation.id ? updated : e))
                toast.success('Evaluación actualizada')
            } else {
                const res = await fetch('/api/evaluations', { method: 'POST', body: JSON.stringify(evaluationData) })
                const created = await res.json()
                setEvaluations([created, ...evaluations])
                toast.success('Evaluación creada')
            }
            closeModal('create')
            closeModal('edit')
        } catch (err) {
            console.error('Save evaluation error', err)
            toast.error('Error al guardar la evaluación')
        }
    }

    const handleDeleteEvaluation = async () => {
        try {
            if (!selectedEvaluation) return
            await fetch(`/api/evaluations/${selectedEvaluation.id}`, { method: 'DELETE' })
            setEvaluations(evaluations.filter(e => e.id !== selectedEvaluation.id))
            toast.success('Evaluación eliminada')
            closeModal('delete')
        } catch (err) {
            console.error('Delete evaluation error', err)
            toast.error('Error al eliminar la evaluación')
        }
    }

    // Export to CSV (Excel-compatible) for evaluations
    const handleExportExcel = () => {
        try {
            const rows = filteredEvaluations.map(ev => ({
                Empleado: ev.employeeName || '',
                Puesto: ev.employeePosition || '',
                Fecha: ev.evaluationDate ? new Date(ev.evaluationDate).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : '',
                Periodo: ev.evaluationPeriod || '',
                Evaluador: ev.evaluator || '',
                Calificacion: ev.overallRating || '',
                Fortalezas: ev.strengths || '',
                AreasDeMejora: ev.areasForImprovement || '',
                Comentarios: ev.comments || ''
            }))

            if (rows.length === 0) {
                alert('No hay evaluaciones para exportar')
                return
            }

            const headers = Object.keys(rows[0])
            const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${(r as any)[h]?.toString().replace(/"/g, '""') || ''}"`).join(','))).join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `evaluaciones_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Error exporting evaluations to Excel', err)
            alert('Error al exportar evaluaciones')
        }
    }

    // Export to PDF by opening printable HTML (user can Save as PDF)
    const handleExportPDF = () => {
        try {
            if (filteredEvaluations.length === 0) {
                alert('No hay evaluaciones para exportar')
                return
            }

            const html = `
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Evaluaciones</title>
                    <style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style>
                </head>
                <body>
                    <h2>Evaluaciones</h2>
                    <table>
                        <thead><tr>${['Empleado', 'Puesto', 'Fecha', 'Periodo', 'Evaluador', 'Calificacion', 'Fortalezas', 'AreasDeMejora'].map(h => `<th>${h}</th>`).join('')}</tr></thead>
                        <tbody>
                        ${filteredEvaluations.map(ev => `<tr>
                            <td>${ev.employeeName || ''}</td>
                            <td>${ev.employeePosition || ''}</td>
                            <td>${ev.evaluationDate ? new Date(ev.evaluationDate).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : ''}</td>
                            <td>${ev.evaluationPeriod || ''}</td>
                            <td>${ev.evaluator || ''}</td>
                            <td>${ev.overallRating || ''}</td>
                            <td>${(ev.strengths || '').toString().replace(/\n/g, '<br/>')}</td>
                            <td>${(ev.areasForImprovement || '').toString().replace(/\n/g, '<br/>')}</td>
                        </tr>`).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `

            const w = window.open('', '_blank')
            if (!w) {
                alert('El navegador bloqueó la apertura de nueva ventana. Permite popups para exportar PDF.')
                return
            }
            w.document.open()
            w.document.write(html)
            w.document.close()
            w.print()
        } catch (err) {
            console.error('Error exporting evaluations to PDF', err)
            alert('Error al exportar evaluaciones a PDF')
        }
    }

    const getRatingColor = (rating: number) => {
        if (rating >= 4.5) return 'text-green-600 bg-green-100'
        if (rating >= 3.5) return 'text-blue-600 bg-blue-100'
        if (rating >= 2.5) return 'text-yellow-600 bg-yellow-100'
        return 'text-red-600 bg-red-100'
    }

    const getRatingText = (rating: number) => {
        if (rating >= 4.5) return 'Excelente'
        if (rating >= 3.5) return 'Muy Bueno'
        if (rating >= 2.5) return 'Bueno'
        if (rating >= 1.5) return 'Mejorable'
        return 'Deficiente'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const getAverageRating = () => {
        if (filteredEvaluations.length === 0) return 0
        const sum = filteredEvaluations.reduce((total, evaluation) => total + (evaluation.overallRating || 0), 0)
        return (sum / filteredEvaluations.length).toFixed(1)
    }

    const getRatingDistribution = () => {
        const distribution = { excellent: 0, good: 0, average: 0, poor: 0 }
        filteredEvaluations.forEach(evaluation => {
            if (evaluation.overallRating >= 4.5) distribution.excellent++
            else if (evaluation.overallRating >= 3.5) distribution.good++
            else if (evaluation.overallRating >= 2.5) distribution.average++
            else distribution.poor++
        })
        return distribution
    }

    const distribution = getRatingDistribution()

    return (
        <Layout
            title="Evaluaciones"
            subtitle="Gestiona las evaluaciones de desempeño de empleados"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div></div>
                <button
                    onClick={() => openModal('create')}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Nueva Evaluación
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total evaluaciones</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{filteredEvaluations.length}</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Promedio general</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{getAverageRating()}/5</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Excelentes (4.5+)</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{distribution.excellent}</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Necesitan mejora</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{distribution.average + distribution.poor}</dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Calificación:</label>
                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todas</option>
                            <option value="excellent">Excelente (4.5+)</option>
                            <option value="good">Muy Bueno (3.5-4.4)</option>
                            <option value="average">Bueno (2.5-3.4)</option>
                            <option value="poor">Mejorable (&lt;2.5)</option>
                        </select>
                    </div>

                    {/* Active Filters Display */}
                    <div className="flex flex-wrap gap-2">
                        {ratingFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Calificación: {
                                    ratingFilter === 'excellent' ? 'Excelente (4.5+)' :
                                        ratingFilter === 'good' ? 'Muy Bueno (3.5-4.4)' :
                                            ratingFilter === 'average' ? 'Bueno (2.5-3.4)' :
                                                'Mejorable (<2.5)'
                                }
                                <button
                                    onClick={() => setRatingFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>

                    <div className="ml-auto text-sm text-gray-500">
                        Mostrando {paginatedEvaluations.length} de {filteredEvaluations.length} evaluaciones
                    </div>
                </div>
            </div>

            {/* Evaluations Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Evaluaciones de Desempeño</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('employeeName')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Empleado
                                        {sortField === 'employeeName' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('evaluationDate')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Fecha
                                        {sortField === 'evaluationDate' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('evaluator')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Evaluador
                                        {sortField === 'evaluator' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('overallRating')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Calificación
                                        {sortField === 'overallRating' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fortalezas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Áreas de Mejora
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedEvaluations.map((evaluation: any) => (
                                <tr key={evaluation.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openModal('edit', evaluation)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {(evaluation.employeeName || '').split(' ').map((n: string) => n[0] || '').join('').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{evaluation.employeeName}</div>
                                                <div className="text-sm text-gray-500">{evaluation.employeePosition}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            <div>{formatDate(evaluation.evaluationDate)}</div>
                                            {evaluation.evaluationPeriod && (
                                                <div className="text-gray-500">{evaluation.evaluationPeriod}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{evaluation.evaluator}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRatingColor(evaluation.overallRating)}`}>
                                            <span className="font-semibold">{evaluation.overallRating}/5</span>
                                            <span className="ml-1">({getRatingText(evaluation.overallRating)})</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate" title={evaluation.strengths}>
                                            {evaluation.strengths}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate" title={evaluation.areasForImprovement}>
                                            {evaluation.areasForImprovement}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDropdownOpen(dropdownOpen === evaluation.id ? null : evaluation.id)
                                                }}
                                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>
                                            {dropdownOpen === evaluation.id && (
                                                <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-48">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openModal('edit', evaluation)
                                                            setDropdownOpen(null)
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Ver/Editar
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openModal('delete', evaluation)
                                                            setDropdownOpen(null)
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Component */}
            <div className="mt-6">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredEvaluations.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />
            </div>

            {/* Modals */}
            <EvaluationFormModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSaveEvaluation}
            />

            <EvaluationFormModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                evaluation={selectedEvaluation}
                onSave={handleSaveEvaluation}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteEvaluation}
                title="Eliminar Evaluación"
                message="¿Estás seguro de que quieres eliminar esta evaluación?"
                itemName={`${selectedEvaluation?.employeeName} - ${selectedEvaluation?.evaluationDate ? formatDate(selectedEvaluation.evaluationDate) : ''}`}
            />
        </Layout>
    )
}

export default function Evaluations() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <EvaluationsContent />
        </Suspense>
    )
}
