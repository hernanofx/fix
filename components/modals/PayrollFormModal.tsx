'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Modal from './Modal'

interface PayrollFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (payrollData: any) => void
    payroll?: any
}

// employees will be loaded from the API filtered by the current user's organization
// Example shape: { id: string, name: string, position?: string, baseSalary?: number }


export default function PayrollFormModal({ isOpen, onClose, onSave, payroll }: PayrollFormModalProps) {
    const [formData, setFormData] = useState({
        employeeId: payroll?.employeeId || '',
        period: payroll?.period || '',
        baseSalary: payroll?.baseSalary || '',
        overtimeHours: payroll?.overtimeHours || '',
        overtimeRate: payroll?.overtimeRate || '1.5',
        bonuses: payroll?.bonuses || '',
        deductions: payroll?.deductions || '',
        deductionsDetail: payroll?.deductionsDetail || '',
        currency: payroll?.currency || 'PESOS',
        paymentMethod: 'cashBox', // 'cashBox' or 'bankAccount'
        cashBoxId: payroll?.cashBoxId || '',
        bankAccountId: payroll?.bankAccountId || ''
    })

    const [calculatedTotals, setCalculatedTotals] = useState({
        overtimePay: 0,
        totalEarnings: 0,
        totalDeductions: 0,
        netPay: 0
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const { data: session } = useSession()
    const [employees, setEmployees] = useState<any[]>([])
    const [loadingEmployees, setLoadingEmployees] = useState(false)
    const [employeesError, setEmployeesError] = useState<string | null>(null)

    const [cashBoxes, setCashBoxes] = useState<any[]>([])
    const [bankAccounts, setBankAccounts] = useState<any[]>([])
    const [loadingCashBoxes, setLoadingCashBoxes] = useState(false)
    const [loadingBankAccounts, setLoadingBankAccounts] = useState(false)

    // Update form data when payroll prop changes
    useEffect(() => {
        if (payroll) {
            setFormData({
                employeeId: payroll.employeeId || '',
                period: payroll.period || '',
                baseSalary: payroll.baseSalary ? String(payroll.baseSalary) : '',
                overtimeHours: payroll.overtimeHours ? String(payroll.overtimeHours) : '',
                overtimeRate: payroll.overtimeRate ? String(payroll.overtimeRate) : '1.5',
                bonuses: payroll.bonuses ? String(payroll.bonuses) : '',
                deductions: payroll.deductions ? String(payroll.deductions) : '',
                deductionsDetail: payroll.deductionsDetail || '',
                currency: payroll.currency || 'PESOS',
                paymentMethod: payroll.cashBoxId ? 'cashBox' : payroll.bankAccountId ? 'bankAccount' : 'cashBox',
                cashBoxId: payroll.cashBoxId || '',
                bankAccountId: payroll.bankAccountId || ''
            })
        } else {
            // Reset form for new payroll
            setFormData({
                employeeId: '',
                period: '',
                baseSalary: '',
                overtimeHours: '',
                overtimeRate: '1.5',
                bonuses: '',
                deductions: '',
                deductionsDetail: '',
                currency: 'PESOS',
                paymentMethod: 'cashBox',
                cashBoxId: '',
                bankAccountId: ''
            })
        }
    }, [payroll])

    useEffect(() => {
        if (!isOpen) return
        const orgId = (session as any)?.user?.organizationId
        if (!orgId) return
        let mounted = true
            ; (async () => {
                setLoadingEmployees(true)
                try {
                    const res = await fetch(`/api/employees?organizationId=${orgId}`)
                    if (!res.ok) throw new Error('No se pudieron cargar los empleados')
                    const data = await res.json()
                    if (mounted) setEmployees(Array.isArray(data) ? data : [])
                } catch (err: any) {
                    console.error('Error loading employees for payroll modal:', err)
                    if (mounted) setEmployeesError(err?.message || 'Error')
                } finally {
                    if (mounted) setLoadingEmployees(false)
                }
            })()
        return () => { mounted = false }
    }, [isOpen, session])

    // Load cash boxes and bank accounts
    useEffect(() => {
        if (!isOpen) return
        const orgId = (session as any)?.user?.organizationId
        if (!orgId) return
        let mounted = true

            // Load cash boxes
            ; (async () => {
                setLoadingCashBoxes(true)
                try {
                    const res = await fetch(`/api/cash-boxes?organizationId=${orgId}`)
                    if (res.ok) {
                        const data = await res.json()
                        if (mounted) setCashBoxes(Array.isArray(data) ? data : [])
                    }
                } catch (err: any) {
                    console.error('Error loading cash boxes:', err)
                } finally {
                    if (mounted) setLoadingCashBoxes(false)
                }
            })()

            // Load bank accounts
            ; (async () => {
                setLoadingBankAccounts(true)
                try {
                    const res = await fetch(`/api/bank-accounts?organizationId=${orgId}`)
                    if (res.ok) {
                        const data = await res.json()
                        if (mounted) setBankAccounts(Array.isArray(data) ? data : [])
                    }
                } catch (err: any) {
                    console.error('Error loading bank accounts:', err)
                } finally {
                    if (mounted) setLoadingBankAccounts(false)
                }
            })()

        return () => { mounted = false }
    }, [isOpen, session])

    // Calculate totals whenever form data changes
    useEffect(() => {
        const baseSalary = parseFloat(formData.baseSalary) || 0
        const overtimeHours = parseFloat(formData.overtimeHours) || 0
        const overtimeRate = parseFloat(formData.overtimeRate) || 1.5
        const bonuses = parseFloat(formData.bonuses) || 0
        const deductions = parseFloat(formData.deductions) || 0

        const overtimePay = (baseSalary / 40) * overtimeHours * overtimeRate
        const totalEarnings = baseSalary + overtimePay + bonuses
        const totalDeductions = deductions
        const netPay = totalEarnings - totalDeductions

        setCalculatedTotals({
            overtimePay,
            totalEarnings,
            totalDeductions,
            netPay
        })
    }, [formData])

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.employeeId) newErrors.employeeId = 'Empleado es requerido'
        if (!formData.period) newErrors.period = 'Período es requerido'
        if (!formData.baseSalary) newErrors.baseSalary = 'Salario base es requerido'

        // Validate payment method
        if (formData.paymentMethod === 'cashBox' && !formData.cashBoxId) {
            newErrors.cashBoxId = 'Caja es requerida'
        }
        if (formData.paymentMethod === 'bankAccount' && !formData.bankAccountId) {
            newErrors.bankAccountId = 'Cuenta bancaria es requerida'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            const selectedEmployee = employees.find((emp: any) => String(emp?.id) === String(formData.employeeId))

            // Ensure all numeric values are properly converted
            const payrollData = {
                employeeId: formData.employeeId,
                period: formData.period,
                baseSalary: parseFloat(formData.baseSalary) || 0,
                overtimeHours: parseFloat(formData.overtimeHours) || 0,
                overtimeRate: parseFloat(formData.overtimeRate) || 1.5,
                bonuses: parseFloat(formData.bonuses) || 0,
                deductions: parseFloat(formData.deductions) || 0,
                deductionsDetail: formData.deductionsDetail,
                currency: formData.currency,
                paymentMethod: formData.paymentMethod,
                cashBoxId: formData.paymentMethod === 'cashBox' ? formData.cashBoxId : null,
                bankAccountId: formData.paymentMethod === 'bankAccount' ? formData.bankAccountId : null,
                // Calculated values
                overtimePay: calculatedTotals.overtimePay,
                netPay: calculatedTotals.netPay,
                // Employee info
                employeeName: selectedEmployee?.name || selectedEmployee?.firstName + ' ' + selectedEmployee?.lastName || '',
                employeePosition: selectedEmployee?.position || '',
                // Metadata
                id: payroll?.id || Date.now(),
                createdAt: new Date().toISOString()
            }
            onSave(payrollData)
            onClose()
            // Reset form
            setFormData({
                employeeId: '',
                period: '',
                baseSalary: '',
                overtimeHours: '',
                overtimeRate: '1.5',
                bonuses: '',
                deductions: '',
                deductionsDetail: '',
                currency: 'PESOS',
                paymentMethod: 'cashBox',
                cashBoxId: '',
                bankAccountId: ''
            })
        }
    }

    const handleEmployeeChange = (employeeId: string) => {
        const selectedEmployee = employees.find((emp: any) => String(emp?.id) === String(employeeId))
        const baseSalaryValue = selectedEmployee && selectedEmployee.baseSalary != null ? String(selectedEmployee.baseSalary) : ''
        setFormData(prev => ({
            ...prev,
            employeeId: String(employeeId),
            baseSalary: baseSalaryValue
        }))
        if (errors.employeeId) {
            setErrors(prev => ({ ...prev, employeeId: '' }))
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={payroll ? 'Editar Nómina' : 'Nueva Nómina'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employee Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Empleado *
                        </label>
                        <select
                            value={formData.employeeId}
                            onChange={(e) => handleEmployeeChange(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.employeeId ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Seleccionar empleado...</option>
                            {loadingEmployees && <option disabled>Cargando empleados...</option>}
                            {!loadingEmployees && employees.length === 0 && <option disabled>No hay empleados</option>}
                            {employees.map((employee: any) => (
                                <option key={employee.id} value={String(employee.id)}>
                                    {employee.name} {employee.position ? `- ${employee.position}` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.employeeId && (
                            <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
                        )}
                    </div>

                    {/* Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Período *
                        </label>
                        <input
                            type="month"
                            value={formData.period}
                            onChange={(e) => handleInputChange('period', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.period ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.period && (
                            <p className="mt-1 text-sm text-red-600">{errors.period}</p>
                        )}
                    </div>

                    {/* Base Salary */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Salario Base ($) *
                        </label>
                        <input
                            type="number"
                            value={formData.baseSalary}
                            onChange={(e) => handleInputChange('baseSalary', e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.baseSalary ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.baseSalary && (
                            <p className="mt-1 text-sm text-red-600">{errors.baseSalary}</p>
                        )}
                    </div>

                    {/* Overtime Hours */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Horas Extra
                        </label>
                        <input
                            type="number"
                            value={formData.overtimeHours}
                            onChange={(e) => handleInputChange('overtimeHours', e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Overtime Rate */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tasa Horas Extra
                        </label>
                        <select
                            value={formData.overtimeRate}
                            onChange={(e) => handleInputChange('overtimeRate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="1.5">1.5x (Normal)</option>
                            <option value="2">2x (Festivos)</option>
                            <option value="2.5">2.5x (Festivos + Nocturnas)</option>
                        </select>
                    </div>

                    {/* Bonuses */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bonos ($)
                        </label>
                        <input
                            type="number"
                            value={formData.bonuses}
                            onChange={(e) => handleInputChange('bonuses', e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Deductions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deducciones ($)
                        </label>
                        <input
                            type="number"
                            value={formData.deductions}
                            onChange={(e) => handleInputChange('deductions', e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Deductions Detail */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Detalle de Deducciones
                        </label>
                        <textarea
                            value={formData.deductionsDetail}
                            onChange={(e) => handleInputChange('deductionsDetail', e.target.value)}
                            placeholder="Ej: Seguro médico, IRPF, etc."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Moneda *
                        </label>
                        <select
                            value={formData.currency}
                            onChange={(e) => handleInputChange('currency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="PESOS">Pesos</option>
                            <option value="USD">Dólar</option>
                            <option value="EUR">Euro</option>
                        </select>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Método de Pago *
                        </label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="cashBox">Caja</option>
                            <option value="bankAccount">Cuenta Bancaria</option>
                        </select>
                    </div>

                    {/* Cash Box Selection */}
                    {formData.paymentMethod === 'cashBox' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Caja *
                            </label>
                            <select
                                value={formData.cashBoxId}
                                onChange={(e) => handleInputChange('cashBoxId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Seleccionar caja...</option>
                                {loadingCashBoxes && <option disabled>Cargando cajas...</option>}
                                {!loadingCashBoxes && cashBoxes.length === 0 && <option disabled>No hay cajas disponibles</option>}
                                {cashBoxes.map((cashBox: any) => (
                                    <option key={cashBox.id} value={cashBox.id}>
                                        {cashBox.name} - {cashBox.currency} (${cashBox.balance?.toFixed(2) || '0.00'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Bank Account Selection */}
                    {formData.paymentMethod === 'bankAccount' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cuenta Bancaria *
                            </label>
                            <select
                                value={formData.bankAccountId}
                                onChange={(e) => handleInputChange('bankAccountId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Seleccionar cuenta...</option>
                                {loadingBankAccounts && <option disabled>Cargando cuentas...</option>}
                                {!loadingBankAccounts && bankAccounts.length === 0 && <option disabled>No hay cuentas disponibles</option>}
                                {bankAccounts.map((account: any) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} - {account.bankName} ({account.currency}) - ${account.balance?.toFixed(2) || '0.00'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Calculations Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Nómina</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Salario Base:</span>
                                    <span className="text-sm font-medium">${(parseFloat(formData.baseSalary) || 0).toFixed(2)}</span>
                                </div>
                                {calculatedTotals.overtimePay > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Horas Extra:</span>
                                        <span className="text-sm font-medium">${calculatedTotals.overtimePay.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Bonos:</span>
                                    <span className="text-sm font-medium">${(parseFloat(formData.bonuses) || 0).toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-2">
                                    <div className="flex justify-between font-semibold">
                                        <span className="text-sm">Total Devengado:</span>
                                        <span className="text-sm">${calculatedTotals.totalEarnings.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Deducciones:</span>
                                    <span className="text-sm font-medium text-red-600">-${calculatedTotals.totalDeductions.toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Salario Neto:</span>
                                        <span className={calculatedTotals.netPay >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            ${calculatedTotals.netPay.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {payroll ? 'Actualizar Nómina' : 'Generar Nómina'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
