'use client'

import Layout from '../../../components/Layout'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '../../../components/ToastProvider'
import Link from 'next/link'
import Pagination from '@/components/ui/Pagination'

interface TimeEntry {
    id: string
    date: string
    startTime: string
    endTime: string
    duration: number
    description: string
    location: string
    status: string
    employee: {
        id: string
        firstName: string
        lastName: string
        position?: string
    }
    project: {
        id: string
        name: string
        code?: string
    }
}

export default function TimeTrackingReports() {
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
    const [loading, setLoading] = useState(false)
    const { data: session } = useSession()
    const toast = useToast()

    // Report filters
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [employeeFilter, setEmployeeFilter] = useState('all')
    const [projectFilter, setProjectFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    // Pagination states for employee summary
    const [employeePage, setEmployeePage] = useState(1)
    const [employeeItemsPerPage, setEmployeeItemsPerPage] = useState(5)

    // Reset employee pagination when filters change
    useEffect(() => {
        setEmployeePage(1)
    }, [dateFrom, dateTo, employeeFilter, projectFilter, statusFilter])

    useEffect(() => {
        const today = new Date()
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

        setDateFrom(firstDayOfMonth.toISOString().split('T')[0])
        setDateTo(lastDayOfMonth.toISOString().split('T')[0])

        loadTimeEntries()
    }, [session])

    const loadTimeEntries = async () => {
        if (!session?.user?.organizationId) return

        setLoading(true)
        try {
            const res = await fetch(`/api/time-tracking?organizationId=${session.user.organizationId}`)
            if (!res.ok) throw new Error('Error loading time entries')
            const data = await res.json()
            setTimeEntries(data)
        } catch (error: any) {
            console.error(error)
            toast.error('Error al cargar los registros de tiempo')
        } finally {
            setLoading(false)
        }
    }

    const filteredEntries = useMemo(() => {
        return timeEntries.filter(entry => {
            const entryDate = new Date(entry.date)
            const fromDate = dateFrom ? new Date(dateFrom) : null
            const toDate = dateTo ? new Date(dateTo) : null

            if (fromDate && entryDate < fromDate) return false
            if (toDate && entryDate > toDate) return false

            if (employeeFilter !== 'all') {
                const fullName = `${entry.employee.firstName} ${entry.employee.lastName}`.trim()
                if (fullName !== employeeFilter) return false
            }

            if (projectFilter !== 'all' && entry.project?.name !== projectFilter) return false
            if (statusFilter !== 'all' && entry.status !== statusFilter) return false

            return true
        })
    }, [timeEntries, dateFrom, dateTo, employeeFilter, projectFilter, statusFilter])

    const reportData = useMemo(() => {
        const totalHours = filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0) / 60, 0)
        const totalDays = new Set(filteredEntries.map(entry => entry.date)).size
        const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0

        const byEmployee = filteredEntries.reduce((acc, entry) => {
            const employeeName = `${entry.employee.firstName} ${entry.employee.lastName}`
            if (!acc[employeeName]) {
                acc[employeeName] = { hours: 0, entries: 0, days: new Set() }
            }
            acc[employeeName].hours += (entry.duration || 0) / 60
            acc[employeeName].entries += 1
            acc[employeeName].days.add(entry.date)
            return acc
        }, {} as Record<string, { hours: number, entries: number, days: Set<string> }>)

        const byProject = filteredEntries.reduce((acc, entry) => {
            const projectName = entry.project?.name || 'Sin proyecto'
            if (!acc[projectName]) {
                acc[projectName] = { hours: 0, entries: 0 }
            }
            acc[projectName].hours += (entry.duration || 0) / 60
            acc[projectName].entries += 1
            return acc
        }, {} as Record<string, { hours: number, entries: number }>)

        return {
            totalHours,
            totalDays,
            avgHoursPerDay,
            byEmployee,
            byProject,
            totalEntries: filteredEntries.length
        }
    }, [filteredEntries])

    // Calculate paginated employees
    const paginatedEmployees = useMemo(() => {
        const employeeEntries = Object.entries(reportData.byEmployee)
        const startIndex = (employeePage - 1) * employeeItemsPerPage
        const endIndex = startIndex + employeeItemsPerPage
        return employeeEntries.slice(startIndex, endIndex)
    }, [reportData.byEmployee, employeePage, employeeItemsPerPage])

    const totalEmployeePages = Math.ceil(Object.keys(reportData.byEmployee).length / employeeItemsPerPage)

    const handleExportExcel = () => {
        const headers = ['Fecha', 'Empleado', 'Proyecto', 'Entrada', 'Salida', 'Horas', 'Ubicación', 'Estado', 'Descripción']
        const csvData = filteredEntries.map(entry => [
            entry.date ? new Date(entry.date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : '',
            `${entry.employee.firstName} ${entry.employee.lastName}`,
            entry.project?.name || '',
            entry.startTime ? new Date(entry.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }) : '',
            entry.endTime ? new Date(entry.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }) : '',
            entry.duration ? (entry.duration / 60).toFixed(2) : '',
            entry.location || '',
            entry.status,
            entry.description || ''
        ])

        const csvContent = [headers, ...csvData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `reporte_horas_${dateFrom}_a_${dateTo}.csv`
        link.click()
        toast.success('Archivo CSV descargado exitosamente')
    }

    const handleExportEmployeeExcel = () => {
        const headers = ['Empleado', 'Horas Totales', 'Días Trabajados', 'Registros', 'Promedio Diario']
        const csvData = Object.entries(reportData.byEmployee).map(([employee, data]) => [
            employee,
            data.hours.toFixed(1),
            data.days.size.toString(),
            data.entries.toString(),
            data.days.size > 0 ? (data.hours / data.days.size).toFixed(1) : '0.0'
        ])

        const csvContent = [headers, ...csvData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `resumen_empleados_${dateFrom}_a_${dateTo}.csv`
        link.click()
        toast.success('Resumen de empleados CSV descargado exitosamente')
    }

    const handleExportProjectExcel = () => {
        const headers = ['Proyecto', 'Horas Totales', 'Registros']
        const csvData = Object.entries(reportData.byProject).map(([project, data]) => [
            project,
            data.hours.toFixed(1),
            data.entries.toString()
        ])

        const csvContent = [headers, ...csvData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `resumen_proyectos_${dateFrom}_a_${dateTo}.csv`
        link.click()
        toast.success('Resumen de proyectos CSV descargado exitosamente')
    }

    const handleExportEmployeePDF = async () => {
        try {
            // Import jsPDF dynamically to avoid SSR issues
            const jsPDF = (await import('jspdf')).default
            const doc = new jsPDF()

            // Title
            doc.setFontSize(18)
            doc.text('Resumen por Empleado', 20, 20)

            // Date range
            doc.setFontSize(12)
            doc.text(`Período: ${dateFrom} - ${dateTo}`, 20, 35)

            // Table headers
            let yPosition = 50
            doc.setFontSize(10)
            doc.text('Empleado', 20, yPosition)
            doc.text('Horas Totales', 100, yPosition)
            doc.text('Días Trabajados', 140, yPosition)
            doc.text('Registros', 175, yPosition)

            // Table data
            yPosition += 10
            Object.entries(reportData.byEmployee).forEach(([employee, data]) => {
                if (yPosition > 270) { // New page if needed
                    doc.addPage()
                    yPosition = 20
                }

                doc.text(employee.substring(0, 25), 20, yPosition)
                doc.text(`${data.hours.toFixed(1)}h`, 100, yPosition)
                doc.text(data.days.size.toString(), 140, yPosition)
                doc.text(data.entries.toString(), 175, yPosition)

                yPosition += 8
            })

            // Save the PDF
            doc.save(`resumen_empleados_${dateFrom}_a_${dateTo}.pdf`)
            toast.success('Resumen de empleados PDF descargado exitosamente')
        } catch (error) {
            console.error('Error generating employee PDF:', error)
            toast.error('Error al generar el PDF de empleados')
        }
    }

    const handleExportPDF = async () => {
        try {
            // Import jsPDF dynamically to avoid SSR issues
            const jsPDF = (await import('jspdf')).default
            const doc = new jsPDF()

            // Title
            doc.setFontSize(18)
            doc.text('Reporte de Control de Horas', 20, 20)

            // Date range
            doc.setFontSize(12)
            doc.text(`Período: ${dateFrom} - ${dateTo}`, 20, 35)

            // Summary data
            doc.text(`Total Horas: ${reportData.totalHours.toFixed(1)}h`, 20, 50)
            doc.text(`Días Trabajados: ${reportData.totalDays}`, 20, 60)
            doc.text(`Promedio Diario: ${reportData.avgHoursPerDay.toFixed(1)}h`, 20, 70)
            doc.text(`Total Registros: ${reportData.totalEntries}`, 20, 80)

            // Table headers
            let yPosition = 100
            doc.setFontSize(10)
            doc.text('Fecha', 20, yPosition)
            doc.text('Empleado', 50, yPosition)
            doc.text('Proyecto', 100, yPosition)
            doc.text('Entrada', 140, yPosition)
            doc.text('Salida', 165, yPosition)

            // Table data
            yPosition += 10
            filteredEntries.forEach((entry, index) => {
                if (yPosition > 270) { // New page if needed
                    doc.addPage()
                    yPosition = 20
                }

                const fecha = entry.date ? new Date(entry.date).toLocaleDateString('es-ES') : ''
                const empleado = `${entry.employee.firstName} ${entry.employee.lastName}`
                const proyecto = entry.project?.name || ''
                const entrada = entry.startTime ? new Date(entry.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''
                const salida = entry.endTime ? new Date(entry.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''

                doc.text(fecha, 20, yPosition)
                doc.text(empleado.substring(0, 15), 50, yPosition)
                doc.text(proyecto.substring(0, 20), 100, yPosition)
                doc.text(entrada, 140, yPosition)
                doc.text(salida, 165, yPosition)

                yPosition += 8
            })

            // Save the PDF
            doc.save(`reporte_horas_${dateFrom}_a_${dateTo}.pdf`)
            toast.success('Archivo PDF descargado exitosamente')
        } catch (error) {
            console.error('Error generating PDF:', error)
            toast.error('Error al generar el PDF')
        }
    }

    const handleExportProjectPDF = async () => {
        try {
            // Import jsPDF dynamically to avoid SSR issues
            const jsPDF = (await import('jspdf')).default
            const doc = new jsPDF()

            // Title
            doc.setFontSize(18)
            doc.text('Resumen por Proyecto', 20, 20)

            // Date range
            doc.setFontSize(12)
            doc.text(`Período: ${dateFrom} - ${dateTo}`, 20, 35)

            // Table headers
            let yPosition = 50
            doc.setFontSize(10)
            doc.text('Proyecto', 20, yPosition)
            doc.text('Horas Totales', 120, yPosition)
            doc.text('Registros', 160, yPosition)

            // Table data
            yPosition += 10
            Object.entries(reportData.byProject).forEach(([project, data]) => {
                if (yPosition > 270) { // New page if needed
                    doc.addPage()
                    yPosition = 20
                }

                doc.text(project.substring(0, 30), 20, yPosition)
                doc.text(`${data.hours.toFixed(1)}h`, 120, yPosition)
                doc.text(data.entries.toString(), 160, yPosition)

                yPosition += 8
            })

            // Save the PDF
            doc.save(`resumen_proyectos_${dateFrom}_a_${dateTo}.pdf`)
            toast.success('Resumen de proyectos PDF descargado exitosamente')
        } catch (error) {
            console.error('Error generating project PDF:', error)
            toast.error('Error al generar el PDF de proyectos')
        }
    }

    const uniqueEmployees = useMemo(() => {
        return Array.from(new Set(timeEntries.map(entry =>
            `${entry.employee.firstName} ${entry.employee.lastName}`.trim()
        ))).sort()
    }, [timeEntries])

    const uniqueProjects = useMemo(() => {
        return Array.from(new Set(timeEntries.map(entry =>
            entry.project?.name || 'Sin proyecto'
        ).filter(Boolean))).sort()
    }, [timeEntries])

    const uniqueStatuses = useMemo(() => {
        return Array.from(new Set(timeEntries.map(entry => entry.status))).sort()
    }, [timeEntries])

    return (
        <Layout
            title="Reportes de Control de Horas"
            subtitle="Análisis y exportación de datos de tiempo"
        >
            {/* Navigation Back Button */}
            <div className="mb-6">
                <Link
                    href="/time-tracking"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver al Control de Horas
                </Link>
            </div>

            <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros del Reporte</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Desde
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Hasta
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Empleado
                            </label>
                            <select
                                value={employeeFilter}
                                onChange={(e) => setEmployeeFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todos los empleados</option>
                                {uniqueEmployees.map(employee => (
                                    <option key={employee} value={employee}>{employee}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Proyecto
                            </label>
                            <select
                                value={projectFilter}
                                onChange={(e) => setProjectFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todos los proyectos</option>
                                {uniqueProjects.map(project => (
                                    <option key={project} value={project}>{project}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todos los estados</option>
                                {uniqueStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Horas</dt>
                                <dd className="text-2xl font-semibold text-gray-900">
                                    {reportData.totalHours.toFixed(1)}h
                                </dd>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <dt className="text-sm font-medium text-gray-500 truncate">Días Trabajados</dt>
                                <dd className="text-2xl font-semibold text-gray-900">
                                    {reportData.totalDays}
                                </dd>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <dt className="text-sm font-medium text-gray-500 truncate">Promedio Diario</dt>
                                <dd className="text-2xl font-semibold text-gray-900">
                                    {reportData.avgHoursPerDay.toFixed(1)}h
                                </dd>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <dt className="text-sm font-medium text-gray-500 truncate">Registros</dt>
                                <dd className="text-2xl font-semibold text-gray-900">
                                    {reportData.totalEntries}
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Employee Breakdown */}
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Resumen por Empleado</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Empleado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Horas Totales
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Días Trabajados
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Registros
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Promedio Diario
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedEmployees.map(([employee, data]) => (
                                    <tr key={employee} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {employee}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {data.hours.toFixed(1)}h
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {data.days.size}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {data.entries}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {data.days.size > 0 ? (data.hours / data.days.size).toFixed(1) : '0.0'}h
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination for Employee Summary */}
                    {Object.keys(reportData.byEmployee).length > 0 && (
                        <Pagination
                            currentPage={employeePage}
                            totalPages={totalEmployeePages}
                            itemsPerPage={employeeItemsPerPage}
                            totalItems={Object.keys(reportData.byEmployee).length}
                            onPageChange={setEmployeePage}
                            onItemsPerPageChange={setEmployeeItemsPerPage}
                            onExportExcel={handleExportEmployeeExcel}
                            onExportPDF={handleExportEmployeePDF}
                        />
                    )}
                </div>

                {/* Project Breakdown */}
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Resumen por Proyecto</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Proyecto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Horas Totales
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Registros
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {Object.entries(reportData.byProject).map(([project, data]) => (
                                    <tr key={project} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {project}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {data.hours.toFixed(1)}h
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {data.entries}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* General Pagination with Export Buttons */}
            <div className="mt-6">
                <Pagination
                    currentPage={1}
                    totalPages={1}
                    itemsPerPage={filteredEntries.length}
                    totalItems={filteredEntries.length}
                    onPageChange={() => { }}
                    onItemsPerPageChange={() => { }}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />
            </div>
        </Layout>
    )
}
