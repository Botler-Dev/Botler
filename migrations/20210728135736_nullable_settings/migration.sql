-- AlterTable
ALTER TABLE "GlobalSettings" DROP COLUMN "defaultPrefix",
ALTER COLUMN "discordToken" DROP NOT NULL,
ALTER COLUMN "colorDefault" DROP NOT NULL,
ALTER COLUMN "colorDefault" DROP DEFAULT,
ALTER COLUMN "colorBad" DROP NOT NULL,
ALTER COLUMN "colorBad" DROP DEFAULT,
ALTER COLUMN "colorGood" DROP NOT NULL,
ALTER COLUMN "colorGood" DROP DEFAULT,
ALTER COLUMN "colorWarn" DROP NOT NULL,
ALTER COLUMN "colorWarn" DROP DEFAULT,
ALTER COLUMN "cleanInterval" DROP NOT NULL,
ALTER COLUMN "cleanInterval" DROP DEFAULT;

-- CreateTable
CREATE TABLE "CommandSettings" (
    "version" SERIAL NOT NULL,
    "defaultPrefix" TEXT,

    PRIMARY KEY ("version")
);
