import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';

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
                        name: true
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

        // Create PDF
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.width;
        const pageHeight = pdf.internal.pageSize.height;
        const margin = 20;
        let yPosition = margin;

        // Title
        pdf.setFontSize(20);
        pdf.text('Providers Report', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Organization info
        pdf.setFontSize(12);
        pdf.text(`Organization: ${session.user.organization?.name || 'N/A'}`, margin, yPosition);
        yPosition += 10;
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
        yPosition += 10;
        pdf.text(`Total Records: ${providers.length}`, margin, yPosition);
        yPosition += 20;

        // Table headers
        const headers = [
            'Name',
            'Contact',
            'Phone',
            'Status',
            'Bills',
            'Payments'
        ];

        const columnWidths = [40, 35, 25, 20, 15, 15];
        let xPosition = margin;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');

        headers.forEach((header, index) => {
            pdf.text(header, xPosition, yPosition);
            xPosition += columnWidths[index];
        });

        yPosition += 8;
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;

        // Table data
        pdf.setFont('helvetica', 'normal');

        providers.forEach((provider, index) => {
            if (yPosition > pageHeight - 30) {
                pdf.addPage();
                yPosition = margin;
            }

            xPosition = margin;

            const rowData = [
                provider.name.length > 18 ? provider.name.substring(0, 18) + '...' : provider.name,
                (provider.contactName || '').length > 16 ? (provider.contactName || '').substring(0, 16) + '...' : (provider.contactName || ''),
                provider.phone || '',
                provider.status,
                provider._count.bills.toString(),
                provider._count.payments.toString()
            ];

            rowData.forEach((data, colIndex) => {
                pdf.text(data, xPosition, yPosition);
                xPosition += columnWidths[colIndex];
            });

            yPosition += 8;

            // Add separator line every 5 rows
            if ((index + 1) % 5 === 0 && index < providers.length - 1) {
                pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 5;
            }
        });

        // Summary section
        if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = margin;
        }

        yPosition += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Summary', margin, yPosition);
        yPosition += 10;

        pdf.setFont('helvetica', 'normal');

        // Calculate totals
        const totalBills = providers.reduce((sum, p) => sum + p._count.bills, 0);
        const totalPayments = providers.reduce((sum, p) => sum + p._count.payments, 0);
        const totalPurchaseOrders = providers.reduce((sum, p) => sum + p._count.purchaseOrders, 0);

        const summaryData = [
            ['Total Providers:', providers.length.toString()],
            ['Total Bills:', totalBills.toString()],
            ['Total Payments:', totalPayments.toString()],
            ['Total Purchase Orders:', totalPurchaseOrders.toString()]
        ];

        summaryData.forEach(([label, value]) => {
            pdf.text(label, margin, yPosition);
            pdf.text(value, margin + 80, yPosition);
            yPosition += 8;
        });

        // Generate buffer
        const buffer = Buffer.from(pdf.output('arraybuffer'));

        // Return PDF file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=providers_report_${new Date().toISOString().split('T')[0]}.pdf`
            }
        });

        return response;

    } catch (error) {
        console.error('Error exporting providers PDF:', error);
        return NextResponse.json({
            error: 'Failed to export providers PDF',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic'
