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

        // Get all payrolls for the organization
        const payrolls = await prisma.payroll.findMany({
            where: {
                organizationId: organizationId
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: true
                    }
                },
                cashBox: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                bankAccount: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (payrolls.length === 0) {
            return NextResponse.json({ error: 'No payrolls found' }, { status: 404 });
        }

        // Create PDF
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.width;
        const pageHeight = pdf.internal.pageSize.height;
        const margin = 20;
        let yPosition = margin;

        // Title
        pdf.setFontSize(20);
        pdf.text('Payrolls Report', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Organization info
        pdf.setFontSize(12);
        pdf.text(`Organization: ${session.user.organization?.name || 'N/A'}`, margin, yPosition);
        yPosition += 10;
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
        yPosition += 10;
        pdf.text(`Total Records: ${payrolls.length}`, margin, yPosition);
        yPosition += 20;

        // Table headers
        const headers = [
            'Employee',
            'Period',
            'Base Salary',
            'Overtime',
            'Bonuses',
            'Deductions',
            'Net Pay',
            'Currency'
        ];

        const columnWidths = [40, 25, 25, 25, 20, 25, 25, 20];
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

        payrolls.forEach((payroll, index) => {
            if (yPosition > pageHeight - 30) {
                pdf.addPage();
                yPosition = margin;
            }

            xPosition = margin;

            const rowData = [
                payroll.employeeName.length > 18 ? payroll.employeeName.substring(0, 18) + '...' : payroll.employeeName,
                payroll.period,
                payroll.baseSalary ? payroll.baseSalary.toFixed(2) : '0.00',
                payroll.overtimePay ? payroll.overtimePay.toFixed(2) : '0.00',
                payroll.bonuses ? payroll.bonuses.toFixed(2) : '0.00',
                payroll.deductions ? payroll.deductions.toFixed(2) : '0.00',
                payroll.netPay ? payroll.netPay.toFixed(2) : '0.00',
                payroll.currency
            ];

            rowData.forEach((data, colIndex) => {
                pdf.text(data, xPosition, yPosition);
                xPosition += columnWidths[colIndex];
            });

            yPosition += 8;

            // Add separator line every 5 rows
            if ((index + 1) % 5 === 0 && index < payrolls.length - 1) {
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
        const totalBaseSalary = payrolls.reduce((sum, p) => sum + (p.baseSalary || 0), 0);
        const totalOvertime = payrolls.reduce((sum, p) => sum + (p.overtimePay || 0), 0);
        const totalBonuses = payrolls.reduce((sum, p) => sum + (p.bonuses || 0), 0);
        const totalDeductions = payrolls.reduce((sum, p) => sum + (p.deductions || 0), 0);
        const totalNetPay = payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0);

        const summaryData = [
            ['Total Base Salary:', totalBaseSalary.toFixed(2)],
            ['Total Overtime Pay:', totalOvertime.toFixed(2)],
            ['Total Bonuses:', totalBonuses.toFixed(2)],
            ['Total Deductions:', totalDeductions.toFixed(2)],
            ['Total Net Pay:', totalNetPay.toFixed(2)]
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
                'Content-Disposition': `attachment; filename=payrolls_report_${new Date().toISOString().split('T')[0]}.pdf`
            }
        });

        return response;

    } catch (error) {
        console.error('Error exporting payrolls PDF:', error);
        return NextResponse.json({
            error: 'Failed to export payrolls PDF',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic'
