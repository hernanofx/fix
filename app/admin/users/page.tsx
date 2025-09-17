'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { MoreHorizontal, Eye, Edit, Trash2, Menu, X } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface User {
    id: string
    name: string
    email: string
    role: string
    status: string
    phone?: string
    position?: string
    createdAt: string
    organization: {
        id: string
        name: string
        slug: string
    }
}

export default function UsersPage() {
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRole, setSelectedRole] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)
    const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [resetLoading, setResetLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users')
            const data = await response.json()
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = !selectedRole || user.role === selectedRole
        const matchesStatus = !selectedStatus || user.status === selectedStatus

        return matchesSearch && matchesRole && matchesStatus
    })

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentUsers = filteredUsers.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items)
        setCurrentPage(1)
    }

    const handleStatusChange = async (userId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            })

            if (response.ok) {
                setUsers(prev => prev.map(user =>
                    user.id === userId ? { ...user, status: newStatus } : user
                ))
            } else {
                alert('Error al actualizar el estado del usuario')
            }
        } catch (error) {
            console.error('Error updating user status:', error)
            alert('Error al actualizar el estado del usuario')
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            })

            if (response.ok) {
                setUsers(prev => prev.map(user =>
                    user.id === userId ? { ...user, role: newRole } : user
                ))
            } else {
                alert('Error al actualizar el rol del usuario')
            }
        } catch (error) {
            console.error('Error updating user role:', error)
            alert('Error al actualizar el rol del usuario')
        }
    }

    const handlePasswordReset = (user: User) => {
        setSelectedUserForReset(user)
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordResetModal(true)
    }

    const generateSecurePassword = () => {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz'
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const numbers = '0123456789'
        const symbols = '!@#$%^&*'

        let password = ''

        // Asegurar al menos un carácter de cada tipo
        password += lowercase[Math.floor(Math.random() * lowercase.length)]
        password += uppercase[Math.floor(Math.random() * uppercase.length)]
        password += numbers[Math.floor(Math.random() * numbers.length)]
        password += symbols[Math.floor(Math.random() * symbols.length)]

        // Completar hasta 12 caracteres
        const allChars = lowercase + uppercase + numbers + symbols
        for (let i = password.length; i < 12; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)]
        }

        // Mezclar los caracteres
        return password.split('').sort(() => Math.random() - 0.5).join('')
    }

    const handlePasswordResetSubmit = async () => {
        if (!selectedUserForReset) return

        if (!newPassword) {
            alert('Por favor ingresa una nueva contraseña.')
            return
        }

        if (newPassword.length < 8) {
            alert('La contraseña debe tener al menos 8 caracteres.')
            return
        }

        if (newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden.')
            return
        }

        if (!confirm(`¿Estás seguro de que quieres resetear la contraseña de ${selectedUserForReset.name}? Se enviará un email con la nueva contraseña.`)) {
            return
        }

        setResetLoading(true)

        try {
            const response = await fetch(`/api/users?userId=${selectedUserForReset.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newPassword,
                    sendNotification: true
                }),
            })

            if (response.ok) {
                alert(`Contraseña reseteada exitosamente. Se ha enviado un email a ${selectedUserForReset.email} con la nueva contraseña.`)
                setShowPasswordResetModal(false)
                setSelectedUserForReset(null)
                setNewPassword('')
                setConfirmPassword('')
            } else {
                const error = await response.json()
                alert(`Error al resetear la contraseña: ${error.error || 'Error desconocido'}`)
            }
        } catch (error) {
            console.error('Error resetting password:', error)
            alert('Error al resetear la contraseña. Por favor, inténtalo de nuevo.')
        } finally {
            setResetLoading(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
            return
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setUsers(prev => prev.filter(user => user.id !== userId))
                alert('Usuario eliminado exitosamente.')
            } else {
                alert('Error al eliminar el usuario.')
            }
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Error al eliminar el usuario.')
        }
    }

    const getVisiblePages = () => {
        const delta = 2
        const range = []
        const rangeWithDots = []

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i)
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...')
        } else {
            rangeWithDots.push(1)
        }

        rangeWithDots.push(...range)

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages)
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages)
        }

        return rangeWithDots
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-900 text-xl">Cargando usuarios...</div>
            </div>
        )
    }

    return (
        <AdminLayout
            title="Gestión de Usuarios"
            subtitle="Administra todos los usuarios del sistema Pix"
        >
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
                <Link
                    href="/admin/users/new"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                >
                    Nuevo Usuario
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Usuarios</p>
                            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Usuarios Activos</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {users.filter(user => user.status === 'ACTIVE').length}
                            </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Usuarios Inactivos</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {users.filter(user => user.status === 'INACTIVE').length}
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Nuevos Esta Semana</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {users.filter(user => {
                                    const weekAgo = new Date()
                                    weekAgo.setDate(weekAgo.getDate() - 7)
                                    return new Date(user.createdAt) > weekAgo
                                }).length}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-initial">
                            <input
                                type="text"
                                placeholder="Buscar usuarios..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full lg:w-80 pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos los roles</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="MANAGER">Gerente</option>
                            <option value="USER">Usuario</option>
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos los estados</option>
                            <option value="ACTIVE">Activo</option>
                            <option value="INACTIVE">Inactivo</option>
                            <option value="PENDING">Pendiente</option>
                        </select>
                    </div>

                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 w-full sm:w-auto">
                        Exportar
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organización</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acceso</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className={`px-3 py-1 text-xs font-semibold rounded-full border border-gray-300 bg-white text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${user.role === 'ADMIN' ? 'text-red-600' :
                                                user.role === 'MANAGER' ? 'text-blue-600' :
                                                    'text-green-600'
                                                }`}
                                        >
                                            <option value="USER" className="bg-white text-gray-900">Usuario</option>
                                            <option value="MANAGER" className="bg-white text-gray-900">Gerente</option>
                                            <option value="ADMIN" className="bg-white text-gray-900">Administrador</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.organization.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={user.status}
                                            onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                            className={`px-3 py-1 text-xs font-semibold rounded-full border border-gray-300 bg-white text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${user.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'
                                                }`}
                                        >
                                            <option value="ACTIVE" className="bg-white text-gray-900">Activo</option>
                                            <option value="INACTIVE" className="bg-white text-gray-900">Inactivo</option>
                                            <option value="PENDING" className="bg-white text-gray-900">Pendiente</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                                                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                                    className="cursor-pointer"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver detalles
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handlePasswordReset(user)}
                                                    className="cursor-pointer"
                                                >
                                                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                    </svg>
                                                    Resetear Contraseña
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <span>Mostrar</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                            className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span>registros por página</span>
                    </div>
                    <div className="text-center sm:text-left">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} resultados
                    </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        Anterior
                    </button>

                    <div className="flex items-center gap-1">
                        {getVisiblePages().map((page, index) => (
                            <div key={index}>
                                {page === '...' ? (
                                    <span className="px-3 py-2 text-gray-400">...</span>
                                ) : (
                                    <button
                                        onClick={() => handlePageChange(page as number)}
                                        className={`px-3 py-2 rounded-lg transition-colors duration-200 border whitespace-nowrap ${currentPage === page
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Password Reset Modal */}
            {showPasswordResetModal && selectedUserForReset && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Resetear Contraseña</h3>
                                <p className="text-sm text-gray-600">Usuario: {selectedUserForReset.name}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nueva Contraseña *
                                </label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Ingresa la nueva contraseña"
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const generated = generateSecurePassword()
                                            setNewPassword(generated)
                                            setConfirmPassword(generated)
                                        }}
                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm whitespace-nowrap"
                                        title="Generar contraseña segura"
                                    >
                                        🔐 Generar
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirmar Contraseña *
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Confirma la nueva contraseña"
                                    minLength={8}
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-blue-800 font-medium">Se enviará un email automático</p>
                                        <p className="text-sm text-blue-600 mt-1">
                                            Al usuario {selectedUserForReset.email} con la nueva contraseña.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowPasswordResetModal(false)
                                    setSelectedUserForReset(null)
                                    setNewPassword('')
                                    setConfirmPassword('')
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                disabled={resetLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handlePasswordResetSubmit}
                                disabled={resetLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resetLoading ? 'Reseteando...' : 'Resetear Contraseña'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
