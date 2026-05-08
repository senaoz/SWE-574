/* global use, db */
// Add relevant Unsplash images to all services & events that have empty image_urls
use('hive_platform');

// ─── SERVICES ────────────────────────────────────────────────────────────────

// Garden / Outdoor
db.services.updateOne({ _id: ObjectId('69ac0aa29b15aae8e3174d88') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd838c3') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ac2f650737d99885fb5216') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ac32100737d99885fb521c') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69aebad2e0fb78b01b1029a2') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69aee921eeccfa2e45b4c1b2') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop'] } });
print('Done: garden/outdoor services');

// Math / Tutoring / Education
db.services.updateOne({ _id: ObjectId('69ac0aa29b15aae8e3174d89') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ac207f0737d99885fb5208') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69aec2dce0fb78b01b1029ad') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c6ba10643d8a485ec2e5c8') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1567448390094-7fba0c151e8f?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0fc') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=800&auto=format&fit=crop'] } });
print('Done: math/tutoring services');

// Pets / Animals
db.services.updateOne({ _id: ObjectId('69ac0aa29b15aae8e3174d8a') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd838c0') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ad5a8e16ba13f0b24017d0') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69aea61ee0fb78b01b102981') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&auto=format&fit=crop'] } });
print('Done: pets/animals services');

// Cooking / Food
db.services.updateOne({ _id: ObjectId('69ac0aa29b15aae8e3174d8b') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd838d6') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1565181552583-7dfa4e000be4?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69da7a8e9c58013c08f84ca6') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c1772c73c5a4618ad2d177') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0f7') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1565299715199-866c917206bb?w=800&auto=format&fit=crop'] } });
print('Done: cooking/food services');

// Photography / Film
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd8389a') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd838d2') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1502920917128-1aa500764b5c?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69aeaa0be0fb78b01b102984') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1601758174493-4d1c4d8d5088?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69dbe044ec13c2bda2ff95f6') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1518911710364-17ec553bde5d?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a100') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1502920917128-1aa500764b5c?w=800&auto=format&fit=crop'] } });
print('Done: photography/film services');

// Coding / Tech
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd838ba') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ad5d9816ba13f0b24017d3') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69d3abfad6fdc21a893c48cb') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c16f739373581a3b262fb7') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop'] } });
// malformed _id (22 chars), query by title
db.services.updateOne({ title: 'Help me debugging my website' }, { $set: { image_urls: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69dbf00fec13c2bda2ff9655') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69dbed9cec13c2bda2ff9637') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0fb') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c0031639077169c799617b') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop'] } });
print('Done: coding/tech services');

// Language / Translation
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd838ad') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd838d5') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c17971b678e9b2ab216180') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0f9') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop'] } });
print('Done: language/translation services');

// Sports / Fitness / Running
db.services.updateOne({ _id: ObjectId('69ae255316ba13f0b24017e2') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0fa') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0f8') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69daa67e9c58013c08f84d16') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1559818755-9c48bab3f5c7?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=800&auto=format&fit=crop'] } });
print('Done: sports/fitness services');

// Ceramics / Art
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd838d7') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1606425271394-c3ca9aa1fc06?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd838d8') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1606425271394-c3ca9aa1fc06?w=800&auto=format&fit=crop'] } });
print('Done: ceramics/art services');

// Home Repair / DIY
db.services.updateOne({ _id: ObjectId('69ae884e16ba13f0b24017e5') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69aee9dbeeccfa2e45b4c1b7') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69aeed1aeeccfa2e45b4c1c1') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0fe') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69da9f9f9c58013c08f84cd9') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop'] } });
print('Done: home repair/DIY services');

// Moving / Transport
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd838d4') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1568234928966-359c35dd8327?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69be5c1a39077169c7996159') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0ff') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800&auto=format&fit=crop'] } });
print('Done: moving/transport services');

