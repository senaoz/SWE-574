/* global use, db */
// Seed: Forum discussions, events, and comments.
// Run AFTER playground-8 (communities).

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

const C01 = ObjectId('665300000000000000000001');
const C02 = ObjectId('665300000000000000000002');
const C03 = ObjectId('665300000000000000000003');
const C04 = ObjectId('665300000000000000000004');
const C05 = ObjectId('665300000000000000000005');

function tag(label, entityId) {
  return { label, entityId: entityId || '', description: null, aliases: [] };
}

// ── discussion ids ────────────────────────────────────────────────────────────

const D01 = ObjectId('665400000000000000000001');
const D02 = ObjectId('665400000000000000000002');
const D03 = ObjectId('665400000000000000000003');
const D04 = ObjectId('665400000000000000000004');
const D05 = ObjectId('665400000000000000000005');
const D06 = ObjectId('665400000000000000000006');
const D07 = ObjectId('665400000000000000000007');
const D08 = ObjectId('665400000000000000000008');
const D09 = ObjectId('665400000000000000000009');
const D10 = ObjectId('66540000000000000000000a');
const D11 = ObjectId('66540000000000000000000b');
const D12 = ObjectId('66540000000000000000000c');
const D13 = ObjectId('66540000000000000000000d');
const D14 = ObjectId('66540000000000000000000e');
const D15 = ObjectId('66540000000000000000000f');

// ── event ids ─────────────────────────────────────────────────────────────────

const E01 = ObjectId('665500000000000000000001');
const E02 = ObjectId('665500000000000000000002');
const E03 = ObjectId('665500000000000000000003');
const E04 = ObjectId('665500000000000000000004');
const E05 = ObjectId('665500000000000000000005');
const E06 = ObjectId('665500000000000000000006');
const E07 = ObjectId('665500000000000000000007');
const E08 = ObjectId('665500000000000000000008');

// ── forum discussions ─────────────────────────────────────────────────────────

