'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import para Chart.js para evitar problemas de SSR
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), {
    ssr: false,
    loading: () => <div className="h-80 flex items-center justify-center">Cargando gráfico...</div>
})

// Registrar Chart.js solo en el cliente
let isChartRegistered = false

if (typeof window !== 'undefined' && !isChartRegistered) {
    import('chart.js').then(({ Chart: ChartJS, registerables }) => {
        ChartJS.register(...registerables)
        isChartRegistered = true
    })
}

interface ProjectProgressChartProps {
    data: {
        charts: {
            projectProgress: Array<{ name: string; progress: number }>
        }
    }
}

export default function ProjectProgressChart({ data }: ProjectProgressChartProps) {
    const [chartData, setChartData] = useState<any>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const processedData = {
                labels: data.charts.projectProgress.map((project: { name: string; progress: number }) => project.name),
                datasets: [{
                    label: 'Progreso (%)',
                    data: data.charts.projectProgress.map((project: { name: string; progress: number }) => project.progress),
                    backgroundColor: 'rgba(59, 130, 246, 0.85)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                }]
            }

            setChartData(processedData)
        }
    }, [data])

    if (!chartData) {
        return <div className="h-80 flex items-center justify-center">Cargando gráfico...</div>
    }

    return (
        <div className="h-80">
            <Bar
                data={chartData}
                options={{
                    indexAxis: 'y' as const,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, max: 100 },
                        y: { grid: { display: false } }
                    }
                }}
            />
        </div>
    )
}
