/* global use, db */
// Seed: Transactions, ratings, and timebank balance updates.
// Run AFTER playground-6 (services).
// Creates 30 completed transactions and 60 bidirectional ratings.

use('hive_platform');

// ── user aliases ──────────────────────────────────────────────────────────────

const U00 = ObjectId('68f67e78cc0dce66e7dede2e');
const U01 = ObjectId('68f67e78cc0dce66e7dede2f');
const U02 = ObjectId('68f67e78cc0dce66e7dede30');
const U03 = ObjectId('68f67e78cc0dce66e7dede31');
const U04 = ObjectId('68f67e78cc0dce66e7dede32');
const U05 = ObjectId('68f67f9c3966e4ce6ebcd0d8');
const U06 = ObjectId('6910493fbd2b553c40682a22');
const U07 = ObjectId('699c495b8a3c27030ad95179');
const U08 = ObjectId('699c819c8a3c27030ad9517a');
const U09 = ObjectId('699d5d8ed41dfdf904cba681');
const U10 = ObjectId('699d9901d41dfdf904cba682');
const U11 = ObjectId('699e0effb25538f8efb419b1');
const U12 = ObjectId('699e1ab5b25538f8efb419b6');
const U13 = ObjectId('69a07b2db25538f8efb419b7');
const U14 = ObjectId('69a33be549f11e4548daecbf');
const U15 = ObjectId('69a3faa349f11e4548daecc4');
const U16 = ObjectId('69ac140f0737d99885fb51f8');
const U17 = ObjectId('69ad42dd0737d99885fb5238');
const U18 = ObjectId('69ae20b916ba13f0b24017dd');
const U19 = ObjectId('69aeb72ae0fb78b01b102998');
const U20 = ObjectId('69aeea87eeccfa2e45b4c1b9');
const U21 = ObjectId('69aeeb81eeccfa2e45b4c1bd');
const U22 = ObjectId('69bc430bcf8d0686f0a691f0');
const U23 = ObjectId('69c44998643d8a485ec2e5c0');

// ── service ids (from playground-6) ─────────────────────────────────────────

const S01 = ObjectId('665000000000000000000001');
const S02 = ObjectId('665000000000000000000002');
const S03 = ObjectId('665000000000000000000003');
const S04 = ObjectId('665000000000000000000004');
const S05 = ObjectId('665000000000000000000005');
const S06 = ObjectId('665000000000000000000006');
const S07 = ObjectId('665000000000000000000007');
const S08 = ObjectId('665000000000000000000008');
const S09 = ObjectId('665000000000000000000009');
const S10 = ObjectId('66500000000000000000000a');
const S11 = ObjectId('66500000000000000000000b');
const S12 = ObjectId('66500000000000000000000c');
const S13 = ObjectId('66500000000000000000000d');
const S14 = ObjectId('66500000000000000000000e');
const S15 = ObjectId('66500000000000000000000f');
const S16 = ObjectId('665000000000000000000010');
const S17 = ObjectId('665000000000000000000011');
const S18 = ObjectId('665000000000000000000012');
const S19 = ObjectId('665000000000000000000013');
const S20 = ObjectId('665000000000000000000014');

// ── transaction factory ───────────────────────────────────────────────────────

function txn(id, serviceId, providerId, requesterId, hours, description, completedAt) {
  return {
    _id: ObjectId(id),
    service_id: serviceId,
    provider_id: providerId,
    requester_id: requesterId,
    timebank_hours: hours,
    description,
    status: 'completed',
    provider_confirmed: true,
    requester_confirmed: true,
    completion_notes: null,
    dispute_reason: null,
    created_at: new Date(completedAt.getTime() - 3 * 24 * 60 * 60 * 1000),
    updated_at: completedAt,
    completed_at: completedAt,
  };
}

// ── 30 completed transactions ─────────────────────────────────────────────────
// T01–T20: one transaction per completed service
// T21–T30: additional slots (multi-participant services)

