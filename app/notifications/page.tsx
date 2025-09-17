'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Bell, BellOff, Settings, CheckCircle, XCircle, Loader2, FolderOpen, DollarSign, FileText, CreditCard, Users, Clock, Wrench, User, Truck, Calculator, PiggyBank, Package, UserCheck, RotateCcw, Zap, Target, Info, Shield, Filter } from 'lucide-react';

interface Project {
    id: string;
    name: string;
}

interface NotificationConfig {
    id: string;
    eventType: string;
    isEnabled: boolean;
    projectId?: string;
    module: string;
}

interface NotificationModule {
    id: string;
    name: string;
    description: string;
    events: {
        type: string;
        name: string;
        description: string;
    }[];
}

const notificationModules: NotificationModule[] = [
    {
        id: 'projects',
        name: 'Proyectos',
        description: 'Notificaciones relacionadas con la gestión de proyectos',
        events: [
            { type: 'PROJECT_CREATED', name: 'Proyecto Creado', description: 'Cuando se crea un nuevo proyecto' },
            { type: 'PROJECT_UPDATED', name: 'Proyecto Actualizado', description: 'Cuando se actualiza un proyecto existente' },
            { type: 'PROJECT_COMPLETED', name: 'Proyecto Completado', description: 'Cuando se marca un proyecto como completado' },
        ]
    },
    {
        id: 'budgets',
        name: 'Presupuestos',
        description: 'Notificaciones sobre presupuestos y gastos',
        events: [
            { type: 'BUDGET_CREATED', name: 'Presupuesto Creado', description: 'Cuando se crea un nuevo presupuesto' },
            { type: 'BUDGET_EXCEEDED', name: 'Presupuesto Excedido', description: 'Cuando se supera el límite de un presupuesto' },
            { type: 'BUDGET_WARNING', name: 'Advertencia de Presupuesto', description: 'Cuando el gasto supera el 80% del presupuesto' },
        ]
    },
    {
        id: 'invoices',
        name: 'Facturación',
        description: 'Notificaciones sobre facturas y pagos',
        events: [
            { type: 'INVOICE_CREATED', name: 'Factura Creada', description: 'Cuando se genera una nueva factura' },
            { type: 'INVOICE_PAID', name: 'Factura Pagada', description: 'Cuando una factura es completamente pagada' },
            { type: 'INVOICE_OVERDUE', name: 'Factura Vencida', description: 'Cuando una factura está vencida' },
        ]
    },
    {
        id: 'payments',
        name: 'Pagos',
        description: 'Notificaciones sobre pagos y cobranzas',
        events: [
            { type: 'PAYMENT_RECEIVED', name: 'Pago Recibido', description: 'Cuando se registra un nuevo pago' },
            { type: 'PAYMENT_OVERDUE', name: 'Pago Vencido', description: 'Cuando un pago está vencido' },
        ]
    },
    {
        id: 'employees',
        name: 'Empleados',
        description: 'Notificaciones sobre gestión de personal',
        events: [
            { type: 'EMPLOYEE_CREATED', name: 'Empleado Registrado', description: 'Cuando se registra un nuevo empleado' },
            { type: 'EMPLOYEE_UPDATED', name: 'Empleado Actualizado', description: 'Cuando se actualiza la información de un empleado' },
            { type: 'TIME_TRACKING_CREATED', name: 'Registro de Tiempo', description: 'Cuando se registra tiempo de trabajo' },
        ]
    },
    {
        id: 'tasks',
        name: 'Tareas',
        description: 'Notificaciones sobre gestión de tareas',
        events: [
            { type: 'TASK_ASSIGNED', name: 'Tarea Asignada', description: 'Cuando se asigna una tarea a un empleado' },
            { type: 'TASK_COMPLETED', name: 'Tarea Completada', description: 'Cuando se marca una tarea como completada' },
            { type: 'TASK_OVERDUE', name: 'Tarea Vencida', description: 'Cuando una tarea está vencida' },
        ]
    },
    {
        id: 'inspections',
        name: 'Inspecciones',
        description: 'Notificaciones sobre inspecciones y evaluaciones',
        events: [
            { type: 'INSPECTION_SCHEDULED', name: 'Inspección Programada', description: 'Cuando se programa una nueva inspección' },
            { type: 'INSPECTION_COMPLETED', name: 'Inspección Completada', description: 'Cuando se completa una inspección' },
        ]
    },
    {
        id: 'clients',
        name: 'Clientes',
        description: 'Notificaciones sobre gestión de clientes',
        events: [
            { type: 'CLIENT_CREATED', name: 'Cliente Registrado', description: 'Cuando se registra un nuevo cliente' },
        ]
    },
    {
        id: 'providers',
        name: 'Proveedores',
        description: 'Notificaciones sobre proveedores y compras',
        events: [
            { type: 'PROVIDER_CREATED', name: 'Proveedor Registrado', description: 'Cuando se registra un nuevo proveedor' },
            { type: 'PURCHASE_ORDER_CREATED', name: 'Orden de Compra', description: 'Cuando se crea una nueva orden de compra' },
        ]
    },
    {
        id: 'collections',
        name: 'Cobranzas',
        description: 'Notificaciones sobre cobranzas y pagos',
        events: [
            { type: 'COLLECTION_CREATED', name: 'Cobranza Registrada', description: 'Cuando se registra una nueva cobranza' },
        ]
    },
    {
        id: 'payrolls',
        name: 'Nóminas',
        description: 'Notificaciones sobre nóminas y salarios',
        events: [
            { type: 'PAYROLL_GENERATED', name: 'Nómina Generada', description: 'Cuando se genera una nueva nómina' },
        ]
    },
    {
        id: 'stock',
        name: 'Inventario',
        description: 'Notificaciones sobre stock y materiales',
        events: [
            { type: 'STOCK_LOW', name: 'Stock Bajo', description: 'Cuando un material tiene stock por debajo del mínimo' },
        ]
    },
    {
        id: 'users',
        name: 'Usuarios',
        description: 'Notificaciones sobre gestión de usuarios',
        events: [
            { type: 'USER_REGISTERED', name: 'Usuario Registrado', description: 'Cuando se registra un nuevo usuario' },
            { type: 'USER_INACTIVE', name: 'Usuario Inactivo', description: 'Cuando un usuario es marcado como inactivo' },
        ]
    }
];

