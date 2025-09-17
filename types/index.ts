// types/index.ts
export interface DashboardData {
    metrics: {
        activeProjects: number
        monthlyRevenueByCurrency: {
            PESOS: number
            USD: number
            EUR: number
        }
        monthlyExpenseByCurrency: {
            PESOS: number
            USD: number
            EUR: number
        }
        activeEmployees: number
        employeesOnSite: number
    }
    alerts: {
        total: number
        overdueInvoices: number
        overdueCollections: number
        overduePaymentTerms: number
        pendingInspections: number
        pendingTasks: number
    }
    recentProjects: Array<{
        id: string
        name: string
        status: string
        progress: number
        inspectionsCount: number
        timeTrackingCount: number
        invoicesCount: number
    }>
    tasks: Array<{
        id: string
        employeeName: string
        employeePosition: string
        projectName: string
        role: string
        startDate: string
        endDate: string | null
        hoursPerWeek: number
        status: string
    }>
    planningTasks: Array<{
        id: string
        title: string
        description: string
        startDate: string | null
        endDate: string | null
        estimatedHours: number
        progress: number
        priority: string
        status: string
        projectName: string | null
        assigneeName: string | null
        rubroName: string | null
    }>
    charts: {
        projectProgress: Array<{
            name: string
            progress: number
        }>
        monthlyRevenues: Array<{
            month: string
            revenue: number
            consumedByCurrency: {
                PESOS: number
                USD: number
                EUR: number
            }
            budgeted: number
            budgetedByCurrency: {
                PESOS: number
                USD: number
                EUR: number
            }
        }>
        expensesByCategory: {
            labels: string[]
            data: number[]
            colors: string[]
            total: number
        }
    }
}
