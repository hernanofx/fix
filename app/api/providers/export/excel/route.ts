import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const organizationId = session.user.organizationId;

        // Get all providers for the organization
        const providers = await prisma.provider.findMany({
            where: {
                organizationId: organizationId
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        bills: true,
                        payments: true,
                        purchaseOrders: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (providers.length === 0) {
            return NextResponse.json({ error: 'No providers found' }, { status: 404 });
        }

        // Transform data for Excel
        const excelData = providers.map(provider => ({
            'Name': provider.name,
            'Email': provider.email || '',
            'Phone': provider.phone || '',
            'Address': provider.address || '',
            'City': provider.city || '',
            'Country': provider.country || 'Chile',
            'RUT': provider.rut || '',
            'Contact Name': provider.contactName || '',
            'Contact Phone': provider.contactPhone || '',
            'Website': provider.website || '',
            'Category': provider.category || '',
            'Payment Terms': provider.paymentTerms || '',
            'Notes': provider.notes || '',
            'Status': provider.status,
            'Bills Count': provider._count.bills,
            'Payments Count': provider._count.payments,
            'Purchase Orders Count': provider._count.purchaseOrders,
            'Created By': provider.createdBy?.name || '',
            'Created At': provider.createdAt.toISOString().split('T')[0]
        }));

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        const columnWidths = [
            { wch: 25 }, // Name
            { wch: 30 }, // Email
            { wch: 15 }, // Phone
            { wch: 30 }, // Address
            { wch: 15 }, // City
            { wch: 15 }, // Country
            { wch: 15 }, // RUT
            { wch: 20 }, // Contact Name
            { wch: 15 }, // Contact Phone
            { wch: 25 }, // Website
            { wch: 15 }, // Category
            { wch: 20 }, // Payment Terms
            { wch: 30 }, // Notes
            { wch: 12 }, // Status
            { wch: 12 }, // Bills Count
            { wch: 12 }, // Payments Count
            { wch: 18 }, // Purchase Orders Count
            { wch: 15 }, // Created By
            { wch: 12 }  // Created At
        ];
        worksheet['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Providers');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Return Excel file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=providers_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        });

        return response;

    } catch (error) {
        console.error('Error exporting providers:', error);
        return NextResponse.json({
            error: 'Failed to export providers',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic'
