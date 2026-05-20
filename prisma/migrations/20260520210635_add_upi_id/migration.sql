-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "zip" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "taxId" TEXT NOT NULL DEFAULT '',
    "gst" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "mobile" TEXT NOT NULL DEFAULT '',
    "upiId" TEXT NOT NULL DEFAULT '',
    "logo" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "invoiceNote" TEXT NOT NULL DEFAULT '',
    "taxRate" REAL NOT NULL DEFAULT 0,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-',
    "quotationPrefix" TEXT NOT NULL DEFAULT 'QTN-',
    "defaultPaymentTerms" INTEGER NOT NULL DEFAULT 30,
    "defaultDueDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Company" ("address", "city", "country", "createdAt", "currency", "defaultDueDays", "defaultPaymentTerms", "email", "gst", "id", "invoiceNote", "invoicePrefix", "logo", "mobile", "name", "phone", "quotationPrefix", "state", "taxId", "taxRate", "updatedAt", "website", "zip") SELECT "address", "city", "country", "createdAt", "currency", "defaultDueDays", "defaultPaymentTerms", "email", "gst", "id", "invoiceNote", "invoicePrefix", "logo", "mobile", "name", "phone", "quotationPrefix", "state", "taxId", "taxRate", "updatedAt", "website", "zip" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
