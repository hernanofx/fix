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
import { Calculator, Plus, Trash2, Package, Users, Truck, FileText, Target, Zap } from "lucide-react"

interface ApuMaterial {
    id?: string
    materialId: string
    quantity: number
    unitPrice: number
    currency: string
    totalCost: number
}

interface ApuLabor {
    id?: string
    rubroId: string
    hours: number
    hourlyRate: number
    currency: string
    totalCost: number
}

interface ApuEquipment {
    id?: string
    name: string
    description?: string
    quantity: number
    unitPrice: number
    currency: string
    totalCost: number
}

interface ApuFormModalProps {
    isOpen: boolean
    onClose: () => void
    partida?: any
    onSave: (partidaData: any) => void
    readOnly?: boolean
}

export default function ApuFormModal({ isOpen, onClose, partida, onSave, readOnly = false }: ApuFormModalProps) {
    const { data: session } = useSession()
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        unit: "",
        quantity: 1,
        currency: "PESOS",
        status: "DRAFT",
        overheadRate: 0,
        profitRate: 0,
        budgetId: "none",
        materials: [] as ApuMaterial[],
        labors: [] as ApuLabor[],
        equipments: [] as ApuEquipment[],
    })

    const [materialsList, setMaterialsList] = useState<any[]>([])
    const [rubrosList, setRubrosList] = useState<any[]>([])
    const [budgetsList, setBudgetsList] = useState<any[]>([])

    useEffect(() => {
        loadData()
    }, [session])

    useEffect(() => {
        if (partida) {
            setFormData({
                code: partida.code || "",
                name: partida.name || "",
                description: partida.description || "",
                unit: partida.unit || "",
                quantity: Number(partida.quantity) || 1,
                currency: partida.currency || "PESOS",
                status: partida.status || "DRAFT",
                overheadRate: Number(partida.overheadRate) || 0,
                profitRate: Number(partida.profitRate) || 0,
                budgetId: partida.budgetId || "none",
                materials: (partida.materials || []).map((mat: any) => ({
                    id: mat.id,
                    materialId: mat.materialId,
                    quantity: Number(mat.quantity),
                    unitPrice: Number(mat.unitPrice),
                    currency: mat.currency || "PESOS",
                    totalCost: Number(mat.totalCost),
                })),
                labors: (partida.labors || []).map((lab: any) => ({
                    id: lab.id,
                    rubroId: lab.rubroId,
                    hours: Number(lab.hours),
                    hourlyRate: Number(lab.hourlyRate),
                    currency: lab.currency || "PESOS",
                    totalCost: Number(lab.totalCost),
                })),
                equipments: (partida.equipments || []).map((eq: any) => ({
                    id: eq.id,
                    name: eq.name,
                    description: eq.description || "",
                    quantity: Number(eq.quantity),
                    unitPrice: Number(eq.unitPrice),
                    currency: eq.currency || "PESOS",
                    totalCost: Number(eq.totalCost),
                })),
            })
        } else {
            setFormData({
                code: "",
                name: "",
                description: "",
                unit: "",
                quantity: 1,
                currency: "PESOS",
                status: "DRAFT",
                overheadRate: 0,
                profitRate: 0,
                budgetId: "none",
                materials: [],
                labors: [],
                equipments: [],
            })
        }
    }, [partida])

    const loadData = async () => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) return

            // Load materials
            const materialsRes = await fetch("/api/stock/materials")
            if (materialsRes.ok) {
                const materialsData = await materialsRes.json()
                setMaterialsList(Array.isArray(materialsData) ? materialsData : [])
            }

            // Load rubros
            const rubrosRes = await fetch("/api/rubros")
            if (rubrosRes.ok) {
                const rubrosData = await rubrosRes.json()
                setRubrosList(Array.isArray(rubrosData) ? rubrosData : [])
            }

            // Load budgets
            const budgetsRes = await fetch(`/api/budgets?organizationId=${organizationId}`)
            if (budgetsRes.ok) {
                const budgetsData = await budgetsRes.json()
                setBudgetsList(Array.isArray(budgetsData) ? budgetsData : [])
            }
        } catch (e) {
            console.error("Error loading data:", e)
        }
    }

    const currencies = [
        { value: "PESOS", label: "Pesos" },
        { value: "USD", label: "Dólares" },
        { value: "EUR", label: "Euros" },
    ]

    // Material functions
    const addMaterial = () => {
        setFormData({
            ...formData,
            materials: [
                ...formData.materials,
                {
                    materialId: "",
                    quantity: 1,
                    unitPrice: 0,
                    currency: formData.currency,
                    totalCost: 0,
                },
            ],
        })
    }

    const removeMaterial = (index: number) => {
        setFormData({
            ...formData,
            materials: formData.materials.filter((_, i) => i !== index),
        })
    }

    const updateMaterial = (index: number, field: keyof ApuMaterial, value: any) => {
        const newMaterials = [...formData.materials]
        newMaterials[index] = { ...newMaterials[index], [field]: value }

        // Recalculate total cost
        if (field === "quantity" || field === "unitPrice") {
            newMaterials[index].totalCost = Number(newMaterials[index].quantity) * Number(newMaterials[index].unitPrice)
        }

        setFormData({ ...formData, materials: newMaterials })
    }

    // Labor functions
    const addLabor = () => {
        setFormData({
            ...formData,
            labors: [
                ...formData.labors,
                {
                    rubroId: "",
                    hours: 1,
                    hourlyRate: 0,
                    currency: formData.currency,
                    totalCost: 0,
                },
            ],
        })
    }

    const removeLabor = (index: number) => {
        setFormData({
            ...formData,
            labors: formData.labors.filter((_, i) => i !== index),
        })
    }

    const updateLabor = (index: number, field: keyof ApuLabor, value: any) => {
        const newLabors = [...formData.labors]
        newLabors[index] = { ...newLabors[index], [field]: value }

        // Recalculate total cost
        if (field === "hours" || field === "hourlyRate") {
            newLabors[index].totalCost = Number(newLabors[index].hours) * Number(newLabors[index].hourlyRate)
        }

        setFormData({ ...formData, labors: newLabors })
    }

    // Equipment functions
    const addEquipment = () => {
        setFormData({
            ...formData,
            equipments: [
                ...formData.equipments,
                {
                    name: "",
                    description: "",
                    quantity: 1,
                    unitPrice: 0,
                    currency: formData.currency,
                    totalCost: 0,
                },
            ],
        })
    }

    const removeEquipment = (index: number) => {
        setFormData({
            ...formData,
            equipments: formData.equipments.filter((_, i) => i !== index),
        })
    }

    const updateEquipment = (index: number, field: keyof ApuEquipment, value: any) => {
        const newEquipments = [...formData.equipments]
        newEquipments[index] = { ...newEquipments[index], [field]: value }

        // Recalculate total cost
        if (field === "quantity" || field === "unitPrice") {
            newEquipments[index].totalCost = Number(newEquipments[index].quantity) * Number(newEquipments[index].unitPrice)
        }

        setFormData({ ...formData, equipments: newEquipments })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.name || !formData.unit || !formData.quantity) {
            alert("Por favor complete todos los campos obligatorios")
            return
        }

        // Calculate totals
        const materialsSubtotal = formData.materials.reduce((sum, mat) => sum + Number(mat.totalCost), 0)
        const laborSubtotal = formData.labors.reduce((sum, lab) => sum + Number(lab.totalCost), 0)
        const equipmentSubtotal = formData.equipments.reduce((sum, eq) => sum + Number(eq.totalCost), 0)

        const directCost = materialsSubtotal + laborSubtotal + equipmentSubtotal
        const overheadAmount = directCost * (Number(formData.overheadRate) / 100)
        const profitAmount = (directCost + overheadAmount) * (Number(formData.profitRate) / 100)
        const indirectCost = overheadAmount + profitAmount
        const unitCost = directCost + indirectCost
        const totalCost = unitCost * Number(formData.quantity)

        const payload = {
            ...formData,
            materialsSubtotal,
            laborSubtotal,
            equipmentSubtotal,
            directCost,
            indirectCost,
            unitCost,
            totalCost,
        }

        onSave(payload)
        onClose()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    // Calculate current totals for display
    const currentMaterialsSubtotal = formData.materials.reduce((sum, mat) => sum + Number(mat.totalCost), 0)
    const currentLaborSubtotal = formData.labors.reduce((sum, lab) => sum + Number(lab.totalCost), 0)
    const currentEquipmentSubtotal = formData.equipments.reduce((sum, eq) => sum + Number(eq.totalCost), 0)
    const currentDirectCost = currentMaterialsSubtotal + currentLaborSubtotal + currentEquipmentSubtotal
    const currentOverheadAmount = currentDirectCost * (Number(formData.overheadRate) / 100)
    const currentProfitAmount = (currentDirectCost + currentOverheadAmount) * (Number(formData.profitRate) / 100)
    const currentIndirectCost = currentOverheadAmount + currentProfitAmount
    const currentUnitCost = currentDirectCost + currentIndirectCost
    const currentTotalCost = currentUnitCost * Number(formData.quantity)

    const formatCurrency = (amount: number) => {
        const currencySymbols: Record<string, string> = {
            PESOS: "$",
            USD: "US$",
            EUR: "€",
        }
        const symbol = currencySymbols[formData.currency] || "$"
        return `${symbol}${amount.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={readOnly ? "Ver Partida APU" : partida ? "Editar Partida APU" : "Nueva Partida APU"}
            size="xl"
        >
            <div className="space-y-8 max-h-[85vh] overflow-y-auto px-1">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/60 p-8">
                    <div className="absolute inset-0 bg-grid-emerald-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                                <Calculator className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                    {readOnly ? "Análisis de Precios Unitarios" : partida ? "Editar Partida APU" : "Nueva Partida APU"}
                                </h2>
                                <p className="text-slate-600 text-sm font-medium">
                                    {readOnly ? "Desglose completo de costos unitarios" : "Configure materiales, mano de obra y equipos"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="border-0 shadow-xl shadow-slate-200/20 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60 pb-6">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                <FileText className="h-5 w-5" />
                            </div>
                            Información General
                        </CardTitle>
                        <CardDescription className="text-slate-600 font-medium ml-11">
                            Configura los detalles básicos de la partida APU
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Código (opcional)</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="Ej: APU-001"
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Nombre *
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ej: Excavación manual"
                                    required
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unit">Unidad de Medida *</Label>
                                <Input
                                    id="unit"
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    placeholder="Ej: m3, m2, kg, und"
                                    required
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quantity">Cantidad *</Label>
                                <Input
                                    id="quantity"
                                    name="quantity"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                    placeholder="1.00"
                                    required
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency">Moneda *</Label>
                                <Select
                                    value={formData.currency}
                                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                                    disabled={readOnly}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((currency) => (
                                            <SelectItem key={currency.value} value={currency.value}>
                                                {currency.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Estado *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    disabled={readOnly}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">Borrador</SelectItem>
                                        <SelectItem value="ACTIVE">Activo</SelectItem>
                                        <SelectItem value="ARCHIVED">Archivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="budgetId">Presupuesto (opcional)</Label>
                                <Select
                                    value={formData.budgetId}
                                    onValueChange={(value) => setFormData({ ...formData, budgetId: value })}
                                    disabled={readOnly}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar presupuesto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin presupuesto</SelectItem>
                                        {budgetsList.map((budget) => (
                                            <SelectItem key={budget.id} value={budget.id}>
                                                {budget.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Descripción detallada de la partida..."
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
                                        <Package className="h-5 w-5" />
                                    </div>
                                    Materiales
                                </CardTitle>
                                <CardDescription className="text-slate-600 font-medium ml-11">
                                    Agrega los materiales necesarios para esta partida
                                </CardDescription>
                            </div>
                            {!readOnly && (
                                <Button
                                    onClick={addMaterial}
                                    className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar Material
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {formData.materials.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-sm">No hay materiales agregados</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.materials.map((material, index) => (
                                    <Card key={index} className="border-l-4 border-l-blue-500">
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <h4 className="text-sm font-medium text-gray-900">Material #{index + 1}</h4>
                                                {!readOnly && (
                                                    <Button
                                                        onClick={() => removeMaterial(index)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Material *</Label>
                                                    <Select
                                                        value={material.materialId}
                                                        onValueChange={(value) => updateMaterial(index, "materialId", value)}
                                                        disabled={readOnly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccionar material" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {materialsList.map((mat) => (
                                                                <SelectItem key={mat.id} value={mat.id}>
                                                                    {mat.name} ({mat.unit})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Cantidad *</Label>
                                                    <Input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={material.quantity}
                                                        onChange={(e) => updateMaterial(index, "quantity", Number(e.target.value))}
                                                        placeholder="1.00"
                                                        disabled={readOnly}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Precio Unitario *</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={material.unitPrice}
                                                        onChange={(e) => updateMaterial(index, "unitPrice", Number(e.target.value))}
                                                        placeholder="0.00"
                                                        disabled={readOnly}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-2 text-sm text-gray-600">Total: {formatCurrency(material.totalCost)}</div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {formData.materials.length > 0 && (
                            <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60">
                                <div className="text-lg font-bold text-blue-900">
                                    Subtotal Materiales: {formatCurrency(currentMaterialsSubtotal)}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl shadow-slate-200/20 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50/50 border-b border-slate-200/60 pb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    Mano de Obra
                                </CardTitle>
                                <CardDescription className="text-slate-600 font-medium ml-11">
                                    Agrega los rubros de mano de obra necesarios
                                </CardDescription>
                            </div>
                            {!readOnly && (
                                <Button
                                    onClick={addLabor}
                                    className="h-11 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar Rubro
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {formData.labors.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-sm">No hay rubros de mano de obra agregados</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.labors.map((labor, index) => (
                                    <Card key={index} className="border-l-4 border-l-green-500">
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <h4 className="text-sm font-medium text-gray-900">Rubro #{index + 1}</h4>
                                                {!readOnly && (
                                                    <Button
                                                        onClick={() => removeLabor(index)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Rubro *</Label>
                                                    <Select
                                                        value={labor.rubroId}
                                                        onValueChange={(value) => updateLabor(index, "rubroId", value)}
                                                        disabled={readOnly}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccionar rubro" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {rubrosList.map((rubro) => (
                                                                <SelectItem key={rubro.id} value={rubro.id}>
                                                                    {rubro.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Horas *</Label>
                                                    <Input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={labor.hours}
                                                        onChange={(e) => updateLabor(index, "hours", Number(e.target.value))}
                                                        placeholder="1.00"
                                                        disabled={readOnly}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Tarifa por Hora *</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={labor.hourlyRate}
                                                        onChange={(e) => updateLabor(index, "hourlyRate", Number(e.target.value))}
                                                        placeholder="0.00"
                                                        disabled={readOnly}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-2 text-sm text-gray-600">Total: {formatCurrency(labor.totalCost)}</div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {formData.labors.length > 0 && (
                            <div className="mt-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/60">
                                <div className="text-lg font-bold text-emerald-900">
                                    Subtotal Mano de Obra: {formatCurrency(currentLaborSubtotal)}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl shadow-slate-200/20 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50/50 border-b border-slate-200/60 pb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                                        <Truck className="h-5 w-5" />
                                    </div>
                                    Equipos
                                </CardTitle>
                                <CardDescription className="text-slate-600 font-medium ml-11">
                                    Agrega los equipos necesarios para esta partida
                                </CardDescription>
                            </div>
                            {!readOnly && (
                                <Button
                                    onClick={addEquipment}
                                    className="h-11 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar Equipo
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {formData.equipments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-sm">No hay equipos agregados</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.equipments.map((equipment, index) => (
                                    <Card key={index} className="border-l-4 border-l-purple-500">
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <h4 className="text-sm font-medium text-gray-900">Equipo #{index + 1}</h4>
                                                {!readOnly && (
                                                    <Button
                                                        onClick={() => removeEquipment(index)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Nombre del Equipo *</Label>
                                                    <Input
                                                        value={equipment.name}
                                                        onChange={(e) => updateEquipment(index, "name", e.target.value)}
                                                        placeholder="Ej: Excavadora"
                                                        disabled={readOnly}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Descripción</Label>
                                                    <Input
                                                        value={equipment.description}
                                                        onChange={(e) => updateEquipment(index, "description", e.target.value)}
                                                        placeholder="Descripción del equipo"
                                                        disabled={readOnly}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Cantidad *</Label>
                                                    <Input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={equipment.quantity}
                                                        onChange={(e) => updateEquipment(index, "quantity", Number(e.target.value))}
                                                        placeholder="1.00"
                                                        disabled={readOnly}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Precio Unitario *</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={equipment.unitPrice}
                                                        onChange={(e) => updateEquipment(index, "unitPrice", Number(e.target.value))}
                                                        placeholder="0.00"
                                                        disabled={readOnly}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-2 text-sm text-gray-600">Total: {formatCurrency(equipment.totalCost)}</div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {formData.equipments.length > 0 && (
                            <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200/60">
                                <div className="text-lg font-bold text-purple-900">
                                    Subtotal Equipos: {formatCurrency(currentEquipmentSubtotal)}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl shadow-slate-200/20 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50/50 border-b border-slate-200/60 pb-6">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                                <Zap className="h-5 w-5" />
                            </div>
                            Gastos Indirectos
                        </CardTitle>
                        <CardDescription className="text-slate-600 font-medium ml-11">
                            Configura los porcentajes de gastos generales y utilidad
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="overheadRate">Gastos Generales (%)</Label>
                                <Input
                                    id="overheadRate"
                                    name="overheadRate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={formData.overheadRate}
                                    onChange={(e) => setFormData({ ...formData, overheadRate: Number(e.target.value) })}
                                    placeholder="10.00"
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="profitRate">Utilidad (%)</Label>
                                <Input
                                    id="profitRate"
                                    name="profitRate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={formData.profitRate}
                                    onChange={(e) => setFormData({ ...formData, profitRate: Number(e.target.value) })}
                                    placeholder="15.00"
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl shadow-slate-200/20 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                                <Calculator className="h-5 w-5" />
                            </div>
                            Resumen de Costos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Costos Directos</h3>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Materiales:</span>
                                    <span className="font-medium">{formatCurrency(currentMaterialsSubtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Mano de Obra:</span>
                                    <span className="font-medium">{formatCurrency(currentLaborSubtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Equipos:</span>
                                    <span className="font-medium">{formatCurrency(currentEquipmentSubtotal)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="font-medium">Costo Directo:</span>
                                    <span className="font-bold text-blue-600">{formatCurrency(currentDirectCost)}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Costos Totales</h3>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Gastos Generales ({formData.overheadRate}%):</span>
                                    <span className="font-medium">{formatCurrency(currentOverheadAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Utilidad ({formData.profitRate}%):</span>
                                    <span className="font-medium">{formatCurrency(currentProfitAmount)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="font-medium">Costo Unitario:</span>
                                    <span className="font-bold text-green-600">{formatCurrency(currentUnitCost)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">
                                        Costo Total ({formData.quantity} {formData.unit}):
                                    </span>
                                    <span className="font-bold text-purple-600">{formatCurrency(currentTotalCost)}</span>
                                </div>
                            </div>
                        </div>
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
                                onClick={handleSubmit}
                                className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                            >
                                <Calculator className="h-4 w-4" />
                                {partida ? "Actualizar Partida" : "Crear Partida"}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    )
}
