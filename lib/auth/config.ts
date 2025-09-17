import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                console.log('Authorize called with:', credentials?.email)

                if (!credentials?.email || !credentials?.password) {
                    console.log('Missing credentials')
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: {
                        organization: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                plan: true,
                                status: true,
                                enableAccounting: true
                            }
                        }
                    }
                })

                console.log('User found:', user ? 'Yes' : 'No')

                if (!user || !user.password) {
                    console.log('User not found or no password')
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                console.log('Password valid:', isPasswordValid)

                if (!isPasswordValid) {
                    console.log('Invalid password')
                    return null
                }

                // Solo permitir usuarios activos
                if (user.status !== 'ACTIVE') {
                    console.log('User not active:', user.status)
                    return null
                }

                console.log('User authorized successfully:', {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    organizationId: user.organizationId
                })

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    organizationId: user.organizationId,
                    organization: user.organization,
                    phone: user.phone,
                    position: user.position
                }
            }
        })
    ],
    session: {
        strategy: 'jwt'
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.organizationId = user.organizationId
                token.organization = user.organization
                token.phone = user.phone
                token.position = user.position
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub!
                session.user.role = token.role as string
                session.user.organizationId = token.organizationId as string
                session.user.organization = token.organization as any
                session.user.phone = token.phone as string
                session.user.position = token.position as string
            }
            return session
        }
    },
    pages: {
        signIn: '/login'
    }
}
