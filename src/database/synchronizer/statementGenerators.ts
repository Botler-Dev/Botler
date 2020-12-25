export function generateUpdateSyncTriggerCreateStatement(tableName: string): string {
  return `
    CREATE CONSTRAINT TRIGGER ${tableName}_update_trigger
      AFTER UPDATE
      ON "${tableName}"
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW
      WHEN (OLD <> NEW)
    EXECUTE FUNCTION trigger_notify_entity_insert_or_update();
  `;
}

export function generateInsertSyncTriggerCreateStatement(tableName: string): string {
  return `
    CREATE CONSTRAINT TRIGGER ${tableName}_insert_trigger
      AFTER INSERT
      ON "${tableName}"
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW
    EXECUTE FUNCTION trigger_notify_entity_insert_or_update();
  `;
}

export function generateDeleteSyncTriggerCreateStatement(
  tableName: string,
  payloadColumns: string[]
): string {
  const functionArgs = payloadColumns.map(name => `'${name.replace("'", "\\'")}'`).join(', ');
  return `
    CREATE CONSTRAINT TRIGGER ${tableName}_delete_trigger
      AFTER DELETE
      ON "${tableName}"
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW
    EXECUTE FUNCTION trigger_notify_entity_delete(${functionArgs});
  `;
}

export function generateAllSyncTriggerCreateStatements(
  tableName: string,
  deletePayloadColumns: string[]
): string {
  return (
    generateUpdateSyncTriggerCreateStatement(tableName) +
    generateInsertSyncTriggerCreateStatement(tableName) +
    generateDeleteSyncTriggerCreateStatement(tableName, deletePayloadColumns)
  );
}
