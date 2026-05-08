/* global use, db */
// Seed: Communities, memberships, and community posts.
// Run AFTER playground-7 (transactions/ratings).

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

// ── community ids ─────────────────────────────────────────────────────────────

const C01 = ObjectId('665300000000000000000001'); // Istanbul Tech Exchange
const C02 = ObjectId('665300000000000000000002'); // Language & Culture Hub
const C03 = ObjectId('665300000000000000000003'); // Creative Arts Collective
const C04 = ObjectId('665300000000000000000004'); // Wellness & Mindful Living
const C05 = ObjectId('665300000000000000000005'); // Sustainability Network Istanbul

function tag(label, entityId) {
  return { label, entityId: entityId || '', description: null, aliases: [] };
}

// ── communities ───────────────────────────────────────────────────────────────

const communities = [
  {
    _id: C01,
    name: 'Istanbul Tech Exchange',
    slug: 'istanbul-tech-exchange',
    description: `A community for developers, designers, data scientists, and tech enthusiasts in Istanbul who want to exchange skills, collaborate on projects, and support each other's growth.\n\nWe believe that the best way to learn is from each other. Whether you're a seasoned engineer or a bootcamp grad, there's something here for you to offer — and a lot to gain.\n\n**What we do**\n- Organize coding workshops and hackathons\n- Match members for pair programming and mentoring\n- Share job opportunities and freelance leads\n- Discuss technology trends and tools`,
    rules: [
      'Be kind and constructive. No gatekeeping.',
      'Share your real experience — don\'t oversell your expertise.',
      'No spam, self-promotion, or ads without moderator approval.',
      'Respect confidentiality — don\'t share others\' code or projects without permission.',
      'Use English or Turkish — both are welcome.',
    ],
    tags: [tag('Technology', 'Q11016'), tag('Programming', 'Q80006'), tag('Istanbul', 'Q406')],
    cover_image_url: 'https://picsum.photos/seed/comm01cover/1200/400',
    avatar_url: 'https://picsum.photos/seed/comm01avatar/200/200',
    founder_id: U00,
    member_count: 10,
    post_count: 8,
    is_pinned: false,
    created_at: new Date('2025-11-15'),
    updated_at: new Date('2026-04-20'),
  },
  {
    _id: C02,
    name: 'Language & Culture Hub',
    slug: 'language-culture-hub',
    description: `A space for language learners, teachers, translators, and culture lovers. We host conversation exchanges, translation practice, and discussions about cross-cultural communication.\n\nTurkish, English, French, German, Spanish — all languages welcome. We celebrate the diversity of our city and the connections language creates.\n\n**Our regular activities**\n- Weekly language exchange meetups (online + in person)\n- Translation challenge threads\n- Book and film recommendations across cultures\n- Help with documents, applications, and bureaucracy`,
    rules: [
      'Be patient with learners — we all start somewhere.',
      'Correct errors kindly, not harshly.',
      'All languages and cultures are equal here.',
      'Don\'t charge for help unless agreed in advance via the platform.',
    ],
    tags: [tag('Language Learning', 'Q36180'), tag('Translation', 'Q7553'), tag('Culture')],
    cover_image_url: 'https://picsum.photos/seed/comm02cover/1200/400',
    avatar_url: 'https://picsum.photos/seed/comm02avatar/200/200',
    founder_id: U01,
    member_count: 9,
    post_count: 7,
    is_pinned: false,
    created_at: new Date('2025-11-20'),
    updated_at: new Date('2026-05-01'),
  },
  {
    _id: C03,
    name: 'Creative Arts Collective',
    slug: 'creative-arts-collective',
    description: `For painters, photographers, musicians, writers, and makers of all kinds. This is a community that believes creativity should be shared, not hoarded.\n\nWe exchange creative skills, give honest feedback on each other's work, and organize collaborative projects. No gatekeeping based on "talent" — if you make things, you belong here.\n\n**Community highlights**\n- Monthly critique circles (bring your work!)\n- Photography walks around Istanbul neighborhoods\n- Open mic and jam sessions\n- Collaborative zine and art book projects`,
    rules: [
      'Give the kind of feedback you\'d want to receive.',
      'Credit collaborators always.',
      'No copyright infringement — share only your own work.',
      'Support each other\'s growth without comparing.',
    ],
    tags: [tag('Art', 'Q735'), tag('Music', 'Q638'), tag('Photography', 'Q11633'), tag('Writing')],
    cover_image_url: 'https://picsum.photos/seed/comm03cover/1200/400',
    avatar_url: 'https://picsum.photos/seed/comm03avatar/200/200',
    founder_id: U11,
    member_count: 10,
    post_count: 9,
    is_pinned: false,
    created_at: new Date('2025-12-01'),
    updated_at: new Date('2026-04-28'),
  },
  {
    _id: C04,
    name: 'Wellness & Mindful Living',
    slug: 'wellness-mindful-living',
    description: `A supportive community for people who care about mental and physical wellbeing. We share practices, exchange skills, and hold each other accountable in building healthier lives.\n\nNo diet culture, no toxic positivity, no "hustle harder" nonsense. Just real conversations about rest, movement, nourishment, and mental health.\n\n**What we share**\n- Yoga and movement classes (online and in person)\n- Mindfulness and meditation sessions\n- Healthy cooking exchanges\n- Mental health resources and peer support conversations`,
    rules: [
      'This is a safe space — no judgment about body, habits, or progress.',
      'Don\'t give unsolicited medical advice.',
      'Respect individual approaches to wellness.',
      'Celebrate small wins. Progress is progress.',
    ],
    tags: [tag('Health', 'Q12147'), tag('Yoga', 'Q8162'), tag('Mindfulness', 'Q2731990'), tag('Fitness')],
    cover_image_url: 'https://picsum.photos/seed/comm04cover/1200/400',
    avatar_url: 'https://picsum.photos/seed/comm04avatar/200/200',
    founder_id: U09,
    member_count: 9,
    post_count: 6,
    is_pinned: false,
    created_at: new Date('2025-12-10'),
    updated_at: new Date('2026-05-02'),
  },
  {
    _id: C05,
    name: 'Sustainability Network Istanbul',
    slug: 'sustainability-network-istanbul',
    description: `A community of environmentalists, activists, researchers, and everyday people who want to live more sustainably and push for systemic change.\n\nWe exchange knowledge about sustainability practices, connect people with green initiatives, and organize community actions. Everyone from professionals to curious beginners is welcome.\n\n**Focus areas**\n- Zero-waste and circular economy practices\n- Urban gardening and food sovereignty\n- Carbon footprint measurement and reduction\n- Policy advocacy and community organizing`,
    rules: [
      'Focus on solutions, not just problems.',
      'No eco-shaming — meet people where they are.',
      'Science-based discussions only — cite your sources.',
      'Amplify marginalized voices in the climate conversation.',
    ],
    tags: [tag('Environment', 'Q27177'), tag('Sustainability', 'Q216497'), tag('Climate Change', 'Q7942')],
    cover_image_url: 'https://picsum.photos/seed/comm05cover/1200/400',
    avatar_url: 'https://picsum.photos/seed/comm05avatar/200/200',
    founder_id: U13,
    member_count: 8,
    post_count: 6,
    is_pinned: false,
    created_at: new Date('2025-12-15'),
    updated_at: new Date('2026-04-30'),
  },
];

