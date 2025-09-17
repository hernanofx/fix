"use client"

import Layout from '../../components/Layout'
import ClientFormModal from '../../components/modals/ClientFormModal'
import ClientActionsModal from '../../components/modals/ClientActionsModal'
import { ClientImportModal } from '../../components/modals/ClientImportModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '../../components/ui/Pagination'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { formatCurrency, type Currency } from '../../lib/utils'
import { Suspense } from 'react'
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, EyeIcon, UserPlusIcon } from '@heroicons/react/24/outline'

export default function Clients() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ClientsContent />
        </Suspense>
    )
}

function ClientsContent() {
    const { data: session } = useSession()
    const searchParams = useSearchParams()
    const [clients, setClients] = useState<any[]>([])

    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false,
        details: false, // CRM detailed overlay
        clientForm: false, // read-only client form
        payment: false,
        paymentTerm: false,
        actions: false,
    })

    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // CRM state for client collections
    const [activeTab, setActiveTab] = useState<'overview' | 'bills' | 'payments' | 'paymentTerms'>('overview')
    const [crmData, setCrmData] = useState({
        bills: [],
        payments: [],
        paymentTerms: []
    })

    // Estados para edición de elementos CRM
    const [editingPayment, setEditingPayment] = useState<any>(null)
    const [editingPaymentTerm, setEditingPaymentTerm] = useState<any>(null)
    const [deletingItem, setDeletingItem] = useState<{ type: string; item: any } | null>(null)

    // Estados para formularios de modales
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        method: 'TRANSFER',
        reference: '',
        description: '',
        status: 'PAID',
        paidDate: new Date().toISOString().split('T')[0],
        currency: 'USD'
    })

    const [paymentTermForm, setPaymentTermForm] = useState({
        description: '',
        amount: '',
        recurrence: 'MENSUAL',
        periods: '',
        startDate: new Date().toISOString().split('T')[0],
        currency: 'USD'
    })

    // Estados de carga
    const [savingPayment, setSavingPayment] = useState(false)
    const [savingPaymentTerm, setSavingPaymentTerm] = useState(false)

    // Estados para filtros y ordenamiento
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('ACTIVE')
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [searchTerm, setSearchTerm] = useState<string>('')

    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        const load = async () => {
            try {
                const orgId = session?.user?.organizationId
                if (!orgId) return
                const res = await fetch(`/api/clients?organizationId=${orgId}`)
                if (!res.ok) return
                const data = await res.json()
                setClients(data)
            } catch (e) {
                console.error(e)
            }
        }
        load()
    }, [session])

    // Detectar parámetro modal=create en la URL y abrir modal automáticamente
    useEffect(() => {
        const modal = searchParams.get('modal')
        if (modal === 'create') {
            openModal('create')
        }
    }, [searchParams])

    // Lógica de filtrado y ordenamiento (sin paginación para estadísticas)
    const filteredClients = useMemo(() => {
        let filtered = clients

        // Aplicar filtro de búsqueda
        if (searchTerm) {
            filtered = filtered.filter(client =>
                client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.phone?.includes(searchTerm)
            )
        }

        // Aplicar filtro de tipo
        if (typeFilter !== 'all') {
            filtered = filtered.filter(client => client.type === typeFilter)
        }

        // Aplicar filtro de estado
        if (statusFilter !== 'all') {
            filtered = filtered.filter(client => client.status === statusFilter)
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            // Manejar casos especiales
            if (sortField === 'name') {
                aValue = (aValue || '').toLowerCase()
                bValue = (bValue || '').toLowerCase()
            } else if (sortField === 'outstandingBalance') {
                aValue = aValue || 0
                bValue = bValue || 0
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [clients, typeFilter, statusFilter, sortField, sortDirection, searchTerm])

    // Datos paginados para mostrar en la tabla
    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredClients.slice(startIndex, endIndex)
    }, [filteredClients, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [typeFilter, statusFilter, sortField, sortDirection, searchTerm])

    // Calculate total pages
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage)

    // Obtener tipos únicos para el filtro
    const uniqueTypes = useMemo(() => {
        const types = clients.map(c => c.type).filter(Boolean)
        return Array.from(new Set(types)).sort()
    }, [clients])

    // Obtener estados únicos para el filtro
    const uniqueStatuses = useMemo(() => {
        const statuses = clients.map(c => c.status).filter(Boolean)
        return Array.from(new Set(statuses)).sort()
    }, [clients])

    // Función para cambiar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleDropdown = (id: string) => {
        setOpenDropdownId(openDropdownId === id ? null : id)
    }

    const openModal = async (modalType: keyof typeof modals, client?: any) => {
        setSelectedClient(null)
        if (modalType === 'edit' && client?.id) {
            try {
                const res = await fetch(`/api/clients/${client.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setSelectedClient(data)
                } else {
                    setSelectedClient(client)
                }
            } catch (e) {
                setSelectedClient(client)
            }
        } else {
            setSelectedClient(client)
        }
        setModals(prev => ({ ...prev, [modalType]: true }))
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals(prev => ({ ...prev, [modalType]: false }))
        setSelectedClient(null)
    }

    const handleSaveClient = async (clientData: any) => {
        try {
            const orgId = session?.user?.organizationId
            const userId = session?.user?.id
            if (selectedClient?.id) {
                const res = await fetch(`/api/clients/${selectedClient.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clientData),
                })
                if (!res.ok) throw new Error('failed')
                const updated = await res.json()
                setClients(clients.map(c => (c.id === updated.id ? updated : c)))
            } else {
                const payload = { ...clientData, organizationId: orgId, createdById: userId }
                const res = await fetch(`/api/clients`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                if (!res.ok) throw new Error('failed')
                const created = await res.json()
                setClients(prev => [created, ...prev])
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleEditClient = (client: any) => {
        setSelectedClient(client)
        setModals(prev => ({ ...prev, edit: true }))
    }

    const handleViewClientDetails = (client: any) => {
        openCrmView(client)
    }

    const handleConvertClientToProspect = (client: any) => {
        handleConvertToProspect(client)
    }

    const handleConvertToProspect = async (client: any) => {
        try {
            const res = await fetch(`/api/clients/${client.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...client, status: 'PROSPECT' }),
            })
            if (!res.ok) throw new Error('failed')
            // Remover de la lista de clientes
            setClients(clients.filter(c => c.id !== client.id))
            alert('Cliente convertido a prospecto exitosamente')
        } catch (e) {
            console.error(e)
            alert('Error al convertir cliente a prospecto')
        }
    }

    const handleDeleteClientAction = (client: any) => {
        setSelectedClient(client)
        setModals(prev => ({ ...prev, delete: true }))
    }

    const handleDeleteClient = async () => {
        try {
            if (!selectedClient?.id) return
            const res = await fetch(`/api/clients/${selectedClient.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('delete failed')
            setClients(clients.filter(client => client.id !== selectedClient.id))
            setSelectedClient(null)
        } catch (e) {
            console.error(e)
        }
    }

    const handleImportExcel = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/clients/import/excel', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                alert(`Importación exitosa: ${result.imported} clientes importados`)
                // Recargar los datos
                const orgId = session?.user?.organizationId
                if (orgId) {
                    const res = await fetch(`/api/clients?organizationId=${orgId}`)
                    if (res.ok) {
                        const data = await res.json()
                        setClients(data)
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
                type: typeFilter,
                status: statusFilter,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/clients/export/excel?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`
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
                type: typeFilter,
                status: statusFilter,
                sortField: sortField,
                sortDirection: sortDirection
            })

            const response = await fetch(`/api/clients/export/pdf?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `clientes_${new Date().toISOString().split('T')[0]}.pdf`
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

    // CRM Functions
    const loadCrmData = async (clientId: string) => {
        try {
            const [billsRes, paymentsRes, paymentTermsRes] = await Promise.all([
                fetch(`/api/bills?organizationId=${session?.user?.organizationId}&clientId=${clientId}`),
                fetch(`/api/collections?organizationId=${session?.user?.organizationId}&clientId=${clientId}`),
                fetch(`/api/payment-terms?organizationId=${session?.user?.organizationId}&clientId=${clientId}`)
            ])

            const bills = billsRes.ok ? await billsRes.json() : []
            const payments = paymentsRes.ok ? await paymentsRes.json() : []
            const paymentTerms = paymentTermsRes.ok ? await paymentTermsRes.json() : []

            setCrmData({ bills, payments, paymentTerms })
        } catch (error) {
            console.error('Error loading CRM data:', error)
        }
    }

    // Function to determine the client's primary currency based on transactions
    const getClientPrimaryCurrency = (client: any, payments: any[] = [], paymentTerms: any[] = []): Currency => {
        // Check payment currencies first
        const currencyCounts: Record<string, number> = {}

        payments.forEach(payment => {
            if (payment.currency) {
                currencyCounts[payment.currency] = (currencyCounts[payment.currency] || 0) + 1
            }
        })

        paymentTerms.forEach(term => {
            if (term.currency) {
                currencyCounts[term.currency] = (currencyCounts[term.currency] || 0) + 1
            }
        })

        // Find the most common currency
        const primaryCurrency = Object.keys(currencyCounts).reduce((a, b) =>
            currencyCounts[a] > currencyCounts[b] ? a : b
        )

        // Default to PESOS if no transactions found
        return (primaryCurrency as Currency) || 'PESOS'
    }

    const calculateOutstandingBalance = (payments: any[] = [], paymentTerms: any[] = []) => {
        // Group by currency
        const balancesByCurrency: Record<string, number> = {}

        // Add all payment terms (total amount expected)
        paymentTerms.forEach(term => {
            const currency = term.currency || 'PESOS'
            const amount = parseFloat(term.amount) || 0
            balancesByCurrency[currency] = (balancesByCurrency[currency] || 0) + amount
        })

        // Subtract all paid amounts
        payments.filter(payment => payment.status === 'PAID').forEach(payment => {
            const currency = payment.currency || 'PESOS'
            const amount = parseFloat(payment.amount) || 0
            balancesByCurrency[currency] = (balancesByCurrency[currency] || 0) - amount
        })

        return balancesByCurrency
    }

    const getMainOutstandingBalance = (balancesByCurrency: Record<string, number>) => {
        // Find the currency with the highest absolute balance
        let mainCurrency = 'PESOS'
        let mainAmount = 0

        Object.entries(balancesByCurrency).forEach(([currency, amount]) => {
            if (Math.abs(amount) > Math.abs(mainAmount)) {
                mainCurrency = currency
                mainAmount = amount
            }
        })

        return { currency: mainCurrency as Currency, amount: mainAmount }
    }

    const openCrmView = async (client: any) => {
        setSelectedClient(client)
        setActiveTab('overview')
        await loadCrmData(client.id)
        // open the detailed CRM modal when explicitly requested
        // ensure all other modals are closed so only CRM details are visible
        setModals(prev => ({
            ...prev,
            details: true,
            clientForm: false,
            create: false,
            edit: false,
            delete: false,
            actions: false,
            payment: false,
            paymentTerm: false
        }))
    }

    const handleNewPayment = () => {
        setModals(prev => ({ ...prev, payment: true }))
    }

    const handleNewPaymentTerm = () => {
        setModals(prev => ({ ...prev, paymentTerm: true }))
    }

    const handleSavePayment = async () => {
        if (!selectedClient?.id) return

        setSavingPayment(true)
        try {
            const paymentData = {
                amount: parseFloat(paymentForm.amount),
                description: paymentForm.description || null,
                method: paymentForm.method,
                status: paymentForm.status,
                paidDate: paymentForm.status === 'PAID' ? new Date(paymentForm.paidDate) : null,
                reference: paymentForm.reference || null,
                clientId: selectedClient.id,
                organizationId: session?.user?.organizationId,
                createdById: session?.user?.id,
                currency: paymentForm.currency
            }

            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al guardar el pago')
            }

            const newPayment = await response.json()

            // Actualizar el estado local
            setCrmData((prev: any) => ({
                ...prev,
                payments: [newPayment, ...prev.payments]
            }))

            // Limpiar formulario y cerrar modal
            setPaymentForm({
                amount: '',
                method: 'TRANSFER',
                reference: '',
                description: '',
                status: 'PAID',
                paidDate: new Date().toISOString().split('T')[0],
                currency: 'USD'
            })
            setModals(prev => ({ ...prev, payment: false }))

            alert('Pago registrado exitosamente')
        } catch (error: any) {
            console.error('Error saving payment:', error)
            alert(error.message || 'Error al guardar el pago')
        } finally {
            setSavingPayment(false)
        }
    }

    const handleSavePaymentTerm = async () => {
        if (!selectedClient?.id) return

        setSavingPaymentTerm(true)
        try {
            const paymentTermData = {
                entityId: selectedClient.id,
                entityType: 'CLIENT',
                type: 'INCOME',
                amount: parseFloat(paymentTermForm.amount),
                currency: paymentTermForm.currency,
                startDate: new Date(paymentTermForm.startDate),
                recurrence: paymentTermForm.recurrence,
                periods: parseInt(paymentTermForm.periods),
                status: 'ACTIVE',
                description: paymentTermForm.description
            }

            const response = await fetch('/api/payment-terms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentTermData)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al guardar la condición de pago')
            }

            const newPaymentTerm = await response.json()

            // Actualizar el estado local
            setCrmData((prev: any) => ({
                ...prev,
                paymentTerms: [newPaymentTerm, ...prev.paymentTerms]
            }))

            // Limpiar formulario y cerrar modal
            setPaymentTermForm({
                description: '',
                amount: '',
                recurrence: 'MENSUAL',
                periods: '',
                startDate: new Date().toISOString().split('T')[0],
                currency: 'USD'
            })
            setModals(prev => ({ ...prev, paymentTerm: false }))

            alert('Condición de pago creada exitosamente')
        } catch (error: any) {
            console.error('Error saving payment term:', error)
            alert(error.message || 'Error al guardar la condición de pago')
        } finally {
            setSavingPaymentTerm(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'Activo':
                return 'bg-green-100 text-green-800'
            case 'INACTIVE':
            case 'Inactivo':
                return 'bg-gray-100 text-gray-800'
            case 'SUSPENDED':
            case 'Suspendido':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Empresa':
                return 'bg-blue-100 text-blue-800'
            case 'Particular':
                return 'bg-purple-100 text-purple-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const activeClients = filteredClients.filter(c => c.status === 'Activo' || c.status === 'ACTIVE').length
    const totalRevenue = filteredClients.reduce((sum, client) => sum + (client.totalInvoiced || 0), 0)
    const totalOutstanding = filteredClients.reduce((sum, client) => sum + (client.outstandingBalance || 0), 0)

    return (
        <Layout title="Clientes" subtitle="Gestión completa de clientes y cartera">
            {/* header and actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div></div>
                <button
                    onClick={() => openModal('create')}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Nuevo Cliente
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total clientes</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{filteredClients.length}</dd>
                            {typeFilter !== 'all' || statusFilter !== 'all' ? (
                                <div className="text-xs text-gray-400">
                                    (filtrado de {clients.length} total)
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Clientes activos</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{activeClients}</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Facturación total</dt>
                            <dd className="text-2xl font-semibold text-gray-900">${totalRevenue.toLocaleString('en-US')}</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Pendiente de cobro</dt>
                            <dd className="text-2xl font-semibold text-gray-900">${totalOutstanding.toLocaleString('en-US')}</dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">Lista de Clientes</h2>

                        {/* Indicadores de filtros activos */}
                        {(typeFilter !== 'all' || statusFilter !== 'all' || sortField !== 'name') && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Filtros activos:</span>
                                {typeFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Tipo: {typeFilter}
                                        <button
                                            onClick={() => setTypeFilter('all')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                            title="Quitar filtro de tipo"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {statusFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Estado: {statusFilter}
                                        <button
                                            onClick={() => setStatusFilter('all')}
                                            className="ml-1 text-green-600 hover:text-green-800"
                                            title="Quitar filtro de estado"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {sortField !== 'name' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        Orden: {sortField === 'name' ? 'Nombre' :
                                            sortField === 'contactName' ? 'Contacto' :
                                                sortField === 'type' ? 'Tipo' :
                                                    sortField === 'status' ? 'Estado' :
                                                        sortField === 'outstandingBalance' ? 'Saldo' : sortField} {sortDirection === 'asc' ? '↑' : '↓'}
                                        <button
                                            onClick={() => {
                                                setSortField('name')
                                                setSortDirection('asc')
                                            }}
                                            className="ml-1 text-purple-600 hover:text-purple-800"
                                            title="Quitar ordenamiento"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Filtros */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">
                                    Tipo:
                                </label>
                                <select
                                    id="type-filter"
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Todos</option>
                                    {uniqueTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                                    Estado:
                                </label>
                                <select
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Todos</option>
                                    {uniqueStatuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Ver todos
                            </button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Cliente
                                        {sortField === 'name' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('contactName')}
                                >
                                    <div className="flex items-center gap-1">
                                        Contacto
                                        {sortField === 'contactName' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('type')}
                                >
                                    <div className="flex items-center gap-1">
                                        Tipo
                                        {sortField === 'type' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Estado
                                        {sortField === 'status' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyectos</th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('outstandingBalance')}
                                >
                                    <div className="flex items-center gap-1">
                                        Saldo Pendiente
                                        {sortField === 'outstandingBalance' && (
                                            <span className="text-gray-400">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedClients.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                                    setSelectedClient(client)
                                    setModals(prev => ({ ...prev, actions: true }))
                                }}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <span className="text-white font-medium text-sm">{(client.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                                <div className="text-sm text-gray-500">{client.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{client.contactName || client.contact}</div>
                                        <div className="text-sm text-gray-500">{client.phone || client.contactPhone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(client.type)}`}>{client.type}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>{client.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.totalProjects || 0}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(client.outstandingBalance || 0, (client.outstandingBalanceCurrency as Currency) || 'PESOS')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleDropdown(client.id)
                                                }}
                                                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                            >
                                                <EllipsisVerticalIcon className="h-5 w-5" />
                                            </button>
                                            {openDropdownId === client.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                setSelectedClient(client)
                                                                setModals(prev => ({ ...prev, actions: true }))
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <PencilIcon className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                setSelectedClient(client)
                                                                setModals(prev => ({ ...prev, actions: true }))
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <EyeIcon className="h-4 w-4 mr-2" />
                                                            Ver Detalles CRM
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                setSelectedClient(client)
                                                                setModals(prev => ({ ...prev, actions: true }))
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-gray-100"
                                                        >
                                                            <UserPlusIcon className="h-4 w-4 mr-2" />
                                                            Convertir a Prospecto
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                setSelectedClient(client)
                                                                setModals(prev => ({ ...prev, actions: true }))
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

                {/* Información de resumen */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Mostrando {paginatedClients.length} de {filteredClients.length} clientes
                        {typeFilter !== 'all' && (
                            <span className="ml-2 text-blue-600">
                                (filtrado por tipo: {typeFilter})
                            </span>
                        )}
                        {statusFilter !== 'all' && (
                            <span className="ml-2 text-green-600">
                                (filtrado por estado: {statusFilter})
                            </span>
                        )}
                        {sortField && (
                            <span className="ml-2 text-purple-600">
                                (ordenado por: {sortField === 'name' ? 'Nombre' :
                                    sortField === 'contactName' ? 'Contacto' :
                                        sortField === 'type' ? 'Tipo' :
                                            sortField === 'status' ? 'Estado' :
                                                sortField === 'outstandingBalance' ? 'Saldo' : sortField} {sortDirection === 'asc' ? '↑' : '↓'})
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Pagination Component */}
            <div className="mt-6">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredClients.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Buscar clientes..."
                    onImportExcel={() => setShowImportModal(true)}
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                />
            </div>

            {/* Mobile list omitted for brevity - keep original mobile UI if desired */}

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                <div className="px-4 py-4 border-b border-gray-200 bg-white">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">Lista de Clientes</h2>
                        <div className="flex flex-col gap-3">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                            >
                                <option value="all">Todos los tipos</option>
                                {uniqueTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                            >
                                <option value="all">Todos los estados</option>
                                {uniqueStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {paginatedClients.length > 0 ? (
                    <div className="space-y-3 px-4">
                        {paginatedClients.map(client => (
                            <div
                                key={client.id}
                                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                onClick={() => {
                                    setSelectedClient(client)
                                    setModals(prev => ({ ...prev, actions: true }))
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="flex-shrink-0">
                                            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {(client.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                                    {client.name}
                                                </h3>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(client.type)}`}>
                                                    {client.type}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                                                    {client.status}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="truncate">{client.email || 'Sin email'}</span>
                                                </div>
                                                {client.phone && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        <span>{client.phone}</span>
                                                    </div>
                                                )}
                                                {client.contactName && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <span className="truncate">{client.contactName}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                                <span>Proyectos: {client.totalProjects || 0}</span>
                                                <span>Saldo: {formatCurrency(client.outstandingBalance || 0, (client.outstandingBalanceCurrency as Currency) || 'PESOS')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                                        <div className="relative" ref={dropdownRef}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleDropdown(client.id)
                                                }}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <EllipsisVerticalIcon className="h-5 w-5" />
                                            </button>
                                            {openDropdownId === client.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                setSelectedClient(client)
                                                                setModals(prev => ({ ...prev, actions: true }))
                                                            }}
                                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                        >
                                                            <PencilIcon className="h-4 w-4 mr-3" />
                                                            Editar Cliente
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                setSelectedClient(client)
                                                                setModals(prev => ({ ...prev, actions: true }))
                                                            }}
                                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                                        >
                                                            <EyeIcon className="h-4 w-4 mr-3" />
                                                            Ver Detalles CRM
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                setSelectedClient(client)
                                                                setModals(prev => ({ ...prev, actions: true }))
                                                            }}
                                                            className="flex items-center w-full px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                                        >
                                                            <UserPlusIcon className="h-4 w-4 mr-3" />
                                                            Convertir a Prospecto
                                                        </button>
                                                        <div className="border-t border-gray-100 my-1"></div>
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                setSelectedClient(client)
                                                                setModals(prev => ({ ...prev, actions: true }))
                                                            }}
                                                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            <TrashIcon className="h-4 w-4 mr-3" />
                                                            Eliminar Cliente
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-4 py-12 text-center">
                        <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No hay clientes</p>
                        <p className="text-gray-400 text-sm mt-2">Comienza creando tu primer cliente</p>
                    </div>
                )}

                {/* Mobile Pagination Info */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-600 text-center">
                        Mostrando {paginatedClients.length} de {filteredClients.length} clientes
                    </div>
                </div>
            </div>

            <ClientFormModal isOpen={modals.create} onClose={() => closeModal('create')} onSave={handleSaveClient} client={null} />
            <ClientFormModal isOpen={modals.edit} onClose={() => closeModal('edit')} onSave={handleSaveClient} client={selectedClient} />
            <ClientFormModal isOpen={modals.clientForm} onClose={() => closeModal('clientForm')} onSave={() => { }} client={selectedClient} readOnly />

            <ClientActionsModal
                isOpen={modals.actions}
                onClose={() => closeModal('actions')}
                client={selectedClient}
                onEdit={handleEditClient}
                onViewDetails={handleViewClientDetails}
                onConvertToProspect={handleConvertClientToProspect}
                onDelete={handleDeleteClientAction}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteClient}
                title="Eliminar Cliente"
                message={`¿Estás seguro de que quieres eliminar al cliente "${selectedClient?.name}"? Esta acción no se puede deshacer.`}
            />

            {/* Modal de importación */}
            <ClientImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleFileImport}
            />

            {/* CRM View */}
            {modals.details && selectedClient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-xl">
                                            {(selectedClient.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                                        <p className="text-sm text-gray-600 flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                {selectedClient.email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                {selectedClient.phone}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => openModal('edit', selectedClient)}
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                    >
                                        <PencilIcon className="h-4 w-4 mr-2" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => setSelectedClient(null)}
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs - Mobile Optimized */}
                        <div className="border-b border-gray-100 bg-gray-50">
                            <nav className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-3 transition-all duration-200 whitespace-nowrap min-w-max ${activeTab === 'overview'
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <svg className="h-5 w-5 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="hidden sm:inline">Información General</span>
                                    <span className="sm:hidden">General</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('bills')}
                                    className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-3 transition-all duration-200 whitespace-nowrap min-w-max ${activeTab === 'bills'
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <svg className="h-5 w-5 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="hidden sm:inline">Facturas</span>
                                    <span className="sm:hidden">Facturas</span>
                                    {crmData.bills.length > 0 && (
                                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                                            {crmData.bills.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('payments')}
                                    className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-3 transition-all duration-200 whitespace-nowrap min-w-max ${activeTab === 'payments'
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <svg className="h-5 w-5 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    <span className="hidden sm:inline">Pagos Recibidos</span>
                                    <span className="sm:hidden">Pagos</span>
                                    {crmData.payments.length > 0 && (
                                        <span className="ml-2 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                            {crmData.payments.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('paymentTerms')}
                                    className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-3 transition-all duration-200 whitespace-nowrap min-w-max ${activeTab === 'paymentTerms'
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <svg className="h-5 w-5 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="hidden sm:inline">Condiciones de Pago</span>
                                    <span className="sm:hidden">Condiciones</span>
                                    {crmData.paymentTerms.length > 0 && (
                                        <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full">
                                            {crmData.paymentTerms.length}
                                        </span>
                                    )}
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content - Mobile Optimized */}
                        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
                            {activeTab === 'overview' && (
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Información de Contacto
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500">Nombre</label>
                                                    <p className="text-sm text-gray-900 text-right">{selectedClient.name}</p>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                                    <p className="text-sm text-gray-900 text-right break-all">{selectedClient.email || 'No especificado'}</p>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                                                    <p className="text-sm text-gray-900 text-right">{selectedClient.phone || 'No especificado'}</p>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500">Dirección</label>
                                                    <p className="text-sm text-gray-900 text-right">{selectedClient.address || 'No especificada'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                                <svg className="h-5 w-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                                Información Financiera
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500">Estado</label>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedClient.status)}`}>
                                                        {selectedClient.status}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500">Tipo</label>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedClient.type)}`}>
                                                        {selectedClient.type}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500">Saldo Pendiente</label>
                                                    <p className="text-sm text-gray-900 font-semibold">
                                                        {formatCurrency(selectedClient.outstandingBalance || 0, (selectedClient.outstandingBalanceCurrency as Currency) || 'PESOS')}
                                                    </p>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                    <label className="text-sm font-medium text-gray-500">Total Proyectos</label>
                                                    <p className="text-sm text-gray-900">{selectedClient.totalProjects || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedClient.notes && (
                                        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                                <svg className="h-5 w-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Notas
                                            </h3>
                                            <p className="text-sm text-gray-700 leading-relaxed">{selectedClient.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'bills' && (
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                                            <svg className="h-6 w-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Facturas
                                        </h3>
                                        <button
                                            onClick={() => {/* TODO: Implementar nueva factura */ }}
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                        >
                                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Nueva Factura
                                        </button>
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        {crmData.bills.length > 0 ? (
                                            crmData.bills.map((bill: any) => (
                                                <div key={bill.id} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-blue-300">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                                                <div className={`p-2 rounded-lg self-start sm:self-center ${bill.status === 'PAID' ? 'bg-green-100 text-green-600' :
                                                                    bill.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-600' :
                                                                        bill.status === 'PENDING' ? 'bg-blue-100 text-blue-600' :
                                                                            'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-base sm:text-lg font-bold text-gray-900">{bill.number}</h4>
                                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 mt-1">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bill.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                                            bill.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                                                                bill.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                                                                                    'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                            {bill.status}
                                                                        </span>
                                                                        <span className="font-semibold">USD ${bill.amount?.toLocaleString('en-US')}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-700 mb-4 leading-relaxed text-sm sm:text-base">{bill.description || 'Sin descripción'}</p>
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span>Fecha: {new Date(bill.date).toLocaleDateString('es-ES')}</span>
                                                                </div>
                                                                {bill.dueDate && (
                                                                    <div className="flex items-center gap-1">
                                                                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        <span>Vence: {new Date(bill.dueDate).toLocaleDateString('es-ES')}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 sm:py-12">
                                                <svg className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-gray-500 text-base sm:text-lg font-medium">No hay facturas</p>
                                                <p className="text-gray-400 text-sm mt-2">Las facturas aparecerán aquí cuando se creen</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'payments' && (
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                                            <svg className="h-6 w-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                            Pagos Recibidos
                                        </h3>
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        {crmData.payments.length > 0 ? (
                                            crmData.payments.map((payment: any) => (
                                                <div key={payment.id} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-green-300">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                                                <div className="p-2 bg-green-100 text-green-600 rounded-lg self-start sm:self-center">
                                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(payment.amount || 0, payment.currency || 'PESOS')}</h4>
                                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 mt-1">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                                            payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                                'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                            {payment.status}
                                                                        </span>
                                                                        <span>{payment.method}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-700 mb-4 leading-relaxed text-sm sm:text-base">{payment.description || 'Sin descripción'}</p>
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span>Fecha: {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('es-ES') : 'Pendiente'}</span>
                                                                </div>
                                                                {payment.reference && (
                                                                    <div className="flex items-center gap-1">
                                                                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                                        </svg>
                                                                        <span>Ref: {payment.reference}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 sm:py-12">
                                                <svg className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                                <p className="text-gray-500 text-base sm:text-lg font-medium">No hay pagos registrados</p>
                                                <p className="text-gray-400 text-sm mt-2">Los pagos recibidos aparecerán aquí</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'paymentTerms' && (
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                                            <svg className="h-6 w-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Condiciones de Pago
                                        </h3>
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        {crmData.paymentTerms.length > 0 ? (
                                            crmData.paymentTerms.map((term: any) => (
                                                <div key={term.id} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-purple-300">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg self-start sm:self-center">
                                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-base sm:text-lg font-bold text-gray-900">{term.description}</h4>
                                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 mt-1">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${term.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                                            term.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                                                                'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                            {term.status}
                                                                        </span>
                                                                        <span className="font-semibold">{formatCurrency(Number(term.amount) || 0, term.currency || 'PESOS')}</span>
                                                                        <span>{term.recurrence}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-700 mb-4 leading-relaxed text-sm sm:text-base">
                                                                {term.periods} períodos • Inicio: {new Date(term.startDate).toLocaleDateString('es-ES')}
                                                            </p>
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span>Creado: {new Date(term.createdAt).toLocaleDateString('es-ES')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 sm:py-12">
                                                <svg className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-gray-500 text-base sm:text-lg font-medium">No hay condiciones de pago</p>
                                                <p className="text-gray-400 text-sm mt-2">Las condiciones de pago aparecerán aquí</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {modals.payment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Registrar Pago</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Monto *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                                <select
                                    value={paymentForm.currency || 'USD'}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="USD">USD - Dólar Americano</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="ARS">ARS - Peso Argentino</option>
                                    <option value="BRL">BRL - Real Brasileño</option>
                                    <option value="CLP">CLP - Peso Chileno</option>
                                    <option value="COP">COP - Peso Colombiano</option>
                                    <option value="MXN">MXN - Peso Mexicano</option>
                                    <option value="PEN">PEN - Sol Peruano</option>
                                    <option value="UYU">UYU - Peso Uruguayo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                                <select
                                    value={paymentForm.status}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="PAID">Pagado</option>
                                    <option value="PENDING">Pendiente</option>
                                </select>
                            </div>
                            {paymentForm.status === 'PAID' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Pago</label>
                                    <input
                                        type="date"
                                        value={paymentForm.paidDate}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                                <select
                                    value={paymentForm.method}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="TRANSFER">Transferencia</option>
                                    <option value="CASH">Efectivo</option>
                                    <option value="CHECK">Cheque</option>
                                    <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Referencia</label>
                                <input
                                    type="text"
                                    value={paymentForm.reference}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Número de transferencia, cheque, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                                <textarea
                                    value={paymentForm.description}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Descripción del pago"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setModals(prev => ({ ...prev, payment: false }))
                                    setPaymentForm({
                                        amount: '',
                                        method: 'TRANSFER',
                                        reference: '',
                                        description: '',
                                        status: 'PAID',
                                        paidDate: new Date().toISOString().split('T')[0],
                                        currency: 'USD'
                                    })
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                disabled={savingPayment}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSavePayment}
                                disabled={savingPayment || !paymentForm.amount}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {savingPayment ? 'Guardando...' : 'Guardar Pago'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Term Modal */}
            {modals.paymentTerm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Nueva Condición de Pago</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                                <input
                                    type="text"
                                    value={paymentTermForm.description}
                                    onChange={(e) => setPaymentTermForm({ ...paymentTermForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Descripción de la condición"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Monto Total *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paymentTermForm.amount}
                                    onChange={(e) => setPaymentTermForm({ ...paymentTermForm, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                                <select
                                    value={paymentTermForm.currency || 'USD'}
                                    onChange={(e) => setPaymentTermForm({ ...paymentTermForm, currency: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="USD">USD - Dólar Americano</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="ARS">ARS - Peso Argentino</option>
                                    <option value="BRL">BRL - Real Brasileño</option>
                                    <option value="CLP">CLP - Peso Chileno</option>
                                    <option value="COP">COP - Peso Colombiano</option>
                                    <option value="MXN">MXN - Peso Mexicano</option>
                                    <option value="PEN">PEN - Sol Peruano</option>
                                    <option value="UYU">UYU - Peso Uruguayo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Recurrencia</label>
                                <select
                                    value={paymentTermForm.recurrence}
                                    onChange={(e) => setPaymentTermForm({ ...paymentTermForm, recurrence: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="MENSUAL">Mensual</option>
                                    <option value="BIMESTRAL">Bimestral</option>
                                    <option value="TRIMESTRAL">Trimestral</option>
                                    <option value="SEMESTRAL">Semestral</option>
                                    <option value="ANUAL">Anual</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Períodos *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={paymentTermForm.periods}
                                    onChange={(e) => setPaymentTermForm({ ...paymentTermForm, periods: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Número de cuotas"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio *</label>
                                <input
                                    type="date"
                                    value={paymentTermForm.startDate}
                                    onChange={(e) => setPaymentTermForm({ ...paymentTermForm, startDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setModals(prev => ({ ...prev, paymentTerm: false }))
                                    setPaymentTermForm({
                                        description: '',
                                        amount: '',
                                        recurrence: 'MENSUAL',
                                        periods: '',
                                        startDate: new Date().toISOString().split('T')[0],
                                        currency: 'USD'
                                    })
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                disabled={savingPaymentTerm}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSavePaymentTerm}
                                disabled={savingPaymentTerm || !paymentTermForm.description || !paymentTermForm.amount || !paymentTermForm.periods}
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {savingPaymentTerm ? 'Creando...' : 'Crear Condición'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
