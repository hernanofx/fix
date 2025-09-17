import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
    try {
        // Create template data with example prospects
        const templateData = [
            {
                'Nombre': 'Constructora ABC S.A.',
                'Email': 'contacto@constructoraabc.com',
                'Teléfono': '+56912345678',
                'Estado': 'A Contactar',
                'Dirección': 'Av. Providencia 1234',
                'Ciudad': 'Santiago',
                'País': 'Argentina',
                'RUT': '76.123.456-7',
                'Nombre de Contacto': 'Juan Pérez',
                'Teléfono de Contacto': '+56987654321',
                'Proyectos de Interés': 'Edificio Corporativo, Centro Comercial',
                'Materiales de Interés': 'Cemento, Acero, Vidrio',
                'Rubros de Interés': 'Construcción Civil, Arquitectura',
                'Notas del Prospecto': 'Empresa interesada en proyectos comerciales'
            },
            {
                'Nombre': 'Inmobiliaria XYZ Ltda.',
                'Email': 'info@inmobiliariaxyz.cl',
                'Teléfono': '+56911223344',
                'Estado': 'Contactado - Esperando',
                'Dirección': 'Calle Las Condes 567',
                'Ciudad': 'Las Condes',
                'País': 'Argentina',
                'RUT': '77.234.567-8',
                'Nombre de Contacto': 'María González',
                'Teléfono de Contacto': '+56944332211',
                'Proyectos de Interés': 'Condominio Residencial',
                'Materiales de Interés': 'Ladrillos, Pintura',
                'Rubros de Interés': 'Construcción Residencial',
                'Notas del Prospecto': 'Seguimiento programado para la próxima semana'
            },
            {
                'Nombre': 'Empresa de Servicios SPA',
                'Email': 'ventas@empresadeservicios.cl',
                'Teléfono': '+56955667788',
                'Estado': 'Cotizando',
                'Dirección': 'Av. Apoquindo 890',
                'Ciudad': 'Santiago',
                'País': 'Argentina',
                'RUT': '78.345.678-9',
                'Nombre de Contacto': 'Carlos Rodríguez',
                'Teléfono de Contacto': '+56988776655',
                'Proyectos de Interés': 'Oficinas Corporativas, Remodelación',
                'Materiales de Interés': 'Pisos, Iluminación LED',
                'Rubros de Interés': 'Remodelación, Mantenimiento',
                'Notas del Prospecto': 'Cotización enviada, esperando respuesta'
            }
        ]

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(templateData)

        // Set column widths
        const colWidths = [
            { wch: 25 }, // Nombre
            { wch: 30 }, // Email
            { wch: 15 }, // Teléfono
            { wch: 20 }, // Estado
            { wch: 30 }, // Dirección
            { wch: 15 }, // Ciudad
            { wch: 15 }, // País
            { wch: 12 }, // RUT
            { wch: 20 }, // Nombre de Contacto
            { wch: 18 }, // Teléfono de Contacto
            { wch: 30 }, // Proyectos de Interés
            { wch: 30 }, // Materiales de Interés
            { wch: 30 }, // Rubros de Interés
            { wch: 40 }  // Notas del Prospecto
        ]
        ws['!cols'] = colWidths

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Prospectos')

        // Create additional instructions sheet
        const instructionsData = [
            { 'Instrucciones': 'PLANTILLA PARA IMPORTAR PROSPECTOS' },
            { 'Instrucciones': '' },
            { 'Instrucciones': 'Esta plantilla te ayudará a importar prospectos de manera masiva al sistema.' },
            { 'Instrucciones': '' },
            { 'Instrucciones': 'COLUMNAS Y FORMATOS:' },
            { 'Instrucciones': '• Nombre: Nombre de la empresa o persona (REQUERIDO)' },
            { 'Instrucciones': '• Email: Correo electrónico válido' },
            { 'Instrucciones': '• Teléfono: Número de teléfono con código de país' },
            { 'Instrucciones': '• Estado: A Contactar, Contactado - Esperando, Cotizando, Negociando, Ganado, Perdido, Sin Interés' },
            { 'Instrucciones': '• Dirección: Dirección completa' },
            { 'Instrucciones': '• Ciudad: Ciudad de ubicación' },
            { 'Instrucciones': '• País: País (por defecto: Argentina)' },
            { 'Instrucciones': '• RUT: CUIT/CUIL argentino válido (opcional)' },
            { 'Instrucciones': '• Nombre de Contacto: Persona de contacto principal' },
            { 'Instrucciones': '• Teléfono de Contacto: Teléfono de la persona de contacto' },
            { 'Instrucciones': '• Proyectos de Interés: Lista separada por comas (ej: "Edificio, Casa, Local comercial")' },
            { 'Instrucciones': '• Materiales de Interés: Lista separada por comas (ej: "Cemento, Acero, Ladrillos")' },
            { 'Instrucciones': '• Rubros de Interés: Lista separada por comas (ej: "Construcción Civil, Arquitectura")' },
            { 'Instrucciones': '• Notas del Prospecto: Información adicional sobre el prospecto' },
            { 'Instrucciones': '' },
            { 'Instrucciones': 'REGLAS IMPORTANTES:' },
            { 'Instrucciones': '• La columna "Nombre" es OBLIGATORIA' },
            { 'Instrucciones': '• Los intereses se separan por comas (máximo 3 por categoría)' },
            { 'Instrucciones': '• El estado debe coincidir exactamente con las opciones disponibles' },
            { 'Instrucciones': '• No modifiques los nombres de las columnas' },
            { 'Instrucciones': '• El archivo debe guardarse en formato .xlsx' },
            { 'Instrucciones': '• Puedes dejar celdas vacías si la información no está disponible' },
            { 'Instrucciones': '' },
            { 'Instrucciones': 'EJEMPLOS DE USO:' },
            { 'Instrucciones': '• Para intereses múltiples: "Proyecto A, Proyecto B, Proyecto C"' },
            { 'Instrucciones': '• Para estado: "A Contactar" (exactamente como aparece)' },
            { 'Instrucciones': '• Para teléfono: "+56912345678" (incluir código de país)' },
            { 'Instrucciones': '' },
            { 'Instrucciones': 'Después de completar la plantilla, ve a Prospectos > Importar Excel' }
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
                'Content-Disposition': 'attachment; filename=plantilla_prospectos.xlsx'
            }
        })

        return response

    } catch (error: any) {
        console.error('Template generation error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}