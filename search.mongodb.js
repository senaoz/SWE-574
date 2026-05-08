/* global use, db */
// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('hive_platform');

let services = {}

// Search for documents in the current collection.
db.getCollection('services').find({}).forEach(function(doc) {
if (doc.title.length < 15 && doc.description.length < 100) {
  services[doc.user_id] = doc;
}
});


print(services);


