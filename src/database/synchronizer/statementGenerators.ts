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

export function generateUpdateSyncTriggerDropStatement(tableName: string): string {
  return `
    DROP TRIGGER ${tableName}_update_trigger ON "${tableName}";
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

export function generateInsertSyncTriggerDropStatement(tableName: string): string {
  return `
    DROP TRIGGER ${tableName}_insert_trigger ON "${tableName}";
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

export function generateDeleteSyncTriggerDropStatement(tableName: string): string {
  return `
    DROP TRIGGER ${tableName}_delete_trigger ON "${tableName}";
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

export function generateAllSyncTriggerDropStatements(tableName: string): string {
  return (
    generateUpdateSyncTriggerDropStatement(tableName) +
    generateInsertSyncTriggerDropStatement(tableName) +
    generateDeleteSyncTriggerDropStatement(tableName)
  );
}
