-- CreateTable
CREATE TABLE "MegalogIgnoreChannel" (
    "guildId" VARCHAR(20) NOT NULL,
    "channelId" VARCHAR(20) NOT NULL,

    PRIMARY KEY ("guildId","channelId")
);

CREATE CONSTRAINT TRIGGER "MegalogIgnoreChannel_insert_trigger"
    AFTER INSERT
    ON "MegalogIgnoreChannel"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "MegalogIgnoreChannel_delete_trigger"
    AFTER DELETE
    ON "MegalogIgnoreChannel"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_delete('guildId', 'channelId');
