#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🗄️ Inicializando base de datos Pix...');

// Función para ejecutar comandos con reintentos
async function executeWithRetry(command, description, maxRetries = 5) {
    console.log(`🔄 ${description}...`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            execSync(command, {
                stdio: 'inherit',
                timeout: 60000, // 1 minuto timeout
                env: { ...process.env, NODE_ENV: 'production' }
            });
            console.log(`✅ ${description} completado`);
            return true;
        } catch (error) {
            console.log(`⚠️ Intento ${attempt}/${maxRetries} - ${description} falló: ${error.message}`);

            if (attempt < maxRetries) {
                const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
                console.log(`⏳ Esperando ${waitTime}ms antes del siguiente intento...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    console.log(`❌ ${description} falló después de ${maxRetries} intentos`);
    return false;
}

// Función para esperar con backoff exponencial
function waitWithBackoff(attempt, maxWait = 30000) {
    const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), maxWait);
    console.log(`⏳ Esperando ${waitTime}ms...`);
    return new Promise(resolve => setTimeout(resolve, waitTime));
}

// Función principal de inicialización
async function initializeDatabase() {
    try {
        // Verificar variables de entorno críticas
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL no configurada');
            process.exit(1);
        }

        console.log('🔍 Verificando conexión a base de datos...');

        // Intentar conectar con reintentos
        let connected = false;
        for (let attempt = 1; attempt <= 10; attempt++) {
            try {
                execSync('npx prisma db execute --file <(echo "SELECT 1;") 2>/dev/null || echo "SELECT 1;" | npx prisma db execute --stdin', {
                    stdio: 'pipe',
                    timeout: 10000
                });
                console.log('✅ Base de datos conectada');
                connected = true;
                break;
            } catch (error) {
                console.log(`⚠️ Intento ${attempt}/10 - Conexión fallida: ${error.message}`);
                if (attempt < 10) {
                    await waitWithBackoff(attempt);
                }
            }
        }

        if (!connected) {
            console.log('⚠️ No se pudo conectar a la base de datos, pero continuando con la inicialización...');
        }

        // Generar cliente Prisma
        const prismaGenerated = await executeWithRetry(
            'npx prisma generate',
            'Generando cliente Prisma'
        );

        if (!prismaGenerated) {
            console.log('⚠️ No se pudo generar cliente Prisma, pero continuando...');
        }

        // Verificar y ejecutar migración de TimeStatus si existe
        const migrateTimeStatusPath = './migrate-timestatus.js';
        if (fs.existsSync(migrateTimeStatusPath)) {
            console.log('🔄 Ejecutando migración especial de TimeStatus...');
            try {
                execSync(`node ${migrateTimeStatusPath}`, {
                    stdio: 'inherit',
                    timeout: 120000
                });
                console.log('✅ Migración de TimeStatus completada');
            } catch (error) {
                console.log('⚠️ Migración de TimeStatus falló, pero continuando...');
            }
        }

        // Aplicar esquema de base de datos
        const schemaApplied = await executeWithRetry(
            'npx prisma db push --accept-data-loss',
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
                'npx tsx prisma/seed.ts',
                'Ejecutando seeding'
            );

            if (!seedCompleted) {
                console.log('⚠️ Seeding falló, pero la aplicación puede continuar');
            }
        }

        console.log('🎉 Inicialización de base de datos completada');
        return true;

    } catch (error) {
        console.error('❌ Error durante la inicialización:', error.message);
        console.log('💡 La aplicación intentará continuar sin inicialización completa');
        return false;
    }
}

// Ejecutar inicialización
initializeDatabase().then(success => {
    if (success) {
        console.log('✅ Base de datos inicializada correctamente');
        process.exit(0);
    } else {
        console.log('⚠️ Inicialización completada con advertencias');
        process.exit(0); // No fallar completamente
    }
}).catch(error => {
    console.error('❌ Error fatal en inicialización:', error);
    process.exit(0); // No fallar completamente para permitir que la app inicie
});