const getModuleIcon = (moduleId: string) => {
    const icons = {
        projects: FolderOpen,
        budgets: DollarSign,
        invoices: FileText,
        payments: CreditCard,
        employees: Users,
        tasks: Clock,
        inspections: Wrench,
        clients: User,
        providers: Truck,
        collections: Calculator,
        payrolls: PiggyBank,
        stock: Package,
        users: UserCheck
    };

    const IconComponent = icons[moduleId as keyof typeof icons] || Settings;
    return IconComponent;
};

export default function NotificationsPage() {
    const { data: session } = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [configurations, setConfigurations] = useState<NotificationConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string>('all');
    const [selectedModule, setSelectedModule] = useState<string>('all');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [bulkAction, setBulkAction] = useState(false);

    const organizationId = (session?.user as any)?.organizationId;

    useEffect(() => {
        if (organizationId) {
            loadProjects();
            loadConfigurations();
        }
    }, [organizationId]);

    const loadProjects = async () => {
        try {
            const response = await fetch(`/api/projects?organizationId=${organizationId}`);
            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const loadConfigurations = async () => {
        try {
            const response = await fetch(`/api/notifications?organizationId=${organizationId}&action=getConfigs`);
            if (response.ok) {
                const data: NotificationConfig[] = await response.json();
                console.log('Configuraciones cargadas:', data.length, 'configuraciones');
                setConfigurations(data);
            } else {
                console.error('Error loading configurations:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error loading configurations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleNotification = async (eventType: string, module: string, projectId?: string) => {
        setSaving(true);
        try {
            const existing = configurations.find(c =>
                c.eventType === eventType &&
                c.module === module &&
                c.projectId === (projectId || null)
            );

            const newEnabledState = !existing?.isEnabled;

            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'configure',
                    organizationId,
                    eventType,
                    module,
                    projectId: projectId || null,
                    enabled: newEnabledState,
                    recipients: [(session?.user as any)?.email]
                })
            });

            if (response.ok) {
                await loadConfigurations();
            }
        } catch (error) {
            console.error('Error updating notification:', error);
        } finally {
            setSaving(false);
        }
    };

    const isNotificationEnabled = (eventType: string, module: string, projectId?: string) => {
        if (!projectId) {
            const config = configurations.find(c =>
                c.eventType === eventType &&
                c.module === module &&
                c.projectId === null
            );
            return config ? config.isEnabled : false;
        }

        const config = configurations.find(c =>
            c.eventType === eventType &&
            c.module === module &&
            c.projectId === projectId
        );
        return config ? config.isEnabled : false;
    };

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    const handleBulkToggle = async (enableAll: boolean) => {
        setBulkAction(true);
        setSaving(true);

        try {
            const promises = [];

            for (const module of filteredModules) {
                for (const event of module.events) {
                    if (selectedProject === 'all') {
                        promises.push(
                            fetch('/api/notifications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    action: 'configure',
                                    organizationId,
                                    eventType: event.type,
                                    module: module.id,
                                    projectId: null,
                                    enabled: enableAll,
                                    recipients: [(session?.user as any)?.email]
                                })
                            })
                        );
                    } else {
                        promises.push(
                            fetch('/api/notifications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    action: 'configure',
                                    organizationId,
                                    eventType: event.type,
                                    module: module.id,
                                    projectId: selectedProject,
                                    enabled: enableAll,
                                    recipients: [(session?.user as any)?.email]
                                })
                            })
                        );
                    }
                }
            }

            await Promise.all(promises);
            await loadConfigurations();
        } catch (error) {
            console.error('Error in bulk toggle:', error);
        } finally {
            setBulkAction(false);
            setSaving(false);
        }
    };

    const handleSmartConfig = async () => {
        setBulkAction(true);
        setSaving(true);

        try {
            const promises = [];
            const criticalEvents = [
                'PROJECT_CREATED', 'PROJECT_COMPLETED', 'BUDGET_EXCEEDED',
                'INVOICE_OVERDUE', 'PAYMENT_OVERDUE', 'EMPLOYEE_CREATED'
            ];

            for (const module of filteredModules) {
                for (const event of module.events) {
                    const isCritical = criticalEvents.includes(event.type);
                    const shouldEnable = isCritical;

                    if (selectedProject === 'all') {
                        promises.push(
                            fetch('/api/notifications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    action: 'configure',
                                    organizationId,
                                    eventType: event.type,
                                    module: module.id,
                                    projectId: null,
                                    enabled: shouldEnable,
                                    recipients: [(session?.user as any)?.email]
                                })
                            })
                        );
                    } else {
                        promises.push(
                            fetch('/api/notifications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    action: 'configure',
                                    organizationId,
                                    eventType: event.type,
                                    module: module.id,
                                    projectId: selectedProject,
                                    enabled: shouldEnable,
                                    recipients: [(session?.user as any)?.email]
                                })
                            })
                        );
                    }
                }
            }

            await Promise.all(promises);
            await loadConfigurations();
        } catch (error) {
            console.error('Error in smart config:', error);
        } finally {
            setBulkAction(false);
            setSaving(false);
        }
    };

    const handleResetToDefault = async () => {
        setBulkAction(true);
        setSaving(true);

        try {
            const promises = [];

            for (const module of filteredModules) {
                for (const event of module.events) {
                    if (selectedProject === 'all') {
                        promises.push(
                            fetch('/api/notifications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    action: 'configure',
                                    organizationId,
                                    eventType: event.type,
                                    module: module.id,
                                    projectId: null,
                                    enabled: false,
                                    recipients: [(session?.user as any)?.email]
                                })
                            })
                        );
                    } else {
                        promises.push(
                            fetch('/api/notifications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    action: 'configure',
                                    organizationId,
                                    eventType: event.type,
                                    module: module.id,
                                    projectId: selectedProject,
                                    enabled: false,
                                    recipients: [(session?.user as any)?.email]
                                })
                            })
                        );
                    }
                }
            }

            await Promise.all(promises);
            await loadConfigurations();
        } catch (error) {
            console.error('Error in reset to default:', error);
        } finally {
            setBulkAction(false);
            setSaving(false);
        }
    };

    const filteredModules = selectedModule === 'all' ? notificationModules :
        notificationModules.filter(m => m.id === selectedModule);

    if (loading) {
        return (
            <Layout title="Configuración de Notificaciones" subtitle="Gestiona las notificaciones por email">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Cargando configuraciones...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Notificaciones" subtitle="Configura qué eventos quieres recibir por email">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Indicador de progreso */}
                {(saving || bulkAction) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            <div>
                                <p className="text-sm font-medium text-blue-900">
                                    {bulkAction ? 'Aplicando cambios...' : 'Guardando configuración...'}
                                </p>
                                <p className="text-xs text-blue-700">Los cambios se aplican automáticamente</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filtros principales */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Filtros</h2>
                            <p className="text-sm text-gray-600 mt-1">Selecciona el alcance de las configuraciones</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                            <div>{filteredModules.length} módulo{filteredModules.length !== 1 ? 's' : ''}</div>
                            <div>{filteredModules.reduce((total, module) => total + module.events.length, 0)} eventos</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Proyecto
                            </label>
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                                <option value="all">Todos los proyectos</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Módulo
                            </label>
                            <select
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                                <option value="all">Todos los módulos</option>
                                {notificationModules.map(module => (
                                    <option key={module.id} value={module.id}>
                                        {module.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Acciones rápidas */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Acciones rápidas</h2>
                            <p className="text-sm text-gray-600 mt-1">Configuraciones masivas para el filtro actual</p>
                        </div>
                        <div className="text-sm text-gray-600">
                            {filteredModules.reduce((enabled, module) => {
                                return enabled + module.events.reduce((count, event) => {
                                    const isGeneralEnabled = isNotificationEnabled(event.type, module.id);
                                    const projectSpecificEnabled = selectedProject !== 'all'
                                        ? isNotificationEnabled(event.type, module.id, selectedProject)
                                        : projects.some(p => isNotificationEnabled(event.type, module.id, p.id));
                                    return count + (isGeneralEnabled || projectSpecificEnabled ? 1 : 0);
                                }, 0);
                            }, 0)} de {filteredModules.reduce((total, module) => total + module.events.length, 0)} activas
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button
                            onClick={() => handleBulkToggle(true)}
                            disabled={saving || bulkAction}
                            className="h-20 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                            {bulkAction ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <CheckCircle className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">Habilitar todo</span>
                        </Button>

                        <Button
                            onClick={() => handleBulkToggle(false)}
                            disabled={saving || bulkAction}
                            variant="outline"
                            className="h-20 flex flex-col items-center justify-center space-y-2 border-red-300 text-red-700 hover:bg-red-50"
                        >
                            {bulkAction ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <XCircle className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">Deshabilitar todo</span>
                        </Button>

                        <Button
                            onClick={() => handleSmartConfig()}
                            disabled={saving || bulkAction}
                            variant="outline"
                            className="h-20 flex flex-col items-center justify-center space-y-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                            <Settings className="w-5 h-5" />
                            <span className="text-sm font-medium">Solo críticas</span>
                        </Button>

                        <Button
                            onClick={() => handleResetToDefault()}
                            disabled={saving || bulkAction}
                            variant="outline"
                            className="h-20 flex flex-col items-center justify-center space-y-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            <RotateCcw className="w-5 h-5" />
                            <span className="text-sm font-medium">Restaurar</span>
                        </Button>
                    </div>
                </div>

                {/* Configuraciones por módulo */}
                <div className="space-y-4">
                    {filteredModules.map(module => {
                        const isExpanded = expandedModules.has(module.id);
                        const enabledCount = module.events.reduce((count, event) => {
                            const isGeneralEnabled = isNotificationEnabled(event.type, module.id);
                            const projectSpecificEnabled = selectedProject !== 'all'
                                ? isNotificationEnabled(event.type, module.id, selectedProject)
                                : projects.some(p => isNotificationEnabled(event.type, module.id, p.id));

                            return count + (isGeneralEnabled || projectSpecificEnabled ? 1 : 0);
                        }, 0);

                        return (
                            <div key={module.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                            {React.createElement(getModuleIcon(module.id), {
                                                className: "w-6 h-6 text-blue-600"
                                            })}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-semibold text-gray-900">{module.name}</h3>
                                            <p className="text-sm text-gray-600">{module.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900">
                                                {enabledCount} de {module.events.length}
                                            </div>
                                            <div className="text-xs text-gray-500">notificaciones activas</div>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-gray-100">
                                        <div className="p-6 space-y-4">
                                            {module.events.map(event => (
                                                <div key={event.type} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{event.name}</h4>
                                                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {/* Configuración general */}
                                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                                            <div className="flex items-center space-x-3">
                                                                <Bell className="w-4 h-4 text-gray-400" />
                                                                <div>
                                                                    <span className="text-sm font-medium text-gray-900">Todos los proyectos</span>
                                                                    <p className="text-xs text-gray-500">Configuración general</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleToggleNotification(event.type, module.id)}
                                                                disabled={saving}
                                                                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${isNotificationEnabled(event.type, module.id)
                                                                        ? 'bg-blue-600'
                                                                        : 'bg-gray-300'
                                                                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isNotificationEnabled(event.type, module.id)
                                                                        ? 'translate-x-6'
                                                                        : 'translate-x-1'
                                                                    }`} />
                                                            </button>
                                                        </div>

                                                        {/* Configuración por proyecto específico */}
                                                        {projects
                                                            .filter(project =>
                                                                selectedProject === 'all' ||
                                                                project.id === selectedProject
                                                            )
                                                            .slice(0, selectedProject === 'all' ? 3 : undefined)
                                                            .map(project => (
                                                                <div key={project.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                                                    <div className="flex items-center space-x-3">
                                                                        <Settings className="w-4 h-4 text-gray-400" />
                                                                        <div>
                                                                            <span className="text-sm font-medium text-gray-900">{project.name}</span>
                                                                            <p className="text-xs text-gray-500">Configuración específica</p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleToggleNotification(event.type, module.id, project.id)}
                                                                        disabled={saving}
                                                                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${isNotificationEnabled(event.type, module.id, project.id)
                                                                                ? 'bg-blue-600'
                                                                                : 'bg-gray-300'
                                                                            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isNotificationEnabled(event.type, module.id, project.id)
                                                                                ? 'translate-x-6'
                                                                                : 'translate-x-1'
                                                                            }`} />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                        {selectedProject === 'all' && projects.length > 3 && (
                                                            <div className="text-center py-2">
                                                                <span className="text-xs text-gray-500">
                                                                    ... y {projects.length - 3} proyectos más
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Información del sistema */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del sistema</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">Estado del sistema</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Sistema operativo 24/7</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Notificaciones por email activas</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Configuración por defecto: Deshabilitado</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">Configuración</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div>📧 Email: {(session?.user as any)?.email}</div>
                                <div>🏢 Organización: Solo tu organización</div>
                                <div>⚡ Aplicación: Cambios inmediatos</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}