'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProject() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to projects page with modal parameter
        router.replace('/projects?modal=create')
    }, [router])

    return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )
}