const discussions = [
  {
    _id: D01,
    user_id: U00,
    title: 'How does the timebank work — and is it actually fair?',
    body: `I've been on the platform for a few months now and I love it conceptually, but I keep running into a tension I don't know how to resolve.\n\nTime credits treat everyone's hour as equal. An hour of math tutoring from a PhD is worth the same as an hour of help carrying boxes. On one hand, this feels right — it's a direct challenge to the market logic that some work is more "valuable" than other work.\n\nOn the other hand: isn\'t there something off about treating a highly skilled specialist's time exactly the same as unskilled help? Not because one person is worth more — but because the scarcity of certain skills is real.\n\n**Questions for the community:**\n1. Do you think equal time = equal value makes sense here?\n2. Has the time-credit system ever felt unfair to you in practice?\n3. Should there be any weighting for specialist knowledge?\n\nI'm not arguing for changing the system — I genuinely don\'t know the answer. Would love to hear how others think about this.`,
    tags: [tag('Time Banking', 'Q7799057'), tag('Community'), tag('Philosophy')],
    image_urls: ['https://picsum.photos/seed/disc01/800/600'],
    community_id: null,
    comment_count: 8,
    upvote_count: 22,
    is_pinned: false,
    created_at: new Date('2025-11-20'),
    updated_at: new Date('2025-11-20'),
  },
  {
    _id: D02,
    user_id: U09,
    title: 'What skills are you most surprised to find on this platform?',
    body: `I was expecting this platform to be mostly tech help and language exchange. And that\'s here — but so much more.\n\nIn my first month I found:\n- Someone who repairs traditional kilims\n- A licensed beekeeper who teaches urban beekeeping\n- A nurse who teaches CPR (hi Gamze!)\n- A documentary filmmaker looking for interview subjects\n\nIt made me realize: people have such rich, unexpected skills that never make it to their LinkedIn profile. The market economy has no use for your ability to repair clocks or read astrology charts or forage mushrooms — but someone out there needs exactly that.\n\n**What\'s the most unexpected skill you\'ve offered or received here?**\n\nBonus: what's a skill you have that you\'ve never felt confident offering publicly?`,
    tags: [tag('Skills'), tag('Community'), tag('Discovery')],
    image_urls: [
      'https://picsum.photos/seed/disc02a/800/600',
      'https://picsum.photos/seed/disc02b/800/600',
    ],
    community_id: null,
    comment_count: 14,
    upvote_count: 31,
    is_pinned: false,
    created_at: new Date('2025-12-03'),
    updated_at: new Date('2025-12-03'),
  },
  {
    _id: D03,
    user_id: U15,
    title: 'Writing a good service listing: what I\'ve learned from doing it badly',
    body: `My first three service listings got almost no interest. Then I figured out why and rewrote them — now I\'m booked consistently. Here\'s what I learned:\n\n**What killed my early listings:**\n- "I can help with writing" (too vague)\n- No description of what the session actually looks like\n- No indication of who it\'s for\n- No photo\n\n**What works:**\n1. **Specific title**: "Academic proofreading for non-native English speakers" >> "Writing help"\n2. **Session walkthrough**: Tell people exactly what happens, minute by minute if possible\n3. **Clear who it's for**: Beginners? Advanced? A specific profession?\n4. **Why you specifically**: Not your CV — your perspective and approach\n5. **A good photo**: Not a stock image. Something real.\n\nI\'m happy to give feedback on anyone\'s draft listing before you publish — just share it in the comments.`,
    tags: [tag('Tips'), tag('Service Listing'), tag('Community')],
    image_urls: ['https://picsum.photos/seed/disc03/800/600'],
    community_id: C01.toString(),
    comment_count: 11,
    upvote_count: 27,
    is_pinned: false,
    created_at: new Date('2025-12-15'),
    updated_at: new Date('2025-12-15'),
  },
  {
    _id: D04,
    user_id: U01,
    title: 'The loneliness of learning a language as an adult',
    body: `Learning Turkish as an adult has been the most humbling experience of my adult life. And I\'m a language teacher.\n\nHere\'s what nobody tells you:\n- You\'ll be embarrassed in ways you haven\'t felt since childhood\n- Even basic interactions feel exhausting\n- Progress is invisible until it suddenly isn\'t\n- Motivation drops off sharply after the honeymoon phase\n\nThe thing that helps me most? Accountability — having someone who expects to see me, who notices when I'm improving, who I can ask stupid questions without feeling judged.\n\nThis platform has been that for me. The exchanges aren\'t just skills — they\'re relationships. When I meet with my conversation partner every week, I\'m more motivated because I don't want to disappoint *them*, not just some abstract goal.\n\nHas anyone else found this? Do you have strategies for staying motivated with a language when you\'re past the beginner excitement?`,
    tags: [tag('Language Learning', 'Q36180'), tag('Motivation'), tag('Psychology')],
    image_urls: [
      'https://picsum.photos/seed/disc04a/800/600',
      'https://picsum.photos/seed/disc04b/800/600',
    ],
    community_id: C02.toString(),
    comment_count: 16,
    upvote_count: 38,
    is_pinned: false,
    created_at: new Date('2026-01-08'),
    updated_at: new Date('2026-01-08'),
  },
  {
    _id: D05,
    user_id: U11,
    title: 'Critique circle February — share your work here',
    body: `This is the thread for our February critique circle. Post your work in the comments — anything you\'re currently making or thinking about: a painting, a photo series, a writing excerpt, a song, a design.\n\n**Guidelines:**\n- Be specific in your feedback. "I like it" tells someone nothing.\n- Ask what kind of feedback the person wants before giving it. Sometimes someone wants encouragement. Sometimes they want brutal honesty.\n- Separate observation from evaluation: "The composition places the subject in the lower third" before "I think this works/doesn\'t work because..."\n\nI\'ll start in the comments with a watercolor I\'m stuck on.\n\nThis thread stays open all month. Share whenever you\'re ready.`,
    tags: [tag('Art Critique'), tag('Creative'), tag('Community')],
    image_urls: [
      'https://picsum.photos/seed/disc05a/800/600',
      'https://picsum.photos/seed/disc05b/800/600',
      'https://picsum.photos/seed/disc05c/800/600',
    ],
    community_id: C03.toString(),
    comment_count: 19,
    upvote_count: 24,
    is_pinned: false,
    created_at: new Date('2026-02-01'),
    updated_at: new Date('2026-02-01'),
  },
  {
    _id: D06,
    user_id: U21,
    title: 'Burnout is not a productivity problem',
    body: `I keep seeing productivity tips recommended to burned-out people and it frustrates me.\n\nBurnout is not a time management problem. It\'s not fixed by better to-do lists or the Pomodoro technique. It\'s a state of chronic exhaustion caused by prolonged stress — usually in environments where you have low control, unclear expectations, or insufficient recognition.\n\nSigns that distinguish burnout from regular tiredness:\n- Emotional detachment from things you used to care about\n- Cynicism about your work or relationships\n- Inability to feel satisfied even when you accomplish something\n- Physical symptoms (headaches, sleep problems, recurring illness)\n\nWhat helps (from the clinical literature and my practice):\n- Rest — real rest, not "productive rest"\n- Reconnecting with activities that give you energy, not just deplete it\n- Addressing the source, not just the symptoms\n- Professional support — therapy is not a sign of weakness\n\nIf you\'re struggling: you're not lazy. Your system is out of resources. Please be kind to yourself.`,
    tags: [tag('Mental Health'), tag('Burnout'), tag('Wellness')],
    image_urls: ['https://picsum.photos/seed/disc06/800/600'],
    community_id: C04.toString(),
    comment_count: 21,
    upvote_count: 47,
    is_pinned: false,
    created_at: new Date('2026-02-10'),
    updated_at: new Date('2026-02-10'),
  },
  {
    _id: D07,
    user_id: U13,
    title: 'What does "living sustainably" actually mean in Istanbul?',
    body: `I hear "sustainable living" constantly and I've noticed it means very different things to different people.\n\nFor some, it\'s buying less plastic. For others, it\'s a political stance about systems change. For others, it\'s about food — local, seasonal, plant-based. For others, it\'s a spiritual practice.\n\nIn Istanbul specifically, some of these things are genuinely hard:\n- Public transport is excellent in some areas, non-existent in others\n- Local and seasonal produce requires knowing where to look (and has gotten expensive)\n- Recycling infrastructure is patchy and confusing\n- Sustainable fashion barely exists in affordable price ranges\n\nOn the other hand, some things are easier:\n- Pazar (farmer\'s market) culture is strong\n- Repair culture still exists in ways it doesn\'t in Northern Europe\n- Extended family networks reduce consumption in ways the "sustainability" conversation often ignores\n\n**What does living sustainably mean to you, given where you actually live and what you can actually afford?**`,
    tags: [tag('Sustainability', 'Q216497'), tag('Istanbul', 'Q406'), tag('Environment')],
    image_urls: [
      'https://picsum.photos/seed/disc07a/800/600',
      'https://picsum.photos/seed/disc07b/800/600',
    ],
    community_id: C05.toString(),
    comment_count: 15,
    upvote_count: 29,
    is_pinned: false,
    created_at: new Date('2026-02-20'),
    updated_at: new Date('2026-02-20'),
  },
  {
    _id: D08,
    user_id: U10,
    title: 'AI tools that actually save time vs. ones that waste it',
    body: `I\'ve been systematically testing AI tools for the past 6 months as part of my data workflow. Here\'s my honest assessment:\n\n**Actually saves time:**\n- GitHub Copilot for boilerplate and repetitive code patterns\n- ChatGPT for explaining error messages and documentation I don\'t want to read\n- Whisper for transcribing interview recordings\n- Claude for summarizing long reports\n\n**Sounds useful, actually a timesink:**\n- AI image tools for work presentations (takes forever to get them right)\n- AI writing assistants that require more editing than writing from scratch\n- "AI search" tools that confidently hallucinate citations\n\n**Actively made my work worse:**\n- Code suggestions that look right but introduce subtle bugs\n- Generating fake statistics I didn\'t catch until a client did\n\nI\'m curious whether others have similar experience. The "AI replaces everything" and "AI is useless" camps both seem wrong to me.`,
    tags: [tag('AI', 'Q11660'), tag('Productivity'), tag('Technology')],
    image_urls: ['https://picsum.photos/seed/disc08/800/600'],
    community_id: C01.toString(),
    comment_count: 13,
    upvote_count: 35,
    is_pinned: false,
    created_at: new Date('2026-03-01'),
    updated_at: new Date('2026-03-01'),
  },
  {
    _id: D09,
    user_id: U05,
    title: 'The best things I learned to cook from community exchanges',
    body: `I started this platform as someone who teaches cooking — but I\'ve ended up learning just as much as I\'ve given.\n\nA few things I learned from people here:\n- **Mert** taught me how to make proper baklava without the phyllo getting soggy (it\'s all about temperature)\n- **Defne** showed me which edible flowers grow wild in Istanbul parks (I had no idea)\n- **Cem** broke down the difference between specialty coffee varietals in a way I finally understood\n- A member I haven\'t seen since showed me a family recipe for tarhana soup I now make every winter\n\nThis is what time-banking does that money transactions don\'t: it creates real exchanges, not just services. When you learn from someone who learned from their grandmother, something different gets transmitted.\n\nWhat has this platform taught you that you didn\'t expect to learn?`,
    tags: [tag('Cooking', 'Q35497'), tag('Community'), tag('Learning')],
    image_urls: [
      'https://picsum.photos/seed/disc09a/800/600',
      'https://picsum.photos/seed/disc09b/800/600',
    ],
    community_id: null,
    comment_count: 12,
    upvote_count: 33,
    is_pinned: false,
    created_at: new Date('2026-03-12'),
    updated_at: new Date('2026-03-12'),
  },
  {
    _id: D10,
    user_id: U08,
    title: 'The disappearing craft workers of Istanbul — and why we should care',
    body: `I\'m a woodworker and furniture restorer and I\'ve been watching this slowly happen for 20 years: the traditional craft workshops that used to line streets in Fatih, Kapalıçarşı, and Tahtakale are closing, one by one.\n\nNot because people don\'t need this work — they do. But because:\n1. Rents have made workshops unaffordable in central areas\n2. Young people weren\'t entering the trades\n3. The culture shifted to buying new cheap furniture rather than repairing good old furniture\n\nWhat this platform has started to do — even if it\'s not its stated goal — is create a market for craft skills again. I\'ve done more furniture repair exchanges through here in the last year than I did through traditional channels.\n\nDo you have a skill that\'s becoming rare? Are you trying to keep something alive that the market would let die?`,
    tags: [tag('Crafts'), tag('Istanbul', 'Q406'), tag('Community'), tag('Culture')],
    image_urls: ['https://picsum.photos/seed/disc10/800/600'],
    community_id: null,
    comment_count: 10,
    upvote_count: 28,
    is_pinned: false,
    created_at: new Date('2026-03-20'),
    updated_at: new Date('2026-03-20'),
  },
  {
    _id: D11,
    user_id: U22,
    title: 'When your hobby becomes your skill-exchange offer: pros and cons',
    body: `I started music production as a hobby 8 years ago. Now I offer mentoring sessions through this platform. And it\'s been... mixed.\n\n**Good:**\n- I love teaching. It forces me to understand my own process better.\n- Meeting people at different skill levels has exposed me to musical ideas I wouldn\'t have found alone.\n- It\'s kept me accountable to keep learning.\n\n**Bad:**\n- Teaching drains me in a different way than making music. After 2h of mentoring, I don\'t want to produce.\n- Sometimes "students" are actually just trying to extract free consulting for projects they\'re monetizing.\n- There\'s a version where the hobby you loved starts to feel like work.\n\n**I think the solution is boundaries:**\n- I limit myself to 2 sessions a week\n- I only take on people who are genuinely making music, not just asking "how do I get famous"\n- I protect my own studio time fiercely\n\nHas anyone else navigated this? How do you offer a skill without it colonizing the thing you love?`,
    tags: [tag('Music', 'Q638'), tag('Work-Life Balance'), tag('Teaching')],
    image_urls: ['https://picsum.photos/seed/disc11/800/600'],
    community_id: C03.toString(),
    comment_count: 9,
    upvote_count: 26,
    is_pinned: false,
    created_at: new Date('2026-04-01'),
    updated_at: new Date('2026-04-01'),
  },
  {
    _id: D12,
    user_id: U03,
    title: 'Design feedback: share what you\'re working on',
    body: `Open thread for design work in progress. Share screenshots, mockups, or sketches. I\'ll give honest, specific feedback on everything posted.\n\nAny kind of design welcome:\n- UI/UX mockups\n- Brand identity\n- Poster and print design\n- Illustration\n- Typography experiments\n\nPlease share:\n1. What the project is\n2. What problem you\'re trying to solve\n3. What you\'re specifically unsure about\n\nI'll try to respond to every post within 24 hours. If others in the community want to add their feedback too, please do — the more perspectives the better.`,
    tags: [tag('Design', 'Q41014'), tag('Feedback'), tag('Community')],
    image_urls: [
      'https://picsum.photos/seed/disc12a/800/600',
      'https://picsum.photos/seed/disc12b/800/600',
    ],
    community_id: C03.toString(),
    comment_count: 17,
    upvote_count: 21,
    is_pinned: false,
    created_at: new Date('2026-04-10'),
    updated_at: new Date('2026-04-10'),
  },
  {
    _id: D13,
    user_id: U17,
    title: 'AMA: Emergency nursing and what it\'s taught me about life',
    body: `I\'ve been an ICU nurse for 7 years. I\'ve been present at more deaths than I can count, and at some remarkable recoveries. I\'ve held strangers\' hands while their families couldn\'t be there. I\'ve had to deliver news that changes everything.\n\nI\'m not saying this for sympathy — I genuinely love my work. But it does give you a particular perspective on what matters.\n\nThings I\'ve noticed:\n- People\'s final hours rarely involve regrets about work\n- The patients who do best often have strong community around them\n- Human bodies are both incredibly fragile and astonishingly resilient\n- Most medical emergencies are preventable with basic knowledge\n\nAsk me anything — about nursing, about emergency medicine, about what ICUs are really like, about first aid, about whatever.\n\nI'll answer everything I can within the limits of patient privacy and scope of practice.`,
    tags: [tag('Health', 'Q12147'), tag('Nursing'), tag('AMA')],
    image_urls: ['https://picsum.photos/seed/disc13/800/600'],
    community_id: C04.toString(),
    comment_count: 20,
    upvote_count: 52,
    is_pinned: false,
    created_at: new Date('2026-04-18'),
    updated_at: new Date('2026-04-18'),
  },
  {
    _id: D14,
    user_id: U16,
    title: 'Resources I actually used when I was learning to code',
    body: `I get asked this constantly so I\'m writing it down once. This is a list of resources I genuinely used when learning — not a curated "best of" list.\n\n**HTML/CSS:**\n- Kevin Powell\'s YouTube channel — the best CSS teacher on the internet, bar none\n- CSS-Tricks (now deprecated but the archives are gold)\n\n**JavaScript:**\n- javascript.info — the most complete free JS resource\n- Wes Bos\'s free courses (JavaScript30, CSS Grid)\n\n**React:**\n- The official docs (they rewrote them and they\'re now excellent)\n- Jack Herrington\'s videos on advanced patterns\n\n**What didn\'t work for me:**\n- Udemy mega-courses (useful for some, I lose focus after hour 3)\n- Tutorial hell — I had to force myself to build things\n\n**The most important thing:** Build something real, even if it\'s bad. I built a terrible app for tracking my book collection. It was embarrassing. It taught me more than 50 hours of tutorials.\n\nWhat resources worked for you?`,
    tags: [tag('Programming', 'Q80006'), tag('Web Development'), tag('Learning Resources')],
    image_urls: [
      'https://picsum.photos/seed/disc14a/800/600',
    ],
    community_id: C01.toString(),
    comment_count: 14,
    upvote_count: 40,
    is_pinned: false,
    created_at: new Date('2026-04-25'),
    updated_at: new Date('2026-04-25'),
  },
  {
    _id: D15,
    user_id: U14,
    title: 'The philosophy of cooking: why food is never just food',
    body: `I trained as a chef and I spend a lot of time thinking about food. Not just technique — but what food is, and what cooking does.\n\nSome things I believe:\n\n**Cooking is care made tangible.** When you cook for someone, you\'re saying: I thought about you, I chose ingredients for you, I stood at a stove for you. This is not small.\n\n**Eating together is the oldest form of trust.** You don\'t share food with people you fear. Every culture in the world uses shared meals to mark belonging.\n\n**The way we eat reflects who we are economically.** Fast food, convenience food, "productivity-optimized" eating — these are adaptations to a specific kind of scarcity (time, money, energy). They\'re not moral failures.\n\n**Traditional food is memory.** When I cook tarhana from my grandmother\'s recipe, I\'m not just making soup. I\'m preserving a record of who she was and where we came from.\n\nI\'m curious: what does food mean to you beyond nutrition?`,
    tags: [tag('Food', 'Q2095'), tag('Culture'), tag('Philosophy')],
    image_urls: [
      'https://picsum.photos/seed/disc15a/800/600',
      'https://picsum.photos/seed/disc15b/800/600',
    ],
    community_id: null,
    comment_count: 18,
    upvote_count: 44,
    is_pinned: false,
    created_at: new Date('2026-05-02'),
    updated_at: new Date('2026-05-02'),
  },
];

