"use client"

import Layout from '../../../components/Layout'
import ProspectFormModal from '../../../components/modals/ProspectFormModal'
import ConfirmDeleteModal from '../../../components/modals/ConfirmDeleteModal'
import ActivityFormModal from '../../../components/modals/ActivityFormModal'
import NoteFormModal from '../../../components/modals/NoteFormModal'
import CommunicationFormModal from '../../../components/modals/CommunicationFormModal'
import { ProspectImportModal } from '../../../components/modals/ProspectImportModal'
import Pagination from '../../../components/ui/Pagination'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, EyeIcon, UserPlusIcon, ArrowRightIcon, CalendarIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, UserIcon, PlusIcon, PhoneIcon, UsersIcon, CheckIcon, LockClosedIcon, ClockIcon, EnvelopeIcon, XMarkIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { MarketingEmailSection } from '@/components/MarketingEmailSection'

export default function Prospects() {
    const { data: session } = useSession()
    const [prospects, setProspects] = useState<any[]>([])

    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false,
        details: false,
        convert: false,
        activity: false,
        note: false,
        communication: false,
        import: false,
    })

    const [selectedProspect, setSelectedProspect] = useState<any>(null)
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // CRM state
    const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'notes' | 'communications' | 'marketing'>('overview')
    const [crmData, setCrmData] = useState({
        activities: [],
        notes: [],
        communications: []
    })

    // Estados para edición de CRM items
    const [editingActivity, setEditingActivity] = useState<any>(null)
    const [editingNote, setEditingNote] = useState<any>(null)
    const [editingCommunication, setEditingCommunication] = useState<any>(null)
    const [deletingItem, setDeletingItem] = useState<{ type: string; item: any } | null>(null)

    // Estados para filtros y ordenamiento
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [prospectStatusFilter, setProspectStatusFilter] = useState<string>('')
    const [cityFilter, setCityFilter] = useState<string>('')
    const [projectInterestFilter, setProjectInterestFilter] = useState<string>('')
    const [materialInterestFilter, setMaterialInterestFilter] = useState<string>('')
    const [rubroInterestFilter, setRubroInterestFilter] = useState<string>('')

    // Estados para import/export
    const [isImporting, setIsImporting] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        const load = async () => {
            try {
                const orgId = session?.user?.organizationId
                if (!orgId) return
                const res = await fetch(`/api/clients?organizationId=${orgId}&status=PROSPECT`)
                if (!res.ok) return
                const data = await res.json()
                setProspects(data)
            } catch (e) {
                console.error(e)
            }
        }
        load()
    }, [session])

    // Lógica de filtrado y ordenamiento
    const filteredProspects = useMemo(() => {
        let filtered = prospects

        // Aplicar filtro de búsqueda
        if (searchTerm) {
            filtered = filtered.filter(prospect =>
                prospect.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prospect.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prospect.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prospect.phone?.includes(searchTerm)
            )
        }

        // Aplicar filtro de estado del prospecto
        if (prospectStatusFilter) {
            filtered = filtered.filter(prospect => prospect.situacion === prospectStatusFilter)
        }

        // Aplicar filtro de ciudad
        if (cityFilter) {
            filtered = filtered.filter(prospect =>
                prospect.city?.toLowerCase().includes(cityFilter.toLowerCase())
            )
        }

        // Aplicar filtro de proyectos de interés
        if (projectInterestFilter) {
            filtered = filtered.filter(prospect =>
                prospect.projectInterests?.includes(projectInterestFilter)
            )
        }

        // Aplicar filtro de materiales de interés
        if (materialInterestFilter) {
            filtered = filtered.filter(prospect =>
                prospect.materialInterests?.includes(materialInterestFilter)
            )
        }

        // Aplicar filtro de rubros de interés
        if (rubroInterestFilter) {
            filtered = filtered.filter(prospect =>
                prospect.rubroInterests?.includes(rubroInterestFilter)
            )
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            if (sortField === 'name') {
                aValue = (aValue || '').toLowerCase()
                bValue = (bValue || '').toLowerCase()
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [prospects, sortField, sortDirection, searchTerm, prospectStatusFilter, cityFilter, projectInterestFilter, materialInterestFilter, rubroInterestFilter])

    // Datos paginados para mostrar en la tabla
    const paginatedProspects = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredProspects.slice(startIndex, endIndex)
    }, [filteredProspects, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [sortField, sortDirection, searchTerm, prospectStatusFilter, cityFilter, projectInterestFilter, materialInterestFilter, rubroInterestFilter])

    // Calculate total pages
    const totalPages = Math.ceil(filteredProspects.length / itemsPerPage)

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

    const loadCrmData = async (prospectId: string) => {
        try {
            const [activitiesRes, notesRes, communicationsRes] = await Promise.all([
                fetch(`/api/clients/prospects/${prospectId}/activities`),
                fetch(`/api/clients/prospects/${prospectId}/notes`),
                fetch(`/api/clients/prospects/${prospectId}/communications`)
            ])

            const activities = activitiesRes.ok ? await activitiesRes.json() : []
            const notes = notesRes.ok ? await notesRes.json() : []
            const communications = communicationsRes.ok ? await communicationsRes.json() : []

            setCrmData({ activities, notes, communications })
        } catch (error) {
            console.error('Error loading CRM data:', error)
        }
    }

    const openCrmView = async (prospect: any) => {
        setSelectedProspect(prospect)
        setActiveTab('overview')
        await loadCrmData(prospect.id)
    }

    const openModal = async (modalType: keyof typeof modals, prospect?: any) => {
        setSelectedProspect(null)
        if (modalType === 'edit' && prospect?.id) {
            try {
                const res = await fetch(`/api/clients/${prospect.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setSelectedProspect(data)
                } else {
                    setSelectedProspect(prospect)
                }
            } catch (e) {
                setSelectedProspect(prospect)
            }
        } else {
            setSelectedProspect(prospect)
        }
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedProspect(null)
    }

    const handleSaveProspect = async (prospectData: any) => {
        try {
            const orgId = session?.user?.organizationId
            const userId = session?.user?.id
            if (selectedProspect?.id) {
                const res = await fetch(`/api/clients/${selectedProspect.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prospectData),
                })
                if (!res.ok) throw new Error('failed')
                const updated = await res.json()
                setProspects(prospects.map(p => (p.id === updated.id ? updated : p)))
            } else {
                const payload = { ...prospectData, organizationId: orgId, createdById: userId, status: 'PROSPECT' }
                const res = await fetch(`/api/clients`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                if (!res.ok) throw new Error('failed')
                const created = await res.json()
                setProspects(prev => [created, ...prev])
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleConvertToClient = async (prospect: any) => {
        try {
            const res = await fetch(`/api/clients/${prospect.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...prospect, status: 'ACTIVE' }),
            })
            if (!res.ok) throw new Error('failed')
            // Remover de la lista de prospectos
            setProspects(prospects.filter(p => p.id !== prospect.id))
            alert('Prospecto convertido a cliente exitosamente')
        } catch (e) {
            console.error(e)
            alert('Error al convertir prospecto a cliente')
        }
    }

    const handleDeleteProspect = async () => {
        try {
            if (!selectedProspect?.id) return
            const res = await fetch(`/api/clients/${selectedProspect.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('delete failed')
            setProspects(prospects.filter(prospect => prospect.id !== selectedProspect.id))
            setSelectedProspect(null)
        } catch (e) {
            console.error(e)
        }
    }

    const handleNewActivity = () => {
        setModals({ ...modals, activity: true })
    }

    const handleNewNote = () => {
        setModals({ ...modals, note: true })
    }

    const handleNewCommunication = () => {
        setModals({ ...modals, communication: true })
    }

    const handleSaveActivity = (newActivity: any) => {
        setCrmData((prev: any) => ({
            ...prev,
            activities: [newActivity, ...prev.activities]
        }))
    }

    const handleSaveNote = (newNote: any) => {
        setCrmData((prev: any) => ({
            ...prev,
            notes: [newNote, ...prev.notes]
        }))
    }

    const handleSaveCommunication = (newCommunication: any) => {
        setCrmData((prev: any) => ({
            ...prev,
            communications: [newCommunication, ...prev.communications]
        }))
    }

    // Funciones para editar CRM items
    const handleEditActivity = (activity: any) => {
        setEditingActivity(activity)
        setModals({ ...modals, activity: true })
    }

    const handleEditNote = (note: any) => {
        setEditingNote(note)
        setModals({ ...modals, note: true })
    }

    const handleEditCommunication = (communication: any) => {
        setEditingCommunication(communication)
        setModals({ ...modals, communication: true })
    }

    // Funciones para eliminar CRM items
    const handleDeleteActivity = async (activity: any) => {
        try {
            const response = await fetch(`/api/clients/prospects/${selectedProspect.id}/activities/${activity.id}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                setCrmData((prev: any) => ({
                    ...prev,
                    activities: prev.activities.filter((a: any) => a.id !== activity.id)
                }))
                setDeletingItem(null)
            }
        } catch (error) {
            console.error('Error deleting activity:', error)
        }
    }

    const handleDeleteNote = async (note: any) => {
        try {
            const response = await fetch(`/api/clients/prospects/${selectedProspect.id}/notes/${note.id}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                setCrmData((prev: any) => ({
                    ...prev,
                    notes: prev.notes.filter((n: any) => n.id !== note.id)
                }))
                setDeletingItem(null)
            }
        } catch (error) {
            console.error('Error deleting note:', error)
        }
    }

    const handleDeleteCommunication = async (communication: any) => {
        try {
            const response = await fetch(`/api/clients/prospects/${selectedProspect.id}/communications/${communication.id}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                setCrmData((prev: any) => ({
                    ...prev,
                    communications: prev.communications.filter((c: any) => c.id !== communication.id)
                }))
                setDeletingItem(null)
            }
        } catch (error) {
            console.error('Error deleting communication:', error)
        }
    }

    // Funciones para guardar ediciones
    const handleSaveActivityEdit = async (activityData: any) => {
        try {
            const response = await fetch(`/api/clients/prospects/${selectedProspect.id}/activities/${editingActivity.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activityData)
            })
            if (response.ok) {
                const updatedActivity = await response.json()
                setCrmData((prev: any) => ({
                    ...prev,
                    activities: prev.activities.map((a: any) => a.id === editingActivity.id ? updatedActivity : a)
                }))
                setEditingActivity(null)
                setModals({ ...modals, activity: false })
            }
        } catch (error) {
            console.error('Error updating activity:', error)
        }
    }

    const handleSaveNoteEdit = async (noteData: any) => {
        try {
            const response = await fetch(`/api/clients/prospects/${selectedProspect.id}/notes/${editingNote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            })
            if (response.ok) {
                const updatedNote = await response.json()
                setCrmData((prev: any) => ({
                    ...prev,
                    notes: prev.notes.map((n: any) => n.id === editingNote.id ? updatedNote : n)
                }))
                setEditingNote(null)
                setModals({ ...modals, note: false })
            }
        } catch (error) {
            console.error('Error updating note:', error)
        }
    }

    const handleSaveCommunicationEdit = async (communicationData: any) => {
        try {
            const response = await fetch(`/api/clients/prospects/${selectedProspect.id}/communications/${editingCommunication.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(communicationData)
            })
            if (response.ok) {
                const updatedCommunication = await response.json()
                setCrmData((prev: any) => ({
                    ...prev,
                    communications: prev.communications.map((c: any) => c.id === editingCommunication.id ? updatedCommunication : c)
                }))
                setEditingCommunication(null)
                setModals({ ...modals, communication: false })
            }
        } catch (error) {
            console.error('Error updating communication:', error)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'A_CONTACTAR':
                return 'bg-gray-100 text-gray-800'
            case 'CONTACTADO_ESPERANDO':
                return 'bg-blue-100 text-blue-800'
            case 'COTIZANDO':
                return 'bg-yellow-100 text-yellow-800'
            case 'NEGOCIANDO':
                return 'bg-orange-100 text-orange-800'
            case 'GANADO':
                return 'bg-green-100 text-green-800'
            case 'PERDIDO':
                return 'bg-red-100 text-red-800'
            case 'SIN_INTERES':
                return 'bg-purple-100 text-purple-800'
            case 'PROSPECT':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    // Funciones de import/export
    const handleImportExcel = async () => {
        setModals({ ...modals, import: true })
    }

    const handleImportFile = async (file: File) => {
        setIsImporting(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/clients/prospects/import/excel', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()

            if (response.ok) {
                alert(`Importación exitosa: ${result.message}`)
                // Recargar prospectos
                const orgId = session?.user?.organizationId
                if (orgId) {
                    const res = await fetch(`/api/clients?organizationId=${orgId}&status=PROSPECT`)
                    if (res.ok) {
                        const data = await res.json()
                        setProspects(data)
                    }
                }
                setModals({ ...modals, import: false })
            } else {
                throw new Error(result.error || 'Error en la importación')
            }
        } catch (error) {
            console.error('Error importing prospects:', error)
            throw error
        } finally {
            setIsImporting(false)
        }
    }

    const handleExportExcel = async () => {
        try {
            const response = await fetch('/api/clients/prospects/export/excel')

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `prospectos_${new Date().toISOString().split('T')[0]}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert('Error al exportar prospectos')
            }
        } catch (error) {
            console.error('Error exporting prospects:', error)
            alert('Error al exportar prospectos')
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch('/api/clients/prospects/import/template')

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'plantilla_prospectos.xlsx'
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert('Error al descargar la plantilla')
            }
        } catch (error) {
            console.error('Error downloading template:', error)
            alert('Error al descargar la plantilla')
        }
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setImportFile(file)
            // Auto-import when file is selected
            setTimeout(() => handleImportExcel(), 100)
        }
    }

    // Función para limpiar todos los filtros
    const handleClearFilters = () => {
        setSearchTerm('')
        setProspectStatusFilter('')
        setCityFilter('')
        setProjectInterestFilter('')
        setMaterialInterestFilter('')
        setRubroInterestFilter('')
        setCurrentPage(1)
    }

    return (
        <Layout title="Prospectos" subtitle="Gestión de leads y conversión a clientes">
            {/* header and actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div></div>
                <button
                    onClick={() => openModal('create')}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Nuevo Prospecto
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
                            <dt className="text-sm font-medium text-gray-500 truncate">Total prospectos</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{filteredProspects.length}</dd>
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
                            <dt className="text-sm font-medium text-gray-500 truncate">Conversión potencial</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{Math.round(filteredProspects.length * 0.3)}</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Actividades hoy</dt>
                            <dd className="text-2xl font-semibold text-gray-900">0</dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Tasa conversión</dt>
                            <dd className="text-2xl font-semibold text-gray-900">23%</dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">Lista de Prospectos</h2>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Filtrar por ciudad..."
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <select
                                value={prospectStatusFilter}
                                onChange={(e) => setProspectStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Estado prospecto</option>
                                <option value="A_CONTACTAR">A Contactar</option>
                                <option value="CONTACTADO_ESPERANDO">Contactado - Esperando</option>
                                <option value="COTIZANDO">Cotizando</option>
                                <option value="NEGOCIANDO">Negociando</option>
                                <option value="GANADO">Ganado</option>
                                <option value="PERDIDO">Perdido</option>
                                <option value="SIN_INTERES">Sin Interés</option>
                            </select>
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md transition-colors flex items-center gap-2"
                                title="Limpiar todos los filtros"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Prospecto
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciudad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intereses</th>
                                <th className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedProspects.map(prospect => (
                                <tr key={prospect.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openCrmView(prospect)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <span className="text-white font-medium text-sm">{(prospect.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{prospect.name}</div>
                                                <div className="text-sm text-gray-500">{prospect.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{prospect.contactName}</div>
                                        <div className="text-sm text-gray-500">{prospect.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(prospect.situacion || 'A_CONTACTAR')} shadow-sm`}>
                                            {prospect.situacion === 'A_CONTACTAR' ? 'A Contactar' :
                                                prospect.situacion === 'CONTACTADO_ESPERANDO' ? 'Contactado - Esperando' :
                                                    prospect.situacion === 'COTIZANDO' ? 'Cotizando' :
                                                        prospect.situacion === 'NEGOCIANDO' ? 'Negociando' :
                                                            prospect.situacion === 'GANADO' ? 'Ganado' :
                                                                prospect.situacion === 'PERDIDO' ? 'Perdido' :
                                                                    prospect.situacion === 'SIN_INTERES' ? 'Sin Interés' :
                                                                        'A Contactar'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {prospect.city || 'Sin especificar'}
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900">
                                        <div className="max-w-xs truncate" title={`${(prospect.projectInterests || []).join(', ')}, ${(prospect.materialInterests || []).join(', ')}, ${(prospect.rubroInterests || []).join(', ')}`}>
                                            {[
                                                ...(prospect.projectInterests || []),
                                                ...(prospect.materialInterests || []),
                                                ...(prospect.rubroInterests || [])
                                            ].slice(0, 3).join(', ') || 'Sin intereses'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleDropdown(prospect.id)
                                                }}
                                                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <EllipsisVerticalIcon className="h-5 w-5" />
                                            </button>
                                            {openDropdownId === prospect.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                openModal('edit', prospect)
                                                            }}
                                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                        >
                                                            <PencilIcon className="h-4 w-4 mr-3" />
                                                            Editar Prospecto
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                openCrmView(prospect)
                                                            }}
                                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                                        >
                                                            <EyeIcon className="h-4 w-4 mr-3" />
                                                            Ver Detalles CRM
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                handleConvertToClient(prospect)
                                                            }}
                                                            className="flex items-center w-full px-4 py-3 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                                        >
                                                            <ArrowRightIcon className="h-4 w-4 mr-3" />
                                                            Convertir a Cliente
                                                        </button>
                                                        <div className="border-t border-gray-100 my-1"></div>
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownId(null)
                                                                setSelectedProspect(prospect)
                                                                openModal('delete', prospect)
                                                            }}
                                                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            <TrashIcon className="h-4 w-4 mr-3" />
                                                            Eliminar Prospecto
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
                        Mostrando {paginatedProspects.length} de {filteredProspects.length} prospectos
                    </div>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                <div className="px-4 py-4 border-b border-gray-200 bg-white">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">Lista de Prospectos</h2>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Filtrar por ciudad..."
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            <select
                                value={prospectStatusFilter}
                                onChange={(e) => setProspectStatusFilter(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                            >
                                <option value="">Estado prospecto</option>
                                <option value="A_CONTACTAR">A Contactar</option>
                                <option value="CONTACTADO_ESPERANDO">Contactado - Esperando</option>
                                <option value="COTIZANDO">Cotizando</option>
                                <option value="NEGOCIANDO">Negociando</option>
                                <option value="GANADO">Ganado</option>
                                <option value="PERDIDO">Perdido</option>
                                <option value="SIN_INTERES">Sin Interés</option>
                            </select>
                            <button
                                onClick={handleClearFilters}
                                className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                title="Limpiar todos los filtros"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                {paginatedProspects.length > 0 ? (
                    <div className="space-y-3 px-4">
                        {paginatedProspects.map(prospect => (
                            <div
                                key={prospect.id}
                                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                onClick={() => openCrmView(prospect)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="flex-shrink-0">
                                            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {(prospect.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                                    {prospect.name}
                                                </h3>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prospect.situacion || 'A_CONTACTAR')}`}>
                                                    {prospect.situacion === 'A_CONTACTAR' ? 'A Contactar' :
                                                        prospect.situacion === 'CONTACTADO_ESPERANDO' ? 'Contactado - Esperando' :
                                                            prospect.situacion === 'COTIZANDO' ? 'Cotizando' :
                                                                prospect.situacion === 'NEGOCIANDO' ? 'Negociando' :
                                                                    prospect.situacion === 'GANADO' ? 'Ganado' :
                                                                        prospect.situacion === 'PERDIDO' ? 'Perdido' :
                                                                            prospect.situacion === 'SIN_INTERES' ? 'Sin Interés' :
                                                                                'A Contactar'}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
                                                    <span className="truncate">{prospect.email || 'Sin email'}</span>
                                                </div>
                                                {prospect.phone && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                                                        <span>{prospect.phone}</span>
                                                    </div>
                                                )}
                                                {prospect.contactName && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <UserIcon className="h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate">{prospect.contactName}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                                Ciudad: {prospect.city || 'Sin especificar'}
                                            </div>
                                            {(prospect.projectInterests?.length > 0 || prospect.materialInterests?.length > 0 || prospect.rubroInterests?.length > 0) && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {prospect.projectInterests?.slice(0, 2).map((interest: string, index: number) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                                            {interest}
                                                        </span>
                                                    ))}
                                                    {prospect.materialInterests?.slice(0, 1).map((interest: string, index: number) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                                            {interest}
                                                        </span>
                                                    ))}
                                                    {(prospect.projectInterests?.length > 2 || prospect.materialInterests?.length > 1 || prospect.rubroInterests?.length > 0) && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                                            +{Math.max(0, (prospect.projectInterests?.length || 0) - 2 + (prospect.materialInterests?.length || 0) - 1 + (prospect.rubroInterests?.length || 0))} más
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setOpenDropdownId(null)
                                                        openModal('edit', prospect)
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <PencilIcon className="h-4 w-4 mr-2" />
                                                    Editar Prospecto
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setOpenDropdownId(null)
                                                        openCrmView(prospect)
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <EyeIcon className="h-4 w-4 mr-2" />
                                                    Ver Detalles CRM
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setOpenDropdownId(null)
                                                        handleConvertToClient(prospect)
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <ArrowRightIcon className="h-4 w-4 mr-2" />
                                                    Convertir a Cliente
                                                </DropdownMenuItem>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setOpenDropdownId(null)
                                                        setSelectedProspect(prospect)
                                                        openModal('delete', prospect)
                                                    }}
                                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                                >
                                                    <TrashIcon className="h-4 w-4 mr-2" />
                                                    Eliminar Prospecto
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-4 py-12 text-center">
                        <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No hay prospectos</p>
                        <p className="text-gray-400 text-sm mt-2">Comienza creando tu primer prospecto</p>
                    </div>
                )}

                {/* Mobile Pagination Info */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-600 text-center">
                        Mostrando {paginatedProspects.length} de {filteredProspects.length} prospectos
                    </div>
                </div>
            </div>

            {/* Pagination Component */}
            <div className="mt-6">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredProspects.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Buscar prospectos..."
                    onImportExcel={handleImportExcel}
                    onExportExcel={handleExportExcel}
                    onDownloadTemplate={handleDownloadTemplate}
                />
            </div>

            {/* CRM View */}
            {selectedProspect && (
                <div className="mt-8 bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-xl">
                                        {(selectedProspect.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedProspect.name}</h2>
                                    <p className="text-sm text-gray-600 flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <EnvelopeIcon className="h-4 w-4" />
                                            {selectedProspect.email}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <PhoneIcon className="h-4 w-4" />
                                            {selectedProspect.phone}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => openModal('edit', selectedProspect)}
                                    className="w-full sm:w-auto inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                    <PencilIcon className="h-4 w-4 mr-2" />
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleConvertToClient(selectedProspect)}
                                    className="w-full sm:w-auto inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                    <ArrowRightIcon className="h-4 w-4 mr-2" />
                                    Convertir a Cliente
                                </button>
                                <button
                                    onClick={() => setSelectedProspect(null)}
                                    className="w-full sm:w-auto inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    <XMarkIcon className="h-4 w-4 mr-2" />
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
                                <UserIcon className="h-5 w-5 mr-2 sm:mr-3 flex-shrink-0" />
                                <span className="hidden sm:inline">Información General</span>
                                <span className="sm:hidden">General</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('activities')}
                                className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-3 transition-all duration-200 whitespace-nowrap min-w-max ${activeTab === 'activities'
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <CalendarIcon className="h-5 w-5 mr-2 sm:mr-3 flex-shrink-0" />
                                <span className="hidden sm:inline">Actividades</span>
                                <span className="sm:hidden">Actividades</span>
                                {crmData.activities.length > 0 && (
                                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                                        {crmData.activities.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-3 transition-all duration-200 whitespace-nowrap min-w-max ${activeTab === 'notes'
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <DocumentTextIcon className="h-5 w-5 mr-2 sm:mr-3 flex-shrink-0" />
                                <span className="hidden sm:inline">Notas</span>
                                <span className="sm:hidden">Notas</span>
                                {crmData.notes.length > 0 && (
                                    <span className="ml-2 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                        {crmData.notes.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('communications')}
                                className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-3 transition-all duration-200 whitespace-nowrap min-w-max ${activeTab === 'communications'
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 sm:mr-3 flex-shrink-0" />
                                <span className="hidden sm:inline">Comunicaciones</span>
                                <span className="sm:hidden">Comms</span>
                                {crmData.communications.length > 0 && (
                                    <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full">
                                        {crmData.communications.length}
                                    </span>
                                )}
                            </button>
                            {session?.user?.organizationId === 'cmfhlseem0000rdo84w0c4jgt' && (
                                <button
                                    onClick={() => setActiveTab('marketing')}
                                    className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold border-b-3 transition-all duration-200 whitespace-nowrap min-w-max ${activeTab === 'marketing'
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <EnvelopeIcon className="h-5 w-5 mr-2 sm:mr-3 flex-shrink-0" />
                                    <span className="hidden sm:inline">Marketing</span>
                                    <span className="sm:hidden">Marketing</span>
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Tab Content - Mobile Optimized */}
                    <div className="p-4 sm:p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                                            Información de Contacto
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <label className="text-sm font-medium text-gray-500">Nombre</label>
                                                <p className="text-sm text-gray-900 text-right">{selectedProspect.name}</p>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <label className="text-sm font-medium text-gray-500">Email</label>
                                                <p className="text-sm text-gray-900 text-right break-all">{selectedProspect.email || 'No especificado'}</p>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                                                <p className="text-sm text-gray-900 text-right">{selectedProspect.phone || 'No especificado'}</p>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <label className="text-sm font-medium text-gray-500">Dirección</label>
                                                <p className="text-sm text-gray-900 text-right">{selectedProspect.address || 'No especificada'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <LightBulbIcon className="h-5 w-5 mr-2 text-green-600" />
                                            Intereses
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="py-2 border-b border-gray-200">
                                                <label className="text-sm font-medium text-gray-500 block mb-1">Proyectos de Interés</label>
                                                <p className="text-sm text-gray-900">
                                                    {selectedProspect.projectInterests?.length > 0
                                                        ? selectedProspect.projectInterests.join(', ')
                                                        : 'Ninguno especificado'
                                                    }
                                                </p>
                                            </div>
                                            <div className="py-2 border-b border-gray-200">
                                                <label className="text-sm font-medium text-gray-500 block mb-1">Materiales de Interés</label>
                                                <p className="text-sm text-gray-900">
                                                    {selectedProspect.materialInterests?.length > 0
                                                        ? selectedProspect.materialInterests.join(', ')
                                                        : 'Ninguno especificado'
                                                    }
                                                </p>
                                            </div>
                                            <div className="py-2 border-b border-gray-200">
                                                <label className="text-sm font-medium text-gray-500 block mb-1">Rubros de Interés</label>
                                                <p className="text-sm text-gray-900">
                                                    {selectedProspect.rubroInterests?.length > 0
                                                        ? selectedProspect.rubroInterests.join(', ')
                                                        : 'Ninguno especificado'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {selectedProspect.prospectNotes && (
                                    <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                            <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-600" />
                                            Notas Adicionales
                                        </h3>
                                        <p className="text-sm text-gray-700 leading-relaxed">{selectedProspect.prospectNotes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'activities' && (
                            <div className="space-y-4 sm:space-y-6">
                                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                            <ClockIcon className="h-5 w-5 mr-2 text-orange-600" />
                                            Historial de Actividades
                                        </h3>
                                        <button
                                            onClick={handleNewActivity}
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                        >
                                            <PlusIcon className="h-4 w-4 mr-2" />
                                            Nueva Actividad
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {crmData.activities.length > 0 ? (
                                            crmData.activities.map((activity: any) => (
                                                <div key={activity.id} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-start gap-3 mb-2">
                                                                <div className={`p-2 rounded-lg flex-shrink-0 ${activity.type === 'CALL' ? 'bg-blue-100 text-blue-600' :
                                                                    activity.type === 'MEETING' ? 'bg-green-100 text-green-600' :
                                                                        activity.type === 'EMAIL' ? 'bg-purple-100 text-purple-600' :
                                                                            'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    {activity.type === 'CALL' && <PhoneIcon className="h-4 w-4" />}
                                                                    {activity.type === 'MEETING' && <UsersIcon className="h-4 w-4" />}
                                                                    {activity.type === 'EMAIL' && <EnvelopeIcon className="h-4 w-4" />}
                                                                    {activity.type === 'TASK' && <CheckIcon className="h-4 w-4" />}
                                                                    {activity.type === 'FOLLOW_UP' && <ArrowRightIcon className="h-4 w-4" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{activity.title}</h4>
                                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                                                            activity.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                                                'bg-green-100 text-green-800'
                                                                            }`}>
                                                                            {activity.priority}
                                                                        </span>
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                                                                            activity.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                                'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                            {activity.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">{activity.description}</p>
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 text-xs text-gray-500">
                                                                {activity.dueDate && (
                                                                    <div className="flex items-center gap-1">
                                                                        <CalendarIcon className="h-3 w-3" />
                                                                        <span>Vence: {new Date(activity.dueDate).toLocaleDateString('es-ES')}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1">
                                                                    <ClockIcon className="h-3 w-3" />
                                                                    <span>Creado: {new Date(activity.createdAt).toLocaleDateString('es-ES')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                                                        <EllipsisVerticalIcon className="h-4 w-4" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48">
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleEditActivity(activity)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <PencilIcon className="h-4 w-4 mr-2" />
                                                                        Editar actividad
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => setDeletingItem({ type: 'activity', item: activity })}
                                                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                                                    >
                                                                        <TrashIcon className="h-4 w-4 mr-2" />
                                                                        Eliminar actividad
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-500 text-sm sm:text-base font-medium">No hay actividades registradas</p>
                                                <p className="text-gray-400 text-xs sm:text-sm mt-2">Crea tu primera actividad para comenzar a organizar el seguimiento</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div className="space-y-4 sm:space-y-6">
                                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                            <DocumentTextIcon className="h-5 w-5 mr-2 text-green-600" />
                                            Notas
                                        </h3>
                                        <button
                                            onClick={handleNewNote}
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                                        >
                                            <PlusIcon className="h-4 w-4 mr-2" />
                                            Nueva Nota
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {crmData.notes.length > 0 ? (
                                            crmData.notes.map((note: any) => (
                                                <div key={note.id} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-start gap-3 mb-2">
                                                                <div className="p-2 bg-green-100 text-green-600 rounded-lg flex-shrink-0">
                                                                    <DocumentTextIcon className="h-4 w-4" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    {note.title && <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{note.title}</h4>}
                                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${note.type === 'GENERAL' ? 'bg-blue-100 text-blue-800' :
                                                                            note.type === 'FOLLOW_UP' ? 'bg-purple-100 text-purple-800' :
                                                                                note.type === 'OBJECTION' ? 'bg-red-100 text-red-800' :
                                                                                    'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                            {note.type}
                                                                        </span>
                                                                        {note.isPrivate && (
                                                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                                                                <LockClosedIcon className="h-3 w-3 inline mr-1" />
                                                                                Privada
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">{note.content}</p>
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 text-xs text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    <UserIcon className="h-3 w-3" />
                                                                    <span>Por: {note.createdBy?.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <ClockIcon className="h-3 w-3" />
                                                                    <span>{new Date(note.createdAt).toLocaleDateString('es-ES')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                                                        <EllipsisVerticalIcon className="h-4 w-4" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48">
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleEditNote(note)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <PencilIcon className="h-4 w-4 mr-2" />
                                                                        Editar nota
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => setDeletingItem({ type: 'note', item: note })}
                                                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                                                    >
                                                                        <TrashIcon className="h-4 w-4 mr-2" />
                                                                        Eliminar nota
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-500 text-sm sm:text-base font-medium">No hay notas registradas</p>
                                                <p className="text-gray-400 text-xs sm:text-sm mt-2">Crea notas para mantener un registro detallado de tus interacciones</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'communications' && (
                            <div className="space-y-4 sm:space-y-6">
                                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-purple-600" />
                                            Comunicaciones
                                        </h3>
                                        <button
                                            onClick={handleNewCommunication}
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                                        >
                                            <PlusIcon className="h-4 w-4 mr-2" />
                                            Nueva Comunicación
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {crmData.communications.length > 0 ? (
                                            crmData.communications.map((comm: any) => (
                                                <div key={comm.id} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-start gap-3 mb-2">
                                                                <div className={`p-2 rounded-lg flex-shrink-0 ${comm.type === 'EMAIL' ? 'bg-blue-100 text-blue-600' :
                                                                    comm.type === 'CALL' ? 'bg-green-100 text-green-600' :
                                                                        comm.type === 'MEETING' ? 'bg-orange-100 text-orange-600' :
                                                                            'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    {comm.type === 'EMAIL' && <EnvelopeIcon className="h-4 w-4" />}
                                                                    {comm.type === 'CALL' && <PhoneIcon className="h-4 w-4" />}
                                                                    {comm.type === 'MEETING' && <UsersIcon className="h-4 w-4" />}
                                                                    {comm.type === 'WHATSAPP' && <ChatBubbleLeftRightIcon className="h-4 w-4" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    {comm.subject && <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{comm.subject}</h4>}
                                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${comm.direction === 'INBOUND' ? 'bg-green-100 text-green-800' :
                                                                            'bg-blue-100 text-blue-800'
                                                                            }`}>
                                                                            {comm.direction === 'INBOUND' ? 'Entrante' : 'Saliente'}
                                                                        </span>
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${comm.status === 'SENT' ? 'bg-green-100 text-green-800' :
                                                                            comm.status === 'RECEIVED' ? 'bg-blue-100 text-blue-800' :
                                                                                comm.status === 'MISSED' ? 'bg-red-100 text-red-800' :
                                                                                    'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                            {comm.status}
                                                                        </span>
                                                                        {comm.duration && (
                                                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                                                                <ClockIcon className="h-3 w-3 inline mr-1" />
                                                                                {comm.duration} min

                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">{comm.content}</p>
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 text-xs text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    <UserIcon className="h-3 w-3" />
                                                                    <span>Por: {comm.createdBy?.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <ClockIcon className="h-3 w-3" />
                                                                    <span>{new Date(comm.createdAt).toLocaleDateString('es-ES')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                                                        <EllipsisVerticalIcon className="h-4 w-4" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48">
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleEditCommunication(comm)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <PencilIcon className="h-4 w-4 mr-2" />
                                                                        Editar comunicación
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => setDeletingItem({ type: 'communication', item: comm })}
                                                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                                                    >
                                                                        <TrashIcon className="h-4 w-4 mr-2" />
                                                                        Eliminar comunicación
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-500 text-sm sm:text-base font-medium">No hay comunicaciones registradas</p>
                                                <p className="text-gray-400 text-xs sm:text-sm mt-2">Registra todas tus interacciones para mantener un historial completo</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'marketing' && (
                            <div className="space-y-4 sm:space-y-6">
                                {session?.user?.organizationId === 'cmfhlseem0000rdo84w0c4jgt' ? (
                                    <MarketingEmailSection prospects={prospects} />
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                                        <div className="flex items-center justify-center mb-4">
                                            <svg className="h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-yellow-800 mb-2">
                                            Módulo de Marketing no Disponible
                                        </h3>
                                        <p className="text-yellow-700">
                                            El módulo de marketing por email solo está disponible para organizaciones autorizadas.
                                            Si necesitas acceso a esta funcionalidad, contacta al administrador del sistema.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ProspectFormModal isOpen={modals.create} onClose={() => closeModal('create')} onSave={handleSaveProspect} prospect={null} />
            <ProspectFormModal isOpen={modals.edit} onClose={() => closeModal('edit')} onSave={handleSaveProspect} prospect={selectedProspect} />
            <ProspectFormModal isOpen={modals.details} onClose={() => closeModal('details')} onSave={() => { }} prospect={selectedProspect} readOnly />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteProspect}
                title="Eliminar Prospecto"
                message={`¿Estás seguro de que quieres eliminar al prospecto "${selectedProspect?.name}"? Esta acción no se puede deshacer.`}
            />

            <ProspectImportModal
                isOpen={modals.import}
                onClose={() => setModals({ ...modals, import: false })}
                onImport={handleImportFile}
            />

            {selectedProspect && (
                <>
                    <ActivityFormModal
                        isOpen={modals.activity}
                        onClose={() => {
                            setModals({ ...modals, activity: false })
                            setEditingActivity(null)
                        }}
                        onSave={editingActivity ? handleSaveActivityEdit : handleSaveActivity}
                        prospectId={selectedProspect.id}
                        activity={editingActivity}
                    />
                    <NoteFormModal
                        isOpen={modals.note}
                        onClose={() => {
                            setModals({ ...modals, note: false })
                            setEditingNote(null)
                        }}
                        onSave={editingNote ? handleSaveNoteEdit : handleSaveNote}
                        prospectId={selectedProspect.id}
                        note={editingNote}
                    />
                    <CommunicationFormModal
                        isOpen={modals.communication}
                        onClose={() => {
                            setModals({ ...modals, communication: false })
                            setEditingCommunication(null)
                        }}
                        onSave={editingCommunication ? handleSaveCommunicationEdit : handleSaveCommunication}
                        prospectId={selectedProspect.id}
                        communication={editingCommunication}
                    />
                </>
            )}

            {/* Modal de confirmación para eliminar CRM items */}
            {deletingItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Eliminar {deletingItem.type === 'activity' ? 'Actividad' : deletingItem.type === 'note' ? 'Nota' : 'Comunicación'}
                                </h3>
                            </div>
                        </div>
                        <div className="mb-6">
                            <p className="text-sm text-gray-600">
                                ¿Estás seguro de que quieres eliminar esta {deletingItem.type === 'activity' ? 'actividad' : deletingItem.type === 'note' ? 'nota' : 'comunicación'}? Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeletingItem(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (deletingItem.type === 'activity') {
                                        handleDeleteActivity(deletingItem.item)
                                    } else if (deletingItem.type === 'note') {
                                        handleDeleteNote(deletingItem.item)
                                    } else if (deletingItem.type === 'communication') {
                                        handleDeleteCommunication(deletingItem.item)
                                    }
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
