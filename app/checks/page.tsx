'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { CheckCircleIcon, XCircleIcon, ClockIcon, PlusIcon, DocumentArrowDownIcon, DocumentArrowUpIcon, ExclamationTriangleIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import Layout from '@/components/Layout'
import Pagination from '@/components/ui/Pagination'

interface Check {
    id: string
    checkNumber: string
    amount: number
    currency: string
    issuerName: string
    status: 'ISSUED' | 'PENDING' | 'CLEARED' | 'REJECTED' | 'CANCELLED'
    issueDate: string
    dueDate: string
    cashBox?: { name: string }
    bankAccount?: { name: string }
    receivedFrom?: string
    issuedTo?: string
}

export default function ChecksPage() {
    const { data: session } = useSession()
    const [checks, setChecks] = useState<Check[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('')
    const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchChecks()
    }, [filter, currentPage, itemsPerPage])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const fetchChecks = async () => {
        try {
            const params = new URLSearchParams()
            if (filter) params.append('status', filter)
            params.append('page', currentPage.toString())
            params.append('limit', itemsPerPage.toString())

            const response = await fetch(`/api/checks?${params}`)
            const data = await response.json()
            setChecks(data.checks || [])
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                pages: data.pagination?.pages || 0
            }))
        } catch (error) {
            console.error('Error fetching checks:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        setPagination(prev => ({ ...prev, page: newPage }))
    }

    const handleLimitChange = (newLimit: number) => {
        setItemsPerPage(newLimit)
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
        setCurrentPage(1)
    }

    const handleImportExcel = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    const handleExportExcel = () => {
        handleExport('excel')
    }

    const handleExportPDF = () => {
        handleExport('pdf')
    }

    const handleExport = async (format: 'excel' | 'pdf') => {
        try {
            setExporting(format)
            const params = new URLSearchParams()
            if (filter) params.append('status', filter)

            const response = await fetch(`/api/checks/export/${format}?${params}`)
            if (!response.ok) {
                throw new Error('Error al exportar')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `cheques_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Error exporting:', error)
            alert('Error al exportar los cheques')
        } finally {
            setExporting(null)
        }
    }

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setImporting(true)
            setImportResult(null)

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/checks/import/excel', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()

            if (response.ok) {
                setImportResult({
                    success: true,
                    message: result.message,
                    errors: result.errors
                })
                // Recargar la lista de cheques
                await fetchChecks()
            } else {
                setImportResult({
                    success: false,
                    message: result.error || 'Error al importar',
                    errors: result.errors
                })
            }
        } catch (error) {
            console.error('Error importing:', error)
            setImportResult({
                success: false,
                message: 'Error al importar el archivo'
            })
        } finally {
            setImporting(false)
            // Limpiar el input file
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const toggleDropdown = (checkId: string) => {
        setOpenDropdownId(openDropdownId === checkId ? null : checkId)
    }

    const handleViewCheck = (check: Check) => {
        setOpenDropdownId(null)
        // Navegar a la página de detalle del cheque
        window.location.href = `/checks/${check.id}`
    }

    const handleEditCheck = (check: Check) => {
        setOpenDropdownId(null)
        // Por ahora redirigir a la página de detalle, después se puede implementar edición
        window.location.href = `/checks/${check.id}`
    }

    const handleDeleteCheck = async (check: Check) => {
        setOpenDropdownId(null)
        if (!confirm(`¿Estás seguro de que quieres eliminar el cheque ${check.checkNumber}? Esta acción no se puede deshacer.`)) {
            return
        }

        try {
            const response = await fetch(`/api/checks/${check.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                // Recargar la lista de cheques
                await fetchChecks()
                alert('Cheque eliminado exitosamente')
            } else {
                const error = await response.json()
                alert(error.error || 'Error al eliminar el cheque')
            }
        } catch (error) {
            console.error('Error deleting check:', error)
            alert('Error al eliminar el cheque')
        }
    }

    const handleStatusChange = async (checkId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/checks/${checkId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                // Recargar la lista de cheques
                await fetchChecks()
            } else {
                const error = await response.json()
                alert(error.error || 'Error al actualizar el estado del cheque')
            }
        } catch (error) {
            console.error('Error updating check status:', error)
            alert('Error al actualizar el estado del cheque')
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'CLEARED':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />
            case 'REJECTED':
                return <XCircleIcon className="h-5 w-5 text-red-500" />
            case 'PENDING':
                return <ClockIcon className="h-5 w-5 text-yellow-500" />
            default:
                return <ClockIcon className="h-5 w-5 text-gray-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        const colors = {
            ISSUED: 'bg-blue-100 text-blue-800',
            PENDING: 'bg-yellow-100 text-yellow-800',
            CLEARED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            CANCELLED: 'bg-gray-100 text-gray-800'
        }
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    }

    const getStatusText = (status: string) => {
        const texts = {
            ISSUED: 'Emitido',
            PENDING: 'Pendiente',
            CLEARED: 'Cobrado',
            REJECTED: 'Rechazado',
            CANCELLED: 'Cancelado'
        }
        return texts[status as keyof typeof texts] || status
    }

    if (loading) {
        return (
            <Layout title="Cheques" subtitle="Gestiona todos los cheques emitidos y recibidos">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Cargando cheques...</span>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Cheques" subtitle="Gestiona todos los cheques emitidos y recibidos">
            {/* Input file oculto para importación */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                disabled={importing}
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                    <p className="mt-2 text-sm text-gray-600">
                        Gestiona todos los cheques emitidos y recibidos en tu organización
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <Link
                        href="/checks/new"
                        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Nuevo Cheque
                    </Link>
                </div>
            </div>

            {/* Resultado de importación */}
            {importResult && (
                <div className={`rounded-md p-4 ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {importResult.success ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                            ) : (
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                            )}
                        </div>
                        <div className="ml-3">
                            <h3 className={`text-sm font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                {importResult.success ? 'Importación exitosa' : 'Error en la importación'}
                            </h3>
                            <div className={`mt-2 text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                <p>{importResult.message}</p>
                                {importResult.errors && importResult.errors.length > 0 && (
                                    <ul className="mt-2 list-disc list-inside">
                                        {importResult.errors.slice(0, 5).map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                        {importResult.errors.length > 5 && (
                                            <li>... y {importResult.errors.length - 5} errores más</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={() => setImportResult(null)}
                                    className="text-sm font-medium text-gray-600 hover:text-gray-500"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                    <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                        Filtrar por estado:
                    </label>
                    <select
                        id="status-filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    >
                        <option value="">Todos los estados</option>
                        <option value="ISSUED">Emitidos</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="CLEARED">Cobrados</option>
                        <option value="REJECTED">Rechazados</option>
                        <option value="CANCELLED">Cancelados</option>
                    </select>
                </div>
            </div>

            {/* Tabla de cheques */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Número
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Monto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Moneda
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Emisor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Emisión
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vencimiento
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Receptor/Origen
                                </th>
                                <th className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {checks.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <ClockIcon className="h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">No hay cheques</h3>
                                            <p className="text-sm text-gray-500 mb-4">
                                                {filter ? `No se encontraron cheques con estado "${filter}"` : 'Aún no has creado ningún cheque'}
                                            </p>
                                            {!filter && (
                                                <Link
                                                    href="/checks/new"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <PlusIcon className="h-4 w-4 mr-2" />
                                                    Crear primer cheque
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                checks.map((check) => (
                                    <tr key={check.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {check.checkNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {check.amount.toLocaleString('es-ES')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                {check.currency}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {check.issuerName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={check.status}
                                                onChange={(e) => handleStatusChange(check.id, e.target.value)}
                                                className="text-sm border-0 bg-transparent focus:ring-0 focus:outline-none cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
                                            >
                                                <option value="ISSUED">Emitido</option>
                                                <option value="PENDING">Pendiente</option>
                                                <option value="CLEARED">Cobrado</option>
                                                <option value="REJECTED">Rechazado</option>
                                                <option value="CANCELLED">Cancelado</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(check.issueDate).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(check.dueDate).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {check.issuedTo || check.receivedFrom || (check.cashBox?.name || check.bankAccount?.name) || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleDropdown(check.id)
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                                >
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </button>
                                                {openDropdownId === check.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                                        <div className="py-1">
                                                            <button
                                                                onClick={() => handleViewCheck(check)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            >
                                                                <EyeIcon className="h-4 w-4 mr-2" />
                                                                Ver Detalles
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditCheck(check)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            >
                                                                <PencilIcon className="h-4 w-4 mr-2" />
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCheck(check)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            >
                                                                <TrashIcon className="h-4 w-4 mr-2" />
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Component */}
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={pagination.pages}
                        itemsPerPage={itemsPerPage}
                        totalItems={pagination.total}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleLimitChange}
                        onImportExcel={handleImportExcel}
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                    />
                </div>
            </div>
        </Layout>
    )
}