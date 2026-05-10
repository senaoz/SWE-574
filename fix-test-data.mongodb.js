/* global use, db */
// Replace all test/random content with meaningful data — no deletions
use('hive_platform');

// ── 1. "Mobile Test 1" → real service
db.services.updateOne(
  { _id: ObjectId('69c51e21643d8a485ec2e5c1') },
  { $set: {
    title: 'Help Needed: Setting Up Smart Home Devices',
    description: 'I recently bought a few smart home devices (smart plugs, a thermostat, and a Wi-Fi security camera) but I\'m having trouble setting them all up and getting them to work together. Looking for someone with experience in smart home systems who can come over and help me configure everything properly.',
    tags: [
      { label: 'smart home', entityId: '213441', description: null, aliases: [] },
      { label: 'technology', entityId: '11016', description: null, aliases: [] }
    ],
    open_availability: 'Weekends work best for me',
    is_remote: false,
    location: {
      type: 'Point',
      coordinates: [29.0254, 40.9812],
      address: 'Kadıköy, İstanbul'
    }
  } }
);
print('Updated: Mobile Test 1 → Smart Home Setup');

// ── 2. "Mobile Test 3" → real service
db.services.updateOne(
  { _id: ObjectId('69cab609e56aad4434eb786e') },
  { $set: {
    title: 'Turkish Language Practice Partner',
    description: 'I am an intermediate Turkish learner looking for a native speaker to practice conversational Turkish with. Ideally we meet once a week over coffee and talk — I can offer English conversation in return. Patient partners preferred!',
    tags: [
      { label: 'Turkish', entityId: '256', description: null, aliases: [] },
      { label: 'language exchange', entityId: '1128781', description: null, aliases: [] }
    ],
    open_availability: 'Weekday evenings or weekend mornings',
    location: {
      type: 'Point',
      coordinates: [29.0402, 41.0779],
      address: 'Bebek, Beşiktaş, İstanbul'
    }
  } }
);
print('Updated: Mobile Test 3 → Turkish Language Partner');

// ── 3. "Id help wedding the garden" → fix title + description
db.services.updateOne(
  { _id: ObjectId('69ac32100737d99885fb521c') },
  { $set: {
    title: 'Help Weeding the Garden',
    description: 'My garden in Kadıköy has gotten out of hand and I need a hand weeding the flower beds and clearing some overgrown areas. Should take a couple of hours. I\'ll provide all the tools — just need willing hands and some energy.'
  } }
);
print('Updated: "Id help wedding the garden" → Help Weeding the Garden');

// ── 4. "Helping Furniture to New Apartment" → fix open_availability
db.services.updateOne(
  { _id: ObjectId('69be5c1a39077169c7996159') },
  { $set: { open_availability: 'Available on weekday evenings and weekend mornings' } }
);
print('Updated: Helping Furniture — open_availability fixed');

// ── 5. "Free Resume Review & Career Feedback" → fix tag + open_availability
db.services.updateOne(
  { _id: ObjectId('69c16e039373581a3b262fb4') },
  { $set: {
    open_availability: 'Flexible — reach out and we can find a time',
    tags: [
      { label: 'career', entityId: '272627', description: null, aliases: [] },
      { label: 'résumé', entityId: '900492', description: null, aliases: [] }
    ]
  } }
);
print('Updated: Free Resume Review — tag & open_availability fixed');

// ── 6. "Need Help Debugging a Python Script" → fix tag + open_availability
db.services.updateOne(
  { _id: ObjectId('69c16f739373581a3b262fb7') },
  { $set: {
    open_availability: 'Available most evenings, just message me to arrange',
    tags: [
      { label: 'Python', entityId: '32213', description: null, aliases: [] },
      { label: 'programming', entityId: '80993', description: null, aliases: [] }
    ]
  } }
);
print('Updated: Need Help Debugging Python — tag & open_availability fixed');

// ── 7. "I need a philosopher to discus Lorem Ipsum" → meaningful content
// NOTE: _id is a malformed string (not a valid ObjectId), query by title instead
db.services.updateOne(
  { title: 'I need a philosopher to discus Lorem Ipsum' },
  { $set: {
    title: 'Philosophy Discussion Partner Wanted',
    description: 'I enjoy reading philosophy and would love to find someone to discuss ideas with regularly — anything from ancient Greek thought to contemporary ethics and philosophy of mind. No formal background required, just genuine curiosity and the willingness to think out loud together.',
    tags: [
      { label: 'philosophy', entityId: '5891', description: null, aliases: [] },
      { label: 'discussion', entityId: '1421864', description: null, aliases: [] }
    ],
    open_availability: 'Probably anytime — just message me'
  } }
);
print('Updated: Lorem Ipsum philosopher → Philosophy Discussion Partner');

// ── 8. "Cooking II" → real description (was only an image URL)
db.services.updateOne(
  { _id: ObjectId('69c1772c73c5a4618ad2d177') },
  { $set: {
    title: 'Home Cooking Session — Healthy Weekday Meals',
    description: 'I want to improve my cooking skills and would love to learn how to prepare simple, healthy weekday meals. Looking for someone who enjoys cooking and can guide me through a few recipes in a hands-on session. I\'ll cover ingredients.',
    tags: [
      { label: 'cooking', entityId: '41164', description: null, aliases: [] },
      { label: 'nutrition', entityId: '1495', description: null, aliases: [] }
    ]
  } }
);
print('Updated: Cooking II → Healthy Weekday Meals session');

