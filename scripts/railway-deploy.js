#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚂 Inicializando despliegue en Railway...');

// Función para configurar DATABASE_URL con parámetros optimizados para Railway
function configureDatabaseUrl() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL no configurada');
        process.exit(1);
    }

    let dbUrl = process.env.DATABASE_URL;

    // Verificar si ya tiene parámetros de conexión
    if (!dbUrl.includes('?')) {
        // Agregar parámetros optimizados para Railway
        const params = new URLSearchParams({
            'connection_limit': '3',      // Límite bajo para Railway
            'pool_timeout': '20',         // Timeout de pool en segundos
            'connect_timeout': '10',      // Timeout de conexión
            'socket_timeout': '30',       // Timeout de socket
            'keepalives': '1',            // Mantener conexiones vivas
            'keepalives_idle': '30',      // Idle time para keepalives
            'keepalives_interval': '10',  // Intervalo de keepalives
            'keepalives_count': '3'       // Número de keepalives
        });

        dbUrl += '?' + params.toString();
        console.log('🔧 DATABASE_URL configurada con parámetros de pooling');
    } else {
        console.log('ℹ️ DATABASE_URL ya tiene parámetros configurados');
    }

    // Actualizar la variable de entorno
    process.env.DATABASE_URL = dbUrl;

    // Mostrar información de la URL (sin contraseña)
    const url = new URL(dbUrl);
    console.log(`📍 Conectando a: ${url.hostname}:${url.port || 5432}`);
    console.log(`📊 Base de datos: ${url.pathname.substring(1)}`);
}

// Función para esperar con backoff exponencial
function waitWithBackoff(attempt, maxWait = 30000) {
    const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), maxWait);
    console.log(`⏳ Esperando ${waitTime}ms...`);
    return new Promise(resolve => setTimeout(resolve, waitTime));
}

// Función principal de despliegue
async function deployToRailway() {
    try {
        // Configurar DATABASE_URL con parámetros optimizados
        configureDatabaseUrl();

        // Verificar variables de entorno críticas
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL no configurada');
            process.exit(1);
        }

        console.log('🔍 Verificando conexión a base de datos...');

        // Intentar conectar con reintentos (más tiempo para Railway)
        let connected = false;
        const maxAttempts = 20; // Aumentado de 15 a 20
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Usar un script separado para evitar problemas de escaping
                execSync('node scripts/test-db-connection.js', {
                    stdio: 'pipe',
                    timeout: 20000, // Aumentado a 20 segundos
                    env: {
                        ...process.env,
                        NODE_ENV: 'production',
                        DATABASE_URL: process.env.DATABASE_URL
                    }
                });
                console.log('✅ Base de datos conectada');
                connected = true;
                break;
            } catch (error) {
                console.log(`⚠️ Intento ${attempt}/${maxAttempts} - Conexión fallida: ${error.message}`);
                if (attempt < maxAttempts) {
                    const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 120000); // Hasta 2 minutos
                    console.log(`⏳ Esperando ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }

        if (!connected) {
            console.log('⚠️ No se pudo conectar a la base de datos, iniciando en modo degradado...');
        }

        // Generar cliente Prisma
        const prismaGenerated = await executeWithRetry(
            'npx prisma generate',
            'Generando cliente Prisma'
        );

        if (!prismaGenerated) {
            console.log('⚠️ No se pudo generar cliente Prisma, pero continuando...');
        }

        // Aplicar esquema de base de datos
        const schemaApplied = await executeWithRetry(
            `npx prisma db push --accept-data-loss`,
            'Aplicando esquema de base de datos',
            3
        );

        if (!schemaApplied) {
            console.log('⚠️ No se pudo aplicar esquema, pero continuando...');
        }

        // Ejecutar seeding si está habilitado
        const shouldRunSeed = process.env.RUN_SEED === 'true' || process.env.RUN_SEED === '1';
        if (shouldRunSeed) {
            console.log('🌱 Ejecutando seeding de datos...');
            const seedCompleted = await executeWithRetry(
                `DATABASE_URL="${process.env.DATABASE_URL}" npx tsx prisma/seed.ts`,
                'Ejecutando seeding'
            );

            if (!seedCompleted) {
                console.log('⚠️ Seeding falló, pero la aplicación puede continuar');
            }
        }

        console.log('🎉 Despliegue en Railway completado');
        return true;

    } catch (error) {
        console.error('❌ Error durante el despliegue:', error.message);
        console.log('💡 La aplicación intentará continuar sin inicialización completa');
        return false;
    }
}

// Ejecutar despliegue
deployToRailway().then(success => {
    if (success) {
        console.log('✅ Despliegue completado correctamente');
        process.exit(0);
    } else {
        console.log('⚠️ Despliegue completado con advertencias');
        process.exit(0); // No fallar completamente
    }
}).catch(error => {
    console.error('❌ Error fatal en despliegue:', error);
    process.exit(0); // No fallar completamente para permitir que la app inicie
});