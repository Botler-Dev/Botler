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

CREATE CONSTRAINT TRIGGER "CommandSettings_insert_trigger"
    AFTER INSERT
    ON "CommandSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "CommandSettings_update_trigger"
    AFTER UPDATE
    ON "CommandSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD <> NEW)
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "CommandSettings_delete_trigger"
    AFTER DELETE
    ON "CommandSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_delete('version');