const transactions = [
  // Nov 2025
  txn('665100000000000000000001', S01, U02, U12, 2,   'Guitar lesson — Can teaches Serkan', new Date('2025-11-28')),
  txn('665100000000000000000002', S02, U00, U16, 1.5, 'Python debugging session — Mehmet helps Bora', new Date('2025-11-14')),
  txn('665100000000000000000003', S03, U01, U07, 2,   'Turkish conversation — Ayşe tutors Fatma', new Date('2025-11-22')),
  txn('665100000000000000000004', S04, U03, U20, 3,   'Logo design — Zeynep designs for Cem', new Date('2025-11-30')),
  txn('665100000000000000000005', S05, U04, U18, 1.5, 'Personal training — Emre trains Kerem', new Date('2025-11-25')),
  txn('665100000000000000000006', S06, U04, U08, 2,   'Moving help — Emre helps Burak move', new Date('2025-11-29')),
  // Dec 2025
  txn('665100000000000000000007', S07, U05, U14, 3,   'Meze cooking — Selin teaches Mert', new Date('2025-12-12')),
  txn('665100000000000000000008', S08, U06, U21, 2,   'Portrait shoot — Ahmet photographs Yasemin', new Date('2025-12-18')),
  txn('665100000000000000000009', S09, U09, U11, 1.5, 'Yoga session — Elif teaches Merve', new Date('2025-12-28')),
  txn('66510000000000000000000a', S10, U10, U03, 2,   'Data viz workshop — Tolga teaches Zeynep', new Date('2025-12-20')),
  txn('66510000000000000000000b', S11, U01, U19, 3,   'Literary translation — Ayşe translates for İpek', new Date('2025-12-22')),
  txn('66510000000000000000000c', S12, U15, U07, 1,   'Proofreading — Neslihan edits Fatma\'s paper', new Date('2025-12-17')),
  // Jan 2026
  txn('66510000000000000000000d', S13, U11, U23, 2,   'Watercolor workshop — Merve teaches Defne', new Date('2026-01-15')),
  txn('66510000000000000000000e', S14, U12, U02, 1.5, 'Math tutoring — Serkan tutors Can', new Date('2026-01-20')),
  txn('66510000000000000000000f', S15, U17, U13, 2,   'First aid course — Gamze trains Dilan', new Date('2026-01-22')),
  txn('665100000000000000000010', S16, U16, U00, 2,   'React mentoring — Bora mentors Mehmet', new Date('2026-01-27')),
  txn('665100000000000000000011', S17, U03, U18, 1.5, 'Interior design advice — Zeynep advises Kerem', new Date('2026-01-29')),
  txn('665100000000000000000012', S18, U07, U15, 1,   'CV review — Fatma reviews Neslihan\'s CV', new Date('2026-01-25')),
  // Feb 2026
  txn('665100000000000000000013', S19, U20, U05, 2,   'Coffee workshop — Cem teaches Selin', new Date('2026-02-10')),
  txn('665100000000000000000014', S20, U21, U04, 1.5, 'Mindfulness coaching — Yasemin coaches Emre', new Date('2026-02-15')),
  // Extra slots (multi-participant services)
  txn('665100000000000000000015', S01, U02, U23, 2,   'Guitar lesson — Can teaches Defne', new Date('2025-11-28')),
  txn('665100000000000000000016', S03, U01, U12, 2,   'Turkish conversation — Ayşe tutors Serkan', new Date('2025-11-22')),
  txn('665100000000000000000017', S04, U03, U16, 3,   'Logo design — Zeynep designs for Bora', new Date('2025-11-30')),
  txn('665100000000000000000018', S05, U04, U22, 1.5, 'Personal training — Emre trains Kaan', new Date('2025-11-25')),
  txn('665100000000000000000019', S09, U09, U05, 1.5, 'Yoga session — Elif teaches Selin', new Date('2025-12-28')),
  txn('66510000000000000000001a', S07, U05, U13, 3,   'Meze cooking — Selin teaches Dilan', new Date('2025-12-12')),
  txn('66510000000000000000001b', S08, U06, U14, 2,   'Portrait shoot — Ahmet photographs Mert', new Date('2025-12-18')),
  txn('66510000000000000000001c', S15, U17, U22, 2,   'First aid course — Gamze trains Kaan', new Date('2026-01-22')),
  txn('66510000000000000000001d', S14, U12, U04, 1.5, 'Math tutoring — Serkan tutors Emre', new Date('2026-01-20')),
  txn('66510000000000000000001e', S16, U16, U19, 2,   'React mentoring — Bora mentors İpek', new Date('2026-01-27')),
];

