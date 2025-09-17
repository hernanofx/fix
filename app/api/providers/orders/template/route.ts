import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
    try {
        // Create template data
        const templateData = [
            {
                'Número de Orden': 'OP-001',
                'ID Proveedor': 'prov_123',
                'Fecha de Entrega': '2024-12-31',
                'Estado': 'PENDING',
                'Notas': 'Orden de prueba',
                'Código Material': 'MAT-001',
                'Descripción Material': 'Cemento Portland',
                'ID Rubro': 'rubro_123',
                'Cantidad': 100,
                'Precio Unitario': 25.50,
                'Unidad': 'kg'
            },
            {
                'Número de Orden': 'OP-001',
                'ID Proveedor': 'prov_123',
                'Fecha de Entrega': '2024-12-31',
                'Estado': 'PENDING',
                'Notas': 'Orden de prueba',
                'Código Material': 'MAT-002',
                'Descripción Material': 'Arena fina',
                'ID Rubro': 'rubro_123',
                'Cantidad': 50,
                'Precio Unitario': 15.00,
                'Unidad': 'm3'
            }
        ]

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(templateData)

        // Set column widths
        const colWidths = [
            { wch: 15 }, // Número de Orden
            { wch: 12 }, // ID Proveedor
            { wch: 15 }, // Fecha de Entrega
            { wch: 10 }, // Estado
            { wch: 30 }, // Notas
            { wch: 15 }, // Código Material
            { wch: 25 }, // Descripción Material
            { wch: 12 }, // ID Rubro
            { wch: 10 }, // Cantidad
            { wch: 15 }, // Precio Unitario
            { wch: 8 }   // Unidad
        ]
        ws['!cols'] = colWidths

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Ordenes_Pedido')

        // Create additional instructions sheet
        const instructionsData = [
            { 'Instrucciones': 'Esta es la plantilla para importar órdenes de pedido.' },
            { 'Instrucciones': '' },
            { 'Instrucciones': 'COLUMNAS REQUERIDAS:' },
            { 'Instrucciones': '• Número de Orden: Identificador único de la orden' },
            { 'Instrucciones': '• ID Proveedor: ID del proveedor (debe existir en el sistema)' },
            { 'Instrucciones': '• Fecha de Entrega: Fecha en formato YYYY-MM-DD' },
            { 'Instrucciones': '• Estado: PENDING, APPROVED, ORDERED, RECEIVED, CANCELLED' },
            { 'Instrucciones': '• Código Material: Código del material (debe existir)' },
            { 'Instrucciones': '• ID Rubro: ID del rubro (opcional)' },
            { 'Instrucciones': '• Cantidad: Número positivo' },
            { 'Instrucciones': '• Precio Unitario: Número positivo' },
            { 'Instrucciones': '• Unidad: Unidad de medida (kg, m3, l, etc.)' },
            { 'Instrucciones': '' },
            { 'Instrucciones': 'NOTAS IMPORTANTES:' },
            { 'Instrucciones': '• Una orden puede tener múltiples materiales (mismas primeras 5 columnas)' },
            { 'Instrucciones': '• Los IDs de proveedor y material deben existir en el sistema' },
            { 'Instrucciones': '• El archivo debe estar en formato .xlsx' },
            { 'Instrucciones': '• No modifiques los nombres de las columnas' }
        ]

        const wsInstructions = XLSX.utils.json_to_sheet(instructionsData)
        wsInstructions['!cols'] = [{ wch: 60 }]
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones')

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // Return Excel file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=plantilla_ordenes_pedido.xlsx'
            }
        })

        return response

    } catch (error: any) {
        console.error('Template generation error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
