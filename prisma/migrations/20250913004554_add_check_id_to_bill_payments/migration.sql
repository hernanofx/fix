-- AlterTable
ALTER TABLE "public"."bill_payments" ADD COLUMN     "checkId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."bill_payments" ADD CONSTRAINT "bill_payments_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "public"."checks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
