'use client'

import { useSession } from 'next-auth/react'

export function useAuth() {
    const { data: session, status } = useSession()

    return {
        user: session?.user,
        organization: session?.user?.organization,
        isLoading: status === 'loading',
        isAuthenticated: !!session,
        isAdmin: session?.user?.role === 'ADMIN',
        isManager: session?.user?.role === 'MANAGER',
        isUser: session?.user?.role === 'USER'
    }
}
