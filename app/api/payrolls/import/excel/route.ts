import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { Currency } from '@prisma/client';

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
        const payrolls = [];
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i] as any;
            const rowNumber = i + 2; // +2 because Excel starts at 1 and we skip header

            try {
                // Validate required fields
                if (!row['Employee Name'] || !row['Period']) {
                    errors.push({
                        row: rowNumber,
                        error: 'Employee Name and Period are required'
                    });
                    continue;
                }

                // Parse currency
                let currency: Currency = Currency.PESOS;
                if (row['Currency']) {
                    const currencyValue = row['Currency'].toString().toUpperCase();
                    if (['PESOS', 'USD', 'EUR'].includes(currencyValue)) {
                        currency = currencyValue as Currency;
                    }
                }

                // Parse numeric fields
                const baseSalary = row['Base Salary'] ? parseFloat(row['Base Salary']) : null;
                const overtimeHours = row['Overtime Hours'] ? parseFloat(row['Overtime Hours']) : 0;
                const overtimeRate = row['Overtime Rate'] ? parseFloat(row['Overtime Rate']) : 1.5;
                const overtimePay = row['Overtime Pay'] ? parseFloat(row['Overtime Pay']) : 0;
                const bonuses = row['Bonuses'] ? parseFloat(row['Bonuses']) : 0;
                const deductions = row['Deductions'] ? parseFloat(row['Deductions']) : 0;
                const netPay = row['Net Pay'] ? parseFloat(row['Net Pay']) : 0;

                // Calculate net pay if not provided
                const calculatedNetPay = netPay || ((baseSalary || 0) + overtimePay + bonuses - deductions);

                // Find employee if employeeId is provided
                let employeeId = null;
                if (row['Employee ID']) {
                    const employee = await prisma.employee.findFirst({
                        where: {
                            id: row['Employee ID'],
                            organizationId: organizationId
                        }
                    });
                    if (employee) {
                        employeeId = employee.id;
                    }
                }

                // Find cash box if provided
                let cashBoxId = null;
                if (row['Cash Box']) {
                    const cashBox = await prisma.cashBox.findFirst({
                        where: {
                            name: row['Cash Box'],
                            organizationId: organizationId
                        }
                    });
                    if (cashBox) {
                        cashBoxId = cashBox.id;
                    }
                }

                // Find bank account if provided
                let bankAccountId = null;
                if (row['Bank Account']) {
                    const bankAccount = await prisma.bankAccount.findFirst({
                        where: {
                            name: row['Bank Account'],
                            organizationId: organizationId
                        }
                    });
                    if (bankAccount) {
                        bankAccountId = bankAccount.id;
                    }
                }

                const payroll = {
                    employeeId,
                    employeeName: row['Employee Name'],
                    employeePosition: row['Employee Position'] || null,
                    period: row['Period'],
                    baseSalary,
                    overtimeHours,
                    overtimeRate,
                    overtimePay,
                    bonuses,
                    deductions,
                    deductionsDetail: row['Deductions Detail'] || null,
                    netPay: calculatedNetPay,
                    currency,
                    organizationId,
                    createdById,
                    cashBoxId,
                    bankAccountId
                };

                payrolls.push(payroll);

            } catch (error) {
                errors.push({
                    row: rowNumber,
                    error: `Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        }

        if (payrolls.length === 0) {
            return NextResponse.json({
                error: 'No valid payrolls to import',
                errors
            }, { status: 400 });
        }

        // Insert payrolls in transaction
        const result = await prisma.payroll.createMany({
            data: payrolls,
            skipDuplicates: false
        });

        return NextResponse.json({
            message: `Successfully imported ${result.count} payrolls`,
            errors: errors.length > 0 ? errors : undefined,
            imported: result.count,
            total: data.length
        });

    } catch (error) {
        console.error('Error importing payrolls:', error);
        return NextResponse.json({
            error: 'Failed to import payrolls',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
