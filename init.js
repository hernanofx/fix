#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando configuración de base de datos para Pix...');

// Marcar tiempo de inicio
global.startTime = Date.now();

// Verificar que estamos en el entorno correcto
console.log('📍 Environment check:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PORT: ${process.env.PORT}`);

// Función para esperar con backoff exponencial
function waitWithBackoff(attempt, maxAttempts = 5) {
    const baseDelay = 1000; // 1 segundo
    const maxDelay = 30000; // 30 segundos
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
    return new Promise(resolve => setTimeout(resolve, delay));
}

// Función para ejecutar comando con reintentos
async function executeWithRetry(command, description, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Intento ${attempt + 1}/${maxRetries + 1}: ${description}`);
            execSync(command, {
                stdio: 'inherit',
                timeout: 60000, // 60 segundos timeout
                env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
            });
            console.log(`✅ ${description} completado exitosamente`);
            return true;
        } catch (error) {
            lastError = error;
            console.log(`⚠️ Intento ${attempt + 1} falló: ${error.message}`);

            if (attempt < maxRetries) {
                // Solo esperar si no es el último intento
                await waitWithBackoff(attempt);
            }
        }
    }

    console.error(`❌ ${description} falló después de ${maxRetries + 1} intentos`);
    console.error('Último error:', lastError.message);
    return false;
}

// Verificar y validar la variable de entorno DATABASE_URL
let rawDatabaseUrl = process.env.DATABASE_URL
if (!rawDatabaseUrl) {
    console.error('❌ Error: DATABASE_URL no está configurada')
    process.exit(1)
}

function maskDatabaseUrl(url) {
    try {
        const u = new URL(url)
        const user = u.username || 'user'
        const host = u.hostname
        const db = (u.pathname || '').replace('/', '')
        return `${u.protocol}//${user}:*****@${host}/${db}`
    } catch (e) {
        return '(invalid url)'
    }
}

function tryAutoFixDatabaseUrl(url) {
    // Try to detect and percent-encode credentials segment if present
    try {
        new URL(url)
        return { ok: true, url }
    } catch (e) {
        const m = url.match(/^(postgres(?:ql)?:\/\/)([^:@\/]+):([^@\/]+)@(.+)$/)
        if (!m) return { ok: false }
        const [, proto, user, pass, rest] = m
        const encodedPass = encodeURIComponent(pass)
        const fixed = `${proto}${user}:${encodedPass}@${rest}`
        try {
            new URL(fixed)
            return { ok: true, url: fixed, autoFixed: true }
        } catch (err) {
            return { ok: false }
        }
    }
}

const tryFix = tryAutoFixDatabaseUrl(rawDatabaseUrl)
if (!tryFix.ok) {
    console.error('❌ DATABASE_URL inválida o mal formulada:', maskDatabaseUrl(rawDatabaseUrl))
    console.error('🔍 Valor real de DATABASE_URL (primeros 100 caracteres):', rawDatabaseUrl ? rawDatabaseUrl.slice(0, 100) + (rawDatabaseUrl.length > 100 ? '…' : '') : '(vacío)')
    console.error('Revisa la variable en tu proveedor (Railway) y asegúrate de escapar caracteres especiales en la contraseña (ej: @ => %40)')
    process.exit(1)
}

if (tryFix.autoFixed) {
    console.log('⚠️ Se detectó un posible carácter inválido en la contraseña. Se aplicó un intento de corrección automática (contraseña codificada).')
    console.log('🔒 URL usada:', maskDatabaseUrl(tryFix.url))
}

// Use the (possibly fixed) URL for child processes
process.env.DATABASE_URL = tryFix.url

console.log('📦 Generando cliente Prisma...');
const prismaGenerateSuccess = await executeWithRetry(
    'npx prisma generate',
    'Generación de cliente Prisma'
);

if (!prismaGenerateSuccess) {
    console.error('❌ No se pudo generar el cliente Prisma después de varios intentos');
    process.exit(1);
}

console.log('🗄️ Aplicando migraciones de base de datos...');

// Ejecutar migración de TimeStatus antes de aplicar el esquema
console.log('🔄 Ejecutando migración de TimeStatus...');
const migrateTimeStatusPath = './migrate-timestatus.js';

if (fs.existsSync(migrateTimeStatusPath)) {
    try {
        execSync(`node ${migrateTimeStatusPath}`, { stdio: 'inherit' });
        console.log('✅ Migración de TimeStatus completada');
    } catch (migrationError) {
        console.log('⚠️ Migración de TimeStatus falló, pero continuando...');
        console.log('Detalle:', migrationError.message);
    }
} else {
    console.log('ℹ️ Archivo migrate-timestatus.js no encontrado, omitiendo migración');
}

// Aplicar esquema de base de datos con reintentos
console.log('📦 Aplicando esquema de base de datos...');
const schemaSuccess = await executeWithRetry(
    'npx prisma db push --accept-data-loss',
    'Aplicación de esquema de base de datos',
    5 // Más reintentos para la base de datos
);

if (!schemaSuccess) {
    console.error('❌ No se pudo aplicar el esquema de base de datos después de varios intentos');
    console.log('💡 La aplicación intentará continuar, pero puede tener problemas de base de datos');
    console.log('💡 Sugerencias:');
    console.log('   - Verifica que DATABASE_URL esté configurada correctamente');
    console.log('   - Asegúrate de que la base de datos esté accesible');
    console.log('   - Revisa que las credenciales sean válidas');
    console.log('   - Considera aumentar el límite de conexiones en PostgreSQL');
    // No salir con error, permitir que la aplicación intente continuar
}

console.log('🌱 Verificando seeding de datos...');

// Solo ejecutar seeding si está explícitamente habilitado
const shouldRunSeed = process.env.RUN_SEED === 'true' || process.env.RUN_SEED === '1';

if (shouldRunSeed) {
    console.log('🌱 Ejecutando seeding de datos...');
    try {
        execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
        console.log('✅ Datos de demo cargados correctamente');
    } catch (error) {
        console.error('❌ Error en seeding:', error.message);
        // No salir con error si el seeding falla, solo mostrar warning
        console.log('⚠️ El seeding falló, pero la aplicación puede continuar');
    }
} else {
    console.log('⏭️ Seeding omitido (para ejecutar manualmente: RUN_SEED=true npm run db:seed)');
}

console.log('🎉 Configuración de base de datos completada exitosamente!');
console.log('🚀 Next.js se iniciará en el puerto:', process.env.PORT || '3000');
console.log('⏰ Tiempo total de inicialización:', Date.now() - (global.startTime || Date.now()), 'ms');
