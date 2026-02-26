/*
  Warnings:

  - You are about to drop the column `exerciseId` on the `PersonalRecord` table. All the data in the column will be lost.
  - Added the required column `exercise` to the `PersonalRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oneRM` to the `PersonalRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PersonalRecord" DROP CONSTRAINT "PersonalRecord_exerciseId_fkey";

-- AlterTable
ALTER TABLE "PersonalRecord" DROP COLUMN "exerciseId",
ADD COLUMN     "exercise" TEXT NOT NULL,
ADD COLUMN     "oneRM" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "ScoreBox" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "measureUnit" TEXT NOT NULL,
    "planId" INTEGER NOT NULL,

    CONSTRAINT "ScoreBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreEntry" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "scoreBoxId" INTEGER NOT NULL,

    CONSTRAINT "ScoreEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WallPost" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "WallPost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScoreBox" ADD CONSTRAINT "ScoreBox_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreEntry" ADD CONSTRAINT "ScoreEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreEntry" ADD CONSTRAINT "ScoreEntry_scoreBoxId_fkey" FOREIGN KEY ("scoreBoxId") REFERENCES "ScoreBox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallPost" ADD CONSTRAINT "WallPost_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallPost" ADD CONSTRAINT "WallPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