db.communities.insertMany(communities);
print(`Inserted ${communities.length} communities.`);

// ── community memberships ─────────────────────────────────────────────────────

function membership(communityId, userId, role, joinedAt) {
  return {
    _id: new ObjectId(),
    community_id: communityId,
    user_id: userId,
    role: role || 'member',
    status: 'active',
    joined_at: joinedAt,
  };
}

const memberships = [
  // C01 – Istanbul Tech Exchange (founder: U00)
  membership(C01, U00, 'founder',    new Date('2025-11-15')),
  membership(C01, U10, 'moderator',  new Date('2025-11-17')),
  membership(C01, U16, 'member',     new Date('2025-11-18')),
  membership(C01, U03, 'member',     new Date('2025-11-20')),
  membership(C01, U07, 'member',     new Date('2025-12-02')),
  membership(C01, U12, 'member',     new Date('2025-12-10')),
  membership(C01, U18, 'member',     new Date('2026-01-05')),
  membership(C01, U19, 'member',     new Date('2026-01-15')),
  membership(C01, U22, 'member',     new Date('2026-02-01')),
  membership(C01, U13, 'member',     new Date('2026-03-10')),

  // C02 – Language & Culture Hub (founder: U01)
  membership(C02, U01, 'founder',    new Date('2025-11-20')),
  membership(C02, U19, 'moderator',  new Date('2025-11-22')),
  membership(C02, U07, 'member',     new Date('2025-11-25')),
  membership(C02, U15, 'member',     new Date('2025-12-01')),
  membership(C02, U12, 'member',     new Date('2025-12-08')),
  membership(C02, U23, 'member',     new Date('2026-01-10')),
  membership(C02, U14, 'member',     new Date('2026-01-20')),
  membership(C02, U02, 'member',     new Date('2026-02-05')),
  membership(C02, U06, 'member',     new Date('2026-03-01')),

  // C03 – Creative Arts Collective (founder: U11)
  membership(C03, U11, 'founder',    new Date('2025-12-01')),
  membership(C03, U06, 'moderator',  new Date('2025-12-03')),
  membership(C03, U03, 'member',     new Date('2025-12-05')),
  membership(C03, U02, 'member',     new Date('2025-12-10')),
  membership(C03, U22, 'member',     new Date('2025-12-15')),
  membership(C03, U05, 'member',     new Date('2026-01-05')),
  membership(C03, U15, 'member',     new Date('2026-01-12')),
  membership(C03, U20, 'member',     new Date('2026-02-01')),
  membership(C03, U23, 'member',     new Date('2026-02-20')),
  membership(C03, U18, 'member',     new Date('2026-03-05')),

  // C04 – Wellness & Mindful Living (founder: U09)
  membership(C04, U09, 'founder',    new Date('2025-12-10')),
  membership(C04, U21, 'moderator',  new Date('2025-12-12')),
  membership(C04, U04, 'member',     new Date('2025-12-15')),
  membership(C04, U17, 'member',     new Date('2025-12-20')),
  membership(C04, U05, 'member',     new Date('2026-01-08')),
  membership(C04, U11, 'member',     new Date('2026-01-15')),
  membership(C04, U14, 'member',     new Date('2026-02-01')),
  membership(C04, U23, 'member',     new Date('2026-02-10')),
  membership(C04, U08, 'member',     new Date('2026-03-15')),

  // C05 – Sustainability Network (founder: U13)
  membership(C05, U13, 'founder',    new Date('2025-12-15')),
  membership(C05, U23, 'moderator',  new Date('2025-12-17')),
  membership(C05, U07, 'member',     new Date('2025-12-20')),
  membership(C05, U14, 'member',     new Date('2026-01-05')),
  membership(C05, U05, 'member',     new Date('2026-01-10')),
  membership(C05, U09, 'member',     new Date('2026-01-20')),
  membership(C05, U15, 'member',     new Date('2026-02-05')),
  membership(C05, U06, 'member',     new Date('2026-03-01')),
];

