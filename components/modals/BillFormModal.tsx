'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Modal from './Modal'
import CheckSelectorModal from './CheckSelectorModal'

interface BillFormModalProps {
    isOpen: boolean
    onClose: () => void
    bill?: any
    onSave: (billData: any) => void
    mode?: 'create' | 'edit' | 'view'
    projects?: any[]
    clients?: any[]
    providers?: any[]
    rubros?: any[]
}

export default function BillFormModal({
    isOpen,
    onClose,
    bill,
    onSave,
    mode = 'create',
    projects = [],
    clients = [],
    providers = [],
    rubros = []
}: BillFormModalProps) {
    const { data: session } = useSession()
    const [cashBoxes, setCashBoxes] = useState<any[]>([])
    const [bankAccounts, setBankAccounts] = useState<any[]>([])
    const [materials, setMaterials] = useState<any[]>([])
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [paymentTerms, setPaymentTerms] = useState<any[]>([])
    const isInitialized = useRef(false)

    const [formData, setFormData] = useState({
        number: '',
        type: 'PROVIDER', // CLIENT or PROVIDER
        status: 'DRAFT', // Estado de la factura
        projectId: '',
        clientId: '',
        providerId: '',
        amount: '',
        currency: 'PESOS',
        taxRate: '0',
        retentionRate: '0',
        otherRate: '0',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
        paymentTermId: '',
        // Rubros (multiple selection with percentages)
        rubros: [] as Array<{ rubroId: string, percentage: number }>,
        // Payment options
        createPayment: false,
        paymentData: {
            amount: '',
            method: 'TRANSFER',
            currency: 'PESOS',
            paymentDate: new Date().toISOString().split('T')[0],
            reference: '',
            notes: '',
            cashBoxId: '',
            bankAccountId: ''
        },
        // Stock options
        createStock: false,
        stockData: [] as Array<{ materialId: string, quantity: number, warehouseId: string }>,
        // Selected check ID
        selectedCheckId: ''
    })

    const [showCheckSelector, setShowCheckSelector] = useState(false)

    // Reset form when modal opens for create mode only
    useEffect(() => {
        if (!isOpen) {
            // Limpiar storage cuando se cierra el modal
            sessionStorage.removeItem('billFormData')
            isInitialized.current = false
            return
        }

        if (mode === 'create' && !bill && !isInitialized.current) {
            // Intentar restaurar desde sessionStorage
            const savedData = sessionStorage.getItem('billFormData')
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData)
                    setFormData(parsedData)
                    isInitialized.current = true
                    return
                } catch (error) {
                    console.error('Error parsing saved form data:', error)
                }
            }

            // Si no hay datos guardados, inicializar con valores por defecto
            isInitialized.current = true
            setFormData({
                number: '',
                type: 'PROVIDER',
                status: 'DRAFT',
                projectId: '',
                clientId: '',
                providerId: '',
                amount: '',
                currency: 'PESOS',
                taxRate: '0',
                retentionRate: '0',
                otherRate: '0',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date().toISOString().split('T')[0],
                description: '',
                notes: '',
                paymentTermId: '',
                rubros: [],
                createPayment: false,
                paymentData: {
                    amount: '',
                    method: 'TRANSFER',
                    currency: 'PESOS',
                    paymentDate: new Date().toISOString().split('T')[0],
                    reference: '',
                    notes: '',
                    cashBoxId: '',
                    bankAccountId: ''
                },
                createStock: false,
                stockData: [],
                selectedCheckId: ''
            })
        }
    }, [isOpen, mode, bill])

    // Guardar en sessionStorage cuando cambian los datos
    useEffect(() => {
        if (isOpen && mode === 'create' && isInitialized.current) {
            sessionStorage.setItem('billFormData', JSON.stringify(formData))
        }
    }, [formData, isOpen, mode])    // Load bill data for edit/view modes
    useEffect(() => {
        if (isOpen && (mode === 'edit' || mode === 'view') && bill) {
            const hasPayments = bill.payments && bill.payments.length > 0
            const hasStockMovements = bill.stockMovements && bill.stockMovements.length > 0

            setFormData({
                number: bill.number || '',
                type: bill.type || 'PROVIDER',
                status: bill.status || 'DRAFT',
                projectId: bill.projectId || '',
                clientId: bill.clientId || '',
                providerId: bill.providerId || '',
                amount: bill.amount ? parseFloat(bill.amount).toFixed(2) : '',
                currency: bill.currency || 'PESOS',
                taxRate: bill.taxRate ? parseFloat(bill.taxRate).toFixed(2) : '0',
                retentionRate: bill.retentionRate ? parseFloat(bill.retentionRate).toFixed(2) : '0',
                otherRate: bill.otherRate ? parseFloat(bill.otherRate).toFixed(2) : '0',
                issueDate: bill.issueDate ? new Date(bill.issueDate).toISOString().split('T')[0] : '',
                dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '',
                description: bill.description || '',
                notes: bill.notes || '',
                paymentTermId: bill.paymentTermId || '',
                rubros: bill.billRubros?.map((br: any) => ({
                    rubroId: br.rubro.id,
                    percentage: parseFloat(br.percentage)
                })) || [],
                createPayment: hasPayments,
                paymentData: hasPayments && bill.payments[0] ? {
                    amount: parseFloat(bill.payments[0].amount).toFixed(2),
                    method: bill.payments[0].method || 'TRANSFER',
                    currency: bill.payments[0].currency || 'PESOS',
                    paymentDate: bill.payments[0].paymentDate ? new Date(bill.payments[0].paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    reference: bill.payments[0].reference || '',
                    notes: bill.payments[0].notes || '',
                    cashBoxId: bill.payments[0].cashBoxId || '',
                    bankAccountId: bill.payments[0].bankAccountId || ''
                } : {
                    amount: '',
                    method: 'TRANSFER',
                    currency: 'PESOS',
                    paymentDate: new Date().toISOString().split('T')[0],
                    reference: '',
                    notes: '',
                    cashBoxId: '',
                    bankAccountId: ''
                },
                createStock: hasStockMovements,
                stockData: bill.stockMovements?.map((sm: any) => ({
                    materialId: sm.material.id,
                    quantity: parseFloat(sm.quantity),
                    warehouseId: sm.warehouse.id
                })) || [],
                selectedCheckId: hasPayments && bill.payments[0]?.checkId || ''
            })
        }
    }, [isOpen, mode, bill])

    // Load related data
    useEffect(() => {
        const loadRelatedData = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return

                // Load all related data in parallel
                const [cashBoxesRes, bankAccountsRes, materialsRes, warehousesRes, paymentTermsRes] = await Promise.all([
                    fetch(`/api/cash-boxes?organizationId=${organizationId}`),
                    fetch(`/api/bank-accounts?organizationId=${organizationId}`),
                    fetch(`/api/stock/materials?organizationId=${organizationId}`),
                    fetch(`/api/stock/warehouses?organizationId=${organizationId}`),
                    fetch(`/api/payment-terms?organizationId=${organizationId}&type=${formData.type === 'CLIENT' ? 'INCOME' : 'EXPENSE'}`)
                ])

                if (cashBoxesRes.ok) {
                    const data = await cashBoxesRes.json()
                    setCashBoxes(data.cashBoxes || data || [])
                }

                if (bankAccountsRes.ok) {
                    const data = await bankAccountsRes.json()
                    setBankAccounts(data.bankAccounts || data || [])
                }

                if (materialsRes.ok) {
                    const data = await materialsRes.json()
                    setMaterials(data.materials || data || [])
                }

                if (warehousesRes.ok) {
                    const data = await warehousesRes.json()
                    setWarehouses(data.warehouses || data || [])
                }

                if (paymentTermsRes.ok) {
                    const data = await paymentTermsRes.json()
                    setPaymentTerms(data.paymentTerms || data || [])
                }
            } catch (error) {
                console.error('Error loading related data:', error)
            }
        }

        if (isOpen && session) {
            loadRelatedData()
        }
    }, [isOpen, session, formData.type])

    const isReadOnly = mode === 'view'

    // Calculated values
    const baseAmount = parseFloat(formData.amount) || 0
    const taxAmount = baseAmount * (parseFloat(formData.taxRate) || 0) / 100
    const retentionAmount = baseAmount * (parseFloat(formData.retentionRate) || 0) / 100
    const otherAmount = baseAmount * (parseFloat(formData.otherRate) || 0) / 100
    const totalAmount = baseAmount + taxAmount + otherAmount - retentionAmount

    // Validate rubros percentages
    const totalRubrosPercentage = formData.rubros.reduce((sum, rubro) => sum + rubro.percentage, 0)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // No permitir submit en modo view
        if (isReadOnly) {
            return
        }

        // Validation
        if (!formData.projectId) {
            alert('El proyecto es obligatorio')
            return
        }

        if (formData.type === 'CLIENT' && !formData.clientId) {
            alert('El cliente es obligatorio para facturas de cliente')
            return
        }

        if (formData.type === 'PROVIDER' && !formData.providerId) {
            alert('El proveedor es obligatorio para facturas de proveedor')
            return
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('El monto debe ser mayor a 0')
            return
        }

        if (!formData.dueDate) {
            alert('La fecha de vencimiento es obligatoria')
            return
        }

        // Validate rubros if provided
        if (formData.rubros.length > 0 && Math.abs(totalRubrosPercentage - 100) > 0.01) {
            alert('Los porcentajes de rubros deben sumar exactamente 100%')
            return
        }

        // Validate payment data if creating payment
        if (formData.createPayment) {
            if (!formData.paymentData.amount || parseFloat(formData.paymentData.amount) <= 0) {
                alert('El monto del pago debe ser mayor a 0')
                return
            }
            if (!formData.paymentData.cashBoxId && !formData.paymentData.bankAccountId) {
                alert('Debe seleccionar una cuenta para el pago')
                return
            }
        }

        // Validate stock data if creating stock movements
        if (formData.createStock) {
            const invalidStock = formData.stockData.some(item =>
                !item.materialId || !item.warehouseId || item.quantity <= 0
            )
            if (invalidStock) {
                alert('Todos los movimientos de stock deben tener material, almacén y cantidad válida')
                return
            }
        }

        // Prepare data for API
        const submitData = {
            number: formData.number || undefined,
            type: formData.type,
            status: formData.status,
            projectId: formData.projectId,
            clientId: formData.type === 'CLIENT' ? formData.clientId : null,
            providerId: formData.type === 'PROVIDER' ? formData.providerId : null,
            amount: parseFloat(formData.amount),
            currency: formData.currency,
            taxRate: parseFloat(formData.taxRate) || 0,
            retentionRate: parseFloat(formData.retentionRate) || 0,
            otherRate: parseFloat(formData.otherRate) || 0,
            issueDate: formData.issueDate,
            dueDate: formData.dueDate,
            description: formData.description,
            notes: formData.notes,
            paymentTermId: formData.paymentTermId || null,
            rubros: formData.rubros.length > 0 ? formData.rubros : [],
            createPayment: formData.createPayment,
            paymentData: formData.createPayment ? {
                amount: parseFloat(formData.paymentData.amount),
                method: formData.paymentData.method,
                currency: formData.paymentData.currency,
                paymentDate: formData.paymentData.paymentDate,
                reference: formData.paymentData.reference,
                notes: formData.paymentData.notes,
                cashBoxId: formData.paymentData.cashBoxId || null,
                bankAccountId: formData.paymentData.bankAccountId || null,
                selectedCheckId: formData.selectedCheckId || null
            } : null,
            createStock: formData.createStock,
            stockData: formData.createStock ? formData.stockData : []
        }

        onSave(submitData)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement

        if (name === 'paymentAccount') {
            // Manejar el selector de cuentas de pago
            if (value.startsWith('cash-')) {
                setFormData(prev => ({
                    ...prev,
                    paymentData: {
                        ...prev.paymentData,
                        cashBoxId: value.replace('cash-', ''),
                        bankAccountId: ''
                    }
                }))
            } else if (value.startsWith('bank-')) {
                setFormData(prev => ({
                    ...prev,
                    paymentData: {
                        ...prev.paymentData,
                        cashBoxId: '',
                        bankAccountId: value.replace('bank-', '')
                    }
                }))
            } else {
                setFormData(prev => ({
                    ...prev,
                    paymentData: {
                        ...prev.paymentData,
                        cashBoxId: '',
                        bankAccountId: ''
                    }
                }))
            }
        } else if (name.startsWith('paymentData.')) {
            const field = name.replace('paymentData.', '')
            setFormData(prev => ({
                ...prev,
                paymentData: {
                    ...prev.paymentData,
                    [field]: value
                }
            }))
        } else if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked,
                // Auto-fill payment amount when createPayment is checked
                ...(name === 'createPayment' && checked ? {
                    paymentData: {
                        ...prev.paymentData,
                        amount: totalAmount.toFixed(2),
                        currency: prev.currency
                    }
                } : {})
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                // Limpiar rubros cuando cambie el tipo de factura
                ...(name === 'type' ? { rubros: [] } : {})
            }))
        }

        // Auto-set payment amount when total changes
        if (name === 'amount' || name.includes('Rate')) {
            if (formData.createPayment && !formData.paymentData.amount) {
                setFormData(prev => ({
                    ...prev,
                    paymentData: {
                        ...prev.paymentData,
                        amount: totalAmount.toFixed(2)
                    }
                }))
            }
        }
    }

    const addRubro = () => {
        const filteredRubros = rubros.filter(r => r.type === formData.type)
        if (formData.rubros.length < filteredRubros.length) {
            setFormData(prev => ({
                ...prev,
                rubros: [...prev.rubros, { rubroId: '', percentage: 0 }]
            }))
        }
    }

    const removeRubro = (index: number) => {
        setFormData(prev => ({
            ...prev,
            rubros: prev.rubros.filter((_, i) => i !== index)
        }))
    }

    const updateRubro = (index: number, field: 'rubroId' | 'percentage', value: string | number) => {
        setFormData(prev => ({
            ...prev,
            rubros: prev.rubros.map((rubro, i) =>
                i === index ? { ...rubro, [field]: value } : rubro
            )
        }))
    }

    const addStockItem = () => {
        setFormData(prev => ({
            ...prev,
            stockData: [...prev.stockData, { materialId: '', quantity: 0, warehouseId: '' }]
        }))
    }

    const removeStockItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            stockData: prev.stockData.filter((_, i) => i !== index)
        }))
    }

    const updateStockItem = (index: number, field: keyof typeof formData.stockData[0], value: any) => {
        setFormData(prev => ({
            ...prev,
            stockData: prev.stockData.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }))
    }

    const getTitle = () => {
        switch (mode) {
            case 'view': return 'Ver Factura'
            case 'edit': return 'Editar Factura'
            default: return 'Nueva Factura'
        }
    }

    // Filter entities based on type
    const availableEntities = formData.type === 'CLIENT' ? clients : providers
    const entityLabel = formData.type === 'CLIENT' ? 'Cliente' : 'Proveedor'

    const handlePaymentMethodChange = (method: string) => {
        setFormData(prev => ({
            ...prev,
            paymentData: {
                ...prev.paymentData,
                method
            }
        }))

        // Si selecciona CHECK, abrir el selector de cheques
        if (method === 'CHECK') {
            setShowCheckSelector(true)
        }
    }

    const handleCheckSelect = (check: any) => {
        if (check) {
            setFormData(prev => ({
                ...prev,
                paymentData: {
                    ...prev.paymentData,
                    reference: check.checkNumber,
                    amount: check.amount.toString(),
                    currency: check.currency,
                    notes: `Cheque #${check.checkNumber} - ${check.issuerBank} - Vence: ${new Date(check.dueDate).toLocaleDateString('es-AR')}`
                },
                selectedCheckId: check.id
            }))
        }
        setShowCheckSelector(false)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Tipo *
                        </label>
                        <select
                            name="type"
                            required={!isReadOnly}
                            value={formData.type}
                            onChange={handleChange}
                            disabled={isReadOnly || mode === 'edit'}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="CLIENT">Cliente (Cobranza)</option>
                            <option value="PROVIDER">Proveedor (Pago)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Estado *
                        </label>
                        <select
                            name="status"
                            required={!isReadOnly}
                            value={formData.status}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="DRAFT">Borrador</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="SENT">Enviada</option>
                            <option value="PARTIAL">Pago Parcial</option>
                            <option value="PAID">Pagada</option>
                            <option value="OVERDUE">Vencida</option>
                            <option value="CANCELLED">Cancelada</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Proyecto *
                        </label>
                        <select
                            name="projectId"
                            required={!isReadOnly}
                            value={formData.projectId}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar proyecto</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            {entityLabel} *
                        </label>
                        <select
                            name={formData.type === 'CLIENT' ? 'clientId' : 'providerId'}
                            required={!isReadOnly}
                            value={formData.type === 'CLIENT' ? formData.clientId : formData.providerId}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar {entityLabel.toLowerCase()}</option>
                            {availableEntities.map((entity: any) => (
                                <option key={entity.id} value={entity.id}>{entity.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Número de Factura
                        </label>
                        <input
                            type="text"
                            name="number"
                            value={formData.number}
                            onChange={handleChange}
                            readOnly={isReadOnly || mode === 'edit'}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Dejar vacío para generar automáticamente"
                        />
                    </div>
                </div>

                {/* Amounts Section */}
                <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Información Financiera</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Monto Base *
                            </label>
                            <input
                                type="number"
                                name="amount"
                                required={!isReadOnly}
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={handleChange}
                                readOnly={isReadOnly}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Moneda *
                            </label>
                            <select
                                name="currency"
                                required={!isReadOnly}
                                value={formData.currency}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="PESOS">PESOS</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                IVA (%)
                            </label>
                            <input
                                type="number"
                                name="taxRate"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.taxRate}
                                onChange={handleChange}
                                readOnly={isReadOnly}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="19.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Retenciones (%)
                            </label>
                            <input
                                type="number"
                                name="retentionRate"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.retentionRate}
                                onChange={handleChange}
                                readOnly={isReadOnly}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Otros (%)
                            </label>
                            <input
                                type="number"
                                name="otherRate"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.otherRate}
                                onChange={handleChange}
                                readOnly={isReadOnly}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Total Calculation */}
                    {formData.amount && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Monto base:</span>
                                    <span className="text-sm font-medium">${baseAmount.toFixed(2)}</span>
                                </div>
                                {taxAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">IVA ({formData.taxRate}%):</span>
                                        <span className="text-sm font-medium">+${taxAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {otherAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Otros ({formData.otherRate}%):</span>
                                        <span className="text-sm font-medium">+${otherAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {retentionAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Retenciones ({formData.retentionRate}%):</span>
                                        <span className="text-sm font-medium">-${retentionAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <hr className="border-gray-300" />
                                <div className="flex justify-between">
                                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                                    <span className="text-lg font-semibold text-gray-900">
                                        ${totalAmount.toFixed(2)} {formData.currency}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dates */}
                <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Fechas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Fecha de Emisión *
                            </label>
                            <input
                                type="date"
                                name="issueDate"
                                required={!isReadOnly}
                                value={formData.issueDate}
                                onChange={handleChange}
                                readOnly={isReadOnly}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Fecha de Vencimiento *
                            </label>
                            <input
                                type="date"
                                name="dueDate"
                                required={!isReadOnly}
                                value={formData.dueDate}
                                onChange={handleChange}
                                readOnly={isReadOnly}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="border-t pt-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Descripción
                            </label>
                            <textarea
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                readOnly={isReadOnly}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Descripción de los servicios o productos..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Notas
                            </label>
                            <textarea
                                name="notes"
                                rows={2}
                                value={formData.notes}
                                onChange={handleChange}
                                readOnly={isReadOnly}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Notas adicionales..."
                            />
                        </div>
                    </div>
                </div>

                {/* Rubros Section */}
                {(!isReadOnly || formData.rubros.length > 0) && (
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-medium text-gray-900">Rubros {isReadOnly ? '' : '(Opcional)'}</h4>
                            {!isReadOnly && (
                                <button
                                    type="button"
                                    onClick={addRubro}
                                    disabled={formData.rubros.length >= rubros.filter(r => r.type === formData.type).length}
                                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Agregar Rubro
                                </button>
                            )}
                        </div>

                        {formData.rubros.map((rubro, index) => (
                            <div key={index} className="flex items-center space-x-4 mb-3">
                                <div className="flex-1">
                                    {isReadOnly ? (
                                        <div className="p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                            {rubros.find(r => r.id === rubro.rubroId)?.name || 'Rubro desconocido'}
                                        </div>
                                    ) : (
                                        <select
                                            value={rubro.rubroId}
                                            onChange={(e) => updateRubro(index, 'rubroId', e.target.value)}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="">Seleccionar rubro</option>
                                            {rubros
                                                .filter(r => r.type === formData.type) // Filtrar por tipo de factura
                                                .filter(r =>
                                                    !formData.rubros.some((fr, fi) => fi !== index && fr.rubroId === r.id)
                                                ).map(rubro => (
                                                    <option key={rubro.id} value={rubro.id}>{rubro.name}</option>
                                                ))}
                                        </select>
                                    )}
                                </div>
                                <div className="w-32">
                                    {isReadOnly ? (
                                        <div className="p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 text-center">
                                            {rubro.percentage}%
                                        </div>
                                    ) : (
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={rubro.percentage}
                                            onChange={(e) => updateRubro(index, 'percentage', parseFloat(e.target.value) || 0)}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="% del total"
                                        />
                                    )}
                                </div>
                                {!isReadOnly && (
                                    <button
                                        type="button"
                                        onClick={() => removeRubro(index)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Eliminar
                                    </button>
                                )}
                            </div>
                        ))}

                        {formData.rubros.length > 0 && (
                            <div className="text-sm text-gray-600">
                                Total asignado: {totalRubrosPercentage.toFixed(2)}%
                                {Math.abs(totalRubrosPercentage - 100) > 0.01 && (
                                    <span className="text-red-600 ml-2">
                                        (Debe sumar 100%)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Payment Section */}
                {!isReadOnly && (
                    <div className="border-t pt-6">
                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                name="createPayment"
                                checked={formData.createPayment}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm font-medium text-gray-700">
                                Crear Pago/Cobro inmediato
                            </label>
                        </div>

                        {formData.createPayment && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Método de Pago *
                                    </label>
                                    {isReadOnly ? (
                                        <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                            {formData.paymentData.method === 'TRANSFER' ? 'Transferencia' :
                                                formData.paymentData.method === 'CASH' ? 'Efectivo' :
                                                    formData.paymentData.method === 'CHECK' ? 'Cheque' :
                                                        formData.paymentData.method === 'CREDIT_CARD' ? 'Tarjeta de Crédito' :
                                                            formData.paymentData.method === 'DEBIT_CARD' ? 'Tarjeta de Débito' :
                                                                formData.paymentData.method}
                                        </div>
                                    ) : (
                                        <select
                                            name="paymentData.method"
                                            required
                                            value={formData.paymentData.method}
                                            onChange={(e) => handlePaymentMethodChange(e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="TRANSFER">Transferencia</option>
                                            <option value="CASH">Efectivo</option>
                                            <option value="CHECK">Cheque</option>
                                            <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                                            <option value="DEBIT_CARD">Tarjeta de Débito</option>
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Monto del Pago *
                                    </label>
                                    {isReadOnly ? (
                                        <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                            ${formData.paymentData.amount} {formData.paymentData.currency}
                                        </div>
                                    ) : (
                                        <input
                                            type="number"
                                            name="paymentData.amount"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={formData.paymentData.amount}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder={totalAmount.toFixed(2)}
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Fecha del Pago *
                                    </label>
                                    {isReadOnly ? (
                                        <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                            {new Date(formData.paymentData.paymentDate).toLocaleDateString('es-AR', {
                                                timeZone: 'America/Argentina/Buenos_Aires'
                                            })}
                                        </div>
                                    ) : (
                                        <input
                                            type="date"
                                            name="paymentData.paymentDate"
                                            required
                                            value={formData.paymentData.paymentDate}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Moneda del Pago *
                                    </label>
                                    {isReadOnly ? (
                                        <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                            {formData.paymentData.currency}
                                        </div>
                                    ) : (
                                        <select
                                            name="paymentData.currency"
                                            required
                                            value={formData.paymentData.currency}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="PESOS">PESOS</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Cuenta Destino *
                                    </label>
                                    {isReadOnly ? (
                                        <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                            {formData.paymentData.cashBoxId ?
                                                `Caja: ${cashBoxes.find((box: any) => box.id === formData.paymentData.cashBoxId)?.name || 'Desconocida'}` :
                                                `Banco: ${bankAccounts.find((acc: any) => acc.id === formData.paymentData.bankAccountId)?.name || 'Desconocida'}`
                                            }
                                        </div>
                                    ) : (
                                        <select
                                            name="paymentAccount"
                                            value={formData.paymentData.cashBoxId ? `cash-${formData.paymentData.cashBoxId}` :
                                                formData.paymentData.bankAccountId ? `bank-${formData.paymentData.bankAccountId}` : ''}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="">Seleccionar cuenta</option>
                                            {cashBoxes.map((box: any) => (
                                                <option key={`cash-${box.id}`} value={`cash-${box.id}`}>
                                                    Caja: {box.name} ({box.currency})
                                                </option>
                                            ))}
                                            {bankAccounts.map((account: any) => (
                                                <option key={`bank-${account.id}`} value={`bank-${account.id}`}>
                                                    Banco: {account.name} ({account.currency})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Referencia
                                    </label>
                                    {isReadOnly ? (
                                        <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                            {formData.paymentData.reference || 'Sin referencia'}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            name="paymentData.reference"
                                            value={formData.paymentData.reference}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Número de cheque, transferencia, etc."
                                        />
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Notas del Pago
                                    </label>
                                    {isReadOnly ? (
                                        <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                            {formData.paymentData.notes || 'Sin notas'}
                                        </div>
                                    ) : (
                                        <textarea
                                            name="paymentData.notes"
                                            rows={2}
                                            value={formData.paymentData.notes}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Notas adicionales sobre el pago..."
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Stock Section */}
                {(!isReadOnly || formData.createStock) && (
                    <div className="border-t pt-6">
                        <div className="flex items-center mb-4">
                            {!isReadOnly && (
                                <input
                                    type="checkbox"
                                    name="createStock"
                                    checked={formData.createStock}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            )}
                            <label className={`${!isReadOnly ? 'ml-2' : ''} block text-sm font-medium text-gray-700`}>
                                {formData.type === 'PROVIDER' ? 'Ingreso' : 'Egreso'} de stock
                            </label>
                        </div>

                        {formData.createStock && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-600">
                                        {formData.type === 'PROVIDER'
                                            ? 'Los materiales se SUMARÁN al stock (ingreso)'
                                            : 'Los materiales se RESTARÁN del stock (egreso)'
                                        }
                                    </p>
                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            onClick={addStockItem}
                                            className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                                        >
                                            Agregar Material
                                        </button>
                                    )}
                                </div>

                                {formData.stockData.map((item, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-md">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Material
                                            </label>
                                            {isReadOnly ? (
                                                <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                                    {materials.find(m => m.id === item.materialId)?.name || 'Material desconocido'}
                                                </div>
                                            ) : (
                                                <select
                                                    value={item.materialId}
                                                    onChange={(e) => updateStockItem(index, 'materialId', e.target.value)}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                >
                                                    <option value="">Seleccionar material</option>
                                                    {materials.map((material: any) => (
                                                        <option key={material.id} value={material.id}>
                                                            {material.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Cantidad
                                            </label>
                                            {isReadOnly ? (
                                                <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                                    {item.quantity}
                                                </div>
                                            ) : (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.001"
                                                    value={item.quantity}
                                                    onChange={(e) => updateStockItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="0"
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                UM
                                            </label>
                                            <input
                                                type="text"
                                                value={materials.find(m => m.id === item.materialId)?.unit || ''}
                                                readOnly
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                                                placeholder="Unidad"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Almacén
                                            </label>
                                            {isReadOnly ? (
                                                <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                                                    {warehouses.find(w => w.id === item.warehouseId)?.name || 'Almacén desconocido'}
                                                </div>
                                            ) : (
                                                <div className="flex space-x-2">
                                                    <select
                                                        value={item.warehouseId}
                                                        onChange={(e) => updateStockItem(index, 'warehouseId', e.target.value)}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    >
                                                        <option value="">Seleccionar almacén</option>
                                                        {warehouses.map((warehouse: any) => (
                                                            <option key={warehouse.id} value={warehouse.id}>
                                                                {warehouse.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeStockItem(index)}
                                                        className="mt-1 text-red-600 hover:text-red-900"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {isReadOnly ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {!isReadOnly && (
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {mode === 'edit' ? 'Actualizar Factura' : 'Crear Factura'}
                        </button>
                    )}
                </div>

                {/* Check Selector Modal */}
                <CheckSelectorModal
                    isOpen={showCheckSelector}
                    onClose={() => setShowCheckSelector(false)}
                    onSelect={handleCheckSelect}
                    context={formData.type === 'PROVIDER' ? 'payment' : 'collection'}
                    currency={formData.currency}
                    amount={parseFloat(formData.amount) || undefined}
                />
            </form>
        </Modal>
    )
}
