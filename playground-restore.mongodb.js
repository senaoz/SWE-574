/* global use, db */
// Restore hive_platform from backup database hive_platform_backup_20260507.
// WARNING: This OVERWRITES all current data in hive_platform.
// Only run if you need to roll back the seed scripts.

use('hive_platform_backup_20260507');

const RESTORE_TARGET = 'hive_platform';

const collections = db.getCollectionNames().filter(
  name => !name.startsWith('system.')
);

print(`Restoring ${collections.length} collections to "${RESTORE_TARGET}"...`);
print('WARNING: This will overwrite all current data.\n');

collections.forEach(collName => {
  const count = db.getCollection(collName).countDocuments();
  db.getCollection(collName).aggregate([
    { $out: { db: RESTORE_TARGET, coll: collName } },
  ]);
  print(`  ✓ ${collName} (${count} docs)`);
});

print(`\nRestore complete → database: "${RESTORE_TARGET}"`);
