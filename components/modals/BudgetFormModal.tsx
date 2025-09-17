"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Modal from "./Modal"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, DollarSign, Calendar, Building, FileText, Target, TrendingUp } from "lucide-react"

interface BudgetItem {
    id?: string
    rubroId: string
    materialId?: string
    quantity: number
    currency: string
    cost: number
    index?: string
}

interface BudgetFormModalProps {
    isOpen: boolean
    onClose: () => void
    budget?: any
    onSave: (budgetData: any) => void
    readOnly?: boolean
}

export default function BudgetFormModal({ isOpen, onClose, budget, onSave, readOnly = false }: BudgetFormModalProps) {
    const { data: session } = useSession()
    const [formData, setFormData] = useState({
        projectId: "",
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "Planificación",
        type: "PROJECT",
        spent: "0",
        items: [] as BudgetItem[],
    })

    const [projectsList, setProjectsList] = useState<any[]>([])
    const [rubrosList, setRubrosList] = useState<any[]>([])
    const [materialsList, setMaterialsList] = useState<any[]>([])

    useEffect(() => {
        // load projects
        const loadProjects = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return

                const res = await fetch(`/api/projects?organizationId=${organizationId}`)
                if (!res.ok) return
                const data = await res.json()
                setProjectsList(Array.isArray(data) ? data : [])
            } catch (e) {
                // ignore
            }
        }

        // load rubros
        const loadRubros = async () => {
            try {
                const res = await fetch("/api/rubros")
                if (!res.ok) return
                const data = await res.json()
                setRubrosList(Array.isArray(data) ? data : [])
            } catch (e) {
                // ignore
            }
        }

        // load materials
        const loadMaterials = async () => {
            try {
                const res = await fetch("/api/stock/materials")
                if (!res.ok) return
                const data = await res.json()
                setMaterialsList(Array.isArray(data) ? data : [])
            } catch (e) {
                // ignore
            }
        }

        loadProjects()
        loadRubros()
        loadMaterials()

        if (budget) {
            setFormData({
                projectId: budget.project?.id || "",
                name: budget.name || "",
                description: budget.description || "",
                startDate: budget.startDate ? new Date(budget.startDate).toISOString().slice(0, 10) : "",
                endDate: budget.endDate ? new Date(budget.endDate).toISOString().slice(0, 10) : "",
                status: budget.status || "Planificación",
                type: budget.type || "PROJECT",
                spent: budget.spent != null ? String(budget.spent) : "0",
                items: (budget.items || []).map((item: any) => ({
                    id: item.id,
                    rubroId: item.rubroId || item.rubro?.id || "",
                    materialId: item.materialId || item.material?.id || undefined,
                    quantity: item.quantity || 1,
                    currency: item.currency || "PESOS",
                    cost: item.cost || 0,
                    index: item.index || "",
                })),
            })
        } else {
            setFormData({
                projectId: "",
                name: "",
                description: "",
                startDate: "",
                endDate: "",
                status: "Planificación",
                type: "PROJECT",
                spent: "0",
                items: [],
            })
        }
    }, [budget, session])

    const statuses = ["Planificación", "En curso", "Completado", "Suspendido"]

    const currencies = [
        { value: "PESOS", label: "Pesos" },
        { value: "USD", label: "Dólares" },
        { value: "EUR", label: "Euros" },
    ]

    const addItem = () => {
        setFormData({
            ...formData,
            items: [
                ...formData.items,
                {
                    rubroId: "",
                    quantity: 1,
                    currency: "PESOS",
                    cost: 0,
                    index: "",
                },
            ],
        })
    }

    const removeItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index),
        })
    }

    const updateItem = (index: number, field: keyof BudgetItem, value: any) => {
        const newItems = [...formData.items]
        newItems[index] = { ...newItems[index], [field]: value }
        setFormData({ ...formData, items: newItems })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const spent = Number.parseFloat(String(formData.spent)) || 0

        const statusMap: Record<string, string> = {
            planificacion: "ACTIVE",
            planificación: "ACTIVE",
            "en curso": "ACTIVE",
            completado: "COMPLETED",
            suspendido: "ON_HOLD",
        }

        const stKey = String(formData.status || "").toLowerCase()
        const apiStatus = statusMap[stKey] || String(formData.status || "ACTIVE")

        const payload: any = {
            name: formData.name || `Budget ${Date.now()}`,
            description: formData.description || undefined,
            type: formData.type || "PROJECT",
            spent,
            status: apiStatus,
            startDate: formData.startDate || undefined,
            endDate: formData.endDate || undefined,
            projectId: formData.projectId || undefined,
            items: formData.items.map((item) => ({
                rubroId: item.rubroId,
                materialId: item.materialId,
                quantity: item.quantity,
                currency: item.currency,
                cost: item.cost,
                index: item.index,
            })),
        }

        onSave(payload)
        onClose()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    // Totals grouped by currency (do not mix currencies)
    const totalsByCurrency = formData.items.reduce((acc: Record<string, { count: number; amount: number }>, item) => {
        const cur = item.currency || "PESOS"
        if (!acc[cur]) acc[cur] = { count: 0, amount: 0 }
        acc[cur].count += 1
        acc[cur].amount += Number(item.cost || 0)
        return acc
    }, {})

    const currencyCodeMap: Record<string, string> = {
        PESOS: "ARS",
        USD: "USD",
        EUR: "EUR",
    }

    const formatCurrency = (amount: number, currency = "PESOS") => {
        const code = currencyCodeMap[currency] || currency || "USD"
        try {
            return new Intl.NumberFormat("es-AR", { style: "currency", currency: code }).format(amount)
        } catch (e) {
            return amount.toFixed(2)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={readOnly ? "Ver Presupuesto" : budget ? "Editar Presupuesto" : "Nuevo Presupuesto"}
            size="xl"
        >
            <div className="space-y-8 max-h-[85vh] overflow-y-auto px-1">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border border-slate-200/60 p-8">
                    <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                    {readOnly ? "Detalles del Presupuesto" : budget ? "Editar Presupuesto" : "Crear Nuevo Presupuesto"}
                                </h2>
                                <p className="text-slate-600 text-sm font-medium">
                                    {readOnly
                                        ? "Visualización completa del presupuesto"
                                        : "Configure los detalles y materiales del presupuesto"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="border-0 shadow-xl shadow-slate-200/20 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60 pb-6">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                                <Building className="h-5 w-5" />
                            </div>
                            Información General
                        </CardTitle>
                        <CardDescription className="text-slate-600 font-medium ml-11">
                            Configura los detalles básicos del presupuesto
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="projectId" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Building className="h-4 w-4 text-slate-500" />
                                    Proyecto *
                                </Label>
                                <Select
                                    value={formData.projectId || ""}
                                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                                    disabled={readOnly}
                                >
                                    <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200">
                                        <SelectValue placeholder="Seleccionar proyecto" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200">
                                        {projectsList.map((project) => (
                                            <SelectItem key={project.id} value={project.id} className="rounded-lg">
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Target className="h-4 w-4 text-slate-500" />
                                    Nombre del Presupuesto *
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Presupuesto Construcción Edificio A"
                                    required
                                    disabled={readOnly}
                                    className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="status" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <TrendingUp className="h-4 w-4 text-slate-500" />
                                    Estado
                                </Label>
                                <Select
                                    value={formData.status || "Planificación"}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    disabled={readOnly}
                                >
                                    <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200">
                                        {statuses.map((status) => (
                                            <SelectItem key={status} value={status} className="rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${status === "Completado"
                                                                ? "bg-emerald-500"
                                                                : status === "En curso"
                                                                    ? "bg-blue-500"
                                                                    : status === "Suspendido"
                                                                        ? "bg-red-500"
                                                                        : "bg-amber-500"
                                                            }`}
                                                    />
                                                    {status}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="spent" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <DollarSign className="h-4 w-4 text-slate-500" />
                                    Monto Gastado
                                </Label>
                                <Input
                                    id="spent"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.spent}
                                    onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
                                    placeholder="0.00"
                                    disabled={readOnly}
                                    className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="startDate" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    Fecha de Inicio *
                                </Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                    disabled={readOnly}
                                    className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="endDate" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    Fecha de Fin *
                                </Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                    disabled={readOnly}
                                    className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                                Descripción
                            </Label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
                                placeholder="Descripción detallada del presupuesto..."
                                disabled={readOnly}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl shadow-slate-200/20 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-slate-200/60 pb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    Materiales del Presupuesto
                                </CardTitle>
                                <CardDescription className="text-slate-600 font-medium ml-11">
                                    Agrega los rubros y materiales que conforman este presupuesto
                                </CardDescription>
                            </div>
                            {!readOnly && (
                                <Button
                                    onClick={addItem}
                                    className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar Material
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {formData.items.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                    <DollarSign className="h-10 w-10 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">No hay materiales agregados</h3>
                                <p className="text-slate-600 max-w-md mx-auto">
                                    Haz clic en "Agregar Material" para comenzar a configurar tu presupuesto
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {formData.items.map((item, index) => (
                                    <Card
                                        key={index}
                                        className="border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-blue-700">#{index + 1}</span>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-900">Material #{index + 1}</h4>
                                                </div>
                                                {!readOnly && (
                                                    <Button
                                                        onClick={() => removeItem(index)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg transition-all duration-200"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {/* ... existing form fields with enhanced styling ... */}
                                                <div className="space-y-3">
                                                    <Label className="text-sm font-semibold text-slate-700">Rubro *</Label>
                                                    <Select
                                                        value={item.rubroId || ""}
                                                        onValueChange={(value) => updateItem(index, "rubroId", value)}
                                                        disabled={readOnly}
                                                    >
                                                        <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200">
                                                            <SelectValue placeholder="Seleccionar rubro" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200">
                                                            {rubrosList.map((rubro) => (
                                                                <SelectItem key={rubro.id} value={rubro.id} className="rounded-lg">
                                                                    {rubro.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-sm font-semibold text-slate-700">Material (opcional)</Label>
                                                    <Select
                                                        value={item.materialId || "none"}
                                                        onValueChange={(value) =>
                                                            updateItem(index, "materialId", value === "none" ? undefined : value)
                                                        }
                                                        disabled={readOnly}
                                                    >
                                                        <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200">
                                                            <SelectValue placeholder="Sin material específico" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200">
                                                            <SelectItem value="none">Sin material específico</SelectItem>
                                                            {materialsList.map((material) => (
                                                                <SelectItem key={material.id} value={material.id} className="rounded-lg">
                                                                    {material.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-sm font-semibold text-slate-700">Cantidad *</Label>
                                                    <Input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                                                        placeholder="1.00"
                                                        disabled={readOnly}
                                                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-sm font-semibold text-slate-700">Moneda *</Label>
                                                    <Select
                                                        value={item.currency || "PESOS"}
                                                        onValueChange={(value) => updateItem(index, "currency", value)}
                                                        disabled={readOnly}
                                                    >
                                                        <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200">
                                                            {currencies.map((currency) => (
                                                                <SelectItem key={currency.value} value={currency.value} className="rounded-lg">
                                                                    {currency.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-sm font-semibold text-slate-700">Costo Total *</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.cost}
                                                        onChange={(e) => updateItem(index, "cost", Number.parseFloat(e.target.value) || 0)}
                                                        placeholder="0.00"
                                                        disabled={readOnly}
                                                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-sm font-semibold text-slate-700">Índice (opcional)</Label>
                                                    <Input
                                                        value={item.index || ""}
                                                        onChange={(e) => updateItem(index, "index", e.target.value)}
                                                        placeholder="Código de referencia"
                                                        disabled={readOnly}
                                                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {formData.items.length > 0 && (
                            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200/60">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-lg font-bold text-blue-900 mb-1">Totales por Moneda</h4>
                                        <p className="text-sm text-blue-700 font-medium">Las monedas se contabilizan por separado</p>
                                    </div>
                                    <div className="text-right space-y-3">
                                        {Object.entries(totalsByCurrency).map(([cur, vals]) => (
                                            <div key={cur} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                                <div className="text-sm text-blue-700 font-semibold mb-1">
                                                    {cur} ({vals.count} materiales)
                                                </div>
                                                <div className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                                    {formatCurrency(vals.amount, cur)}
                                                </div>
                                            </div>
                                        ))}
                                        <p className="text-sm text-blue-700 font-medium">{formData.items.length} materiales totales</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200/60">
                    {readOnly ? (
                        <Button
                            type="button"
                            onClick={onClose}
                            className="h-12 px-8 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all duration-200"
                        >
                            Cerrar
                        </Button>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="h-12 px-8 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl transition-all duration-200 bg-transparent"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={formData.items.length === 0}
                                onClick={handleSubmit}
                                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FileText className="h-4 w-4" />
                                {budget ? "Actualizar Presupuesto" : "Crear Presupuesto"}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    )
}
