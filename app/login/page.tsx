'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LoadingScreen from '../../components/LoadingScreen'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showLoadingScreen, setShowLoadingScreen] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setShowLoadingScreen(true)

        try {
            // Use NextAuth signIn with redirect and full callbackUrl
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false, // Don't redirect automatically
                callbackUrl: `${window.location.origin}/dashboard`
            })

            if (result?.error) {
                setError('Credenciales inválidas')
                setShowLoadingScreen(false)
                setIsLoading(false)
            } else if (result?.ok) {
                // Success - redirect manually to show loading screen
                router.push('/dashboard')
            }
        } catch (error) {
            setError('Error al iniciar sesión')
            setShowLoadingScreen(false)
            setIsLoading(false)
        }
    }

    // Show loading screen during authentication
    if (showLoadingScreen) {
        return <LoadingScreen message="Verificando credenciales..." />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Link href="/" className="inline-block">
                        <Image
                            src="/favicon.png"
                            alt="Pix Logo"
                            width={64}
                            height={64}
                            className="h-16 w-auto mx-auto bg-transparent"
                            style={{ backgroundColor: 'transparent' }}
                            priority
                        />
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Inicia sesión en tu cuenta
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        O{' '}
                        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                            crea una cuenta nueva
                        </Link>
                    </p>
                </div>

                {/* Login Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="bg-white py-8 px-6 shadow-lg rounded-lg space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                                {error}
                            </div>
                        )}

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
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Recordarme
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </button>
                        </div>
                    </div>
                </form>


                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        ¿Necesitas ayuda?{' '}
                        <Link href="/support" className="font-medium text-blue-600 hover:text-blue-500">
                            Contacta al soporte
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