db.forum_discussions.insertMany(discussions);
print(`Inserted ${discussions.length} forum discussions.`);

// ── forum events ──────────────────────────────────────────────────────────────

const events = [
  {
    _id: E01,
    user_id: U00,
    title: 'Istanbul Tech Meetup: Building Community-Driven Products',
    description: `Join us for an evening of talks and discussion on how to build products that serve real communities — not just acquire users.\n\n**Talks:**\n- Mehmet Yılmaz: "What time-banking taught me about product design"\n- Bora Güneş: "Building accessible frontends — why it matters and how to start"\n- Open mic: 3 min lightning talks (sign up on the door)\n\n**Format:**\n- 90 min talks + Q&A\n- 45 min networking (tea and coffee provided)\n- Doors open at 18:30, talks start at 19:00\n\n**Venue:**\n- Kolektif House, Maslak (booking confirmed)\n- Easily accessible by metro (Maslak station)\n\nThis is a free event — your time credits are your ticket. No need to spend or earn anything, just show up.\n\nCapacity: 40 people. RSVP by clicking Attend so we can plan the space.`,
    event_at: new Date('2025-12-10T19:00:00.000Z'),
    location: 'Kolektif House, Maslak, Istanbul',
    latitude: 41.0812,
    longitude: 29.0117,
    is_remote: false,
    tags: [tag('Technology', 'Q11016'), tag('Meetup'), tag('Community')],
    image_urls: [
      'https://picsum.photos/seed/evt01img/800/600',
    ],
    banner_image_url: 'https://picsum.photos/seed/evt01banner/1200/400',
    attendee_ids: [U00, U16, U10, U03, U07, U18, U22, U12],
    community_id: C01.toString(),
    comment_count: 7,
    upvote_count: 16,
    created_at: new Date('2025-11-25'),
    updated_at: new Date('2025-12-10'),
  },
  {
    _id: E02,
    user_id: U09,
    title: 'New Year\'s Morning Yoga Flow — Outdoor Session in Fenerbahçe Park',
    description: `Start 2026 with intention. Join me for a 75-minute outdoor yoga session on January 1st in Fenerbahçe Park — a tradition I started 4 years ago and am opening to the community this year.\n\n**Session details:**\n- Gentle vinyasa flow with longer holds\n- Suitable for all levels (including beginners)\n- Morning meditation at the end\n- Bring: mat, water, layers (it will be cold!)\n\n**Meeting point:** Main fountain entrance of Fenerbahçe Park, Kadıköy\n\n**Time:** 9:00–10:15 AM (arrives early for a warm-up)\n\nThis is free and open to anyone. No time credits needed — just show up and move.\n\nMax 25 people (outdoor space, need to stay manageable). If more want to join, I\'ll run a second session on January 3rd.`,
    event_at: new Date('2026-01-01T09:00:00.000Z'),
    location: 'Fenerbahçe Park, Kadıköy, Istanbul',
    latitude: 40.9656,
    longitude: 29.0333,
    is_remote: false,
    tags: [tag('Yoga', 'Q8162'), tag('Outdoor'), tag('New Year')],
    image_urls: [
      'https://picsum.photos/seed/evt02img/800/600',
    ],
    banner_image_url: 'https://picsum.photos/seed/evt02banner/1200/400',
    attendee_ids: [U09, U04, U21, U11, U05, U17, U23, U14, U13, U08, U15],
    community_id: C04.toString(),
    comment_count: 9,
    upvote_count: 20,
    created_at: new Date('2025-12-20'),
    updated_at: new Date('2026-01-02'),
  },
  {
    _id: E03,
    user_id: U01,
    title: 'Language Exchange Social — Turkish ↔ English ↔ French',
    description: `Monthly language exchange social! This is a casual meetup for anyone learning Turkish, English, or French — or who speaks one and wants to help others learn.\n\n**Format:**\n- Arrive between 15:00–15:30\n- Tables organized by language focus (Turkish learners table, English learners table, mixed table)\n- 20-minute conversation rounds, then rotate\n- No formal structure — just talk, ask questions, laugh at mistakes\n\n**Venue:** Petra Roasting Co., Beyoğlu\n\n**Note:** This is a coffee shop — buy something. The owner is a community member who hosts us.\n\nAll languages and levels welcome. You don\'t need to be advanced to participate — beginners are especially welcome.`,
    event_at: new Date('2026-02-14T15:00:00.000Z'),
    location: 'Petra Roasting Co., Beyoğlu, Istanbul',
    latitude: 41.0351,
    longitude: 28.9778,
    is_remote: false,
    tags: [tag('Language Exchange', 'Q36180'), tag('Social Event'), tag('Community')],
    image_urls: [
      'https://picsum.photos/seed/evt03img/800/600',
    ],
    banner_image_url: 'https://picsum.photos/seed/evt03banner/1200/400',
    attendee_ids: [U01, U07, U15, U19, U02, U12, U06, U14],
    community_id: C02.toString(),
    comment_count: 6,
    upvote_count: 14,
    created_at: new Date('2026-02-01'),
    updated_at: new Date('2026-02-14'),
  },
  {
    _id: E04,
    user_id: U11,
    title: 'Open Studio Day: Bring Your Work in Progress',
    description: `Every first Saturday of the month, I open my studio in Cihangir from 14:00 to 18:00. Come bring whatever you\'re working on — painting, drawing, photography prints, writing drafts — and work in company.\n\n**What you get:**\n- A comfortable, well-lit space with natural light\n- Good music (I take requests)\n- Tea and coffee\n- Honest feedback if you want it, silence if you need it\n- Other makers to be around\n\n**What you bring:**\n- Your materials\n- Your work in progress (or a blank canvas if you\'re starting fresh)\n- Optional: something to share for the snack table\n\nThis is not a class. No one is teaching. We\'re just making things together.\n\nRSVP so I know how many chairs to set up.`,
    event_at: new Date('2026-03-07T14:00:00.000Z'),
    location: 'Cihangir, Istanbul (address shared with attendees)',
    latitude: 41.0365,
    longitude: 28.9842,
    is_remote: false,
    tags: [tag('Art', 'Q735'), tag('Open Studio'), tag('Creativity')],
    image_urls: [
      'https://picsum.photos/seed/evt04img/800/600',
    ],
    banner_image_url: 'https://picsum.photos/seed/evt04banner/1200/400',
    attendee_ids: [U11, U06, U03, U22, U05, U15, U20],
    community_id: C03.toString(),
    comment_count: 5,
    upvote_count: 12,
    created_at: new Date('2026-02-22'),
    updated_at: new Date('2026-03-08'),
  },
  {
    _id: E05,
    user_id: U20,
    title: 'Coffee Cupping Session — 5 Origins, 1 Morning',
    description: `A professional coffee cupping session at the roastery. We\'ll taste 5 single-origin coffees side by side using the SCA cupping protocol.\n\n**What is a cupping?**\nA standardized way to evaluate coffee flavor. You grind, add hot water, wait, break the crust, slurp (yes, loudly), and score. No equipment knowledge required — I\'ll guide you through it.\n\n**Coffees this session:**\n- Ethiopia Yirgacheffe (floral, citrus)\n- Kenya AA (blackcurrant, tomato)\n- Colombia Huila (caramel, red apple)\n- Guatemala Antigua (chocolate, hazelnut)\n- Guatemala Natural Process (fermented fruit, wine)\n\n**Details:**\n- Saturday, March 29th — 10:00 AM\n- Max 8 people (small group for real discussion)\n- 2 hours\n- My roastery in Beyoğlu (Karaköy area)\n- 1 time credit to participate`,
    event_at: new Date('2026-03-29T10:00:00.000Z'),
    location: 'Cem Demir Micro-Roastery, Karaköy, Istanbul',
    latitude: 41.0228,
    longitude: 28.9781,
    is_remote: false,
    tags: [tag('Coffee', 'Q8486'), tag('Workshop'), tag('Food')],
    image_urls: [
      'https://picsum.photos/seed/evt05imga/800/600',
      'https://picsum.photos/seed/evt05imgb/800/600',
    ],
    banner_image_url: 'https://picsum.photos/seed/evt05banner/1200/400',
    attendee_ids: [U20, U05, U14, U01, U15, U23, U08],
    community_id: null,
    comment_count: 8,
    upvote_count: 17,
    created_at: new Date('2026-03-10'),
    updated_at: new Date('2026-03-30'),
  },
  {
    _id: E06,
    user_id: U13,
    title: 'Balat Community Clean-Up + Guided Walk',
    description: `We\'re organizing a neighborhood clean-up in Balat followed by a guided walk through the neighborhood\'s environmental and historical highlights.\n\n**Schedule:**\n- 9:00 AM: Meet at Balat Vapur İskelesi\n- 9:15–11:00 AM: Clean-up (gloves and bags provided)\n- 11:00–12:30 PM: Guided walk with Dilan — focusing on green spaces, traditional building materials, and the neighborhood\'s water history\n- 12:30 PM: Picnic in Fener Bahçesi (bring a dish to share)\n\n**Why Balat?**\nBalat is one of Istanbul\'s oldest neighborhoods and one of the most affected by rapid gentrification. We want to invest in it as a community while learning about its history.\n\n**All materials provided.** Wear comfortable shoes.\n\nThis is free and open to everyone — no time credits involved.`,
    event_at: new Date('2026-04-19T09:00:00.000Z'),
    location: 'Balat Vapur İskelesi, Fatih, Istanbul',
    latitude: 41.0314,
    longitude: 28.9481,
    is_remote: false,
    tags: [tag('Environment'), tag('Community'), tag('Istanbul', 'Q406')],
    image_urls: [
      'https://picsum.photos/seed/evt06img/800/600',
    ],
    banner_image_url: 'https://picsum.photos/seed/evt06banner/1200/400',
    attendee_ids: [U13, U23, U07, U05, U17, U09, U08, U14, U06, U15],
    community_id: C05.toString(),
    comment_count: 10,
    upvote_count: 23,
    created_at: new Date('2026-04-05'),
    updated_at: new Date('2026-04-20'),
  },
  {
    _id: E07,
    user_id: U17,
    title: 'First Aid Workshop — May Edition (Taksim)',
    description: `Monthly first aid workshop, this time in the Taksim/Beyoğlu area.\n\n**Topics covered:**\n- Adult CPR and AED operation\n- Choking: adult, child, and infant technique\n- Bleeding control (including tourniquet use)\n- Unconsciousness and recovery position\n- Burn treatment basics\n- When and how to call 112\n\n**Details:**\n- Saturday, May 17th — 14:00–16:00\n- Location: TBD (will confirm to registered attendees)\n- Max 8 people (hands-on skills require small groups)\n- 2 time credits\n\n**Prerequisites:** None. Come as you are.\n\n**What you need:** Comfortable clothes you can move in (we practice on mannequins and each other).\n\nSpots fill quickly — register early.`,
    event_at: new Date('2026-05-17T14:00:00.000Z'),
    location: 'Beyoğlu, Istanbul (exact address TBD)',
    latitude: 41.0351,
    longitude: 28.9778,
    is_remote: false,
    tags: [tag('First Aid', 'Q1374975'), tag('Health Education'), tag('Workshop')],
    image_urls: [
      'https://picsum.photos/seed/evt07img/800/600',
    ],
    banner_image_url: 'https://picsum.photos/seed/evt07banner/1200/400',
    attendee_ids: [U17, U04, U13, U21, U23],
    community_id: C04.toString(),
    comment_count: 4,
    upvote_count: 11,
    created_at: new Date('2026-04-28'),
    updated_at: new Date('2026-04-28'),
  },
  {
    _id: E08,
    user_id: U06,
    title: 'Photography Walk: Golden Horn at Golden Hour',
    description: `Join me for a photography walk along the Golden Horn (Haliç) during the one hour before sunset — the best light Istanbul offers.\n\n**Meeting point:** Fener ferry stop, May 24th at 18:30\n\n**What we\'ll do:**\n- Walk from Fener toward Ayvansaray (~3km, flat)\n- I\'ll give tips on light reading, composition, and street photography approach\n- We\'ll stop at 5–7 predetermined vantage points\n- End at a tea garden with views of the Haliç for informal review\n\n**Any camera welcome** — including phones. This is about seeing, not equipment.\n\n**After the walk:**\nI\'ll create a shared folder. Please upload your 5 favorites within 48h. We\'ll do a brief online critique the following week.\n\nFree event — no time credits needed.`,
    event_at: new Date('2026-05-24T18:30:00.000Z'),
    location: 'Fener Vapur İskelesi, Fatih, Istanbul',
    latitude: 41.0354,
    longitude: 28.9501,
    is_remote: false,
    tags: [tag('Photography', 'Q11633'), tag('Istanbul', 'Q406'), tag('Walk')],
    image_urls: [
      'https://picsum.photos/seed/evt08imga/800/600',
      'https://picsum.photos/seed/evt08imgb/800/600',
    ],
    banner_image_url: 'https://picsum.photos/seed/evt08banner/1200/400',
    attendee_ids: [U06, U11, U03, U22, U15],
    community_id: C03.toString(),
    comment_count: 6,
    upvote_count: 15,
    created_at: new Date('2026-05-05'),
    updated_at: new Date('2026-05-05'),
  },
];

