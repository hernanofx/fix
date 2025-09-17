import { notificationTrigger } from '@/lib/email/notificationTrigger';
import { prisma } from '@/lib/prisma';

/**
 * EJEMPLOS DE INTEGRACIÓN DE NUEVAS NOTIFICACIONES
 *
 * Este archivo muestra cómo integrar las nuevas operaciones de notificación
 * en los endpoints existentes del sistema.
 */

// ==========================================
// EJEMPLO 1: Proyecto Actualizado
// ==========================================

export async function updateProject(projectId: string, updateData: any) {
    try {
        // Lógica de actualización del proyecto
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                organization: { select: { id: true, name: true } }
            }
        });

        // 🚀 Disparar notificación de proyecto actualizado
        try {
            await notificationTrigger.onProjectUpdated({
                ...updatedProject,
                organizationId: updatedProject.organizationId,
                updatedBy: updatedProject.createdBy
            });
            console.log('Project update notification sent');
        } catch (notificationError) {
            console.error('Error sending project update notification:', notificationError);
        }

        return updatedProject;
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
}

// ==========================================
// EJEMPLO 2: Empleado Actualizado
// ==========================================

export async function updateEmployee(employeeId: string, updateData: any) {
    try {
        // Lógica de actualización del empleado
        const updatedEmployee = await prisma.employee.update({
            where: { id: employeeId },
            data: updateData,
            include: {
                createdBy: { select: { id: true, name: true, email: true } }
            }
        });

        // 🚀 Disparar notificación de empleado actualizado
        try {
            await notificationTrigger.onEmployeeUpdated({
                ...updatedEmployee,
                organizationId: updatedEmployee.organizationId,
                updatedBy: updatedEmployee.createdBy
            });
            console.log('Employee update notification sent');
        } catch (notificationError) {
            console.error('Error sending employee update notification:', notificationError);
        }

        return updatedEmployee;
    } catch (error) {
        console.error('Error updating employee:', error);
        throw error;
    }
}

// ==========================================
// EJEMPLO 3: Tarea Completada
// ==========================================

export async function completeTask(taskId: string) {
    try {
        // Lógica de completar tarea
        const completedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                status: 'COMPLETED',
                progress: 100,
                updatedAt: new Date()
            },
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                project: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true, email: true } }
            }
        });

        // 🚀 Disparar notificación de tarea completada
        try {
            await notificationTrigger.onTaskCompleted({
                ...completedTask,
                organizationId: completedTask.organizationId
            });
            console.log('Task completion notification sent');
        } catch (notificationError) {
            console.error('Error sending task completion notification:', notificationError);
        }

        return completedTask;
    } catch (error) {
        console.error('Error completing task:', error);
        throw error;
    }
}

// ==========================================
// EJEMPLO 4: Usuario Inactivo
// ==========================================

export async function deactivateUser(userId: string, deactivatedById: string) {
    try {
        // Lógica de desactivar usuario
        const deactivatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                status: 'INACTIVE',
                updatedAt: new Date()
            },
            include: {
                organization: { select: { id: true, name: true } }
            }
        });

        const deactivatedBy = await prisma.user.findUnique({
            where: { id: deactivatedById },
            select: { id: true, name: true, email: true }
        });

        // 🚀 Disparar notificación de usuario inactivo
        try {
            await notificationTrigger.onUserInactive({
                ...deactivatedUser,
                organizationId: deactivatedUser.organizationId,
                deactivatedBy: deactivatedBy
            });
            console.log('User deactivation notification sent');
        } catch (notificationError) {
            console.error('Error sending user deactivation notification:', notificationError);
        }

        return deactivatedUser;
    } catch (error) {
        console.error('Error deactivating user:', error);
        throw error;
    }
}

// ==========================================
// EJEMPLO 5: Sistema de Alertas Automáticas
// ==========================================

