'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Modal from './Modal'
import CheckSelectorModal from './CheckSelectorModal'

interface CollectionFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (paymentData: any) => void
    payment: any
}

export default function CollectionFormModal({ isOpen, onClose, onSave, payment }: CollectionFormModalProps) {
    const { data: session } = useSession()
    const [clients, setClients] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [rubros, setRubros] = useState<any[]>([])
    const [paymentTerms, setPaymentTerms] = useState<any[]>([])
    const [generatedCollections, setGeneratedCollections] = useState<any[]>([])
    const [selectedCollections, setSelectedCollections] = useState<Set<number>>(new Set())
    const [collections, setCollections] = useState<any[]>([])

    const [cashBoxes, setCashBoxes] = useState<any[]>([])
    const [bankAccounts, setBankAccounts] = useState<any[]>([])

    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        method: 'TRANSFER',
        status: 'PENDING',
        dueDate: '',
        paidDate: '',
        reference: '',
        notes: '',
        clientId: '',
        projectId: '',
        rubroId: '',
        cashBoxId: '',
        bankAccountId: '',
        currency: 'PESOS',
        paymentTermId: '',
        createMultipleFromTerm: false,
        paymentData: {
            amount: '',
            method: 'TRANSFER',
            currency: 'PESOS',
            collectionDate: new Date().toISOString().split('T')[0],
            reference: '',
            notes: '',
            cashBoxId: '',
            bankAccountId: ''
        },
        selectedCheckId: ''
    })

    const [showCheckSelector, setShowCheckSelector] = useState(false)

    // Función para cargar condiciones de pago filtradas por cliente
    const loadPaymentTerms = async (clientId?: string) => {
        try {
            const organizationId = (session as any)?.user?.organizationId
            if (!organizationId) return

            let url = `/api/payment-terms?type=INCOME&organizationId=${organizationId}`
            if (clientId) {
                url += `&clientId=${clientId}`
            }

            const paymentTermsRes = await fetch(url)
            if (paymentTermsRes.ok) {
                const paymentTermsData = await paymentTermsRes.json()
                setPaymentTerms(paymentTermsData)
            } else {
                setPaymentTerms([])
            }
        } catch (err) {
            console.error('Error loading payment terms:', err)
            setPaymentTerms([])
        }
    }

    // Cargar datos relacionados
    useEffect(() => {
        const loadRelatedData = async () => {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return

                // Cargar clientes
                const clientsRes = await fetch(`/api/clients?organizationId=${organizationId}`)
                if (clientsRes.ok) {
                    const clientsData = await clientsRes.json()
                    setClients(clientsData)
                } else {
                    setClients([])
                }

                // Cargar proyectos
                const projectsRes = await fetch(`/api/projects?organizationId=${organizationId}`)
                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json()
                    setProjects(projectsData)
                } else {
                    setProjects([])
                }

                // Cargar rubros de tipo CLIENT
                const rubrosRes = await fetch(`/api/rubros?type=CLIENT&organizationId=${organizationId}`)
                if (rubrosRes.ok) {
                    const rubrosData = await rubrosRes.json()
                    setRubros(rubrosData)
                } else {
                    setRubros([])
                }

                // Cargar cajas
                const cashBoxesRes = await fetch(`/api/cash-boxes?organizationId=${organizationId}`)
                if (cashBoxesRes.ok) {
                    const cashBoxesData = await cashBoxesRes.json()
                    setCashBoxes(cashBoxesData)
                } else {
                    setCashBoxes([])
                }

                // Cargar cuentas bancarias
                const bankAccountsRes = await fetch(`/api/bank-accounts?organizationId=${organizationId}`)
                if (bankAccountsRes.ok) {
                    const bankAccountsData = await bankAccountsRes.json()
                    setBankAccounts(bankAccountsData)
                } else {
                    setBankAccounts([])
                }

                // Cargar collections existentes para verificar cuotas ya creadas
                const collectionsRes = await fetch(`/api/collections?organizationId=${organizationId}`)
                if (collectionsRes.ok) {
                    const collectionsData = await collectionsRes.json()
                    setCollections(collectionsData)
                } else {
                    setCollections([])
                }
            } catch (err) {
                console.error('Error loading related data:', err)
            }
        }

        if (isOpen) {
            loadRelatedData()
        }
    }, [session, isOpen])

    useEffect(() => {
        if (payment) {
            setFormData({
                amount: payment.amount?.toString() || '',
                description: payment.description || '',
                method: payment.method || 'TRANSFER',
                status: payment.status || 'PENDING',
                dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                paidDate: payment.paidDate ? new Date(payment.paidDate).toISOString().split('T')[0] : (payment.status === 'PAID' ? new Date().toISOString().split('T')[0] : ''),
                reference: payment.reference || '',
                notes: payment.notes || '',
                clientId: payment.clientId || '',
                projectId: payment.projectId || '',
                rubroId: payment.rubroId || '',
                cashBoxId: payment.cashBoxId || '',
                bankAccountId: payment.bankAccountId || '',
                currency: payment.currency || 'PESOS',
                paymentTermId: payment.paymentTermId || '',
                createMultipleFromTerm: false,
                paymentData: {
                    amount: '',
                    method: 'TRANSFER',
                    currency: 'PESOS',
                    collectionDate: new Date().toISOString().split('T')[0],
                    reference: '',
                    notes: '',
                    cashBoxId: '',
                    bankAccountId: ''
                },
                selectedCheckId: ''
            })
        } else {
            // Para nueva cobranza, establecer fechas por defecto
            const today = new Date().toISOString().split('T')[0]
            setFormData({
                amount: '',
                description: '',
                method: 'TRANSFER',
                status: 'PENDING',
                dueDate: today,
                paidDate: '',
                reference: '',
                notes: '',
                clientId: '',
                projectId: '',
                rubroId: '',
                cashBoxId: '',
                bankAccountId: '',
                currency: 'PESOS',
                paymentTermId: '',
                createMultipleFromTerm: false,
                paymentData: {
                    amount: '',
                    method: 'TRANSFER',
                    currency: 'PESOS',
                    collectionDate: new Date().toISOString().split('T')[0],
                    reference: '',
                    notes: '',
                    cashBoxId: '',
                    bankAccountId: ''
                },
                selectedCheckId: ''
            })
        }
    }, [payment, isOpen])

    // Recargar condiciones de pago cuando cambia el cliente
    useEffect(() => {
        if (isOpen && formData.clientId) {
            loadPaymentTerms(formData.clientId)
        } else if (isOpen) {
            loadPaymentTerms()
        }
    }, [formData.clientId, isOpen])

    // Generar cobranzas múltiples cuando se activa la opción
    useEffect(() => {
        if (formData.createMultipleFromTerm && formData.paymentTermId) {
            const selectedTerm = paymentTerms.find(t => t.id === formData.paymentTermId)
            if (selectedTerm) {
                // Obtener cuotas ya existentes para esta condición
                const existingInstallments = collections
                    .filter((c: any) => c.paymentTermId === formData.paymentTermId && c.installmentNumber)
                    .map((c: any) => c.installmentNumber)

                const generatedCollectionsList = []
                const startDate = new Date(selectedTerm.startDate)

                for (let i = 0; i < selectedTerm.periods; i++) {
                    const installmentNumber = i + 1
                    const dueDate = new Date(startDate)

                    // Calcular fecha según recurrencia
                    switch (selectedTerm.recurrence) {
                        case 'MENSUAL':
                            dueDate.setMonth(startDate.getMonth() + i)
                            break
                        case 'BIMESTRAL':
                            dueDate.setMonth(startDate.getMonth() + (i * 2))
                            break
                        case 'TRIMESTRAL':
                            dueDate.setMonth(startDate.getMonth() + (i * 3))
                            break
                        case 'CUATRIMESTRAL':
                            dueDate.setMonth(startDate.getMonth() + (i * 4))
                            break
                        case 'SEMESTRAL':
                            dueDate.setMonth(startDate.getMonth() + (i * 6))
                            break
                        case 'ANUAL':
                            dueDate.setFullYear(startDate.getFullYear() + i)
                            break
                    }

                    generatedCollectionsList.push({
                        index: i,
                        installmentNumber: installmentNumber,
                        dueDate: dueDate.toISOString().split('T')[0],
                        description: `${formData.description || selectedTerm.description} - Cuota ${installmentNumber}/${selectedTerm.periods}`,
                        amount: Number(selectedTerm.amount),
                        currency: selectedTerm.currency,
                        isExisting: existingInstallments.includes(installmentNumber)
                    })
                }

                setGeneratedCollections(generatedCollectionsList)
                // Seleccionar solo las cuotas que no existen aún
                const availableInstallments = generatedCollectionsList
                    .filter(c => !c.isExisting)
                    .map((_, i) => i)
                setSelectedCollections(new Set(availableInstallments))
            }
        } else {
            setGeneratedCollections([])
            setSelectedCollections(new Set())
        }
    }, [formData.createMultipleFromTerm, formData.paymentTermId, paymentTerms, formData.description, collections])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validar que se seleccione al menos una cuenta (caja o bancaria) si el status es PAID
        if (formData.status === 'PAID' && !formData.cashBoxId && !formData.bankAccountId) {
            alert('Para marcar una cobranza como pagada, debes seleccionar una caja o cuenta bancaria donde se depositó el pago.')
            return
        }

        // Validar que no se seleccionen ambas cuentas (aunque la UI ya lo previene)
        if (formData.cashBoxId && formData.bankAccountId) {
            alert('No puedes seleccionar tanto una caja como una cuenta bancaria. Elige solo una.')
            return
        }

        try {
            if (formData.createMultipleFromTerm && formData.paymentTermId) {
                // Crear múltiples cobranzas basadas en la condición de pago
                if (selectedCollections.size === 0) {
                    alert('Debes seleccionar al menos una cobranza para crear')
                    return
                }

                const collectionsToCreate = Array.from(selectedCollections).map(index => {
                    const collection = generatedCollections[index]
                    return {
                        ...formData,
                        dueDate: collection.dueDate,
                        description: collection.description,
                        amount: collection.amount.toString(),
                        currency: collection.currency,
                        paymentTermId: formData.paymentTermId,
                        installmentNumber: collection.installmentNumber,
                        createMultipleFromTerm: false // No incluir este campo en la creación
                    }
                })

                // Llamar a onSave con el array de cobranzas seleccionadas
                await onSave(collectionsToCreate)
            } else {
                // Crear una sola cobranza
                const { createMultipleFromTerm, ...singleCollectionData } = formData

                // Validar si ya existe una cobranza pendiente para esta condición de pago
                if (formData.paymentTermId) {
                    const existingPendingCollections = collections.filter((c: any) =>
                        c.paymentTermId === formData.paymentTermId &&
                        c.status !== 'PAID' &&
                        c.status !== 'CANCELLED'
                    )

                    if (existingPendingCollections.length > 0) {
                        const confirmCreate = confirm(
                            `Ya existen ${existingPendingCollections.length} cobranza(s) pendiente(s) para esta condición de pago. ` +
                            `¿Estás seguro de que quieres crear otra? Esto podría crear duplicados.`
                        )
                        if (!confirmCreate) {
                            return
                        }
                    }
                }

                // Si la cobranza pertenece a una condición de pago, calcular el siguiente installmentNumber
                let singleCollection = { ...singleCollectionData }
                if (formData.paymentTermId && collections.length > 0) {
                    const existingInstallments = collections
                        .filter((c: any) => c.paymentTermId === formData.paymentTermId && c.installmentNumber)
                        .map((c: any) => c.installmentNumber)
                        .sort((a: number, b: number) => a - b)

                    // Encontrar el siguiente número de cuota disponible
                    let nextInstallmentNumber = 1
                    for (let i = 1; i <= existingInstallments.length + 1; i++) {
                        if (!existingInstallments.includes(i)) {
                            nextInstallmentNumber = i
                            break
                        }
                    }

                    (singleCollection as any).installmentNumber = nextInstallmentNumber
                }

                await onSave(singleCollection)
            }

            onClose() // Cerrar el modal solo si la operación fue exitosa
        } catch (error) {
            console.error('Error saving collection:', error)
            // El modal permanece abierto en caso de error para que el usuario pueda corregir
            alert('Error al guardar la cobranza. Por favor, verifica los datos e intenta nuevamente.')
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        if (name === 'status') {
            if (value === 'PAID' && !formData.cashBoxId && !formData.bankAccountId) {
                alert('Para marcar una cobranza como pagada, debes seleccionar una caja o cuenta bancaria donde se depositó el cobro.')
                return
            }
            if (value === 'PAID' && !formData.paidDate) {
                // Si marca como pagada y no hay fecha de cobro, establecer fecha actual
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    paidDate: new Date().toISOString().split('T')[0]
                }))
                return
            }
            if (value === 'PENDING') {
                // Si marca como pendiente, limpiar fecha de cobro
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    paidDate: ''
                }))
                return
            }
        }

        if (name === 'paymentTermId') {
            // Si selecciona una condición de pago, cargar sus datos automáticamente
            if (value) {
                const selectedTerm = paymentTerms.find(term => term.id === value)
                if (selectedTerm) {
                    setFormData(prev => ({
                        ...prev,
                        [name]: value,
                        amount: selectedTerm.amount ? Number(selectedTerm.amount).toString() : prev.amount,
                        currency: selectedTerm.currency || prev.currency,
                        clientId: selectedTerm.clientId || prev.clientId,
                        projectId: selectedTerm.projectId || prev.projectId,
                        description: selectedTerm.description || prev.description,
                        dueDate: selectedTerm.startDate ? new Date(selectedTerm.startDate).toISOString().split('T')[0] : prev.dueDate
                    }))
                }
            } else {
                setFormData(prev => ({
                    ...prev,
                    [name]: value
                }))
            }
            return
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

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

    const formatAmount = (amount: number, currency?: string) => {
        const formattedAmount = amount?.toLocaleString('en-US') || '0'
        const currencyCode = currency || 'PESOS'
        const currencySymbol = currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : '$'
        return `${currencySymbol}${formattedAmount} ${currencyCode}`
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={payment ? 'Editar Cobranza' : 'Nueva Cobranza'}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Sección 1: Información Principal */}
                <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Información Principal</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cliente *
                            </label>
                            <select
                                name="clientId"
                                value={formData.clientId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                required
                            >
                                <option value="">Seleccionar cliente...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Proyecto
                            </label>
                            <select
                                name="projectId"
                                value={formData.projectId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="">Seleccionar proyecto...</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rubro
                            </label>
                            <select
                                name="rubroId"
                                value={formData.rubroId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="">Seleccionar rubro...</option>
                                {rubros.map(rubro => (
                                    <option key={rubro.id} value={rubro.id}>{rubro.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Sección 2: Monto y Método */}
                <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Monto y Método de Cobro</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monto *
                            </label>
                            <input
                                type="number"
                                name="amount"
                                step="0.01"
                                value={formData.amount}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Moneda *
                            </label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                required
                            >
                                <option value="PESOS">PESOS</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Método de Cobro *
                            </label>
                            <select
                                name="method"
                                value={formData.method}
                                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                required
                            >
                                <option value="TRANSFER">Transferencia</option>
                                <option value="CASH">Efectivo</option>
                                <option value="CHECK">Cheque</option>
                                <option value="CREDIT_CARD">Tarjeta Crédito</option>
                                <option value="DEBIT_CARD">Tarjeta Débito</option>
                                <option value="OTHER">Otro</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Sección 3: Condición de Pago */}
                <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Condición de Pago</h3>
                        <span className="text-sm text-gray-500">(Opcional)</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Condición de Pago
                            </label>
                            <select
                                name="paymentTermId"
                                value={formData.paymentTermId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                            >
                                <option value="">
                                    {formData.clientId ? 'Seleccionar condición de pago...' : 'Primero selecciona un cliente'}
                                </option>
                                {paymentTerms.map(term => (
                                    <option key={term.id} value={term.id}>
                                        {term.description || `${term.recurrence?.toLowerCase()} x${term.periods} - ${formatAmount(Number(term.amount), term.currency)}`}
                                    </option>
                                ))}
                            </select>
                            {!formData.clientId && (
                                <p className="text-xs text-gray-500 mt-1">Selecciona un cliente para ver sus condiciones de pago</p>
                            )}
                        </div>

                        {formData.paymentTermId && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-purple-900 mb-2">
                                            {paymentTerms.find(t => t.id === formData.paymentTermId)?.description || `${paymentTerms.find(t => t.id === formData.paymentTermId)?.recurrence?.toLowerCase()} x${paymentTerms.find(t => t.id === formData.paymentTermId)?.periods}`}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm text-purple-700">
                                            <div>
                                                <span className="font-medium">Monto total:</span>
                                                <p>{formatAmount(Number(paymentTerms.find(t => t.id === formData.paymentTermId)?.amount), paymentTerms.find(t => t.id === formData.paymentTermId)?.currency)}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium">Períodos:</span>
                                                <p>{paymentTerms.find(t => t.id === formData.paymentTermId)?.periods} {paymentTerms.find(t => t.id === formData.paymentTermId)?.recurrence?.toLowerCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <label className="flex items-center space-x-2 ml-4">
                                        <input
                                            type="checkbox"
                                            checked={formData.createMultipleFromTerm}
                                            onChange={(e) => setFormData(prev => ({ ...prev, createMultipleFromTerm: e.target.checked }))}
                                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm font-medium text-purple-700">Crear múltiples cobranzas</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {formData.createMultipleFromTerm && generatedCollections.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-semibold text-green-800">
                                        Cobranzas a crear ({selectedCollections.size} seleccionadas)
                                    </h4>
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCollections(new Set(generatedCollections.map((_, i) => i)))}
                                            className="text-xs text-green-600 hover:text-green-800 underline"
                                        >
                                            Seleccionar todas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCollections(new Set())}
                                            className="text-xs text-red-600 hover:text-red-800 underline"
                                        >
                                            Deseleccionar todas
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {generatedCollections.map((collection, index) => (
                                        <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border ${collection.isExisting ? 'bg-gray-50 border-gray-200' : 'bg-white border-green-100'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedCollections.has(index)}
                                                disabled={collection.isExisting}
                                                onChange={(e) => {
                                                    if (collection.isExisting) return
                                                    const newSelected = new Set(selectedCollections)
                                                    if (e.target.checked) {
                                                        newSelected.add(index)
                                                    } else {
                                                        newSelected.delete(index)
                                                    }
                                                    setSelectedCollections(newSelected)
                                                }}
                                                className={`h-4 w-4 focus:ring-green-500 border-gray-300 rounded ${collection.isExisting ? 'cursor-not-allowed opacity-50' : 'text-green-600'}`}
                                            />
                                            <div className="flex-1 text-sm">
                                                <div className={`font-medium ${collection.isExisting ? 'text-gray-500' : 'text-gray-900'}`}>
                                                    Cuota {collection.installmentNumber}: {formatAmount(collection.amount, collection.currency)}
                                                    {collection.isExisting && <span className="ml-2 text-xs text-gray-400">(Ya existe)</span>}
                                                </div>
                                                <div className={`text-gray-600 ${collection.isExisting ? 'text-gray-400' : ''}`}>
                                                    Vence: {new Date(collection.dueDate).toLocaleDateString('es-ES')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sección 4: Destino del Cobro */}
                <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Destino del Cobro</h3>
                        <span className="text-sm text-gray-500">(Solo si está pagado)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Caja
                            </label>
                            <select
                                name="cashBoxId"
                                value={formData.cashBoxId}
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (value) {
                                        const selectedCashBox = cashBoxes.find(cb => cb.id === value)
                                        setFormData(prev => ({
                                            ...prev,
                                            cashBoxId: value,
                                            bankAccountId: '',
                                            currency: selectedCashBox && !prev.currency ? selectedCashBox.currency : prev.currency,
                                            status: 'PAID',
                                            paidDate: prev.paidDate || new Date().toISOString().split('T')[0]
                                        }))
                                    } else {
                                        setFormData(prev => ({
                                            ...prev,
                                            cashBoxId: '',
                                            status: !prev.bankAccountId ? 'PENDING' : prev.status,
                                            paidDate: !prev.bankAccountId ? '' : prev.paidDate
                                        }))
                                    }
                                }}
                                disabled={!!formData.bankAccountId}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${formData.bankAccountId ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
                            >
                                <option value="">Seleccionar caja...</option>
                                {cashBoxes.map(cashBox => (
                                    <option key={cashBox.id} value={cashBox.id}>
                                        {cashBox.name} ({cashBox.currency}) - Balance: ${cashBox.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                                    </option>
                                ))}
                            </select>
                            {formData.bankAccountId && (
                                <p className="text-xs text-gray-500 mt-1">Deselecciona la cuenta bancaria para habilitar la caja</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cuenta Bancaria
                            </label>
                            <select
                                name="bankAccountId"
                                value={formData.bankAccountId}
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (value) {
                                        const selectedAccount = bankAccounts.find(acc => acc.id === value)
                                        setFormData(prev => ({
                                            ...prev,
                                            bankAccountId: value,
                                            cashBoxId: '',
                                            currency: selectedAccount && !prev.currency ? selectedAccount.currency : prev.currency,
                                            status: 'PAID',
                                            paidDate: prev.paidDate || new Date().toISOString().split('T')[0]
                                        }))
                                    } else {
                                        setFormData(prev => ({
                                            ...prev,
                                            bankAccountId: '',
                                            status: !prev.cashBoxId ? 'PENDING' : prev.status,
                                            paidDate: !prev.cashBoxId ? '' : prev.paidDate
                                        }))
                                    }
                                }}
                                disabled={!!formData.cashBoxId}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${formData.cashBoxId ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
                            >
                                <option value="">Seleccionar cuenta bancaria...</option>
                                {bankAccounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} - {account.bankName} ({account.currency}) - Balance: ${account.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                                    </option>
                                ))}
                            </select>
                            {formData.cashBoxId && (
                                <p className="text-xs text-gray-500 mt-1">Deselecciona la caja para habilitar la cuenta bancaria</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sección 5: Fechas y Referencias */}
                <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Fechas y Referencias</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha Vencimiento *
                            </label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha Cobro
                            </label>
                            <input
                                type="date"
                                name="paidDate"
                                value={formData.paidDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Referencia
                            </label>
                            <input
                                type="text"
                                name="reference"
                                value={formData.reference}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                placeholder="Número de transferencia, etc."
                            />
                        </div>
                    </div>
                </div>

                {/* Sección 6: Información Adicional */}
                <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Información Adicional</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción
                            </label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                                placeholder="Descripción del cobro..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notas
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                                placeholder="Notas adicionales..."
                            />
                        </div>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        {payment ? 'Actualizar Cobranza' : 'Crear Cobranza'}
                    </button>
                </div>

                {/* Modal para selección de cheques */}
                <CheckSelectorModal
                    isOpen={showCheckSelector}
                    onClose={() => setShowCheckSelector(false)}
                    onSelect={handleCheckSelect}
                    context="collection"
                    currency={formData.currency}
                    amount={parseFloat(formData.amount) || undefined}
                />
            </form>
        </Modal>
    )
}