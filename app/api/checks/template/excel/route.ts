import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
    try {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Plantilla Cheques')

        // Definir columnas
        worksheet.columns = [
            { header: 'Número de Cheque', key: 'checkNumber', width: 20 },
            { header: 'Fecha de Emisión', key: 'issueDate', width: 15 },
            { header: 'Fecha de Vencimiento', key: 'dueDate', width: 18 },
            { header: 'Monto', key: 'amount', width: 12 },
            { header: 'Moneda', key: 'currency', width: 10 },
            { header: 'Nombre del Emisor', key: 'issuerName', width: 20 },
            { header: 'Banco Emisor', key: 'issuerBank', width: 20 },
            { header: 'Emitido A', key: 'issuedTo', width: 20 },
            { header: 'Recibido De', key: 'receivedFrom', width: 20 },
            { header: 'Descripción', key: 'description', width: 30 },
            { header: 'Estado', key: 'status', width: 12 }
        ]

        // Estilo del header
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
        }

        // Agregar datos de ejemplo
        worksheet.addRow({
            checkNumber: '001234',
            issueDate: '15/01/2024',
            dueDate: '15/02/2024',
            amount: 50000,
            currency: 'ARS',
            issuerName: 'Juan Pérez',
            issuerBank: 'Banco Nación',
            issuedTo: 'Proveedor ABC',
            receivedFrom: '',
            description: 'Pago de servicios',
            status: 'ISSUED'
        })

        worksheet.addRow({
            checkNumber: '005678',
            issueDate: '20/01/2024',
            dueDate: '20/03/2024',
            amount: 2500,
            currency: 'USD',
            issuerName: 'María García',
            issuerBank: 'Banco Santander',
            issuedTo: '',
            receivedFrom: 'Cliente XYZ',
            description: 'Cobro de factura',
            status: 'PENDING'
        })

        // Agregar fila vacía para que el usuario pueda agregar sus datos
        worksheet.addRow({})

        // Crear hoja de instrucciones
        const instructionsSheet = workbook.addWorksheet('Instrucciones')

        instructionsSheet.columns = [
            { header: 'Campo', key: 'field', width: 25 },
            { header: 'Descripción', key: 'description', width: 50 },
            { header: 'Formato/Ejemplo', key: 'format', width: 25 },
            { header: 'Requerido', key: 'required', width: 12 }
        ]

        instructionsSheet.getRow(1).font = { bold: true }
        instructionsSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
        }

        // Agregar instrucciones
        const instructions = [
            {
                field: 'Número de Cheque',
                description: 'Número único del cheque',
                format: 'Texto (ej: 001234)',
                required: 'Sí'
            },
            {
                field: 'Fecha de Emisión',
                description: 'Fecha en que se emitió el cheque',
                format: 'DD/MM/YYYY (ej: 15/01/2024)',
                required: 'Sí'
            },
            {
                field: 'Fecha de Vencimiento',
                description: 'Fecha en que vence el cheque',
                format: 'DD/MM/YYYY (ej: 15/02/2024)',
                required: 'Sí'
            },
            {
                field: 'Monto',
                description: 'Monto del cheque sin símbolos de moneda',
                format: 'Número (ej: 50000)',
                required: 'Sí'
            },
            {
                field: 'Moneda',
                description: 'Moneda del cheque',
                format: 'ARS, USD, EUR',
                required: 'Sí'
            },
            {
                field: 'Nombre del Emisor',
                description: 'Nombre de la persona que emite el cheque',
                format: 'Texto',
                required: 'Sí'
            },
            {
                field: 'Banco Emisor',
                description: 'Nombre del banco que emite el cheque',
                format: 'Texto',
                required: 'Sí'
            },
            {
                field: 'Emitido A',
                description: 'Nombre de la persona/empresa a quien se emite el cheque',
                format: 'Texto (opcional si es recibido)',
                required: 'Condicional'
            },
            {
                field: 'Recibido De',
                description: 'Nombre de la persona/empresa de quien se recibe el cheque',
                format: 'Texto (opcional si es emitido)',
                required: 'Condicional'
            },
            {
                field: 'Descripción',
                description: 'Descripción adicional del cheque',
                format: 'Texto',
                required: 'No'
            },
            {
                field: 'Estado',
                description: 'Estado inicial del cheque',
                format: 'ISSUED, PENDING, CLEARED, REJECTED, CANCELLED',
                required: 'No (por defecto: ISSUED)'
            }
        ]

        instructions.forEach(instruction => {
            instructionsSheet.addRow(instruction)
        })

        // Generar buffer del Excel
        const buffer = await workbook.xlsx.writeBuffer()

        // Configurar headers para descarga
        const headers = new Headers()
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        headers.set('Content-Disposition', 'attachment; filename=plantilla_cheques.xlsx')

        return new NextResponse(buffer, {
            status: 200,
            headers
        })

    } catch (error) {
        console.error('Error creating template:', error)
        return NextResponse.json({ error: 'Error creating template' }, { status: 500 })
    }
}