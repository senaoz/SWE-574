# Database Migration Scripts

This directory contains migration scripts to update existing database data to match new schema changes.

## Available Migrations

### 1. `migrate_matched_user_ids.py`
Migrates services from `matched_user_id` (single ObjectId) to `matched_user_ids` (list of ObjectIds).

**What it does:**
- Finds all services with `matched_user_id` field
- Converts single `matched_user_id` to `matched_user_ids` list
- Ensures all services have `matched_user_ids` field (empty list if no matches)
- Removes old `matched_user_id` field

**Usage:**
```bash
cd backend
python migrations/migrate_matched_user_ids.py
```

### 2. `migrate_chat_service_ids.py`
Migrates chat rooms from `service_id` (single ObjectId) to `service_ids` (list of ObjectIds).

**What it does:**
- Finds all chat rooms with `service_id` field
- Converts single `service_id` to `service_ids` list
- Ensures all chat rooms have `service_ids` field (empty list if no services)
- Removes old `service_id` field

**Usage:**
```bash
cd backend
python migrations/migrate_chat_service_ids.py
```

## Running Migrations

1. **Backup your database** before running migrations:
   ```bash
   mongodump --uri="mongodb://localhost:27017" --db=hive_platform --out=./backup
   ```

2. **Set environment variables** (if not using .env file):
   ```bash
   export MONGODB_URI="mongodb://localhost:27017"
   export DATABASE_NAME="hive_platform"
   ```

3. **Run migrations**:
   ```bash
   # Run all migrations
   python migrations/migrate_matched_user_ids.py
   python migrations/migrate_chat_service_ids.py
   ```

4. **Verify migration**:
   - Check that old fields are removed
   - Check that new list fields exist
   - Verify data integrity

## Notes

- Migrations are **idempotent** - safe to run multiple times
- Old fields are preserved in backup before removal
- Migrations log progress and results
- Always test migrations on a development database first

## Rollback

If you need to rollback, restore from backup:
```bash
mongorestore --uri="mongodb://localhost:27017" --db=hive_platform ./backup/hive_platform
```

