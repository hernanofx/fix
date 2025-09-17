-- CreateTable
CREATE TABLE "employee_projects" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "employeeName" TEXT NOT NULL,
    "employeePosition" TEXT,
    "period" TEXT NOT NULL,
    "baseSalary" DOUBLE PRECISION,
    "overtimeHours" DOUBLE PRECISION DEFAULT 0,
    "overtimeRate" DOUBLE PRECISION DEFAULT 1.5,
    "overtimePay" DOUBLE PRECISION DEFAULT 0,
    "bonuses" DOUBLE PRECISION DEFAULT 0,
    "deductions" DOUBLE PRECISION DEFAULT 0,
    "deductionsDetail" TEXT,
    "netPay" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_projects_employeeId_projectId_key" ON "employee_projects"("employeeId", "projectId");

-- AddForeignKey
ALTER TABLE "employee_projects" ADD CONSTRAINT "employee_projects_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_projects" ADD CONSTRAINT "employee_projects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
