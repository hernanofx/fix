import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            return NextResponse.json({ error: 'Invalid file type. Only Excel files are allowed.' }, { status: 400 })
        }

        // Parse Excel file
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)

        const organizationId = (session.user as any).organizationId
        const createdById = session.user.id

        let imported = 0
        const errors: string[] = []

        for (const row of data as any[]) {
            try {
                // Validate required fields
                if (!row['Number'] || !row['Provider Name']) {
                    errors.push(`Row ${data.indexOf(row) + 2}: Missing required fields (Number, Provider Name)`)
                    continue
                }

                // Find provider by name
                let provider = await prisma.provider.findFirst({
                    where: {
                        name: row['Provider Name'],
                        organizationId: organizationId
                    }
                })

                if (!provider && row['Provider ID']) {
                    provider = await prisma.provider.findFirst({
                        where: {
                            id: row['Provider ID'],
                            organizationId: organizationId
                        }
                    })
                }

                if (!provider) {
                    errors.push(`Row ${data.indexOf(row) + 2}: Provider "${row['Provider Name']}" not found`)
                    continue
                }

                // Parse items if provided
                let items = []
                if (row['Items']) {
                    try {
                        items = JSON.parse(row['Items'])
                    } catch {
                        // If not JSON, create a simple item
                        items = [{
                            description: row['Items'],
                            quantity: row['Quantity'] || 1,
                            unitPrice: row['Unit Price'] || 0
                        }]
                    }
                }

                // Create purchase order
                await prisma.purchaseOrder.create({
                    data: {
                        number: row['Number'],
                        description: row['Description'] || '',
                        status: row['Status'] || 'PENDING',
                        deliveryDate: row['Delivery Date'] ? new Date(row['Delivery Date']) : null,
                        notes: row['Notes'] || '',
                        providerId: provider.id,
                        organizationId: organizationId,
                        createdById: createdById,
                        items: {
                            create: items.map((item: any) => ({
                                description: item.description || '',
                                quantity: item.quantity || 1,
                                unitPrice: item.unitPrice || 0,
                                total: (item.quantity || 1) * (item.unitPrice || 0)
                            }))
                        }
                    }
                })

                imported++
            } catch (error: any) {
                errors.push(`Row ${data.indexOf(row) + 2}: ${error.message}`)
            }
        }

        return NextResponse.json({
            message: 'Import completed',
            imported,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (error: any) {
        console.error('Import error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
