'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import para Chart.js para evitar problemas de SSR
const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Chart), {
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

interface RevenueExpenseChartProps {
    data: {
        metrics: {
            monthlyRevenueByCurrency: { PESOS: number; USD: number; EUR: number }
            monthlyExpenseByCurrency: { PESOS: number; USD: number; EUR: number }
        }
        charts: {
            monthlyRevenues: Array<{
                month: string
                revenue: number
                budgeted: number
                consumedByCurrency?: { PESOS: number; USD: number; EUR: number }
                budgetedByCurrency?: { PESOS: number; USD: number; EUR: number }
            }>
        }
    }
}

export default function RevenueExpenseChart({ data }: RevenueExpenseChartProps) {
    const [chartData, setChartData] = useState<any>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const now = new Date()
            const currentMonth = now.getMonth()
            const currentYear = now.getFullYear()

            const processedData = {
                labels: data.charts.monthlyRevenues.map((month: { month: string; revenue: number; budgeted: number }, index: number) => {
                    const monthIndex = currentMonth - (5 - index)
                    const year = monthIndex < 0 ? currentYear - 1 : currentYear
                    const adjustedMonthIndex = monthIndex < 0 ? monthIndex + 12 : monthIndex

                    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
                    return `${monthNames[adjustedMonthIndex]} ${year}`
                }),
                datasets: [
                    {
                        type: 'bar' as const,
                        label: 'Ingresos',
                        data: data.charts.monthlyRevenues.map((month: { month: string; revenue: number; budgeted: number; consumedByCurrency?: { PESOS: number; USD: number; EUR: number } }, index: number) => {
                            // Para ingresos históricos, usar los datos del mes actual como aproximación
                            // ya que no hay datos históricos de ingresos en el API
                            const currentMonthRevenue = data.metrics.monthlyRevenueByCurrency.PESOS +
                                data.metrics.monthlyRevenueByCurrency.USD +
                                data.metrics.monthlyRevenueByCurrency.EUR
                            return currentMonthRevenue
                        }),
                        backgroundColor: 'rgba(16, 185, 129, 0.85)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                        barThickness: 30,
                    },
                    {
                        type: 'bar' as const,
                        label: 'Egresos',
                        data: data.charts.monthlyRevenues.map((month: { month: string; revenue: number; budgeted: number; consumedByCurrency?: { PESOS: number; USD: number; EUR: number } }) => {
                            // Usar los datos de consumo (egresos reales) si están disponibles
                            if (month.consumedByCurrency) {
                                return month.consumedByCurrency.PESOS + month.consumedByCurrency.USD + month.consumedByCurrency.EUR
                            }
                            // Si no hay datos históricos, usar los egresos del mes actual
                            return data.metrics.monthlyExpenseByCurrency.PESOS + data.metrics.monthlyExpenseByCurrency.USD + data.metrics.monthlyExpenseByCurrency.EUR
                        }),
                        backgroundColor: 'rgba(239, 68, 68, 0.85)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                        barThickness: 30,
                    },
                ],
            }

            setChartData(processedData)
        }
    }, [data])

    if (!chartData) {
        return <div className="h-80 flex items-center justify-center">Cargando gráfico...</div>
    }

    return (
        <div className="h-80">
            <Chart
                type="bar"
                data={chartData}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top' as const,
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context: any) {
                                    const value = context.parsed.y
                                    return `${context.dataset.label}: $${value.toLocaleString('es-ES')}`
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11 } }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: {
                                callback: function (value: any) {
                                    return '$' + (value as number).toLocaleString('es-ES', {
                                        notation: 'compact',
                                        compactDisplay: 'short'
                                    })
                                }
                            }
                        }
                    }
                }}
            />
        </div>
    )
}
