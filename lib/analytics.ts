import { useSession } from 'next-auth/react'

declare global {
    interface Window {
        gtag: (...args: any[]) => void
    }
}

// Hook personalizado para analytics avanzados
export const useAnalytics = () => {
    const { data: session } = useSession()

    // Función para determinar el módulo actual
    const getCurrentModule = (pathname: string): string => {
        if (pathname.startsWith('/dashboard')) return 'dashboard'
        if (pathname.startsWith('/projects')) return 'projects'
        if (pathname.startsWith('/clients')) return 'clients'
        if (pathname.startsWith('/employees')) return 'employees'
        if (pathname.startsWith('/invoices') || pathname.startsWith('/bills')) return 'invoices'
        if (pathname.startsWith('/admin')) return 'admin'
        if (pathname.startsWith('/profile')) return 'profile'
        if (pathname.startsWith('/support')) return 'support'
        if (pathname.startsWith('/login') || pathname.startsWith('/register')) return 'auth'
        if (pathname.startsWith('/assignments')) return 'assignments'
        if (pathname.startsWith('/budgets')) return 'budgets'
        if (pathname.startsWith('/cashflow')) return 'cashflow'
        if (pathname.startsWith('/collections')) return 'collections'
        if (pathname.startsWith('/evaluations')) return 'evaluations'
        if (pathname.startsWith('/inspections')) return 'inspections'
        if (pathname.startsWith('/payrolls')) return 'payrolls'
        if (pathname.startsWith('/planning')) return 'planning'
        if (pathname.startsWith('/providers')) return 'providers'
        if (pathname.startsWith('/rubros')) return 'rubros'
        if (pathname.startsWith('/stock')) return 'stock'
        if (pathname.startsWith('/time-tracking')) return 'time_tracking'
        if (pathname.startsWith('/treasury')) return 'treasury'
        if (pathname === '/' || pathname === '') return 'landing'
        return 'other'
    }

    // Función para enviar eventos personalizados
    const trackEvent = (
        eventName: string,
        parameters: Record<string, any> = {}
    ) => {
        if (typeof window === 'undefined' || !window.gtag) return

        const customDimensions = {
            organization_id: session?.user?.organizationId || 'unknown',
            organization_name: session?.user?.organization?.name || 'unknown',
            user_role: session?.user?.role || 'unknown',
            module_name: getCurrentModule(window.location.pathname),
            action_type: parameters.action_type || 'custom_event',
            subscription_plan: session?.user?.organization?.plan || 'unknown'
        }

        window.gtag('event', eventName, {
            ...parameters,
            // Enviar dimensiones personalizadas como parámetros directos
            organization_id: customDimensions.organization_id,
            organization_name: customDimensions.organization_name,
            user_role: customDimensions.user_role,
            module_name: customDimensions.module_name,
            action_type: customDimensions.action_type,
            subscription_plan: customDimensions.subscription_plan
        })

        console.log('📊 Event tracked:', eventName, customDimensions)
    }

    // Funciones específicas para acciones comunes
    const trackCreate = (entityType: string, entityId?: string) => {
        trackEvent('create_entity', {
            action_type: 'create',
            entity_type: entityType,
            entity_id: entityId
        })
    }

    const trackUpdate = (entityType: string, entityId?: string) => {
        trackEvent('update_entity', {
            action_type: 'update',
            entity_type: entityType,
            entity_id: entityId
        })
    }

    const trackDelete = (entityType: string, entityId?: string) => {
        trackEvent('delete_entity', {
            action_type: 'delete',
            entity_type: entityType,
            entity_id: entityId
        })
    }

    const trackView = (entityType: string, entityId?: string) => {
        trackEvent('view_entity', {
            action_type: 'view',
            entity_type: entityType,
            entity_id: entityId
        })
    }

    const trackExport = (entityType: string, format?: string) => {
        trackEvent('export_data', {
            action_type: 'export',
            entity_type: entityType,
            export_format: format
        })
    }

    const trackSearch = (query: string, resultsCount?: number) => {
        trackEvent('search_performed', {
            action_type: 'search',
            search_query: query,
            results_count: resultsCount
        })
    }

    return {
        trackEvent,
        trackCreate,
        trackUpdate,
        trackDelete,
        trackView,
        trackExport,
        trackSearch
    }
}

export default useAnalytics