db.transactions.insertMany(transactions);
print(`Inserted ${transactions.length} transactions.`);

// ── update matched_user_ids on services ───────────────────────────────────────

db.services.updateOne({ _id: S01 }, { $set: { matched_user_ids: [U12, U23] } });
db.services.updateOne({ _id: S02 }, { $set: { matched_user_ids: [U16] } });
db.services.updateOne({ _id: S03 }, { $set: { matched_user_ids: [U07, U12] } });
db.services.updateOne({ _id: S04 }, { $set: { matched_user_ids: [U20, U16] } });
db.services.updateOne({ _id: S05 }, { $set: { matched_user_ids: [U18, U22] } });
db.services.updateOne({ _id: S06 }, { $set: { matched_user_ids: [U04] } });
db.services.updateOne({ _id: S07 }, { $set: { matched_user_ids: [U14, U13] } });
db.services.updateOne({ _id: S08 }, { $set: { matched_user_ids: [U21, U14] } });
db.services.updateOne({ _id: S09 }, { $set: { matched_user_ids: [U11, U05] } });
db.services.updateOne({ _id: S10 }, { $set: { matched_user_ids: [U03] } });
db.services.updateOne({ _id: S11 }, { $set: { matched_user_ids: [U01] } });
db.services.updateOne({ _id: S12 }, { $set: { matched_user_ids: [U07] } });
db.services.updateOne({ _id: S13 }, { $set: { matched_user_ids: [U23] } });
db.services.updateOne({ _id: S14 }, { $set: { matched_user_ids: [U02, U04] } });
db.services.updateOne({ _id: S15 }, { $set: { matched_user_ids: [U13, U22] } });
db.services.updateOne({ _id: S16 }, { $set: { matched_user_ids: [U00, U19] } });
db.services.updateOne({ _id: S17 }, { $set: { matched_user_ids: [U03] } });
db.services.updateOne({ _id: S18 }, { $set: { matched_user_ids: [U07] } });
db.services.updateOne({ _id: S19 }, { $set: { matched_user_ids: [U05] } });
db.services.updateOne({ _id: S20 }, { $set: { matched_user_ids: [U04] } });

print('Updated matched_user_ids on services.');

// ── timebank_transactions (ledger entries) ─────────────────────────────────────
// Each completed transaction creates 2 entries: +hours for provider, -hours for requester.

