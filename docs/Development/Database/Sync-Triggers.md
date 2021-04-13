# Sync Triggers

To keep the caches in sync, the entity system employs triggers and PostgreSQL's notification feature. Combined they make the database notify all listeners of any insertions, updates, and/or deletions in a specific table.

These triggers need to be added manually to the desired table via migrations. The following are all three triggers needed for the full synchronization but they can also be used independently. Each entry specifies what data they send back on what channel and the respective SQL statement used to create them.

## Insert Trigger

Sends back an entire row on the `sync_[table name]_INSERT` channel when it is inserted.

```SQL
CREATE CONSTRAINT TRIGGER "[table name]_insert_trigger"
    AFTER INSERT
    ON "[table name]"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();
```

## Update Trigger

Sends back an entire row on the `sync_[table name]_UPDATE` channel when it is updated.

```SQL
CREATE CONSTRAINT TRIGGER "[table name]_update_trigger"
    AFTER UPDATE
    ON "[table name]"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (OLD <> NEW)
EXECUTE FUNCTION trigger_notify_entity_insert_or_update();
```

## Delete Trigger

Sends back the specified columns of a row on the `sync_[table name]_DELETE` channel when it is deleted.

```SQL
CREATE CONSTRAINT TRIGGER "[table name]_delete_trigger"
    AFTER DELETE
    ON "[table name]"
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
EXECUTE FUNCTION trigger_notify_entity_delete([column names]);
```

Column names should each be surrounded with `'` and separated by a comma. For example: `'messageId', 'userId', 'emojiId', 'action', 'cacheId'`
