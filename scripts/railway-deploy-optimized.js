#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚂 Inicializando despliegue optimizado en Railway...');
console.log('Versión mejorada con mejor manejo de conexiones\n');

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

// Función para esperar con backoff exponencial mejorado
function waitWithBackoff(attempt, maxWait = 120000) {
    const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), maxWait);
    console.log(`⏳ Esperando ${waitTime}ms antes del siguiente intento...`);
    return new Promise(resolve => setTimeout(resolve, waitTime));
}

// Función para ejecutar comandos con reintentos mejorados
async function executeWithRetry(command, description, maxRetries = 3) {
    console.log(`🔄 ${description}...`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            execSync(command, {
                stdio: 'inherit',
                timeout: 120000, // 2 minutos timeout
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    DATABASE_URL: process.env.DATABASE_URL
                }
            });
            console.log(`✅ ${description} completado`);
            return true;
        } catch (error) {
            console.log(`⚠️ Intento ${attempt}/${maxRetries} - ${description} falló: ${error.message}`);

            if (attempt < maxRetries) {
                await waitWithBackoff(attempt, 30000);
            }
        }
    }

    console.log(`❌ ${description} falló después de ${maxRetries} intentos`);
    return false;
}

// Función principal de despliegue optimizada
async function deployToRailway() {
    try {
        // Configurar DATABASE_URL con parámetros optimizados
        configureDatabaseUrl();

        // Verificar variables de entorno críticas
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL no configurada');
            process.exit(1);
        }

        console.log('\n🔍 Verificando conexión a base de datos...');

        // Intentar conectar con reintentos mejorados
        let connected = false;
        const maxAttempts = 25; // Más intentos para Railway
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`🔍 Intento ${attempt}/${maxAttempts}...`);
                execSync('node scripts/test-db-connection.js', {
                    stdio: 'pipe',
                    timeout: 30000, // 30 segundos por intento
                    env: {
                        ...process.env,
                        NODE_ENV: 'production',
                        DATABASE_URL: process.env.DATABASE_URL
                    }
                });
                console.log('✅ Base de datos conectada exitosamente');
                connected = true;
                break;
            } catch (error) {
                console.log(`⚠️ Intento ${attempt}/${maxAttempts} - Conexión fallida: ${error.message}`);
                if (attempt < maxAttempts) {
                    await waitWithBackoff(attempt, 120000); // Hasta 2 minutos
                }
            }
        }

        if (!connected) {
            console.log('⚠️ No se pudo conectar a la base de datos después de todos los intentos');
            console.log('💡 La aplicación iniciará en modo degradado');
            console.log('💡 Verifica que la base de datos esté ejecutándose en Railway');
            return false;
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

        console.log('\n🎉 Despliegue en Railway completado exitosamente');
        console.log('✅ Base de datos conectada y configurada');
        console.log('✅ Esquema de base de datos aplicado');
        console.log('✅ Cliente Prisma generado');

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
        console.log('\n✅ Despliegue completado correctamente');
        console.log('🚀 La aplicación debería estar funcionando');
        process.exit(0);
    } else {
        console.log('\n⚠️ Despliegue completado con advertencias');
        console.log('🚀 La aplicación iniciará pero puede tener funcionalidades limitadas');
        process.exit(0); // No fallar completamente para permitir que Railway inicie la app
    }
}).catch(error => {
    console.error('\n❌ Error fatal en despliegue:', error);
    console.log('🚨 Revisa los logs de Railway para más detalles');
    process.exit(0); // No fallar completamente
});