export class AlertSystem {
    /**
     * Verificar facturas vencidas y enviar alertas
     */
    static async checkOverdueBills(organizationId: string): Promise<void> {
        try {
            const overdueBills = await prisma.bill.findMany({
                where: {
                    organizationId,
                    status: { in: ['PENDING', 'PARTIAL'] },
                    dueDate: {
                        lt: new Date()
                    }
                },
                include: {
                    client: { select: { id: true, name: true } },
                    organization: { select: { id: true, name: true } }
                }
            });

            for (const bill of overdueBills) {
                try {
                    await notificationTrigger.onBillOverdue({
                        ...bill,
                        organizationId
                    });
                    console.log(`Overdue bill alert sent for: ${bill.number}`);
                } catch (error) {
                    console.error(`Error sending overdue alert for bill ${bill.number}:`, error);
                }
            }
        } catch (error) {
            console.error('Error checking overdue bills:', error);
        }
    }

    /**
     * Verificar pagos vencidos y enviar alertas
     */
    static async checkOverduePayments(organizationId: string): Promise<void> {
        try {
            const overduePayments = await prisma.payment.findMany({
                where: {
                    organizationId,
                    status: 'PENDING',
                    dueDate: {
                        lt: new Date()
                    }
                },
                include: {
                    client: { select: { id: true, name: true } }
                }
            });

            for (const payment of overduePayments) {
                try {
                    await notificationTrigger.onPaymentOverdue({
                        ...payment,
                        organizationId
                    });
                    console.log(`Overdue payment alert sent for payment: ${payment.id}`);
                } catch (error) {
                    console.error(`Error sending overdue alert for payment ${payment.id}:`, error);
                }
            }
        } catch (error) {
            console.error('Error checking overdue payments:', error);
        }
    }

    /**
     * Verificar tareas vencidas y enviar alertas
     */
    static async checkOverdueTasks(organizationId: string): Promise<void> {
        try {
            const overdueTasks = await prisma.task.findMany({
                where: {
                    organizationId,
                    status: { not: 'COMPLETED' },
                    endDate: {
                        lt: new Date()
                    }
                },
                include: {
                    assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                    project: { select: { id: true, name: true } }
                }
            });

            for (const task of overdueTasks) {
                try {
                    await notificationTrigger.onTaskOverdue({
                        ...task,
                        organizationId
                    });
                    console.log(`Overdue task alert sent for: ${task.title}`);
                } catch (error) {
                    console.error(`Error sending overdue alert for task ${task.title}:`, error);
                }
            }
        } catch (error) {
            console.error('Error checking overdue tasks:', error);
        }
    }

    /**
     * Ejecutar todas las verificaciones de alertas
     */
    static async runAllChecks(organizationId: string): Promise<void> {
        console.log('Running alert system checks for organization:', organizationId);

        await Promise.all([
            this.checkOverdueBills(organizationId),
            this.checkOverduePayments(organizationId),
            this.checkOverdueTasks(organizationId)
        ]);

        console.log('Alert system checks completed');
    }
}

// ==========================================
// EJEMPLO 7: Proyecto Completado
// ==========================================

export async function completeProject(projectId: string) {
    try {
        // Lógica de completar proyecto
        const completedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                status: 'COMPLETED',
                progress: 100,
                updatedAt: new Date()
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                organization: { select: { id: true, name: true } }
            }
        });

        // 🚀 Disparar notificación de proyecto completado
        try {
            await notificationTrigger.onProjectCompleted({
                ...completedProject,
                organizationId: completedProject.organizationId
            });
            console.log('Project completion notification sent');
        } catch (notificationError) {
            console.error('Error sending project completion notification:', notificationError);
        }

        return completedProject;
    } catch (error) {
        console.error('Error completing project:', error);
        throw error;
    }
}

// ==========================================
// EJEMPLO 8: Advertencia de Presupuesto
// ==========================================

