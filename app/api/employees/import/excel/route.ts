import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Obtener usuario con organización
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { organization: true }
        })

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'Usuario sin organización' }, { status: 400 })
        }

        // Obtener el archivo
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 })
        }

        // Leer el archivo Excel
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 2) {
            return NextResponse.json({ error: 'El archivo debe contener al menos una fila de datos' }, { status: 400 })
        }

        const headers = jsonData[0] as string[]
        const rows = jsonData.slice(1) as any[][]

        // Validar headers requeridos
        const requiredHeaders = ['nombre', 'apellido']
        const missingHeaders = requiredHeaders.filter(header =>
            !headers.some(h => h?.toLowerCase().includes(header.toLowerCase()))
        )

        if (missingHeaders.length > 0) {
            return NextResponse.json({
                error: `Faltan las siguientes columnas requeridas: ${missingHeaders.join(', ')}`
            }, { status: 400 })
        }

        const importedEmployees = []
        const errors = []

        // Procesar cada fila
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            if (!row || row.length === 0) continue

            try {
                // Crear objeto de fila con headers como keys
                const rowData: any = {}
                headers.forEach((header, index) => {
                    if (header) {
                        rowData[header.toLowerCase()] = row[index]
                    }
                })

                // Validar datos requeridos
                if (!rowData.nombre || !rowData.apellido) {
                    errors.push(`Fila ${i + 2}: Nombre y apellido son requeridos`)
                    continue
                }

                // Preparar datos
                const statusValue = rowData.estado ? (rowData.estado.toLowerCase().includes('activo') || rowData.estado.toLowerCase().includes('active') ? 'ACTIVE' :
                    rowData.estado.toLowerCase().includes('inactivo') || rowData.estado.toLowerCase().includes('inactive') ? 'INACTIVE' :
                        rowData.estado.toLowerCase().includes('terminado') || rowData.estado.toLowerCase().includes('terminated') ? 'TERMINATED' :
                            rowData.estado.toLowerCase().includes('licencia') || rowData.estado.toLowerCase().includes('on leave') ? 'ON_LEAVE' : 'ACTIVE') : 'ACTIVE'

                const employeeData = {
                    firstName: rowData.nombre,
                    lastName: rowData.apellido,
                    email: rowData.email || null,
                    phone: rowData.teléfono || rowData.telefono || null,
                    position: rowData.puesto || rowData.posición || null,
                    department: rowData.departamento || null,
                    salary: rowData.salario ? parseFloat(rowData.salario) : null,
                    hireDate: rowData.fecha_contratación || rowData['fecha contratacion'] ? new Date(rowData.fecha_contratación || rowData['fecha contratacion']) : null,
                    birthDate: rowData.fecha_nacimiento || rowData['fecha nacimiento'] ? new Date(rowData.fecha_nacimiento || rowData['fecha nacimiento']) : null,
                    address: rowData.dirección || rowData.direccion || null,
                    emergencyContact: rowData.contacto_emergencia || rowData['contacto emergencia'] || null,
                    emergencyPhone: rowData.teléfono_emergencia || rowData.telefono_emergencia || null,
                    status: statusValue as 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE',
                    organizationId: user.organizationId,
                    createdById: user.id
                }

                // Crear el empleado
                const employee = await prisma.employee.create({
                    data: employeeData,
                    include: {
                        createdBy: { select: { name: true } }
                    }
                })

                importedEmployees.push(employee)

            } catch (error) {
                console.error(`Error procesando fila ${i + 2}:`, error)
                errors.push(`Fila ${i + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        return NextResponse.json({
            message: `Se importaron ${importedEmployees.length} empleados exitosamente`,
            imported: importedEmployees.length,
            errors: errors.length > 0 ? errors : undefined,
            data: importedEmployees
        })

    } catch (error) {
        console.error('Error importando empleados desde Excel:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
