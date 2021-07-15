-- CreateTable
CREATE TABLE "MegalogLogChannel" (
    "eventName" TEXT NOT NULL,
    "guildId" VARCHAR(20) NOT NULL,
    "channelId" VARCHAR(20) NOT NULL,

    PRIMARY KEY ("eventName","guildId")
);

CREATE CONSTRAINT TRIGGER "MegalogLogChannel_insert_trigger"
    AFTER INSERT
    ON "MegalogLogChannel"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "MegalogLogChannel_update_trigger"
    AFTER UPDATE
    ON "MegalogLogChannel"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD <> NEW)
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "MegalogLogChannel_delete_trigger"
    AFTER DELETE
    ON "MegalogLogChannel"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_delete('eventName' , 'guildId');

-- CreateTable
CREATE TABLE "MegalogSettings" (
    "version" SERIAL NOT NULL,
    "auditLogMatchTryInterval" INTEGER NOT NULL DEFAULT 1000,
    "auditLogFetchSize" INTEGER NOT NULL DEFAULT 10,
    "maxAuditLogMatchQueueLength" INTEGER NOT NULL DEFAULT 100,
    "maxAuditLogMatchTries" INTEGER NOT NULL DEFAULT 10,

    PRIMARY KEY ("version")
);

CREATE CONSTRAINT TRIGGER "MegalogSettings_insert_trigger"
    AFTER INSERT
    ON "MegalogSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "MegalogSettings_update_trigger"
    AFTER UPDATE
    ON "MegalogSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD <> NEW)
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "MegalogSettings_delete_trigger"
    AFTER DELETE
    ON "MegalogSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_delete('version');
