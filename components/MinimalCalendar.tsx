'use client'

import { useState, useMemo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface CalendarEvent {
    id: string
    title: string
    start: string
    end?: string
    backgroundColor?: string
    borderColor?: string
    textColor?: string
    extendedProps?: {
        description?: string
        project?: string
        assignee?: string
        progress?: number
        status?: string
        priority?: string
        externalLinks?: string[]
    }
}

interface MinimalCalendarProps {
    tasks: any[]
    onTaskClick?: (task: any) => void
    onDateClick?: (dateInfo: any) => void
    onTaskDrop?: (dropInfo: any) => void
}

const MinimalCalendar = ({ tasks, onTaskClick, onDateClick, onTaskDrop }: MinimalCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
    const [draggedTask, setDraggedTask] = useState<any>(null)

    // Convertir tareas a eventos del calendario
    const events = useMemo(() => {
        const calendarEvents: CalendarEvent[] = tasks.map((task) => {
            const getTaskColor = (status: string, priority: string) => {
                if (status === 'completed') return { bg: '#10B981', border: '#059669' }
                if (status === 'in-progress') return { bg: '#3B82F6', border: '#2563EB' }
                if (priority === 'high') return { bg: '#EF4444', border: '#DC2626' }
                if (priority === 'medium') return { bg: '#F59E0B', border: '#D97706' }
                return { bg: '#6B7280', border: '#4B5563' }
            }

            const colors = getTaskColor(task.status || 'pending', task.priority || 'medium')

            return {
                id: task.id,
                title: task.title,
                start: task.startDate || task.createdAt,
                end: task.endDate,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                textColor: '#FFFFFF',
                extendedProps: {
                    description: task.description,
                    project: task.project,
                    assignee: task.assignee,
                    progress: task.progress || 0,
                    status: task.status,
                    priority: task.priority,
                    externalLinks: task.externalLinks || []
                }
            }
        })

        return calendarEvents
    }, [tasks])

    // Obtener días del mes actual
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const days = []

        // Días del mes anterior para completar la primera semana
        for (let i = 0; i < startingDayOfWeek; i++) {
            const prevDate = new Date(year, month, -startingDayOfWeek + i + 1)
            days.push({
                date: prevDate,
                isCurrentMonth: false,
                events: []
            })
        }

        // Días del mes actual
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i)
            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.start)
                return eventDate.toDateString() === date.toDateString()
            })

            days.push({
                date,
                isCurrentMonth: true,
                events: dayEvents
            })
        }

        // Días del mes siguiente para completar la última semana
        const remainingDays = 7 - (days.length % 7)
        if (remainingDays < 7) {
            for (let i = 1; i <= remainingDays; i++) {
                const nextDate = new Date(year, month + 1, i)
                days.push({
                    date: nextDate,
                    isCurrentMonth: false,
                    events: []
                })
            }
        }

        return days
    }

    // Obtener días de la semana actual
    const getDaysInWeek = (date: Date) => {
        const startOfWeek = new Date(date)
        const day = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para que la semana empiece en lunes

        startOfWeek.setDate(diff)

        const days = []
        for (let i = 0; i < 7; i++) {
            const weekDate = new Date(startOfWeek)
            weekDate.setDate(startOfWeek.getDate() + i)

            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.start)
                return eventDate.toDateString() === weekDate.toDateString()
            })

            days.push({
                date: weekDate,
                isCurrentMonth: weekDate.getMonth() === date.getMonth(),
                events: dayEvents
            })
        }

        return days
    }

    const days = viewMode === 'month' ? getDaysInMonth(currentDate) : getDaysInWeek(currentDate)

    // Navegación del calendario
    const navigate = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            if (viewMode === 'month') {
                if (direction === 'prev') {
                    newDate.setMonth(prev.getMonth() - 1)
                } else {
                    newDate.setMonth(prev.getMonth() + 1)
                }
            } else {
                // Vista semanal
                if (direction === 'prev') {
                    newDate.setDate(prev.getDate() - 7)
                } else {
                    newDate.setDate(prev.getDate() + 7)
                }
            }
            return newDate
        })
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'month' ? 'week' : 'month')
    }

    // Manejadores de eventos
    const handleDateClick = (date: Date) => {
        if (onDateClick) {
            onDateClick({ dateStr: date.toISOString().split('T')[0] })
        }
    }

    const handleTaskClick = (task: any, e: React.MouseEvent) => {
        e.stopPropagation()
        if (onTaskClick) {
            onTaskClick(task)
        }
    }

    const handleDragStart = (task: any, e: React.DragEvent) => {
        setDraggedTask(task)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (date: Date, e: React.DragEvent) => {
        e.preventDefault()
        if (draggedTask && onTaskDrop) {
            onTaskDrop({
                taskId: draggedTask.id,
                newStart: date,
                newEnd: date
            })
        }
        setDraggedTask(null)
    }

    // Formatear fechas para el header
    const formatWeekRange = (date: Date) => {
        const startOfWeek = new Date(date)
        const day = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
        startOfWeek.setDate(diff)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)

        const startStr = startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        const endStr = endOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

        return `${startStr} - ${endStr}`
    }

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4 sm:space-x-6">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                                {viewMode === 'month'
                                    ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                                    : `Semana del ${formatWeekRange(currentDate)}`
                                }
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'} programadas
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => navigate('prev')}
                                className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 group"
                            >
                                <ChevronLeftIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                            </button>
                            <button
                                onClick={() => navigate('next')}
                                className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 group"
                            >
                                <ChevronRightIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                        <button
                            onClick={toggleViewMode}
                            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 border w-full sm:w-auto ${viewMode === 'month'
                                ? 'text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300'
                                }`}
                        >
                            {viewMode === 'month' ? 'Semana' : 'Mes'}
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-blue-200 hover:border-blue-300 w-full sm:w-auto"
                        >
                            Hoy
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4 sm:p-6">
                {/* Day Headers - Solo mostrar en vista mensual */}
                {viewMode === 'month' && (
                    <div className="grid grid-cols-7 gap-px mb-2">
                        {dayNames.map((day, index) => (
                            <div key={index} className="p-2 text-center">
                                <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    {day}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Calendar Days */}
                <div className={`grid gap-px bg-gray-100 rounded-xl overflow-hidden ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'
                    }`}>
                    {days.map((day, index) => (
                        <div
                            key={index}
                            className={`
                                ${viewMode === 'month' ? 'min-h-[120px] sm:min-h-[140px]' : 'min-h-[160px] sm:min-h-[180px]'} 
                                bg-white p-2 sm:p-3 cursor-pointer transition-all duration-200
                                ${day.isCurrentMonth ? 'hover:bg-gray-50 hover:shadow-sm' : 'bg-gray-50/50 text-gray-400'}
                                ${day.date.toDateString() === new Date().toDateString() ? 'bg-blue-50/80 border border-blue-200 ring-1 ring-blue-100' : ''}
                                relative group
                            `}
                            onClick={() => handleDateClick(day.date)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(day.date, e)}
                        >
                            {/* Header del día */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                    {viewMode === 'week' && (
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            {dayNames[day.date.getDay()]}
                                        </span>
                                    )}
                                    <span className={`
                                        text-sm font-semibold transition-colors
                                        ${day.date.toDateString() === new Date().toDateString()
                                            ? 'text-blue-700 bg-blue-100 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm shadow-sm'
                                            : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                        }
                                    `}>
                                        {day.date.getDate()}
                                    </span>
                                </div>
                                {day.events.length > 0 && (
                                    <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5 sm:px-2 font-medium">
                                        {day.events.length}
                                    </span>
                                )}
                            </div>

                            {/* Events */}
                            <div className="space-y-1 sm:space-y-1.5">
                                {day.events.slice(0, viewMode === 'month' ? 3 : 5).map((event) => {
                                    const task = tasks.find(t => t.id === event.id)
                                    return (
                                        <div
                                            key={event.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(task, e)}
                                            onClick={(e) => handleTaskClick(task, e)}
                                            className="text-xs p-1.5 sm:p-2 rounded-md cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md border border-transparent hover:border-white/20"
                                            style={{
                                                backgroundColor: event.backgroundColor,
                                                color: event.textColor,
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                            }}
                                            title={`${event.title}\n📁 Proyecto: ${event.extendedProps?.project || 'Sin asignar'}\n👤 Asignado: ${event.extendedProps?.assignee || 'Sin asignar'}\n📊 Progreso: ${event.extendedProps?.progress || 0}%\n🏷️ Estado: ${event.extendedProps?.status || 'Pendiente'}\n⚡ Prioridad: ${event.extendedProps?.priority || 'Media'}${event.extendedProps?.externalLinks && event.extendedProps.externalLinks.length > 0 ? `\n🔗 Enlaces: ${event.extendedProps.externalLinks.length}` : ''}`}
                                        >
                                            <div className="font-semibold truncate leading-tight">
                                                {event.title}
                                            </div>
                                            {event.extendedProps?.project && (
                                                <div className="text-xs opacity-90 truncate leading-tight mt-0.5">
                                                    {event.extendedProps.project}
                                                </div>
                                            )}
                                            {event.extendedProps?.progress !== undefined && event.extendedProps.progress > 0 && (
                                                <div className="mt-1 bg-white/20 rounded-full h-1">
                                                    <div
                                                        className="bg-white/60 h-1 rounded-full transition-all duration-300"
                                                        style={{ width: `${event.extendedProps.progress}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {day.events.length > (viewMode === 'month' ? 3 : 5) && (
                                    <div className="text-xs text-gray-500 px-1.5 py-1 sm:px-2 bg-gray-100 rounded-md font-medium">
                                        +{day.events.length - (viewMode === 'month' ? 3 : 5)} más
                                    </div>
                                )}
                            </div>

                            {/* Hover overlay for better UX */}
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                <div className="flex flex-wrap gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                        <span className="text-gray-600 font-medium">Completadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                        <span className="text-gray-600 font-medium">En Progreso</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                        <span className="text-gray-600 font-medium">Alta Prioridad</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                        <span className="text-gray-600 font-medium">Media Prioridad</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500 shadow-sm"></div>
                        <span className="text-gray-600 font-medium">Baja Prioridad</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MinimalCalendar
