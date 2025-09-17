import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Crear organizaciones de ejemplo
    const organizations = await Promise.all([
        prisma.organization.upsert({
            where: { slug: 'fix-mantenimiento' },
            update: {},
            create: {
                name: 'FIX Mantenimiento',
                slug: 'fix-mantenimiento',
                email: 'info@fix.app',
                phone: '+54 11 9 1234 5678',
                address: 'Av. Boyaca 123',
                city: 'Buenos Aires',
                country: 'Argentina',
                website: 'https://fixerp.app',
                description: 'Empresa líder en software para construcción',
                plan: 'PROFESSIONAL',
                status: 'ACTIVE'
            }
        }),
    ])

    console.log('✅ Organizations created:', organizations.length)

    // Crear usuarios de ejemplo
    const hashedPassword = await bcrypt.hash('demo123', 12)

    const users = await Promise.all([
        // Admin de FIX MANTENIMIENTO
        prisma.user.upsert({
            where: { email: 'info@fixerp.app' },
            update: {},
            create: {
                name: 'Info',
                email: 'info@fixerp.app',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                phone: '+54 9 11 1111 1111',
                position: 'Gerente General',
                organizationId: organizations[0].id
            }
        }),
        // Admin Matías
        prisma.user.upsert({
            where: { email: 'matias@fixerp.app' },
            update: {},
            create: {
                name: 'Matías',
                email: 'matias@fixerp.app',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                phone: '+54 9 11 2222 2222',
                position: 'Administrador',
                organizationId: organizations[0].id
            }
        }),
        // Admin Hernan
        prisma.user.upsert({
            where: { email: 'hernan@fixerp.app' },
            update: {},
            create: {
                name: 'Hernan',
                email: 'hernan@fixerp.app',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                phone: '+54 9 11 3333 3333',
                position: 'Administrador',
                organizationId: organizations[0].id
            }
        }),
        // Admin JF
        prisma.user.upsert({
            where: { email: 'jf@fixerp.app' },
            update: {},
            create: {
                name: 'JF',
                email: 'jf@fixerp.app',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                phone: '+54 9 11 4444 4444',
                position: 'Administrador',
                organizationId: organizations[0].id
            }
        }),
    ])

    console.log('✅ Users created:', users.length)


    // Crear algunos proyectos de ejemplo (solo si no existen)
    console.log('🏗️ Verificando proyectos de ejemplo...')

    const existingProjects = await prisma.project.findMany({
        where: { organizationId: organizations[0].id }
    })

    if (existingProjects.length === 0) {
        const projects = await Promise.all([
            prisma.project.create({
                data: {
                    name: 'FIX Administracion',
                    description: 'Proyecto de administracion de fix erp, interno',
                    code: 'PRJ-001',
                    status: 'PLANNING',
                    priority: 'MEDIUM',
                    startDate: new Date('2024-03-01'),
                    endDate: new Date('2025-08-31'),
                    budget: 0,
                    progress: 10,
                    address: 'Ruta 9 Km 45',
                    city: 'Buenos Aires',
                    organizationId: organizations[0].id,
                    createdById: users[0].id
                }
            })
        ])

        console.log('✅ Sample projects created:', projects.length)
    } else {
        console.log('⏭️ Projects already exist, skipping creation')
    }

    console.log('🎉 Database seed completed successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Error during database seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