// Bike Repair
db.services.updateOne({ _id: ObjectId('69aeeb33eeccfa2e45b4c1bc') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&auto=format&fit=crop'] } });
print('Done: bike repair');

// Career / Resume
db.services.updateOne({ _id: ObjectId('69aee953eeccfa2e45b4c1b6') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c16e039373581a3b262fb4') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0f6') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop'] } });
print('Done: career/resume services');

// Bookbinding / Crafts
db.services.updateOne({ _id: ObjectId('69aeeb0beeccfa2e45b4c1ba') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop'] } });
print('Done: bookbinding');

// Babysitting / Childcare
db.services.updateOne({ _id: ObjectId('69ac19790737d99885fb5200') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop'] } });
print('Done: babysitting');

// History / Architecture / Culture
db.services.updateOne({ _id: ObjectId('69ae26f316ba13f0b24017e3') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69aeaba1e0fb78b01b102985') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&auto=format&fit=crop'] } });
db.services.updateOne({ _id: ObjectId('69ae8c3b16ba13f0b24017e6') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop'] } });
print('Done: history/architecture services');

// Kite / Outdoor hobby
db.services.updateOne({ _id: ObjectId('69ae27c916ba13f0b24017e4') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1527203561188-dae1bc1a417f?w=800&auto=format&fit=crop'] } });
print('Done: kite');

// Archery
db.services.updateOne({ _id: ObjectId('69ac11eec92fa51b7b49d43f') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1563822249366-3efb23b8e0c9?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&auto=format&fit=crop'] } });
print('Done: archery');

// Philosophy / Discussion — malformed _id (19 chars), query by title
db.services.updateOne({ title: { $in: ['I need a philosopher to discus Lorem Ipsum', 'Philosophy Discussion Partner Wanted'] } }, { $set: { image_urls: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop'] } });
print('Done: philosophy');

// Proofreading / Academic writing
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0fc') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop'] } });
print('Done: proofreading');

// Logo Design / Graphic Design
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0fd') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop'] } });
print('Done: logo/design');

// Guitar / Music
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a0f5') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&auto=format&fit=crop'] } });
print('Done: guitar/music');

// Raspberry Pi / Tech setup
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a102') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop'] } });
print('Done: Raspberry Pi');

// Watercolor / Portrait art
db.services.updateOne({ _id: ObjectId('69c44f8070d652c22b57a103') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop'] } });
print('Done: watercolor/portrait');

// Apple picking / Harvest
db.services.updateOne({ _id: ObjectId('69c169ca9373581a3b262faf') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1476837580875-8b92b8ff96d3?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop'] } });
print('Done: apple picking');

// Furniture assembly
db.services.updateOne({ _id: ObjectId('69ac0d06fc8664e38fd838d4') }, { $set: { image_urls: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop'] } });
print('Done: furniture assembly');

// Debugging Python (test-tagged — already updated tag, now add image)
// (69c16f739373581a3b262fb7 already handled above in coding/tech)

// Mobile app testing (already handled above)

// ─── EVENTS ──────────────────────────────────────────────────────────────────

db.forum_events.updateOne(
  { _id: ObjectId('69c989f889cf9b1eb1f79e2e') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop'] } }
);

db.forum_events.updateOne(
  { _id: ObjectId('69c989f889cf9b1eb1f79e2f') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop'] } }
);

db.forum_events.updateOne(
  { _id: ObjectId('69c989f889cf9b1eb1f79e30') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop'] } }
);

db.forum_events.updateOne(
  { _id: ObjectId('69c989f889cf9b1eb1f79e31') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop'] } }
);

db.forum_events.updateOne(
  { _id: ObjectId('69c989f889cf9b1eb1f79e32') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=800&auto=format&fit=crop'] } }
);

db.forum_events.updateOne(
  { _id: ObjectId('69c989f889cf9b1eb1f79e33') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&auto=format&fit=crop'] } }
);

db.forum_events.updateOne(
  { _id: ObjectId('69c989f889cf9b1eb1f79e34') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&auto=format&fit=crop'] } }
);

db.forum_events.updateOne(
  { _id: ObjectId('69c989f889cf9b1eb1f79e35') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop'] } }
);

db.forum_events.updateOne(
  { _id: ObjectId('69c989f889cf9b1eb1f79e36') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop'] } }
);

db.forum_events.updateOne(
  { _id: ObjectId('69c989f889cf9b1eb1f79e37') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop'] } }
);

db.forum_events.updateOne(
  { _id: ObjectId('69da2464f166fdd709e0914f') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop'] } }
);

db.forum_events.updateOne(
  { _id: ObjectId('69dd0840ec13c2bda2ff967a') },
  { $set: { image_urls: ['https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop'] } }
);

print('Done: all events');

print('\n✓ Complete. Images added to all services and events that were missing them.');
