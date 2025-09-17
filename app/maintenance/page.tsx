'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function MaintenancePage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [timeLeft, setTimeLeft] = useState(300) // 5 minutos por defecto

    useEffect(() => {
        // Si el usuario es admin, redirigir al admin
        if (session?.user && (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN')) {
            router.push('/admin/system')
            return
        }

        // Countdown timer
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Recargar la página para verificar si el mantenimiento terminó
                    window.location.reload()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [session, router])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Sistema en Mantenimiento
                    </h1>
                    <p className="text-xl text-gray-600 mb-6">
                        Estamos realizando mejoras para brindarte una mejor experiencia
                    </p>
                </div>

                {/* Maintenance Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
                            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            Mantenimiento Programado
                        </h2>

                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Nuestro equipo está trabajando arduamente para mejorar el sistema Pix.
                            Durante este período, algunas funciones pueden no estar disponibles.
                        </p>

                        {/* Countdown Timer */}
                        <div className="bg-gray-50 rounded-xl p-6 mb-6">
                            <p className="text-sm text-gray-500 mb-2">Próxima verificación automática en:</p>
                            <div className="text-3xl font-mono font-bold text-blue-600">
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${((300 - timeLeft) / 300) * 100}%` }}
                            />
                        </div>

                        <p className="text-sm text-gray-500">
                            La página se actualizará automáticamente cuando el mantenimiento finalice
                        </p>
                    </div>
                </div>

                {/* Features Being Improved */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                        🚀 Mejoras en Desarrollo
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Performance Mejorada</h4>
                                <p className="text-sm text-gray-600">Optimización de velocidad y respuesta</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Nueva Seguridad</h4>
                                <p className="text-sm text-gray-600">Mejoras en protección de datos</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Nueva Interfaz</h4>
                                <p className="text-sm text-gray-600">Diseño moderno y intuitivo</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Nuevas Funciones</h4>
                                <p className="text-sm text-gray-600">Herramientas avanzadas para tu trabajo</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        ¿Necesitas ayuda urgente?
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
                        <a
                            href="mailto:soporte@pix.com"
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>soporte@pix.com</span>
                        </a>
                        <a
                            href="tel:+1234567890"
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>+1 (234) 567-8900</span>
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                        © 2024 Pix - Sistema de Gestión para la Construcción
                    </p>
                </div>
            </div>
        </div>
    )
}