"use client"

import Layout from '../../components/Layout'
import CollectionFormModal from '../../components/modals/CollectionFormModal'
import { CollectionImportModal } from '../../components/modals/CollectionImportModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '@/components/ui/Pagination'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function Collections() {
    const { data: session } = useSession()
    const [collections, setCollections] = useState<any[]>([])

    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false,
        payment: false,
        reminder: false
    })

    const [selectedCollection, setSelectedCollection] = useState<any>(null)
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

    // Estados para filtrado y ordenamiento
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [projectFilter, setProjectFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('dueDate')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        const load = async () => {
            try {
                const orgId = session?.user?.organizationId
                const url = orgId ? `/api/collections?organizationId=${orgId}` : '/api/collections'
                const res = await fetch(url)
                if (!res.ok) return
                const data = await res.json()

                // Verificar y actualizar cobranzas vencidas
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const updatedData = await Promise.all(data.map(async (collection: any) => {
                    // Si es PENDING o PARTIAL y la fecha de vencimiento ya pasó, marcar como OVERDUE
                    if ((collection.status === 'PENDING' || collection.status === 'PARTIAL') && collection.dueDate) {
                        const dueDate = new Date(collection.dueDate)
                        dueDate.setHours(0, 0, 0, 0)

                        if (dueDate < today) {
                            try {
                                const updateRes = await fetch(`/api/collections/${collection.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ...collection, status: 'OVERDUE' }),
                                })
                                if (updateRes.ok) {
                                    return { ...collection, status: 'OVERDUE' }
                                }
                            } catch (e) {
                                console.error('Error updating overdue status:', e)
                            }
                        }
                    }
                    return collection
                }))

                setCollections(updatedData)
            } catch (e) {
                console.error(e)
            }
        }
        load()
    }, [session])

    // Lógica de filtrado y ordenamiento (sin paginación para estadísticas)
    const filteredCollections = useMemo(() => {
        let filtered = collections

        // Aplicar filtro de estado
        if (statusFilter !== 'all') {
            filtered = filtered.filter(collection => collection.status === statusFilter)
        }

        // Aplicar filtro de proyecto
        if (projectFilter !== 'all') {
            filtered = filtered.filter(collection => collection.projectId === projectFilter)
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            // Manejar casos especiales
            if (sortField === 'amount') {
                aValue = aValue || 0
                bValue = bValue || 0
            } else if (sortField === 'paidDate') {
                aValue = new Date(aValue || 0).getTime()
                bValue = new Date(bValue || 0).getTime()
            } else if (sortField === 'client') {
                aValue = a.client?.name || ''
                bValue = b.client?.name || ''
            } else if (sortField === 'project') {
                aValue = a.project?.name || ''
                bValue = b.project?.name || ''
            } else if (sortField === 'invoiceId') {
                aValue = (aValue || '').toString()
                bValue = (bValue || '').toString()
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [collections, statusFilter, projectFilter, sortField, sortDirection])

    // Datos paginados para mostrar
    const paginatedCollections = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredCollections.slice(startIndex, endIndex)
    }, [filteredCollections, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, projectFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredCollections.length / itemsPerPage)

    // Obtener estados únicos para el filtro
    const uniqueStatuses = useMemo(() => {
        const statuses = collections.map(c => c.status).filter(Boolean)
        return Array.from(new Set(statuses)).sort()
    }, [collections])

    // Obtener proyectos únicos para el filtro
    const uniqueProjects = useMemo(() => {
        const projects = collections
            .map(c => c.project)
            .filter(Boolean)
            .filter(project => project && project.name) // Asegurar que tenga nombre
        return Array.from(new Set(projects.map(p => p!.id)))
            .map(id => projects.find(p => p!.id === id)!)
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [collections])

    // Función para cambiar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            // Solo cerrar si no se hizo click dentro de ningún dropdown
            const clickedInsideDropdown = document.querySelector('.dropdown-container')?.contains(target)
            if (!clickedInsideDropdown) {
                setOpenDropdownId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleDropdown = (id: string) => {
        setOpenDropdownId(openDropdownId === id ? null : id)
    }

    const openModal = async (modalType: keyof typeof modals, collection?: any) => {
        setSelectedCollection(null)
        if (modalType === 'edit' && collection?.id) {
            try {
                const res = await fetch(`/api/collections/${collection.id}`)
                if (res.ok) {
                    setSelectedCollection(await res.json())
                } else setSelectedCollection(collection)
            } catch (e) {
                setSelectedCollection(collection)
            }
        } else {
            setSelectedCollection(collection)
        }
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedCollection(null)
    }

    const handleSaveCollection = async (paymentData: any) => {
        try {
            const orgId = (session as any)?.user?.organizationId
            const userId = (session as any)?.user?.id

            // Verificar si es un array de cobranzas (múltiples) o una sola
            if (Array.isArray(paymentData)) {
                // Crear múltiples cobranzas
                const createdCollections: any[] = []
                for (const collection of paymentData) {
                    const payload = {
                        ...collection,
                        organizationId: orgId,
                        createdById: userId
                    }
                    const res = await fetch('/api/collections', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    })
                    if (!res.ok) throw new Error('create failed')
                    const created = await res.json()
                    createdCollections.push(created)
                }

                // Agregar todas las cobranzas creadas al estado
                setCollections(prev => [...createdCollections, ...prev])
                alert(`${createdCollections.length} cobranzas creadas exitosamente`)
            } else {
                // Crear una sola cobranza
                if (selectedCollection?.id) {
                    const res = await fetch(`/api/collections/${selectedCollection.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(paymentData),
                    })
                    if (!res.ok) throw new Error('update failed')
                    const updated = await res.json()
                    setCollections(cs => cs.map(c => (c.id === updated.id ? updated : c)))
                } else {
                    const payload = {
                        ...paymentData,
                        organizationId: orgId,
                        createdById: userId
                    }
                    const res = await fetch('/api/collections', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    })
                    if (!res.ok) throw new Error('create failed')
                    const created = await res.json()
                    setCollections(prev => [created, ...prev])
                }
            }

            closeModal('create')
            closeModal('edit')
        } catch (e) {
            console.error(e)
            throw e // Re-throw para que el modal sepa que hubo un error
        }
    }

    const handleDeleteCollection = async () => {
        try {
            if (!selectedCollection?.id) return
            const res = await fetch(`/api/collections/${selectedCollection.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('delete failed')

            setCollections(prev => prev.filter(c => c.id !== selectedCollection.id))
            setSelectedCollection(null)
            closeModal('delete')

            // Disparar evento para actualizar otras páginas después de eliminar exitosamente
            console.log('🔥 Dispatching treasury:transactionDeleted event from collections', {
                type: 'collection',
                id: selectedCollection.id,
                cashBoxId: selectedCollection.cashBoxId,
                bankAccountId: selectedCollection.bankAccountId,
                amount: selectedCollection.amount,
                currency: selectedCollection.currency
            })

            window.dispatchEvent(new CustomEvent('treasury:transactionDeleted', {
                detail: {
                    type: 'collection',
                    id: selectedCollection.id,
                    cashBoxId: selectedCollection.cashBoxId,
                    bankAccountId: selectedCollection.bankAccountId,
                    amount: selectedCollection.amount,
                    currency: selectedCollection.currency
                }
            }))

            alert('Cobranza eliminada exitosamente')
        } catch (e) {
            console.error(e)
            alert('Error al eliminar la cobranza')
        }
    }

    const handleSendReminder = async (collection: any) => {
        try {
            // Simplemente mostrar mensaje por ahora
            alert('Recordatorio enviado exitosamente')
        } catch (e) {
            console.error(e)
            alert('Error al enviar recordatorio')
        }
    }

    const handleMarkAsPaid = async (collection: any) => {
        try {
            const updateData = {
                status: 'PAID',
                paidDate: new Date().toISOString()
            }

            const res = await fetch(`/api/collections/${collection.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            })

            if (!res.ok) throw new Error('update failed')
            const updated = await res.json()
            setCollections(cs => cs.map(c => (c.id === updated.id ? updated : c)))
            alert('Pago marcado como completado')
        } catch (e) {
            console.error(e)
            alert('Error al marcar como pagado')
        }
    }

    const handleImportExcel = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/collections/import/excel', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                alert(`Importación exitosa: ${result.imported} cobranzas importadas`)
                // Recargar los datos
                const orgId = session?.user?.organizationId
                if (orgId) {
                    const res = await fetch(`/api/collections?organizationId=${orgId}`)
                    if (res.ok) {
                        const data = await res.json()
                        setCollections(data)
                    }
                }
            } else {
                const error = await response.json()
                alert(`Error en la importación: ${error.error}`)
            }
        } catch (error) {
            console.error('Error importing Excel:', error)
            alert('Error al importar el archivo Excel')
        }
    }

    const handleFileImport = async (file: File) => {
        setImporting(true)
        try {
            await handleImportExcel(file)
            setShowImportModal(false)
        } catch (error) {
            console.error('Error in file import:', error)
        } finally {
            setImporting(false)
        }
    }

    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams({
                status: statusFilter,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/collections/export/excel?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `cobranzas_${new Date().toISOString().split('T')[0]}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert('Error al exportar a Excel')
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error)
            alert('Error al exportar a Excel')
        }
    }

    const handleExportPDF = async () => {
        try {
            const params = new URLSearchParams({
                status: statusFilter,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/collections/export/pdf?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `cobranzas_${new Date().toISOString().split('T')[0]}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert('Error al exportar a PDF')
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error)
            alert('Error al exportar a PDF')
        }
    }

    const formatAmount = (amount: number, currency?: string) => {
        const formattedAmount = amount?.toLocaleString('en-US') || '0'
        const currencyCode = currency || 'PESOS'
        const currencySymbol = currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : '$'
        return `${currencySymbol}${formattedAmount} ${currencyCode}`
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800'
            case 'PENDING': return 'bg-yellow-100 text-yellow-800'
            case 'PARTIAL': return 'bg-blue-100 text-blue-800'
            case 'OVERDUE': return 'bg-red-100 text-red-800'
            case 'CANCELLED': return 'bg-purple-100 text-purple-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusInSpanish = (status: string) => {
        switch (status) {
            case 'PAID': return 'Pagado'
            case 'PENDING': return 'Pendiente'
            case 'PARTIAL': return 'Parcial'
            case 'OVERDUE': return 'Vencido'
            case 'CANCELLED': return 'Cancelado'
            default: return status
        }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Resetear a medianoche para comparación exacta

    const totalOutstanding = filteredCollections.reduce((sum, collection) => {
        return sum + (collection.status !== 'PAID' ? collection.amount : 0)
    }, 0)

    // Verificar si hay múltiples monedas
    const currencies = Array.from(new Set(filteredCollections.map(c => c.currency).filter(Boolean)))
    const hasMultipleCurrencies = currencies.length > 1

    // Calcular vencidas: status OVERDUE o (PENDING/PARTIAL con fecha de vencimiento pasada)
    const overdueCollections = filteredCollections.filter(c => {
        if (c.status === 'PAID') return false
        if (c.status === 'OVERDUE') return true

        // Si es PENDING o PARTIAL, verificar si la fecha de vencimiento ya pasó
        if ((c.status === 'PENDING' || c.status === 'PARTIAL') && c.dueDate) {
            const dueDate = new Date(c.dueDate)
            dueDate.setHours(0, 0, 0, 0)
            return dueDate < today
        }

        return false
    }).length

    const pendingCollections = filteredCollections.filter(c => {
        if (c.status === 'PAID' || c.status === 'CANCELLED') return false

        // Si es PENDING o PARTIAL, verificar que NO esté vencida
        if ((c.status === 'PENDING' || c.status === 'PARTIAL') && c.dueDate) {
            const dueDate = new Date(c.dueDate)
            dueDate.setHours(0, 0, 0, 0)
            return dueDate >= today
        }

        return c.status === 'PENDING' || c.status === 'PARTIAL'
    }).length

    const paidCollections = filteredCollections.filter(c => c.status === 'PAID').length

    return (
        <Layout
            title="Cobranzas"
            subtitle="Seguimiento y gestión de cobros"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div></div>
                <button
                    onClick={() => openModal('create')}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Nueva Cobranza
                </button>
            </div>

            {/* Dashboard Minimalista con Información Real */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Condiciones de Pago Activas */}
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Condiciones Activas</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredCollections.filter(c => c.paymentTerm).length}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Planes de pago</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {(() => {
                            const termCounts = filteredCollections
                                .filter(c => c.paymentTerm)
                                .reduce((acc, c) => {
                                    const type = c.paymentTerm?.recurrence || 'Otro';
                                    acc[type] = (acc[type] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>);

                            const topTerms = Object.entries(termCounts)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 2);

                            return topTerms.map(([type, count]) => (
                                <div key={type} className="flex justify-between text-xs">
                                    <span className="text-gray-500">{type.toLowerCase()}</span>
                                    <span className="font-medium">{count as number}</span>
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Alertas de Riesgo */}
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Alertas de Riesgo</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredCollections.filter(c => {
                                    if (c.status === 'PAID' || c.status === 'OVERDUE') return false;
                                    if (!c.dueDate) return false;
                                    const dueDate = new Date(c.dueDate);
                                    const today = new Date();
                                    const diffTime = dueDate.getTime() - today.getTime();
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    return diffDays >= 0 && diffDays <= 3;
                                }).length + overdueCollections}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Vencidas</span>
                            <span className="font-medium text-red-600">{overdueCollections}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Próximas 72h</span>
                            <span className="font-medium text-orange-600">
                                {filteredCollections.filter(c => {
                                    if (c.status === 'PAID' || c.status === 'OVERDUE') return false;
                                    if (!c.dueDate) return false;
                                    const dueDate = new Date(c.dueDate);
                                    const today = new Date();
                                    const diffTime = dueDate.getTime() - today.getTime();
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    return diffDays >= 0 && diffDays <= 3;
                                }).length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Eficiencia de Cobro */}
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Eficiencia</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredCollections.length > 0
                                    ? Math.round((paidCollections / filteredCollections.length) * 100)
                                    : 0
                                }%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Tasa de cobro</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Días promedio</span>
                            <span className="font-medium">
                                {(() => {
                                    const paidWithDates = filteredCollections.filter(c =>
                                        c.status === 'PAID' && c.paidDate && c.dueDate
                                    );
                                    if (paidWithDates.length === 0) return '0';

                                    const avgDays = paidWithDates.reduce((sum, c) => {
                                        const paidDate = new Date(c.paidDate!);
                                        const dueDate = new Date(c.dueDate!);
                                        return sum + Math.max(0, (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                                    }, 0) / paidWithDates.length;

                                    return Math.round(avgDays);
                                })()}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Monto promedio</span>
                            <span className="font-medium">
                                {filteredCollections.length > 0
                                    ? formatAmount(
                                        Math.round(filteredCollections.reduce((sum, c) => sum + c.amount, 0) / filteredCollections.length),
                                        currencies[0] || 'PESOS'
                                    ).split(' ')[0]
                                    : '0'
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alertas Inteligentes - Solo cuando hay situaciones críticas */}
            {(overdueCollections > 0 || filteredCollections.filter(c => {
                if (c.status === 'PAID' || c.status === 'OVERDUE') return false;
                if (!c.dueDate) return false;
                const dueDate = new Date(c.dueDate);
                const today = new Date();
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 3;
            }).length > 0) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
                        <div className="flex items-start space-x-3">
                            <div className="bg-amber-100 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-amber-900 mb-2">
                                    {overdueCollections > 0 && filteredCollections.filter(c => {
                                        if (c.status === 'PAID' || c.status === 'OVERDUE') return false;
                                        if (!c.dueDate) return false;
                                        const dueDate = new Date(c.dueDate);
                                        const today = new Date();
                                        const diffTime = dueDate.getTime() - today.getTime();
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        return diffDays >= 0 && diffDays <= 3;
                                    }).length > 0
                                        ? `${overdueCollections} vencidas + ${filteredCollections.filter(c => {
                                            if (c.status === 'PAID' || c.status === 'OVERDUE') return false;
                                            if (!c.dueDate) return false;
                                            const dueDate = new Date(c.dueDate);
                                            const today = new Date();
                                            const diffTime = dueDate.getTime() - today.getTime();
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            return diffDays >= 0 && diffDays <= 3;
                                        }).length} próximas`
                                        : overdueCollections > 0
                                            ? `${overdueCollections} cobranzas vencidas`
                                            : `${filteredCollections.filter(c => {
                                                if (c.status === 'PAID' || c.status === 'OVERDUE') return false;
                                                if (!c.dueDate) return false;
                                                const dueDate = new Date(c.dueDate);
                                                const today = new Date();
                                                const diffTime = dueDate.getTime() - today.getTime();
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                return diffDays >= 0 && diffDays <= 3;
                                            }).length} cobranzas próximas a vencer`
                                    }
                                </h4>
                                <p className="text-sm text-amber-700 mb-3">
                                    {overdueCollections > 0
                                        ? "Estas cobranzas requieren atención inmediata para evitar deterioro en las relaciones comerciales."
                                        : "Estas cobranzas vencerán en las próximas 72 horas. Considera enviar recordatorios preventivos."
                                    }
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {overdueCollections > 0 && (
                                        <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                            Enviar recordatorios
                                        </button>
                                    )}
                                    <button className="bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                        Ver detalles
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Estado:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos</option>
                            {uniqueStatuses.map(status => (
                                <option key={status} value={status}>{getStatusInSpanish(status)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Proyecto:</label>
                        <select
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos</option>
                            {uniqueProjects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Active Filters Display */}
                    <div className="flex flex-wrap gap-2">
                        {statusFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Estado: {getStatusInSpanish(statusFilter)}
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {projectFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Proyecto: {uniqueProjects.find(p => p.id === projectFilter)?.name}
                                <button
                                    onClick={() => setProjectFilter('all')}
                                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>

                    <div className="ml-auto text-sm text-gray-500">
                        Mostrando {paginatedCollections.length} de {filteredCollections.length} cobranzas
                    </div>
                </div>
            </div>

            {/* Collections Table - Desktop */}
            <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Seguimiento de Cobranzas</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('invoiceId')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Factura
                                        {sortField === 'invoiceId' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('client')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Cliente
                                        {sortField === 'client' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Condición
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('amount')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Monto
                                        {sortField === 'amount' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('dueDate')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Vencimiento
                                        {sortField === 'dueDate' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('paidDate')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Cobrada
                                        {sortField === 'paidDate' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('status')}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        Estado
                                        {sortField === 'status' && (
                                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedCollections.map((collection: any) => (
                                <tr
                                    key={collection.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => openModal('edit', collection)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{collection.invoiceId || `PAY-${collection.id.slice(-4)}`}</div>
                                        <div className="text-sm text-gray-500">{collection.project?.name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{collection.client?.name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {collection.paymentTerm ? (
                                            <div className="flex items-center">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    {(() => {
                                                        if (collection.installmentNumber) {
                                                            return `${collection.installmentNumber}/${collection.paymentTerm.periods}`
                                                        }
                                                        // Si no tiene installmentNumber pero pertenece a una condición,
                                                        // intentar calcular cuál sería su posición
                                                        const collectionsWithSameTerm = collections.filter((c: any) =>
                                                            c.paymentTermId === collection.paymentTermId && c.id !== collection.id
                                                        )
                                                        if (collectionsWithSameTerm.length > 0) {
                                                            const maxInstallment = Math.max(...collectionsWithSameTerm
                                                                .filter((c: any) => c.installmentNumber)
                                                                .map((c: any) => c.installmentNumber || 0)
                                                            )
                                                            return `${maxInstallment + 1}/${collection.paymentTerm.periods}`
                                                        }
                                                        return `1/${collection.paymentTerm.periods}`
                                                    })()}
                                                </span>
                                                <div className="ml-2 text-xs text-gray-500">
                                                    {collection.paymentTerm.recurrence?.toLowerCase() || 'Sin recurrencia'}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">Individual</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatAmount(collection.amount, collection.currency)}</div>
                                        {collection.status !== 'PAID' && (
                                            <div className="text-sm text-red-600">
                                                Pendiente: {formatAmount(collection.amount, collection.currency)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {collection.dueDate ? new Date(collection.dueDate).toLocaleDateString('es-ES') : '-'}
                                        </div>
                                        {collection.overdueDays > 0 && (
                                            <div className="text-sm text-red-600">
                                                {collection.overdueDays} días vencida
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {collection.paidDate ? new Date(collection.paidDate).toLocaleDateString('es-ES') : '-'}
                                        </div>
                                        {collection.status === 'PAID' && collection.paidDate && (
                                            <div className="text-sm text-green-600">
                                                ✓ Cobrada
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(collection.status)}`}>
                                            {getStatusInSpanish(collection.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative dropdown-container">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleDropdown(collection.id)
                                                }}
                                                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                            >
                                                <EllipsisVerticalIcon className="h-5 w-5" />
                                            </button>
                                            {openDropdownId === collection.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setOpenDropdownId(null)
                                                                openModal('edit', collection)
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <PencilIcon className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </button>
                                                        {collection.status !== 'PAID' && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setOpenDropdownId(null)
                                                                        handleSendReminder(collection)
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                >
                                                                    <ClockIcon className="h-4 w-4 mr-2" />
                                                                    Enviar Recordatorio
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setOpenDropdownId(null)
                                                                        handleMarkAsPaid(collection)
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                >
                                                                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                                                                    Marcar como Pagada
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setOpenDropdownId(null)
                                                                setSelectedCollection(collection)
                                                                openModal('delete', collection)
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Collections Cards - Mobile */}
            <div className="md:hidden space-y-4">
                <div className="px-4 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Seguimiento de Cobranzas</h2>
                </div>
                {paginatedCollections.map((collection: any) => (
                    <div
                        key={collection.id}
                        className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => openModal('edit', collection)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="text-lg font-medium text-gray-900">{collection.invoiceId || `PAY-${collection.id.slice(-4)}`}</div>
                                <div className="text-sm text-gray-500">{collection.client?.name || '-'}</div>
                                <div className="text-sm text-gray-500">{collection.project?.name || '-'}</div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(collection.status)}`}>
                                    {getStatusInSpanish(collection.status)}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">Monto Total</div>
                                <div className="text-lg font-semibold text-gray-900">{formatAmount(collection.amount, collection.currency)}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Pendiente</div>
                                <div className="text-lg font-semibold text-red-600">
                                    {collection.status !== 'PAID' ? formatAmount(collection.amount, collection.currency) : '$0 PESOS'}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Vencimiento</div>
                                <div className="text-sm text-gray-900">{collection.dueDate ? new Date(collection.dueDate).toLocaleDateString('es-ES') : '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Cobrada</div>
                                <div className="text-sm text-gray-900">
                                    {collection.paidDate ? new Date(collection.paidDate).toLocaleDateString('es-ES') : '-'}
                                    {collection.status === 'PAID' && <span className="text-green-600 ml-1">✓</span>}
                                </div>
                            </div>
                        </div>

                        {/* Información de condición de pago en móvil */}
                        {collection.paymentTerm && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium text-blue-900">
                                        {(() => {
                                            if (collection.installmentNumber) {
                                                return `Cuota ${collection.installmentNumber}/${collection.paymentTerm.periods}`
                                            }
                                            // Si no tiene installmentNumber pero pertenece a una condición,
                                            // intentar calcular cuál sería su posición
                                            const collectionsWithSameTerm = collections.filter((c: any) =>
                                                c.paymentTermId === collection.paymentTermId && c.id !== collection.id
                                            )
                                            if (collectionsWithSameTerm.length > 0) {
                                                const maxInstallment = Math.max(...collectionsWithSameTerm
                                                    .filter((c: any) => c.installmentNumber)
                                                    .map((c: any) => c.installmentNumber || 0)
                                                )
                                                return `Cuota ${maxInstallment + 1}/${collection.paymentTerm.periods}`
                                            }
                                            return `Cuota 1/${collection.paymentTerm.periods}`
                                        })()}
                                    </div>
                                    <div className="text-xs text-blue-700">
                                        {collection.paymentTerm.recurrence?.toLowerCase() || 'Sin recurrencia'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {collection.overdueDays > 0 && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="text-sm text-red-800">
                                    ⚠️ Factura vencida hace {collection.overdueDays} días
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                {collection.description || 'Sin descripción'}
                            </div>
                            <div className="relative dropdown-container">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleDropdown(`mobile-${collection.id}`)
                                    }}
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                >
                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                </button>
                                {openDropdownId === `mobile-${collection.id}` && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                        <div className="py-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setOpenDropdownId(null)
                                                    openModal('edit', collection)
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <PencilIcon className="h-4 w-4 mr-2" />
                                                Editar
                                            </button>
                                            {collection.status !== 'PAID' && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setOpenDropdownId(null)
                                                            handleSendReminder(collection)
                                                        }}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        <ClockIcon className="h-4 w-4 mr-2" />
                                                        Enviar Recordatorio
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setOpenDropdownId(null)
                                                            handleMarkAsPaid(collection)
                                                        }}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                                                        Marcar como Pagada
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setOpenDropdownId(null)
                                                    setSelectedCollection(collection)
                                                    openModal('delete', collection)
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                <TrashIcon className="h-4 w-4 mr-2" />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="mt-6">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredCollections.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    onImportExcel={() => setShowImportModal(true)}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />
            </div>

            {/* Centro de Gestión Minimalista */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Centro de Gestión</h3>
                        <p className="text-sm text-gray-600">Acciones prioritarias para optimizar cobranzas</p>
                    </div>
                    <div className="text-sm text-gray-500">
                        {filteredCollections.filter(c => c.status !== 'PAID').length} pendientes
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nueva Cobranza con Condición */}
                    <div className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer" onClick={() => openModal('create')}>
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">Nueva Cobranza</div>
                                <div className="text-sm text-gray-600">Individual o con condición</div>
                            </div>
                        </div>
                    </div>

                    {/* Recordatorios Inteligentes */}
                    <div className="group p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer">
                        <div className="flex items-center space-x-3">
                            <div className="bg-orange-100 p-2 rounded-lg group-hover:bg-orange-200 transition-colors">
                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">Recordatorios</div>
                                <div className="text-sm text-gray-600">
                                    {filteredCollections.filter(c => {
                                        if (c.status === 'PAID' || c.status === 'OVERDUE') return false;
                                        if (!c.dueDate) return false;
                                        const dueDate = new Date(c.dueDate);
                                        const today = new Date();
                                        const diffTime = dueDate.getTime() - today.getTime();
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        return diffDays >= 0 && diffDays <= 7;
                                    }).length} próximas a vencer
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen Ejecutivo */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-lg font-semibold text-blue-600">
                                {filteredCollections.filter(c => c.paymentTerm).length}
                            </div>
                            <div className="text-xs text-gray-500">Con condiciones</div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-orange-600">
                                {filteredCollections.filter(c => {
                                    if (c.status === 'PAID' || c.status === 'OVERDUE') return false;
                                    if (!c.dueDate) return false;
                                    const dueDate = new Date(c.dueDate);
                                    const today = new Date();
                                    const diffTime = dueDate.getTime() - today.getTime();
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    return diffDays >= 0 && diffDays <= 7;
                                }).length}
                            </div>
                            <div className="text-xs text-gray-500">Esta semana</div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-red-600">{overdueCollections}</div>
                            <div className="text-xs text-gray-500">Vencidas</div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-green-600">
                                {filteredCollections.length > 0
                                    ? Math.round((paidCollections / filteredCollections.length) * 100)
                                    : 0
                                }%
                            </div>
                            <div className="text-xs text-gray-500">Éxito</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CollectionFormModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSaveCollection}
                payment={null}
            />

            <CollectionFormModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                onSave={handleSaveCollection}
                payment={selectedCollection}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteCollection}
                title="Eliminar Cobranza"
                message={`¿Estás seguro de que quieres eliminar el seguimiento de cobranza para "${selectedCollection?.invoiceId}"?`}
            />

            {/* Modal de importación */}
            <CollectionImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleFileImport}
            />
        </Layout>
    )
}