// ── 9. "cooking pasta" → better description
db.services.updateOne(
  { _id: ObjectId('69da7a8e9c58013c08f84ca6') },
  { $set: {
    description: 'Looking for someone to cook homemade pasta with me this weekend. I have basic ingredients and plenty of enthusiasm but would love guidance from someone who knows their way around pasta dough — fresh tagliatelle or ravioli ideally.',
    title: 'Weekend Homemade Pasta Cooking Session'
  } }
);
print('Updated: "cooking pasta" → Weekend Homemade Pasta Cooking Session');

// ── 10. "Help me debugging my website" → real description
// NOTE: malformed _id (22 chars), query by title
db.services.updateOne(
  { title: 'Help me debugging my website' },
  { $set: {
    description: 'I have a personal website built with HTML/CSS and a bit of JavaScript that has a few layout and console errors I can\'t track down. Looking for someone with frontend experience to do a short screen-sharing session and help me identify and fix the issues.'
  } }
);
print('Updated: "Help me debugging my website" description');

// ── 11. "scince teaching" → fix title + description
db.services.updateOne(
  { _id: ObjectId('69c6ba10643d8a485ec2e5c8') },
  { $set: {
    title: 'Science Tutoring (Middle & High School)',
    description: 'I offer science tutoring for middle and high school students covering biology, chemistry, and physics. I focus on making abstract concepts concrete and building intuition alongside exam technique. Sessions are one hour, in person or remote.'
  } }
);
print('Updated: "scince teaching" → Science Tutoring');

// ── 12. "maintain an aquarium" → real description
db.services.updateOne(
  { _id: ObjectId('69aea61ee0fb78b01b102981') },
  { $set: {
    description: 'I can help you set up or maintain a freshwater aquarium. Services include water parameter testing and balancing, filter and equipment maintenance, plant trimming, and general livestock health checks. I have been keeping tropical fish for several years and am happy to share knowledge along the way.'
  } }
);
print('Updated: "maintain an aquarium" description');

// ── 13. "Basic Coding for Artists - II" → fix open_availability + location
db.services.updateOne(
  { _id: ObjectId('69d3abfad6fdc21a893c48cb') },
  { $set: {
    open_availability: 'Open — message me and we\'ll find a suitable time',
    location: {
      type: 'Point',
      coordinates: [28.9742, 41.0251],
      address: 'Galata, Beyoğlu, İstanbul'
    }
  } }
);
print('Updated: Basic Coding for Artists II — open_availability & location fixed');

// ── 14. "Amateur Photography Experience in Kadıköy Streets"
//        → fix copied archery description + fix Berlin location
db.services.updateOne(
  { _id: ObjectId('69ad42670737d99885fb5237') },
  { $set: {
    description: 'Join me for a street photography walk through Kadıköy. I will share tips on composition, working with natural light, and finding compelling scenes in everyday urban life. Beginners are very welcome — phone cameras are just as good. We will spend about two hours exploring the neighbourhood together.',
    location: {
      type: 'Point',
      coordinates: [29.0254, 40.9812],
      address: 'Kadıköy, İstanbul'
    }
  } }
);
print('Updated: Amateur Photography — description & location fixed');

// ── 15. "Python Programming for Kids" → fix random open_availability
db.services.updateOne(
  { _id: ObjectId('69d766c0aa609f3b56ad1d92') },
  { $set: { open_availability: 'Thursday evenings, flexible on other days — just ask' } }
);
print('Updated: Python for Kids — open_availability fixed');

// ── 16. "Weekend Baking Workshop in Beykoz" → fix Berlin location
db.services.updateOne(
  { _id: ObjectId('69ad4d920737d99885fb5247') },
  { $set: {
    location: {
      type: 'Point',
      coordinates: [29.1074, 41.1343],
      address: 'Beykoz, İstanbul'
    }
  } }
);
print('Updated: Baking Workshop — location Berlin → Beykoz');

// ── 17. "Quick Software Testing for My Mobile App" → fix tag "test" → meaningful
db.services.updateOne(
  { _id: ObjectId('69c0031639077169c799617b') },
  { $set: {
    tags: [
      { label: 'mobile development', entityId: '17020', description: null, aliases: [] },
      { label: 'software testing', entityId: '213556', description: null, aliases: [] }
    ]
  } }
);
print('Updated: Quick Software Testing — tag fixed');

// ── 18. "com" community → real community
db.communities.updateOne(
  { _id: ObjectId('69f8dc5afb409c5f92936848') },
  { $set: {
    name: 'Beşiktaş Neighbours',
    slug: 'besiktas-neighbours',
    description: 'A friendly community for residents of Beşiktaş and surrounding areas. Share local tips, organise neighbourhood events, exchange services, and help each other out. Whether you\'ve lived here for decades or just moved in, you\'re welcome.',
    tags: [
      { label: 'community', entityId: '177171', description: null, aliases: [] },
      { label: 'neighbourhood', entityId: '123480', description: null, aliases: [] }
    ],
    rules: [
      'Be respectful and kind to your neighbours.',
      'Keep posts relevant to the local community.',
      'No spam or commercial advertising.'
    ]
  } }
);
print('Updated: "com" community → Beşiktaş Neighbours');

print('\n✓ Done. 17 services + 1 community updated, nothing deleted.');
