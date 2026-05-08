/* global use, db */
// Full backup of hive_platform → hive_platform_backup_20260507
// Uses $out to copy every collection into a separate backup database.
// Run this BEFORE any seed scripts.
// To restore: run playground-restore.mongodb.js

use('hive_platform');

const BACKUP_DB = 'hive_platform_backup_20260507';

const collections = db.getCollectionNames().filter(
  name => !name.startsWith('system.')
);

print(`Backing up ${collections.length} collections to "${BACKUP_DB}"...`);

collections.forEach(collName => {
  const count = db.getCollection(collName).countDocuments();
  db.getCollection(collName).aggregate([
    { $out: { db: BACKUP_DB, coll: collName } },
  ]);
  print(`  ✓ ${collName} (${count} docs)`);
});

print(`\nBackup complete → database: "${BACKUP_DB}"`);
print('To verify: switch to that database in Playground and check collections.');
