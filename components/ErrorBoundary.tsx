"use client"

import React from 'react'

interface Props {
    children: React.ReactNode
}

interface State {
    hasError: boolean
    error?: Error | null
    errorInfo?: React.ErrorInfo | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // log to console so it appears in browser logs and in server-side capture if present
        console.error('ErrorBoundary caught an error:', error)
        console.error('Error info:', errorInfo)
        this.setState({ errorInfo })
        try {
            // Optionally send to logging endpoint — left commented for privacy / environment
            // fetch('/api/logs', { method: 'POST', body: JSON.stringify({ error: String(error), info: errorInfo }) })
        } catch (e) {
            // ignore
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-50 rounded">
                    <h3 className="text-red-800 font-medium">Se produjo un error al renderizar esta sección.</h3>
                    <p className="text-sm text-red-700 mt-2">Revise la consola (F12) para la traza completa.</p>
                </div>
            )
        }
        return this.props.children
    }
}
