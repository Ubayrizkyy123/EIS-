-- CreateEnum
CREATE TYPE "FinanceType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "FinanceStatus" AS ENUM ('POSTED', 'VOID');

-- CreateEnum
CREATE TYPE "FacilityCondition" AS ENUM ('BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('DILAPORKAN', 'DIJADWALKAN', 'SELESAI');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "TeachingAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceTransaction" (
    "id" TEXT NOT NULL,
    "type" "FinanceType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "transactionDate" DATE NOT NULL,
    "status" "FinanceStatus" NOT NULL DEFAULT 'POSTED',
    "createdById" TEXT NOT NULL,
    "voidedById" TEXT,
    "voidReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "condition" "FacilityCondition" NOT NULL DEFAULT 'BAIK',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityMaintenance" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledDate" DATE,
    "completedDate" DATE,
    "cost" DECIMAL(14,2),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'DILAPORKAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiIndicator" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "target" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiMeasurement" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "measuredById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'INFO',
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "entityType" TEXT,
    "entityId" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeachingAssignment_classId_subjectId_idx" ON "TeachingAssignment"("classId", "subjectId");

-- CreateIndex
CREATE INDEX "TeachingAssignment_academicYearId_idx" ON "TeachingAssignment"("academicYearId");

-- CreateIndex
CREATE INDEX "TeachingAssignment_teacherId_academicYearId_idx" ON "TeachingAssignment"("teacherId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingAssignment_teacherId_classId_subjectId_academicYear_key" ON "TeachingAssignment"("teacherId", "classId", "subjectId", "academicYearId");

-- CreateIndex
CREATE INDEX "FinanceTransaction_transactionDate_type_idx" ON "FinanceTransaction"("transactionDate", "type");

-- CreateIndex
CREATE INDEX "FinanceTransaction_status_idx" ON "FinanceTransaction"("status");

-- CreateIndex
CREATE INDEX "FinanceTransaction_createdById_idx" ON "FinanceTransaction"("createdById");

-- CreateIndex
CREATE INDEX "FinanceTransaction_voidedById_idx" ON "FinanceTransaction"("voidedById");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_code_key" ON "Facility"("code");

-- CreateIndex
CREATE INDEX "FacilityMaintenance_facilityId_status_idx" ON "FacilityMaintenance"("facilityId", "status");

-- CreateIndex
CREATE INDEX "FacilityMaintenance_reportedById_idx" ON "FacilityMaintenance"("reportedById");

-- CreateIndex
CREATE UNIQUE INDEX "KpiIndicator_code_key" ON "KpiIndicator"("code");

-- CreateIndex
CREATE INDEX "KpiMeasurement_period_idx" ON "KpiMeasurement"("period");

-- CreateIndex
CREATE INDEX "KpiMeasurement_measuredById_idx" ON "KpiMeasurement"("measuredById");

-- CreateIndex
CREATE UNIQUE INDEX "KpiMeasurement_indicatorId_period_key" ON "KpiMeasurement"("indicatorId", "period");

-- CreateIndex
CREATE INDEX "Alert_status_severity_idx" ON "Alert"("status", "severity");

-- CreateIndex
CREATE INDEX "Alert_entityType_entityId_idx" ON "Alert"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Alert_resolvedById_idx" ON "Alert"("resolvedById");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "TeachingAssignment" ADD CONSTRAINT "TeachingAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingAssignment" ADD CONSTRAINT "TeachingAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingAssignment" ADD CONSTRAINT "TeachingAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingAssignment" ADD CONSTRAINT "TeachingAssignment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityMaintenance" ADD CONSTRAINT "FacilityMaintenance_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityMaintenance" ADD CONSTRAINT "FacilityMaintenance_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiMeasurement" ADD CONSTRAINT "KpiMeasurement_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "KpiIndicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiMeasurement" ADD CONSTRAINT "KpiMeasurement_measuredById_fkey" FOREIGN KEY ("measuredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enforce at most one active academic year without changing existing application data.
CREATE UNIQUE INDEX "AcademicYear_single_active_idx"
ON "AcademicYear" ("isActive")
WHERE "isActive" = true;
