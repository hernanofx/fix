import NextAuth from 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            email: string
            name?: string | null
            role: string
            organizationId: string
            organization: {
                id: string
                name: string
                slug: string
                plan: string
                status: string
                enableAccounting: boolean
            }
            phone?: string | null
            position?: string | null
        }
    }

    interface User {
        id: string
        email: string
        name?: string | null
        role: string
        organizationId: string
        organization: {
            id: string
            name: string
            slug: string
            plan: string
            status: string
            enableAccounting: boolean
        }
        phone?: string | null
        position?: string | null
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: string
        organizationId: string
        organization: {
            id: string
            name: string
            slug: string
            plan: string
            status: string
            enableAccounting: boolean
        }
        phone?: string | null
        position?: string | null
    }
}
