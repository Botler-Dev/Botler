CREATE OR REPLACE FUNCTION trigger_notify_entity_insert_or_update()
    RETURNS TRIGGER
    LANGUAGE plpgsql
as
$$
BEGIN
    PERFORM pg_notify('sync_' || TG_TABLE_NAME || '_' || TG_OP, row_to_json(NEW)::text);
    RETURN NULL;
END
$$;

CREATE OR REPLACE FUNCTION trigger_notify_entity_delete()
    RETURNS TRIGGER
    LANGUAGE plpgsql
as
$$
DECLARE
    columnName text;
    selections text[] := '{}';
    payload    record;
BEGIN
    FOREACH columnName IN ARRAY TG_ARGV
        LOOP
            selections := selections || ('($1)."' || columnName || '"');
        END LOOP;
    EXECUTE 'SELECT ' || array_to_string(selections, ', ') USING OLD INTO payload;
    PERFORM pg_notify('sync_' || TG_TABLE_NAME || '_DELETE', row_to_json(payload)::text);
    RETURN NULL;
END
$$;

-- CreateEnum
CREATE TYPE "CommandReactionListenerActionFilter" AS ENUM ('Both', 'Add', 'Remove');

-- CreateTable
CREATE TABLE "GlobalSettings"
(
    "version"       SERIAL  NOT NULL,
    "discordToken"  TEXT    NOT NULL,
    "defaultPrefix" TEXT    NOT NULL DEFAULT E'?!',
    "colorDefault"  INTEGER NOT NULL DEFAULT 7506394,
    "colorBad"      INTEGER NOT NULL DEFAULT 16718602,
    "colorGood"     INTEGER NOT NULL DEFAULT 3461464,
    "colorWarn"     INTEGER NOT NULL DEFAULT 16745728,
    "cleanInterval" INTEGER NOT NULL DEFAULT 600000,
    "masterUserIds" VARCHAR(20)[],
    PRIMARY KEY ("version")
);

CREATE CONSTRAINT TRIGGER "GlobalSettings_update_trigger"
    AFTER UPDATE
    ON "GlobalSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD <> NEW)
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "GlobalSettings_insert_trigger"
    AFTER INSERT
    ON "GlobalSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "GlobalSettings_delete_trigger"
    AFTER DELETE
    ON "GlobalSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_delete('version');

-- CreateTable
CREATE TABLE "CommandGuildSettings"
(
    "guildId" VARCHAR(20) NOT NULL,
    "prefix"  TEXT,

    PRIMARY KEY ("guildId")
);

CREATE CONSTRAINT TRIGGER "CommandGuildSettings_update_trigger"
    AFTER UPDATE
    ON "CommandGuildSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD <> NEW)
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "CommandGuildSettings_insert_trigger"
    AFTER INSERT
    ON "CommandGuildSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();

CREATE CONSTRAINT TRIGGER "CommandGuildSettings_delete_trigger"
    AFTER DELETE
    ON "CommandGuildSettings"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_delete('guild');

-- CreateTable
CREATE TABLE "CommandCommandCache"
(
    "id"                 SERIAL         NOT NULL,
    "commandName"        TEXT           NOT NULL,
    "expirationDateTime" TIMESTAMPTZ(6) NOT NULL,
    "cache"              JSON           NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandReactionListener"
(
    "id"        SERIAL                                NOT NULL,
    "messageId" VARCHAR(20)                           NOT NULL,
    "userId"    VARCHAR(20)                           NOT NULL,
    "emojiId"   VARCHAR(20)                           NOT NULL,
    "action"    "CommandReactionListenerActionFilter" NOT NULL,
    "cacheId"   INTEGER,

    PRIMARY KEY ("id")
);

CREATE CONSTRAINT TRIGGER "CommandReactionListener_delete_trigger"
    AFTER DELETE
    ON "CommandReactionListener"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_delete('messageId', 'userId', 'emojiId', 'action', 'cacheId');

-- CreateTable
CREATE TABLE "CommandResponseListener"
(
    "id"        SERIAL      NOT NULL,
    "channelId" VARCHAR(20) NOT NULL,
    "userId"    VARCHAR(20) NOT NULL,
    "cacheId"   INTEGER,

    PRIMARY KEY ("id")
);

CREATE CONSTRAINT TRIGGER "CommandResponseListener_delete_trigger"
    AFTER DELETE
    ON "CommandResponseListener"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_delete('channelId', 'userId', 'cacheId');

-- CreateIndex
CREATE UNIQUE INDEX "CommandReactionListener.messageId_userId_emojiId_action_cacheId_unique" ON "CommandReactionListener" ("messageId", "userId", "emojiId", "action", "cacheId");

-- CreateIndex
CREATE UNIQUE INDEX "CommandResponseListener.channelId_userId_cacheId_unique" ON "CommandResponseListener" ("channelId", "userId", "cacheId");

-- AddForeignKey
ALTER TABLE "CommandReactionListener"
    ADD FOREIGN KEY ("cacheId") REFERENCES "CommandCommandCache" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandResponseListener"
    ADD FOREIGN KEY ("cacheId") REFERENCES "CommandCommandCache" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