const ledger = [
  // T01
  { user_id: U02, amount: 2,    service_id: S01, description: 'Earned: Guitar lesson for Serkan',           created_at: new Date('2025-11-28') },
  { user_id: U12, amount: -2,   service_id: S01, description: 'Spent: Guitar lesson from Can',              created_at: new Date('2025-11-28') },
  // T02
  { user_id: U00, amount: 1.5,  service_id: S02, description: 'Earned: Python debugging for Bora',          created_at: new Date('2025-11-14') },
  { user_id: U16, amount: -1.5, service_id: S02, description: 'Spent: Python debugging from Mehmet',        created_at: new Date('2025-11-14') },
  // T03
  { user_id: U01, amount: 2,    service_id: S03, description: 'Earned: Turkish tutoring for Fatma',          created_at: new Date('2025-11-22') },
  { user_id: U07, amount: -2,   service_id: S03, description: 'Spent: Turkish tutoring from Ayşe',           created_at: new Date('2025-11-22') },
  // T04
  { user_id: U03, amount: 3,    service_id: S04, description: 'Earned: Logo design for Cem',                 created_at: new Date('2025-11-30') },
  { user_id: U20, amount: -3,   service_id: S04, description: 'Spent: Logo design from Zeynep',              created_at: new Date('2025-11-30') },
  // T05
  { user_id: U04, amount: 1.5,  service_id: S05, description: 'Earned: Personal training for Kerem',         created_at: new Date('2025-11-25') },
  { user_id: U18, amount: -1.5, service_id: S05, description: 'Spent: Personal training from Emre',          created_at: new Date('2025-11-25') },
  // T06
  { user_id: U04, amount: 2,    service_id: S06, description: 'Earned: Moving help for Burak',               created_at: new Date('2025-11-29') },
  { user_id: U08, amount: -2,   service_id: S06, description: 'Spent: Moving help from Emre',                created_at: new Date('2025-11-29') },
  // T07
  { user_id: U05, amount: 3,    service_id: S07, description: 'Earned: Cooking class for Mert',              created_at: new Date('2025-12-12') },
  { user_id: U14, amount: -3,   service_id: S07, description: 'Spent: Cooking class from Selin',             created_at: new Date('2025-12-12') },
  // T08
  { user_id: U06, amount: 2,    service_id: S08, description: 'Earned: Portrait session for Yasemin',        created_at: new Date('2025-12-18') },
  { user_id: U21, amount: -2,   service_id: S08, description: 'Spent: Portrait session from Ahmet',          created_at: new Date('2025-12-18') },
  // T09
  { user_id: U09, amount: 1.5,  service_id: S09, description: 'Earned: Yoga session for Merve',              created_at: new Date('2025-12-28') },
  { user_id: U11, amount: -1.5, service_id: S09, description: 'Spent: Yoga session from Elif',               created_at: new Date('2025-12-28') },
  // T10
  { user_id: U10, amount: 2,    service_id: S10, description: 'Earned: Data viz workshop for Zeynep',         created_at: new Date('2025-12-20') },
  { user_id: U03, amount: -2,   service_id: S10, description: 'Spent: Data viz workshop from Tolga',          created_at: new Date('2025-12-20') },
  // T11
  { user_id: U01, amount: 3,    service_id: S11, description: 'Earned: Literary translation for İpek',        created_at: new Date('2025-12-22') },
  { user_id: U19, amount: -3,   service_id: S11, description: 'Spent: Translation from Ayşe',                 created_at: new Date('2025-12-22') },
  // T12
  { user_id: U15, amount: 1,    service_id: S12, description: 'Earned: Proofreading for Fatma',               created_at: new Date('2025-12-17') },
  { user_id: U07, amount: -1,   service_id: S12, description: 'Spent: Proofreading from Neslihan',            created_at: new Date('2025-12-17') },
  // T13
  { user_id: U11, amount: 2,    service_id: S13, description: 'Earned: Watercolor workshop for Defne',        created_at: new Date('2026-01-15') },
  { user_id: U23, amount: -2,   service_id: S13, description: 'Spent: Watercolor workshop from Merve',        created_at: new Date('2026-01-15') },
  // T14
  { user_id: U12, amount: 1.5,  service_id: S14, description: 'Earned: Math tutoring for Can',               created_at: new Date('2026-01-20') },
  { user_id: U02, amount: -1.5, service_id: S14, description: 'Spent: Math tutoring from Serkan',            created_at: new Date('2026-01-20') },
  // T15
  { user_id: U17, amount: 2,    service_id: S15, description: 'Earned: First aid course for Dilan',           created_at: new Date('2026-01-22') },
  { user_id: U13, amount: -2,   service_id: S15, description: 'Spent: First aid course from Gamze',           created_at: new Date('2026-01-22') },
  // T16
  { user_id: U16, amount: 2,    service_id: S16, description: 'Earned: React mentoring for Mehmet',           created_at: new Date('2026-01-27') },
  { user_id: U00, amount: -2,   service_id: S16, description: 'Spent: React mentoring from Bora',             created_at: new Date('2026-01-27') },
  // T17
  { user_id: U03, amount: 1.5,  service_id: S17, description: 'Earned: Interior design advice for Kerem',    created_at: new Date('2026-01-29') },
  { user_id: U18, amount: -1.5, service_id: S17, description: 'Spent: Interior design advice from Zeynep',   created_at: new Date('2026-01-29') },
  // T18
  { user_id: U07, amount: 1,    service_id: S18, description: 'Earned: CV review for Neslihan',              created_at: new Date('2026-01-25') },
  { user_id: U15, amount: -1,   service_id: S18, description: 'Spent: CV review from Fatma',                 created_at: new Date('2026-01-25') },
  // T19
  { user_id: U20, amount: 2,    service_id: S19, description: 'Earned: Coffee workshop for Selin',           created_at: new Date('2026-02-10') },
  { user_id: U05, amount: -2,   service_id: S19, description: 'Spent: Coffee workshop from Cem',             created_at: new Date('2026-02-10') },
  // T20
  { user_id: U21, amount: 1.5,  service_id: S20, description: 'Earned: Mindfulness coaching for Emre',      created_at: new Date('2026-02-15') },
  { user_id: U04, amount: -1.5, service_id: S20, description: 'Spent: Mindfulness coaching from Yasemin',   created_at: new Date('2026-02-15') },
  // T21 (second slot S01)
  { user_id: U02, amount: 2,    service_id: S01, description: 'Earned: Guitar lesson for Defne',             created_at: new Date('2025-11-28') },
  { user_id: U23, amount: -2,   service_id: S01, description: 'Spent: Guitar lesson from Can',               created_at: new Date('2025-11-28') },
  // T22 (second slot S03)
  { user_id: U01, amount: 2,    service_id: S03, description: 'Earned: Turkish tutoring for Serkan',         created_at: new Date('2025-11-22') },
  { user_id: U12, amount: -2,   service_id: S03, description: 'Spent: Turkish tutoring from Ayşe',           created_at: new Date('2025-11-22') },
  // T23 (second slot S04)
  { user_id: U03, amount: 3,    service_id: S04, description: 'Earned: Logo design for Bora',                created_at: new Date('2025-11-30') },
  { user_id: U16, amount: -3,   service_id: S04, description: 'Spent: Logo design from Zeynep',              created_at: new Date('2025-11-30') },
  // T24 (second slot S05)
  { user_id: U04, amount: 1.5,  service_id: S05, description: 'Earned: Personal training for Kaan',          created_at: new Date('2025-11-25') },
  { user_id: U22, amount: -1.5, service_id: S05, description: 'Spent: Personal training from Emre',          created_at: new Date('2025-11-25') },
  // T25 (second slot S09)
  { user_id: U09, amount: 1.5,  service_id: S09, description: 'Earned: Yoga session for Selin',              created_at: new Date('2025-12-28') },
  { user_id: U05, amount: -1.5, service_id: S09, description: 'Spent: Yoga session from Elif',               created_at: new Date('2025-12-28') },
  // T26 (second slot S07)
  { user_id: U05, amount: 3,    service_id: S07, description: 'Earned: Cooking class for Dilan',             created_at: new Date('2025-12-12') },
  { user_id: U13, amount: -3,   service_id: S07, description: 'Spent: Cooking class from Selin',             created_at: new Date('2025-12-12') },
  // T27 (second slot S08)
  { user_id: U06, amount: 2,    service_id: S08, description: 'Earned: Portrait session for Mert',           created_at: new Date('2025-12-18') },
  { user_id: U14, amount: -2,   service_id: S08, description: 'Spent: Portrait session from Ahmet',          created_at: new Date('2025-12-18') },
  // T28 (second slot S15)
  { user_id: U17, amount: 2,    service_id: S15, description: 'Earned: First aid course for Kaan',           created_at: new Date('2026-01-22') },
  { user_id: U22, amount: -2,   service_id: S15, description: 'Spent: First aid course from Gamze',          created_at: new Date('2026-01-22') },
  // T29 (second slot S14)
  { user_id: U12, amount: 1.5,  service_id: S14, description: 'Earned: Math tutoring for Emre',              created_at: new Date('2026-01-20') },
  { user_id: U04, amount: -1.5, service_id: S14, description: 'Spent: Math tutoring from Serkan',            created_at: new Date('2026-01-20') },
  // T30 (second slot S16)
  { user_id: U16, amount: 2,    service_id: S16, description: 'Earned: React mentoring for İpek',            created_at: new Date('2026-01-27') },
  { user_id: U19, amount: -2,   service_id: S16, description: 'Spent: React mentoring from Bora',            created_at: new Date('2026-01-27') },
];

