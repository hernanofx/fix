#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Iniciando Pix en modo producción...');

// Función para verificar si la base de datos está disponible
async function checkDatabaseConnection(maxRetries = 10) {
    console.log('🔍 Verificando conexión a base de datos...');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Usar el script de prueba de conexión que ya funciona
            execSync('node scripts/test-db-connection.js', {
                stdio: 'pipe',
                timeout: 10000,
                env: {
                    ...process.env,
                    DATABASE_URL: process.env.DATABASE_URL
                }
            });
            console.log('✅ Base de datos conectada correctamente');
            return true;
        } catch (error) {
            console.log(`⚠️ Intento ${attempt}/${maxRetries} - Base de datos no disponible: ${error.message}`);

            if (attempt < maxRetries) {
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
                console.log(`⏳ Esperando ${waitTime}ms antes del siguiente intento...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    console.log('❌ No se pudo conectar a la base de datos después de varios intentos');
    return false;
}

// Función para inicializar la base de datos
async function initializeDatabase() {
    console.log('🗄️ Inicializando base de datos...');

    try {
        // Generar cliente Prisma
        console.log('📦 Generando cliente Prisma...');
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log('✅ Cliente Prisma generado');

        // Verificar migración de TimeStatus
        const migrateTimeStatusPath = './migrate-timestatus.js';
        if (fs.existsSync(migrateTimeStatusPath)) {
            console.log('🔄 Ejecutando migración de TimeStatus...');
            try {
                execSync(`node ${migrateTimeStatusPath}`, { stdio: 'inherit' });
                console.log('✅ Migración de TimeStatus completada');
            } catch (error) {
                console.log('⚠️ Migración de TimeStatus falló, continuando...');
            }
        }

        // Aplicar esquema
        console.log('📦 Aplicando esquema de base de datos...');
        execSync('npx prisma db push --accept-data-loss', {
            stdio: 'inherit',
            timeout: 120000 // 2 minutos timeout
        });
        console.log('✅ Esquema aplicado correctamente');

        // Ejecutar seeding si está habilitado
        const shouldRunSeed = process.env.RUN_SEED === 'true' || process.env.RUN_SEED === '1';
        if (shouldRunSeed) {
            console.log('🌱 Ejecutando seeding...');
            execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
            console.log('✅ Seeding completado');
        }

        return true;
    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error.message);
        return false;
    }
}

// Función principal
async function main() {
    const port = process.env.PORT || '3000';
    console.log(`📍 Puerto configurado: ${port}`);

    // Verificar variables de entorno críticas
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL no configurada');
        process.exit(1);
    }

    // Intentar conectar a la base de datos
    const dbConnected = await checkDatabaseConnection();

    let dbInitialized = false;
    if (dbConnected) {
        dbInitialized = await initializeDatabase();
    }

    if (!dbInitialized) {
        console.log('⚠️ Modo degradado: Iniciando aplicación sin base de datos completamente inicializada');
        console.log('💡 La aplicación intentará reconectar automáticamente');
    }

    // Iniciar Next.js
    console.log('🚀 Iniciando Next.js...');

    const nextProcess = spawn('npx', ['next', 'start', '-p', port], {
        stdio: 'inherit',
        env: {
            ...process.env,
            NODE_ENV: 'production',
            DATABASE_AVAILABLE: dbInitialized ? 'true' : 'false'
        }
    });

    // Manejar señales para cerrar correctamente
    process.on('SIGTERM', () => {
        console.log('🛑 Recibida señal SIGTERM, cerrando aplicación...');
        nextProcess.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
        console.log('🛑 Recibida señal SIGINT, cerrando aplicación...');
        nextProcess.kill('SIGINT');
    });

    // Esperar a que el proceso termine
    nextProcess.on('close', (code) => {
        console.log(`📊 Next.js terminó con código: ${code}`);
        process.exit(code);
    });

    nextProcess.on('error', (error) => {
        console.error('❌ Error iniciando Next.js:', error);
        process.exit(1);
    });
}

// Ejecutar función principal
main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});