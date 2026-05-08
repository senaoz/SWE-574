// MongoDB Playground — Fetch all events, services, and communities
use('hive_platform');

print('=== SERVICES ===');
const services = db.getCollection('services').find({}).toArray();
print(`Total services: ${services.length}`);
services.forEach((s, i) => {
  print(`\n[${i + 1}] ${s.title}`);
  print(`  type: ${s.service_type} | status: ${s.status} | category: ${s.category}`);
  print(`  remote: ${s.is_remote} | location: ${s.location?.address || s.location?.type || 'N/A'}`);
  print(`  user_id: ${s.user_id} | created_at: ${s.created_at}`);
  print(`  tags: ${(s.tags || []).map(t => t.label).join(', ')}`);
});

print('\n\n=== FORUM EVENTS ===');
const events = db.getCollection('forum_events').find({}).toArray();
print(`Total events: ${events.length}`);
events.forEach((e, i) => {
  print(`\n[${i + 1}] ${e.title}`);
  print(`  date: ${e.event_date} | location: ${e.location || 'N/A'}`);
  print(`  created_by: ${e.created_by} | created_at: ${e.created_at}`);
  print(`  tags: ${(e.tags || []).map(t => t.label || t).join(', ')}`);
});

print('\n\n=== COMMUNITIES ===');
const communities = db.getCollection('communities').find({}).toArray();
print(`Total communities: ${communities.length}`);
communities.forEach((c, i) => {
  print(`\n[${i + 1}] ${c.name}`);
  print(`  description: ${String(c.description || '').slice(0, 100)}...`);
  print(`  created_by: ${c.created_by} | created_at: ${c.created_at}`);
  print(`  members: ${(c.member_ids || c.members || []).length}`);
  print(`  tags: ${(c.tags || []).map(t => t.label || t).join(', ')}`);
});
