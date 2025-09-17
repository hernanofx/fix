"use client"

import Layout from "../../components/Layout"
import ProjectFormModal from "../../components/modals/ProjectFormModal"
import ProjectDetailsModal from "../../components/modals/ProjectDetailsModal"
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal"
import Pagination from "@/components/ui/Pagination"
import { useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "../../components/ToastProvider"
import { Suspense } from "react"

function ProjectsContent() {
    const [projects, setProjects] = useState<any[]>([])
    const toast = useToast()

    const [modals, setModals] = useState({
        create: false,
        edit: false,
        details: false,
        delete: false,
    })

    const [selectedProject, setSelectedProject] = useState<any>(null)

    // Estados para filtros y ordenamiento
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [sortField, setSortField] = useState<string>("name")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const { data: session } = useSession()
    const searchParams = useSearchParams()

    // Helpers to compute quick stats from projects
    const normalizeStatusKey = (status: any) => {
        if (!status && status !== 0) return ""
        const s = String(status)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        if (s.includes("complet")) return "COMPLETED"
        if (
            s.includes("in_progress") ||
            s.includes("inprogress") ||
            s.includes("en progreso") ||
            s.includes("in progress") ||
            s.includes("inprogress")
        )
            return "IN_PROGRESS"
        if (s.includes("plan") || s.includes("planning") || s.includes("planificacion")) return "PLANNING"
        if (s.includes("cancel")) return "CANCELLED"
        return s.toUpperCase()
    }

    useEffect(() => {
        const load = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return
                const res = await fetch(`/api/projects?organizationId=${organizationId}`)
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = "Failed to load projects"
                    try {
                        const j = txt ? JSON.parse(txt) : null
                        msg = j?.message || txt || msg
                    } catch {
                        msg = txt || msg
                    }
                    throw new Error(msg)
                }
                const data = await res.json()
                setProjects(Array.isArray(data) ? data : [])
            } catch (err: any) {
                console.error(err)
                toast.error(err.message || "No se pudieron cargar los proyectos")
            }
        }
        load()
    }, [session])

    // Lógica de filtrado y ordenamiento (sin paginación para estadísticas)
    const filteredProjects = useMemo(() => {
        let filtered = Array.isArray(projects) ? projects : []

        // Aplicar filtro de estado
        if (statusFilter !== "all") {
            filtered = filtered.filter((project) => normalizeStatusKey(project.status) === statusFilter)
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            // Manejar casos especiales
            if (sortField === "name") {
                aValue = (aValue || "").toLowerCase()
                bValue = (bValue || "").toLowerCase()
            } else if (sortField === "budget") {
                aValue = Number(String(aValue || 0).replace(/[^0-9.-]+/g, "")) || 0
                bValue = Number(String(bValue || 0).replace(/[^0-9.-]+/g, "")) || 0
            } else if (sortField === "progress") {
                aValue = aValue || 0
                bValue = bValue || 0
            } else if (sortField === "startDate" || sortField === "endDate") {
                aValue = new Date(aValue || 0).getTime()
                bValue = new Date(bValue || 0).getTime()
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
            return 0
        })

        return filtered
    }, [projects, statusFilter, sortField, sortDirection])

    // Datos paginados para mostrar en la tabla
    const paginatedProjects = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredProjects.slice(startIndex, endIndex)
    }, [filteredProjects, currentPage, itemsPerPage])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, sortField, sortDirection])

    // Calculate total pages
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)

    // Obtener estados únicos para el filtro
    const uniqueStatuses = useMemo(() => {
        const statuses = projects.map((p) => normalizeStatusKey(p.status)).filter(Boolean)
        return Array.from(new Set(statuses)).sort()
    }, [projects])

    // Función para cambiar el ordenamiento
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    // Check for modal parameter in URL
    useEffect(() => {
        const modalParam = searchParams.get("modal")
        if (modalParam === "create") {
            openModal("create")
        }
    }, [searchParams])

    const openModal = async (modalType: keyof typeof modals, project?: any) => {
        if (modalType === "edit" && project?.id) {
            try {
                const res = await fetch(`/api/projects/${project.id}`)
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = "Failed to fetch project"
                    try {
                        const j = txt ? JSON.parse(txt) : null
                        msg = j?.message || txt || msg
                    } catch {
                        msg = txt || msg
                    }
                    throw new Error(msg)
                }
                const data = await res.json()
                setSelectedProject(data)
                setModals({ ...modals, [modalType]: true })
                return
            } catch (err) {
                console.error(err)
                toast.error("No se pudo cargar el proyecto para editar")
                return
            }
        }

        setSelectedProject(project)
        setModals({ ...modals, [modalType]: true })
    }

    const closeModal = (modalType: keyof typeof modals) => {
        setModals({ ...modals, [modalType]: false })
        setSelectedProject(null)
    }

    const handleSaveProject = async (projectData: any) => {
        try {
            const userId = session?.user?.id as string | undefined
            const organizationId = (session as any)?.user?.organizationId as string | undefined

            if (selectedProject?.id) {
                const res = await fetch(`/api/projects/${selectedProject.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(projectData),
                })
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = "Error updating project"
                    try {
                        const j = txt ? JSON.parse(txt) : null
                        msg = j?.message || txt || msg
                    } catch {
                        msg = txt || msg
                    }
                    throw new Error(msg)
                }
                const updated = await res.json()
                setProjects(projects.map((p) => (p.id === updated.id ? updated : p)))
            } else {
                const payload = { ...projectData, createdById: userId, organizationId }
                const res = await fetch("/api/projects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
                if (!res.ok) {
                    const txt = await res.text().catch(() => null)
                    let msg = "Error creating project"
                    try {
                        const j = txt ? JSON.parse(txt) : null
                        msg = j?.message || txt || msg
                    } catch {
                        msg = txt || msg
                    }
                    throw new Error(msg)
                }
                const created = await res.json()
                setProjects([created, ...projects])
            }

            closeModal("create")
            closeModal("edit")
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "Error al guardar proyecto")
        }
    }

    const handleDeleteProject = async () => {
        if (!selectedProject?.id) return
        try {
            const res = await fetch(`/api/projects/${selectedProject.id}`, { method: "DELETE" })
            if (!res.ok) {
                const txt = await res.text().catch(() => null)
                let msg = "Error deleting"
                try {
                    const j = txt ? JSON.parse(txt) : null
                    msg = j?.message || txt || msg
                } catch {
                    msg = txt || msg
                }
                throw new Error(msg)
            }
            setProjects(projects.filter((p) => p.id !== selectedProject.id))
            closeModal("delete")
        } catch (err: any) {
            console.error(err)
            toast.error("No se pudo eliminar el proyecto")
        }
    }

    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams({
                status: statusFilter,
                sortField: sortField,
                sortDirection: sortDirection,
            })

            const response = await fetch(`/api/projects/export/excel?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `proyectos_${new Date().toISOString().split("T")[0]}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert("Error al exportar a Excel")
            }
        } catch (error) {
            console.error("Error exporting to Excel:", error)
            alert("Error al exportar a Excel")
        }
    }

    const handleExportPDF = async () => {
        try {
            const params = new URLSearchParams({
                status: statusFilter,
                sortField: sortField,
                sortDirection: sortDirection,
            })

            const response = await fetch(`/api/projects/export/pdf?${params}`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `proyectos_${new Date().toISOString().split("T")[0]}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert("Error al exportar a PDF")
            }
        } catch (error) {
            console.error("Error exporting to PDF:", error)
            alert("Error al exportar a PDF")
        }
    }

    const totalProjects = filteredProjects.length
    const completedProjects = filteredProjects.filter((p: any) => normalizeStatusKey(p?.status) === "COMPLETED").length
    const inProgressProjects = filteredProjects.filter((p: any) => normalizeStatusKey(p?.status) === "IN_PROGRESS").length
    const totalBudgetSumNumber = filteredProjects.reduce((acc: number, p: any) => {
        const b = p?.budget
        if (b === undefined || b === null || b === "") return acc
        const n = Number(String(b).replace(/[^0-9.-]+/g, ""))
        return acc + (Number.isFinite(n) ? n : 0)
    }, 0)

    const formatCompactCurrency = (n: number) => {
        if (!Number.isFinite(n)) return "-"
        // show compact M/K
        const abs = Math.abs(n)
        if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
        if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
        if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
        return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`
    }

    const getStatusColor = (status: string) => {
        const s = (status ?? "").toString()
        const normalized = s
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        if (normalized.includes("complet")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
        if (
            normalized.includes("en progreso") ||
            normalized.includes("in_progress") ||
            normalized.includes("inprogress") ||
            normalized.includes("in progress")
        )
            return "bg-blue-50 text-blue-700 border-blue-200"
        if (normalized.includes("plan") || normalized.includes("planning") || normalized.includes("planificacion"))
            return "bg-amber-50 text-amber-700 border-amber-200"
        return "bg-slate-50 text-slate-700 border-slate-200"
    }

    const getStatusIcon = (status: string) => {
        const normalized = (status ?? "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        if (normalized.includes("complet")) {
            return (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                    />
                </svg>
            )
        }
        if (
            normalized.includes("en progreso") ||
            normalized.includes("in_progress") ||
            normalized.includes("inprogress") ||
            normalized.includes("in progress")
        ) {
            return (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                    />
                </svg>
            )
        }
        if (normalized.includes("plan") || normalized.includes("planning") || normalized.includes("planificacion")) {
            return (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"
                        clipRule="evenodd"
                    />
                </svg>
            )
        }
        return (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                />
            </svg>
        )
    }

    return (
        <Layout title="Proyectos" subtitle="Gestiona todos tus proyectos de construcción">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">

                <button
                    onClick={() => openModal("create")}
                    className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    <svg
                        className="w-4 h-4 mr-2 transition-transform group-hover:scale-110"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Proyecto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-600">Total Proyectos</p>
                            <p className="text-3xl font-bold text-slate-900">{totalProjects}</p>
                            {statusFilter !== "all" && (
                                <p className="text-xs text-slate-500">de {Array.isArray(projects) ? projects.length : 0} total</p>
                            )}
                        </div>
                        <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-600">Completados</p>
                            <p className="text-3xl font-bold text-emerald-600">{completedProjects}</p>
                            <p className="text-xs text-slate-500">
                                {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}% del total
                            </p>
                        </div>
                        <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-600">En Progreso</p>
                            <p className="text-3xl font-bold text-blue-600">{inProgressProjects}</p>
                            <p className="text-xs text-slate-500">
                                {totalProjects > 0 ? Math.round((inProgressProjects / totalProjects) * 100) : 0}% del total
                            </p>
                        </div>
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-600">Presupuesto Total</p>
                            <p className="text-3xl font-bold text-slate-900">{formatCompactCurrency(totalBudgetSumNumber)}</p>
                            <p className="text-xs text-slate-500">Valor total de proyectos</p>
                        </div>
                        <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold text-slate-900">Lista de Proyectos</h2>
                            <p className="text-sm text-slate-600">
                                Mostrando {paginatedProjects.length} de {filteredProjects.length} proyectos
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <label htmlFor="status-filter" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                                    Filtrar por estado:
                                </label>
                                <select
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 min-w-[140px]"
                                >
                                    <option value="all">Todos</option>
                                    {uniqueStatuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status === "COMPLETED"
                                                ? "Completado"
                                                : status === "IN_PROGRESS"
                                                    ? "En Progreso"
                                                    : status === "PLANNING"
                                                        ? "Planificación"
                                                        : status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleExportExcel}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                                    title="Exportar a Excel"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    Excel
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                    title="Exportar a PDF"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    {(statusFilter !== "all" || sortField !== "name") && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                            <span className="text-sm text-slate-600">Filtros activos:</span>
                            {statusFilter !== "all" && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                    Estado:{" "}
                                    {statusFilter === "COMPLETED"
                                        ? "Completado"
                                        : statusFilter === "IN_PROGRESS"
                                            ? "En Progreso"
                                            : statusFilter === "PLANNING"
                                                ? "Planificación"
                                                : statusFilter}
                                    <button
                                        onClick={() => setStatusFilter("all")}
                                        className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center"
                                        title="Quitar filtro de estado"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            {sortField !== "name" && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                    Orden:{" "}
                                    {sortField === "name"
                                        ? "Nombre"
                                        : sortField === "budget"
                                            ? "Presupuesto"
                                            : sortField === "progress"
                                                ? "Progreso"
                                                : sortField === "startDate"
                                                    ? "Fecha Inicio"
                                                    : sortField === "endDate"
                                                        ? "Fecha Fin"
                                                        : sortField}{" "}
                                    {sortDirection === "asc" ? "↑" : "↓"}
                                    <button
                                        onClick={() => {
                                            setSortField("name")
                                            setSortDirection("asc")
                                        }}
                                        className="ml-1 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded-full w-4 h-4 flex items-center justify-center"
                                        title="Quitar ordenamiento"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="divide-y divide-slate-100">
                    {paginatedProjects.map((project) => (
                        <div key={project.id} className="group relative p-8 hover:bg-slate-50/50 transition-all duration-200">
                            <div className="cursor-pointer" onClick={() => openModal("details", project)}>
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex items-start gap-4 min-w-0 flex-1">
                                        <div className="flex-shrink-0">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-sm">
                                                <span className="text-slate-700 font-semibold text-lg">
                                                    {project?.name && typeof project.name === "string" && project.name.charAt
                                                        ? project.name.charAt(0).toUpperCase()
                                                        : "?"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                                                {project.name}
                                            </h3>
                                            <div className="space-y-1">
                                                {project.address && (
                                                    <p className="text-sm text-slate-600 flex items-center gap-2">
                                                        <svg
                                                            className="w-4 h-4 text-slate-400"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                        </svg>
                                                        {project.address}
                                                        {project.city && `, ${project.city}`}
                                                    </p>
                                                )}
                                                <p className="text-sm text-slate-600 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0h6m-6 0V7a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V8a1 1 0 00-1-1h-2"
                                                        />
                                                    </svg>
                                                    {project?.startDate ? new Date(project.startDate).toLocaleDateString("es-ES") : "Sin fecha"} -{" "}
                                                    {project?.endDate ? new Date(project.endDate).toLocaleDateString("es-ES") : "Sin fecha"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-8">
                                        <div className="flex flex-col items-start sm:items-end gap-3">
                                            <div
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}
                                            >
                                                {getStatusIcon(project.status)}
                                                {project.status}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold text-slate-900">
                                                    {project?.budget != null
                                                        ? `$${Number(String(project.budget).replace(/[^0-9.-]+/g, "") || 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}`
                                                        : "Sin presupuesto"}
                                                </p>
                                                <p className="text-xs text-slate-500">Presupuesto</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 min-w-[120px]">
                                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                                                    style={{
                                                        width: `${project?.progress != null ? Math.min(100, Math.max(0, Number(project.progress))) : 0}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">
                                                {project?.progress != null ? `${project.progress}%` : "0%"} completado
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openModal("details", project)
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                    Ver detalles
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openModal("edit", project)
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                    Editar
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openModal("delete", project)
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {paginatedProjects.length === 0 && (
                    <div className="text-center py-16">
                        <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                        </svg>
                        <h3 className="mt-4 text-lg font-medium text-slate-900">No hay proyectos</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            {statusFilter !== "all"
                                ? "No se encontraron proyectos con los filtros aplicados."
                                : "Comienza creando tu primer proyecto de construcción."}
                        </p>
                        {statusFilter === "all" && (
                            <button
                                onClick={() => openModal("create")}
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Crear primer proyecto
                            </button>
                        )}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="mt-8">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredProjects.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                </div>
            )}

            {/* Modals */}
            <ProjectFormModal isOpen={modals.create} onClose={() => closeModal("create")} onSave={handleSaveProject} />

            <ProjectFormModal
                isOpen={modals.edit}
                onClose={() => closeModal("edit")}
                project={selectedProject}
                onSave={handleSaveProject}
            />

            <ProjectDetailsModal isOpen={modals.details} onClose={() => closeModal("details")} project={selectedProject} />

            <ConfirmDeleteModal
                isOpen={modals.delete}
                onClose={() => closeModal("delete")}
                onConfirm={handleDeleteProject}
                title="Eliminar Proyecto"
                message="¿Estás seguro de que quieres eliminar este proyecto?"
                itemName={selectedProject?.name}
            />
        </Layout>
    )
}

export default function Projects() {
    return (
        <Suspense
            fallback={
                <Layout title="Proyectos" subtitle="Gestiona todos tus proyectos de construcción">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                    </div>
                </Layout>
            }
        >
            <ProjectsContent />
        </Suspense>
    )
}
