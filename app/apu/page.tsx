'use client'

import Layout from '../../components/Layout'
import ApuFormModal from '../../components/modals/ApuFormModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '@/components/ui/Pagination'
import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '../../components/ToastProvider'
import ErrorBoundary from '../../components/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Suspense } from 'react'
import { Calculator, Plus, Search, FileText, Download, Eye, Edit, Trash2, DollarSign, ArrowUpIcon, ArrowDownIcon, MoreHorizontal } from 'lucide-react'

const formatCurrency = (amount: number, currency: string = 'PESOS') => {
    const currencySymbols = {
        'PESOS': '$',
        'USD': 'US$',
        'EUR': '€'
    }

    const symbol = currencySymbols[currency as keyof typeof currencySymbols] || '$'

    return `${symbol}${amount.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`
}

export default function ApuPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ApuPageContent />
        </Suspense>
    )
}

function ApuPageContent() {
    const [apuPartidas, setApuPartidas] = useState<any[]>([])
    const toast = useToast()

    const [modals, setModals] = useState({
        create: false,
        edit: false,
        view: false,
        delete: false
    })

    const [selectedPartida, setSelectedPartida] = useState<any>(null)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [budgetFilter, setBudgetFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortBy, setSortBy] = useState('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    const [budgetsList, setBudgetsList] = useState<any[]>([])

    const { data: session } = useSession()
    const searchParams = useSearchParams()

    useEffect(() => {
        loadBudgets()
    }, [session])

    useEffect(() => {
        loadApuPartidas()
    }, [session, searchTerm, budgetFilter, statusFilter])

    // Detect modal parameter from URL
    useEffect(() => {
        const modal = searchParams.get('modal')
        if (modal === 'create') {
            openModal('create')
        }
    }, [searchParams])

    const loadBudgets = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) return

            const res = await fetch(`/api/budgets?organizationId=${organizationId}`)
            if (!res.ok) return
            const data = await res.json()
            setBudgetsList(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('Error loading budgets:', e)
        }
    }

    const loadApuPartidas = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) return

            let url = `/api/apu?organizationId=${organizationId}`

            const res = await fetch(url)
            if (!res.ok) {
                const txt = await res.text().catch(() => null)
                let msg = 'Failed to load APU partidas'
                try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                throw new Error(msg)
            }
            const data = await res.json()
            setApuPartidas(Array.isArray(data) ? data : [])
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || 'No se pudieron cargar las partidas APU')
        }
    }

    // Filtered and sorted data
    const filteredPartidas = useMemo(() => {
        let filtered = apuPartidas.filter(partida => {
            const matchesSearch = !searchTerm ||
                (partida.name && partida.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (partida.description && partida.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (partida.code && partida.code.toLowerCase().includes(searchTerm.toLowerCase()))

            const matchesBudget = budgetFilter === 'all' || (partida.budget && partida.budget.id === budgetFilter)
            const matchesStatus = statusFilter === 'all' || partida.status === statusFilter

            return matchesSearch && matchesBudget && matchesStatus
        })

        // Apply sorting
        filtered.sort((a, b) => {
            let valueA: any, valueB: any

            switch (sortBy) {
                case 'name':
                    valueA = a.name || ''
                    valueB = b.name || ''
                    break
                case 'code':
                    valueA = a.code || ''
                    valueB = b.code || ''
                    break
                case 'unitCost':
                    valueA = Number(a.unitCost || 0)
                    valueB = Number(b.unitCost || 0)
                    break
                case 'totalCost':
                    valueA = Number(a.totalCost || 0)
                    valueB = Number(b.totalCost || 0)
                    break
                case 'status':
                    valueA = a.status || ''
                    valueB = b.status || ''
                    break
                default:
                    valueA = a.name || ''
                    valueB = b.name || ''
            }

            if (sortOrder === 'asc') {
                return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
            } else {
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
            }
        })

        return filtered
    }, [apuPartidas, searchTerm, budgetFilter, statusFilter, sortBy, sortOrder])

    // Paginated data
    const paginatedPartidas = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredPartidas.slice(startIndex, endIndex)
    }, [filteredPartidas, currentPage, itemsPerPage])

    useEffect(() => {
        setCurrentPage(1)
    }, [filteredPartidas])

    const totalPages = Math.ceil(filteredPartidas.length / itemsPerPage)

    const openModal = async (modalType: keyof typeof modals, partida?: any) => {
        if ((modalType === 'edit' || modalType === 'view') && partida?.id) {
            try {
                const res = await fetch(`/api/apu/${partida.id}`)
                if (!res.ok) throw new Error('Failed to fetch APU partida')
                const data = await res.json()
                setSelectedPartida(data)
                setModals({ ...modals, [modalType]: true })
                return
            } catch (err) {
                console.error(err)
                toast.error('No se pudo cargar la partida APU para visualizar')
                return
            }
        }

        setSelectedPartida(partida)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedPartida(null)
    }

    const handleSavePartida = async (partidaData: any) => {
        try {
            const userId = session?.user?.id as string | undefined
            const organizationId = (session as any)?.user?.organizationId as string | undefined

            if (selectedPartida?.id) {
                const res = await fetch(`/api/apu/${selectedPartida.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(partidaData)
                })
                if (!res.ok) throw new Error('Error updating APU partida')
                const updated = await res.json()
                setApuPartidas(apuPartidas.map(p => p.id === updated.id ? updated : p))
            } else {
                const payload = { ...partidaData, createdById: userId, organizationId }
                const res = await fetch('/api/apu', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                if (!res.ok) throw new Error('Error creating APU partida')
                const created = await res.json()
                setApuPartidas([created, ...apuPartidas])
            }

            closeModal('create')
            closeModal('edit')
            toast.success('Partida APU guardada exitosamente')
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || 'Error al guardar la partida APU')
        }
    }

    const handleDeletePartida = async () => {
        if (!selectedPartida?.id) return
        try {
            const res = await fetch(`/api/apu/${selectedPartida.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Error deleting APU partida')
            setApuPartidas(apuPartidas.filter(p => p.id !== selectedPartida.id))
            closeModal('delete')
            toast.success('Partida APU eliminada exitosamente')
        } catch (err: any) {
            console.error(err)
            toast.error('No se pudo eliminar la partida APU')
        }
    }

    const handleExportExcel = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) throw new Error('Organization not found')

            const params = new URLSearchParams()
            params.append('organizationId', organizationId)
            if (searchTerm) params.append('searchTerm', searchTerm)
            if (budgetFilter !== 'all') params.append('budgetId', budgetFilter)
            if (statusFilter !== 'all') params.append('status', statusFilter)
            params.append('sortBy', sortBy)
            params.append('sortOrder', sortOrder)

            const response = await fetch(`/api/apu/export/excel?${params}`)
            if (!response.ok) throw new Error('Error al exportar APU')
            const blob = await response.blob()
            const a = document.createElement('a')
            const url = window.URL.createObjectURL(blob)
            a.href = url
            a.download = `apu_partidas_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            toast.success('APU exportadas exitosamente')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Error al exportar APU')
        }
    }

    const handleExportPDF = async (partidaId?: string) => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) throw new Error('Organization not found')

            let url = `/api/apu/export/pdf?organizationId=${organizationId}`
            if (partidaId) {
                url += `&partidaId=${partidaId}`
            } else {
                // Add filters for bulk export
                const params = new URLSearchParams()
                if (searchTerm) params.append('searchTerm', searchTerm)
                if (budgetFilter !== 'all') params.append('budgetId', budgetFilter)
                if (statusFilter !== 'all') params.append('status', statusFilter)
                params.append('sortBy', sortBy)
                params.append('sortOrder', sortOrder)

                if (params.toString()) {
                    url += `&${params.toString()}`
                }
            }

            const response = await fetch(url)
            if (!response.ok) throw new Error('Error al exportar APU en PDF')
            const blob = await response.blob()
            const a = document.createElement('a')
            const urlBlob = window.URL.createObjectURL(blob)
            a.href = urlBlob
            a.download = partidaId
                ? `apu_partida_${new Date().toISOString().split('T')[0]}.pdf`
                : `apu_partidas_${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(urlBlob)
            toast.success('APU exportadas (PDF) exitosamente')
        } catch (error) {
            console.error('Export PDF error:', error)
            toast.error('Error al exportar APU en PDF')
        }
    }

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'DRAFT': { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
            'ACTIVE': { label: 'Activo', color: 'bg-green-100 text-green-800' },
            'ARCHIVED': { label: 'Archivado', color: 'bg-yellow-100 text-yellow-800' }
        }
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
        return <Badge className={config.color}>{config.label}</Badge>
    }

    return (
        <Layout
            title="Análisis de Precios Unitarios (APU)"
            subtitle="Gestión de costos y análisis de precios unitarios"
        >
            <div className="flex justify-between items-center mb-8">
                <div></div>
            </div>

            {/* APUs Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Nombre</span>
                                        {sortBy === 'name' && (
                                            sortOrder === 'asc' ?
                                                <ArrowUpIcon className="h-4 w-4" /> :
                                                <ArrowDownIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('code')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Código</span>
                                        {sortBy === 'code' && (
                                            sortOrder === 'asc' ?
                                                <ArrowUpIcon className="h-4 w-4" /> :
                                                <ArrowDownIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Unidad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cantidad
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('unitCost')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Costo Unitario</span>
                                        {sortBy === 'unitCost' && (
                                            sortOrder === 'asc' ?
                                                <ArrowUpIcon className="h-4 w-4" /> :
                                                <ArrowDownIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('totalCost')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Costo Total</span>
                                        {sortBy === 'totalCost' && (
                                            sortOrder === 'asc' ?
                                                <ArrowUpIcon className="h-4 w-4" /> :
                                                <ArrowDownIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Estado</span>
                                        {sortBy === 'status' && (
                                            sortOrder === 'asc' ?
                                                <ArrowUpIcon className="h-4 w-4" /> :
                                                <ArrowDownIcon className="h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                                <th className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedPartidas.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        {apuPartidas.length === 0 ? 'No hay partidas APU registradas' : 'No se encontraron partidas APU con los filtros aplicados'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedPartidas.map((partida) => (
                                    <tr key={partida.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {partida.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {partida.code || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {partida.unit || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {partida.quantity ? Number(partida.quantity).toLocaleString('es-ES') : '0'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {formatCurrency(Number(partida.unitCost || 0), partida.currency)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {formatCurrency(Number(partida.totalCost || 0), partida.currency)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(partida.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openModal('view', partida)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Ver
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openModal('edit', partida)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openModal('delete', partida)}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Column Filters */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Filtrar por Estado
                            </label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Todos los estados" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="DRAFT">Borrador</SelectItem>
                                    <SelectItem value="ACTIVE">Activo</SelectItem>
                                    <SelectItem value="ARCHIVED">Archivado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Filtrar por Presupuesto
                            </label>
                            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Todos los presupuestos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los presupuestos</SelectItem>
                                    {budgetsList.map(budget => (
                                        <SelectItem key={budget.id} value={budget.id}>
                                            {budget.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Ordenar por
                            </label>
                            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                                const [field, order] = value.split('-')
                                setSortBy(field)
                                setSortOrder(order as 'asc' | 'desc')
                            }}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Ordenar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                                    <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                                    <SelectItem value="code-asc">Código (A-Z)</SelectItem>
                                    <SelectItem value="code-desc">Código (Z-A)</SelectItem>
                                    <SelectItem value="unitCost-asc">Costo Unitario (menor)</SelectItem>
                                    <SelectItem value="unitCost-desc">Costo Unitario (mayor)</SelectItem>
                                    <SelectItem value="totalCost-asc">Costo Total (menor)</SelectItem>
                                    <SelectItem value="totalCost-desc">Costo Total (mayor)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredPartidas.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Buscar APU..."
                    onExportExcel={handleExportExcel}
                    onExportPDF={() => handleExportPDF()}
                />
            )}

            {/* Floating Action Bar */}
            <div className="fixed bottom-6 right-6 z-50">
                <div className="flex items-center space-x-3 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
                    <Button
                        onClick={() => openModal('create')}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                        size="sm"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nueva Partida APU</span>
                    </Button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <Button
                        onClick={handleExportExcel}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                    >
                        <Download className="h-4 w-4" />
                        <span>Excel</span>
                    </Button>
                    <Button
                        onClick={() => handleExportPDF()}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                    >
                        <FileText className="h-4 w-4" />
                        <span>PDF</span>
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <ApuFormModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSavePartida}
            />

            <ApuFormModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                partida={selectedPartida}
                onSave={handleSavePartida}
            />

            <ApuFormModal
                isOpen={modals.view}
                onClose={() => closeModal('view')}
                partida={selectedPartida}
                onSave={handleSavePartida}
                readOnly={true}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeletePartida}
                title="Eliminar Partida APU"
                message="¿Estás seguro de que quieres eliminar esta partida APU? Esta acción no se puede deshacer."
                itemName={selectedPartida?.name || 'esta partida APU'}
            />
        </Layout>
    )
}
