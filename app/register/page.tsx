import Link from 'next/link'

export default function Register() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Link href="/" className="inline-block">
                        <h1 className="text-4xl font-bold text-gray-900">Pix</h1>
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Crea tu cuenta
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        O{' '}
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            inicia sesión si ya tienes cuenta
                        </Link>
                    </p>
                </div>

                {/* Registration Form */}
                <form className="mt-8 space-y-6" action="#" method="POST">
                    <div className="bg-white py-8 px-6 shadow-lg rounded-lg space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                    Nombre
                                </label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    autoComplete="given-name"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Juan"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                    Apellido
                                </label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    autoComplete="family-name"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Pérez"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                                Empresa/Organización
                            </label>
                            <input
                                id="company"
                                name="company"
                                type="text"
                                autoComplete="organization"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Constructora XYZ S.A."
                            />
                        </div>

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
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="juan.perez@empresa.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Teléfono
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="+54 11 1234-5678"
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
                                autoComplete="new-password"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirmar contraseña
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                                Acepto los{' '}
                                <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                                    términos y condiciones
                                </Link>{' '}
                                y la{' '}
                                <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                                    política de privacidad
                                </Link>
                            </label>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                            >
                                Crear Cuenta
                            </button>
                        </div>
                    </div>
                </form>

                {/* Benefits */}
                <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-green-800 mb-3">¿Qué incluye tu cuenta gratuita?</h3>
                    <ul className="text-sm text-green-700 space-y-2">
                        <li className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Hasta 3 proyectos activos
                        </li>
                        <li className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Gestión de hasta 10 empleados
                        </li>
                        <li className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Soporte técnico incluido
                        </li>
                        <li className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            30 días de prueba gratuita
                        </li>
                    </ul>
                </div>

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
