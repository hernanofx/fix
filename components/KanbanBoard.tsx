"use client"

import React from 'react'

interface Task {
    id: string
    title: string
    description?: string
    project?: string
    rubro?: string
    startDate?: string
    endDate?: string
    progress?: number
    status?: string
    assignee?: string
    priority?: string
    estimatedHours?: number
    notes?: string
    externalLinks?: string[]
}

interface KanbanBoardProps {
    tasks: Task[]
    onStatusChange: (taskId: string, newStatus: string, opts?: { progress?: number }) => Promise<void>
    onEdit: (task?: Task) => void
    onCreate: () => void
}

const STATUS_COLUMNS: { key: string; label: string; color: string; bgColor: string; borderColor: string }[] = [
    {
        key: 'PENDING',
        label: 'Pendiente',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
    },
    {
        key: 'IN_PROGRESS',
        label: 'En Progreso',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
    },
    {
        key: 'COMPLETED',
        label: 'Completado',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200'
    },
    {
        key: 'CANCELLED',
        label: 'Cancelado',
        color: 'text-slate-700',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200'
    }
]

function normalizeStatus(s?: string) {
    if (!s) return 'PENDING'
    const low = String(s).toLowerCase()
    if (low.includes('progress') || low === 'in_progress' || low === 'in-progress') return 'IN_PROGRESS'
    if (low.includes('complete') || low === 'completed' || low === 'completed') return 'COMPLETED'
    if (low.includes('cancel')) return 'CANCELLED'
    return 'PENDING'
}

