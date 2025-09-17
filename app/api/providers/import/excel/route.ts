import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { ProviderStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Read Excel file
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
        }

        const organizationId = session.user.organizationId;
        const createdById = session.user.id;
        const providers = [];
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i] as any;
            const rowNumber = i + 2; // +2 because Excel starts at 1 and we skip header

            try {
                // Validate required fields
                if (!row['Name']) {
                    errors.push({
                        row: rowNumber,
                        error: 'Name is required'
                    });
                    continue;
                }

                // Parse status
                let status: ProviderStatus = ProviderStatus.ACTIVE;
                if (row['Status']) {
                    const statusValue = row['Status'].toString().toUpperCase();
                    if (['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(statusValue)) {
                        status = statusValue as ProviderStatus;
                    }
                }

                const provider = {
                    name: row['Name'],
                    email: row['Email'] || null,
                    phone: row['Phone'] || null,
                    address: row['Address'] || null,
                    city: row['City'] || null,
                    country: row['Country'] || 'Chile',
                    rut: row['RUT'] || null,
                    contactName: row['Contact Name'] || null,
                    contactPhone: row['Contact Phone'] || null,
                    website: row['Website'] || null,
                    category: row['Category'] || null,
                    paymentTerms: row['Payment Terms'] || null,
                    notes: row['Notes'] || null,
                    status,
                    organizationId,
                    createdById
                };

                providers.push(provider);

            } catch (error) {
                errors.push({
                    row: rowNumber,
                    error: `Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        }

        if (providers.length === 0) {
            return NextResponse.json({
                error: 'No valid providers to import',
                errors
            }, { status: 400 });
        }

        // Insert providers in transaction
        const result = await prisma.provider.createMany({
            data: providers,
            skipDuplicates: false
        });

        return NextResponse.json({
            message: `Successfully imported ${result.count} providers`,
            errors: errors.length > 0 ? errors : undefined,
            imported: result.count,
            total: data.length
        });

    } catch (error) {
        console.error('Error importing providers:', error);
        return NextResponse.json({
            error: 'Failed to import providers',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
