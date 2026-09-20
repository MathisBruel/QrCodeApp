-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable QRCode
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL,
    "shortCode" VARCHAR(10) NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable Click
CREATE TABLE "Click" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceType" TEXT,
    "osName" TEXT,
    "osVersion" TEXT,
    "browserName" TEXT,
    "browserVersion" TEXT,
    "country" TEXT,
    "city" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_shortCode_key" ON "QRCode"("shortCode");
CREATE INDEX "QRCode_createdBy_idx" ON "QRCode"("createdBy");
CREATE INDEX "QRCode_shortCode_idx" ON "QRCode"("shortCode");
CREATE INDEX "QRCode_isActive_idx" ON "QRCode"("isActive");

-- CreateIndex
CREATE INDEX "Click_qrCodeId_idx" ON "Click"("qrCodeId");
CREATE INDEX "Click_timestamp_idx" ON "Click"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
