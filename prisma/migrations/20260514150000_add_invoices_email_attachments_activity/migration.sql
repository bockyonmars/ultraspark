-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerActivityType" AS ENUM (
  'QUOTE_CREATED',
  'QUOTE_SENT',
  'INVOICE_CREATED',
  'INVOICE_UPLOADED',
  'INVOICE_SENT',
  'INVOICE_PAID',
  'EMAIL_SENT',
  'EMAIL_FAILED',
  'SUPPORT_TICKET_CREATED',
  'BOOKING_UPDATED',
  'NOTE_ADDED'
);

-- AlterEnum
ALTER TYPE "EmailLogStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INVOICE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INVOICE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INVOICE_SENT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INVOICE_PAID';

-- AlterTable
ALTER TABLE "EmailLog"
  ADD COLUMN "cc" TEXT,
  ADD COLUMN "bcc" TEXT,
  ADD COLUMN "body" TEXT,
  ADD COLUMN "customerId" TEXT,
  ADD COLUMN "invoiceId" TEXT,
  ADD COLUMN "sentByAdminId" TEXT,
  ADD COLUMN "sentAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "provider" DROP DEFAULT,
  ALTER COLUMN "provider" DROP NOT NULL;

-- Backfill updatedAt from createdAt, then keep application-managed updates.
UPDATE "EmailLog" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NOT NULL;

-- CreateTable
CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "bookingId" TEXT,
  "quoteId" TEXT,
  "supportTicketId" TEXT,
  "invoiceNumber" TEXT NOT NULL,
  "invoiceDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "paymentLink" TEXT,
  "pdfUrl" TEXT,
  "pdfStorageKey" TEXT,
  "pdfFileName" TEXT,
  "pdfFileSize" INTEGER,
  "notes" TEXT,
  "paidAt" TIMESTAMP(3),
  "paymentMethod" TEXT,
  "paymentNotes" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAttachment" (
  "id" TEXT NOT NULL,
  "emailLogId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileType" TEXT,
  "fileSize" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerActivity" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "type" "CustomerActivityType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "relatedEntityType" TEXT,
  "relatedEntityId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CustomerActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_bookingId_idx" ON "Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "Invoice_quoteId_idx" ON "Invoice"("quoteId");

-- CreateIndex
CREATE INDEX "Invoice_supportTicketId_idx" ON "Invoice"("supportTicketId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "EmailLog_customerId_idx" ON "EmailLog"("customerId");

-- CreateIndex
CREATE INDEX "EmailLog_invoiceId_idx" ON "EmailLog"("invoiceId");

-- CreateIndex
CREATE INDEX "EmailLog_bookingRequestId_idx" ON "EmailLog"("bookingRequestId");

-- CreateIndex
CREATE INDEX "EmailLog_quoteId_idx" ON "EmailLog"("quoteId");

-- CreateIndex
CREATE INDEX "EmailLog_supportTicketId_idx" ON "EmailLog"("supportTicketId");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmailAttachment_emailLogId_idx" ON "EmailAttachment"("emailLogId");

-- CreateIndex
CREATE INDEX "CustomerActivity_customerId_idx" ON "CustomerActivity"("customerId");

-- CreateIndex
CREATE INDEX "CustomerActivity_type_idx" ON "CustomerActivity"("type");

-- CreateIndex
CREATE INDEX "CustomerActivity_relatedEntityType_relatedEntityId_idx" ON "CustomerActivity"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "CustomerActivity_createdAt_idx" ON "CustomerActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_sentByAdminId_fkey" FOREIGN KEY ("sentByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_supportTicketId_fkey" FOREIGN KEY ("supportTicketId") REFERENCES "SupportTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_emailLogId_fkey" FOREIGN KEY ("emailLogId") REFERENCES "EmailLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerActivity" ADD CONSTRAINT "CustomerActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
