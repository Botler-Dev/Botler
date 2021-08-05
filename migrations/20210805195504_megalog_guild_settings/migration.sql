-- AlterTable
ALTER TABLE "MegalogSettings" ADD COLUMN     "guildAttachCondensedJsonDefault" BOOLEAN,
ADD COLUMN     "guildShowCondensedPreviewDefault" BOOLEAN;

-- CreateTable
CREATE TABLE "MegalogGuildSettings" (
    "guildId" VARCHAR(20) NOT NULL,
    "attachCondensedJson" BOOLEAN,
    "showCondensedPreview" BOOLEAN,

    PRIMARY KEY ("guildId")
);

CREATE CONSTRAINT TRIGGER "MegalogGuildSettings_insert_trigger"
    AFTER INSERT
    ON "MegalogGuildSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "MegalogGuildSettings_update_trigger"
    AFTER UPDATE
    ON "MegalogGuildSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD <> NEW)
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "MegalogGuildSettings_delete_trigger"
    AFTER DELETE
    ON "MegalogGuildSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_delete('guildId');
