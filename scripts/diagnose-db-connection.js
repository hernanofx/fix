#!/usr/bin/env node

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

console.log('🔍 Diagnóstico completo de conexión a base de datos');
console.log('================================================\n');

// 1. Verificar variables de entorno
console.log('1️⃣ Verificando variables de entorno...');
console.log('DATABASE_URL configurada:', process.env.DATABASE_URL ? '✅' : '❌');

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no está configurada');
    process.exit(1);
}

// 2. Analizar URL de la base de datos
console.log('\n2️⃣ Analizando configuración de base de datos...');
try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`🔗 Protocolo: ${url.protocol}`);
    console.log(`🏠 Host: ${url.hostname}`);
    console.log(`🔌 Puerto: ${url.port || '5432 (default)'}`);
    console.log(`👤 Usuario: ${url.username}`);
    console.log(`🗄️ Base de datos: ${url.pathname.substring(1)}`);

    // Verificar parámetros de conexión
    const params = url.searchParams;
    console.log('\n⚙️ Parámetros de conexión:');
    if (params.has('connection_limit')) {
        console.log(`   - connection_limit: ${params.get('connection_limit')}`);
    } else {
        console.log('   ⚠️ connection_limit no configurado (recomendado: 3-5)');
    }

    if (params.has('connect_timeout')) {
        console.log(`   - connect_timeout: ${params.get('connect_timeout')}s`);
    } else {
        console.log('   ⚠️ connect_timeout no configurado (recomendado: 10s)');
    }

    if (params.has('pool_timeout')) {
        console.log(`   - pool_timeout: ${params.get('pool_timeout')}s`);
    } else {
        console.log('   ⚠️ pool_timeout no configurado (recomendado: 20s)');
    }
} catch (error) {
    console.error('❌ Error al analizar DATABASE_URL:', error.message);
    process.exit(1);
}

// 3. Probar conexión básica
console.log('\n3️⃣ Probando conexión básica...');
const prisma = new PrismaClient({
    log: ['error', 'warn', 'info'],
});

async function runDiagnostics() {
    try {
        console.log('⏳ Intentando conectar...');

        const startTime = Date.now();
        await prisma.$queryRaw`SELECT 1 as test, version() as version`;
        const latency = Date.now() - startTime;

        console.log('✅ Conexión exitosa');
        console.log(`⚡ Latencia: ${latency}ms`);

        // 4. Verificar esquema de base de datos
        console.log('\n4️⃣ Verificando esquema de base de datos...');
        try {
            const tables = await prisma.$queryRaw`
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            `;

            console.log(`📊 Tablas encontradas: ${tables.length}`);
            if (tables.length > 0) {
                console.log('   Tablas principales:');
                tables.slice(0, 5).forEach(table => {
                    console.log(`   - ${table.table_name}`);
                });
                if (tables.length > 5) {
                    console.log(`   ... y ${tables.length - 5} más`);
                }
            }
        } catch (schemaError) {
            console.log('⚠️ No se pudo verificar esquema:', schemaError.message);
        }

        // 5. Verificar permisos
        console.log('\n5️⃣ Verificando permisos...');
        try {
            await prisma.$queryRaw`SELECT * FROM users LIMIT 1`;
            console.log('✅ Permisos de lectura: OK');
        } catch (permError) {
            console.log('⚠️ Permisos de lectura:', permError.message);
        }

        console.log('\n🎉 Diagnóstico completado exitosamente');

    } catch (error) {
        console.error('\n❌ Error de conexión:', error.message);
        console.error('🔍 Código de error:', error.code || 'Desconocido');
        console.error('💡 Posibles causas:');
        console.error('   - La base de datos no está ejecutándose');
        console.error('   - Las credenciales son incorrectas');
        console.error('   - El host o puerto son incorrectos');
        console.error('   - Problemas de red o firewall');

        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runDiagnostics();