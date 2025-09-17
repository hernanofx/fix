'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import LoadingScreen from '../components/LoadingScreen'

interface LoadingContextType {
    isLoading: boolean
    loadingMessage: string
    setLoading: (loading: boolean, message?: string) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState('Cargando...')

    const setLoading = (loading: boolean, message = 'Cargando...') => {
        setIsLoading(loading)
        setLoadingMessage(message)
    }

    return (
        <LoadingContext.Provider value={{ isLoading, loadingMessage, setLoading }}>
            {children}
            {isLoading && <LoadingScreen message={loadingMessage} />}
        </LoadingContext.Provider>
    )
}

export function useLoading() {
    const context = useContext(LoadingContext)
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider')
    }
    return context
}
