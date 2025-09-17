'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [emailSent, setEmailSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setMessage('')

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (data.success) {
                setMessage(data.message)
                setEmailSent(true)
            } else {
                setError(data.error || 'Error al enviar el email')
            }
        } catch (error) {
            setError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setIsLoading(false)
        }
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
                        Recupera tu contraseña
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Te enviaremos un enlace para restablecer tu contraseña
                    </p>
                </div>

                {/* Success Message */}
                {message && emailSent && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">
                                    ¡Enlace enviado!
                                </h3>
                                <div className="mt-2 text-sm text-green-700">
                                    <p>
                                        Si existe una cuenta con ese correo electrónico, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                                    </p>
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

                {/* Forgot Password Form */}
                {!emailSent && (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="bg-white py-8 px-6 shadow-lg rounded-lg space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Correo electrónico
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="tu@email.com"
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Help Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">¿No recibiste el email?</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Revisa tu carpeta de spam</li>
                        <li>• El enlace expira en 24 horas</li>
                        <li>• Verifica que el email esté escrito correctamente</li>
                    </ul>
                </div>

                {/* Back to Login */}
                <div className="text-center">
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        ← Volver al inicio de sesión
                    </Link>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        ¿Necesitas más ayuda?{' '}
                        <Link href="/support" className="font-medium text-blue-600 hover:text-blue-500">
                            Contacta al soporte
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