// assign _id to each entry
const ledgerDocs = ledger.map((l, i) => ({
  _id: new ObjectId(),
  ...l,
}));

db.timebank_transactions.insertMany(ledgerDocs);
print(`Inserted ${ledgerDocs.length} timebank ledger entries.`);

// ── update user timebank_balance ───────────────────────────────────────────────
// Final balances = 5.0 (starting credit) + net transaction amounts

const balances = [
  { id: U00, balance: 4.5  },
  { id: U01, balance: 10.0 },
  { id: U02, balance: 7.0  },
  { id: U03, balance: 10.0 },
  { id: U04, balance: 7.0  },
  { id: U05, balance: 7.5  },
  { id: U06, balance: 9.0  },
  { id: U07, balance: 3.0  },
  { id: U08, balance: 3.0  },
  { id: U09, balance: 8.0  },
  { id: U10, balance: 7.0  },
  { id: U11, balance: 5.5  },
  { id: U12, balance: 4.0  },
  { id: U13, balance: 3.0  },
  { id: U14, balance: 3.0  },
  { id: U15, balance: 5.0  },
  { id: U16, balance: 4.5  },
  { id: U17, balance: 9.0  },
  { id: U18, balance: 2.0  },
  { id: U19, balance: 5.0  },
  { id: U20, balance: 4.0  },
  { id: U21, balance: 4.5  },
  { id: U22, balance: 1.5  },
  { id: U23, balance: 1.5  },
];

