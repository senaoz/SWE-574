/* global use, db */
// Seed: Insert 36 services (offers + needs) spread across Nov 2025 → May 2026.
// All services have images, rich descriptions, and realistic tags.
// Run AFTER playground-5 (profiles).

use('hive_platform');

// ── helpers ──────────────────────────────────────────────────────────────────

function point(lat, lon, address) {
  const g = { type: 'Point', coordinates: [lon, lat] };
  if (address) g.address = address;
  return g;
}

function tag(label, entityId) {
  return { label, entityId: entityId || '', description: null, aliases: [] };
}

function svc(id, fields) {
  return {
    _id: ObjectId(id),
    user_id: fields.user_id,
    title: fields.title,
    description: fields.description,
    category: fields.category,
    tags: fields.tags,
    estimated_duration: fields.estimated_duration,
    location: fields.location,
    is_remote: fields.is_remote || false,
    service_type: fields.service_type,
    status: fields.status,
    max_participants: fields.max_participants || 1,
    scheduling_type: fields.scheduling_type || 'open',
    specific_date: fields.specific_date || null,
    specific_time: fields.specific_time || null,
    recurring_pattern: fields.recurring_pattern || null,
    open_availability: fields.open_availability || null,
    image_urls: fields.image_urls,
    matched_user_ids: fields.matched_user_ids || [],
    receiver_confirmed_ids: fields.receiver_confirmed_ids || [],
    completed_at: fields.completed_at || null,
    created_at: fields.created_at,
    updated_at: fields.updated_at || fields.created_at,
  };
}

// ── user aliases ──────────────────────────────────────────────────────────────

const U00 = ObjectId('68f67e78cc0dce66e7dede2e'); // Mehmet   – dev
const U01 = ObjectId('68f67e78cc0dce66e7dede2f'); // Ayşe     – language
const U02 = ObjectId('68f67e78cc0dce66e7dede30'); // Can      – guitar
const U03 = ObjectId('68f67e78cc0dce66e7dede31'); // Zeynep   – design
const U04 = ObjectId('68f67e78cc0dce66e7dede32'); // Emre     – fitness
const U05 = ObjectId('68f67f9c3966e4ce6ebcd0d8'); // Selin    – cooking
const U06 = ObjectId('6910493fbd2b553c40682a22'); // Ahmet    – photography
const U07 = ObjectId('699c495b8a3c27030ad95179'); // Fatma    – academic
const U08 = ObjectId('699c819c8a3c27030ad9517a'); // Burak    – woodwork
const U09 = ObjectId('699d5d8ed41dfdf904cba681'); // Elif     – yoga
const U10 = ObjectId('699d9901d41dfdf904cba682'); // Tolga    – data
const U11 = ObjectId('699e0effb25538f8efb419b1'); // Merve    – art
const U12 = ObjectId('699e1ab5b25538f8efb419b6'); // Serkan   – math
const U13 = ObjectId('69a07b2db25538f8efb419b7'); // Dilan    – environment
const U14 = ObjectId('69a33be549f11e4548daecbf'); // Mert     – chef
const U15 = ObjectId('69a3faa349f11e4548daecc4'); // Neslihan – writing
const U16 = ObjectId('69ac140f0737d99885fb51f8'); // Bora     – frontend
const U17 = ObjectId('69ad42dd0737d99885fb5238'); // Gamze    – nurse
const U18 = ObjectId('69ae20b916ba13f0b24017dd'); // Kerem    – architect
const U19 = ObjectId('69aeb72ae0fb78b01b102998'); // İpek     – translator
const U20 = ObjectId('69aeea87eeccfa2e45b4c1b9'); // Cem      – coffee
const U21 = ObjectId('69aeeb81eeccfa2e45b4c1bd'); // Yasemin  – therapy
const U22 = ObjectId('69bc430bcf8d0686f0a691f0'); // Kaan     – music prod
const U23 = ObjectId('69c44998643d8a485ec2e5c0'); // Defne    – plants

// ── Kadıköy, Beşiktaş, Şişli, Beyoğlu, Fatih, Üsküdar… ──────────────────────

const LOC_KADIKOY   = point(40.9909, 29.0308, 'Kadıköy, Istanbul');
const LOC_BESIKTAS  = point(41.0422, 29.0083, 'Beşiktaş, Istanbul');
const LOC_SISLI     = point(41.0602, 28.9877, 'Şişli, Istanbul');
const LOC_BEYOGLU   = point(41.0351, 28.9778, 'Beyoğlu, Istanbul');
const LOC_FATIH     = point(41.0186, 28.9397, 'Fatih, Istanbul');
const LOC_USKUDAR   = point(41.0228, 29.0156, 'Üsküdar, Istanbul');
const LOC_MALTEPE   = point(40.9300, 29.1300, 'Maltepe, Istanbul');
const LOC_ATASEHIR  = point(40.9913, 29.1148, 'Ataşehir, Istanbul');
const LOC_LEVENT    = point(41.0812, 29.0117, 'Levent, Istanbul');
const LOC_BAKIRKOY  = point(40.9824, 28.8734, 'Bakırköy, Istanbul');
const LOC_REMOTE    = point(41.0082, 28.9784, 'Remote / Online');

// ── services ─────────────────────────────────────────────────────────────────

