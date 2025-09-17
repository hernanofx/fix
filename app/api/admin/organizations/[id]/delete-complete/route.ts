import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: {
        id: string
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const organizationId = params.id

    try {
        // Verificar que la organización existe
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        users: true,
                        projects: true,
                        employees: true,
                        budgets: true,
                        bills: true,
                        inspections: true,
                        timeTrackings: true,
                        clients: true,
                        providers: true,
                        tasks: true,
                        payrolls: true,
                        payments: true,
                        transactions: true,
                        cashBoxes: true,
                        bankAccounts: true,
                        rubros: true,
                        materials: true,
                        warehouses: true,
                        stockMovements: true,
                        purchaseOrders: true,
                        paymentTerms: true,
                        notificationConfigs: true,
                        notificationLogs: true,
                        billPayments: true
                    }
                }
            }
        })

        if (!organization) {
            return NextResponse.json(
                { success: false, error: 'Organización no encontrada' },
                { status: 404 }
            )
        }

        console.log(`🗑️ Iniciando eliminación completa de organización: ${organization.name} (${organizationId})`)

        // Contadores para el reporte final
        const stats = {
            users: organization._count.users,
            projects: organization._count.projects,
            employees: organization._count.employees,
            budgets: organization._count.budgets,
            bills: organization._count.bills,
            inspections: organization._count.inspections,
            timeTrackings: organization._count.timeTrackings,
            clients: organization._count.clients,
            providers: organization._count.providers,
            tasks: organization._count.tasks,
            payrolls: organization._count.payrolls,
            payments: organization._count.payments,
            transactions: organization._count.transactions,
            cashBoxes: organization._count.cashBoxes,
            bankAccounts: organization._count.bankAccounts,
            rubros: organization._count.rubros,
            materials: organization._count.materials,
            warehouses: organization._count.warehouses,
            stockMovements: organization._count.stockMovements,
            purchaseOrders: organization._count.purchaseOrders,
            paymentTerms: organization._count.paymentTerms,
            notificationConfigs: organization._count.notificationConfigs,
            notificationLogs: organization._count.notificationLogs,
            billPayments: organization._count.billPayments
        }

        // Ejecutar eliminación en orden específico para evitar conflictos de claves foráneas
        console.log('📋 Eliminando registros relacionados...')

        // 1. Eliminar logs de notificaciones
        if (stats.notificationLogs > 0) {
            await prisma.notificationLog.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.notificationLogs} logs de notificaciones`)
        }

        // 2. Eliminar configuraciones de notificaciones
        if (stats.notificationConfigs > 0) {
            await prisma.notificationConfig.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminadas ${stats.notificationConfigs} configuraciones de notificaciones`)
        }

        // 3. Eliminar movimientos de stock asociados a facturas
        if (stats.stockMovements > 0) {
            await prisma.billStockMovement.deleteMany({
                where: {
                    bill: {
                        organizationId
                    }
                }
            })
            console.log(`✅ Eliminados movimientos de stock de facturas`)
        }

        // 4. Eliminar pagos de facturas
        if (stats.billPayments > 0) {
            await prisma.billPayment.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.billPayments} pagos de facturas`)
        }

        // 5. Eliminar rubros de facturas
        await prisma.billRubro.deleteMany({
            where: {
                bill: {
                    organizationId
                }
            }
        })
        console.log(`✅ Eliminados rubros de facturas`)

        // 6. Eliminar facturas (bills)
        if (stats.bills > 0) {
            await prisma.bill.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminadas ${stats.bills} facturas`)
        }

        // 7. Eliminar pagos
        if (stats.payments > 0) {
            await prisma.payment.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.payments} pagos`)
        }

        // 8. Eliminar transacciones
        if (stats.transactions > 0) {
            await prisma.transaction.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminadas ${stats.transactions} transacciones`)
        }

        // 9. Eliminar cajas de efectivo
        if (stats.cashBoxes > 0) {
            await prisma.cashBox.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminadas ${stats.cashBoxes} cajas de efectivo`)
        }

        // 10. Eliminar cuentas bancarias
        if (stats.bankAccounts > 0) {
            await prisma.bankAccount.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminadas ${stats.bankAccounts} cuentas bancarias`)
        }

        // 11. Eliminar nóminas
        if (stats.payrolls > 0) {
            await prisma.payroll.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminadas ${stats.payrolls} nóminas`)
        }

        // 12. Eliminar inspecciones
        if (stats.inspections > 0) {
            await prisma.inspection.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminadas ${stats.inspections} inspecciones`)
        }

        // 13. Eliminar registros de tiempo
        if (stats.timeTrackings > 0) {
            await prisma.timeTracking.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.timeTrackings} registros de tiempo`)
        }

        // 14. Eliminar movimientos de stock
        if (stats.stockMovements > 0) {
            await prisma.stockMovement.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.stockMovements} movimientos de stock`)
        }

        // 15. Eliminar órdenes de compra
        if (stats.purchaseOrders > 0) {
            await prisma.purchaseOrder.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminadas ${stats.purchaseOrders} órdenes de compra`)
        }

        // 16. Eliminar empleados
        if (stats.employees > 0) {
            await prisma.employee.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.employees} empleados`)
        }

        // 17. Eliminar tareas
        if (stats.tasks > 0) {
            await prisma.task.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminadas ${stats.tasks} tareas`)
        }

        // 18. Eliminar presupuestos
        if (stats.budgets > 0) {
            await prisma.budget.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.budgets} presupuestos`)
        }

        // 19. Eliminar almacenes
        if (stats.warehouses > 0) {
            await prisma.warehouse.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.warehouses} almacenes`)
        }

        // 20. Eliminar materiales
        if (stats.materials > 0) {
            await prisma.material.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.materials} materiales`)
        }

        // 21. Eliminar rubros
        if (stats.rubros > 0) {
            await prisma.rubro.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.rubros} rubros`)
        }

        // 22. Eliminar términos de pago
        if (stats.paymentTerms > 0) {
            await prisma.paymentTerm.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.paymentTerms} términos de pago`)
        }

        // 23. Eliminar proyectos
        if (stats.projects > 0) {
            await prisma.project.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.projects} proyectos`)
        }

        // 24. Eliminar clientes
        if (stats.clients > 0) {
            await prisma.client.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.clients} clientes`)
        }

        // 25. Eliminar proveedores
        if (stats.providers > 0) {
            await prisma.provider.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.providers} proveedores`)
        }

        // 27. Eliminar usuarios (esto también eliminará sesiones y cuentas relacionadas)
        if (stats.users > 0) {
            await prisma.user.deleteMany({
                where: { organizationId }
            })
            console.log(`✅ Eliminados ${stats.users} usuarios`)
        }

        // 28. Finalmente, eliminar la organización
        await prisma.organization.delete({
            where: { id: organizationId }
        })
        console.log(`✅ Eliminada organización: ${organization.name}`)

        // Calcular total de registros eliminados
        const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0)

        console.log(`🎉 Eliminación completa exitosa. Total de registros eliminados: ${totalRecords + 1}`)

        return NextResponse.json({
            success: true,
            message: `Organización "${organization.name}" eliminada completamente`,
            stats: {
                ...stats,
                totalRecords: totalRecords + 1 // +1 por la organización
            }
        })

    } catch (error) {
        console.error('❌ Error durante la eliminación completa:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error durante la eliminación completa de la organización',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        )
    }
}
