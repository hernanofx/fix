import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF
    }
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const partidaId = searchParams.get('partidaId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        let apuPartidas

        if (partidaId) {
            // Export single partida
            const partida = await prisma.apuPartida.findUnique({
                where: { id: partidaId, organizationId },
                include: {
                    materials: {
                        include: {
                            material: { select: { name: true, unit: true } }
                        }
                    },
                    labors: {
                        include: {
                            rubro: { select: { name: true } }
                        }
                    },
                    equipments: true,
                    budget: { select: { name: true } },
                    createdBy: { select: { name: true } }
                }
            })

            if (!partida) {
                return NextResponse.json({ error: 'APU partida not found' }, { status: 404 })
            }

            apuPartidas = [partida]
        } else {
            // Export all partidas
            apuPartidas = await prisma.apuPartida.findMany({
                where: { organizationId },
                include: {
                    materials: {
                        include: {
                            material: { select: { name: true, unit: true } }
                        }
                    },
                    labors: {
                        include: {
                            rubro: { select: { name: true } }
                        }
                    },
                    equipments: true,
                    budget: { select: { name: true } },
                    createdBy: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' }
            })
        }

        const doc = new jsPDF()

        // Company header
        doc.setFontSize(20)
        doc.text('ANÁLISIS DE PRECIOS UNITARIOS (APU)', 20, 20)

        doc.setFontSize(12)
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 35)

        let yPosition = 50

        apuPartidas.forEach((partida, index) => {
            if (index > 0) {
                doc.addPage()
                yPosition = 20
            }

            // Partida header
            doc.setFontSize(16)
            doc.text(`Partida: ${partida.name}`, 20, yPosition)
            yPosition += 10

            doc.setFontSize(10)
            if (partida.code) {
                doc.text(`Código: ${partida.code}`, 20, yPosition)
                yPosition += 5
            }
            doc.text(`Unidad: ${partida.unit}`, 20, yPosition)
            doc.text(`Cantidad: ${Number(partida.quantity).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 120, yPosition)
            yPosition += 5
            doc.text(`Moneda: ${partida.currency}`, 20, yPosition)
            yPosition += 10

            // Materials table
            if (partida.materials.length > 0) {
                doc.setFontSize(12)
                doc.text('MATERIALES', 20, yPosition)
                yPosition += 5

                const materialsData = partida.materials.map(mat => [
                    mat.material.name,
                    mat.material.unit,
                    Number(mat.quantity).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
                    formatCurrency(Number(mat.unitPrice), partida.currency),
                    formatCurrency(Number(mat.totalCost), partida.currency)
                ])

                doc.autoTable({
                    startY: yPosition,
                    head: [['Material', 'Unidad', 'Cantidad', 'Precio Unit.', 'Total']],
                    body: materialsData,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [240, 240, 240], textColor: 0 },
                    columnStyles: {
                        2: { halign: 'right' },
                        3: { halign: 'right' },
                        4: { halign: 'right' }
                    }
                })

                yPosition = (doc as any).lastAutoTable.finalY + 10
            }

            // Labor table
            if (partida.labors.length > 0) {
                doc.setFontSize(12)
                doc.text('MANO DE OBRA', 20, yPosition)
                yPosition += 5

                const laborData = partida.labors.map(lab => [
                    lab.rubro.name,
                    Number(lab.hours).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
                    formatCurrency(Number(lab.hourlyRate), partida.currency),
                    formatCurrency(Number(lab.totalCost), partida.currency)
                ])

                doc.autoTable({
                    startY: yPosition,
                    head: [['Rubro', 'Horas', 'Tarifa Hora', 'Total']],
                    body: laborData,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [240, 240, 240], textColor: 0 },
                    columnStyles: {
                        1: { halign: 'right' },
                        2: { halign: 'right' },
                        3: { halign: 'right' }
                    }
                })

                yPosition = (doc as any).lastAutoTable.finalY + 10
            }

            // Equipment table
            if (partida.equipments.length > 0) {
                doc.setFontSize(12)
                doc.text('EQUIPOS', 20, yPosition)
                yPosition += 5

                const equipmentData = partida.equipments.map(eq => [
                    eq.name,
                    eq.description || '',
                    Number(eq.quantity).toLocaleString('es-ES', { minimumFractionDigits: 2 }),
                    formatCurrency(Number(eq.unitPrice), partida.currency),
                    formatCurrency(Number(eq.totalCost), partida.currency)
                ])

                doc.autoTable({
                    startY: yPosition,
                    head: [['Equipo', 'Descripción', 'Cantidad', 'Precio Unit.', 'Total']],
                    body: equipmentData,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [240, 240, 240], textColor: 0 },
                    columnStyles: {
                        2: { halign: 'right' },
                        3: { halign: 'right' },
                        4: { halign: 'right' }
                    }
                })

                yPosition = (doc as any).lastAutoTable.finalY + 10
            }

            // Summary table
            doc.setFontSize(12)
            doc.text('RESUMEN DE COSTOS', 20, yPosition)
            yPosition += 5

            const summaryData = [
                ['Costo Directo', formatCurrency(Number(partida.directCost), partida.currency)],
                ['Gastos Generales', formatCurrency(Number(partida.indirectCost) - (Number(partida.directCost) * Number(partida.profitRate) / 100), partida.currency)],
                ['Utilidad', formatCurrency((Number(partida.directCost) + Number(partida.indirectCost) - (Number(partida.directCost) * Number(partida.profitRate) / 100)) * Number(partida.profitRate) / 100, partida.currency)],
                ['Costo Unitario', formatCurrency(Number(partida.unitCost), partida.currency)],
                ['Costo Total', formatCurrency(Number(partida.totalCost), partida.currency)]
            ]

            doc.autoTable({
                startY: yPosition,
                head: [['Concepto', 'Monto']],
                body: summaryData,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [240, 240, 240], textColor: 0 },
                columnStyles: {
                    1: { halign: 'right' }
                }
            })

            // Footer info
            const finalY = (doc as any).lastAutoTable.finalY + 10
            doc.setFontSize(8)
            doc.text(`Presupuesto: ${partida.budget?.name || 'Sin asignar'}`, 20, finalY)
            doc.text(`Creado por: ${partida.createdBy.name}`, 20, finalY + 5)
            doc.text(`Fecha creación: ${partida.createdAt.toLocaleDateString('es-ES')}`, 20, finalY + 10)
        })

        const buffer = Buffer.from(doc.output('arraybuffer'))

        const filename = partidaId
            ? `apu_partida_${apuPartidas[0].code || apuPartidas[0].id.slice(-8)}_${new Date().toISOString().split('T')[0]}.pdf`
            : `apu_partidas_${new Date().toISOString().split('T')[0]}.pdf`

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=${filename}`
            }
        })
    } catch (error) {
        console.error('Error exporting APU to PDF:', error)
        return NextResponse.json({ error: 'Error exporting APU to PDF' }, { status: 500 })
    }
}

function formatCurrency(amount: number, currency: string): string {
    const currencySymbols: Record<string, string> = {
        'PESOS': '$',
        'USD': 'US$',
        'EUR': '€'
    }

    const symbol = currencySymbols[currency] || '$'
    return `${symbol}${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
