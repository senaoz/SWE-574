// MongoDB Playground — Export events, services, communities to JSON
use('hive_platform');

const data = {
  services: db.getCollection('services').find({}).toArray(),
  events: db.getCollection('forum_events').find({}).toArray(),
  communities: db.getCollection('communities').find({}).toArray(),
};

print(JSON.stringify(data, null, 2));
