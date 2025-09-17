'use client'

import Image from 'next/image'

interface LoadingScreenProps {
    message?: string
}

export default function LoadingScreen({ message = "Cargando..." }: LoadingScreenProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center space-y-8">
                {/* Logo with Pulse Animation */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-blue-200 animate-ping opacity-20"></div>
                    <div className="relative bg-transparent rounded-full p-6 shadow-lg">
                        <Image
                            src="/favicon.png"
                            alt="Pix Logo"
                            width={80}
                            height={80}
                            className="h-20 w-20 animate-pulse bg-transparent"
                            style={{ backgroundColor: 'transparent' }}
                            priority
                        />
                    </div>
                </div>

                {/* Loading Text */}
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                        PIX
                    </h2>
                    <p className="text-gray-600 font-medium">
                        {message}
                    </p>
                </div>

                {/* Loading Animation */}
                <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>

                {/* Progress Bar */}
                <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full animate-pulse"
                        style={{
                            width: '60%',
                            animation: 'loading 2s ease-in-out infinite'
                        }}>
                    </div>
                </div>
            </div>

            {/* Custom Loading Animation */}
            <style jsx>{`
                @keyframes loading {
                    0% { width: 0%; }
                    50% { width: 60%; }
                    100% { width: 100%; }
                }
            `}</style>
        </div>
    )
}
