/* global use, db */
// Restore only the users collection from backup.
// Overwrites hive_platform.users with the backed-up version.

use('hive_platform_backup_20260507');

const count = db.users.countDocuments();
print(`Restoring ${count} users from backup...`);

db.users.aggregate([
  { $out: { db: 'hive_platform', coll: 'users' } },
]);

print('✓ users collection restored.');
