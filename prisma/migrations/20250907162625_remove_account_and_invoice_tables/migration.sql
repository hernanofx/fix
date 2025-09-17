/*
  Warnings:

  - The values [ACTIVE,PAUSED,COMPLETED,CANCELLED] on the enum `TimeStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `amount` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoices` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[transactionId]` on the table `payrolls` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."BillType" AS ENUM ('CLIENT', 'PROVIDER');

-- CreateEnum
CREATE TYPE "public"."BillStatus" AS ENUM ('DRAFT', 'PENDING', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."RubroStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."RubroType" AS ENUM ('PROVIDER', 'CLIENT');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('PESOS', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "public"."MaterialStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."MovementType" AS ENUM ('ENTRADA', 'SALIDA', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "public"."OriginDestType" AS ENUM ('CLIENT', 'PROVIDER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."PurchaseOrderStatus" AS ENUM ('PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."EntityType" AS ENUM ('CLIENT', 'PROVIDER');

-- CreateEnum
CREATE TYPE "public"."RecurrenceType" AS ENUM ('MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'CUATRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "public"."PaymentTermStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."NotificationEventType" AS ENUM ('PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_COMPLETED', 'BUDGET_CREATED', 'BUDGET_EXCEEDED', 'BUDGET_WARNING', 'INVOICE_CREATED', 'INVOICE_PAID', 'INVOICE_OVERDUE', 'BILL_CREATED', 'BILL_PAID', 'BILL_OVERDUE', 'PAYMENT_RECEIVED', 'PAYMENT_OVERDUE', 'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'CLIENT_CREATED', 'PROVIDER_CREATED', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED', 'COLLECTION_CREATED', 'TIME_TRACKING_CREATED', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_OVERDUE', 'PAYROLL_GENERATED', 'STOCK_LOW', 'PURCHASE_ORDER_CREATED', 'USER_REGISTERED', 'USER_INACTIVE');

-- CreateEnum
CREATE TYPE "public"."RecipientType" AS ENUM ('INTERNAL_USER', 'EXTERNAL_EMAIL');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('CALL', 'MEETING', 'EMAIL', 'TASK', 'FOLLOW_UP', 'SEND_QUOTE', 'SITE_VISIT');

-- CreateEnum
CREATE TYPE "public"."ActivityStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."NoteType" AS ENUM ('GENERAL', 'FOLLOW_UP', 'DECISION_MAKER', 'OBJECTION', 'COMPETITION', 'BUDGET', 'TIMELINE');

-- CreateEnum
CREATE TYPE "public"."CommunicationType" AS ENUM ('EMAIL', 'CALL', 'MEETING', 'WHATSAPP', 'LINKEDIN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "public"."CommunicationStatus" AS ENUM ('SENT', 'RECEIVED', 'MISSED', 'VOICEMAIL', 'SCHEDULED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TimeStatus_new" AS ENUM ('ACTIVO', 'COMPLETADO', 'PAUSADO', 'CANCELADO');
ALTER TABLE "public"."time_trackings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."time_trackings" ALTER COLUMN "status" TYPE "public"."TimeStatus_new" USING ("status"::text::"public"."TimeStatus_new");
ALTER TYPE "public"."TimeStatus" RENAME TO "TimeStatus_old";
ALTER TYPE "public"."TimeStatus_new" RENAME TO "TimeStatus";
DROP TYPE "public"."TimeStatus_old";
ALTER TABLE "public"."time_trackings" ALTER COLUMN "status" SET DEFAULT 'ACTIVO';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_projectId_fkey";

-- AlterTable
ALTER TABLE "public"."budgets" DROP COLUMN "amount",
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."clients" ADD COLUMN     "materialInterests" TEXT[],
ADD COLUMN     "projectInterests" TEXT[],
ADD COLUMN     "prospectNotes" TEXT,
ADD COLUMN     "rubroInterests" TEXT[];

-- AlterTable
ALTER TABLE "public"."inspections" ADD COLUMN     "inspector" TEXT;

-- AlterTable
ALTER TABLE "public"."payrolls" ADD COLUMN     "bankAccountId" TEXT,
ADD COLUMN     "cashBoxId" TEXT,
ADD COLUMN     "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "providerId" TEXT,
ADD COLUMN     "rubroId" TEXT;

-- AlterTable
ALTER TABLE "public"."time_trackings" ALTER COLUMN "status" SET DEFAULT 'ACTIVO';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."Account";

-- DropTable
DROP TABLE "public"."invoices";

-- DropEnum
DROP TYPE "public"."InvoiceStatus";

-- CreateTable
CREATE TABLE "public"."budget_items" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
    "cost" DOUBLE PRECISION NOT NULL,
    "index" TEXT,
    "budgetId" TEXT NOT NULL,
    "rubroId" TEXT NOT NULL,
    "materialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bills" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "public"."BillType" NOT NULL,
    "status" "public"."BillStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
    "taxRate" DECIMAL(5,2) DEFAULT 0,
    "taxAmount" DECIMAL(15,2) DEFAULT 0,
    "retentionRate" DECIMAL(5,2) DEFAULT 0,
    "retentionAmount" DECIMAL(15,2) DEFAULT 0,
    "otherRate" DECIMAL(5,2) DEFAULT 0,
    "otherAmount" DECIMAL(15,2) DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "clientId" TEXT,
    "providerId" TEXT,
    "paymentTermId" TEXT,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bill_rubros" (
    "id" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "amount" DECIMAL(15,2) NOT NULL,
    "billId" TEXT NOT NULL,
    "rubroId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_rubros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bill_payments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL DEFAULT 'TRANSFER',
    "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billId" TEXT NOT NULL,
    "cashBoxId" TEXT,
    "bankAccountId" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "bill_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bill_stock_movements" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "billId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Chile',
    "rut" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "category" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "status" "public"."ProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rubros" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "color" TEXT,
    "type" "public"."RubroType" NOT NULL DEFAULT 'PROVIDER',
    "status" "public"."RubroStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "rubros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "method" "public"."PaymentMethod" NOT NULL DEFAULT 'TRANSFER',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT,
    "providerId" TEXT,
    "projectId" TEXT,
    "createdById" TEXT NOT NULL,
    "cashBoxId" TEXT,
    "bankAccountId" TEXT,
    "rubroId" TEXT,
    "paymentTermId" TEXT,
    "installmentNumber" INTEGER,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "category" TEXT,
    "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "cashBoxId" TEXT,
    "bankAccountId" TEXT,
    "payrollId" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cash_boxes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'PESOS',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "cash_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "currency" "public"."Currency" NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "unit" TEXT NOT NULL,
    "minStock" DOUBLE PRECISION DEFAULT 0,
    "maxStock" DOUBLE PRECISION,
    "costPrice" DOUBLE PRECISION,
    "salePrice" DOUBLE PRECISION,
    "status" "public"."MaterialStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "rubroId" TEXT,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warehouses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stocks" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reserved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "available" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "materialId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_movements" (
    "id" TEXT NOT NULL,
    "type" "public"."MovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originType" "public"."OriginDestType",
    "originId" TEXT,
    "originName" TEXT,
    "destType" "public"."OriginDestType",
    "destId" TEXT,
    "destName" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "fromWarehouseId" TEXT,
    "toWarehouseId" TEXT,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_orders" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order_items" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchaseOrderId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "rubroId" TEXT,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_terms" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "public"."PaymentType" NOT NULL,
    "entityType" "public"."EntityType" NOT NULL,
    "clientId" TEXT,
    "providerId" TEXT,
    "projectId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "public"."Currency" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "recurrence" "public"."RecurrenceType" NOT NULL,
    "periods" INTEGER NOT NULL,
    "status" "public"."PaymentTermStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "public"."NotificationEventType" NOT NULL,
    "module" TEXT NOT NULL,
    "projectId" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailTemplate" TEXT,
    "recipients" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_recipients" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" "public"."NotificationEventType" NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "public"."NotificationStatus" NOT NULL,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityType" TEXT,
    "entityId" TEXT,
    "entityData" JSONB,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prospect_activities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."ActivityType" NOT NULL,
    "status" "public"."ActivityStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "assignedToId" TEXT,
    "prospectId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prospect_notes" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "type" "public"."NoteType" NOT NULL DEFAULT 'GENERAL',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "prospectId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prospect_communications" (
    "id" TEXT NOT NULL,
    "type" "public"."CommunicationType" NOT NULL,
    "direction" "public"."CommunicationDirection" NOT NULL,
    "subject" TEXT,
    "content" TEXT,
    "duration" INTEGER,
    "status" "public"."CommunicationStatus" NOT NULL DEFAULT 'SENT',
    "prospectId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_communications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bills_number_key" ON "public"."bills"("number");

-- CreateIndex
CREATE UNIQUE INDEX "bill_rubros_billId_rubroId_key" ON "public"."bill_rubros"("billId", "rubroId");

-- CreateIndex
CREATE UNIQUE INDEX "rubros_code_key" ON "public"."rubros"("code");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_payrollId_key" ON "public"."transactions"("payrollId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_accountNumber_key" ON "public"."bank_accounts"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "materials_code_key" ON "public"."materials"("code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "public"."warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_materialId_warehouseId_key" ON "public"."stocks"("materialId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_number_key" ON "public"."purchase_orders"("number");

-- CreateIndex
CREATE UNIQUE INDEX "notification_configs_organizationId_userId_eventType_module_key" ON "public"."notification_configs"("organizationId", "userId", "eventType", "module", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipients_configId_email_key" ON "public"."notification_recipients"("configId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_transactionId_key" ON "public"."payrolls"("transactionId");

-- AddForeignKey
ALTER TABLE "public"."budget_items" ADD CONSTRAINT "budget_items_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "public"."budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budget_items" ADD CONSTRAINT "budget_items_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "public"."rubros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budget_items" ADD CONSTRAINT "budget_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bills" ADD CONSTRAINT "bills_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bills" ADD CONSTRAINT "bills_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bills" ADD CONSTRAINT "bills_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bills" ADD CONSTRAINT "bills_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bills" ADD CONSTRAINT "bills_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bills" ADD CONSTRAINT "bills_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "public"."payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_rubros" ADD CONSTRAINT "bill_rubros_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_rubros" ADD CONSTRAINT "bill_rubros_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "public"."rubros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_payments" ADD CONSTRAINT "bill_payments_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_payments" ADD CONSTRAINT "bill_payments_cashBoxId_fkey" FOREIGN KEY ("cashBoxId") REFERENCES "public"."cash_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_payments" ADD CONSTRAINT "bill_payments_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_payments" ADD CONSTRAINT "bill_payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_stock_movements" ADD CONSTRAINT "bill_stock_movements_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_stock_movements" ADD CONSTRAINT "bill_stock_movements_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill_stock_movements" ADD CONSTRAINT "bill_stock_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."providers" ADD CONSTRAINT "providers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."providers" ADD CONSTRAINT "providers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rubros" ADD CONSTRAINT "rubros_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rubros" ADD CONSTRAINT "rubros_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payrolls" ADD CONSTRAINT "payrolls_cashBoxId_fkey" FOREIGN KEY ("cashBoxId") REFERENCES "public"."cash_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payrolls" ADD CONSTRAINT "payrolls_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "public"."rubros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_cashBoxId_fkey" FOREIGN KEY ("cashBoxId") REFERENCES "public"."cash_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "public"."rubros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "public"."payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_cashBoxId_fkey" FOREIGN KEY ("cashBoxId") REFERENCES "public"."cash_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "public"."payrolls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_boxes" ADD CONSTRAINT "cash_boxes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank_accounts" ADD CONSTRAINT "bank_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."materials" ADD CONSTRAINT "materials_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."materials" ADD CONSTRAINT "materials_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."materials" ADD CONSTRAINT "materials_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "public"."rubros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warehouses" ADD CONSTRAINT "warehouses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warehouses" ADD CONSTRAINT "warehouses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stocks" ADD CONSTRAINT "stocks_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stocks" ADD CONSTRAINT "stocks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "public"."rubros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_terms" ADD CONSTRAINT "payment_terms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_terms" ADD CONSTRAINT "payment_terms_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_terms" ADD CONSTRAINT "payment_terms_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_terms" ADD CONSTRAINT "payment_terms_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_configs" ADD CONSTRAINT "notification_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_configs" ADD CONSTRAINT "notification_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_configs" ADD CONSTRAINT "notification_configs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_recipients" ADD CONSTRAINT "notification_recipients_configId_fkey" FOREIGN KEY ("configId") REFERENCES "public"."notification_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_logs" ADD CONSTRAINT "notification_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prospect_activities" ADD CONSTRAINT "prospect_activities_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prospect_activities" ADD CONSTRAINT "prospect_activities_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "public"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prospect_activities" ADD CONSTRAINT "prospect_activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prospect_activities" ADD CONSTRAINT "prospect_activities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prospect_notes" ADD CONSTRAINT "prospect_notes_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "public"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prospect_notes" ADD CONSTRAINT "prospect_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prospect_notes" ADD CONSTRAINT "prospect_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prospect_communications" ADD CONSTRAINT "prospect_communications_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "public"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prospect_communications" ADD CONSTRAINT "prospect_communications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prospect_communications" ADD CONSTRAINT "prospect_communications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
