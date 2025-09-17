"use client"

import React, { useEffect, useState } from 'react'
import Layout from '../../../components/Layout'
import MinimalCalendar from '../../../components/MinimalCalendar'
import TaskFormModal from '../../../components/modals/TaskFormModal'
import { useSession } from 'next-auth/react'
import { useToast } from '../../../components/ToastProvider'
import { useRouter } from 'next/navigation'

export default function CalendarPage() {
    const { data: session } = useSession()
    const toast = useToast()
    const router = useRouter()

    const [tasks, setTasks] = useState<any[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadTasks() {
            try {
                const organizationId = (session as any)?.user?.organizationId
                if (!organizationId) return

                setLoading(true)
                const res = await fetch(`/api/planning?organizationId=${organizationId}`)

                if (!res.ok) {
                    throw new Error('No se pudieron cargar las tareas')
                }

                const data = await res.json()
                setTasks(Array.isArray(data) ? data : [])
            } catch (err: any) {
                console.error('Error loading tasks:', err)
                toast.error(err.message || 'No se pudieron cargar las tareas')
            } finally {
                setLoading(false)
            }
        }

        if (session) {
            loadTasks()
        }
    }, [session])

    const handleTaskClick = (task: any) => {
        setEditingTask(task)
        setModalOpen(true)
    }

    const handleDateClick = (dateInfo: any) => {
        const selectedDate = dateInfo.dateStr
        setEditingTask({
            title: '',
            description: '',
            startDate: selectedDate,
            endDate: selectedDate,
            priority: 'MEDIUM',
            status: 'PENDING',
            progress: 0,
            projectId: '',
            assigneeId: ''
        })
        setModalOpen(true)
    }

    const handleTaskDrop = async (dropInfo: any) => {
        try {
            const payload = {
                startDate: dropInfo.newStart ? dropInfo.newStart.toISOString() : null,
                endDate: dropInfo.newEnd ? dropInfo.newEnd.toISOString() : null
            }

            const res = await fetch(`/api/planning/${dropInfo.taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                throw new Error('No se pudo actualizar la tarea')
            }

            const updated = await res.json()
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
            toast.success('Tarea actualizada exitosamente')

        } catch (error: any) {
            console.error('Error updating task:', error)
            toast.error(error.message || 'Error al actualizar la tarea')
        }
    }

    const handleSaveTask = async (taskData: any) => {
        try {
            if (taskData.id) {
                // Actualizar tarea existente - don't include organizationId or createdById
                const res = await fetch(`/api/planning/${taskData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                })

                if (!res.ok) {
                    const error = await res.json()
                    throw new Error(error.error || 'Error actualizando la tarea')
                }

                const updated = await res.json()
                setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
                toast.success('Tarea actualizada exitosamente')
            } else {
                // Crear nueva tarea - include organizationId and createdById
                const organizationId = (session as any)?.user?.organizationId
                const createdById = (session as any)?.user?.id
                const payload = { ...taskData, organizationId, createdById }

                const res = await fetch('/api/planning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                if (!res.ok) {
                    const error = await res.json()
                    throw new Error(error.error || 'Error creando la tarea')
                }

                const created = await res.json()
                setTasks(prev => [created, ...prev])
                toast.success('Tarea creada exitosamente')
            }

            setModalOpen(false)
            setEditingTask(null)
        } catch (error: any) {
            console.error('Error saving task:', error)
            toast.error(error.message || 'Error al guardar la tarea')
        }
    }

    const handleNewTask = () => {
        const today = new Date().toISOString().split('T')[0]
        setEditingTask({
            title: '',
            description: '',
            startDate: today,
            endDate: today,
            priority: 'MEDIUM',
            status: 'PENDING',
            progress: 0,
            projectId: '',
            assigneeId: ''
        })
        setModalOpen(true)
    }

    if (loading) {
        return (
            <Layout title="Planificación - Calendario" subtitle="Vista de calendario interactiva de tareas">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Planificación - Calendario" subtitle="Vista de calendario interactiva de tareas">
            {/* Header con controles */}
            <div className="mb-4 md:mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                    <button
                        onClick={() => router.push('/planning')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        Vista Lista
                    </button>

                    <button
                        onClick={() => router.push('/planning')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Vista Kanban
                    </button>

                    <div className="text-sm text-gray-600">
                        <span className="font-medium">{tasks.length}</span> tareas en total
                    </div>
                </div>

                <button
                    onClick={handleNewTask}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto justify-center"
                >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Tarea
                </button>
            </div>

            {/* Calendario Minimalista */}
            <MinimalCalendar
                tasks={tasks}
                onTaskClick={handleTaskClick}
                onDateClick={handleDateClick}
                onTaskDrop={handleTaskDrop}
            />

            {/* Modal de tarea */}
            <TaskFormModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false)
                    setEditingTask(null)
                }}
                onSave={handleSaveTask}
                task={editingTask}
            />
        </Layout>
    )
}
