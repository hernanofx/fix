'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: string; type: ToastType; title?: string; message: string }

const ToastContext = createContext<{
    push: (t: Omit<Toast, 'id'>) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    function push(toast: Omit<Toast, 'id'>) {
        const id = Date.now().toString() + Math.random().toString(36).slice(2, 8)
        setToasts((s) => [{ ...toast, id }, ...s])
        // auto remove
        setTimeout(() => {
            setToasts((s) => s.filter((t) => t.id !== id))
        }, 4000)
    }

    return (
        <ToastContext.Provider value={{ push }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`max-w-sm w-full rounded-md shadow-lg p-3 border ${t.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : t.type === 'error'
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                    >
                        {t.title && <div className="font-semibold">{t.title}</div>}
                        <div className="text-sm">{t.message}</div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) {
        return {
            success: (msg: string, title?: string) => console.log('toast success:', title, msg),
            error: (msg: string, title?: string) => console.error('toast error:', title, msg),
            info: (msg: string, title?: string) => console.log('toast info:', title, msg)
        }
    }

    return {
        success: (message: string, title?: string) => ctx.push({ type: 'success', title, message }),
        error: (message: string, title?: string) => ctx.push({ type: 'error', title, message }),
        info: (message: string, title?: string) => ctx.push({ type: 'info', title, message })
    }
}

export default ToastProvider
