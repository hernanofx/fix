declare module 'frappe-gantt' {
    interface Task {
        id: string
        name: string
        start: string
        end: string
        progress: number
        dependencies?: string
        custom_class?: string
        task_data?: any
    }

    interface GanttOptions {
        header_height?: number
        column_width?: number
        step?: number
        view_modes?: string[]
        bar_height?: number
        bar_corner_radius?: number
        arrow_curve?: number
        padding?: number
        view_mode?: string
        date_format?: string
        popup_trigger?: string
        language?: string
        readonly?: boolean
        custom_popup_html?: (task: Task) => string
        on_click?: (task: Task) => void
        on_date_change?: (task: Task, start: Date, end: Date) => void
        on_progress_change?: (task: Task, progress: number) => void
        on_view_change?: (mode: string) => void
    }

    class Gantt {
        constructor(element: HTMLElement, tasks: Task[], options?: GanttOptions)
        change_view_mode(mode: string): void
        refresh(tasks: Task[]): void
    }

    export default Gantt
}