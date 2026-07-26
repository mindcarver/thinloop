export function migrateRecord(record, targetVersion) {
  if (targetVersion !== 1) {
    throw new Error(`Unsupported schema version: ${targetVersion}`);
  }
  return { ...record, schemaVersion: 1 };
}
