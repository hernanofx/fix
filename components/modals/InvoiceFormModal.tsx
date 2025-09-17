'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Modal from './Modal'

interface InvoiceFormModalProps {
    isOpen: boolean
    onClose: () => void
    invoice?: any
    onSave: (invoiceData: any) => void
    projects?: any[]
    providers?: any[]
    rubros?: any[]
    mode?: 'create' | 'edit' | 'view' // Nuevo prop para el modo
}

export default function InvoiceFormModal({ isOpen, onClose, invoice, onSave, projects = [], providers = [], rubros = [], mode = 'create' }: InvoiceFormModalProps) {
    const { data: session } = useSession()
    const [cashBoxes, setCashBoxes] = useState<any[]>([])
    const [bankAccounts, setBankAccounts] = useState<any[]>([])
    const [formData, setFormData] = useState({
        number: '',
        project: '',
        provider: '',
        rubro: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        status: 'PENDING',
        taxRate: '0',
        notes: '',
        currency: 'PESOS',
        // Campos de pago
        createPayment: false,
        paymentMethod: '',
        paymentAmount: '',
        paymentCurrency: 'PESOS',
        paymentAccount: '',
        paymentNotes: '',
        paymentDate: new Date().toISOString().split('T')[0],
        // Campos de condiciones de pago
        paymentTermId: '',
        selectedInstallments: [] as string[] // IDs de cuotas seleccionadas
    })

    // Estados para condiciones de pago
    const [paymentTerms, setPaymentTerms] = useState<any[]>([])
    const [generatedInstallments, setGeneratedInstallments] = useState<any[]>([])
    const [loadingPaymentTerms, setLoadingPaymentTerms] = useState(false)
    const [selectedInstallmentsTotal, setSelectedInstallmentsTotal] = useState(0)

    // Función helper para cálculos seguros
    const safeParseFloat = (value: any): number => {
        if (value === null || value === undefined || value === '') return 0
        const parsed = parseFloat(String(value))
        return isFinite(parsed) ? parsed : 0
    }

    const safeCalculateTotal = (items: any[], amountField: string = 'amount'): number => {
        return items.reduce((sum, item) => {
            const amount = safeParseFloat(item[amountField])
            return sum + (amount >= 0 ? amount : 0)
        }, 0)
    }

    const formatCurrency = (amount: number, currency: string = 'PESOS'): string => {
        if (!isFinite(amount) || amount < 0) return '0.00'
        return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`
    }

    // Reset form data when modal opens in create mode or load invoice data in edit/view mode
    useEffect(() => {
        if (isOpen && mode === 'create') {
            setFormData({
                number: '',
                project: '',
                provider: '',
                rubro: '',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                dueDate: '',
                status: 'PENDING',
                taxRate: '0',
                notes: '',
                currency: 'PESOS',
                // Campos de pago
                createPayment: false,
                paymentMethod: '',
                paymentAmount: '',
                paymentCurrency: 'PESOS',
                paymentAccount: '',
                paymentNotes: '',
                paymentDate: new Date().toISOString().split('T')[0],
                // Campos de condiciones de pago
                paymentTermId: '',
                selectedInstallments: [] as string[] // IDs de cuotas seleccionadas
            })
            setGeneratedInstallments([])
            setSelectedInstallmentsTotal(0)
        }
    }, [isOpen, mode])

    // Load invoice data when invoice prop changes (for edit/view modes)
    useEffect(() => {
        if (isOpen && (mode === 'edit' || mode === 'view') && invoice) {
            console.log('Loading invoice data:', invoice) // Debug log
            const payment = invoice.payments?.[0]
            setFormData({
                number: invoice.number || '',
                project: invoice.projectId || '',
                provider: invoice.providerId || '',
                rubro: invoice.rubroId || '',
                amount: invoice.amount ? parseFloat(invoice.amount).toFixed(2) : '',
                description: invoice.description || '',
                date: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '',
                dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
                status: invoice.status || 'PENDING',
                taxRate: invoice.tax ? ((parseFloat(invoice.tax) / parseFloat(invoice.amount)) * 100).toFixed(2) : '0',
                notes: invoice.notes || '',
                currency: invoice.currency || 'PESOS',
                // Campos de pago
                createPayment: !!payment,
                paymentMethod: payment ? (payment.method === 'CASH' ? 'EFECTIVO' :
                    payment.method === 'TRANSFER' ? 'TRANSFERENCIA' :
                        payment.method === 'CHECK' ? 'CHEQUE' :
                            payment.method === 'CREDIT_CARD' ? 'TARJETA' : '') : '',
                paymentAmount: payment ? parseFloat(payment.amount).toFixed(2) : '',
                paymentCurrency: payment ? payment.currency || 'PESOS' : 'PESOS',
                paymentAccount: payment ? (payment.cashBoxId ? `cash-${payment.cashBoxId}` :
                    payment.bankAccountId ? `bank-${payment.bankAccountId}` : '') : '',
                paymentNotes: payment ? payment.notes || '' : '',
                paymentDate: payment ? (payment.paidDate ? new Date(payment.paidDate).toISOString().split('T')[0] : '') : new Date().toISOString().split('T')[0],
                // Campos de condiciones de pago
                paymentTermId: invoice.paymentTermId || '',
                selectedInstallments: [] as string[] // IDs de cuotas seleccionadas
            })
            setGeneratedInstallments([])
            setSelectedInstallmentsTotal(0)
        }
    }, [isOpen, mode, invoice])

    // Generar cuotas cuando se selecciona un payment term
    useEffect(() => {
        const generateInstallments = async () => {
            if (!formData.paymentTermId) {
                setGeneratedInstallments([])
                return
            }

            const selectedTerm = paymentTerms.find(term => term.id === formData.paymentTermId)
            if (!selectedTerm) {
                setGeneratedInstallments([])
                return
            }

            // Calcular fechas de las cuotas usando el monto de la condición de pago
            const installments = []
            const startDate = new Date(selectedTerm.startDate)
            const amount = safeParseFloat(selectedTerm.amount)
            const periods = selectedTerm.periods || 1
            const currency = selectedTerm.currency || 'PESOS'

            // Validar que el monto y períodos sean válidos
            if (amount <= 0 || periods <= 0 || !isFinite(amount) || !isFinite(periods)) {
                setGeneratedInstallments([])
                return
            }

            const installmentAmount = amount / periods

            // Validar que el monto de cada cuota sea un número válido
            if (!isFinite(installmentAmount) || installmentAmount <= 0) {
                setGeneratedInstallments([])
                return
            }

            for (let i = 1; i <= periods; i++) {
                let dueDate = new Date(startDate)

                // Calcular fecha según recurrencia
                switch (selectedTerm.recurrence) {
                    case 'MENSUAL':
                        dueDate.setMonth(startDate.getMonth() + (i - 1))
                        break
                    case 'BIMESTRAL':
                        dueDate.setMonth(startDate.getMonth() + ((i - 1) * 2))
                        break
                    case 'TRIMESTRAL':
                        dueDate.setMonth(startDate.getMonth() + ((i - 1) * 3))
                        break
                    case 'CUATRIMESTRAL':
                        dueDate.setMonth(startDate.getMonth() + ((i - 1) * 4))
                        break
                    case 'SEMESTRAL':
                        dueDate.setMonth(startDate.getMonth() + ((i - 1) * 6))
                        break
                    case 'ANUAL':
                        dueDate.setFullYear(startDate.getFullYear() + (i - 1))
                        break
                }

                installments.push({
                    id: `installment-${i}`,
                    number: i,
                    amount: installmentAmount,
                    dueDate: dueDate.toISOString().split('T')[0],
                    status: 'PENDING',
                    description: `Cuota ${i} de ${periods} - ${selectedTerm.description || ''}`,
                    currency: currency
                })
            }

            setGeneratedInstallments(installments)
        }

        generateInstallments()
    }, [formData.paymentTermId, paymentTerms])

    // Calcular total de cuotas seleccionadas (solo informativo)
    useEffect(() => {
        if (formData.selectedInstallments.length === 0) {
            setSelectedInstallmentsTotal(0)
            return
        }

        const selectedInstallments = generatedInstallments.filter(inst =>
            formData.selectedInstallments.includes(inst.id)
        )

        const total = safeCalculateTotal(selectedInstallments, 'amount')
        setSelectedInstallmentsTotal(parseFloat(total.toFixed(2)))
    }, [formData.selectedInstallments, generatedInstallments])

    // Cargar datos relacionados (cajas, bancos, condiciones de pago)
    useEffect(() => {
        const loadRelatedData = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return

                console.log('Loading related data for organization:', organizationId) // Debug log

                // Cargar cajas
                const cashBoxesRes = await fetch(`/api/cash-boxes?organizationId=${organizationId}`)
                if (cashBoxesRes.ok) {
                    const cashBoxesData = await cashBoxesRes.json()
                    setCashBoxes(cashBoxesData)
                    console.log('Cash boxes loaded:', cashBoxesData.length)
                } else {
                    console.error('Failed to load cash boxes')
                    setCashBoxes([])
                }

                // Cargar cuentas bancarias
                const bankAccountsRes = await fetch(`/api/bank-accounts?organizationId=${organizationId}`)
                if (bankAccountsRes.ok) {
                    const bankAccountsData = await bankAccountsRes.json()
                    setBankAccounts(bankAccountsData)
                    console.log('Bank accounts loaded:', bankAccountsData.length)
                } else {
                    console.error('Failed to load bank accounts')
                    setBankAccounts([])
                }

                // Cargar condiciones de pago
                setLoadingPaymentTerms(true)
                const paymentTermsRes = await fetch(`/api/payment-terms?organizationId=${organizationId}&type=EXPENSE&entityFilter=PROVIDER`)
                if (paymentTermsRes.ok) {
                    const paymentTermsData = await paymentTermsRes.json()
                    setPaymentTerms(paymentTermsData)
                    console.log('Payment terms loaded:', paymentTermsData.length)
                } else {
                    console.error('Failed to load payment terms')
                    setPaymentTerms([])
                }
                setLoadingPaymentTerms(false)
            } catch (err) {
                console.error('Error loading related data:', err)
                setLoadingPaymentTerms(false)
            }
        }

        if (isOpen && session) {
            loadRelatedData()
        }
    }, [session, isOpen])

    const defaultProjects = [
        'Residencial Los Álamos',
        'Centro Comercial Plaza',
        'Oficinas Corporativas'
    ]

    const defaultProviders = [
        'Proveedor Materiales SA',
        'Servicios Eléctricos Ltda',
        'Mantenimiento Hermanos',
        'Suministros Industriales',
        'Transportes Rápidos'
    ]

    const availableProjects = projects.length > 0 ? projects : defaultProjects.map(name => ({ id: name, name }))
    const availableProviders = providers.length > 0 ? providers : defaultProviders.map(name => ({ id: name, name }))

    const defaultRubros = [
        'Materiales',
        'Mano de Obra',
        'Equipos',
        'Servicios',
        'Transporte'
    ]

    const availableRubros = rubros.length > 0 ? rubros : defaultRubros.map(name => ({ id: name, name }))

    // Filtrar rubros por tipo basado en si hay proveedor seleccionado
    const filteredRubros = availableRubros.filter(rubro => {
        if (formData.provider) {
            // Si hay proveedor seleccionado, mostrar solo rubros de tipo PROVIDER
            return rubro.type === 'PROVIDER'
        } else {
            // Si no hay proveedor (factura de cliente), mostrar solo rubros de tipo CLIENT
            return rubro.type === 'CLIENT'
        }
    })

    const getTitle = () => {
        switch (mode) {
            case 'view': return 'Ver Factura'
            case 'edit': return 'Editar Factura'
            default: return 'Nueva Factura'
        }
    }

    const isReadOnly = mode === 'view'

    // Determinar si la factura ya tiene un pago existente
    const hasExistingPayment = !!invoice?.payments?.[0]
    const isPaymentReadOnly = mode === 'view' // Solo readonly en modo vista

    const statuses = [
        { value: 'DRAFT', label: 'Borrador' },
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'SENT', label: 'Enviada' },
        { value: 'PARTIAL', label: 'Pago Parcial' },
        { value: 'PAID', label: 'Pagada' },
        { value: 'OVERDUE', label: 'Vencida' },
        { value: 'CANCELLED', label: 'Cancelada' }
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const amount = safeParseFloat(formData.amount)
        const taxRate = safeParseFloat(formData.taxRate)

        // Validar que el monto sea válido
        if (!isFinite(amount) || amount < 0) {
            alert('El monto de la factura debe ser un número válido mayor o igual a cero.')
            return
        }

        const taxAmount = amount * (taxRate / 100)

        // Validar que el impuesto calculado sea válido
        if (!isFinite(taxAmount)) {
            alert('Error en el cálculo del impuesto. Verifique los valores.')
            return
        }

        const total = amount + taxAmount

        // Validar que el total sea válido
        if (!isFinite(total) || total < 0) {
            alert('Error en el cálculo del total. Verifique los valores.')
            return
        }

        // Validar que hay cuentas disponibles si se va a crear o actualizar un pago
        if ((formData.createPayment && !hasExistingPayment) || (hasExistingPayment && mode === 'edit')) {
            if (cashBoxes.length === 0 && bankAccounts.length === 0) {
                alert('No hay cuentas disponibles. Crea una caja o cuenta bancaria primero.')
                return
            }

            if (!formData.paymentAccount) {
                alert('Debes seleccionar una cuenta destino para el pago.')
                return
            }
        }

        // Limpiar los datos del formulario, removiendo campos que no deben ir a la API
        const cleanData = {
            number: formData.number,
            amount: amount.toFixed(2),
            taxAmount: taxAmount.toFixed(2),
            total: total.toFixed(2),
            projectId: formData.project,
            providerId: formData.provider,
            rubroId: (() => {
                // Solo enviar rubroId si es un rubro real de la base de datos (no uno por defecto)
                if (!formData.rubro) return null
                const rubroObj = rubros.find(r => r.id === formData.rubro)
                return rubroObj ? formData.rubro : null
            })(),
            issueDate: formData.date,
            dueDate: formData.dueDate,
            tax: taxAmount.toFixed(2),
            description: formData.description,
            status: formData.status,
            notes: formData.notes,
            currency: formData.currency,
            // Información de condiciones de pago
            paymentTermId: formData.paymentTermId || null,
            // Información de pago
            createPayment: formData.createPayment && !hasExistingPayment,
            updatePayment: hasExistingPayment && mode === 'edit',
            paymentData: ((formData.createPayment && !hasExistingPayment) || (hasExistingPayment && mode === 'edit')) ? {
                amount: (() => {
                    const paymentAmount = safeParseFloat(formData.paymentAmount)
                    if (isFinite(paymentAmount) && paymentAmount >= 0) {
                        return paymentAmount.toFixed(2)
                    }
                    // Si no hay monto válido, usar el total calculado
                    return total.toFixed(2)
                })(),
                method: formData.paymentMethod === 'EFECTIVO' ? 'CASH' :
                    formData.paymentMethod === 'TRANSFERENCIA' ? 'TRANSFER' :
                        formData.paymentMethod === 'CHEQUE' ? 'CHECK' :
                            formData.paymentMethod === 'TARJETA' ? 'CREDIT_CARD' : 'OTHER',
                description: formData.provider
                    ? `Pago realizado de factura ${formData.number || 'sin número'}`
                    : `Pago recibido de factura ${formData.number || 'sin número'}`,
                notes: formData.paymentNotes,
                currency: formData.paymentCurrency,
                cashBoxId: formData.paymentAccount.startsWith('cash-') ? formData.paymentAccount.replace('cash-', '') : null,
                bankAccountId: formData.paymentAccount.startsWith('bank-') ? formData.paymentAccount.replace('bank-', '') : null,
                status: 'PAID',
                paidDate: formData.paymentDate,
                // Para actualización de pagos existentes
                paymentId: hasExistingPayment ? invoice.payments[0].id : null
            } : null,
            // Información de cuotas seleccionadas
            selectedInstallments: formData.selectedInstallments.length > 0 ? formData.selectedInstallments.map(id => {
                const installment = generatedInstallments.find(inst => inst.id === id)
                if (!installment) return null

                const installmentAmount = safeParseFloat(installment.amount)

                return {
                    installmentNumber: installment?.number,
                    amount: isFinite(installmentAmount) && installmentAmount >= 0 ? installmentAmount.toFixed(2) : '0.00',
                    dueDate: installment?.dueDate,
                    description: installment?.description
                }
            }).filter(Boolean) : []
        }

        onSave(cleanData)
        onClose()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement
        const newValue = type === 'checkbox' ? checked : value

        // Si cambia la moneda del pago, no necesitamos resetear la cuenta ya que todas las cuentas pueden trabajar con cualquier moneda
        // La lógica anterior de filtrado por moneda ha sido eliminada

        // Si cambia createPayment, cambiar automáticamente el status a PAID y setear el monto del pago
        if (name === 'createPayment') {
            const isChecked = checked
            const amount = safeParseFloat(formData.amount)
            const taxRate = safeParseFloat(formData.taxRate)
            const taxAmount = amount * (taxRate / 100)
            const total = amount + taxAmount

            setFormData(prev => ({
                ...prev,
                createPayment: isChecked,
                // Cambiar automáticamente el status a PAID cuando se marca crear pago inmediato
                status: isChecked ? 'PAID' : 'PENDING',
                // Setear el monto del pago al total calculado si no hay un monto ya establecido
                paymentAmount: isChecked && (!prev.paymentAmount || prev.paymentAmount === '') ? total.toFixed(2) : prev.paymentAmount
            }))
            return
        }

        // Si cambia provider, limpiar el rubro si no es válido para el nuevo tipo
        if (name === 'provider') {
            const newProvider = value
            const currentRubro = formData.rubro

            // Si hay un rubro seleccionado, verificar si es válido para el nuevo tipo
            if (currentRubro) {
                const rubroObj = availableRubros.find(r => r.id === currentRubro)
                if (rubroObj) {
                    const expectedType = newProvider ? 'PROVIDER' : 'CLIENT'
                    if (rubroObj.type !== expectedType) {
                        // El rubro actual no es válido para el nuevo tipo, limpiarlo
                        setFormData(prev => ({
                            ...prev,
                            provider: newProvider,
                            rubro: ''
                        }))
                        return
                    }
                }
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }))

        // Si se cambia amount o taxRate y está marcado createPayment, actualizar paymentAmount
        if ((name === 'amount' || name === 'taxRate') && formData.createPayment) {
            const currentAmount = name === 'amount' ? safeParseFloat(newValue) : safeParseFloat(formData.amount)
            const currentTaxRate = name === 'taxRate' ? safeParseFloat(newValue) : safeParseFloat(formData.taxRate)
            const calculatedTaxAmount = currentAmount * (currentTaxRate / 100)
            const calculatedTotal = currentAmount + calculatedTaxAmount

            if (isFinite(calculatedTotal) && calculatedTotal >= 0) {
                setFormData(prev => ({
                    ...prev,
                    [name]: newValue,
                    paymentAmount: calculatedTotal.toFixed(2)
                }))
                return
            }
        }
    }

    const handleUseCalculatedTotal = () => {
        if (selectedInstallmentsTotal > 0) {
            const currency = generatedInstallments.find(inst =>
                formData.selectedInstallments.includes(inst.id)
            )?.currency || 'PESOS'

            setFormData(prev => ({
                ...prev,
                amount: selectedInstallmentsTotal.toFixed(2),
                currency: currency,
                paymentAmount: selectedInstallmentsTotal.toFixed(2),
                paymentCurrency: currency
            }))
        }
    }

    const handleDeletePayment = async () => {
        if (!invoice?.payments?.[0]) return

        const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este pago? Esta acción también eliminará la transacción relacionada en tesorería y cambiará el estado de la factura a pendiente.')

        if (!confirmDelete) return

        try {
            const paymentId = invoice.payments[0].id
            const response = await fetch(`/api/invoices/${invoice.id}/payments/${paymentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                alert('Pago eliminado exitosamente. La factura ha vuelto a estado pendiente.')

                // Disparar evento para actualizar otras páginas
                console.log('🔥 Dispatching treasury:transactionDeleted event from invoice modal', {
                    type: 'billPayment',
                    id: paymentId,
                    cashBoxId: invoice.payments[0].cashBoxId,
                    bankAccountId: invoice.payments[0].bankAccountId,
                    amount: invoice.payments[0].amount,
                    currency: invoice.payments[0].currency
                })

                window.dispatchEvent(new CustomEvent('treasury:transactionDeleted', {
                    detail: {
                        type: 'billPayment',
                        id: paymentId,
                        cashBoxId: invoice.payments[0].cashBoxId,
                        bankAccountId: invoice.payments[0].bankAccountId,
                        amount: invoice.payments[0].amount,
                        currency: invoice.payments[0].currency
                    }
                }))

                onClose()
                // Aquí podrías agregar una función para refrescar la lista de facturas
                window.location.reload()
            } else {
                const errorData = await response.json()
                alert(`Error al eliminar el pago: ${errorData.error || 'Error desconocido'}`)
            }
        } catch (error) {
            console.error('Error deleting payment:', error)
            alert('Error al eliminar el pago. Por favor, intenta nuevamente.')
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sección Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                            Proyecto *
                        </label>
                        <select
                            id="project"
                            name="project"
                            required={!isReadOnly}
                            value={formData.project}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar proyecto</option>
                            {availableProjects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                            Proveedor *
                        </label>
                        <select
                            id="provider"
                            name="provider"
                            required={!isReadOnly}
                            value={formData.provider}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar proveedor</option>
                            {availableProviders.map(provider => (
                                <option key={provider.id} value={provider.id}>{provider.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="rubro" className="block text-sm font-medium text-gray-700">
                            Rubro
                        </label>
                        <select
                            id="rubro"
                            name="rubro"
                            value={formData.rubro}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar rubro</option>
                            {filteredRubros.map(rubro => (
                                <option key={rubro.id} value={rubro.id}>{rubro.name}</option>
                            ))}
                        </select>
                        {filteredRubros.length === 0 && (
                            <p className="mt-1 text-sm text-gray-500">
                                No hay rubros disponibles para este tipo
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="paymentTerm" className="block text-sm font-medium text-gray-700">
                            Condición de Pago
                        </label>
                        <select
                            id="paymentTerm"
                            name="paymentTermId"
                            value={formData.paymentTermId}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar condición</option>
                            {loadingPaymentTerms ? (
                                <option disabled>Cargando...</option>
                            ) : paymentTerms.length === 0 ? (
                                <option disabled>No hay condiciones disponibles</option>
                            ) : (
                                paymentTerms
                                    .filter(term => !formData.provider || term.providerId === formData.provider || !term.providerId)
                                    .map(term => (
                                        <option key={term.id} value={term.id}>
                                            {term.description || `${term.recurrence} - ${term.periods} cuotas`}
                                        </option>
                                    ))
                            )}
                        </select>
                    </div>
                </div>

                {/* Sección de Montos */}
                <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Información Financiera</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                                Monto *
                            </label>
                            <input
                                type="number"
                                id="amount"
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
                            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                                Moneda *
                            </label>
                            <select
                                id="currency"
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
                            <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">
                                Impuesto (%)
                            </label>
                            <input
                                type="number"
                                id="taxRate"
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
                    </div>

                    {/* Total calculado */}
                    {formData.amount && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Total calculado:</span>
                                <span className="text-lg font-semibold text-gray-900">
                                    ${(() => {
                                        const amount = safeParseFloat(formData.amount)
                                        const taxRate = safeParseFloat(formData.taxRate)
                                        const taxAmount = amount * (taxRate / 100)
                                        const total = amount + taxAmount
                                        return formatCurrency(total, formData.currency).split(' ')[0]
                                    })()} {formData.currency}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sección de Fechas */}
                <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Fechas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                                Fecha de Emisión *
                            </label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                required={!isReadOnly}
                                value={formData.date}
                                onChange={handleChange}
                                readOnly={isReadOnly}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                                Fecha de Vencimiento *
                            </label>
                            <input
                                type="date"
                                id="dueDate"
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

                {/* Sección de Estado y Número */}
                <div className="border-t pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Estado *
                            </label>
                            <select
                                id="status"
                                name="status"
                                required={!isReadOnly}
                                value={formData.status}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                {statuses.map(status => (
                                    <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                                Número de Factura {mode === 'create' ? '(Opcional)' : ''}
                            </label>
                            <input
                                type="text"
                                id="number"
                                name="number"
                                value={formData.number}
                                onChange={handleChange}
                                readOnly={isReadOnly || mode === 'edit'}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder={mode === 'create' ? 'Ej: FAC-2024-001' : ''}
                            />
                        </div>
                    </div>
                </div>

                {/* Sección de Descripción */}
                <div className="border-t pt-6">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Descripción
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            readOnly={isReadOnly}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Descripción de los servicios..."
                        />
                    </div>

                    <div className="mt-4">
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                            Notas
                        </label>
                        <textarea
                            id="notes"
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

                {/* Sección de Pago Opcional */}
                {!isReadOnly && (
                    <div className="border-t pt-6">
                        <div className="flex items-center mb-4">
                            <input
                                id="createPayment"
                                name="createPayment"
                                type="checkbox"
                                checked={formData.createPayment}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="createPayment" className="ml-2 block text-sm font-medium text-gray-700">
                                Crear pago inmediato
                            </label>
                        </div>

                        {formData.createPayment && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                                        Método de Pago *
                                    </label>
                                    <select
                                        id="paymentMethod"
                                        name="paymentMethod"
                                        required
                                        value={formData.paymentMethod}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="">Seleccionar método</option>
                                        <option value="EFECTIVO">Efectivo</option>
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                        <option value="CHEQUE">Cheque</option>
                                        <option value="TARJETA">Tarjeta</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">
                                        Monto del Pago *
                                    </label>
                                    <input
                                        type="number"
                                        id="paymentAmount"
                                        name="paymentAmount"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={formData.paymentAmount}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700">
                                        Fecha del Pago *
                                    </label>
                                    <input
                                        type="date"
                                        id="paymentDate"
                                        name="paymentDate"
                                        required
                                        value={formData.paymentDate}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="paymentCurrency" className="block text-sm font-medium text-gray-700">
                                        Moneda del Pago *
                                    </label>
                                    <select
                                        id="paymentCurrency"
                                        name="paymentCurrency"
                                        required
                                        value={formData.paymentCurrency}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="PESOS">PESOS</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="paymentAccount" className="block text-sm font-medium text-gray-700">
                                        Cuenta de Destino *
                                    </label>
                                    <select
                                        id="paymentAccount"
                                        name="paymentAccount"
                                        required
                                        value={formData.paymentAccount}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="">Seleccionar cuenta</option>
                                        {cashBoxes.map((box) => (
                                            <option key={box.id} value={`cash-${box.id}`}>
                                                Caja: {box.name} ({box.currency})
                                            </option>
                                        ))}
                                        {bankAccounts.map((account) => (
                                            <option key={account.id} value={`bank-${account.id}`}>
                                                Banco: {account.name} ({account.currency})
                                            </option>
                                        ))}
                                        {cashBoxes.length === 0 && bankAccounts.length === 0 && (
                                            <option disabled>No hay cuentas disponibles</option>
                                        )}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700">
                                        Notas del Pago
                                    </label>
                                    <textarea
                                        id="paymentNotes"
                                        name="paymentNotes"
                                        rows={2}
                                        value={formData.paymentNotes}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Notas adicionales sobre el pago..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Sección de Cuotas Generadas */}
                {formData.paymentTermId && generatedInstallments.length > 0 && (
                    <div className="border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-md font-medium text-gray-900">Cuotas Disponibles</h4>
                            <div className="text-sm text-gray-500">
                                <span>{generatedInstallments.filter(inst => inst.status !== 'PAID').length} disponibles</span>
                                <span className="mx-2">•</span>
                                <span>{generatedInstallments.filter(inst => inst.status === 'PAID').length} pagadas</span>
                                <span className="mx-2">•</span>
                                <span>Total: ${(() => {
                                    const total = safeCalculateTotal(generatedInstallments, 'amount')
                                    return formatCurrency(total, generatedInstallments[0]?.currency || formData.currency).split(' ')[0]
                                })()} {generatedInstallments[0]?.currency || formData.currency}</span>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {generatedInstallments.map((installment) => {
                                const isPaid = installment.status === 'PAID'
                                const isSelectable = !isPaid && !isReadOnly

                                return (
                                    <div key={installment.id} className={`flex items-center justify-between p-3 border rounded-lg ${isPaid
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-gray-200'
                                        }`}>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id={`installment-${installment.number}`}
                                                checked={formData.selectedInstallments.includes(installment.id)}
                                                onChange={(e) => {
                                                    const isChecked = e.target.checked
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        selectedInstallments: isChecked
                                                            ? [...prev.selectedInstallments, installment.id]
                                                            : prev.selectedInstallments.filter(id => id !== installment.id)
                                                    }))
                                                }}
                                                disabled={!isSelectable}
                                                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${isPaid ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                            />
                                            <div>
                                                <label
                                                    htmlFor={`installment-${installment.number}`}
                                                    className={`text-sm font-medium cursor-pointer ${isPaid ? 'text-gray-500' : 'text-gray-900'
                                                        }`}
                                                >
                                                    Cuota {installment.number}
                                                </label>
                                                <p className="text-sm text-gray-500">
                                                    Vence: {new Date(installment.dueDate).toLocaleDateString('es-AR', {
                                                        timeZone: 'America/Argentina/Buenos_Aires'
                                                    })} •
                                                    Monto: ${(() => {
                                                        const amount = safeParseFloat(installment.amount)
                                                        return formatCurrency(amount, installment.currency || formData.currency).split(' ')[0]
                                                    })()} {installment.currency || formData.currency}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${installment.status === 'PAID'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {installment.status === 'PAID' ? 'Pagada' : 'Pendiente'}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {formData.selectedInstallments.length > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-blue-800">
                                        <strong>{formData.selectedInstallments.length} cuota(s) seleccionada(s)</strong> •
                                        Total a pagar: ${(() => {
                                            const currency = generatedInstallments.find(inst => formData.selectedInstallments.includes(inst.id))?.currency || formData.currency
                                            return formatCurrency(selectedInstallmentsTotal, currency).split(' ')[0]
                                        })()} {generatedInstallments.find(inst => formData.selectedInstallments.includes(inst.id))?.currency || formData.currency}
                                    </p>
                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            onClick={handleUseCalculatedTotal}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            Usar este total
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Botones de Acción */}
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
                            {invoice ? 'Actualizar Factura' : 'Crear Factura'}
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    )
}