balances.forEach(({ id, balance }) => {
  db.users.updateOne({ _id: id }, { $set: { timebank_balance: balance } });
});

print(`Updated timebank balances for ${balances.length} users.`);

// ── ratings (2 per transaction, bidirectional) ────────────────────────────────

const T = [
  // keep the same order as transactions array above
  { id: '665100000000000000000001', provider: U02, requester: U12, svc: S01 },
  { id: '665100000000000000000002', provider: U00, requester: U16, svc: S02 },
  { id: '665100000000000000000003', provider: U01, requester: U07, svc: S03 },
  { id: '665100000000000000000004', provider: U03, requester: U20, svc: S04 },
  { id: '665100000000000000000005', provider: U04, requester: U18, svc: S05 },
  { id: '665100000000000000000006', provider: U04, requester: U08, svc: S06 },
  { id: '665100000000000000000007', provider: U05, requester: U14, svc: S07 },
  { id: '665100000000000000000008', provider: U06, requester: U21, svc: S08 },
  { id: '665100000000000000000009', provider: U09, requester: U11, svc: S09 },
  { id: '66510000000000000000000a', provider: U10, requester: U03, svc: S10 },
  { id: '66510000000000000000000b', provider: U01, requester: U19, svc: S11 },
  { id: '66510000000000000000000c', provider: U15, requester: U07, svc: S12 },
  { id: '66510000000000000000000d', provider: U11, requester: U23, svc: S13 },
  { id: '66510000000000000000000e', provider: U12, requester: U02, svc: S14 },
  { id: '66510000000000000000000f', provider: U17, requester: U13, svc: S15 },
  { id: '665100000000000000000010', provider: U16, requester: U00, svc: S16 },
  { id: '665100000000000000000011', provider: U03, requester: U18, svc: S17 },
  { id: '665100000000000000000012', provider: U07, requester: U15, svc: S18 },
  { id: '665100000000000000000013', provider: U20, requester: U05, svc: S19 },
  { id: '665100000000000000000014', provider: U21, requester: U04, svc: S20 },
  { id: '665100000000000000000015', provider: U02, requester: U23, svc: S01 },
  { id: '665100000000000000000016', provider: U01, requester: U12, svc: S03 },
  { id: '665100000000000000000017', provider: U03, requester: U16, svc: S04 },
  { id: '665100000000000000000018', provider: U04, requester: U22, svc: S05 },
  { id: '665100000000000000000019', provider: U09, requester: U05, svc: S09 },
  { id: '66510000000000000000001a', provider: U05, requester: U13, svc: S07 },
  { id: '66510000000000000000001b', provider: U06, requester: U14, svc: S08 },
  { id: '66510000000000000000001c', provider: U17, requester: U22, svc: S15 },
  { id: '66510000000000000000001d', provider: U12, requester: U04, svc: S14 },
  { id: '66510000000000000000001e', provider: U16, requester: U19, svc: S16 },
];

