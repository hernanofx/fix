import { notificationService } from './notificationService';
import { NotificationEventType } from './emailService';
import { formatDateArgentina, formatDateTimeArgentina, getCurrentDateArgentina } from '../utils/date-utils';

/**
 * Hook para disparar notificaciones automáticamente cuando ocurren eventos en el sistema
 */
class NotificationTrigger {

    /**
     * Método genérico para disparar notificaciones
     */
    async triggerNotification(params: {
        eventType: NotificationEventType,
        entityType: string,
        entityId: string,
        organizationId: string,
        entityData: any
    }): Promise<void> {
        await notificationService.sendNotification(params);
    }

    /**
     * Dispara notificación cuando se crea un proyecto
     */
    async onProjectCreated(projectData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.PROJECT_CREATED,
            entityType: 'project',
            entityId: projectData.id,
            organizationId: projectData.organizationId,
            entityData: {
                projectId: projectData.id,
                projectName: projectData.name,
                description: projectData.description,
                status: projectData.status,
                budget: projectData.budget,
                startDate: projectData.startDate ? formatDateArgentina(projectData.startDate) : null,
                createdBy: projectData.createdBy?.name || 'Sistema'
            }
        });
    }

    /**
     * Dispara notificación cuando se completa un proyecto
     */
    async onProjectCompleted(projectData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.PROJECT_COMPLETED,
            entityType: 'project',
            entityId: projectData.id,
            organizationId: projectData.organizationId,
            entityData: {
                projectId: projectData.id,
                projectName: projectData.name,
                completedDate: formatDateArgentina(getCurrentDateArgentina()),
                finalBudget: projectData.budget,
                status: projectData.status
            }
        });
    }

    /**
     * Dispara notificación cuando se actualiza un proyecto
     */
    async onProjectUpdated(projectData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.PROJECT_UPDATED,
            entityType: 'project',
            entityId: projectData.id,
            organizationId: projectData.organizationId,
            entityData: {
                projectId: projectData.id,
                projectName: projectData.name,
                description: projectData.description,
                status: projectData.status,
                progress: projectData.progress,
                budget: projectData.budget,
                startDate: projectData.startDate ? formatDateArgentina(projectData.startDate) : null,
                endDate: projectData.endDate ? formatDateArgentina(projectData.endDate) : null,
                updatedBy: projectData.updatedBy?.name || 'Sistema'
            }
        });
    }

    // ========================================
    // FACTURAS (DEPRECATED - OLD SYSTEM)
    // ========================================

    /**
     * Dispara notificación cuando se crea una factura (DEPRECATED - OLD SYSTEM)
     */
    async onInvoiceCreated(invoiceData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.INVOICE_CREATED,
            entityType: 'invoice',
            entityId: invoiceData.id,
            organizationId: invoiceData.organizationId,
            entityData: {
                invoiceId: invoiceData.id,
                invoiceNumber: invoiceData.number,
                clientName: invoiceData.clientName,
                total: invoiceData.total,
                status: invoiceData.status,
                issueDate: formatDateArgentina(invoiceData.issueDate),
                dueDate: invoiceData.dueDate ? formatDateArgentina(invoiceData.dueDate) : null
            }
        });
    }

    /**
     * Dispara notificación cuando una factura es completamente pagada (DEPRECATED)
     */
    async onInvoicePaid(invoiceData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.INVOICE_PAID,
            entityType: 'invoice',
            entityId: invoiceData.id,
            organizationId: invoiceData.organizationId,
            entityData: {
                invoiceId: invoiceData.id,
                invoiceNumber: invoiceData.number,
                clientName: invoiceData.clientName,
                total: invoiceData.total,
                paidDate: invoiceData.paidDate ? formatDateArgentina(invoiceData.paidDate) : null,
                status: invoiceData.status
            }
        });
    }

    /**
     * Dispara notificación cuando una factura está vencida (DEPRECATED)
     */
    async onInvoiceOverdue(invoiceData: any): Promise<void> {
        const dueDate = new Date(invoiceData.dueDate);
        const today = getCurrentDateArgentina();
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        await this.triggerNotification({
            eventType: NotificationEventType.INVOICE_OVERDUE,
            entityType: 'invoice',
            entityId: invoiceData.id,
            organizationId: invoiceData.organizationId,
            entityData: {
                invoiceId: invoiceData.id,
                invoiceNumber: invoiceData.number,
                clientName: invoiceData.clientName,
                total: invoiceData.total,
                dueDate: formatDateArgentina(dueDate),
                daysOverdue: daysOverdue,
                currency: invoiceData.currency
            }
        });
    }

    // ========================================
    // BILLS (NEW SYSTEM)
    // ========================================

    /**
     * Dispara notificación cuando se crea una nueva factura (NEW BILL SYSTEM)
     */
    async onBillCreated(billData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.BILL_CREATED,
            entityType: 'bill',
            entityId: billData.id,
            organizationId: billData.organizationId,
            entityData: {
                billId: billData.id,
                billNumber: billData.number,
                type: billData.type,
                entityName: billData.client?.name || billData.provider?.name,
                projectName: billData.project?.name,
                total: billData.total,
                currency: billData.currency,
                status: billData.status,
                issueDate: formatDateArgentina(billData.issueDate),
                dueDate: formatDateArgentina(billData.dueDate)
            }
        });
    }

    /**
     * Dispara notificación cuando una factura es completamente pagada (NEW BILL SYSTEM)
     */
    async onBillPaid(billData: any, paymentData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.BILL_PAID,
            entityType: 'bill',
            entityId: billData.id,
            organizationId: billData.organizationId,
            entityData: {
                billId: billData.id,
                billNumber: billData.number,
                type: billData.type,
                entityName: billData.client?.name || billData.provider?.name,
                projectName: billData.project?.name,
                total: billData.total,
                currency: billData.currency,
                paidAmount: paymentData.amount,
                paymentMethod: paymentData.method,
                paymentDate: formatDateArgentina(paymentData.paymentDate),
                paidDate: billData.paidDate ? formatDateArgentina(billData.paidDate) : null
            }
        });
    }

    /**
     * Dispara notificación cuando una factura está vencida (NEW BILL SYSTEM)
     */
    async onBillOverdue(billData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.BILL_OVERDUE,
            entityType: 'bill',
            entityId: billData.id,
            organizationId: billData.organizationId,
            entityData: {
                billId: billData.id,
                billNumber: billData.number,
                type: billData.type,
                entityName: billData.client?.name || billData.provider?.name,
                projectName: billData.project?.name,
                total: billData.total,
                currency: billData.currency,
                status: billData.status,
                dueDate: formatDateArgentina(billData.dueDate),
                daysPastDue: Math.ceil((getCurrentDateArgentina().getTime() - new Date(billData.dueDate).getTime()) / (1000 * 3600 * 24))
            }
        });
    }

    // ========================================
    // PAGOS Y COBRANZAS
    // ========================================

    /**
     * Dispara notificación cuando se recibe un pago
     */
    async onPaymentReceived(paymentData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.PAYMENT_RECEIVED,
            entityType: 'payment',
            entityId: paymentData.id,
            organizationId: paymentData.organizationId,
            entityData: {
                paymentId: paymentData.id,
                amount: paymentData.amount,
                currency: paymentData.currency || 'PESOS',
                method: paymentData.method,
                clientName: paymentData.clientName,
                paidDate: paymentData.paidDate ? formatDateArgentina(paymentData.paidDate) : null,
                reference: paymentData.reference
            }
        });
    }

    /**
     * Dispara notificación cuando un pago está vencido
     */
    async onPaymentOverdue(paymentData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.PAYMENT_OVERDUE,
            entityType: 'payment',
            entityId: paymentData.id,
            organizationId: paymentData.organizationId,
            entityData: {
                paymentId: paymentData.id,
                description: paymentData.description,
                amount: paymentData.amount,
                dueDate: paymentData.dueDate ? formatDateArgentina(paymentData.dueDate) : null,
                clientName: paymentData.client?.name || paymentData.clientName || 'Cliente no especificado',
                currency: paymentData.currency
            }
        });
    }

    /**
     * Dispara notificación cuando se crea una cobranza
     */
    async onCollectionCreated(collectionData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.COLLECTION_CREATED,
            entityType: 'collection',
            entityId: collectionData.id,
            organizationId: collectionData.organizationId,
            entityData: {
                collectionId: collectionData.id,
                clientName: collectionData.client?.name || 'Cliente no especificado',
                amount: collectionData.amount,
                paymentMethod: collectionData.paymentMethod,
                status: collectionData.status,
                dueDate: collectionData.dueDate ? formatDateArgentina(collectionData.dueDate) : null,
                description: collectionData.description
            }
        });
    }

    // ========================================
    // EMPLEADOS
    // ========================================

    /**
     * Dispara notificación cuando se crea un empleado
     */
    async onEmployeeCreated(employeeData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.EMPLOYEE_CREATED,
            entityType: 'employee',
            entityId: employeeData.id,
            organizationId: employeeData.organizationId,
            entityData: {
                employeeId: employeeData.id,
                firstName: employeeData.firstName,
                lastName: employeeData.lastName,
                email: employeeData.email,
                position: employeeData.position,
                department: employeeData.department,
                hireDate: employeeData.hireDate ? formatDateArgentina(employeeData.hireDate) : null
            }
        });
    }

    /**
     * Dispara notificación cuando se actualiza un empleado
     */
    async onEmployeeUpdated(employeeData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.EMPLOYEE_UPDATED,
            entityType: 'employee',
            entityId: employeeData.id,
            organizationId: employeeData.organizationId,
            entityData: {
                employeeId: employeeData.id,
                employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
                email: employeeData.email,
                position: employeeData.position,
                department: employeeData.department,
                salary: employeeData.salary,
                hireDate: employeeData.hireDate ? formatDateArgentina(employeeData.hireDate) : null,
                updatedBy: employeeData.updatedBy?.name || 'Sistema'
            }
        });
    }

    // ========================================
    // CLIENTES Y PROVEEDORES
    // ========================================

    /**
     * Dispara notificación cuando se crea un cliente
     */
    async onClientCreated(clientData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.CLIENT_CREATED,
            entityType: 'client',
            entityId: clientData.id,
            organizationId: clientData.organizationId,
            entityData: {
                clientId: clientData.id,
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                address: clientData.address,
                createdBy: clientData.createdBy?.name || 'Sistema'
            }
        });
    }

    /**
     * Dispara notificación cuando se crea un proveedor
     */
    async onProviderCreated(providerData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.PROVIDER_CREATED,
            entityType: 'provider',
            entityId: providerData.id,
            organizationId: providerData.organizationId,
            entityData: {
                providerId: providerData.id,
                name: providerData.name,
                email: providerData.email,
                phone: providerData.phone,
                address: providerData.address,
                category: providerData.category,
                createdBy: providerData.createdBy?.name || 'Sistema'
            }
        });
    }

    // ========================================
    // INSPECCIONES
    // ========================================

    /**
     * Dispara notificación cuando se programa una inspección
     */
    async onInspectionScheduled(inspectionData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.INSPECTION_SCHEDULED,
            entityType: 'inspection',
            entityId: inspectionData.id,
            organizationId: inspectionData.organizationId,
            entityData: {
                inspectionId: inspectionData.id,
                title: inspectionData.title,
                type: inspectionData.type,
                projectName: inspectionData.project?.name,
                scheduledDate: inspectionData.scheduledDate ? formatDateArgentina(inspectionData.scheduledDate) : null,
                inspector: inspectionData.inspector,
                location: inspectionData.location
            }
        });
    }

    /**
     * Dispara notificación cuando se completa una inspección
     */
    async onInspectionCompleted(inspectionData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.INSPECTION_COMPLETED,
            entityType: 'inspection',
            entityId: inspectionData.id,
            organizationId: inspectionData.organizationId,
            entityData: {
                inspectionId: inspectionData.id,
                title: inspectionData.title,
                type: inspectionData.type,
                projectName: inspectionData.project?.name,
                completedDate: inspectionData.completedDate ? formatDateArgentina(inspectionData.completedDate) : null,
                inspector: inspectionData.inspector,
                findings: inspectionData.findings,
                recommendations: inspectionData.recommendations
            }
        });
    }

    // ========================================
    // PRESUPUESTOS Y TAREAS
    // ========================================

    /**
     * Dispara notificación cuando se crea un presupuesto
     */
    async onBudgetCreated(budgetData: any): Promise<void> {
        console.log('🚀 NotificationTrigger.onBudgetCreated called with:', {
            budgetId: budgetData.id,
            budgetName: budgetData.name,
            organizationId: budgetData.organizationId
        });

        try {
            await this.triggerNotification({
                eventType: NotificationEventType.BUDGET_CREATED,
                entityType: 'budget',
                entityId: budgetData.id,
                organizationId: budgetData.organizationId,
                entityData: {
                    budgetId: budgetData.id,
                    budgetName: budgetData.name,
                    description: budgetData.description,
                    totalAmount: budgetData.totalAmount,
                    type: budgetData.type,
                    status: budgetData.status,
                    projectName: budgetData.project?.name,
                    createdBy: budgetData.createdBy?.name || 'Sistema'
                }
            });
            console.log('✅ Budget notification sent successfully');
        } catch (error) {
            console.error('❌ Error in budget notification:', error);
            throw error;
        }
    }

    /**
     * Dispara notificación cuando un presupuesto está cerca de su límite
     */
    async onBudgetWarning(budgetData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.BUDGET_WARNING,
            entityType: 'budget',
            entityId: budgetData.id,
            organizationId: budgetData.organizationId,
            entityData: {
                budgetId: budgetData.id,
                budgetName: budgetData.name,
                totalAmount: budgetData.totalAmount,
                spent: budgetData.spent,
                projectName: budgetData.project?.name
            }
        });
    }

    /**
     * Dispara notificación cuando se asigna una tarea
     */
    async onTaskAssigned(taskData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.TASK_ASSIGNED,
            entityType: 'task',
            entityId: taskData.id,
            organizationId: taskData.organizationId,
            entityData: {
                taskId: taskData.id,
                taskTitle: taskData.title,
                description: taskData.description,
                assigneeName: taskData.assignee?.firstName + ' ' + taskData.assignee?.lastName || 'Sin asignar',
                priority: taskData.priority,
                endDate: taskData.endDate ? formatDateArgentina(taskData.endDate) : null,
                projectName: taskData.project?.name
            }
        });
    }

    /**
     * Dispara notificación cuando se completa una tarea
     */
    async onTaskCompleted(taskData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.TASK_COMPLETED,
            entityType: 'task',
            entityId: taskData.id,
            organizationId: taskData.organizationId,
            entityData: {
                taskId: taskData.id,
                taskTitle: taskData.title,
                description: taskData.description,
                assigneeName: taskData.assignee ? `${taskData.assignee.firstName} ${taskData.assignee.lastName}` : 'No asignado',
                priority: taskData.priority,
                completedDate: formatDateArgentina(getCurrentDateArgentina()),
                projectName: taskData.project?.name
            }
        });
    }

    /**
     * Dispara notificación cuando una tarea está vencida
     */
    async onTaskOverdue(taskData: any): Promise<void> {
        const dueDate = new Date(taskData.dueDate);
        const today = getCurrentDateArgentina();
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        await this.triggerNotification({
            eventType: NotificationEventType.TASK_OVERDUE,
            entityType: 'task',
            entityId: taskData.id,
            organizationId: taskData.organizationId,
            entityData: {
                taskId: taskData.id,
                taskTitle: taskData.title,
                description: taskData.description,
                assigneeName: taskData.assignee ? `${taskData.assignee.firstName} ${taskData.assignee.lastName}` : 'No asignado',
                priority: taskData.priority,
                dueDate: formatDateArgentina(dueDate),
                daysOverdue: daysOverdue,
                projectName: taskData.project?.name
            }
        });
    }

    // ========================================
    // STOCK Y COMPRAS
    // ========================================

    /**
     * Dispara notificación cuando el stock está bajo
     */
    async onStockLow(stockData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.STOCK_LOW,
            entityType: 'stock',
            entityId: stockData.id,
            organizationId: stockData.material.organizationId,
            entityData: {
                materialId: stockData.material.id,
                materialName: stockData.material.name,
                currentStock: stockData.quantity,
                minStock: stockData.material.minStock,
                unit: stockData.material.unit,
                warehouseName: stockData.warehouse.name
            }
        });
    }

    /**
     * Dispara notificación cuando se crea una orden de compra
     */
    async onPurchaseOrderCreated(purchaseOrderData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.PURCHASE_ORDER_CREATED,
            entityType: 'purchaseOrder',
            entityId: purchaseOrderData.id,
            organizationId: purchaseOrderData.organizationId,
            entityData: {
                purchaseOrderId: purchaseOrderData.id,
                number: purchaseOrderData.number,
                providerName: purchaseOrderData.provider?.name || 'Proveedor no especificado',
                description: purchaseOrderData.description,
                deliveryDate: purchaseOrderData.deliveryDate ? formatDateArgentina(purchaseOrderData.deliveryDate) : null,
                status: purchaseOrderData.status
            }
        });
    }

    // ========================================
    // USUARIOS Y SISTEMA
    // ========================================

    /**
     * Dispara notificación cuando se registra un usuario
     */
    async onUserRegistered(userData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.USER_REGISTERED,
            entityType: 'user',
            entityId: userData.id,
            organizationId: userData.organizationId,
            entityData: {
                userId: userData.id,
                userName: userData.name,
                email: userData.email,
                role: userData.role,
                position: userData.position,
                registrationDate: formatDateArgentina(getCurrentDateArgentina())
            }
        });
    }

    /**
     * Dispara notificación cuando un usuario es marcado como inactivo
     */
    async onUserInactive(userData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.USER_INACTIVE,
            entityType: 'user',
            entityId: userData.id,
            organizationId: userData.organizationId,
            entityData: {
                userId: userData.id,
                userName: userData.name,
                email: userData.email,
                role: userData.role,
                position: userData.position,
                lastActivity: userData.lastLogin || userData.updatedAt,
                deactivatedBy: userData.deactivatedBy?.name || 'Sistema'
            }
        });
    }

    /**
     * Dispara notificación cuando se genera una nómina
     */
    async onPayrollGenerated(payrollData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.PAYROLL_GENERATED,
            entityType: 'payroll',
            entityId: payrollData.id,
            organizationId: payrollData.organizationId,
            entityData: {
                payrollId: payrollData.id,
                employeeName: payrollData.employeeName,
                period: payrollData.period,
                netPay: payrollData.netPay,
                currency: payrollData.currency
            }
        });
    }

    /**
     * Dispara notificación cuando se crea un registro de tiempo
     */
    async onTimeTrackingCreated(timeTrackingData: any): Promise<void> {
        await this.triggerNotification({
            eventType: NotificationEventType.TIME_TRACKING_CREATED,
            entityType: 'timeTracking',
            entityId: timeTrackingData.id,
            organizationId: timeTrackingData.organizationId,
            entityData: {
                timeTrackingId: timeTrackingData.id,
                employeeName: timeTrackingData.employee ? `${timeTrackingData.employee.firstName} ${timeTrackingData.employee.lastName}` : 'Empleado no especificado',
                projectName: timeTrackingData.project?.name || 'Proyecto no asignado',
                date: timeTrackingData.date ? formatDateArgentina(timeTrackingData.date) : formatDateArgentina(getCurrentDateArgentina()),
                hoursWorked: timeTrackingData.hoursWorked,
                workType: timeTrackingData.workType,
                description: timeTrackingData.description
            }
        });
    }

    // ========================================
    // UTILIDADES Y VERIFICACIONES
    // ========================================

    /**
     * Verificar stock bajo y enviar alertas
     */
    async checkStockAlerts(organizationId: string): Promise<void> {
        try {
            const { prisma } = require('../prisma');

            const lowStocks = await prisma.stock.findMany({
                where: {
                    material: {
                        organizationId
                    },
                    available: {
                        lte: prisma.raw('material.minStock')
                    }
                },
                include: {
                    material: true,
                    warehouse: true
                }
            });

            for (const stock of lowStocks) {
                await this.onStockLow(stock);
            }
        } catch (error) {
            console.error('Error checking stock alerts:', error);
        }
    }
}

// Exportar una instancia única
export const notificationTrigger = new NotificationTrigger();
