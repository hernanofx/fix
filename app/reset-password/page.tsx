'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordContent() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [token, setToken] = useState('')
    const [isValidToken, setIsValidToken] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const tokenParam = searchParams.get('token')
        if (tokenParam) {
            setToken(tokenParam)
            setIsValidToken(true)
        } else {
            setError('Token de recuperación no válido')
            setIsValidToken(false)
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setMessage('')

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            setIsLoading(false)
            return
        }

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres')
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setMessage('Contraseña actualizada exitosamente. Redirigiendo al login...')
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            } else {
                setError(data.error || 'Error al actualizar la contraseña')
            }
        } catch (error) {
            setError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isValidToken) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <Link href="/" className="inline-block">
                            <h1 className="text-4xl font-bold text-gray-900">Pix</h1>
                        </Link>
                        <h2 className="mt-6 text-3xl font-bold text-gray-900">
                            Token Inválido
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            El enlace de recuperación no es válido o ha expirado.
                        </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Enlace no válido
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>
                                        Este enlace de recuperación de contraseña no es válido o ha expirado.
                                        Solicita un nuevo enlace desde la página de recuperación.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                            ← Solicitar nuevo enlace
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Link href="/" className="inline-block">
                        <h1 className="text-4xl font-bold text-gray-900">Pix</h1>
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Nueva Contraseña
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Ingresa tu nueva contraseña
                    </p>
                </div>

                {/* Success Message */}
                {message && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">
                                    ¡Contraseña actualizada!
                                </h3>
                                <div className="mt-2 text-sm text-green-700">
                                    <p>{message}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reset Password Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="bg-white py-8 px-6 shadow-lg rounded-lg space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Nueva Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ingresa tu nueva contraseña"
                                minLength={8}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirmar Contraseña
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Confirma tu nueva contraseña"
                                minLength={8}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Password Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Requisitos de contraseña</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Mínimo 8 caracteres</li>
                        <li>• Las contraseñas deben coincidir</li>
                        <li>• Usa una combinación de letras, números y símbolos</li>
                    </ul>
                </div>

                {/* Back to Login */}
                <div className="text-center">
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        ← Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        </div>
    )
}

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        </div>
    )
}

export default function ResetPassword() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordContent />
        </Suspense>
    )
}
