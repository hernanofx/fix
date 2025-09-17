'use client'

import Layout from '../../components/Layout'
import TimeEntryModal from '../../components/modals/TimeEntryModal'
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal'
import Pagination from '@/components/ui/Pagination'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '../../components/ToastProvider'

function TimeTrackingContent() {
    const [timeEntries, setTimeEntries] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<string>('')
    const [selectedProject, setSelectedProject] = useState<string>('')
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
    const [selectedEntry, setSelectedEntry] = useState<any>(null)
    const [currentSession, setCurrentSession] = useState<any>(null)
    const [showCheckInModal, setShowCheckInModal] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null)
    const [totalPauseTime, setTotalPauseTime] = useState(0) // in milliseconds
    const [defaultLocation, setDefaultLocation] = useState<string>('')
    const [showLocationDropdown, setShowLocationDropdown] = useState(false)
    const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
    const [locationStatus, setLocationStatus] = useState<'loading' | 'available' | 'unavailable'>('loading')
    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false
    })
    const toast = useToast()

    // Filter and sort states
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [employeeFilter, setEmployeeFilter] = useState<string>('all')
    const [projectFilter, setProjectFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<string>('date')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Estados para paginación del resumen por empleado
    const [employeePage, setEmployeePage] = useState(1)
    const [employeeItemsPerPage, setEmployeeItemsPerPage] = useState(5)

    const { data: session } = useSession()
    const searchParams = useSearchParams()

    // Función para guardar el estado del fichaje activo en localStorage
    const saveActiveSessionToStorage = (sessionData: any) => {
        if (sessionData && session?.user?.id) {
            localStorage.setItem(`activeSession_${session.user.id}`, JSON.stringify({
                ...sessionData,
                isPaused,
                pauseStartTime: pauseStartTime?.toISOString(),
                totalPauseTime
            }))
        }
    }

    // Función auxiliar para recargar datos
    const loadTimeEntries = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) return

            const res = await fetch(`/api/time-tracking?organizationId=${organizationId}`)
            if (!res.ok) {
                throw new Error('Error al cargar registros')
            }
            const data = await res.json()
            setTimeEntries(data)

            // Actualizar sugerencias de ubicación
            const uniqueLocations = Array.from(new Set(
                data.map((entry: any) => entry.location).filter(Boolean)
            )).sort() as string[]
            setLocationSuggestions(uniqueLocations)

        } catch (error) {
            console.error('Error al cargar registros:', error)
        }
    }

    // Función para limpiar completamente el estado
    const clearAllSessionData = () => {
        setCurrentSession(null)
        setIsPaused(false)
        setPauseStartTime(null)
        setTotalPauseTime(0)
        clearActiveSessionFromStorage()
    }

    // Función para cargar el estado del fichaje activo desde localStorage
    // NOTA: no seteamos el estado local automáticamente aquí para evitar "autofichar"
    // al entrar a la pantalla. Esta función solo devuelve el objeto almacenado y
    // el efecto principal decidirá si restaurarlo (solo si la entrada existe y está ACTIVO en BD).
    const loadActiveSessionFromStorage = () => {
        if (session?.user?.id) {
            const stored = localStorage.getItem(`activeSession_${session.user.id}`)
            if (stored) {
                try {
                    const sessionData = JSON.parse(stored)
                    return sessionData
                } catch (error) {
                    console.error('Error loading active session from storage:', error)
                    localStorage.removeItem(`activeSession_${session.user.id}`)
                }
            }
        }
        return null
    }

    // Función para limpiar el estado del fichaje activo del localStorage
    const clearActiveSessionFromStorage = () => {
        if (session?.user?.id) {
            localStorage.removeItem(`activeSession_${session.user.id}`)
            // También limpiar cualquier key relacionada que pueda existir
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(`activeSession_${session.user.id}`)) {
                    localStorage.removeItem(key)
                }
            })
        }
    }

    useEffect(() => {
        const initializeTimeTracking = async () => {
            if (!session?.user?.organizationId) return

            try {
                const organizationId = (session as any)?.user?.organizationId

                // 1. Cargar todos los registros
                await loadTimeEntries()

                // 2. Buscar sesión activa SOLO en BD, NO en localStorage al inicializar
                const activeRes = await fetch(`/api/time-tracking?organizationId=${organizationId}&status=ACTIVO`)
                if (activeRes.ok) {
                    const activeEntries = await activeRes.json()

                    if (activeEntries.length > 0) {
                        // Si hay más de una activa, es un problema que debemos resolver
                        if (activeEntries.length > 1) {
                            console.warn('Múltiples sesiones activas encontradas:', activeEntries)
                            // Tomar la más reciente
                            const mostRecent = activeEntries.reduce((latest: any, current: any) =>
                                new Date(current.startTime) > new Date(latest.startTime) ? current : latest
                            )
                            setCurrentSession(mostRecent)
                            saveActiveSessionToStorage(mostRecent)
                        } else {
                            setCurrentSession(activeEntries[0])
                            saveActiveSessionToStorage(activeEntries[0])
                        }
                    } else {
                        // 3. Limpiar localStorage si no hay sesiones activas en BD
                        clearActiveSessionFromStorage()
                        setCurrentSession(null)
                    }
                }

                // 4. Cargar empleados y proyectos
                const [employeesRes, projectsRes] = await Promise.all([
                    fetch(`/api/employees?organizationId=${organizationId}`),
                    fetch(`/api/projects?organizationId=${organizationId}`)
                ])

                if (employeesRes.ok) {
                    const employeesData = await employeesRes.json()
                    setEmployees(employeesData)
                }

                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json()
                    setProjects(projectsData)

                    // Add project locations to suggestions
                    const projectLocations = projectsData
                        .map((project: any) => {
                            const parts = []
                            if (project.name) parts.push(project.name)
                            if (project.address) parts.push(project.address)
                            if (project.city) parts.push(project.city)
                            return parts.join(', ')
                        })
                        .filter((location: string) => location.trim() !== '')

                    const currentSuggestions = locationSuggestions
                    const allLocations = Array.from(new Set([
                        ...currentSuggestions,
                        ...projectLocations
                    ])).sort() as string[]

                    setLocationSuggestions(allLocations)
                }

            } catch (err: any) {
                console.error('Error al inicializar time-tracking:', err)
                toast.error('No se pudieron cargar los datos')
            }
        }

        initializeTimeTracking()
    }, [session?.user?.organizationId])

    // Detect modal parameter from URL
    useEffect(() => {
        const modal = searchParams.get('modal')
        if (modal === 'create') {
            openModal('create')
        }
    }, [searchParams])

    useEffect(() => {
        // Check geolocation availability
        if (navigator.geolocation) {
            // First check if we're on HTTPS or localhost
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

            if (!isSecure) {
                console.warn('Geolocalización requiere HTTPS en producción');
                setLocationStatus('unavailable');
                return;
            }

            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'granted') {
                    setLocationStatus('available')
                } else if (result.state === 'denied') {
                    setLocationStatus('unavailable')
                } else {
                    // Try to get position to check if it's actually available
                    navigator.geolocation.getCurrentPosition(
                        () => setLocationStatus('available'),
                        () => setLocationStatus('unavailable'),
                        { timeout: 10000 }
                    )
                }
            }).catch(() => {
                // Fallback for browsers that don't support permissions API
                navigator.geolocation.getCurrentPosition(
                    () => setLocationStatus('available'),
                    () => setLocationStatus('unavailable'),
                    { timeout: 10000 }
                )
            })
        } else {
            setLocationStatus('unavailable')
        }
    }, [])

    // Filtered and sorted time entries (sin paginación para estadísticas)
    const filteredTimeEntries = useMemo(() => {
        let filtered = timeEntries

        // Apply filters
        if (statusFilter !== 'all') {
            filtered = filtered.filter(entry => entry.status === statusFilter)
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortField) {
                case 'date':
                    aValue = new Date(a.date || a.startTime).getTime()
                    bValue = new Date(b.date || b.startTime).getTime()
                    break
                case 'employee':
                    aValue = a.employee ? `${a.employee.firstName} ${a.employee.lastName}`.trim() : ''
                    bValue = b.employee ? `${b.employee.firstName} ${b.employee.lastName}`.trim() : ''
                    break
                case 'project':
                    aValue = a.project ? a.project.name : ''
                    bValue = b.project ? b.project.name : ''
                    break
                case 'hours':
                    aValue = a.duration ? a.duration / 60 : 0 // Convert minutes to hours
                    bValue = b.duration ? b.duration / 60 : 0
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [timeEntries, statusFilter, employeeFilter, projectFilter, sortField, sortDirection])

    // Datos paginados para mostrar
    const paginatedTimeEntries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredTimeEntries.slice(startIndex, endIndex)
    }, [filteredTimeEntries, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
        setEmployeePage(1)
    }, [statusFilter, employeeFilter, projectFilter, sortField, sortDirection])

    // Guardar estado del fichaje activo cuando cambie
    useEffect(() => {
        if (currentSession) {
            const sessionData = {
                ...currentSession,
                isPaused,
                pauseStartTime: pauseStartTime?.toISOString(),
                totalPauseTime
            }
            saveActiveSessionToStorage(sessionData)
        }
    }, [currentSession, isPaused, pauseStartTime, totalPauseTime])

    // Guardar estado antes de que el usuario abandone la página
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (currentSession) {
                const sessionData = {
                    ...currentSession,
                    isPaused,
                    pauseStartTime: pauseStartTime?.toISOString(),
                    totalPauseTime
                }
                saveActiveSessionToStorage(sessionData)
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [currentSession, isPaused, pauseStartTime, totalPauseTime])

    // Auto-update pause time when paused
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (isPaused && pauseStartTime) {
            interval = setInterval(() => {
                const now = new Date().getTime()
                const pauseDuration = now - pauseStartTime.getTime()
                setTotalPauseTime(prev => prev + 1000) // Add 1 second
            }, 1000)
        }

        return () => {
            if (interval) {
                clearInterval(interval)
            }
        }
    }, [isPaused, pauseStartTime])

    // Calculate total pages
    const totalPages = Math.ceil(filteredTimeEntries.length / itemsPerPage)

    // Get unique values for filters
    const uniqueStatuses = useMemo(() => {
        const statuses = Array.from(new Set(timeEntries.map(entry => entry.status).filter(Boolean)))
        return statuses
    }, [timeEntries])

    const uniqueEmployees = useMemo(() => {
        const employees = Array.from(new Set(timeEntries.map(entry => {
            if (entry.employee) {
                return `${entry.employee.firstName} ${entry.employee.lastName}`.trim()
            }
            return null
        }).filter(Boolean))) as string[]
        return employees
    }, [timeEntries])

    const uniqueProjects = useMemo(() => {
        const projects = Array.from(new Set(timeEntries.map(entry => {
            if (entry.project) {
                return entry.project.name
            }
            return null
        }).filter(Boolean))) as string[]
        return projects
    }, [timeEntries])

    const openModal = async (modalType: keyof typeof modals, entry?: any) => {
        if (modalType === 'edit' && entry?.id) {
            try {
                const res = await fetch(`/api/time-tracking/${entry.id}`)
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Failed to fetch entry'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const data = await res.json()
                setSelectedEntry(data)
                setModals({ ...modals, [modalType]: true })
                return
            } catch (err) {
                console.error(err)
                toast.error('No se pudo cargar el registro para editar')
                return
            }
        }

        setSelectedEntry(entry)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedEntry(null)
    }

    const openDeleteModal = (entry: any) => {
        setSelectedEntry(entry)
        setModals({ ...modals, delete: true })
    }

    const handleSaveEntry = async (entryData: any) => {
        try {
            const userId = session?.user?.id as string | undefined
            const organizationId = (session as any)?.user?.organizationId as string | undefined

            if (selectedEntry?.id) {
                const res = await fetch(`/api/time-tracking/${selectedEntry.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...entryData,
                        employeeId: entryData.employeeId,
                        projectId: entryData.projectId,
                        startTime: entryData.startTime,
                        endTime: entryData.endTime,
                        description: entryData.description
                    })
                })
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Error updating entry'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const updated = await res.json()
                setTimeEntries(timeEntries.map(e => e.id === updated.id ? updated : e))

                // Si se actualizó la sesión actual y cambió su estado, actualizar el estado local
                if (currentSession?.id === updated.id) {
                    if (updated.status !== 'ACTIVO') {
                        clearAllSessionData()
                    } else {
                        setCurrentSession(updated)
                        saveActiveSessionToStorage(updated)
                    }
                }

                // Recargar datos para sincronizar
                await loadTimeEntries()
            } else {
                const payload = {
                    ...entryData,
                    createdById: userId,
                    organizationId,
                    employeeId: entryData.employeeId,
                    projectId: entryData.projectId,
                    startTime: entryData.startTime,
                    endTime: entryData.endTime,
                    description: entryData.description
                }
                // Debug: log payload and capture stack to trace unexpected auto-creates
                try {
                    console.log('DEBUG: Creating time-tracking entry (handleSaveEntry)', payload)
                    // Print a stack trace to identify caller
                    console.trace()
                } catch (e) {
                    // ignore
                }

                const res = await fetch('/api/time-tracking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = 'Error creating entry'
                    try { const j = txt ? JSON.parse(txt) : null; msg = j?.message || txt || msg } catch { msg = txt || msg }
                    throw new Error(msg)
                }
                const created = await res.json()

                // Actualizar lista local inmediatamente
                setTimeEntries(prev => [created, ...prev])

                // Si se creó una nueva entrada activa, actualizar el estado local
                if (created.status === 'ACTIVO') {
                    setCurrentSession(created)
                    saveActiveSessionToStorage(created)
                }

                // Recargar datos para sincronizar
                await loadTimeEntries()
            }

            closeModal('create')
            closeModal('edit')
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || 'Error al guardar registro')
        }
    }

    const handleDeleteEntry = async () => {
        if (!selectedEntry?.id) return
        try {
            const res = await fetch(`/api/time-tracking/${selectedEntry.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Error deleting')
            setTimeEntries(timeEntries.filter(entry => entry.id !== selectedEntry.id))
            if (currentSession?.id === selectedEntry.id) {
                clearAllSessionData()
            }
            closeModal('delete')
            toast.success('Registro eliminado')

            // Recargar datos para sincronizar
            await loadTimeEntries()
        } catch (err: any) {
            console.error(err)
            toast.error('No se pudo eliminar el registro')
        }
    }

    const validateTimeOverlap = (newStartTime: Date, newEndTime?: Date, excludeId?: string) => {
        const activeEntries = timeEntries.filter(entry =>
            entry.status === 'ACTIVO' &&
            entry.employeeId === selectedEmployee &&
            (!excludeId || entry.id !== excludeId)
        )

        for (const entry of activeEntries) {
            const entryStart = new Date(entry.startTime)
            const entryEnd = entry.endTime ? new Date(entry.endTime) : new Date()

            // Check for overlap
            if (newStartTime < entryEnd && (!newEndTime || newEndTime > entryStart)) {
                return true // There's an overlap
            }
        }
        return false // No overlap
    }

    const handleCheckIn = () => {
        setShowCheckInModal(true)
        // Auto-show location dropdown if there are suggestions
        if (locationSuggestions.length > 0) {
            setTimeout(() => setShowLocationDropdown(true), 100)
        }
    }

    const handlePause = () => {
        if (!currentSession || isPaused) return
        setIsPaused(true)
        setPauseStartTime(new Date())
        toast.info('Registro pausado')

        // Guardar estado actualizado en localStorage
        const updatedSession = { ...currentSession, isPaused: true, pauseStartTime: new Date().toISOString(), totalPauseTime }
        saveActiveSessionToStorage(updatedSession)
    }

    const handleResume = () => {
        if (!currentSession || !isPaused || !pauseStartTime) return

        const pauseDuration = new Date().getTime() - pauseStartTime.getTime()
        setTotalPauseTime(prev => prev + pauseDuration)
        setIsPaused(false)
        setPauseStartTime(null)
        toast.success('Registro reanudado')

        // Guardar estado actualizado en localStorage
        const updatedSession = {
            ...currentSession,
            isPaused: false,
            pauseStartTime: null,
            totalPauseTime: totalPauseTime + pauseDuration
        }
        saveActiveSessionToStorage(updatedSession)
    }

    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            // Using OpenStreetMap Nominatim API (free)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'Pix-TimeTracking/1.0'
                    }
                }
            )

            if (!response.ok) {
                throw new Error('Reverse geocoding failed')
            }

            const data = await response.json()
            if (data && data.display_name) {
                // Extract relevant parts of the address
                const address = data.address || {}
                const parts = []

                if (address.city || address.town || address.village) {
                    parts.push(address.city || address.town || address.village)
                }
                if (address.state || address.region) {
                    parts.push(address.state || address.region)
                }
                if (address.country) {
                    parts.push(address.country)
                }

                return parts.length > 0 ? parts.join(', ') : data.display_name.split(',')[0]
            }
        } catch (error) {
            console.warn('Reverse geocoding error:', error)
        }

        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }

    const handleCheckInSubmit = async () => {
        if (!selectedEmployee) {
            toast.error('Por favor selecciona un empleado')
            return
        }

        try {
            const now = new Date()
            const today = now.toISOString().split('T')[0]

            // Validate time overlap
            if (validateTimeOverlap(now)) {
                toast.error('Ya existe un registro activo para este empleado. Complete el registro anterior antes de iniciar uno nuevo.')
                return
            }

            // Get current location
            let location = defaultLocation || 'Ubicación no disponible'
            let coordinates = null
            try {
                if (navigator.geolocation && locationStatus === 'available') {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 15000, // Increased timeout
                            maximumAge: 300000 // Accept cached position up to 5 minutes old
                        })
                    })

                    coordinates = `${position.coords.latitude.toFixed(8)},${position.coords.longitude.toFixed(8)}`

                    // Try reverse geocoding for human-readable address
                    try {
                        const address = await reverseGeocode(position.coords.latitude, position.coords.longitude)
                        location = address
                        console.log('Dirección obtenida:', address)
                    } catch (geoError) {
                        // Fallback to coordinates if reverse geocoding fails
                        location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
                        console.log('Ubicación obtenida (coordenadas):', location)
                    }
                } else {
                    console.warn('Geolocalización no disponible o no permitida')
                    if (!defaultLocation) {
                        location = 'Ubicación no disponible'
                    }
                }
            } catch (geoError: any) {
                console.warn('Error al obtener ubicación:', geoError.message)
                if (!defaultLocation) {
                    location = 'Ubicación no disponible'
                }
                // Don't show error toast for geolocation issues, just log it
            }

            const user = (session as any)?.user
            const payload = {
                date: today,
                startTime: now.toISOString(),
                description: 'Entrada registrada',
                location: location,
                coordinates: coordinates,
                employeeId: selectedEmployee,
                projectId: selectedProject || null,
                organizationId: user?.organizationId,
                createdById: user?.id
            }

            // Debug: log payload and capture stack to trace unexpected auto-creates from check-in
            try {
                console.log('DEBUG: Creating time-tracking entry (handleCheckInSubmit)', payload)
                console.trace()
            } catch (e) {
                // ignore
            }

            const res = await fetch('/api/time-tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || 'Error creating check-in')
            }
            const created = await res.json()
            setTimeEntries([created, ...timeEntries])
            setCurrentSession(created)
            setShowCheckInModal(false)
            setSelectedEmployee('')
            setSelectedProject('')

            // Guardar el estado del fichaje activo en localStorage
            saveActiveSessionToStorage(created)

            const locationUsed = location || defaultLocation || 'ubicación no disponible'
            const locationSource = location && location !== 'Ubicación no disponible'
                ? 'geolocalización'
                : 'ubicación por defecto'

            toast.success(`Entrada registrada exitosamente usando ${locationSource}: ${locationUsed}`)
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || 'No se pudo registrar la entrada')
        }
    }

    const handleCheckOut = async () => {
        if (!currentSession) return

        // 1. Limpiar estado local inmediatamente para evitar problemas de sincronización
        const sessionToClose = currentSession
        setCurrentSession(null)
        setIsPaused(false)
        setPauseStartTime(null)
        setTotalPauseTime(0)
        clearActiveSessionFromStorage()

        try {
            const now = new Date()
            const res = await fetch(`/api/time-tracking/${sessionToClose.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endTime: now.toISOString(),
                    status: 'COMPLETADO'
                })
            })

            if (!res.ok) {
                const txt = await res.text().catch(() => null)
                let msg = 'Error al actualizar en servidor'
                try {
                    const j = txt ? JSON.parse(txt) : null
                    msg = j?.message || txt || msg
                } catch {
                    msg = txt || msg
                }
                throw new Error(msg)
            }

            const updated = await res.json()

            // 2. Actualizar lista local inmediatamente
            setTimeEntries(prev => prev.map(entry =>
                entry.id === sessionToClose.id ? updated : entry
            ))

            // 3. Recargar datos desde servidor para sincronizar
            await loadTimeEntries()

            toast.success('Salida registrada correctamente')

        } catch (err: any) {
            console.error('Error al fichar salida:', err)
            toast.error('Error al registrar salida')

            // 4. En caso de error, NO restaurar sesión - mantener limpio
            // El usuario tendrá que fichar entrada nuevamente si es necesario
        }
    }

    const calculateCurrentHours = (startTime: string) => {
        if (!startTime) return 0
        const now = new Date()
        const start = new Date(startTime)
        let diffMs = now.getTime() - start.getTime()

        // Subtract total pause time
        diffMs -= totalPauseTime

        // If currently paused, subtract current pause duration
        if (isPaused && pauseStartTime) {
            diffMs -= (now.getTime() - pauseStartTime.getTime())
        }

        return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVO': return 'bg-green-100 text-green-800'
            case 'COMPLETADO': return 'bg-blue-100 text-blue-800'
            case 'PAUSADO': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <Layout
            title="Registro Horario"
            subtitle="Control de asistencia y tiempo"
        >
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
                <div className="hidden lg:block"></div>
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-end">
                    <button
                        onClick={handleCheckIn}
                        disabled={currentSession !== null}
                        className={`font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${currentSession
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        <span className="hidden sm:inline">Fichar </span>Entrada
                    </button>
                    <button
                        onClick={handlePause}
                        disabled={currentSession === null || isPaused}
                        className={`font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${currentSession && !isPaused
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {isPaused ? 'Pausado' : 'Pausar'}
                    </button>
                    <button
                        onClick={handleResume}
                        disabled={currentSession === null || !isPaused}
                        className={`font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${currentSession && isPaused
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Reanudar
                    </button>
                    <button
                        onClick={handleCheckOut}
                        disabled={currentSession === null}
                        className={`font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${currentSession
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <span className="hidden sm:inline">Fichar </span>Salida
                    </button>
                    <a
                        href="/time-tracking/reports"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap inline-block text-center"
                    >
                        <span className="hidden sm:inline">Ver </span>Reportes
                    </a>
                </div>
            </div>

            {/* Current Status Card */}
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Estado Actual</h2>
                        <p className="text-gray-600">Tu jornada de hoy</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${currentSession ? (isPaused ? 'text-yellow-600' : 'text-green-600') : 'text-gray-600'}`}>
                            {currentSession ? (isPaused ? 'PAUSADO' : 'ACTIVO') : 'INACTIVO'}
                        </div>
                        {currentSession && (
                            <>
                                <div className="text-sm text-gray-600">
                                    Entrada: {currentSession.startTime ? new Date(currentSession.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }) : '-'}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Horas trabajadas: {currentSession.startTime ? calculateCurrentHours(currentSession.startTime) : 0}h
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center">
                        {locationStatus === 'loading' && (
                            <svg className="w-5 h-5 text-yellow-500 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                        {locationStatus === 'available' && (
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                        {locationStatus === 'unavailable' && (
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        )}
                        <span className="text-sm text-gray-600">
                            {locationStatus === 'loading' && 'Verificando geolocalización...'}
                            {locationStatus === 'available' && 'Geolocalización activa'}
                            {locationStatus === 'unavailable' && 'Geolocalización no disponible - usando ubicación por defecto'}
                        </span>
                    </div>
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-600">
                            {currentSession?.location || defaultLocation || 'Ubicación no disponible'}
                            {currentSession?.location && locationStatus === 'unavailable' && defaultLocation && (
                                <span className="text-xs text-orange-600 ml-1">(usando ubicación por defecto)</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow-sm rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                        <select
                            value={employeeFilter}
                            onChange={(e) => setEmployeeFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los empleados</option>
                            {uniqueEmployees.map(employee => (
                                <option key={employee} value={employee}>{employee}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
                        <select
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los proyectos</option>
                            {uniqueProjects.map(project => (
                                <option key={project} value={project}>{project}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex space-x-2">
                        {(statusFilter !== 'all' || employeeFilter !== 'all' || projectFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setStatusFilter('all')
                                    setEmployeeFilter('all')
                                    setProjectFilter('all')
                                }}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Time Entries Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Registros de Hoy</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => {
                                            if (sortField === 'employee') {
                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                            } else {
                                                setSortField('employee')
                                                setSortDirection('asc')
                                            }
                                        }}
                                        className="flex items-center hover:text-gray-700"
                                    >
                                        Empleado
                                        {sortField === 'employee' && (
                                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => {
                                            if (sortField === 'project') {
                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                            } else {
                                                setSortField('project')
                                                setSortDirection('asc')
                                            }
                                        }}
                                        className="flex items-center hover:text-gray-700"
                                    >
                                        Proyecto
                                        {sortField === 'project' && (
                                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => {
                                            if (sortField === 'date') {
                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                            } else {
                                                setSortField('date')
                                                setSortDirection('desc')
                                            }
                                        }}
                                        className="flex items-center hover:text-gray-700"
                                    >
                                        Fecha
                                        {sortField === 'date' && (
                                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Entrada
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Salida
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => {
                                            if (sortField === 'hours') {
                                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                            } else {
                                                setSortField('hours')
                                                setSortDirection('desc')
                                            }
                                        }}
                                        className="flex items-center hover:text-gray-700"
                                    >
                                        Horas
                                        {sortField === 'hours' && (
                                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ubicación
                                </th>
                                <th className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedTimeEntries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openModal('edit', entry)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">
                                                    {entry.employee ? `${entry.employee.firstName[0]}${entry.employee.lastName[0]}` : '?'}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {entry.employee ? `${entry.employee.firstName} ${entry.employee.lastName}` : 'Sin asignar'}
                                                </div>
                                                {entry.employee?.position && (
                                                    <div className="text-sm text-gray-500">{entry.employee.position}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {entry.project ? entry.project.name : 'Sin proyecto'}
                                        </div>
                                        {entry.project?.code && (
                                            <div className="text-sm text-gray-500">#{entry.project.code}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{entry.date ? new Date(entry.date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {entry.startTime ? new Date(entry.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }) : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {entry.endTime ? new Date(entry.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }) : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {entry.duration ? `${(entry.duration / 60).toFixed(2)}h` : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{entry.location}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative dropdown-container">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDropdownOpen(dropdownOpen === entry.id ? null : entry.id)
                                                }}
                                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>
                                            {dropdownOpen === entry.id && (
                                                <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-48">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openModal('edit', entry)
                                                            setDropdownOpen(null)
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openDeleteModal(entry)
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

            {/* Pagination */}
            {filteredTimeEntries.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredTimeEntries.length}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            )}

            {/* Weekly Summary */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Horas esta semana</dt>
                            <dd className="text-2xl font-semibold text-gray-900">
                                {filteredTimeEntries.reduce((total, entry) => total + ((entry.duration || 0) / 60), 0).toFixed(1)}h
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
                            <dt className="text-sm font-medium text-gray-500 truncate">Días trabajados</dt>
                            <dd className="text-2xl font-semibold text-gray-900">
                                {Array.from(new Set(filteredTimeEntries.map(entry => entry.date).filter(Boolean))).length}
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
                            <dt className="text-sm font-medium text-gray-500 truncate">Promedio diario</dt>
                            <dd className="text-2xl font-semibold text-gray-900">
                                {Array.from(new Set(filteredTimeEntries.map(entry => entry.date).filter(Boolean))).length > 0
                                    ? (filteredTimeEntries.reduce((total, entry) => total + ((entry.duration || 0) / 60), 0) /
                                        Array.from(new Set(filteredTimeEntries.map(entry => entry.date).filter(Boolean))).length).toFixed(1)
                                    : '0.0'}h
                            </dd>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <dt className="text-sm font-medium text-gray-500 truncate">Empleados activos</dt>
                            <dd className="text-2xl font-semibold text-gray-900">
                                {Array.from(new Set(filteredTimeEntries.map(entry => {
                                    if (entry.employee) {
                                        return `${entry.employee.firstName} ${entry.employee.lastName}`.trim()
                                    }
                                    return null
                                }).filter(Boolean))).length}
                            </dd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TimeEntryModal
                isOpen={modals.create}
                onClose={() => closeModal('create')}
                onSave={handleSaveEntry}
                entry={null}
            />

            <TimeEntryModal
                isOpen={modals.edit}
                onClose={() => closeModal('edit')}
                onSave={handleSaveEntry}
                entry={selectedEntry}
            />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteEntry}
                title="Eliminar Registro"
                message={`¿Estás seguro de que quieres eliminar el registro de ${selectedEntry?.employee ? `${selectedEntry.employee.firstName} ${selectedEntry.employee.lastName}` : 'este empleado'}? Esta acción no se puede deshacer.`}
            />

            {/* Check-in Modal */}
            {showCheckInModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Registrar Entrada</h2>
                            <button
                                onClick={() => setShowCheckInModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Empleado *
                                </label>
                                <select
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Seleccionar empleado</option>
                                    {employees.map(employee => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.firstName} {employee.lastName} {employee.position ? `(${employee.position})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Proyecto (opcional)
                                </label>
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Sin proyecto</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name} {project.code ? `(#${project.code})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Puedes asociar la entrada a un proyecto (opcional).</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ubicación (opcional)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={defaultLocation}
                                        onChange={(e) => setDefaultLocation(e.target.value)}
                                        onFocus={() => setShowLocationDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setShowLocationDropdown(false)
                                            } else if (e.key === 'Escape') {
                                                setShowLocationDropdown(false)
                                            }
                                        }}
                                        placeholder="Seleccionar o escribir ubicación"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-2"
                                    >
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showLocationDropdown && (
                                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                            {locationSuggestions
                                                .filter(suggestion =>
                                                    suggestion.toLowerCase().includes(defaultLocation.toLowerCase())
                                                )
                                                .map((suggestion, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => {
                                                            setDefaultLocation(suggestion)
                                                            setShowLocationDropdown(false)
                                                        }}
                                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                    >
                                                        <div className="flex items-center">
                                                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            {suggestion}
                                                        </div>
                                                    </button>
                                                ))}
                                            {locationSuggestions.filter(suggestion =>
                                                suggestion.toLowerCase().includes(defaultLocation.toLowerCase())
                                            ).length === 0 && defaultLocation.trim() !== '' && (
                                                    <div className="px-3 py-2 text-gray-500 text-sm">
                                                        <div className="flex items-center">
                                                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                            </svg>
                                                            Usar: "{defaultLocation}"
                                                        </div>
                                                    </div>
                                                )}
                                            {locationSuggestions.length === 0 && (
                                                <div className="px-3 py-2 text-gray-500 text-sm">
                                                    No hay ubicaciones registradas
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Selecciona una ubicación existente o escribe una nueva. Se usará cuando la geolocalización no esté disponible.
                                </p>
                                {defaultLocation && (
                                    <div className="mt-2 flex items-center">
                                        <svg className={`w-4 h-4 mr-2 ${locationSuggestions.includes(defaultLocation)
                                            ? 'text-green-500'
                                            : 'text-blue-500'
                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className={`text-xs ${locationSuggestions.includes(defaultLocation)
                                            ? 'text-green-600'
                                            : 'text-blue-600'
                                            }`}>
                                            {locationSuggestions.includes(defaultLocation)
                                                ? 'Ubicación existente'
                                                : 'Nueva ubicación'
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCheckInModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCheckInSubmit}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Registrar Entrada
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}

export default function TimeTracking() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <TimeTrackingContent />
        </Suspense>
    )
}
