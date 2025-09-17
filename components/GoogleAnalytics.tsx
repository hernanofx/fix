'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

declare global {
    interface Window {
        gtag: (...args: any[]) => void
        dataLayer: any[]
    }
}

export default function GoogleAnalytics() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { data: session } = useSession()

    // Función para determinar el módulo actual basado en el pathname
    const getCurrentModule = (path: string): string => {
        if (path.startsWith('/dashboard')) return 'dashboard'
        if (path.startsWith('/projects')) return 'projects'
        if (path.startsWith('/clients')) return 'clients'
        if (path.startsWith('/employees')) return 'employees'
        if (path.startsWith('/invoices') || path.startsWith('/bills')) return 'invoices'
        if (path.startsWith('/admin')) return 'admin'
        if (path.startsWith('/profile')) return 'profile'
        if (path.startsWith('/support')) return 'support'
        if (path.startsWith('/login') || path.startsWith('/register')) return 'auth'
        if (path.startsWith('/assignments')) return 'assignments'
        if (path.startsWith('/budgets')) return 'budgets'
        if (path.startsWith('/cashflow')) return 'cashflow'
        if (path.startsWith('/collections')) return 'collections'
        if (path.startsWith('/evaluations')) return 'evaluations'
        if (path.startsWith('/inspections')) return 'inspections'
        if (path.startsWith('/payrolls')) return 'payrolls'
        if (path.startsWith('/planning')) return 'planning'
        if (path.startsWith('/providers')) return 'providers'
        if (path.startsWith('/rubros')) return 'rubros'
        if (path.startsWith('/stock')) return 'stock'
        if (path.startsWith('/time-tracking')) return 'time_tracking'
        if (path.startsWith('/treasury')) return 'treasury'
        if (path === '/' || path === '') return 'landing'
        return 'other'
    }

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 GA4 tracking disabled in development mode')
            return
        }

        const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

        if (!GA_MEASUREMENT_ID) {
            console.warn('⚠️ Google Analytics Measurement ID not found')
            return
        }

        // Initialize gtag
        const script1 = document.createElement('script')
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
        script1.async = true
        document.head.appendChild(script1)

        const script2 = document.createElement('script')
        script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_title: document.title,
        page_location: window.location.href
      });
    `
        document.head.appendChild(script2)

        console.log('✅ Google Analytics initialized with ID:', GA_MEASUREMENT_ID)

        return () => {
            document.head.removeChild(script1)
            document.head.removeChild(script2)
        }
    }, [])

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') return

        const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
        if (!GA_MEASUREMENT_ID || !window.gtag) return

        const url = pathname + searchParams.toString()

        // Send custom dimensions with page view
        const customDimensions = {
            organization_id: session?.user?.organizationId || 'unknown',
            organization_name: session?.user?.organization?.name || 'unknown',
            user_role: session?.user?.role || 'unknown',
            // Nuevas dimensiones para reportes avanzados
            module_name: getCurrentModule(pathname),
            action_type: 'page_view', // Por defecto es page_view, se puede cambiar en eventos específicos
            subscription_plan: session?.user?.organization?.plan || 'unknown'
        }

        window.gtag('config', GA_MEASUREMENT_ID, {
            page_path: url,
            page_title: document.title,
            // Enviar dimensiones personalizadas como parámetros directos
            organization_id: customDimensions.organization_id,
            organization_name: customDimensions.organization_name,
            user_role: customDimensions.user_role,
            module_name: customDimensions.module_name,
            action_type: customDimensions.action_type,
            subscription_plan: customDimensions.subscription_plan
        })

        console.log('📊 GA4 page view tracked:', url, 'with dimensions:', customDimensions)
    }, [pathname, searchParams, session])

    return null
}