export default function KanbanBoard({ tasks, onStatusChange, onEdit, onCreate }: KanbanBoardProps) {
    const grouped = STATUS_COLUMNS.reduce<Record<string, Task[]>>((acc, col) => {
        acc[col.key] = []
        return acc
    }, {})

    tasks.forEach(t => {
        const s = normalizeStatus(t.status)
        grouped[s] = grouped[s] || []
        grouped[s].push(t)
    })

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('text/plain', taskId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDrop = async (e: React.DragEvent, destStatus: string) => {
        e.preventDefault()
        const taskId = e.dataTransfer.getData('text/plain')
        if (!taskId) return
        await onStatusChange(taskId, destStatus)
    }

    const handleDragOver = (e: React.DragEvent) => e.preventDefault()

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 min-h-screen">
            {STATUS_COLUMNS.map(col => (
                <div key={col.key} className={`rounded-xl border-2 ${col.borderColor} ${col.bgColor} shadow-lg hover:shadow-xl transition-all duration-300 w-64 flex-shrink-0 flex flex-col`}>
                    {/* Header */}
                    <div className="p-3 pb-2 border-b border-white/20 sticky top-0 z-10 backdrop-blur-sm bg-white/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${col.key === 'PENDING' ? 'bg-amber-400 shadow-amber-200' :
                                    col.key === 'IN_PROGRESS' ? 'bg-blue-500 shadow-blue-200' :
                                        col.key === 'COMPLETED' ? 'bg-emerald-500 shadow-emerald-200' :
                                            'bg-slate-400 shadow-slate-200'
                                    }`}></div>
                                <h3 className={`text-sm font-bold ${col.color} tracking-tight`}>
                                    {col.label}
                                </h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={onCreate}
                                    className="w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-white/40 flex items-center justify-center hover:bg-white hover:shadow-md transition-all duration-200"
                                    title="Crear nueva tarea"
                                >
                                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                                <div className="bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm border border-white/40">
                                    <span className={`text-xs font-semibold ${col.color}`}>
                                        {grouped[col.key]?.length || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks Container */}
                    <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.key)}
                        className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                    >
                        {(grouped[col.key] || []).map(task => (
                            <article
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                className="group bg-white rounded-md p-2.5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-grab active:cursor-grabbing hover:scale-[1.01] transform"
                            >
                                {/* Header with Priority */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-1.5 mb-1.5">
                                            <h4 className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-gray-800 transition-colors">
                                                {task.title}
                                            </h4>
                                            {task.priority && (
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${task.priority === 'HIGH' || task.priority === 'URGENT'
                                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                                    : task.priority === 'MEDIUM'
                                                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    }`}>
                                                    {task.priority === 'HIGH' ? 'A' :
                                                        task.priority === 'MEDIUM' ? 'M' :
                                                            task.priority === 'LOW' ? 'B' : '!'}
                                                </span>
                                            )}
                                        </div>
                                        {task.description && (
                                            <p className="text-xs text-gray-600 leading-tight mb-1.5 line-clamp-1">
                                                {task.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="ml-1.5 flex flex-col items-end space-y-0.5">
                                        <input
                                            type="checkbox"
                                            aria-label={`Marcar ${task.title} como completada`}
                                            checked={normalizeStatus(task.status) === 'COMPLETED' || (task.progress ?? 0) >= 100}
                                            onChange={async (e) => {
                                                const checked = e.target.checked
                                                if (checked) {
                                                    await onStatusChange(task.id, 'COMPLETED', { progress: 100 })
                                                } else {
                                                    await onStatusChange(task.id, 'PENDING', { progress: 0 })
                                                }
                                            }}
                                            className="w-3 h-3 text-emerald-600 bg-gray-100 border-2 border-gray-300 rounded focus:ring-emerald-500 focus:ring-1 hover:border-emerald-400 transition-colors"
                                        />
                                        <button
                                            onClick={() => onEdit(task)}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 px-1.5 py-0.5 rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                </div>

                                {/* Task Details */}
                                <div className="space-y-1">
                                    {/* Project */}
                                    {task.project && (
                                        <div className="flex items-center text-xs text-gray-600">
                                            <svg className="w-2.5 h-2.5 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span className="font-medium truncate">{task.project}</span>
                                        </div>
                                    )}

                                    {/* Rubro */}
                                    {task.rubro && (
                                        <div className="flex items-center text-xs text-gray-600">
                                            <svg className="w-2.5 h-2.5 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <span className="truncate">{task.rubro}</span>
                                        </div>
                                    )}

                                    {/* Assignee */}
                                    {task.assignee && (
                                        <div className="flex items-center text-xs text-gray-600">
                                            <svg className="w-2.5 h-2.5 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 truncate max-w-24">
                                                {task.assignee}
                                            </span>
                                        </div>
                                    )}

                                    {/* Dates */}
                                    {(task.startDate || task.endDate) && (
                                        <div className="flex items-center text-xs text-gray-600">
                                            <svg className="w-2.5 h-2.5 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="truncate">
                                                {task.startDate ? new Date(task.startDate).toLocaleDateString('es-ES') : ''}
                                                {task.startDate && task.endDate ? ' - ' : ''}
                                                {task.endDate ? new Date(task.endDate).toLocaleDateString('es-ES') : ''}
                                            </span>
                                        </div>
                                    )}

                                    {/* Estimated Hours */}
                                    {task.estimatedHours && (
                                        <div className="flex items-center text-xs text-gray-600">
                                            <svg className="w-2.5 h-2.5 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{task.estimatedHours}h estimadas</span>
                                        </div>
                                    )}

                                    {/* External Links */}
                                    {task.externalLinks && task.externalLinks.length > 0 && (
                                        <div className="flex items-center text-xs text-gray-600">
                                            <svg className="w-2.5 h-2.5 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            <div className="flex flex-wrap gap-1">
                                                {task.externalLinks.slice(0, 2).map((link: string, index: number) => (
                                                    <a
                                                        key={index}
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 underline text-xs truncate max-w-20"
                                                        title={link}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Link {index + 1}
                                                    </a>
                                                ))}
                                                {task.externalLinks.length > 2 && (
                                                    <span className="text-gray-500">+{task.externalLinks.length - 2}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-2 pt-1.5 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-xs font-medium text-gray-700">Progreso</span>
                                        <span className="text-xs text-gray-500 font-medium">{task.progress ?? 0}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-1 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${Math.min(100, task.progress || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </article>
                        ))}

                        {/* Empty State */}
                        {(grouped[col.key] || []).length === 0 && (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className={`w-6 h-6 rounded-full ${col.bgColor} border-2 ${col.borderColor} flex items-center justify-center mb-1.5`}>
                                    <svg className={`w-3.5 h-3.5 ${col.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <p className={`text-xs font-medium ${col.color} mb-0.5`}>Sin tareas</p>
                                <p className="text-xs text-gray-400">Arrastra tareas aquí</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
