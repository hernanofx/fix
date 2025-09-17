import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/providers/SessionProvider'
import ToastProvider from '@/components/ToastProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Pix - Gestión de Construcción',
    description: 'Software de gestión para la construcción',
    icons: {
        icon: '/favicon.png',
        apple: '/favicon.png'
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <head>
                {/* Google tag (gtag.js) */}
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-EL43L32M44"></script>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', 'G-EL43L32M44');
                        `,
                    }}
                />
            </head>
            <body className={`${inter.className} bg-gray-50`}>
                <SessionProvider>
                    <ToastProvider>
                        <div className="min-h-screen flex flex-col">
                            {children}
                        </div>
                    </ToastProvider>
                </SessionProvider>
            </body>
        </html>
    )
}
