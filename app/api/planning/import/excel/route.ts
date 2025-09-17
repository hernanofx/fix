import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient, Priority, TaskStatus } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const organizationId = (session.user as any).organizationId
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type
        if (!file.name.endsWith('.xlsx')) {
            return NextResponse.json({ error: 'Invalid file type. Only .xlsx files are allowed.' }, { status: 400 })
        }

        // Read Excel file
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)

        if (data.length === 0) {
            return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 })
        }

        const errors: string[] = []
        const importedTasks: any[] = []

        // Get existing data for validation
        const [projects, employees, rubros, providers, clients] = await Promise.all([
            prisma.project.findMany({
                where: { organizationId },
                select: { id: true, name: true, code: true }
            }),
            prisma.employee.findMany({
                where: { organizationId },
                select: { id: true, firstName: true, lastName: true, email: true }
            }),
            prisma.rubro.findMany({
                where: { organizationId },
                select: { id: true, name: true, code: true }
            }),
            prisma.provider.findMany({
                where: { organizationId },
                select: { id: true, name: true, email: true }
            }),
            prisma.client.findMany({
                where: { organizationId },
                select: { id: true, name: true, email: true }
            })
        ])

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i] as any
            const rowNumber = i + 2 // +2 because Excel is 1-indexed and we skip header

            try {
                // Validate required fields
                if (!row['Título'] || typeof row['Título'] !== 'string') {
                    errors.push(`Fila ${rowNumber}: Título es requerido`)
                    continue
                }

                // Validate and convert priority
                let priority: Priority = Priority.MEDIUM
                if (row['Prioridad']) {
                    const priorityStr = row['Prioridad'].toString().toUpperCase()
                    if (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priorityStr)) {
                        priority = priorityStr as Priority
                    } else {
                        errors.push(`Fila ${rowNumber}: Prioridad inválida: ${row['Prioridad']}`)
                        continue
                    }
                }

                // Validate and convert status
                let status: TaskStatus = TaskStatus.PENDING
                if (row['Estado']) {
                    const statusStr = row['Estado'].toString().toUpperCase()
                    if (['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(statusStr)) {
                        status = statusStr as TaskStatus
                    } else {
                        errors.push(`Fila ${rowNumber}: Estado inválido: ${row['Estado']}`)
                        continue
                    }
                }

                // Validate dates
                let startDate: Date | null = null
                let endDate: Date | null = null

                if (row['Fecha Inicio']) {
                    const startDateStr = row['Fecha Inicio'].toString()
                    const parsedStartDate = new Date(startDateStr)
                    if (!isNaN(parsedStartDate.getTime())) {
                        startDate = parsedStartDate
                    } else {
                        errors.push(`Fila ${rowNumber}: Fecha de inicio inválida: ${startDateStr}`)
                        continue
                    }
                }

                if (row['Fecha Fin']) {
                    const endDateStr = row['Fecha Fin'].toString()
                    const parsedEndDate = new Date(endDateStr)
                    if (!isNaN(parsedEndDate.getTime())) {
                        endDate = parsedEndDate
                    } else {
                        errors.push(`Fila ${rowNumber}: Fecha de fin inválida: ${endDateStr}`)
                        continue
                    }
                }

                // Validate progress
                let progress = 0
                if (row['Progreso'] !== undefined && row['Progreso'] !== null) {
                    const progressNum = parseInt(row['Progreso'].toString())
                    if (!isNaN(progressNum) && progressNum >= 0 && progressNum <= 100) {
                        progress = progressNum
                    } else {
                        errors.push(`Fila ${rowNumber}: Progreso debe ser un número entre 0 y 100: ${row['Progreso']}`)
                        continue
                    }
                }

                // Validate estimated hours
                let estimatedHours: number | null = null
                if (row['Horas Estimadas'] !== undefined && row['Horas Estimadas'] !== null) {
                    const hoursNum = parseFloat(row['Horas Estimadas'].toString())
                    if (!isNaN(hoursNum) && hoursNum >= 0) {
                        estimatedHours = hoursNum
                    } else {
                        errors.push(`Fila ${rowNumber}: Horas estimadas debe ser un número positivo: ${row['Horas Estimadas']}`)
                        continue
                    }
                }

                // Find related entities
                let projectId: string | null = null
                if (row['Proyecto']) {
                    const projectName = row['Proyecto'].toString()
                    const project = projects.find(p =>
                        p.name === projectName ||
                        (p.code && p.code === projectName)
                    )
                    if (project) {
                        projectId = project.id
                    } else {
                        errors.push(`Fila ${rowNumber}: Proyecto no encontrado: ${projectName}`)
                        continue
                    }
                }

                let assigneeId: string | null = null
                if (row['Asignado A']) {
                    const assigneeName = row['Asignado A'].toString()
                    const employee = employees.find(e =>
                        `${e.firstName} ${e.lastName}` === assigneeName ||
                        e.email === assigneeName
                    )
                    if (employee) {
                        assigneeId = employee.id
                    } else {
                        errors.push(`Fila ${rowNumber}: Empleado no encontrado: ${assigneeName}`)
                        continue
                    }
                }

                let rubroId: string | null = null
                if (row['Rubro']) {
                    const rubroName = row['Rubro'].toString()
                    const rubro = rubros.find(r =>
                        r.name === rubroName ||
                        (r.code && r.code === rubroName)
                    )
                    if (rubro) {
                        rubroId = rubro.id
                    } else {
                        errors.push(`Fila ${rowNumber}: Rubro no encontrado: ${rubroName}`)
                        continue
                    }
                }

                let providerId: string | null = null
                if (row['Proveedor']) {
                    const providerName = row['Proveedor'].toString()
                    const provider = providers.find(p =>
                        p.name === providerName ||
                        p.email === providerName
                    )
                    if (provider) {
                        providerId = provider.id
                    } else {
                        errors.push(`Fila ${rowNumber}: Proveedor no encontrado: ${providerName}`)
                        continue
                    }
                }

                let clientId: string | null = null
                if (row['Cliente']) {
                    const clientName = row['Cliente'].toString()
                    const client = clients.find(c =>
                        c.name === clientName ||
                        c.email === clientName
                    )
                    if (client) {
                        clientId = client.id
                    } else {
                        errors.push(`Fila ${rowNumber}: Cliente no encontrado: ${clientName}`)
                        continue
                    }
                }

                // Create task
                const task = await prisma.task.create({
                    data: {
                        title: row['Título'],
                        description: row['Descripción'] || null,
                        startDate,
                        endDate,
                        estimatedHours,
                        progress,
                        priority,
                        status,
                        projectId,
                        assigneeId,
                        rubroId,
                        providerId,
                        clientId,
                        organizationId,
                        createdById: session.user.id
                    }
                })

                importedTasks.push(task)

            } catch (error: any) {
                errors.push(`Fila ${rowNumber}: Error al procesar - ${error.message}`)
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                totalRows: data.length,
                importedRows: importedTasks.length,
                errors
            }
        })

    } catch (error: any) {
        console.error('Import Excel error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
