#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Diagnóstico de base de datos Pix...');

// Función para ejecutar comandos de forma segura
function executeCommand(command, description) {
    try {
        console.log(`🔄 ${description}...`);
        const result = execSync(command, {
            encoding: 'utf8',
            timeout: 30000,
            env: {
                ...process.env,
                NODE_ENV: 'production',
                DATABASE_URL: process.env.DATABASE_URL
            }
        });
        console.log(`✅ ${description} completado`);
        return { success: true, output: result };
    } catch (error) {
        console.log(`❌ ${description} falló: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Función para verificar conectividad
async function checkConnectivity() {
    console.log('\n📡 Verificando conectividad a la base de datos...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL no configurada');
        return false;
    }

    // Extraer información de la URL
    const url = new URL(process.env.DATABASE_URL);
    console.log(`🌐 Host: ${url.hostname}`);
    console.log(`🔌 Puerto: ${url.port}`);
    console.log(`📊 Base de datos: ${url.pathname.substring(1)}`);

    // Intentar conexión simple
    const connectionTest = executeCommand(
        'node scripts/test-db-connection.js',
        'Probando conexión básica'
    );

    if (connectionTest.success) {
        console.log('✅ Conexión a base de datos exitosa');
        return true;
    } else {
        console.log('❌ Error de conexión a base de datos');
        console.log('Detalle:', connectionTest.error);
        return false;
    }
}

// Función para verificar esquema
function checkSchema() {
    console.log('\n📋 Verificando esquema de base de datos...');

    const schemaCheck = executeCommand(
        `npx prisma db push --preview-feature`,
        'Verificando esquema con Prisma'
    );

    if (schemaCheck.success) {
        console.log('✅ Esquema de base de datos válido');
    } else {
        console.log('⚠️ Posibles problemas con el esquema');
    }
}

// Función para verificar migraciones
function checkMigrations() {
    console.log('\n🔄 Verificando estado de migraciones...');

    const migrationCheck = executeCommand(
        `npx prisma migrate status`,
        'Verificando estado de migraciones'
    );

    if (migrationCheck.success) {
        console.log('✅ Migraciones en buen estado');
    } else {
        console.log('⚠️ Posibles problemas con migraciones');
    }
}

// Función para obtener estadísticas
function getStats() {
    console.log('\n📊 Obteniendo estadísticas de la base de datos...');

    const statsQuery = executeCommand(
        'node scripts/get-table-stats.js',
        'Obteniendo estadísticas de tablas'
    );

    if (statsQuery.success) {
        console.log('📈 Estadísticas obtenidas:');
        console.log(statsQuery.output);
    }
}

// Función principal de diagnóstico
async function diagnoseDatabase() {
    console.log('🩺 Iniciando diagnóstico de base de datos...\n');

    // Verificar variables de entorno
    console.log('🔧 Variables de entorno:');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`RUN_SEED: ${process.env.RUN_SEED || 'false'}`);
    console.log('');

    // Ejecutar verificaciones
    const isConnected = await checkConnectivity();
    if (isConnected) {
        checkSchema();
        checkMigrations();
        getStats();
    }

    // Recomendaciones
    console.log('\n💡 Recomendaciones:');
    if (!isConnected) {
        console.log('- Verificar que DATABASE_URL sea correcta');
        console.log('- Verificar que la base de datos esté ejecutándose');
        console.log('- Verificar credenciales de conexión');
        console.log('- Verificar que el puerto esté abierto');
    } else {
        console.log('- Base de datos conectada correctamente');
        console.log('- Considerar configurar connection pooling para Railway');
        console.log('- Verificar límites de conexiones en el plan de Railway');
    }

    console.log('\n🎯 Diagnóstico completado');
}

// Ejecutar diagnóstico
diagnoseDatabase().catch(error => {
    console.error('❌ Error fatal en diagnóstico:', error);
    process.exit(1);
});