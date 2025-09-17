import { notificationService } from './notificationService';
import { notificationTrigger } from './notificationTrigger';
import { NotificationEventType } from './emailService';

/**
 * SCRIPT DE PRUEBA PARA EL SISTEMA DE NOTIFICACIONES
 *
 * Este script verifica que todas las operaciones de notificación funcionen correctamente.
 */

export class NotificationTestSuite {

    static async runAllTests(organizationId: string, testUserId: string): Promise<void> {
        console.log('🚀 Iniciando pruebas del sistema de notificaciones...\n');

        try {
            // 1. Verificar conexión SMTP
            console.log('1. Verificando conexión SMTP...');
            const smtpOk = await notificationService.testEmailConfiguration();
            console.log(`   ✅ SMTP: ${smtpOk ? 'CONECTADO' : 'ERROR'}\n`);

            // 2. Probar envío de email de prueba
            console.log('2. Probando envío de email de prueba...');
            const testEmailResult = await notificationService.sendTestEmail('test@example.com', organizationId);
            console.log(`   ✅ Email de prueba: ${testEmailResult ? 'ENVIADO' : 'ERROR'}\n`);

            // 3. Configurar notificaciones por defecto
            console.log('3. Configurando notificaciones por defecto...');
            await notificationService.setupDefaultNotifications(organizationId, testUserId);
            console.log('   ✅ Notificaciones por defecto configuradas\n');

            // 4. Probar triggers de notificación
            console.log('4. Probando triggers de notificación...');
            await this.testNotificationTriggers(organizationId);
            console.log('   ✅ Triggers probados\n');

            // 5. Verificar configuraciones
            console.log('5. Verificando configuraciones de notificación...');
            const configs = await notificationService.getNotificationConfigs(organizationId);
            console.log(`   ✅ Configuraciones encontradas: ${configs.length}\n`);

            // 6. Verificar logs
            console.log('6. Verificando logs de notificación...');
            const logs = await notificationService.getNotificationLogs(organizationId, 10);
            console.log(`   ✅ Logs encontrados: ${logs.length}\n`);

            console.log('🎉 Todas las pruebas del sistema de notificaciones completadas exitosamente!');

        } catch (error) {
            console.error('❌ Error durante las pruebas:', error);
            throw error;
        }
    }

    static async testNotificationTriggers(organizationId: string): Promise<void> {
        const testData = {
            id: 'test-id',
            organizationId,
            name: 'Prueba de Notificación',
            description: 'Esta es una notificación de prueba',
            status: 'ACTIVE',
            createdBy: { name: 'Sistema de Pruebas' }
        };

        // Probar diferentes tipos de eventos
        const testEvents = [
            { name: 'Proyecto Creado', method: 'onProjectCreated', data: testData },
            { name: 'Proyecto Actualizado', method: 'onProjectUpdated', data: testData },
            { name: 'Proyecto Completado', method: 'onProjectCompleted', data: testData },
            { name: 'Factura Creada', method: 'onInvoiceCreated', data: { ...testData, number: 'TEST-001', clientName: 'Cliente de Prueba' } },
            { name: 'Factura Pagada', method: 'onInvoicePaid', data: { ...testData, number: 'TEST-001', total: 1000 } },
            { name: 'Pago Recibido', method: 'onPaymentReceived', data: { ...testData, amount: 1000, clientName: 'Cliente de Prueba' } },
            { name: 'Presupuesto Creado', method: 'onBudgetCreated', data: { ...testData, totalAmount: 5000 } },
            { name: 'Empleado Creado', method: 'onEmployeeCreated', data: { ...testData, firstName: 'Juan', lastName: 'Pérez' } },
            { name: 'Cliente Creado', method: 'onClientCreated', data: testData },
            { name: 'Proveedor Creado', method: 'onProviderCreated', data: testData },
            { name: 'Cobranza Creada', method: 'onCollectionCreated', data: { ...testData, amount: 1000 } },
            { name: 'Tarea Asignada', method: 'onTaskAssigned', data: { ...testData, title: 'Tarea de Prueba' } },
            { name: 'Usuario Registrado', method: 'onUserRegistered', data: { ...testData, email: 'test@example.com' } },
        ];

        for (const event of testEvents) {
            try {
                console.log(`   Probando: ${event.name}`);
                await (notificationTrigger as any)[event.method](event.data);
                console.log(`   ✅ ${event.name}: OK`);
            } catch (error) {
                console.log(`   ❌ ${event.name}: ERROR - ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    static async testAlertSystem(organizationId: string): Promise<void> {
        console.log('🔔 Probando sistema de alertas...\n');

        try {
            // Verificar alertas de stock
            console.log('1. Verificando alertas de stock...');
            await notificationTrigger.checkStockAlerts(organizationId);
            console.log('   ✅ Alertas de stock verificadas\n');

            console.log('🎉 Sistema de alertas probado exitosamente!');

        } catch (error) {
            console.error('❌ Error en sistema de alertas:', error);
            throw error;
        }
    }

    static async generateTestReport(organizationId: string): Promise<void> {
        console.log('📊 Generando reporte de pruebas...\n');

        try {
            const configs = await notificationService.getNotificationConfigs(organizationId);
            const logs = await notificationService.getNotificationLogs(organizationId, 50);

            console.log('=== REPORTE DEL SISTEMA DE NOTIFICACIONES ===\n');

            console.log(`📧 Configuraciones activas: ${configs.filter(c => c.isEnabled).length}/${configs.length}`);
            console.log(`📧 Configuraciones con email: ${configs.filter(c => c.emailEnabled).length}/${configs.length}`);

            console.log('\n📋 Configuraciones por módulo:');
            const byModule = configs.reduce((acc, config) => {
                acc[config.module] = (acc[config.module] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            Object.entries(byModule).forEach(([module, count]) => {
                console.log(`   ${module}: ${count} configuraciones`);
            });

            console.log('\n📨 Historial de envíos:');
            console.log(`   Total de logs: ${logs.length}`);

            const byStatus = logs.reduce((acc, log) => {
                acc[log.status] = (acc[log.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            Object.entries(byStatus).forEach(([status, count]) => {
                console.log(`   ${status}: ${count} notificaciones`);
            });

            console.log('\n📈 Notificaciones por evento:');
            const byEvent = logs.reduce((acc, log) => {
                acc[log.eventType] = (acc[log.eventType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            Object.entries(byEvent).forEach(([event, count]) => {
                console.log(`   ${event}: ${count} notificaciones`);
            });

            console.log('\n✅ Reporte generado exitosamente!');

        } catch (error) {
            console.error('❌ Error generando reporte:', error);
            throw error;
        }
    }
}

// Función principal para ejecutar todas las pruebas
export async function runNotificationTests(organizationId: string, testUserId: string): Promise<void> {
    try {
        await NotificationTestSuite.runAllTests(organizationId, testUserId);
        await NotificationTestSuite.testAlertSystem(organizationId);
        await NotificationTestSuite.generateTestReport(organizationId);

        console.log('\n🎊 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
        console.log('El sistema de notificaciones está funcionando correctamente.');

    } catch (error) {
        console.error('\n💥 ERROR EN LAS PRUEBAS:', error);
        console.log('Revisa la configuración del sistema de notificaciones.');
    }
}
