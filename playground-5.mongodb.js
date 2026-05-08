/* global use, db */
// Seed: Update all user profiles with rich bios, avatars, interests, and social links.
// Run this FIRST before other seed scripts.

use('hive_platform');

const profiles = [
  {
    _id: ObjectId('68f67e78cc0dce66e7dede2e'),
    full_name: 'Mehmet Yılmaz',
    bio: 'Full-stack developer with 6 years of experience in Python and React. I love helping others debug their projects over a coffee chat. Currently building a fintech startup in Kadıköy and always happy to pair-program.',
    location: 'Kadıköy, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed0',
    interests: ['Technology', 'AI', 'Startups', 'Finance', 'Education'],
    social_links: {
      linkedin: 'https://linkedin.com/in/mehmetyilmaz-dev',
      github: 'https://github.com/mehmetyilmaz',
    },
  },
  {
    _id: ObjectId('68f67e78cc0dce66e7dede2f'),
    full_name: 'Ayşe Demir',
    bio: 'Certified CELTA teacher and language enthusiast. I offer Turkish conversation practice for expats and English tutoring for locals. Fluent in French too — let\'s exchange skills!',
    location: 'Beşiktaş, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed1',
    interests: ['Language Exchange', 'Education', 'Travel', 'Writing', 'Art'],
    social_links: {
      instagram: 'https://instagram.com/aysedemirlang',
      linkedin: 'https://linkedin.com/in/aysedemir-edu',
    },
  },
  {
    _id: ObjectId('68f67e78cc0dce66e7dede30'),
    full_name: 'Can Özkan',
    bio: 'Guitarist and music educator with 12 years of stage and studio experience. I specialize in fingerstyle and classical guitar. Teaching is my way of keeping music alive in the community.',
    location: 'Şişli, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed2',
    interests: ['Music', 'Education', 'Art', 'Writing'],
    social_links: {
      instagram: 'https://instagram.com/canozkanmusic',
      website: 'https://canozkan.com',
    },
  },
  {
    _id: ObjectId('68f67e78cc0dce66e7dede31'),
    full_name: 'Zeynep Arslan',
    bio: 'Brand designer and visual storyteller. I\'ve worked with 40+ startups on logos, identities, and UI kits. I believe every small business deserves beautiful design — and I\'m here to help.',
    location: 'Beyoğlu, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed3',
    interests: ['Design', 'Art', 'Technology', 'Startups', 'Photography'],
    social_links: {
      linkedin: 'https://linkedin.com/in/zeyneparslandesign',
      instagram: 'https://instagram.com/zeyneparslan.design',
      website: 'https://zeyneparslan.design',
    },
  },
  {
    _id: ObjectId('68f67e78cc0dce66e7dede32'),
    full_name: 'Emre Kaya',
    bio: 'Certified personal trainer and sports nutritionist. My mission is to make fitness accessible for everyone regardless of experience. Former national-level swimmer, now focused on strength and mobility training.',
    location: 'Üsküdar, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed4',
    interests: ['Fitness', 'Health', 'Sports', 'Science', 'Education'],
    social_links: {
      instagram: 'https://instagram.com/emrekaya.fitness',
      linkedin: 'https://linkedin.com/in/emrekaya-trainer',
    },
  },
  {
    _id: ObjectId('68f67f9c3966e4ce6ebcd0d8'),
    full_name: 'Selin Çelik',
    bio: 'Home cook turned food blogger and culinary instructor. I teach traditional Anatolian recipes with a modern twist. My kitchen is always open — let\'s cook something beautiful together.',
    location: 'Kadıköy, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed5',
    interests: ['Cooking', 'Art', 'Travel', 'Health', 'Photography'],
    social_links: {
      instagram: 'https://instagram.com/selincelik.cook',
      website: 'https://selincelikfood.com',
    },
  },
  {
    _id: ObjectId('6910493fbd2b553c40682a22'),
    full_name: 'Ahmet Şahin',
    bio: 'Documentary and portrait photographer based in Istanbul. I\'ve photographed weddings, protests, street scenes, and everything in between. Available for event and personal photography sessions.',
    location: 'Fatih, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed6',
    interests: ['Photography', 'Art', 'Travel', 'Design', 'Writing'],
    social_links: {
      instagram: 'https://instagram.com/ahmetsahinphoto',
      website: 'https://ahmetsahin.photography',
    },
  },
  {
    _id: ObjectId('699c495b8a3c27030ad95179'),
    full_name: 'Fatma Aktaş',
    bio: 'PhD researcher in political science at Boğaziçi University. I offer help with academic writing, literature reviews, and qualitative research methodology. Former Erasmus scholar.',
    location: 'Etiler, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed7',
    interests: ['Education', 'Writing', 'Science', 'Volunteering', 'Language Exchange'],
    social_links: {
      linkedin: 'https://linkedin.com/in/fatmaaktas-phd',
      twitter: 'https://twitter.com/fatmaaktas_',
    },
  },
  {
    _id: ObjectId('699c819c8a3c27030ad9517a'),
    full_name: 'Burak Yıldız',
    bio: 'Carpenter and furniture restorer with a workshop in Maltepe. I can fix, paint, assemble, or completely rebuild your wooden furniture. I also help with small home repairs and moving.',
    location: 'Maltepe, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed8',
    interests: ['Art', 'Design', 'Environment', 'Volunteering'],
    social_links: {
      instagram: 'https://instagram.com/burakyildizwood',
    },
  },
  {
    _id: ObjectId('699d5d8ed41dfdf904cba681'),
    full_name: 'Elif Doğan',
    bio: 'Registered yoga teacher (RYT-200) specializing in Hatha and Yin styles. I believe movement is medicine. I offer morning and evening sessions for all levels, online or in my studio in Moda.',
    location: 'Moda, Kadıköy',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed9',
    interests: ['Fitness', 'Health', 'Science', 'Environment', 'Travel'],
    social_links: {
      instagram: 'https://instagram.com/elifdoganyoga',
      website: 'https://elifdoganyoga.com',
    },
  },
  {
    _id: ObjectId('699d9901d41dfdf904cba682'),
    full_name: 'Tolga Erdoğan',
    bio: 'Data scientist at a logistics company. Passionate about turning raw data into actionable insights. I teach Python data analysis and build dashboards. Open to mentoring junior analysts.',
    location: 'Levent, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed10',
    interests: ['Technology', 'AI', 'Science', 'Finance', 'Education'],
    social_links: {
      linkedin: 'https://linkedin.com/in/tolgaerdogan-data',
      github: 'https://github.com/tolgaerdogan',
    },
  },
  {
    _id: ObjectId('699e0effb25538f8efb419b1'),
    full_name: 'Merve Koç',
    bio: 'Fine arts graduate and practicing watercolor artist. My work has been exhibited in three Istanbul galleries. I love teaching absolute beginners — there\'s nothing better than watching someone discover their creative voice.',
    location: 'Cihangir, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed11',
    interests: ['Art', 'Design', 'Photography', 'Writing', 'Travel'],
    social_links: {
      instagram: 'https://instagram.com/mervekoc.art',
      website: 'https://mervekoc.art',
    },
  },
  {
    _id: ObjectId('699e1ab5b25538f8efb419b6'),
    full_name: 'Serkan Bulut',
    bio: 'Math and physics teacher with 8 years of experience preparing students for YKS and SAT. I use visual and hands-on methods that make abstract concepts click. Former METU student.',
    location: 'Ataşehir, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed12',
    interests: ['Education', 'Science', 'Technology', 'Gaming'],
    social_links: {
      linkedin: 'https://linkedin.com/in/serkanbulut-edu',
    },
  },
  {
    _id: ObjectId('69a07b2db25538f8efb419b7'),
    full_name: 'Dilan Şimşek',
    bio: 'Environmental engineer and sustainability consultant. I help individuals and small businesses measure and reduce their carbon footprint. Passionate about urban green spaces and circular economy.',
    location: 'Bomonti, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed13',
    interests: ['Environment', 'Science', 'Volunteering', 'Health', 'Startups'],
    social_links: {
      linkedin: 'https://linkedin.com/in/dilansimsek-env',
      twitter: 'https://twitter.com/dilansimsek_eco',
    },
  },
  {
    _id: ObjectId('69a33be549f11e4548daecbf'),
    full_name: 'Mert Aydın',
    bio: 'Professional chef trained in Istanbul and Lyon. I run pop-up dinners and teach Mediterranean and Anatolian cooking classes from my home kitchen. Sustainability in food is my core philosophy.',
    location: 'Nişantaşı, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed14',
    interests: ['Cooking', 'Travel', 'Art', 'Environment', 'Health'],
    social_links: {
      instagram: 'https://instagram.com/mertaydinchef',
      website: 'https://mertaydinchef.com',
    },
  },
  {
    _id: ObjectId('69a3faa349f11e4548daecc4'),
    full_name: 'Neslihan Özdemir',
    bio: 'Freelance writer and copy editor with 10 years of experience in academic and journalistic writing. I proofread in Turkish and English. Former editor at a major Istanbul publishing house.',
    location: 'Bağcılar, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed15',
    interests: ['Writing', 'Language Exchange', 'Education', 'Art', 'Volunteering'],
    social_links: {
      linkedin: 'https://linkedin.com/in/neslihanozdemir-writer',
      twitter: 'https://twitter.com/neslihanozdemir',
    },
  },
  {
    _id: ObjectId('69ac140f0737d99885fb51f8'),
    full_name: 'Bora Güneş',
    bio: 'Frontend engineer with a love for developer education. I mentor bootcamp graduates and self-taught coders in React, Next.js, and TypeScript. Open-source contributor and conference speaker.',
    location: 'Maslak, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed16',
    interests: ['Technology', 'Education', 'AI', 'Startups', 'Gaming'],
    social_links: {
      github: 'https://github.com/boragunes',
      linkedin: 'https://linkedin.com/in/boragunes-dev',
      twitter: 'https://twitter.com/boragunes_dev',
    },
  },
  {
    _id: ObjectId('69ad42dd0737d99885fb5238'),
    full_name: 'Gamze Yılmaz',
    bio: 'Emergency nurse with 7 years of ICU experience. I teach first aid and CPR to non-medical people because I believe everyone should know how to save a life. Also a certified pilates instructor.',
    location: 'Kartal, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed17',
    interests: ['Health', 'Fitness', 'Education', 'Volunteering', 'Science'],
    social_links: {
      linkedin: 'https://linkedin.com/in/gamzeyilmaz-rn',
      instagram: 'https://instagram.com/gamzeyilmaz.health',
    },
  },
  {
    _id: ObjectId('69ae20b916ba13f0b24017dd'),
    full_name: 'Kerem Aras',
    bio: 'Licensed architect specializing in residential and small commercial spaces. I love the challenge of making small apartments feel spacious and personal. Available for consultations and design reviews.',
    location: 'Sarıyer, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed18',
    interests: ['Design', 'Art', 'Technology', 'Environment', 'Photography'],
    social_links: {
      linkedin: 'https://linkedin.com/in/keremasarch',
      instagram: 'https://instagram.com/keremasarch',
      website: 'https://keremasarch.com',
    },
  },
  {
    _id: ObjectId('69aeb72ae0fb78b01b102998'),
    full_name: 'İpek Çakır',
    bio: 'Professional translator and interpreter working in Turkish, English, and German. I specialize in legal, academic, and business translation. Former UN interpreter at conferences in Geneva.',
    location: 'Bakırköy, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed19',
    interests: ['Language Exchange', 'Writing', 'Travel', 'Education', 'Volunteering'],
    social_links: {
      linkedin: 'https://linkedin.com/in/ipekcakir-translator',
    },
  },
  {
    _id: ObjectId('69aeea87eeccfa2e45b4c1b9'),
    full_name: 'Cem Demir',
    bio: 'Specialty coffee roaster and Q-grader. I run a micro-roastery in Beyoğlu and offer hands-on brewing workshops. Coffee is about community — I\'d love to share what I\'ve learned.',
    location: 'Beyoğlu, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed20',
    interests: ['Cooking', 'Art', 'Startups', 'Travel', 'Environment'],
    social_links: {
      instagram: 'https://instagram.com/cemdemir.coffee',
      website: 'https://cemdemircoffee.com',
    },
  },
  {
    _id: ObjectId('69aeeb81eeccfa2e45b4c1bd'),
    full_name: 'Yasemin Kurt',
    bio: 'Licensed psychotherapist and mindfulness trainer. I offer one-on-one stress management coaching and group workshops for workplace wellness. Member of the Turkish Psychological Association.',
    location: 'Nişantaşı, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed21',
    interests: ['Health', 'Science', 'Education', 'Writing', 'Volunteering'],
    social_links: {
      linkedin: 'https://linkedin.com/in/yaseminkurt-therapy',
      website: 'https://yaseminkurt.com',
    },
  },
  {
    _id: ObjectId('69bc430bcf8d0686f0a691f0'),
    full_name: 'Kaan Polat',
    bio: 'Music producer, sound designer, and occasional DJ. I work across hip-hop, electronic, and ambient genres in my home studio. Happy to mentor producers who are starting out with Ableton.',
    location: 'Karaköy, Istanbul',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed22',
    interests: ['Music', 'Technology', 'Art', 'Gaming'],
    social_links: {
      instagram: 'https://instagram.com/kaanpolat.music',
      website: 'https://kaanpolat.com',
    },
  },
  {
    _id: ObjectId('69c44998643d8a485ec2e5c0'),
    full_name: 'Defne Güler',
    bio: 'Botanist and urban farming enthusiast. I grow 60+ species in my apartment and balcony garden. I offer workshops on indoor plant care, propagation, and pet-safe plant selection.',
    location: 'Moda, Kadıköy',
    profile_picture: 'https://i.pravatar.cc/300?u=hiveseed23',
    interests: ['Environment', 'Science', 'Health', 'Photography', 'Cooking'],
    social_links: {
      instagram: 'https://instagram.com/defneguler.plants',
      website: 'https://defneguler.com',
    },
  },
];

profiles.forEach(p => {
  const { _id, ...fields } = p;
  db.users.updateOne(
    { _id },
    {
      $set: {
        full_name: fields.full_name,
        bio: fields.bio,
        location: fields.location,
        profile_picture: fields.profile_picture,
        interests: fields.interests,
        social_links: fields.social_links,
        is_verified: true,
        updated_at: new Date(),
      },
    }
  );
});

print(`Updated ${profiles.length} user profiles.`);
