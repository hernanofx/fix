import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
    try {
        // Create template data
        const templateData = [
            {
                'Título': 'Desarrollar módulo de autenticación',
                'Descripción': 'Implementar sistema de login y registro de usuarios',
                'Fecha Inicio': '2024-12-01',
                'Fecha Fin': '2024-12-15',
                'Horas Estimadas': 40,
                'Progreso': 25,
                'Prioridad': 'HIGH',
                'Estado': 'IN_PROGRESS',
                'Proyecto': 'Sistema de Gestión',
                'Asignado A': 'Juan Pérez',
                'Rubro': 'Desarrollo',
                'Proveedor': '',
                'Cliente': 'Empresa ABC'
            },
            {
                'Título': 'Revisar documentación técnica',
                'Descripción': 'Actualizar manuales de usuario y documentación API',
                'Fecha Inicio': '2024-12-10',
                'Fecha Fin': '2024-12-20',
                'Horas Estimadas': 20,
                'Progreso': 0,
                'Prioridad': 'MEDIUM',
                'Estado': 'PENDING',
                'Proyecto': 'Sistema de Gestión',
                'Asignado A': 'María González',
                'Rubro': 'Documentación',
                'Proveedor': '',
                'Cliente': 'Empresa ABC'
            }
        ]

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(templateData)

        // Set column widths
        const colWidths = [
            { wch: 30 }, // Título
            { wch: 40 }, // Descripción
            { wch: 12 }, // Fecha Inicio
            { wch: 12 }, // Fecha Fin
            { wch: 15 }, // Horas Estimadas
            { wch: 10 }, // Progreso
            { wch: 10 }, // Prioridad
            { wch: 12 }, // Estado
            { wch: 25 }, // Proyecto
            { wch: 25 }, // Asignado A
            { wch: 20 }, // Rubro
            { wch: 25 }, // Proveedor
            { wch: 25 }  // Cliente
        ]
        ws['!cols'] = colWidths

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Tareas_Planning')

        // Create additional instructions sheet
        const instructionsData = [
            { 'Instrucciones': 'Esta es la plantilla para importar tareas de planning.' },
            { 'Instrucciones': '' },
            { 'Instrucciones': 'COLUMNAS REQUERIDAS:' },
            { 'Instrucciones': '• Título: Título de la tarea (requerido)' },
            { 'Instrucciones': '• Descripción: Descripción detallada de la tarea' },
            { 'Instrucciones': '• Fecha Inicio: Fecha en formato YYYY-MM-DD' },
            { 'Instrucciones': '• Fecha Fin: Fecha en formato YYYY-MM-DD' },
            { 'Instrucciones': '• Horas Estimadas: Número positivo' },
            { 'Instrucciones': '• Progreso: Número entre 0 y 100' },
            { 'Instrucciones': '• Prioridad: LOW, MEDIUM, HIGH, URGENT' },
            { 'Instrucciones': '• Estado: PENDING, IN_PROGRESS, COMPLETED, CANCELLED' },
            { 'Instrucciones': '' },
            { 'Instrucciones': 'COLUMNAS OPCIONALES (RELACIONES):' },
            { 'Instrucciones': '• Proyecto: Nombre o código del proyecto (debe existir)' },
            { 'Instrucciones': '• Asignado A: Nombre completo o email del empleado (debe existir)' },
            { 'Instrucciones': '• Rubro: Nombre o código del rubro (debe existir)' },
            { 'Instrucciones': '• Proveedor: Nombre o email del proveedor (debe existir)' },
            { 'Instrucciones': '• Cliente: Nombre o email del cliente (debe existir)' },
            { 'Instrucciones': '' },
            { 'Instrucciones': 'NOTAS IMPORTANTES:' },
            { 'Instrucciones': '• Solo el título es obligatorio' },
            { 'Instrucciones': '• Las fechas deben estar en formato YYYY-MM-DD' },
            { 'Instrucciones': '• Los nombres de proyectos, empleados, rubros, proveedores y clientes deben existir en el sistema' },
            { 'Instrucciones': '• El archivo debe estar en formato .xlsx' },
            { 'Instrucciones': '• No modifiques los nombres de las columnas' }
        ]

        const wsInstructions = XLSX.utils.json_to_sheet(instructionsData)
        wsInstructions['!cols'] = [{ wch: 80 }]
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones')

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        // Return Excel file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=plantilla_tareas_planning.xlsx'
            }
        })

        return response

    } catch (error: any) {
        console.error('Template generation error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