db.forum_events.insertMany(events);
print(`Inserted ${events.length} forum events.`);

// ── forum comments ────────────────────────────────────────────────────────────

function comment(targetType, targetId, userId, content, date) {
  return {
    _id: new ObjectId(),
    user_id: userId,
    target_type: targetType,
    target_id: targetId,
    content,
    image_urls: [],
    upvote_count: Math.floor(Math.random() * 8),
    created_at: date,
    updated_at: date,
  };
}

const d = 'discussion';
const e = 'event';

const comments = [
  // D01 – timebank fairness
  comment(d, D01, U09, 'I think about this constantly. My position: the value of time in the market is already deeply unfair — it reflects power and scarcity of credentials, not actual labor or skill. The timebank being flat is a correction, not an error.', new Date('2025-11-21')),
  comment(d, D01, U13, 'From an environmental perspective — I think about this when comparing "expert" environmental consulting to someone who just picks up trash every day. The latter probably has more actual impact. Credentials and market value are really bad proxies.', new Date('2025-11-21')),
  comment(d, D01, U16, 'Software engineer here — I earn well in the market. The idea that my hours are "worth more" has always made me uncomfortable. This platform gives me a space to exchange without that guilt. I think the equality is the point, not a compromise.', new Date('2025-11-22')),
  comment(d, D01, U07, 'I did a PhD. The market values my expertise at very little compared to what engineers earn. Equal time credits feel more just to me personally than the market alternative.', new Date('2025-11-23')),
  comment(d, D01, U20, 'There\'s a coffee economics angle here — specialty coffee (my field) is dramatically undervalued by the market compared to tech skills, even though the training time and knowledge depth is comparable. Equal credits feels right.', new Date('2025-11-24')),
  comment(d, D01, U04, 'As a personal trainer: my market rate is a fraction of a software developer\'s despite comparable education and skill. I vote for flat credits every time.', new Date('2025-11-25')),
  comment(d, D01, U03, 'Designer here — same experience as Emre. The market systematically undervalues certain skills. I think the flat model is doing something intentional and important.', new Date('2025-11-26')),
  comment(d, D01, U02, 'I love this discussion. No conclusion, but I\'m more confident the flat model is right after reading the comments.', new Date('2025-11-28')),

  // D02 – unexpected skills
  comment(d, D02, U08, 'I was not expecting to be asked to help someone identify traditional Turkish woodworking joints from photos. Apparently I know this and don\'t know I know it.', new Date('2025-12-04')),
  comment(d, D02, U22, 'I offered music production and received help identifying wild herbs in Istanbul parks (from Defne). I had no idea this was a skill. Now I can spot 6 species.', new Date('2025-12-05')),
  comment(d, D02, U17, 'Received: someone explained how traditional Turkish kilim patterns encode family histories. Given: CPR. Both sides got something we couldn\'t have expected.', new Date('2025-12-05')),
  comment(d, D02, U14, 'Learned a Georgian bread technique I\'ve been using in my pop-ups ever since. I never would have found this in a course.', new Date('2025-12-06')),
  comment(d, D02, U19, 'Skilled at: Ottoman court Ottoman — I can read and translate documents from the 17th–19th century. I\'ve never had a use for this in 15 years. Then someone here needed it for their family history research.', new Date('2025-12-07')),
  comment(d, D02, U23, 'Hidden skill: I know which plants are edible and which are poisonous in Istanbul parks. Offered it here and it\'s been my most popular exchange.', new Date('2025-12-08')),
  comment(d, D02, U06, 'Someone here needed a photo of a specific Istanbul street corner from 1970 for a documentary they were making. I happen to know a collector of historical Istanbul photos. Made the connection. That\'s a skill?', new Date('2025-12-09')),
  comment(d, D02, U15, 'I can repair hand-stitched book bindings. Never thought it was useful. Four people have now brought me damaged books.', new Date('2025-12-10')),
  comment(d, D02, U21, 'Hidden skill: I can teach people to fall safely. As a therapist who also does judo, I know how to do a proper ukemi. More useful than expected — two people I\'ve taught have already used it.', new Date('2025-12-11')),
  comment(d, D02, U12, 'Unexpected: I can solve Rubik\'s cubes and apparently this impresses a lot of people who want to learn. I never thought this counted.', new Date('2025-12-12')),
  comment(d, D02, U18, 'Unexpected exchange: I gave architectural advice on a community garden space. Got: help finding a family heirloom piece in a flea market (turns out people have incredible antique knowledge).', new Date('2025-12-14')),

  // D04 – language learning
  comment(d, D04, U19, 'Everything you said resonates. I\'m learning German and the embarrassment is constant. What helps me: finding a native speaker who\'s also learning my language. The power dynamic becomes reciprocal.', new Date('2026-01-09')),
  comment(d, D04, U12, 'The invisible progress thing is real. I didn\'t notice my Turkish was improving until a stranger asked me if I was from Ankara.', new Date('2026-01-09')),
  comment(d, D04, U07, 'The accountability you describe is exactly why I keep meeting with my English partner. It\'s not really about the language anymore — it\'s about the relationship.', new Date('2026-01-10')),
  comment(d, D04, U02, 'I\'m learning music theory as an adult and the feelings you describe are identical. The "I\'m too old for this" thought, the embarrassment, the motivation crashes.', new Date('2026-01-11')),
  comment(d, D04, U08, 'I stopped learning English three times before it stuck. What finally worked: having something real to say, to someone real. The grammar came later.', new Date('2026-01-12')),
  comment(d, D04, U23, 'I\'m learning Italian and I\'ve never felt stupider in my life. Thank you for writing this. It helps to know it\'s structural, not personal.', new Date('2026-01-13')),
  comment(d, D04, U16, 'The "thinking in the language" moment is wild when it happens. You described the path to it perfectly.', new Date('2026-01-14')),
  comment(d, D04, U20, 'Coffee vocabulary is how I learned my French. Ridiculous niche, but it gave me real things to say.', new Date('2026-01-15')),
  comment(d, D04, U22, 'Music production terms for my German. Same principle, same result.', new Date('2026-01-17')),
  comment(d, D04, U05, 'Food vocabulary for my English. Now I can explain Turkish cuisine in detail in English. That was the goal all along.', new Date('2026-01-18')),
  comment(d, D04, U03, 'Design vocabulary for my English. Exactly what I needed for international clients.', new Date('2026-01-20')),

  // D06 – burnout
  comment(d, D06, U04, 'Thank you for writing this clearly. My clients often think they\'re just "tired." The distinction you draw between tiredness and burnout is crucial and most people miss it.', new Date('2026-02-11')),
  comment(d, D06, U09, 'The note about "productive rest" is so important. Yoga and meditation get instrumentalized as productivity tools, which completely defeats the point.', new Date('2026-02-11')),
  comment(d, D06, U05, 'I burned out 3 years ago and the most counterintuitive thing was that working harder made it worse. Only rest and reduction helped.', new Date('2026-02-12')),
  comment(d, D06, U15, 'The physical symptoms section — I had all of those and kept telling myself I just needed a better routine. Finally talked to someone and it was burnout, not disorganization.', new Date('2026-02-13')),
  comment(d, D06, U13, 'Addressing the source not the symptoms: this is true for environmental problems too. Symptom-treating vs. root cause. Same framework.', new Date('2026-02-14')),
  comment(d, D06, U07, 'As an academic: the sector has normalized burnout as a badge of honor. This needs to be said loudly.', new Date('2026-02-15')),
  comment(d, D06, U16, 'I recognized myself in this. More than I wanted to.', new Date('2026-02-16')),
  comment(d, D06, U23, 'Taking this to my next therapy session. Thank you.', new Date('2026-02-17')),
  comment(d, D06, U10, 'What helped me: radical reduction — not productivity optimization. Just... less.', new Date('2026-02-18')),
  comment(d, D06, U22, 'This is the most important thread on this platform. Thank you.', new Date('2026-02-19')),

  // D13 – AMA nursing
  comment(d, D13, U04, 'What\'s the biggest misconception the public has about what happens in an ICU?', new Date('2026-04-19')),
  comment(d, D13, U17, 'Most people think it\'s like a TV medical drama — constant action, dramatic reversals. The reality is mostly silence, patience, careful monitoring, and grief. The dramatic moments are rare. The slow ones are constant.', new Date('2026-04-19')),
  comment(d, D13, U09, 'What do patients ask for most in their final hours?', new Date('2026-04-20')),
  comment(d, D13, U17, 'Presence. Not action — just someone sitting with them. The thing that\'s most hard to give in a busy ward and most needed.', new Date('2026-04-20')),
  comment(d, D13, U21, 'From one health professional to another — how do you manage vicarious trauma?', new Date('2026-04-21')),
  comment(d, D13, U17, 'Supervision (having a therapist or peer group to process with), ritual (I have a literal ritual I do on the way home to "leave work at work"), and movement. The body holds stress that the mind can\'t process.', new Date('2026-04-21')),
  comment(d, D13, U00, 'What\'s one first aid skill everyone should have that almost nobody does?', new Date('2026-04-22')),
  comment(d, D13, U17, 'Tourniquet application. Not just awareness — actual technique, with something you can find in a first aid kit. Most bleeding-related deaths are preventable in the first 5 minutes. The ambulance takes longer than that.', new Date('2026-04-22')),
  comment(d, D13, U13, 'What\'s a moment that changed how you see your work?', new Date('2026-04-23')),
  comment(d, D13, U17, 'A patient who woke up from a coma asked me if I was the person who talked to him while he was under. I wasn\'t. But someone was. Whoever it was did something important. Don\'t underestimate presence.', new Date('2026-04-23')),

  // E01 – tech meetup
  comment(e, E01, U16, 'Really looking forward to this. The talk on accessible frontends is something I\'ve been needing to learn about.', new Date('2025-11-26')),
  comment(e, E01, U03, 'Will there be a recording? I have a conflicting commitment but I don\'t want to miss the talks.', new Date('2025-11-27')),
  comment(e, E01, U00, '@Zeynep — I\'ll try to record the talks but no promises on quality. We\'ll see.', new Date('2025-11-28')),
  comment(e, E01, U10, 'I\'d love to sign up for a lightning talk. What\'s the topic scope?', new Date('2025-12-01')),
  comment(e, E01, U07, 'This is exactly what Istanbul\'s tech scene needs. Something community-organized, not corporate-sponsored.', new Date('2025-12-02')),
  comment(e, E01, U18, 'Came to the event — great turnout, excellent discussions. When\'s the next one?', new Date('2025-12-11')),
  comment(e, E01, U22, 'Just attended. The lightning talks were the highlight for me — so much more interesting than a polished keynote.', new Date('2025-12-11')),

  // E02 – yoga in the park
  comment(e, E02, U04, 'This is beautiful. I\'ll be there — I\'ve been wanting to restart my practice after a break.', new Date('2025-12-21')),
  comment(e, E02, U21, 'Thank you for organizing this. Public yoga in Istanbul still feels radical somehow.', new Date('2025-12-22')),
  comment(e, E02, U23, 'Will be there! This is exactly the kind of thing I moved to Kadıköy for.', new Date('2025-12-28')),
  comment(e, E02, U05, 'Attended — it was everything I hoped. Elif is an incredible teacher. Already signed up for the Jan 3rd session.', new Date('2026-01-01')),
  comment(e, E02, U08, 'Woke up to attend this on January 1st. Worth it. The meditation at the end of the session was the perfect start to the year.', new Date('2026-01-02')),

  // E05 – coffee cupping
  comment(e, E05, U14, 'I\'ve wanted to do a professional cupping for years. Signing up immediately.', new Date('2026-03-11')),
  comment(e, E05, U05, 'As a cook, coffee education is something I\'ve always done informally. This is a chance to do it properly.', new Date('2026-03-12')),
  comment(e, E05, U01, 'I\'ve been doing language exchanges with Cem for months but I didn\'t know he ran a roastery. Amazing.', new Date('2026-03-14')),
  comment(e, E05, U23, 'Will the Ethiopian and Kenyan coffees be washed or natural process? The terroir notes you described (citrus, blackcurrant) suggest washed?', new Date('2026-03-16')),
  comment(e, E05, U20, '@Defne — yes, both washed. The Guatemala at the end is the natural process. Great question.', new Date('2026-03-16')),
  comment(e, E05, U15, 'Attended — one of the best 2 hours I\'ve spent this year. I will never drink bad coffee again.', new Date('2026-03-30')),
  comment(e, E05, U08, 'Same. Cem is a remarkable educator as well as a great roaster.', new Date('2026-03-30')),

  // E06 – Balat clean-up
  comment(e, E06, U07, 'Finally a community action I can join! I\'ve been wanting to do something like this since reading about the neighborhood\'s history.', new Date('2026-04-06')),
  comment(e, E06, U05, 'I\'ll bring something for the picnic — will check what\'s in season at the market the morning before.', new Date('2026-04-07')),
  comment(e, E06, U23, 'The plant-focused part of the guided walk will be interesting — there are some remarkable urban pioneer plants in Balat if you know where to look.', new Date('2026-04-08')),
  comment(e, E06, U14, 'Bringing food to share. Thinking something easy to carry and eat standing up.', new Date('2026-04-10')),
  comment(e, E06, U06, 'I\'ll bring my camera and document the walk. Will share photos with everyone after.', new Date('2026-04-12')),
  comment(e, E06, U13, 'Thank you all for signing up. This is going to be a special morning. I\'ll share the detailed map the day before.', new Date('2026-04-14')),
  comment(e, E06, U17, 'Attended — the guided walk was extraordinary. Dilan knows this neighborhood like a historian and an ecologist at the same time.', new Date('2026-04-20')),
];

db.forum_comments.insertMany(comments);
print(`Inserted ${comments.length} forum comments.`);

// ── update attendee_ids on forum_events (already set above) ──────────────────
// attendee_ids were set in the event documents directly — no update needed.

print('\n✓ All seed data inserted successfully.');
print('Scripts run order: playground-5 → 6 → 7 → 8 → 9');
