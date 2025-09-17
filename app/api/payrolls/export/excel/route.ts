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
                        name: true,
                        email: true
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

        // Transform data for Excel
        const excelData = payrolls.map(payroll => ({
            'Employee ID': payroll.employeeId || '',
            'Employee Name': payroll.employeeName,
            'Employee Position': payroll.employeePosition || '',
            'Period': payroll.period,
            'Base Salary': payroll.baseSalary || 0,
            'Overtime Hours': payroll.overtimeHours || 0,
            'Overtime Rate': payroll.overtimeRate || 1.5,
            'Overtime Pay': payroll.overtimePay || 0,
            'Bonuses': payroll.bonuses || 0,
            'Deductions': payroll.deductions || 0,
            'Deductions Detail': payroll.deductionsDetail || '',
            'Net Pay': payroll.netPay || 0,
            'Currency': payroll.currency,
            'Cash Box': payroll.cashBox?.name || '',
            'Bank Account': payroll.bankAccount?.name || '',
            'Created By': payroll.createdBy?.name || '',
            'Created At': payroll.createdAt.toISOString().split('T')[0]
        }));

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        const columnWidths = [
            { wch: 15 }, // Employee ID
            { wch: 20 }, // Employee Name
            { wch: 20 }, // Employee Position
            { wch: 15 }, // Period
            { wch: 12 }, // Base Salary
            { wch: 15 }, // Overtime Hours
            { wch: 15 }, // Overtime Rate
            { wch: 12 }, // Overtime Pay
            { wch: 10 }, // Bonuses
            { wch: 12 }, // Deductions
            { wch: 20 }, // Deductions Detail
            { wch: 10 }, // Net Pay
            { wch: 10 }, // Currency
            { wch: 15 }, // Cash Box
            { wch: 15 }, // Bank Account
            { wch: 15 }, // Created By
            { wch: 12 }  // Created At
        ];
        worksheet['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payrolls');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Return Excel file
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=payrolls_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        });

        return response;

    } catch (error) {
        console.error('Error exporting payrolls:', error);
        return NextResponse.json({
            error: 'Failed to export payrolls',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic'
