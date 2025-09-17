/*
  Warnings:

  - You are about to drop the column `balance` on the `bank_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `cash_boxes` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PlanStatus" AS ENUM ('DRAFT', 'EN_REVISION', 'APROBADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "public"."ApuStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."AssignmentStatus" AS ENUM ('ACTIVO', 'INACTIVO', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "public"."CheckStatus" AS ENUM ('ISSUED', 'PENDING', 'CLEARED', 'REJECTED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PlanType" ADD VALUE 'ARQUITECTONICO';
ALTER TYPE "public"."PlanType" ADD VALUE 'ESTRUCTURAL';
ALTER TYPE "public"."PlanType" ADD VALUE 'ELECTRICO';
ALTER TYPE "public"."PlanType" ADD VALUE 'INSTALACIONES';
ALTER TYPE "public"."PlanType" ADD VALUE 'OTRO';

-- AlterTable
ALTER TABLE "public"."bank_accounts" DROP COLUMN "balance";

-- AlterTable
ALTER TABLE "public"."cash_boxes" DROP COLUMN "balance";

-- AlterTable
ALTER TABLE "public"."materials" ADD COLUMN     "costCurrency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
ADD COLUMN     "saleCurrency" "public"."Currency" NOT NULL DEFAULT 'PESOS';

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "checkId" TEXT;

-- AlterTable
ALTER TABLE "public"."purchase_orders" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "public"."stock_movements" ADD COLUMN     "costPrice" DOUBLE PRECISION,
ADD COLUMN     "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS';

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "externalLinks" JSONB;

-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN     "checkId" TEXT;

-- CreateTable
CREATE TABLE "public"."plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."PlanType" NOT NULL,
    "version" TEXT,
    "status" "public"."PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "fileUrl" TEXT,
    "fileSize" TEXT,
    "lastModified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account_balances" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "currency" "public"."Currency" NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "account_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."apu_partidas" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
    "materialsSubtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "laborSubtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "equipmentSubtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overheadRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "profitRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "directCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "indirectCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "public"."ApuStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "budgetId" TEXT,

    CONSTRAINT "apu_partidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."apu_materials" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
    "totalCost" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apuPartidaId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "apu_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."apu_labors" (
    "id" TEXT NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL,
    "hourlyRate" DECIMAL(15,2) NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
    "totalCost" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apuPartidaId" TEXT NOT NULL,
    "rubroId" TEXT NOT NULL,

    CONSTRAINT "apu_labors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."apu_equipments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
    "totalCost" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apuPartidaId" TEXT NOT NULL,

    CONSTRAINT "apu_equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assignments" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "hoursPerWeek" INTEGER NOT NULL,
    "status" "public"."AssignmentStatus" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wiki_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiki_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wiki_pages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiki_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."checks" (
    "id" TEXT NOT NULL,
    "checkNumber" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
    "issuerName" TEXT NOT NULL,
    "issuerBank" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."CheckStatus" NOT NULL DEFAULT 'ISSUED',
    "organizationId" TEXT NOT NULL,
    "cashBoxId" TEXT,
    "bankAccountId" TEXT,
    "receivedFrom" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_balances_accountId_accountType_currency_key" ON "public"."account_balances"("accountId", "accountType", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "apu_partidas_code_key" ON "public"."apu_partidas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_categories_slug_key" ON "public"."wiki_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_pages_slug_key" ON "public"."wiki_pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "checks_checkNumber_organizationId_key" ON "public"."checks"("checkNumber", "organizationId");

-- AddForeignKey
ALTER TABLE "public"."plans" ADD CONSTRAINT "plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plans" ADD CONSTRAINT "plans_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plans" ADD CONSTRAINT "plans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "public"."checks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "public"."checks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."apu_partidas" ADD CONSTRAINT "apu_partidas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."apu_partidas" ADD CONSTRAINT "apu_partidas_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."apu_partidas" ADD CONSTRAINT "apu_partidas_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "public"."budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."apu_materials" ADD CONSTRAINT "apu_materials_apuPartidaId_fkey" FOREIGN KEY ("apuPartidaId") REFERENCES "public"."apu_partidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."apu_materials" ADD CONSTRAINT "apu_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."apu_labors" ADD CONSTRAINT "apu_labors_apuPartidaId_fkey" FOREIGN KEY ("apuPartidaId") REFERENCES "public"."apu_partidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."apu_labors" ADD CONSTRAINT "apu_labors_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "public"."rubros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."apu_equipments" ADD CONSTRAINT "apu_equipments_apuPartidaId_fkey" FOREIGN KEY ("apuPartidaId") REFERENCES "public"."apu_partidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wiki_categories" ADD CONSTRAINT "wiki_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."wiki_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wiki_categories" ADD CONSTRAINT "wiki_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wiki_pages" ADD CONSTRAINT "wiki_pages_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."wiki_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wiki_pages" ADD CONSTRAINT "wiki_pages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."checks" ADD CONSTRAINT "checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."checks" ADD CONSTRAINT "checks_cashBoxId_fkey" FOREIGN KEY ("cashBoxId") REFERENCES "public"."cash_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."checks" ADD CONSTRAINT "checks_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
