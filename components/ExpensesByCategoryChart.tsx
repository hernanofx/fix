'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import para Chart.js para evitar problemas de SSR
const PolarArea = dynamic(() => import('react-chartjs-2').then(mod => mod.PolarArea), {
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

interface ExpensesByCategoryChartProps {
    data: {
        charts: {
            expensesByCategory: {
                labels: string[]
                data: number[]
            }
        }
    }
}

export default function ExpensesByCategoryChart({ data }: ExpensesByCategoryChartProps) {
    const [chartData, setChartData] = useState<any>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const processedData = {
                labels: data.charts.expensesByCategory.labels,
                datasets: [{
                    data: data.charts.expensesByCategory.data,
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.85)',   // red
                        'rgba(245, 158, 11, 0.85)',  // amber
                        'rgba(16, 185, 129, 0.85)',  // emerald
                        'rgba(59, 130, 246, 0.85)',  // blue
                        'rgba(139, 92, 246, 0.85)',  // violet
                        'rgba(236, 72, 153, 0.85)',  // pink
                    ],
                    borderWidth: 2,
                }]
            }

            setChartData(processedData)
        }
    }, [data])

    if (!chartData) {
        return <div className="h-80 flex items-center justify-center">Cargando gráfico...</div>
    }

    return (
        <div className="h-80 flex items-center justify-center">
            <PolarArea
                data={chartData}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' as const },
                        tooltip: {
                            callbacks: {
                                label: function (context: any) {
                                    const value = context.parsed.r
                                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                                    const percentage = ((value / total) * 100).toFixed(1)
                                    return `${context.label}: $${value.toLocaleString('es-ES')} (${percentage}%)`
                                }
                            }
                        }
                    }
                }}
            />
        </div>
    )
}
