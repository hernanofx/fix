#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    console.log('🔍 Probando conexión a base de datos...');
    console.log('📍 DATABASE_URL configurada:', process.env.DATABASE_URL ? '✅ Sí' : '❌ No');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL no configurada');
        process.exit(1);
    }

    // Mostrar información de la URL (sin contraseña)
    const url = new URL(process.env.DATABASE_URL);
    console.log(`🔗 Host: ${url.hostname}:${url.port || 5432}`);
    console.log(`📊 Base de datos: ${url.pathname.substring(1)}`);
    console.log(`👤 Usuario: ${url.username}`);

    const prisma = new PrismaClient({
        log: ['error', 'warn'],
    });

    try {
        console.log('⏳ Intentando conectar...');
        await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Conexión exitosa');
        process.exit(0);
    } catch (error) {
        console.error('❌ Conexión fallida:', error.message);
        console.error('🔍 Detalles del error:', error.code || 'Sin código');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();