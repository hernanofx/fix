'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '../../components/Layout'
import { useAuth } from '../../lib/hooks/useAuth'
import { getSession } from 'next-auth/react'

function ProfileContent() {
    const searchParams = useSearchParams()
    const tab = searchParams.get('tab') || 'general'
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState(tab)

    useEffect(() => {
        setActiveTab(tab)
    }, [tab])

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'password', label: 'Clave' },
        { id: 'email', label: 'Email' },
        { id: 'phone', label: 'Teléfono' },
        { id: 'position', label: 'Posición' },
    ]

    return (
        <Layout title="Perfil de Usuario" subtitle="Gestiona tu información personal">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="bg-white shadow rounded-lg">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex flex-wrap gap-2 sm:gap-8 px-4 sm:px-6" aria-label="Tabs">
                            {tabs.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === t.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-4 sm:p-6">
                        {activeTab === 'general' && <GeneralTab user={user} />}
                        {activeTab === 'password' && <PasswordTab />}
                        {activeTab === 'email' && <EmailTab user={user} />}
                        {activeTab === 'phone' && <PhoneTab user={user} />}
                        {activeTab === 'position' && <PositionTab user={user} />}
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProfileContent />
        </Suspense>
    )
}

function GeneralTab({ user }: { user: any }) {
    return (
        <div className="max-w-2xl">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900 break-words">{user?.name || 'No disponible'}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900 break-words">{user?.email || 'No disponible'}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="mt-1 text-sm text-gray-900 break-words">{user?.phone || 'No disponible'}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Posición</label>
                    <p className="mt-1 text-sm text-gray-900 break-words">{user?.position || 'No disponible'}</p>
                </div>
            </div>
        </div>
    )
}

function PasswordTab() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden')
            return
        }
        setLoading(true)
        try {
            const response = await fetch(`/api/users/${user?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            })
            if (response.ok) {
                alert('Contraseña cambiada exitosamente')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                alert('Error al cambiar la contraseña')
            }
        } catch (error) {
            alert('Error al cambiar la contraseña')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Cambiar Contraseña</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirmar Nueva Contraseña</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
            </div>
        </form>
    )
}

function EmailTab({ user }: { user: any }) {
    const [email, setEmail] = useState(user?.email || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const response = await fetch(`/api/users/${user?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            if (response.ok) {
                alert('Email cambiado exitosamente')
            } else {
                alert('Error al cambiar el email')
            }
        } catch (error) {
            alert('Error al cambiar el email')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Cambiar Email</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nuevo Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Cambiando...' : 'Cambiar Email'}
                </button>
            </div>
        </form>
    )
}

function PhoneTab({ user }: { user: any }) {
    const [phone, setPhone] = useState(user?.phone || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const response = await fetch(`/api/users/${user?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            })
            if (response.ok) {
                alert('Teléfono cambiado exitosamente')
            } else {
                alert('Error al cambiar el teléfono')
            }
        } catch (error) {
            alert('Error al cambiar el teléfono')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Cambiar Teléfono</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nuevo Teléfono</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Cambiando...' : 'Cambiar Teléfono'}
                </button>
            </div>
        </form>
    )
}

function PositionTab({ user }: { user: any }) {
    const [position, setPosition] = useState(user?.position || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const response = await fetch(`/api/users/${user?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position })
            })
            if (response.ok) {
                alert('Posición cambiada exitosamente')
            } else {
                alert('Error al cambiar la posición')
            }
        } catch (error) {
            alert('Error al cambiar la posición')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Cambiar Posición</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nueva Posición</label>
                    <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Cambiando...' : 'Cambiar Posición'}
                </button>
            </div>
        </form>
    )
}
