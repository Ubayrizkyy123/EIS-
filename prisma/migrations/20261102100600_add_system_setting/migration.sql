-- New users default to the least-privileged active role.
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERATOR';

-- Legacy accounts remain for profile history but can no longer sign in.
UPDATE "User"
SET "isActive" = false
WHERE "role" IN ('GURU', 'SISWA', 'ORANG_TUA');

CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");