const services = [

  // ─── NOVEMBER 2025 — all completed ────────────────────────────────────────

  svc('665000000000000000000001', {
    user_id: U02, service_type: 'offer', status: 'completed',
    title: 'Beginner Guitar Lessons — Fingerstyle & Chords',
    description: `I'll teach you guitar from absolute zero. No experience needed — just bring curiosity and 10 fingers.\n\n## What we'll cover\n- Proper posture and hand position\n- Basic open chords (G, C, D, Em, Am)\n- Fingerpicking patterns for folk and pop\n- Your first complete song by the end of session 2\n\n## About me\nI've been teaching guitar for 8 years. My students range from 10-year-olds to retirees. I adapt my pace to you.\n\n## Logistics\n- My studio in Şişli (guitar provided, or bring your own)\n- Flexible timing — mornings or evenings work\n- Each session is 2 hours with a short break\n\n*Completed November 2025 — thank you to my fantastic students!*`,
    category: 'Music',
    tags: [tag('Guitar'), tag('Music Lessons'), tag('Beginner')],
    estimated_duration: 2,
    location: LOC_SISLI,
    max_participants: 2,
    image_urls: [
      'https://picsum.photos/seed/svc001a/800/600',
      'https://picsum.photos/seed/svc001b/800/600',
      'https://picsum.photos/seed/svc001c/800/600',
    ],
    completed_at: new Date('2025-11-28'),
    created_at: new Date('2025-11-07'),
  }),

  svc('665000000000000000000002', {
    user_id: U00, service_type: 'offer', status: 'completed',
    title: 'Python Debugging Help — Code Review & Pair Programming',
    description: `Stuck on a Python bug? I'll help you find it and understand why it happened.\n\n## What I can help with\n- Debugging scripts (pandas, NumPy, FastAPI, Django, Flask)\n- Code review — I'll explain what's wrong and how to fix it properly\n- Refactoring messy code into clean, maintainable patterns\n- Setting up virtual environments and package management\n\n## Session format\n- 1.5-hour video call (Google Meet or Discord)\n- You share your screen, we walk through the code together\n- I'll share a written summary of findings and suggestions after\n\n## My background\nI have 6 years of professional Python experience. I've mentored junior developers at two startups.\n\n> Session completed Nov 14, 2025 — happy to help again anytime!`,
    category: 'Technology',
    tags: [tag('Python', 'Q28865'), tag('Programming'), tag('Debugging')],
    estimated_duration: 1.5,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc002a/800/600',
      'https://picsum.photos/seed/svc002b/800/600',
    ],
    completed_at: new Date('2025-11-14'),
    created_at: new Date('2025-11-08'),
  }),

  svc('665000000000000000000003', {
    user_id: U01, service_type: 'offer', status: 'completed',
    title: 'Turkish Conversation Practice for B1–B2 Learners',
    description: `Ready to stop translating in your head and actually think in Turkish? Let's practice together.\n\n## Format\n- 2-hour conversation session (no grammar drills — real dialogue)\n- We pick a topic you care about (food, travel, culture, work)\n- I correct naturally, without interrupting your flow\n- Optional: I'll share vocabulary notes and a short recording afterward\n\n## Who this is for\n- Expats living in Istanbul who want to connect with locals\n- Students who've taken formal classes but need speaking practice\n- Heritage speakers who want to improve fluency\n\n## About me\nI'm a CELTA-certified teacher with 5 years of experience. I speak Turkish natively and English fluently.\n\n*Completed in December 2025 — both sessions were wonderful!*`,
    category: 'Education',
    tags: [tag('Turkish Language', 'Q256'), tag('Language Learning'), tag('Conversation')],
    estimated_duration: 2,
    location: LOC_BESIKTAS,
    max_participants: 2,
    image_urls: [
      'https://picsum.photos/seed/svc003a/800/600',
      'https://picsum.photos/seed/svc003b/800/600',
      'https://picsum.photos/seed/svc003c/800/600',
    ],
    completed_at: new Date('2025-11-22'),
    created_at: new Date('2025-11-10'),
  }),

  svc('665000000000000000000004', {
    user_id: U03, service_type: 'offer', status: 'completed',
    title: 'Logo Design & Brand Identity for Small Businesses',
    description: `Your logo is the face of your brand. Let me help you make a great first impression.\n\n## What you get\n- Discovery call (30 min) to understand your business and vision\n- 3 logo concepts in different styles\n- 2 rounds of revisions on your chosen concept\n- Final delivery in SVG, PNG, and PDF formats\n- Mini brand guide (colors, fonts, usage rules)\n\n## My process\nI start with research, move to sketches, then digital. I'll share my work-in-progress so there are no surprises.\n\n## Timeline\nTypically 3 hours of active design time spread over 1 week.\n\n## Portfolio\nI've designed identities for cafes, tech startups, yoga studios, and NGOs.\n\n*Completed November 2025 — client received full brand kit.*`,
    category: 'Design',
    tags: [tag('Logo Design'), tag('Graphic Design', 'Q186030'), tag('Branding')],
    estimated_duration: 3,
    location: LOC_BEYOGLU,
    is_remote: true,
    max_participants: 2,
    image_urls: [
      'https://picsum.photos/seed/svc004a/800/600',
      'https://picsum.photos/seed/svc004b/800/600',
      'https://picsum.photos/seed/svc004c/800/600',
    ],
    completed_at: new Date('2025-11-30'),
    created_at: new Date('2025-11-12'),
  }),

  svc('665000000000000000000005', {
    user_id: U04, service_type: 'offer', status: 'completed',
    title: 'Personal Training Session — Strength & Mobility',
    description: `One-on-one training tailored to your body, goals, and current fitness level.\n\n## Session structure\n- 15-min assessment (movement patterns, goals, limitations)\n- 60-min guided workout (strength, cardio, or mixed)\n- 15-min cool-down and mobility work\n\n## Where\n- My home gym in Üsküdar (well-equipped: barbell, dumbbells, cables)\n- Or your preferred park/outdoor space\n\n## Who this is for\n- Beginners who feel lost in the gym\n- Intermediate athletes hitting a plateau\n- Anyone recovering from an injury who needs a careful progression\n\n## My credentials\n- Certified personal trainer (ACE + ISSA)\n- Sports nutrition certificate\n- Former competitive swimmer\n\n*Completed in November 2025. Session went great!*`,
    category: 'Fitness',
    tags: [tag('Personal Training'), tag('Strength Training'), tag('Fitness')],
    estimated_duration: 1.5,
    location: LOC_USKUDAR,
    max_participants: 2,
    image_urls: [
      'https://picsum.photos/seed/svc005a/800/600',
      'https://picsum.photos/seed/svc005b/800/600',
    ],
    completed_at: new Date('2025-11-25'),
    created_at: new Date('2025-11-14'),
  }),

  svc('665000000000000000000006', {
    user_id: U08, service_type: 'need', status: 'completed',
    title: 'Help Needed: Moving Heavy Furniture (3rd Floor, No Elevator)',
    description: `I'm moving to a new apartment in Maltepe and need 2–3 strong hands to help carry furniture down three flights of stairs.\n\n## What needs moving\n- 1 large sofa (modular, can be disassembled)\n- 1 solid wood bookshelf (~30 kg)\n- 1 dining table + 4 chairs\n- Several boxes (already packed)\n\n## Details\n- Old apartment: 3rd floor, no elevator, wide staircase\n- New apartment: ground floor, easy access\n- Moving truck already arranged — just need loading help\n- Estimated time: 1.5–2 hours\n\n## What I offer in return\n- 2 time-credit hours for your help\n- Coffee, snacks, and cold drinks on site\n- Big thanks from me and my cats\n\n*Completed successfully — thank you so much!*`,
    category: 'Home',
    tags: [tag('Moving'), tag('Physical Help'), tag('Home Services')],
    estimated_duration: 2,
    location: LOC_MALTEPE,
    image_urls: [
      'https://picsum.photos/seed/svc006a/800/600',
      'https://picsum.photos/seed/svc006b/800/600',
    ],
    completed_at: new Date('2025-11-29'),
    created_at: new Date('2025-11-20'),
  }),

  // ─── DECEMBER 2025 — all completed ────────────────────────────────────────

  svc('665000000000000000000007', {
    user_id: U05, service_type: 'offer', status: 'completed',
    title: 'Cooking Masterclass: Anatolian Meze Night',
    description: `Join me in my kitchen for an evening of making 8 classic Turkish meze dishes from scratch.\n\n## Menu\n- Haydari (garlic yogurt with herbs)\n- Muhammara (roasted red pepper & walnut)\n- Patlıcan ezme (smoked eggplant)\n- Arnavut ciğeri (Albanian-style liver — optional)\n- Dolma (stuffed grape leaves)\n- Acılı ezme (spicy tomato spread)\n- Tarama\n- Fresh bread baked in my clay oven\n\n## Format\n- 3 hours hands-on cooking together\n- All ingredients provided\n- We eat together at the end\n- You leave with printed recipes\n\n## Location\nMy apartment in Kadıköy. Max 2 participants for a cozy experience.\n\n*Completed December 12, 2025 — an amazing evening!*`,
    category: 'Cooking',
    tags: [tag('Turkish Cuisine', 'Q697947'), tag('Cooking Class'), tag('Meze')],
    estimated_duration: 3,
    location: LOC_KADIKOY,
    max_participants: 2,
    image_urls: [
      'https://picsum.photos/seed/svc007a/800/600',
      'https://picsum.photos/seed/svc007b/800/600',
      'https://picsum.photos/seed/svc007c/800/600',
    ],
    completed_at: new Date('2025-12-12'),
    created_at: new Date('2025-12-01'),
  }),

  svc('665000000000000000000008', {
    user_id: U06, service_type: 'offer', status: 'completed',
    title: 'Portrait Photography Session — Natural Light',
    description: `Whether it's for LinkedIn, social media, or just a keepsake — let me take portraits you'll be proud to share.\n\n## Session includes\n- 2-hour outdoor shoot (Gülhane Park, Cihangir streets, or your preferred spot)\n- 3 outfit changes\n- 40–60 edited images delivered via WeTransfer within 5 days\n- 10 high-resolution selects fully retouched\n\n## My style\nI prefer natural light and candid energy over stiff poses. I'll guide you to feel comfortable in front of the camera.\n\n## Equipment\nSony A7IV + 85mm f/1.4, 35mm f/1.8\n\n## Previous work\nCheck my Instagram @ahmetsahinphoto for examples.\n\n*Portrait session completed December 2025.*`,
    category: 'Photography',
    tags: [tag('Photography', 'Q11633'), tag('Portrait'), tag('Editing')],
    estimated_duration: 2,
    location: LOC_FATIH,
    max_participants: 2,
    image_urls: [
      'https://picsum.photos/seed/svc008a/800/600',
      'https://picsum.photos/seed/svc008b/800/600',
      'https://picsum.photos/seed/svc008c/800/600',
    ],
    completed_at: new Date('2025-12-18'),
    created_at: new Date('2025-12-05'),
  }),

  svc('665000000000000000000009', {
    user_id: U09, service_type: 'offer', status: 'completed',
    title: 'Hatha Yoga for Beginners — 4-Session Series',
    description: `A gentle introduction to yoga designed for people who\'ve never been on a mat before.\n\n## What we cover over 4 sessions\n1. Breath awareness, foundation poses, and sun salutations\n2. Standing poses for balance and strength\n3. Hip openers and forward folds\n4. Restorative poses and Yoga Nidra\n\n## Details\n- Each session: 90 minutes\n- Small group (max 2 people) for personal attention\n- Mats, blocks, and straps provided\n- Studio in Moda, 5 min walk from Kadıköy ferry\n\n## About me\nI'm RYT-200 certified with 5 years of teaching experience. My approach is alignment-focused and trauma-informed.\n\n*All 4 sessions completed in December 2025 — students are now practicing independently!*`,
    category: 'Fitness',
    tags: [tag('Yoga', 'Q8162'), tag('Mindfulness'), tag('Beginner')],
    estimated_duration: 1.5,
    location: LOC_KADIKOY,
    max_participants: 2,
    image_urls: [
      'https://picsum.photos/seed/svc009a/800/600',
      'https://picsum.photos/seed/svc009b/800/600',
      'https://picsum.photos/seed/svc009c/800/600',
    ],
    completed_at: new Date('2025-12-28'),
    created_at: new Date('2025-12-06'),
  }),

  svc('66500000000000000000000a', {
    user_id: U10, service_type: 'offer', status: 'completed',
    title: 'Data Visualization with Python — Matplotlib & Plotly',
    description: `I'll teach you how to turn raw data into clear, professional charts and dashboards.\n\n## What you'll learn\n- Matplotlib fundamentals (line, bar, scatter, histograms)\n- Plotly for interactive charts\n- Seaborn for statistical visualizations\n- Building a mini Streamlit dashboard\n\n## Prerequisites\n- Basic Python (variables, loops, functions)\n- Pandas would help but is not required\n\n## Format\n- 2-hour online session via Google Meet\n- I'll share a Jupyter notebook for you to follow along\n- You leave with working code you can adapt immediately\n\n## Who this is for\nAnalysts, researchers, or students who want their data to tell a better story.\n\n*Session completed December 20, 2025.*`,
    category: 'Technology',
    tags: [tag('Data Visualization'), tag('Python', 'Q28865'), tag('Data Science')],
    estimated_duration: 2,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc010a/800/600',
      'https://picsum.photos/seed/svc010b/800/600',
    ],
    completed_at: new Date('2025-12-20'),
    created_at: new Date('2025-12-10'),
  }),

  svc('66500000000000000000000b', {
    user_id: U19, service_type: 'need', status: 'completed',
    title: 'Need Professional Turkish → English Translation (2,000 Words)',
    description: `I have a short story collection (2,000 words) in Turkish that I'd like translated into literary English for submission to an international anthology.\n\n## About the text\n- 3 short stories, each around 650–700 words\n- Contemporary literary fiction — not technical\n- The tone is reflective and sometimes poetic\n\n## What I need\n- Native or near-native English fluency\n- Sensitivity to literary voice (not just literal translation)\n- Delivery within 10 days\n- I'll provide a brief author's note to help you understand my voice\n\n## Credits\n- 3 time-credit hours for the full project\n\n*Translation completed and submitted — thank you so much!*`,
    category: 'Writing',
    tags: [tag('Translation', 'Q7553'), tag('Turkish'), tag('Literary')],
    estimated_duration: 3,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc011a/800/600',
      'https://picsum.photos/seed/svc011b/800/600',
    ],
    completed_at: new Date('2025-12-22'),
    created_at: new Date('2025-12-08'),
  }),

  svc('66500000000000000000000c', {
    user_id: U15, service_type: 'offer', status: 'completed',
    title: 'Academic Proofreading & Editing in English',
    description: `I'll make your academic writing clearer, more precise, and publication-ready.\n\n## What I do\n- Proofreading (spelling, grammar, punctuation)\n- Style editing (clarity, concision, academic register)\n- Citation consistency check (APA, MLA, Chicago)\n- Structural comments on flow and argument\n\n## Turnaround\n- Up to 5,000 words: 1 hour of my time, returned within 48 hours\n- I'll use Track Changes so you see every edit\n\n## My background\nI spent 10 years as an editor at a major academic publisher in Istanbul. I've worked across disciplines: social sciences, humanities, STEM.\n\n## Note\nI proofread and edit — I don't write the paper for you.\n\n*Completed December 2025.*`,
    category: 'Education',
    tags: [tag('Proofreading'), tag('Academic Writing'), tag('Editing')],
    estimated_duration: 1,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc012a/800/600',
      'https://picsum.photos/seed/svc012b/800/600',
    ],
    completed_at: new Date('2025-12-17'),
    created_at: new Date('2025-12-12'),
  }),

  // ─── JANUARY 2026 — all completed ─────────────────────────────────────────

  svc('66500000000000000000000d', {
    user_id: U11, service_type: 'offer', status: 'completed',
    title: 'Watercolor Painting for Beginners — 2-Hour Workshop',
    description: `Forget the white canvas fear — in 2 hours you'll finish a piece you're genuinely proud of.\n\n## What we'll paint\nA seasonal botanical scene: leaves, a flower, and a simple background wash.\n\n## What's included\n- All materials (professional watercolors, paper, brushes — yours to keep)\n- Step-by-step guidance from sketch to final touches\n- Theory: color mixing, wet-on-wet vs wet-on-dry\n- A printed cheat-sheet of color mixing basics\n\n## My studio\nCihangir, walking distance from Taksim. Small, cozy space — max 2 students.\n\n## About me\nI've shown work in three Istanbul galleries. I've been teaching beginners for 4 years and this is my favorite class to run.\n\n*Completed January 2026. Both students loved it!*`,
    category: 'Art',
    tags: [tag('Watercolor', 'Q22915256'), tag('Painting'), tag('Art Workshop')],
    estimated_duration: 2,
    location: LOC_BEYOGLU,
    image_urls: [
      'https://picsum.photos/seed/svc013a/800/600',
      'https://picsum.photos/seed/svc013b/800/600',
      'https://picsum.photos/seed/svc013c/800/600',
    ],
    completed_at: new Date('2026-01-15'),
    created_at: new Date('2026-01-03'),
  }),

  svc('66500000000000000000000e', {
    user_id: U12, service_type: 'offer', status: 'completed',
    title: 'Math & Physics Tutoring — YKS/SAT/University Level',
    description: `Let's make abstract concepts click. I teach math and physics using visual methods and real examples — no rote memorization.\n\n## I can help with\n- Calculus (limits, derivatives, integrals)\n- Linear algebra (vectors, matrices, eigenvalues)\n- Mechanics and thermodynamics\n- YKS preparation (Temel Matematik, Fizik)\n- SAT/ACT math\n\n## My approach\nI start with the concept, then show why it works, then apply it. Most students say \"why didn't anyone explain it like this before.\"\n\n## Format\n- 1.5 hours online or in person (Ataşehir)\n- I'll prepare a problem set tailored to your level\n- Recording available on request\n\n*Session completed January 2026.*`,
    category: 'Education',
    tags: [tag('Mathematics', 'Q395'), tag('Physics', 'Q413'), tag('Tutoring')],
    estimated_duration: 1.5,
    location: LOC_ATASEHIR,
    is_remote: true,
    max_participants: 2,
    image_urls: [
      'https://picsum.photos/seed/svc014a/800/600',
      'https://picsum.photos/seed/svc014b/800/600',
    ],
    completed_at: new Date('2026-01-20'),
    created_at: new Date('2026-01-05'),
  }),

  svc('66500000000000000000000f', {
    user_id: U17, service_type: 'offer', status: 'completed',
    title: 'First Aid & CPR Workshop — BLS Certified Curriculum',
    description: `In an emergency, the first 4 minutes are critical. Let me teach you what to do.\n\n## Topics covered\n- Recognizing life-threatening emergencies\n- Adult, child, and infant CPR technique\n- AED operation\n- Choking response (Heimlich)\n- Bleeding control and wound care\n- Shock and unconsciousness management\n\n## Format\n- 2 hours (theory + hands-on with a resuscitation mannequin)\n- In person only (mannequin needed!)\n- Kartal, easily accessible\n- Group size: 2–4 people (minimum 2)\n\n## Who I am\nICU nurse with 7 years of experience. I teach this curriculum to companies and community groups.\n\n*Completed January 22, 2026. All participants passed the skills check!*`,
    category: 'Health',
    tags: [tag('First Aid', 'Q1374975'), tag('CPR'), tag('Health Education')],
    estimated_duration: 2,
    location: LOC_MALTEPE,
    max_participants: 2,
    image_urls: [
      'https://picsum.photos/seed/svc015a/800/600',
      'https://picsum.photos/seed/svc015b/800/600',
      'https://picsum.photos/seed/svc015c/800/600',
    ],
    completed_at: new Date('2026-01-22'),
    created_at: new Date('2026-01-08'),
  }),

  svc('665000000000000000000010', {
    user_id: U16, service_type: 'offer', status: 'completed',
    title: 'React & Next.js Mentoring Session for Junior Developers',
    description: `I'll help you level up your React skills with focused, practical guidance.\n\n## What I can help with\n- React hooks in depth (useState, useEffect, useCallback, useMemo)\n- Next.js: app router, server components, API routes\n- State management (React Query, Zustand)\n- TypeScript in React projects\n- Code review of your existing project\n\n## Session format\n- 2 hours online (Google Meet + VS Code Live Share)\n- You bring a real problem or codebase to work on\n- I adapt to your level — no topic is too basic or advanced\n\n## About me\nI've been building React apps professionally for 5 years. I contribute to open-source and speak at meetups.\n\n*Session completed January 2026.*`,
    category: 'Technology',
    tags: [tag('React', 'Q19399'), tag('Next.js'), tag('Web Development')],
    estimated_duration: 2,
    location: LOC_REMOTE,
    is_remote: true,
    max_participants: 2,
    image_urls: [
      'https://picsum.photos/seed/svc016a/800/600',
      'https://picsum.photos/seed/svc016b/800/600',
    ],
    completed_at: new Date('2026-01-27'),
    created_at: new Date('2026-01-10'),
  }),

  svc('665000000000000000000011', {
    user_id: U18, service_type: 'need', status: 'completed',
    title: 'Looking for Interior Design Advice for My 55m² Apartment',
    description: `I just moved into a compact apartment and need a professional eye to help me make the most of the space.\n\n## What I'm looking for\n- Furniture layout advice (I already have some pieces, need to fit new ones)\n- Color palette suggestions for a calm, modern feel\n- Lighting plan for the living room\n- Storage solutions for a small bedroom\n\n## My situation\n- The apartment is 55m² in Sarıyer\n- I have a limited budget (~5,000 TL for new items)\n- I can visit me in person OR share floor plan + photos for a remote consult\n\n## Time credits offered\n- 1.5 hours of my time (I'm an architect — I can help with structural or renovation questions)\n\n*Resolved January 2026 — great advice, thank you!*`,
    category: 'Design',
    tags: [tag('Interior Design', 'Q1030181'), tag('Home Decor'), tag('Space Planning')],
    estimated_duration: 1.5,
    location: LOC_BESIKTAS,
    image_urls: [
      'https://picsum.photos/seed/svc017a/800/600',
      'https://picsum.photos/seed/svc017b/800/600',
    ],
    completed_at: new Date('2026-01-29'),
    created_at: new Date('2026-01-12'),
  }),

  svc('665000000000000000000012', {
    user_id: U15, service_type: 'need', status: 'completed',
    title: 'CV Review & Cover Letter Feedback for Tech Applications',
    description: `I'm pivoting from editorial work into tech content and UX writing. I need someone who understands the tech hiring landscape to review my CV and cover letter.\n\n## What I need\n- Honest feedback on how my CV reads to a tech recruiter\n- Suggestions on how to position my editorial skills as UX-relevant\n- Cover letter review for a content strategist role\n- Optional: mock interview question brainstorm\n\n## In return\n- I'll offer 1 hour of proofreading or editing on any text you need\n\n## Timeline\nI have a deadline in 10 days — faster is better.\n\n*Received great feedback, application submitted January 2026!*`,
    category: 'Education',
    tags: [tag('Career Advice'), tag('CV Review'), tag('Job Search')],
    estimated_duration: 1,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc018a/800/600',
    ],
    completed_at: new Date('2026-01-25'),
    created_at: new Date('2026-01-15'),
  }),

  // ─── FEBRUARY 2026 — some completed, some in_progress ────────────────────

  svc('665000000000000000000013', {
    user_id: U20, service_type: 'offer', status: 'completed',
    title: 'Specialty Coffee Brewing Workshop — From Bean to Cup',
    description: `If you think coffee is just caffeine delivery, this workshop will change your mind.\n\n## What we cover\n- Coffee origins and how terroir affects flavor\n- Roast levels and what they mean in the cup\n- Hands-on with 4 brewing methods: pour-over, Aeropress, French press, moka pot\n- Dialing in grind size and water temperature\n- Tasting session: 3 single-origin coffees side by side\n\n## Where\nMy micro-roastery in Beyoğlu — come see the whole operation.\n\n## Duration\n2 hours (small group, max 4 people)\n\n## What to bring\nJust your curiosity. I'll provide everything.\n\n*Workshop completed February 2026. Loved every session!*`,
    category: 'Cooking',
    tags: [tag('Coffee', 'Q8486'), tag('Specialty Coffee'), tag('Brewing')],
    estimated_duration: 2,
    location: LOC_BEYOGLU,
    image_urls: [
      'https://picsum.photos/seed/svc019a/800/600',
      'https://picsum.photos/seed/svc019b/800/600',
      'https://picsum.photos/seed/svc019c/800/600',
    ],
    completed_at: new Date('2026-02-10'),
    created_at: new Date('2026-02-01'),
  }),

  svc('665000000000000000000014', {
    user_id: U21, service_type: 'offer', status: 'completed',
    title: 'Stress Management & Mindfulness Coaching Session',
    description: `One 90-minute session to help you understand your stress patterns and build practical coping tools.\n\n## Session overview\n- Brief intake: what's stressing you, how it shows up in your body/mind\n- 3 evidence-based techniques taught and practiced together\n  - Progressive muscle relaxation\n  - Cognitive reframing for anxious thoughts\n  - Breathing regulation (box breathing, 4-7-8)\n- You leave with a personalized 7-day practice plan\n\n## Who this is for\nAnyone feeling overwhelmed, burned out, or anxious. No prior experience with therapy or mindfulness required.\n\n## Important note\nThis is coaching, not therapy. For ongoing mental health support, please seek a licensed psychotherapist.\n\n*Session completed February 2026.*`,
    category: 'Health',
    tags: [tag('Mindfulness', 'Q2731990'), tag('Stress Management'), tag('Wellness')],
    estimated_duration: 1.5,
    location: LOC_SISLI,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc020a/800/600',
      'https://picsum.photos/seed/svc020b/800/600',
    ],
    completed_at: new Date('2026-02-15'),
    created_at: new Date('2026-02-03'),
  }),

  svc('665000000000000000000015', {
    user_id: U22, service_type: 'offer', status: 'in_progress',
    title: 'Music Production Mentoring — Ableton Live for Beginners',
    description: `I'll teach you how to turn ideas in your head into finished tracks using Ableton Live.\n\n## What we cover\n- Ableton interface and workflow\n- Recording MIDI and audio\n- Building a beat from scratch\n- Synthesis basics (subtractive, FM)\n- Mixing: EQ, compression, reverb, delay\n- Arrangement and song structure\n\n## Format\n- 3 sessions × 3 hours each (adaptable)\n- Online via Discord screen share\n- You need Ableton Live (trial version works for the first session)\n\n## My background\nI've released two EPs and produced for local artists. I work in hip-hop, lo-fi, and ambient electronic.\n\n*Currently in progress — booking more sessions!*`,
    category: 'Music',
    tags: [tag('Music Production', 'Q830953'), tag('Ableton Live'), tag('Electronic Music')],
    estimated_duration: 3,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc021a/800/600',
      'https://picsum.photos/seed/svc021b/800/600',
      'https://picsum.photos/seed/svc021c/800/600',
    ],
    created_at: new Date('2026-02-10'),
  }),

  svc('665000000000000000000016', {
    user_id: U23, service_type: 'offer', status: 'in_progress',
    title: 'Indoor Plant Care Workshop — Repotting & Propagation',
    description: `Your plants don\'t have to die. In this workshop I'll teach you to read what they're telling you.\n\n## What we'll do\n- Diagnose common problems (overwatering, light stress, pests)\n- Proper repotting technique and substrate mixes\n- Water propagation for pothos, philodendron, monstera\n- Soil propagation for succulents and cacti\n- Building a sustainable watering schedule\n\n## What to bring\nBring 1–2 of your struggling plants and I'll help you save them.\n\n## Location\nMy apartment in Moda — I have 60+ plants, so it's quite the jungle.\n\n*Session currently in progress — next date TBD.*`,
    category: 'Environment',
    tags: [tag('Plant Care'), tag('Botany', 'Q441'), tag('Urban Gardening')],
    estimated_duration: 1,
    location: LOC_KADIKOY,
    image_urls: [
      'https://picsum.photos/seed/svc022a/800/600',
      'https://picsum.photos/seed/svc022b/800/600',
      'https://picsum.photos/seed/svc022c/800/600',
    ],
    created_at: new Date('2026-02-14'),
  }),

  // ─── MARCH 2026 — active ──────────────────────────────────────────────────

  svc('665000000000000000000017', {
    user_id: U00, service_type: 'need', status: 'active',
    title: 'Docker & DevOps Setup Help for My Side Project',
    description: `I have a FastAPI + React app working locally and need help containerizing it properly for a VPS deployment.\n\n## What I need help with\n- Writing a production-ready Dockerfile and docker-compose.yml\n- Setting up Nginx as a reverse proxy\n- GitHub Actions CI/CD pipeline (build + deploy on push to main)\n- SSL certificate setup (Let's Encrypt)\n\n## What I offer\n- 2 hours of Python backend help in return\n- OR 2 hours of React help if that's more useful to you\n\n## My stack\n- FastAPI + MongoDB + React + Vite\n- VPS: a DigitalOcean droplet running Ubuntu 22.04\n\n*Still looking for help — DM me!*`,
    category: 'Technology',
    tags: [tag('Docker', 'Q15206305'), tag('DevOps'), tag('CI/CD')],
    estimated_duration: 2,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc023a/800/600',
      'https://picsum.photos/seed/svc023b/800/600',
    ],
    created_at: new Date('2026-03-05'),
  }),

  svc('665000000000000000000018', {
    user_id: U06, service_type: 'offer', status: 'in_progress',
    title: 'Event Photography for Small Gatherings & Meetups',
    description: `Have a community event, birthday dinner, or product launch coming up? I'll capture it properly.\n\n## What you get\n- 2–3 hours of coverage\n- 80–120 lightly edited photos delivered within 7 days\n- 20 fully edited hero shots\n- License to use all images for personal/community use\n\n## Ideal for\n- Community meetups and workshops\n- Startup demos and launch events\n- Dinner parties and celebrations\n- Art openings and pop-ups\n\n## My style\nDocumentary — I blend in and capture real moments. You'll barely notice I'm there.\n\n*Currently booking — let's talk!*`,
    category: 'Photography',
    tags: [tag('Event Photography'), tag('Photography', 'Q11633')],
    estimated_duration: 2,
    location: LOC_KADIKOY,
    image_urls: [
      'https://picsum.photos/seed/svc024a/800/600',
      'https://picsum.photos/seed/svc024b/800/600',
    ],
    created_at: new Date('2026-03-01'),
  }),

  svc('665000000000000000000019', {
    user_id: U01, service_type: 'offer', status: 'active',
    title: 'English Conversation Practice — Naturalistic & Culturally Aware',
    description: `Move beyond textbook English into the way native speakers actually talk.\n\n## What makes this different\n- We don't do grammar drills — we have real conversations\n- I'll introduce you to idioms, colloquialisms, and register shifts naturally\n- Topics you choose: work, pop culture, news, hobbies, anything\n- You can ask me to slow down or explain any phrase\n\n## Who this is for\n- Advanced Turkish speakers (B2–C1) who freeze up in real conversations\n- Professionals who want to sound more fluent and less scripted in meetings\n\n## Format\n- 2 hours online or in person (Beşiktaş)\n- I keep a running note of interesting vocabulary for you\n\n*Open for bookings — let's chat!*`,
    category: 'Education',
    tags: [tag('English Language', 'Q1860'), tag('Conversation'), tag('Language Learning')],
    estimated_duration: 2,
    location: LOC_BESIKTAS,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc025a/800/600',
      'https://picsum.photos/seed/svc025b/800/600',
    ],
    created_at: new Date('2026-03-10'),
  }),

  svc('66500000000000000000001a', {
    user_id: U04, service_type: 'offer', status: 'active',
    title: 'Online Strength Training Coaching — 4-Week Program',
    description: `A fully personalized 4-week strength program with weekly check-ins.\n\n## What's included\n- Fitness assessment questionnaire before we start\n- 4-week periodized training plan (3–4 days/week)\n- Video demos for all exercises\n- Weekly 30-min video call to review progress and adjust\n- Nutrition guidelines (not a meal plan, just practical habits)\n\n## Platform\nI'll deliver your program through Google Sheets + video tutorials. Simple, no app required.\n\n## Best for\n- Beginners who don't know where to start\n- Intermediate lifters who've hit a plateau\n\n*Open for new clients — message me to start!*`,
    category: 'Fitness',
    tags: [tag('Strength Training'), tag('Personal Training'), tag('Online Coaching')],
    estimated_duration: 1.5,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc026a/800/600',
      'https://picsum.photos/seed/svc026b/800/600',
      'https://picsum.photos/seed/svc026c/800/600',
    ],
    created_at: new Date('2026-03-12'),
  }),

  svc('66500000000000000000001b', {
    user_id: U03, service_type: 'offer', status: 'active',
    title: 'Brand Identity Design — Logo, Colors, Typography',
    description: `A complete visual identity system for your project, business, or personal brand.\n\n## Deliverables\n- Brand strategy brief (I'll interview you first)\n- Primary logo + wordmark + icon\n- Color palette (primary + secondary + neutrals)\n- Typography system (heading + body + accent)\n- Brand style guide PDF\n- All files in AI, SVG, PNG, PDF\n\n## Process\n- Kickoff call: 45 min\n- Concept presentation: 3 directions\n- 2 rounds of revisions\n- Final delivery: within 2 weeks\n\n## Estimated time credit\n3 hours — split across discovery, design, and delivery.\n\n*Currently accepting new projects!*`,
    category: 'Design',
    tags: [tag('Brand Identity'), tag('Graphic Design', 'Q186030'), tag('Visual Design')],
    estimated_duration: 3,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc027a/800/600',
      'https://picsum.photos/seed/svc027b/800/600',
      'https://picsum.photos/seed/svc027c/800/600',
    ],
    created_at: new Date('2026-03-15'),
  }),

  svc('66500000000000000000001c', {
    user_id: U07, service_type: 'offer', status: 'active',
    title: 'Academic Research Help — Literature Review & Methodology',
    description: `Struggling with your thesis literature review or research design? I've been there. Let me help.\n\n## What I can support\n- Systematic literature search (Google Scholar, JSTOR, PubMed)\n- Organizing and synthesizing sources\n- Writing and structuring a literature review chapter\n- Choosing appropriate qualitative/quantitative methods\n- Reviewing your research proposal or chapter draft\n\n## My background\nPhD candidate in political science at Boğaziçi University with 3 publications. Erasmus scholar 2021.\n\n## Format\n- 2-hour online or in-person session\n- Bring your research question, sources, and a draft if you have one\n\n*Available now — let's work on your research together.*`,
    category: 'Education',
    tags: [tag('Academic Research'), tag('Literature Review'), tag('Thesis')],
    estimated_duration: 2,
    location: LOC_BESIKTAS,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc028a/800/600',
      'https://picsum.photos/seed/svc028b/800/600',
    ],
    created_at: new Date('2026-03-18'),
  }),

  svc('66500000000000000000001d', {
    user_id: U08, service_type: 'offer', status: 'active',
    title: 'Wooden Furniture Repair & Refinishing',
    description: `Got a beloved piece of furniture that's scratched, wobbly, or needs new life? I can fix it.\n\n## What I work on\n- Chair and table joints (regluing, doweling)\n- Surface scratches and gouges (filling, staining, finishing)\n- Drawer and door adjustments\n- Full refinishing (stripping, sanding, staining or painting)\n\n## I won't do\n- Structural damage requiring metalwork or upholstery\n- Antique restoration (I'm a craftsman, not a conservator)\n\n## Location\nMy workshop is in Maltepe. Bring the piece to me, or I can visit for larger items.\n\n## Estimate\nBring photos first and I'll give you a time estimate before we agree.\n\n*Available for bookings now.*`,
    category: 'Home',
    tags: [tag('Woodworking', 'Q42278'), tag('Furniture Repair'), tag('DIY')],
    estimated_duration: 2,
    location: LOC_MALTEPE,
    image_urls: [
      'https://picsum.photos/seed/svc029a/800/600',
      'https://picsum.photos/seed/svc029b/800/600',
    ],
    created_at: new Date('2026-03-20'),
  }),

  svc('66500000000000000000001e', {
    user_id: U13, service_type: 'need', status: 'active',
    title: 'Need Carbon Footprint Analysis for My Small Business',
    description: `I run a small online clothing brand and want to measure our environmental impact before we publish a sustainability report.\n\n## What I need\n- Scope 1 & 2 emissions calculation (energy + transport)\n- Basic Scope 3 estimate (supply chain, shipping)\n- Recommendations for quick wins in emissions reduction\n- A one-page summary I can share publicly\n\n## I can offer in return\n- 1.5 hours of environmental consulting on any topic (I'll explain anything related to climate, recycling, and environmental regulations)\n\n*Looking for someone with environmental science background.*`,
    category: 'Environment',
    tags: [tag('Carbon Footprint'), tag('Sustainability', 'Q216497'), tag('Environment')],
    estimated_duration: 1.5,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc030a/800/600',
    ],
    created_at: new Date('2026-03-22'),
  }),

  // ─── APRIL–MAY 2026 — active ──────────────────────────────────────────────

  svc('66500000000000000000001f', {
    user_id: U14, service_type: 'offer', status: 'active',
    title: 'Mediterranean Cooking Masterclass — Hands-On, 3 Hours',
    description: `A hands-on cooking session in my home kitchen, focused on the flavors of the Mediterranean.\n\n## What we'll cook\n- Labneh with herbs and olive oil\n- Spanakopita (spinach and feta phyllo pie)\n- Shakshuka with sourdough\n- Lemon and herb-roasted chicken\n- Walnut baklava\n\n## The experience\nWe cook together — you're not just watching. I'll explain techniques, substitutions, and the story behind each dish. We eat at the end.\n\n## Details\n- Location: My kitchen in Nişantaşı\n- Max 2 people\n- All ingredients included\n- Printed recipe booklet to take home\n\n*Available most weekends — message to book.*`,
    category: 'Cooking',
    tags: [tag('Mediterranean Cuisine'), tag('Cooking Class'), tag('Food')],
    estimated_duration: 2.5,
    location: LOC_SISLI,
    image_urls: [
      'https://picsum.photos/seed/svc031a/800/600',
      'https://picsum.photos/seed/svc031b/800/600',
      'https://picsum.photos/seed/svc031c/800/600',
    ],
    created_at: new Date('2026-04-01'),
  }),

  svc('665000000000000000000020', {
    user_id: U16, service_type: 'offer', status: 'active',
    title: 'Programming for Kids — Scratch, Python, & Logic (Ages 8–14)',
    description: `Introduce your child to coding in a fun, project-based way.\n\n## What we build together\n- Scratch: animated story, simple platformer game\n- Python basics: variables, loops, simple text adventure\n- Logic puzzles and algorithmic thinking exercises\n\n## Session structure\n- 2 hours per session (with snack break)\n- Age-appropriate pacing — I'm patient and encouraging\n- Child works on a laptop (Mac or Windows, I'll set up everything)\n- Parents welcome to sit in\n\n## Location\n- Your home or my office in Maslak\n- Online (for older kids who can focus on a video call)\n\n*Currently booking — great for spring break!*`,
    category: 'Education',
    tags: [tag('Coding for Kids'), tag('Programming', 'Q80006'), tag('Scratch')],
    estimated_duration: 2,
    location: LOC_LEVENT,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc032a/800/600',
      'https://picsum.photos/seed/svc032b/800/600',
    ],
    created_at: new Date('2026-04-05'),
  }),

  svc('665000000000000000000021', {
    user_id: U09, service_type: 'offer', status: 'active',
    title: 'Online Morning Yoga — Beginner-Friendly Flow (60 min)',
    description: `Start your day grounded with a live online yoga class designed for beginners.\n\n## Class format\n- 10 min: breath and centering\n- 40 min: gentle vinyasa flow (standing, core, balance)\n- 10 min: savasana and meditation\n\n## What you need\n- A mat (a thick blanket works too)\n- Comfortable clothes\n- Stable internet connection and a device with a camera\n\n## Schedule\nMonday and Wednesday mornings, 7:00–8:00 AM (Istanbul time)\n\n## About me\nRYT-200 certified, teaching for 5 years. I keep class sizes small (max 4 online) so I can give you corrections.\n\n*Booking now for May — spots limited.*`,
    category: 'Fitness',
    tags: [tag('Yoga', 'Q8162'), tag('Online Class'), tag('Wellness')],
    estimated_duration: 1,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc033a/800/600',
      'https://picsum.photos/seed/svc033b/800/600',
    ],
    created_at: new Date('2026-04-10'),
  }),

  svc('665000000000000000000022', {
    user_id: U23, service_type: 'offer', status: 'active',
    title: 'Pet Sitting & Cat Care While You Travel',
    description: `Going away for a weekend or a week? Let me look after your cats at your home or mine.\n\n## What I offer\n- Twice-daily feeding and fresh water\n- Litter box cleaning every visit\n- Playtime and cuddles (as much as your cat wants)\n- Daily photo update sent to you via WhatsApp\n- Basic medication administration (drops, tablets)\n\n## About me\nI'm a botanist with two cats of my own. I'm calm around anxious animals and very observant about health signs.\n\n## Location\n- I can visit your home in Kadıköy / Moda area\n- Or you can bring your cat to my apartment\n\n*Available most weekends and some weekdays. Message to check dates.*`,
    category: 'Pet Care',
    tags: [tag('Pet Sitting'), tag('Cat Care'), tag('Animal Care')],
    estimated_duration: 1,
    location: LOC_KADIKOY,
    image_urls: [
      'https://picsum.photos/seed/svc034a/800/600',
      'https://picsum.photos/seed/svc034b/800/600',
      'https://picsum.photos/seed/svc034c/800/600',
    ],
    created_at: new Date('2026-04-15'),
  }),

  svc('665000000000000000000023', {
    user_id: U19, service_type: 'need', status: 'active',
    title: 'Legal Document Translation Needed: Turkish → English (8 pages)',
    description: `I need an accurate English translation of an 8-page contract (Turkish law, commercial lease).\n\n## About the document\n- Commercial lease agreement for a studio space\n- 8 pages, dense legal language\n- I need the translation to show to a foreign business partner\n- Does not need to be notarized\n\n## Requirements\n- Fluent English (ideally with legal translation experience)\n- Accurate — close to literal is fine, legal terms should be correct\n- Delivery within 5 working days\n\n## What I offer\n- 4 time-credit hours (reflecting the difficulty and time investment)\n\n*Urgent — message me soon if you can help!*`,
    category: 'Writing',
    tags: [tag('Legal Translation'), tag('Translation', 'Q7553'), tag('Turkish')],
    estimated_duration: 4,
    location: LOC_REMOTE,
    is_remote: true,
    image_urls: [
      'https://picsum.photos/seed/svc035a/800/600',
    ],
    created_at: new Date('2026-04-20'),
  }),

  svc('665000000000000000000024', {
    user_id: U22, service_type: 'need', status: 'active',
    title: 'Looking for Piano Lessons — Complete Adult Beginner',
    description: `I've always wanted to learn piano but never had the time. Now I do, and I'm ready to start from absolute zero.\n\n## What I'm looking for\n- A patient teacher who's used to adult beginners\n- Learning to read basic sheet music\n- Starting with simple classical pieces (Für Elise, maybe?)\n- Understanding chord theory from a producer\'s perspective (I produce electronic music)\n\n## My situation\n- I have a 61-key MIDI keyboard (no acoustic piano)\n- Flexible schedule — mornings, evenings, weekends\n- Happy to do online or in-person (Karaköy area)\n\n## What I offer\n- 2 hours of music production mentoring in return (Ableton, sound design, arrangement)\n\n*Message me if you're a piano teacher looking to exchange skills!*`,
    category: 'Music',
    tags: [tag('Piano', 'Q5994'), tag('Music Lessons'), tag('Beginner')],
    estimated_duration: 2,
    location: LOC_BEYOGLU,
    image_urls: [
      'https://picsum.photos/seed/svc036a/800/600',
      'https://picsum.photos/seed/svc036b/800/600',
    ],
    created_at: new Date('2026-05-01'),
  }),

];

const result = db.services.insertMany(services);
print(`Inserted ${Object.keys(result.insertedIds).length} services.`);