db.community_memberships.insertMany(memberships);
print(`Inserted ${memberships.length} community memberships.`);

// ── community posts ───────────────────────────────────────────────────────────

function post(communityId, userId, title, body, tags, postType, date, upvotes, commentCount) {
  return {
    _id: new ObjectId(),
    community_id: communityId,
    user_id: userId,
    title,
    body,
    tags: tags || [],
    post_type: postType || 'post',
    is_pinned: false,
    upvote_count: upvotes || 0,
    comment_count: commentCount || 0,
    created_at: date,
    updated_at: date,
  };
}

const posts = [

  // ─── C01: Istanbul Tech Exchange ─────────────────────────────────────────

  post(C01, U00,
    'Welcome to Istanbul Tech Exchange! 🛠️',
    `Hey everyone! I'm Mehmet, and I started this community because I kept meeting talented developers in Istanbul who had no good place to swap skills outside of paid courses or LinkedIn.\n\nHere's how it works:\n- **Post what you're good at** and willing to share\n- **Post what you're looking for** — a code review, a debugging session, a tech talk\n- Match with someone and exchange time credits\n\nLet's make Istanbul's tech scene a little more collaborative. Introduce yourself below!`,
    [{ label: 'Introduction', entityId: '' }],
    'announcement', new Date('2025-11-15'), 18, 12),

  post(C01, U16,
    'Intro: Frontend dev looking for DevOps and backend exchange',
    `Hi! I'm Bora, a React/Next.js developer. I'm strong on the frontend — component architecture, performance, accessibility — but I've always been weak on the infrastructure side.\n\nLooking to:\n- Learn Docker, CI/CD, and basic Linux server setup\n- Exchange: 2h React mentoring for 2h DevOps guidance\n\nIs anyone interested? Happy to do async reviews too (I\'ll review your component code if you review my Dockerfile).`,
    [{ label: 'Skill Exchange', entityId: '' }, { label: 'Frontend', entityId: '' }],
    'post', new Date('2025-11-18'), 9, 7),

  post(C01, U10,
    'Python + Data science study group — who\'s in?',
    `I've been thinking about organizing a small monthly study group for data scientists and analysts in the community. Format I'm imagining:\n\n- 2 hours, online (Google Meet)\n- One person picks a dataset and a question\n- We all explore it together: cleaning, analysis, visualization\n- We compare approaches and learn from each other\n\nNot a course, not a tutorial — just collaborative exploration. Is there interest? Drop a comment if you'd join.`,
    [{ label: 'Data Science', entityId: '' }, { label: 'Python', entityId: 'Q28865' }],
    'post', new Date('2025-12-05'), 13, 9),

  post(C01, U07,
    'Asking for help: Scraping academic databases ethically',
    `I'm a researcher and I'm trying to collect data from a few academic databases (nothing behind paywalls — only open access material). I'm running into rate limits and getting 403s on some sites.\n\nI know how to write Python scrapers but I'm not confident about:\n- Ethical scraping practices and robots.txt\n- Using Selenium vs. requests/BeautifulSoup for JS-heavy pages\n- How to handle pagination and delays\n\nAnyone with web scraping experience willing to do a 1–2h exchange? I can offer academic research and writing support in return.`,
    [{ label: 'Web Scraping', entityId: '' }, { label: 'Python', entityId: 'Q28865' }],
    'post', new Date('2026-01-10'), 7, 5),

  post(C01, U03,
    'Design systems talk recap + resources I mentioned',
    `Thank you to everyone who joined the design systems session last week! We had 8 people which was a great size for discussion.\n\nHere are the resources I promised:\n- [Figma Variables guide](https://figma.com)\n- Atomic Design methodology (Brad Frost)\n- Radix UI — the component library I showed\n- Storybook — for documenting components\n\n**Key takeaways from our discussion:**\n1. Start small: don't design the whole system before you have any product\n2. Tokens first (colors, spacing, type scale) before components\n3. Document decisions as you make them — or you'll forget\n\nWant to continue the conversation? Let's schedule a part 2.`,
    [{ label: 'Design Systems', entityId: '' }, { label: 'UI Design', entityId: '' }],
    'post', new Date('2026-02-15'), 11, 4),

  post(C01, U22,
    'Anyone working on AI music generation? Let\'s talk.',
    `I've been experimenting with AI tools for music (Suno, Udio, and some open-source models). Coming from a production background, I have mixed feelings — some of this stuff is genuinely impressive, some is overhyped.\n\nI'm curious about:\n- How people in the tech community are thinking about the ethics and copyright issues\n- Anyone building tools in this space (fine-tuning, inference, UX)\n- Potential for interesting art projects combining human + AI composition\n\nNot starting a debate — just curious about this intersection of tech and music. Anyone working in or around this?`,
    [{ label: 'AI', entityId: 'Q11660' }, { label: 'Music', entityId: 'Q638' }],
    'post', new Date('2026-03-20'), 8, 6),

  post(C01, U18,
    'Looking to barter: architecture + design knowledge for coding help',
    `I\'m an architect by training but I\'ve been building a small web tool to help people visualize apartment layouts. The frontend is a mess and I need help.\n\nWhat I'm stuck on:\n- React state management across components (I've made it too complicated)\n- Canvas rendering of floor plans\n- File upload and handling for DXF files\n\nIn exchange, I can offer:\n- Interior design consulting\n- Reading architectural plans and renders\n- Structural logic for space planning\n\nAnyone who enjoys unusual problems, I think this would be a fun collaboration.`,
    [{ label: 'Architecture', entityId: 'Q12271' }, { label: 'Web Development', entityId: '' }],
    'post', new Date('2026-04-10'), 6, 3),

  post(C01, U13,
    'Tech for sustainability: anyone building environmental tools?',
    `I\'m an environmental engineer interested in using tech to accelerate sustainability work. I build simple scripts and dashboards but I\'m not a strong developer.\n\nI\'m curious if anyone here is:\n- Building apps or tools with environmental applications\n- Interested in data visualization for climate/environmental data\n- Working on anything in the circular economy, energy, or food systems\n\nI'd love to collaborate or just compare notes. Happy to bring the domain knowledge if you bring the code.`,
    [{ label: 'Sustainability', entityId: 'Q216497' }, { label: 'Technology', entityId: 'Q11016' }],
    'post', new Date('2026-04-25'), 9, 4),

  // ─── C02: Language & Culture Hub ─────────────────────────────────────────

  post(C02, U01,
    'Welcome to the Language & Culture Hub!',
    `Merhaba everyone! I started this community because Istanbul is one of the most multilingual cities in the world — and yet we rarely exchange our language skills with each other.\n\nThis is a space for:\n- Language learners at every level (A1 to C2)\n- Native speakers who want to teach\n- Translators, interpreters, and writers\n- Anyone who loves the way language shapes culture\n\nOur first language exchange event is coming up — details soon. Introduce yourself and tell us: what languages do you speak, and what are you trying to learn?`,
    [{ label: 'Introduction', entityId: '' }, { label: 'Language Exchange', entityId: '' }],
    'announcement', new Date('2025-11-20'), 15, 11),

  post(C02, U19,
    'Translation challenge #1: "Hüzün" in Istanbul',
    `Hüzün is a Turkish word that doesn't translate cleanly into English (or most languages). Orhan Pamuk devoted pages to it in "Istanbul: Memories and the City."\n\nChallenge: How would you translate the following sentence, preserving the *feeling* as much as the meaning?\n\n> "Boğaz'ı seyrederken içime bir hüzün çöktü — hem İstanbul'a hem de geçmişe olan özlemden gelen bir hüzün."\n\nPost your translations below in any language! The goal isn\'t perfection — it\'s discussion about what gets lost and gained in translation.`,
    [{ label: 'Translation', entityId: 'Q7553' }, { label: 'Turkish Literature', entityId: '' }],
    'post', new Date('2025-12-03'), 12, 10),

  post(C02, U15,
    'How to write emails in Turkish without sounding too formal (or too casual)',
    `This comes up a lot when I\'m editing for people who write professionally in Turkish. The register between formal and casual is a minefield.\n\nA few things I've noticed:\n- "Saygılarımla" feels very cold in most modern workplaces — "İyi çalışmalar" is often better\n- "Rica ederim" vs "ne gerek var ki" — huge difference in relationship signaling\n- Starting with "Selam" is fine with people you know, not advisable to a professor or manager\n\nI\'ll share a short guide I wrote below. Corrections and additions welcome — this is based on Istanbul professional culture, might differ elsewhere.`,
    [{ label: 'Turkish Language', entityId: 'Q256' }, { label: 'Professional Writing', entityId: '' }],
    'post', new Date('2026-01-15'), 14, 8),

  post(C02, U07,
    'English academic writing workshop recap',
    `Thanks to Neslihan for guest-hosting our writing session last month! We had 6 participants working on thesis and paper drafts.\n\nTopics we covered:\n- **Hedging language** in academic writing ("suggests," "appears to," "may indicate")\n- How to cite without over-quoting\n- Transitions between sections\n- Signposting your argument\n\nNeslihan shared her annotated examples — I\'ll post them in the resources thread.\n\nNext session: we\'re doing cover letters and research statements for people applying to programs abroad. Who's interested?`,
    [{ label: 'Academic Writing', entityId: '' }, { label: 'English Language', entityId: 'Q1860' }],
    'post', new Date('2026-02-20'), 7, 5),

  post(C02, U02,
    'Musician seeking music terminology translator for Turkish↔English',
    `I\'m writing liner notes for a small release and I\'m struggling with music terminology. There are some terms in Turkish that have no clean English equivalent (and vice versa).\n\nSpecifically:\n- "Makam" — I know the technical explanation but how do you convey it briefly for a non-specialist?\n- "Aksak" rhythm — how do you write about 7/8 and 9/8 without losing people?\n\nI\'d love to do a 1-hour exchange: I help you understand Turkish music concepts in exchange for help writing about them clearly in English.`,
    [{ label: 'Music', entityId: 'Q638' }, { label: 'Translation', entityId: 'Q7553' }],
    'post', new Date('2026-03-10'), 8, 4),

  post(C02, U06,
    'Photographing Istanbul through different language lenses — photo + essay project',
    `I'm starting a personal project: photographing Istanbul neighborhoods and pairing each image with a short essay written first in Turkish, then translated to English, then to another language.\n\nI'm looking for:\n- Writers in Turkish and English (and any other language)\n- Translators for the final versions\n- Feedback on how cultural nuance does (and doesn't) survive translation\n\nThe final result will be a small zine. Contributors get credit and a physical copy. No money involved — pure creative exchange.`,
    [{ label: 'Photography', entityId: 'Q11633' }, { label: 'Writing', entityId: '' }],
    'post', new Date('2026-04-08'), 10, 6),

  // ─── C03: Creative Arts Collective ───────────────────────────────────────

  post(C03, U11,
    'This community exists because art shouldn\'t be gatekept.',
    `I started this collective after one too many experiences of feeling like I "wasn\'t good enough" to participate in creative spaces in Istanbul. As if art requires a degree, or gallery shows, or a certain aesthetic.\n\nHere, the only rule is: make things and share them.\n\nWe\'ll do:\n- Monthly critique circles (constructive, not competitive)\n- Photography walks\n- Music jams\n- Writing workshops\n- Whatever else people want to do\n\nBring your sketchbooks, your unfinished projects, your questions. Let\'s make things together.`,
    [{ label: 'Community', entityId: '' }, { label: 'Art', entityId: 'Q735' }],
    'announcement', new Date('2025-12-01'), 22, 14),

  post(C03, U06,
    'January Photography Walk: Balat & Fener',
    `Join me Sunday, January 19th for a neighborhood walk through Balat and Fener. These are two of the most photogenic (and underrated) neighborhoods in Istanbul — historical Greek and Jewish communities with incredible architecture and street life.\n\n**Details:**\n- Meet at Balat ferry stop, 10:00 AM\n- Walk for 2–3 hours (loose, go at your own pace)\n- Any camera welcome (phone is fine)\n- Shared folder for uploading your favorites afterward\n- Optional: coffee and editing session at Mandabatmaz afterward\n\nAll skill levels welcome. This is a seeing walk, not a technique class — though I\'ll share tips if anyone wants them.`,
    [{ label: 'Photography Walk', entityId: '' }, { label: 'Istanbul', entityId: 'Q406' }],
    'post', new Date('2026-01-12'), 19, 11),

  post(C03, U22,
    'Sharing my EP — feedback welcome, be honest',
    `I released a short EP last month — 4 tracks, lo-fi hip-hop with some ambient elements. I\'m not looking for hype, I\'m looking for honest feedback.\n\nSpecifically:\n- Does the mix sound balanced on different devices? (I have monitor envy)\n- Track 3 has an ending I\'m not happy with — does it feel abrupt?\n- Is there a track that stands out as noticeably weaker?\n\nI\'ll share the SoundCloud link in the comments. Listening time: ~12 minutes. If you leave feedback here, I\'ll give you the same on whatever you\'re working on.`,
    [{ label: 'Music Production', entityId: 'Q830953' }, { label: 'Feedback', entityId: '' }],
    'post', new Date('2026-02-05'), 16, 13),

  post(C03, U03,
    'Rebranding a community tool: looking for collaborative design',
    `I\'m redesigning the visual identity for a small NGO that runs community workshops in Balat. They do it on zero budget and I offered to do the design work as a time-bank exchange.\n\nI\'d love a collaborator who:\n- Has ideas about accessible, warm, community-oriented visual design\n- Can push back on my decisions (I tend to go too minimal)\n- Is interested in doing this as their community portfolio piece\n\nNo time-credit exchange needed for this — but I\'ll credit you as co-designer and you can use the work in your portfolio.`,
    [{ label: 'Design', entityId: '' }, { label: 'NGO', entityId: '' }],
    'post', new Date('2026-03-01'), 8, 5),

  post(C03, U05,
    'Food + art crossover: anyone interested in a dinner-art event?',
    `I've been thinking about organizing something a bit unusual: a dinner where the food IS the art.\n\nIdea: we cook a menu inspired by a specific artwork, artist, or art movement, and discuss it while eating. Past sessions I\'ve imagined:\n- A meal inspired by İnci Eviner\'s textiles\n- A "Futurist dinner" (the Futurists had insane ideas about food as manifesto)\n- A meal that reconstructs a historical Ottoman feast\n\nI\'d do the cooking (for 6–8 people), others would lead the discussion or bring related creative work. Location: my kitchen in Kadıköy.\n\nWho\'s interested?`,
    [{ label: 'Food', entityId: '' }, { label: 'Art', entityId: 'Q735' }, { label: 'Community Event', entityId: '' }],
    'post', new Date('2026-04-05'), 14, 9),

  post(C03, U15,
    'Writing critique group — forming now for May',
    `I\'m forming a small writing critique group for the month of May. Fiction, essays, or poetry — all genres welcome.\n\n**Format:**\n- 5 participants maximum\n- Everyone submits 1–3 pages per session\n- We read each other\'s work before meeting\n- 90-minute online session every 2 weeks\n\n**Rules:**\n- Critique the work, not the writer\n- Specific feedback only (no "I liked it" without explanation)\n- Come having read everything, even if you didn\'t enjoy it\n\nDM me or comment here if you\'d like to join. First session: May 10th.`,
    [{ label: 'Writing', entityId: '' }, { label: 'Creative Writing', entityId: '' }],
    'post', new Date('2026-04-28'), 9, 6),

  // ─── C04: Wellness & Mindful Living ──────────────────────────────────────

  post(C04, U09,
    'Welcome — and why I started this community',
    `I started this community after realizing that most "wellness" content online is either selling something or unrealistically optimistic.\n\nI wanted a space for real conversations — about burnout, about rest, about what actually works and what doesn\'t for different bodies and minds.\n\nAs a yoga teacher, I get asked a lot "is yoga enough?" No — yoga is one tool. Wellness is a practice made of many things, and everyone\'s toolkit looks different.\n\nHere you\'ll find:\n- Skill exchanges (yoga, meditation, cooking, first aid)\n- Honest discussion about mental and physical health\n- Events and group practices\n\nWelcome to the hive. 🐝`,
    [{ label: 'Community', entityId: '' }, { label: 'Wellness', entityId: '' }],
    'announcement', new Date('2025-12-10'), 21, 13),

  post(C04, U21,
    'Managing anxiety in a high-stress city: what actually helps',
    `I've worked as a therapist in Istanbul for 7 years. The number one thing I hear from clients: "Everyone around me seems fine and I\'m struggling to cope."\n\nYou\'re not the only one. Istanbul is objectively one of the most stressful cities to live in — traffic, noise, cost of living, uncertainty.\n\nA few things that research and clinical experience suggest actually help (not a substitute for therapy):\n1. **Social connection** — even small, low-stakes interactions\n2. **Predictable routines** — especially sleep\n3. **Physical movement** — doesn\'t have to be intense\n4. **Limiting news and social media** — especially in the morning\n\nWhat works for you? Let\'s share strategies.`,
    [{ label: 'Mental Health', entityId: '' }, { label: 'Anxiety', entityId: '' }],
    'post', new Date('2026-01-20'), 24, 17),

  post(C04, U17,
    'Why everyone should know basic first aid — and how to learn it here',
    `I\'m an ICU nurse and I\'m continually surprised by how many people have never had first aid training — and how much it matters.\n\nThe statistics are stark: early CPR can triple survival rates for cardiac arrest. The window is 4 minutes. The ambulance won\'t be there in 4 minutes.\n\nI offer first aid workshops through the platform (I\'ve already run two through this community). Upcoming dates:\n- May 20th, 14:00 — Kartal, 2h session\n- June 7th, 10:00 — Taksim area, 2h session\n\nBooking through the service listing on my profile. Time credits accepted.\n\nAlso happy to answer any first aid questions in this thread.`,
    [{ label: 'First Aid', entityId: 'Q1374975' }, { label: 'Health Education', entityId: '' }],
    'post', new Date('2026-03-10'), 17, 8),

  post(C04, U04,
    'Fitness myth-busting: what the fitness industry gets wrong',
    `I\'ve been a personal trainer for 6 years and there are things I tell every new client that contradict what they\'ve seen online. A few:\n\n**Myth: You need to feel sore to have trained well.**\nFalse. Soreness = damage, not progress. Progressive overload is the goal, not punishment.\n\n**Myth: More cardio = faster fat loss.**\nNot how it works. Calorie deficit is what drives fat loss. Cardio is one tool. Strength training preserves muscle mass during deficit.\n\n**Myth: You need to train 6 days a week.**\nMost people see great results with 3 solid sessions. Recovery is when adaptation happens.\n\nWhat fitness myths are you most tired of? Let\'s bust them here.`,
    [{ label: 'Fitness', entityId: '' }, { label: 'Exercise Science', entityId: '' }],
    'post', new Date('2026-02-28'), 20, 12),

  post(C04, U05,
    'Easy anti-inflammatory meal prep guide (+ what I cook on Sundays)',
    `Someone asked me to share my Sunday meal prep routine. It\'s based on anti-inflammatory principles — not because I\'m following a specific diet, but because I feel better when I eat this way.\n\n**My Sunday haul (for 5 days):**\n- Batch of freekeh (more nutrients than rice, nuttier)\n- Roasted seasonal vegetables (whatever\'s cheap at the Kadıköy market)\n- A big pot of lentil soup (cooks while I do other things)\n- Chia puddings for breakfast\n- Tahini sauce base (use on everything)\n\nAnti-inflammatory basics:\n- Olive oil, walnuts, fatty fish\n- Turmeric, ginger, cinnamon\n- Leafy greens, legumes\n- Less processed sugar, less seed oils\n\nWant the recipes? Drop a comment.`,
    [{ label: 'Nutrition', entityId: '' }, { label: 'Meal Prep', entityId: '' }, { label: 'Cooking', entityId: '' }],
    'post', new Date('2026-04-12'), 18, 10),

  // ─── C05: Sustainability Network ─────────────────────────────────────────

  post(C05, U13,
    'Why I started this community — and what I need from you',
    `I started the Sustainability Network because I kept having the same conversation in silos: with engineers about emissions, with activists about policy, with chefs about food waste, with tech people about green apps.\n\nNo one was talking across these domains. This community is the attempt to fix that.\n\nWhat I need:\n- People with expertise to share (sustainability, environmental science, urban planning, tech)\n- People with questions to ask (how do I reduce my footprint, how do I find green alternatives)\n- Organizations looking for collaborators on sustainability projects\n\nIf you\'re here, you\'re already the kind of person we need. Welcome.`,
    [{ label: 'Community', entityId: '' }, { label: 'Sustainability', entityId: 'Q216497' }],
    'announcement', new Date('2025-12-15'), 14, 10),

  post(C05, U23,
    'Urban gardening in Istanbul — what actually works in apartments',
    `I\'ve been growing food on my 8m² balcony for 3 years. Here\'s what I\'ve learned:\n\n**What works:**\n- Cherry tomatoes (south-facing is essential)\n- Herbs (mint, basil, parsley — almost impossible to kill)\n- Chili peppers (very productive, beautiful plants)\n- Lettuce and arugula (great in cooler months)\n\n**What doesn\'t (in my experience):**\n- Full-size tomatoes (need more root space)\n- Cucumbers (want to climb, make a mess)\n- Root vegetables in containers (carrots, potatoes — not worth it)\n\n**Istanbul-specific:**\n- Summer heat is brutal — shade cloth from July onwards\n- Wind on upper floors will knock things over constantly\n- The haze reduces light more than you\'d expect\n\nHappy to help anyone get started!`,
    [{ label: 'Urban Gardening', entityId: '' }, { label: 'Food Sovereignty', entityId: '' }],
    'post', new Date('2026-01-25'), 16, 9),

  post(C05, U07,
    'Reading group: "The Uninhabitable Earth" — discussion starts Feb 1',
    `I\'m leading a reading group on David Wallace-Wells\' "The Uninhabitable Earth" (Yaşanmaz Dünya in Turkish translation).\n\nThis is a challenging book — it doesn\'t soften the reality of climate change. The goal of the reading group is to:\n1. Understand the science clearly\n2. Discuss the psychological and social dimensions\n3. Connect the analysis to what we can actually do\n\nFormat:\n- 3 sessions, 90 min each (online)\n- Feb 1, Feb 15, March 1\n- ~80 pages per session\n\nDM me or comment to join. The book is available in Turkish and English — both versions work.`,
    [{ label: 'Climate Change', entityId: 'Q7942' }, { label: 'Reading Group', entityId: '' }],
    'post', new Date('2026-01-22'), 11, 7),

  post(C05, U14,
    'Why I switched my restaurant menu to 80% local sourcing (and what it cost)',
    `I run pop-up dinners in Istanbul and I made the decision last year to source 80%+ of ingredients from within 150km of the city.\n\nWhat motivated it:\n- The flavor difference is real — fresh, seasonal produce tastes dramatically better\n- The carbon math actually works out significantly in your favor\n- You build relationships with producers that make your work better\n\nWhat it cost:\n- More time sourcing and planning menus (seasonal means flexible)\n- Higher costs for some items (offset by less waste)\n- Explaining to guests why they can\'t always get what they expect\n\nHappy to share my supplier list for Istanbul-region farms if anyone is interested (for home cooks too, not just restaurants).`,
    [{ label: 'Local Food', entityId: '' }, { label: 'Sustainable Eating', entityId: '' }],
    'post', new Date('2026-03-05'), 13, 8),

  post(C05, U05,
    'Zero-waste cooking challenge: 1 week, 1 chicken, no waste',
    `I want to challenge the community: use ONE chicken to feed a household for a week with zero waste.\n\n**How I do it:**\n- Day 1: Roast the chicken, serve with roasted veg\n- Day 2: Chicken salad + stock from bones (simmer overnight)\n- Day 3: Chicken soup from stock\n- Day 4: Fried rice with remaining meat scraps\n- Day 5: Stock becomes the base for a bean stew\n- The fat rendered from roasting becomes cooking fat for the rest of the week\n- Carrot tops, onion skins, and herb stems all go into the stock\n\nTotal food waste: basically zero.\n\nWho wants to try it this week? Post your results!`,
    [{ label: 'Zero Waste', entityId: '' }, { label: 'Cooking', entityId: '' }],
    'post', new Date('2026-04-20'), 15, 11),
];

db.community_posts.insertMany(posts);
print(`Inserted ${posts.length} community posts.`);
