-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "internationalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "planTypeId" INTEGER;

-- CreateTable
CREATE TABLE "PlanType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "PlanType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanType_name_key" ON "PlanType"("name");

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_planTypeId_fkey" FOREIGN KEY ("planTypeId") REFERENCES "PlanType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
