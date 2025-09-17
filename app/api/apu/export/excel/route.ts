import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
        }

        const apuPartidas = await prisma.apuPartida.findMany({
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
                budget: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Pix System'
        workbook.created = new Date()

        // Hoja principal de APU
        const worksheet = workbook.addWorksheet('APU Partidas')

        // Headers
        worksheet.columns = [
            { header: 'Código', key: 'code', width: 15 },
            { header: 'Nombre', key: 'name', width: 30 },
            { header: 'Descripción', key: 'description', width: 40 },
            { header: 'Unidad', key: 'unit', width: 10 },
            { header: 'Cantidad', key: 'quantity', width: 12 },
            { header: 'Moneda', key: 'currency', width: 10 },
            { header: 'Costo Unitario', key: 'unitCost', width: 15 },
            { header: 'Costo Total', key: 'totalCost', width: 15 },
            { header: 'Presupuesto', key: 'budget', width: 25 },
            { header: 'Estado', key: 'status', width: 12 },
            { header: 'Creado', key: 'createdAt', width: 15 }
        ]

        // Style headers
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
        }

        // Add data
        apuPartidas.forEach(partida => {
            worksheet.addRow({
                code: partida.code || '',
                name: partida.name,
                description: partida.description || '',
                unit: partida.unit,
                quantity: Number(partida.quantity),
                currency: partida.currency,
                unitCost: Number(partida.unitCost),
                totalCost: Number(partida.totalCost),
                budget: partida.budget?.name || '',
                status: partida.status,
                createdAt: partida.createdAt.toLocaleDateString('es-ES')
            })
        })

        // Format currency columns
        const currencyColumns = ['unitCost', 'totalCost']
        currencyColumns.forEach(col => {
            const colIndex = worksheet.columns.findIndex(c => c.key === col)
            if (colIndex >= 0) {
                worksheet.getColumn(colIndex + 1).numFmt = '"$"#,##0.00'
            }
        })

        // Format quantity column
        const quantityColIndex = worksheet.columns.findIndex(c => c.key === 'quantity')
        if (quantityColIndex >= 0) {
            worksheet.getColumn(quantityColIndex + 1).numFmt = '#,##0.000'
        }

        // Create detailed sheets for each partida
        apuPartidas.forEach((partida, index) => {
            const detailSheet = workbook.addWorksheet(`APU ${partida.code || index + 1}`)

            // Materials section
            if (partida.materials.length > 0) {
                detailSheet.addRow(['MATERIALES'])
                detailSheet.getRow(detailSheet.rowCount).font = { bold: true }
                detailSheet.addRow(['Material', 'Unidad', 'Cantidad', 'Precio Unit.', 'Total'])

                partida.materials.forEach(material => {
                    detailSheet.addRow([
                        material.material.name,
                        material.material.unit,
                        Number(material.quantity),
                        Number(material.unitPrice),
                        Number(material.totalCost)
                    ])
                })

                // Subtotal
                detailSheet.addRow(['', '', '', 'Subtotal Materiales:', Number(partida.materialsSubtotal)])
                detailSheet.getRow(detailSheet.rowCount).font = { bold: true }
                detailSheet.addRow([])
            }

            // Labor section
            if (partida.labors.length > 0) {
                detailSheet.addRow(['MANO DE OBRA'])
                detailSheet.getRow(detailSheet.rowCount).font = { bold: true }
                detailSheet.addRow(['Rubro', 'Horas', 'Tarifa Hora', 'Total'])

                partida.labors.forEach(labor => {
                    detailSheet.addRow([
                        labor.rubro.name,
                        Number(labor.hours),
                        Number(labor.hourlyRate),
                        Number(labor.totalCost)
                    ])
                })

                // Subtotal
                detailSheet.addRow(['', '', 'Subtotal Mano de Obra:', Number(partida.laborSubtotal)])
                detailSheet.getRow(detailSheet.rowCount).font = { bold: true }
                detailSheet.addRow([])
            }

            // Equipment section
            if (partida.equipments.length > 0) {
                detailSheet.addRow(['EQUIPOS'])
                detailSheet.getRow(detailSheet.rowCount).font = { bold: true }
                detailSheet.addRow(['Equipo', 'Descripción', 'Cantidad', 'Precio Unit.', 'Total'])

                partida.equipments.forEach(equipment => {
                    detailSheet.addRow([
                        equipment.name,
                        equipment.description || '',
                        Number(equipment.quantity),
                        Number(equipment.unitPrice),
                        Number(equipment.totalCost)
                    ])
                })

                // Subtotal
                detailSheet.addRow(['', '', '', 'Subtotal Equipos:', Number(partida.equipmentSubtotal)])
                detailSheet.getRow(detailSheet.rowCount).font = { bold: true }
                detailSheet.addRow([])
            }

            // Totals section
            detailSheet.addRow(['RESUMEN DE COSTOS'])
            detailSheet.getRow(detailSheet.rowCount).font = { bold: true }
            detailSheet.addRow(['Concepto', 'Monto'])
            detailSheet.addRow(['Costo Directo', Number(partida.directCost)])
            detailSheet.addRow(['Gastos Generales', Number(partida.indirectCost) - (Number(partida.directCost) * Number(partida.profitRate) / 100)])
            detailSheet.addRow(['Utilidad', (Number(partida.directCost) + Number(partida.indirectCost) - (Number(partida.directCost) * Number(partida.profitRate) / 100)) * Number(partida.profitRate) / 100])
            detailSheet.addRow(['Costo Unitario', Number(partida.unitCost)])
            detailSheet.addRow(['Costo Total', Number(partida.totalCost)])

            // Format currency in detail sheets
            for (let i = 1; i <= detailSheet.rowCount; i++) {
                const row = detailSheet.getRow(i)
                row.eachCell(cell => {
                    if (typeof cell.value === 'number') {
                        cell.numFmt = '"$"#,##0.00'
                    }
                })
            }

            // Auto-fit columns
            detailSheet.columns.forEach(column => {
                column.width = 15
            })
        })

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer()

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=apu_partidas_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })
    } catch (error) {
        console.error('Error exporting APU to Excel:', error)
        return NextResponse.json({ error: 'Error exporting APU to Excel' }, { status: 500 })
    }
}
