'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { BookOpen, Plus, Search, Filter, ChevronRight, ChevronDown, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface Account {
    id: string
    code: string
    name: string
    type: string
    subType?: string
    isActive: boolean
    parentId?: string
    parent?: { code: string; name: string }
    children?: Account[]
    _count?: {
        debitEntries: number
        creditEntries: number
    }
}

export default function ChartOfAccounts() {
    const { data: session } = useSession()
    const router = useRouter()
    const [accounts, setAccounts] = useState<Account[]>([])
    const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
    const [treeRoots, setTreeRoots] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('')
    const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchAccounts()
    }, [session])

    useEffect(() => {
        filterAccounts()
    }, [accounts, searchTerm, filterType])

    const fetchAccounts = async () => {
        try {
            setLoading(true)
            // Traer todas las cuentas en plano y construir el árbol en el cliente
            const response = await fetch('/api/accounting/accounts')
            if (response.ok) {
                const data = await response.json()
                setAccounts(data)
                const roots = buildTree(data)
                setTreeRoots(roots)
            }
        } catch (error) {
            console.error('Error fetching accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterAccounts = () => {
        let filtered = accounts

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase()
            filtered = filtered.filter(account =>
                account.code.toLowerCase().includes(searchLower) ||
                account.name.toLowerCase().includes(searchLower)
            )
        }

        if (filterType) {
            filtered = filtered.filter(account => account.type === filterType)
        }

        setFilteredAccounts(filtered)
    }

    const toggleExpanded = (accountId: string) => {
        const newExpanded = new Set(expandedAccounts)
        if (newExpanded.has(accountId)) {
            newExpanded.delete(accountId)
        } else {
            newExpanded.add(accountId)
        }
        setExpandedAccounts(newExpanded)
    }

    // Construir árbol recursivo a partir de lista plana
    const buildTree = (flat: Account[]) => {
        const map: Record<string, Account & { children: Account[] }> = {}
        flat.forEach(a => {
            map[a.id] = { ...a, children: a.children ? [...a.children] : [] }
        })

        const roots: (Account & { children: Account[] })[] = []

        flat.forEach(a => {
            if (a.parentId && map[a.parentId]) {
                map[a.parentId].children = map[a.parentId].children || []
                map[a.parentId].children.push(map[a.id])
            } else {
                roots.push(map[a.id])
            }
        })

        return roots
    }

    // Filtrar el árbol: conserva nodos que cumplan predicate o que tengan descendientes que cumplan
    const filterTree = (roots: Account[], predicate: (a: Account) => boolean) => {
        const cloneAndPrune = (node: Account): Account | null => {
            const children = (node.children || []).map(c => cloneAndPrune(c)).filter(Boolean) as Account[]
            const nodeMatches = predicate(node)
            if (nodeMatches || children.length > 0) {
                return { ...node, children }
            }
            return null
        }

        return roots.map(r => cloneAndPrune(r)).filter(Boolean) as Account[]
    }

    const handleEditAccount = (account: Account) => {
        router.push(`/accounting/accounts/${account.id}`)
    }

    const handleDeleteAccount = async (accountId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta cuenta? Esta acción no se puede deshacer.')) {
            return
        }

        try {
            const response = await fetch(`/api/accounting/accounts/${accountId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                // Recargar las cuentas
                fetchAccounts()
            } else {
                const error = await response.json()
                alert(error.error || 'Error al eliminar la cuenta')
            }
        } catch (error) {
            console.error('Error deleting account:', error)
            alert('Error al eliminar la cuenta')
        }
    }

    const getAccountTypeColor = (type: string) => {
        switch (type) {
            case 'ASSET':
            case 'ACTIVO':
                return 'bg-green-100 text-green-800'
            case 'LIABILITY':
            case 'PASIVO':
                return 'bg-red-100 text-red-800'
            case 'EQUITY':
            case 'PATRIMONIO':
                return 'bg-blue-100 text-blue-800'
            case 'REVENUE':
            case 'INGRESO':
                return 'bg-purple-100 text-purple-800'
            case 'EXPENSE':
            case 'EGRESO':
                return 'bg-orange-100 text-orange-800'
            case 'OTHER_INCOME':
                return 'bg-cyan-100 text-cyan-800'
            case 'OTHER_EXPENSE':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const renderAccount = (account: Account, level: number = 0) => {
        const hasChildren = account.children && account.children.length > 0
        const isExpanded = expandedAccounts.has(account.id)
        // Por ahora no mostramos actividad hasta implementar el cálculo de saldos
        const hasActivity = false

        return (
            <div key={account.id} className="border-b border-gray-100 last:border-b-0">
                <div
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${level > 0 ? `ml-${level * 6}` : ''
                        }`}
                    style={{ paddingLeft: `${16 + level * 24}px` }}
                >
                    <div className="flex items-center space-x-3 flex-1">
                        <div className="flex items-center space-x-2">
                            {hasChildren && (
                                <button
                                    onClick={() => toggleExpanded(account.id)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                </button>
                            )}
                            {!hasChildren && <div className="w-6" />}

                            <div className="flex items-center space-x-3">
                                <span className="font-mono text-sm font-medium text-gray-600 min-w-0">
                                    {account.code}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.type)}`}>
                                    {account.type}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                {account.name}
                            </h3>
                            {account.subType && (
                                <p className="text-xs text-gray-500">{account.subType}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {hasActivity && account._count && (
                            <div className="text-xs text-gray-500">
                                <span className="inline-flex items-center space-x-1">
                                    <span>D: {account._count.debitEntries || 0}</span>
                                    <span>C: {account._count.creditEntries || 0}</span>
                                </span>
                            </div>
                        )}

                        <div className={`w-2 h-2 rounded-full ${account.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditAccount(account)
                                }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteAccount(account.id)
                                    }}
                                    className="text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div>
                        {account.children!.map(child => renderAccount(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    const accountTypes = ['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'EGRESO']
    const stats = {
        total: accounts.length,
        active: accounts.filter(a => a.isActive).length,
        withActivity: 0 // Por ahora no calculamos actividad hasta implementar saldos
    }

    return (
        <Layout title="Plan de Cuentas" subtitle="Estructura contable de la organización">
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Buscar por código o nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                <option value="">Todos los tipos</option>
                                {accountTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Link
                        href="/accounting/accounts/new"
                        className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nueva Cuenta</span>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total de Cuentas</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <BookOpen className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Cuentas Activas</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Con Movimientos</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.withActivity}</p>
                            </div>
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accounts Tree */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-900">
                            Plan de Cuentas Contable
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {filteredAccounts.length} cuenta{filteredAccounts.length !== 1 ? 's' : ''}
                            {searchTerm || filterType ? ' (filtradas)' : ''}
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No se encontraron cuentas
                            </h3>
                            <p className="text-gray-500">
                                {searchTerm || filterType
                                    ? 'Intenta ajustar los filtros de búsqueda'
                                    : 'Aún no tienes cuentas configuradas'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {(() => {
                                const predicate = (a: Account) => {
                                    if (!searchTerm && !filterType) return true
                                    const matchesSearch = searchTerm ? (a.code.toLowerCase().includes(searchTerm.toLowerCase()) || a.name.toLowerCase().includes(searchTerm.toLowerCase())) : true
                                    const matchesType = filterType ? a.type === filterType : true
                                    return matchesSearch && matchesType
                                }

                                const filteredRoots = filterTree(treeRoots, predicate)
                                return filteredRoots.map(root => renderAccount(root))
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}