'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowLeftIcon, PencilIcon, TrashIcon, CreditCardIcon, BanknotesIcon } from '@heroicons/react/24/outline'

interface Check {
    id: string
    checkNumber: string
    amount: number
    currency: string
    issuerName: string
    issuerBank: string
    issueDate: string
    dueDate: string
    status: string
    description?: string
    cashBox?: { name: string }
    bankAccount?: { name: string }
    receivedFrom?: string
    issuedTo?: string
    transactions: any[]
}

export default function CheckDetailPage() {
    const { data: session } = useSession()
    const params = useParams()
    const router = useRouter()
    const [check, setCheck] = useState<Check | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchCheck()
    }, [params.id])

    const fetchCheck = async () => {
        try {
            const response = await fetch(`/api/checks/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setCheck(data)
            } else {
                router.push('/checks')
            }
        } catch (error) {
            console.error('Error fetching check:', error)
            router.push('/checks')
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (newStatus: string) => {
        setUpdating(true)
        try {
            const response = await fetch(`/api/checks/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                await fetchCheck() // Recargar datos
            } else {
                const error = await response.json()
                alert(error.error || 'Error al actualizar')
            }
        } catch (error) {
            console.error('Error updating check:', error)
            alert('Error al actualizar cheque')
        } finally {
            setUpdating(false)
        }
    }

    const clearCheck = async () => {
        setUpdating(true)
        try {
            const response = await fetch(`/api/checks/${params.id}/clear`, {
                method: 'POST'
            })

            if (response.ok) {
                await fetchCheck()
            } else {
                const error = await response.json()
                alert(error.error || 'Error al cobrar cheque')
            }
        } catch (error) {
            console.error('Error clearing check:', error)
            alert('Error al cobrar cheque')
        } finally {
            setUpdating(false)
        }
    }

    const debitCheck = async () => {
        if (!confirm('¿Estás seguro de que quieres debitar este cheque? Esta acción registrará un egreso en la cuenta asociada.')) {
            return
        }

        setUpdating(true)
        try {
            const response = await fetch(`/api/checks/${params.id}/debit`, {
                method: 'POST'
            })

            if (response.ok) {
                await fetchCheck()
                alert('Cheque debitado exitosamente')
            } else {
                const error = await response.json()
                alert(error.error || 'Error al debitar cheque')
            }
        } catch (error) {
            console.error('Error debiting check:', error)
            alert('Error al debitar cheque')
        } finally {
            setUpdating(false)
        }
    }

    const depositCheck = async () => {
        if (!confirm('¿Estás seguro de que quieres depositar este cheque? Esta acción registrará un ingreso en la cuenta asociada.')) {
            return
        }

        setUpdating(true)
        try {
            const response = await fetch(`/api/checks/${params.id}/deposit`, {
                method: 'POST'
            })

            if (response.ok) {
                await fetchCheck()
                alert('Cheque depositado exitosamente')
            } else {
                const error = await response.json()
                alert(error.error || 'Error al depositar cheque')
            }
        } catch (error) {
            console.error('Error depositing check:', error)
            alert('Error al depositar cheque')
        } finally {
            setUpdating(false)
        }
    }

    const deleteCheck = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar este cheque? Esta acción no se puede deshacer.')) {
            return
        }

        setUpdating(true)
        try {
            const response = await fetch(`/api/checks/${params.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                router.push('/checks')
            } else {
                const error = await response.json()
                alert(error.error || 'Error al eliminar cheque')
            }
        } catch (error) {
            console.error('Error deleting check:', error)
            alert('Error al eliminar cheque')
        } finally {
            setUpdating(false)
        }
    }

    if (loading) {
        return (
            <Layout title="Detalle de Cheque" subtitle="Cargando información del cheque">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Cargando...</span>
                </div>
            </Layout>
        )
    }

    if (!check) {
        return (
            <Layout title="Detalle de Cheque" subtitle="Cheque no encontrado">
                <div className="text-center py-12">
                    <XCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Cheque no encontrado</h3>
                    <p className="mt-1 text-sm text-gray-500">El cheque que buscas no existe o ha sido eliminado.</p>
                    <div className="mt-6">
                        <button
                            onClick={() => router.push('/checks')}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            Volver a Cheques
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    const getStatusText = (status: string) => {
        const texts = {
            ISSUED: 'Emitido',
            PENDING: 'Pendiente',
            CLEARED: 'Cobrado',
            REJECTED: 'Rechazado',
            CANCELLED: 'Cancelado'
        }
        return texts[status as keyof typeof texts] || status
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'CLEARED':
                return <CheckCircleIcon className="h-6 w-6 text-green-500" />
            case 'REJECTED':
                return <XCircleIcon className="h-6 w-6 text-red-500" />
            case 'PENDING':
                return <ClockIcon className="h-6 w-6 text-yellow-500" />
            default:
                return <ClockIcon className="h-6 w-6 text-gray-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        const colors = {
            ISSUED: 'bg-blue-100 text-blue-800',
            PENDING: 'bg-yellow-100 text-yellow-800',
            CLEARED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            CANCELLED: 'bg-gray-100 text-gray-800'
        }
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    }

    return (
        <Layout title={`Cheque #${check.checkNumber}`} subtitle="Detalle completo del cheque">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header con acciones */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Volver a Cheques
                    </button>

                    <div className="flex items-center space-x-3">
                        {check.status !== 'CANCELLED' && check.status !== 'CLEARED' && check.status !== 'REJECTED' && (
                            <button
                                onClick={deleteCheck}
                                disabled={updating}
                                className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                            >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>

                {/* Información principal del cheque */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Cheque #{check.checkNumber}
                                </h3>
                                {check.description && (
                                    <p className="mt-1 text-sm text-gray-600">{check.description}</p>
                                )}
                            </div>
                            <div className="flex items-center">
                                {getStatusIcon(check.status)}
                                <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(check.status)}`}>
                                    {getStatusText(check.status)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-6">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 mb-1">Monto</dt>
                                <dd className="text-2xl font-bold text-gray-900">
                                    {check.currency} {check.amount.toLocaleString('es-ES')}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 mb-1">Fecha de Emisión</dt>
                                <dd className="text-lg font-semibold text-gray-900">
                                    {new Date(check.issueDate).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 mb-1">Fecha de Vencimiento</dt>
                                <dd className="text-lg font-semibold text-gray-900">
                                    {new Date(check.dueDate).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 mb-1">Emisor</dt>
                                <dd className="text-base text-gray-900">{check.issuerName}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 mb-1">Banco Emisor</dt>
                                <dd className="text-base text-gray-900">{check.issuerBank}</dd>
                            </div>
                            {check.issuedTo && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 mb-1">Receptor</dt>
                                    <dd className="text-base text-gray-900">{check.issuedTo}</dd>
                                </div>
                            )}
                            {check.receivedFrom && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 mb-1">Recibido de</dt>
                                    <dd className="text-base text-gray-900">{check.receivedFrom}</dd>
                                </div>
                            )}
                            {(check.cashBox || check.bankAccount) && (
                                <div className="md:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500 mb-1">Cuenta Asociada</dt>
                                    <dd className="text-base text-gray-900">
                                        {check.cashBox?.name || check.bankAccount?.name}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Acciones disponibles */}
                {(check.status === 'PENDING' || check.status === 'ISSUED') && (
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h4 className="text-lg font-medium text-gray-900">Acciones Disponibles</h4>
                            <p className="mt-1 text-sm text-gray-600">
                                Selecciona la acción que deseas realizar con este cheque
                            </p>
                        </div>

                        <div className="px-6 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {check.status === 'PENDING' && (
                                    <button
                                        onClick={clearCheck}
                                        disabled={updating}
                                        className="flex flex-col items-center p-6 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircleIcon className="h-8 w-8 text-green-600 mb-3" />
                                        <span className="text-sm font-medium text-gray-900">Marcar como Cobrado</span>
                                        <span className="text-xs text-gray-500 mt-1">Confirma que el cheque fue depositado/cobrado</span>
                                    </button>
                                )}

                                {check.status === 'PENDING' && (
                                    <button
                                        onClick={() => updateStatus('REJECTED')}
                                        disabled={updating}
                                        className="flex flex-col items-center p-6 border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <XCircleIcon className="h-8 w-8 text-red-600 mb-3" />
                                        <span className="text-sm font-medium text-gray-900">Marcar como Rechazado</span>
                                        <span className="text-xs text-gray-500 mt-1">El cheque fue rechazado por el banco</span>
                                    </button>
                                )}

                                {(check.status === 'PENDING' || check.status === 'ISSUED') && (
                                    <button
                                        onClick={() => updateStatus('CANCELLED')}
                                        disabled={updating}
                                        className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ClockIcon className="h-8 w-8 text-gray-600 mb-3" />
                                        <span className="text-sm font-medium text-gray-900">Cancelar Cheque</span>
                                        <span className="text-xs text-gray-500 mt-1">Anular o cancelar el cheque</span>
                                    </button>
                                )}
                            </div>

                            {updating && (
                                <div className="mt-4 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <span className="ml-2 text-sm text-gray-600">Procesando...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Historial de transacciones (si existen) */}
                {check.transactions && check.transactions.length > 0 && (
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h4 className="text-lg font-medium text-gray-900">Historial de Transacciones</h4>
                            <p className="mt-1 text-sm text-gray-600">
                                Movimientos contables relacionados con este cheque
                            </p>
                        </div>

                        <div className="px-6 py-6">
                            <div className="space-y-4">
                                {check.transactions.map((transaction: any) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(transaction.date).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {transaction.currency} {transaction.amount.toLocaleString('es-ES')}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize">{transaction.type.toLowerCase()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}