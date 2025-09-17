"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import AdminLayout from '../../../components/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Calculator,
    Building2,
    CheckCircle,
    XCircle,
    Play,
    Database,
    AlertCircle,
    Power,
    PowerOff,
    AlertTriangle,
    BookOpen
} from 'lucide-react'

interface Organization {
    id: string
    name: string
    enableAccounting: boolean
    _count: {
        accounts: number
        journalEntries: number
    }
}

export default function AccountingSystemPage() {
    const { data: session } = useSession()
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [setupLoading, setSetupLoading] = useState<string | null>(null)
    const [toggleLoading, setToggleLoading] = useState<string | null>(null)
    const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const fetchOrganizations = async () => {
        try {
            const response = await fetch('/api/admin/organizations?includeAccountingStats=true')
            if (response.ok) {
                const data = await response.json()
                setOrganizations(data.organizations || [])
            }
        } catch (error) {
            console.error('Error fetching organizations:', error)
        } finally {
            setLoading(false)
        }
    }

    const setupAccountingForOrg = async (orgId: string) => {
        setSetupLoading(orgId)
        try {
            const response = await fetch('/api/accounting/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId })
            })

            if (response.ok) {
                // Refrescar la lista
                await fetchOrganizations()
            } else {
                console.error('Error setting up accounting')
            }
        } catch (error) {
            console.error('Error setting up accounting:', error)
        } finally {
            setSetupLoading(null)
        }
    }

    const toggleAccountingForOrg = async (orgId: string, enable: boolean) => {
        setToggleLoading(orgId)
        setShowConfirmDialog(null)

        try {
            const response = await fetch(`/api/admin/organizations/${orgId}/accounting`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enableAccounting: enable })
            })

            if (response.ok) {
                const data = await response.json()
                setMessage({
                    type: 'success',
                    text: data.message
                })
                // Refrescar la lista
                await fetchOrganizations()
            } else {
                const error = await response.json()
                setMessage({
                    type: 'error',
                    text: error.error || 'Error updating accounting status'
                })
            }
        } catch (error) {
            console.error('Error toggling accounting:', error)
            setMessage({
                type: 'error',
                text: 'Error updating accounting status'
            })
        } finally {
            setToggleLoading(null)
        }
    }

    const handleToggleClick = (orgId: string, currentState: boolean) => {
        if (currentState) {
            // Si está habilitado y quiere deshabilitar, mostrar confirmación
            setShowConfirmDialog(orgId)
        } else {
            // Si está deshabilitado y quiere habilitar, proceder directamente
            toggleAccountingForOrg(orgId, true)
        }
    }

    const confirmDisable = (orgId: string) => {
        toggleAccountingForOrg(orgId, false)
    }

    useEffect(() => {
        fetchOrganizations()
    }, [])

    if (loading) {
        return (
            <AdminLayout
                title="Sistema de Contabilidad"
                subtitle="Cargando organizaciones..."
            >
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </AdminLayout>
        )
    }

    const accountingOrgs = organizations.filter(org => org.enableAccounting)
    const nonAccountingOrgs = organizations.filter(org => !org.enableAccounting)

    return (
        <AdminLayout
            title="Sistema de Contabilidad"
            subtitle="Gestión del módulo de contabilidad por organización"
        >
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Organizaciones</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{organizations.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Con Contabilidad</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{accountingOrgs.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sin Contabilidad</CardTitle>
                        <XCircle className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-500">{nonAccountingOrgs.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Asientos</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {accountingOrgs.reduce((sum, org) => sum + org._count.journalEntries, 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Organizations with Accounting */}
            {accountingOrgs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Organizaciones con Contabilidad Habilitada
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {accountingOrgs.map((org) => (
                                <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <h3 className="font-medium">{org.name}</h3>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    <Database className="h-3 w-3 mr-1" />
                                                    {org._count.accounts} cuentas
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    <BookOpen className="h-3 w-3 mr-1" />
                                                    {org._count.journalEntries} asientos
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-green-100 text-green-800">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Habilitada
                                        </Badge>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleToggleClick(org.id, true)}
                                            disabled={toggleLoading === org.id}
                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                        >
                                            {toggleLoading === org.id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                                                    Deshabilitando...
                                                </>
                                            ) : (
                                                <>
                                                    <PowerOff className="h-3 w-3 mr-1" />
                                                    Deshabilitar
                                                </>
                                            )}
                                        </Button>
                                        {org._count.accounts === 0 && (
                                            <Button
                                                size="sm"
                                                onClick={() => setupAccountingForOrg(org.id)}
                                                disabled={setupLoading === org.id}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                {setupLoading === org.id ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                        Configurando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="h-3 w-3 mr-1" />
                                                        Configurar Plan
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Organizations without Accounting */}
            {nonAccountingOrgs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-gray-500" />
                            Organizaciones sin Contabilidad
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {nonAccountingOrgs.map((org) => (
                                <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="h-5 w-5 text-gray-500" />
                                        <div>
                                            <h3 className="font-medium text-gray-700">{org.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                Para habilitar contabilidad, edita la organización en el panel de administración
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-gray-600">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Deshabilitada
                                        </Badge>
                                        <Button
                                            size="sm"
                                            onClick={() => handleToggleClick(org.id, false)}
                                            disabled={toggleLoading === org.id}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {toggleLoading === org.id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                    Habilitando...
                                                </>
                                            ) : (
                                                <>
                                                    <Power className="h-3 w-3 mr-1" />
                                                    Habilitar
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Help Information */}
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <AlertCircle className="h-5 w-5" />
                        Información del Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800">
                    <div className="space-y-2 text-sm">
                        <p>• <strong>Asientos Automáticos:</strong> Se generan automáticamente para facturas, pagos y transacciones de tesorería</p>
                        <p>• <strong>Plan de Cuentas:</strong> Se configura automáticamente con cuentas estándar para la industria de la construcción</p>
                        <p>• <strong>Habilitación/Deshabilitación:</strong> Usa los botones de esta página para controlar el módulo de contabilidad por organización</p>
                        <p>• <strong>Limpieza de Datos:</strong> Al deshabilitar se eliminan todos los datos contables para mantener consistencia</p>
                        <p>• <strong>Navegación:</strong> Una vez habilitado, aparecerá el menú "Contabilidad" en la navegación de esa organización</p>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    )
}