export async function checkBudgetWarnings(organizationId: string) {
    try {
        // Obtener presupuestos que estén al 80% o más de su límite
        const budgets = await prisma.budget.findMany({
            where: {
                organizationId,
                status: 'ACTIVE'
            },
            include: {
                project: { select: { id: true, name: true } },
                items: true
            }
        });

        for (const budget of budgets) {
            // Calcular gasto total basado en los items del presupuesto
            const totalSpent = budget.items.reduce((sum, item) => sum + item.cost, 0);
            const spent = totalSpent;
            const warningThreshold = budget.totalAmount * 0.8; // 80% del presupuesto

            if (spent >= warningThreshold && spent < budget.totalAmount) {
                try {
                    await notificationTrigger.onBudgetWarning({
                        id: budget.id,
                        name: budget.name,
                        totalAmount: budget.totalAmount,
                        spent: spent,
                        organizationId,
                        project: budget.project
                    });
                    console.log(`Budget warning sent for: ${budget.name}`);
                } catch (error) {
                    console.error(`Error sending budget warning for ${budget.name}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error checking budget warnings:', error);
    }
}

// ==========================================
// EJEMPLO 9: Tarea Asignada
// ==========================================

export async function assignTask(taskId: string, assigneeId: string) {
    try {
        // Lógica de asignar tarea
        const assignedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                assigneeId: assigneeId,
                status: 'IN_PROGRESS',
                updatedAt: new Date()
            },
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                project: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true, email: true } }
            }
        });

        // 🚀 Disparar notificación de tarea asignada
        try {
            await notificationTrigger.onTaskAssigned({
                ...assignedTask,
                organizationId: assignedTask.organizationId,
                assigneeName: assignedTask.assignee ? `${assignedTask.assignee.firstName} ${assignedTask.assignee.lastName}` : 'No asignado'
            });
            console.log('Task assignment notification sent');
        } catch (notificationError) {
            console.error('Error sending task assignment notification:', notificationError);
        }

        return assignedTask;
    } catch (error) {
        console.error('Error assigning task:', error);
        throw error;
    }
}

// ==========================================
// EJEMPLO 10: Registro de Usuario
// ==========================================

export async function registerUser(userData: any) {
    try {
        // Lógica de registro de usuario
        const newUser = await prisma.user.create({
            data: {
                ...userData,
                status: 'ACTIVE',
                emailVerified: new Date()
            },
            include: {
                organization: { select: { id: true, name: true } }
            }
        });

        // 🚀 Disparar notificación de usuario registrado
        try {
            await notificationTrigger.onUserRegistered({
                ...newUser,
                organizationId: newUser.organizationId,
                registrationDate: new Date().toLocaleDateString()
            });
            console.log('User registration notification sent');
        } catch (notificationError) {
            console.error('Error sending user registration notification:', notificationError);
        }

        return newUser;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}

// ==========================================
// EJEMPLO 11: Registro de Proveedor
// ==========================================

export async function createProvider(providerData: any, createdById: string) {
    try {
        // Lógica de crear proveedor
        const newProvider = await prisma.provider.create({
            data: providerData,
            include: {
                createdBy: { select: { id: true, name: true, email: true } }
            }
        });

        const createdBy = await prisma.user.findUnique({
            where: { id: createdById },
            select: { id: true, name: true, email: true }
        });

        // 🚀 Disparar notificación de proveedor creado
        try {
            await notificationTrigger.onProviderCreated({
                ...newProvider,
                organizationId: newProvider.organizationId,
                createdBy: createdBy?.name || 'Sistema'
            });
            console.log('Provider creation notification sent');
        } catch (notificationError) {
            console.error('Error sending provider creation notification:', notificationError);
        }

        return newProvider;
    } catch (error) {
        console.error('Error creating provider:', error);
        throw error;
    }
}

// ==========================================
// EJEMPLO 12: Registro de Tiempo
// ==========================================

export async function createTimeTracking(timeTrackingData: any) {
    try {
        // Lógica de crear registro de tiempo
        const newTimeTracking = await prisma.timeTracking.create({
            data: timeTrackingData,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                project: { select: { id: true, name: true } }
            }
        });

        // 🚀 Disparar notificación de tiempo registrado
        try {
            await notificationTrigger.onTimeTrackingCreated({
                ...newTimeTracking,
                organizationId: newTimeTracking.organizationId,
                employeeName: newTimeTracking.employee ? `${newTimeTracking.employee.firstName} ${newTimeTracking.employee.lastName}` : 'Empleado no especificado',
                date: new Date(newTimeTracking.date).toLocaleDateString()
            });
            console.log('Time tracking creation notification sent');
        } catch (notificationError) {
            console.error('Error sending time tracking creation notification:', notificationError);
        }

        return newTimeTracking;
    } catch (error) {
        console.error('Error creating time tracking:', error);
        throw error;
    }
}

// ==========================================
// EJEMPLO 13: Inspección Programada
// ==========================================

export async function scheduleInspection(inspectionData: any) {
    try {
        // Lógica de programar inspección
        const newInspection = await prisma.inspection.create({
            data: {
                ...inspectionData,
                status: 'SCHEDULED'
            },
            include: {
                project: { select: { id: true, name: true } },
                inspectedBy: { select: { id: true, name: true, email: true } }
            }
        });

        // 🚀 Disparar notificación de inspección programada
        try {
            await notificationTrigger.onInspectionScheduled({
                ...newInspection,
                organizationId: newInspection.organizationId,
                scheduledDate: newInspection.scheduledDate ? new Date(newInspection.scheduledDate).toLocaleDateString() : 'No programada'
            });
            console.log('Inspection scheduling notification sent');
        } catch (notificationError) {
            console.error('Error sending inspection scheduling notification:', notificationError);
        }

        return newInspection;
    } catch (error) {
        console.error('Error scheduling inspection:', error);
        throw error;
    }
}

// ==========================================
// EJEMPLO 14: Orden de Compra
// ==========================================

export async function createPurchaseOrder(purchaseOrderData: any) {
    try {
        // Lógica de crear orden de compra
        const newPurchaseOrder = await prisma.purchaseOrder.create({
            data: purchaseOrderData,
            include: {
                provider: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true, email: true } }
            }
        });

        // 🚀 Disparar notificación de orden de compra creada
        try {
            await notificationTrigger.onPurchaseOrderCreated({
                ...newPurchaseOrder,
                organizationId: newPurchaseOrder.organizationId,
                number: `PO-${newPurchaseOrder.id.slice(-6).toUpperCase()}`,
                deliveryDate: newPurchaseOrder.deliveryDate ? new Date(newPurchaseOrder.deliveryDate).toLocaleDateString() : null
            });
            console.log('Purchase order creation notification sent');
        } catch (notificationError) {
            console.error('Error sending purchase order creation notification:', notificationError);
        }

        return newPurchaseOrder;
    } catch (error) {
        console.error('Error creating purchase order:', error);
        throw error;
    }
}

// ==========================================
// EJEMPLO 15: Nómina Generada
// ==========================================

export async function generatePayroll(employeeId: string, period: string, salaryData: any) {
    try {
        // Lógica de generar nómina
        const payroll = await prisma.payroll.create({
            data: {
                employeeId,
                period,
                ...salaryData,
                status: 'GENERATED',
                updatedAt: new Date()
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } }
            }
        });

        // 🚀 Disparar notificación de nómina generada
        try {
            await notificationTrigger.onPayrollGenerated({
                ...payroll,
                organizationId: payroll.organizationId,
                employeeName: payroll.employee ? `${payroll.employee.firstName} ${payroll.employee.lastName}` : payroll.employeeName || 'Empleado no especificado',
                netPay: salaryData.netPay,
                currency: salaryData.currency || 'COP'
            });
            console.log('Payroll generation notification sent');
        } catch (notificationError) {
            console.error('Error sending payroll generation notification:', notificationError);
        }

        return payroll;
    } catch (error) {
        console.error('Error generating payroll:', error);
        throw error;
    }
}