const providerComments = [
  'Great to work with — punctual, engaged, and asked smart questions.',
  'Super communicative throughout. Would definitely help again.',
  'Came prepared and followed through. Really enjoyable session.',
  'Very motivated and applied feedback quickly. A pleasure to teach.',
  'Friendly and enthusiastic. Made the experience worthwhile for both of us.',
  'Showed up on time, respectful of the space, and genuinely curious.',
  'One of the best people I\'ve worked with through this platform. Highly recommend.',
  'Thoughtful questions and clear goals — made it easy to tailor the session.',
];

const requesterComments = [
  'Extremely knowledgeable and patient. Exactly what I needed.',
  'Made a complex topic feel approachable. I left with real skills.',
  'Went above and beyond — even shared extra resources afterward.',
  'One of the most useful exchanges I\'ve done. Highly recommend!',
  'Clear explanations, no jargon, and genuinely helpful. Five stars.',
  'Felt comfortable from the start. Will definitely book again.',
  'This is why I love this platform. Real skills exchanged with real people.',
  'Expert knowledge delivered with warmth and humor. Couldn\'t ask for more.',
];

const ratingTags = [
  ['helpful', 'punctual', 'skilled'],
  ['knowledgeable', 'patient', 'communicative'],
  ['professional', 'friendly', 'reliable'],
  ['engaging', 'thorough', 'enthusiastic'],
];

const ratings = [];
T.forEach((t, i) => {
  const txnId = ObjectId(t.id);
  const ratingDate = new Date(transactions[i] ? transactions[i].completed_at : new Date('2026-01-01'));
  const ratingDateOffset = new Date(ratingDate.getTime() + 2 * 24 * 60 * 60 * 1000);

  // Requester rates provider
  ratings.push({
    _id: new ObjectId(),
    transaction_id: txnId,
    rater_id: t.requester,
    rated_user_id: t.provider,
    score: i % 5 === 0 ? 4 : 5,
    comment: requesterComments[i % requesterComments.length],
    tags: ratingTags[i % ratingTags.length],
    created_at: ratingDateOffset,
  });

  // Provider rates requester
  ratings.push({
    _id: new ObjectId(),
    transaction_id: txnId,
    rater_id: t.provider,
    rated_user_id: t.requester,
    score: i % 7 === 0 ? 4 : 5,
    comment: providerComments[i % providerComments.length],
    tags: ratingTags[(i + 1) % ratingTags.length],
    created_at: new Date(ratingDateOffset.getTime() + 60 * 60 * 1000),
  });
});

db.ratings.insertMany(ratings);
print(`Inserted ${ratings.length} ratings.`);
