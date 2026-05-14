-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "quoteRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteRequestId_key" ON "Quote"("quoteRequestId");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
