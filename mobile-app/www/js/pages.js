/* global api, cart, formatDate, app */

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

const pages = {};

// ---------------------------------------------------------------------------
// 1. HOME
// ---------------------------------------------------------------------------
pages.home = () => {
  const html = `
<div class="page page-enter">
  <div class="hero-mobile">
    <h1>Master the Miles,<br><span class="hero-gradient">Own Your Journey</span></h1>
    <p>Empowering professional truck drivers with practical tools, real-world wisdom, and an uplifting community.</p>
  </div>
  <div class="stats-row">
    <div class="stat-item"><span class="stat-val">25+</span><span class="stat-lbl">Years</span></div>
    <div class="stat-item"><span class="stat-val">7</span><span class="stat-lbl">Focus Areas</span></div>
    <div class="stat-item"><span class="stat-val">40+</span><span class="stat-lbl">Tips</span></div>
  </div>
  <div class="quick-links">
    <div class="quick-link" data-goto="about"><span class="quick-link-icon">&#9670;</span><span class="quick-link-label">About Us</span></div>
    <div class="quick-link" data-goto="services"><span class="quick-link-icon">&#128736;</span><span class="quick-link-label">Services</span></div>
    <div class="quick-link" data-goto="roadmap"><span class="quick-link-icon">&#128506;</span><span class="quick-link-label">Safety Roadmap</span></div>
    <div class="quick-link" data-goto="course"><span class="quick-link-icon">&#127891;</span><span class="quick-link-label">90-Day Course</span></div>
    <div class="quick-link" data-goto="packets"><span class="quick-link-icon">&#128196;</span><span class="quick-link-label">Safety Packets</span></div>
    <div class="quick-link" data-goto="contact"><span class="quick-link-icon">&#128172;</span><span class="quick-link-label">Contact</span></div>
  </div>
  <h3 class="section-title-m">Latest from the Blog</h3>
  <div id="homeBlog"></div>
  ${LEGAL_FOOTER}
</div>`;

  const init = async () => {
    document.querySelectorAll('.quick-link').forEach(el => {
      el.addEventListener('click', () => app.navigate(el.dataset.goto));
    });

    try {
      const posts = await api.getPosts();
      const container = document.getElementById('homeBlog');
      if (!container) return;
      const recent = (posts.posts || posts).slice(0, 3);
      if (!recent.length) { container.innerHTML = '<p class="empty-state-m">No posts yet.</p>'; return; }
      container.innerHTML = recent.map(p => `
        <div class="blog-item" data-slug="${escapeHtml(p.slug)}">
          <div class="blog-thumb">&#128221;</div>
          <div class="blog-info">
            <h3>${escapeHtml(p.title)}</h3>
            <p>${formatDate(p.created_at)}${p.author ? ' &bull; ' + escapeHtml(p.author) : ''}</p>
          </div>
        </div>`).join('');
      container.querySelectorAll('.blog-item').forEach(el => {
        el.addEventListener('click', () => app.navigate('blog-post', el.dataset.slug));
      });
    } catch (_) {
      const c = document.getElementById('homeBlog');
      if (c) c.innerHTML = '<p class="empty-state-m">Could not load posts.</p>';
    }
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 2. ABOUT
// ---------------------------------------------------------------------------
pages.about = () => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="home">&#8592; Home</button>
  <div class="page-header">
    <h1 class="page-title">About Mile 12 Warrior</h1>
    <p class="page-subtitle">Born from 25+ years behind the wheel. One platform. Two brands. One mission.</p>
  </div>

  <h3 class="section-title-m">Meet the Founder</h3>
  <div class="card" style="border-left:3px solid var(--accent)">
    <h3 style="font-size:1.05rem;margin-bottom:2px">Joyce Cooke</h3>
    <p style="font-family:var(--mono);font-size:0.65rem;color:var(--accent);margin-bottom:12px;letter-spacing:0.04em">FOUNDER &amp; CEO</p>
    <p>Joyce Cooke is a battle-tested professional truck driver with over 25 years on the road, a fierce advocate for driver wellness, and the founder of Mile 12 Warrior LLC &mdash; a movement dedicated to helping truckers conquer fatigue, master resets, and thrive amid the demands of the trucking life.</p>
    <p style="margin-top:10px">Born in Michigan in January 1967 and raised in the Midwest, Joyce graduated from West Platte High School in Weston, Missouri, in 1985. Her early career took her into hospitality, where she completed a two-year course in Hotel/Motel Food Service Management and spent a decade in food and beverage operations, including time at the Ritz-Carlton. Those years sharpened her skills in high-pressure environments, customer service, and attention to detail &mdash; qualities that later proved invaluable behind the wheel.</p>
    <p style="margin-top:10px">Life's turns led Joyce into trucking around 2000. She began driving a school bus, building discipline and safety focus. A neighbor's recommendation opened the door to ABF Freight in 2006, where she started as a dock worker in Kansas City. ABF sponsored her CDL training, launching her progression through P&amp;D city work, double and triple trailer sets, to full OTR driving. After 14 years mastering Midwest routes, she transferred to California in January 2021 to join ABF's road team.</p>
    <p style="margin-top:10px">Her safety record speaks volumes: consistent plaques for safe driving, a President's Award from ABF in 2011, and an exemplary commitment to getting there safely. A proud mother of four and grandmother of eight, she knows the stakes &mdash; family waiting at home, and the isolation that can wear anyone down.</p>
  </div>

  <h3 class="section-title-m">The Mile 12 Story</h3>
  <div class="card">
    <p>Joyce didn't just survive the road &mdash; she transformed its toughest challenges into strength. She lived the relentless cycle of fatigue and turned those battles into wisdom.</p>
    <p style="margin-top:10px;padding:12px;border-left:3px solid var(--accent);background:rgba(99,102,241,0.06);border-radius:4px;font-weight:500">The "Mile 12" moment: that critical point deep into a long haul when exhaustion peaks, decisions matter most, and resilience can make or break the run.</p>
    <p style="margin-top:10px">From there, she built better habits: smarter nutrition, effective detox strategies, intentional time management, proactive self-care, and mindset shifts that turn survival into thriving.</p>
    <p style="margin-top:10px">What started as personal encouragement has grown into Mile 12 Warrior LLC &mdash; a judgment-free community that equips professional truckers with fatigue management, 10-hour reset mastery, wellness strategies, and fleet consulting. Rooted in prevention, a warrior spirit, and genuine support, Mile 12 Warrior helps shrink the FMCSA-noted 13% of large truck accidents tied to fatigue while combating the loneliness of the miles.</p>
  </div>

  <div class="card" style="text-align:center;padding:20px">
    <h3 style="font-size:1rem;margin-bottom:6px">Our Mission</h3>
    <p style="font-style:italic;color:var(--text-2)">Empower truckers to embrace the freedom of the traveling life while prioritizing health, safety, and strength &mdash; so every mile becomes a victory, not just a grind.</p>
  </div>

  <h3 class="section-title-m" style="margin-top:20px">What Makes Us Different</h3>
  <div class="card"><h3>Prevention Over Reaction</h3><p>Our tools and strategies are proactive &mdash; keeping you sharp, safe, and strong before the crisis hits.</p></div>
  <div class="card"><h3>Warrior Mindset</h3><p>We celebrate resilience without sugarcoating realities. The road is hard. We honor that truth while giving you what you need to thrive.</p></div>
  <div class="card"><h3>Real-Road Perspective</h3><p>This isn't theory from a desk. Every resource comes from someone who's been behind that wheel for 25+ years.</p></div>

  <h3 class="section-title-m" style="margin-top:20px">Our Brands</h3>
  <div class="card"><h3>Mile 12 Warrior LLC</h3><p>Your dedicated ally for turning the toughest stretches into triumphs. Proactive fatigue fighters, mindset resets, 10-hour reset mastery, wellness strategies, and personalized guidance for individuals and fleets.</p></div>
  <div class="card"><h3>1 Social Butterfly</h3><p>Our supportive avenue for living your best life. Blogs, community, merchandise, and more — strength, creativity, and transformation at 1socialbutterfly.net.</p></div>

  <h3 class="section-title-m" style="margin-top:20px">Connect With Joyce</h3>
  <div class="card">
    <p><strong>Email:</strong> <a href="mailto:joyce@mile12warrior.com" style="color:var(--accent)">joyce@mile12warrior.com</a></p>
    <p style="margin-top:6px"><strong>Websites:</strong> mile12warrior.com | 1socialbutterfly.net</p>
  </div>

  <div style="margin-top:16px;text-align:center">
    <button class="btn-m" id="aboutContactBtn">Contact Us</button>
  </div>
</div>`;

  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('home'));
    document.getElementById('aboutContactBtn')?.addEventListener('click', () => app.navigate('contact'));
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 3. SERVICES
// ---------------------------------------------------------------------------
pages.services = () => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="home">&#8592; Home</button>
  <div class="page-header">
    <h1 class="page-title">Our Services</h1>
    <p class="page-subtitle">Real-world solutions built by a driver, for drivers. We go beyond inspiration to deliver practical, no-fluff support.</p>
  </div>

  <div class="card">
    <h3>Driver Wellness &amp; Fatigue Management</h3>
    <p>Proactive resource packets and personalized guidance to help drivers combat fatigue, handle long-haul challenges, and master 10-hour resets. Includes practical mindset shifts, health and safety tips, and strategies for thriving during those critical "Mile 12" moments.</p>
    <p style="margin-top:8px;font-size:0.78rem;color:var(--text-3)">Fatigue prevention &bull; Reset mastery &bull; Circadian rhythm &bull; The Mile 12 Kit &bull; Mindset resets</p>
  </div>

  <div class="card">
    <h3>Fleet &amp; Individual Driver Consulting</h3>
    <p>Personalized consulting and support services for truck drivers and fleets focused on wellness, resilience, and thriving on the road. We work with both individual drivers and fleet operations to build sustainable practices.</p>
    <p style="margin-top:8px;font-size:0.78rem;color:var(--text-3)">1-on-1 coaching &bull; Fleet wellness programs &bull; Performance assessments &bull; Custom fatigue plans</p>
  </div>

  <div class="card">
    <h3>Community &amp; Content Support</h3>
    <p>Blog-style content, community building, and emotional/practical support through tips, stories, and Q&amp;A resources. A non-judgmental space to share experiences, learn from peers, and access uplifting guidance.</p>
    <p style="margin-top:8px;font-size:0.78rem;color:var(--text-3)">Driver blog &bull; Community forum &bull; Q&amp;A guides &bull; Wellness content &bull; Trucker stories</p>
  </div>

  <div style="margin-top:20px;text-align:center">
    <button class="btn-m" id="svcContactBtn">Contact Us</button>
  </div>
</div>`;

  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('home'));
    document.getElementById('svcContactBtn')?.addEventListener('click', () => app.navigate('contact'));
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 4. ROADMAP (overview)
// ---------------------------------------------------------------------------
pages.roadmap = () => {
  const phases = [
    { id: 1, title: 'Sleep & Fatigue Management', desc: 'Master rest, beat drowsiness, stay sharp behind the wheel.' },
    { id: 2, title: 'Physical Health Hazards', desc: 'Protect your body from the toll of long-haul driving.' },
    { id: 3, title: 'Mental Health & Emotional Wellness', desc: 'Combat isolation, stress, and the emotional weight of the road.' },
    { id: 4, title: 'Road & Environmental Hazards', desc: 'Anticipate and navigate ice, fog, wind, and construction.' },
    { id: 5, title: 'Defensive Driving & Situational Awareness', desc: 'Spacing, scanning, and proactive driving techniques.' },
    { id: 6, title: 'Emergency Preparedness', desc: 'Be ready for breakdowns, accidents, and the unexpected.' },
    { id: 7, title: 'Your Daily Wellness Action Plan', desc: 'Daily checklists, routines, and resources to keep you going strong.' }
  ];

  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="home">&#8592; Home</button>
  <div class="page-header">
    <h1 class="page-title">Driver Safety Roadmap</h1>
    <p class="page-subtitle">Seven critical areas every professional driver needs to master. Tap any phase to dive deeper.</p>
  </div>
  ${phases.map(p => `
  <div class="card" data-phase="${p.id}" style="cursor:pointer">
    <p style="font-family:var(--mono);font-size:0.72rem;color:var(--text-3);margin-bottom:4px">Phase 0${p.id}</p>
    <h3>${escapeHtml(p.title)}</h3>
    <p>${escapeHtml(p.desc)}</p>
  </div>`).join('')}
</div>`;

  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('home'));
    document.querySelectorAll('.card[data-phase]').forEach(el => {
      el.addEventListener('click', () => app.navigate('roadmap-detail', el.dataset.phase));
    });
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 5. ROADMAP DETAIL (single phase)
// ---------------------------------------------------------------------------
pages.roadmapDetail = (phase) => {
  const id = parseInt(phase, 10);

  const phaseContent = {
    1: {
      title: 'Sleep & Fatigue Management',
      intro: 'Drowsy driving is as dangerous as drunk driving. The NHTSA estimates fatigue plays a role in over 100,000 crashes per year. Here\'s how to fight back.',
      cards: [
        { t: 'Circadian Rhythm Awareness', b: 'Your body\'s internal clock dips hardest between 2-4 AM and 1-3 PM. Avoid driving during these windows when possible. Align your schedule with your natural sleep-wake cycle.' },
        { t: 'Hours of Service Compliance', b: 'FMCSA HOS rules (49 CFR Part 395): 11-hour driving limit within a 14-hour on-duty window, 10-hour consecutive off-duty minimum, mandatory 30-minute break after 8 hours of driving, and 60/70-hour weekly limits. California may impose additional restrictions. Use your ELD as a safety tool, not just a compliance checkbox.' },
        { t: 'Strategic Caffeine Use', b: 'Caffeine takes 20-30 minutes to kick in. Use it strategically — not as a crutch. Stop caffeine 6 hours before sleep. A "coffee nap" (caffeine + 20-min nap) is remarkably effective.' },
        { t: 'Power Nap Protocol', b: 'A 20-minute nap can restore alertness for hours. Find a safe, level spot. Set an alarm. Don\'t nap longer than 30 minutes or you\'ll hit deep sleep and wake groggy.' },
        { t: 'Sleep Apnea Screening', b: 'Up to 28% of commercial drivers have sleep apnea. Symptoms: loud snoring, gasping at night, daytime exhaustion. Get screened — treatment (CPAP) can be life-changing.' },
        { t: 'Warning Signs of Fatigue', b: 'Drifting between lanes, missing exits, heavy eyelids, yawning repeatedly, can\'t remember the last few miles. If you notice ANY of these — pull over immediately. No load is worth your life.' }
      ]
    },
    2: {
      title: 'Physical Health Hazards',
      intro: 'Long hours in the seat take a serious toll on your body. Truck drivers face higher rates of obesity, diabetes, heart disease, and musculoskeletal disorders than most professions.',
      cards: [
        { t: 'Back & Joint Strain', b: 'Whole-body vibration from the truck, combined with sitting for 10+ hours, compresses spinal discs and stiffens joints. Invest in a quality seat cushion with lumbar support. Every 2 hours, stop and do 5 minutes of stretching — focus on hamstrings, hip flexors, and lower back.' },
        { t: 'Poor Nutrition on the Road', b: 'Truck stop food is engineered for speed and taste, not health. Pack a cooler with fruits, vegetables, lean proteins, and nuts. Invest in a 12V cooler and a portable slow cooker. Meal prep on your days off. Your body is your most important vehicle.' },
        { t: 'Dehydration', b: 'Many drivers limit water to avoid bathroom stops. This impairs concentration, increases fatigue, and raises blood pressure. Aim for 64 oz daily. Keep a refillable bottle within reach. Clear or light-yellow urine means you\'re on track.' },
        { t: 'UV Exposure', b: 'The left arm, left side of the face, and left hand get significantly more UV exposure. Studies show truckers develop more skin cancers on their left side. Wear sunscreen (SPF 30+), UV-blocking sleeves, and consider window tint within legal limits.' },
        { t: 'Hearing Damage', b: 'Wind noise, engine drone, and loud music through earbuds cause gradual hearing loss. Use noise-canceling headsets at reasonable volumes. Get hearing checked annually. Protect the senses that keep you safe.' },
        { t: 'Sedentary Lifestyle Risks', b: 'Sitting is the new smoking. Drivers have 2x the risk of cardiovascular disease. Combat this with resistance bands in the cab, walking during breaks, bodyweight exercises (push-ups, squats, lunges) at rest stops. Even 15 minutes makes a difference.' }
      ]
    },
    3: {
      title: 'Mental Health & Emotional Wellness',
      intro: 'The road can be a lonely place. Studies show truck drivers experience depression at rates nearly 2x the national average. Your mental health matters just as much as your CDL physical.',
      cards: [
        { t: 'Isolation & Loneliness', b: 'Weeks away from family and friends erode emotional well-being. Schedule regular video calls — not just phone calls. Join trucker communities online (forums, Discord, CB groups). Some drivers travel with a pet for companionship. Connection is not optional — it\'s survival.' },
        { t: 'Anxiety & Depression', b: 'Tight deadlines, traffic, weather, and financial pressure pile up. Symptoms: persistent sadness, irritability, loss of interest, changes in appetite or sleep, feeling hopeless. These are not weakness — they are medical conditions with effective treatments.' },
        { t: 'Family Separation Strain', b: 'Missing birthdays, holidays, and milestones creates guilt and grief. Be intentional about home time — quality over quantity. Leave voice messages for your kids to wake up to. Create shared playlists or photo albums. Include your family in your journey.' },
        { t: 'Stress Management Techniques', b: 'Chronic stress raises cortisol, impairs judgment, and degrades health. Proven techniques: deep breathing (4-7-8 method), audiobooks, music therapy, mindfulness apps (Headspace, Calm), journaling. Even 5 minutes of intentional calm resets your nervous system.' }
      ],
      extra: '<div class="card" style="border-color:rgba(248,113,113,0.3)"><h3 style="color:var(--red)">You Are Not Alone</h3><p>If you or someone you know is struggling, help is available 24/7:</p><p style="margin-top:8px"><strong>988 Lifeline</strong> — Call or text 988<br><strong>Crisis Text Line</strong> — Text HOME to 741741<br><strong>SAMHSA Helpline</strong> — 1-800-662-4357<br><strong>Truckers Against Trafficking</strong> — 1-888-373-7888</p></div>'
    },
    4: {
      title: 'Road & Environmental Hazards',
      intro: 'The road throws everything at you — black ice, dense fog, 60 mph crosswinds, construction mazes. Preparation is what separates professionals from statistics.',
      cards: [
        { t: 'Ice & Winter Conditions', b: 'Black ice forms on bridges and overpasses first. Reduce speed by 1/3 in snow, 1/2 on ice. Increase following distance to 8-10 seconds. If you start sliding, steer into the skid — don\'t brake hard. Carry chains and know your state chain laws. In California, Caltrans enforces R-1 (chains or snow tires), R-2 (chains required except 4WD with snow tires), and R-3 (road closed).' },
        { t: 'Dense Fog', b: 'Fog kills depth perception and speed judgment. Use LOW beams only — high beams reflect off fog and blind you. Reduce speed significantly. Use fog lines (right edge) as your guide. Turn off cruise control. Listen for traffic you can\'t see. Pull fully off if visibility is under 200 ft.' },
        { t: 'High Crosswinds', b: 'Empty trailers are most susceptible. Crosswinds above 40 mph can roll an empty trailer. Reduce speed, grip at 9 and 3. Watch for bridges, overpasses, open plains, desert stretches, and mountain gaps.' },
        { t: 'Construction Zones', b: 'Narrow lanes, shifting patterns, sudden stops. Fines are doubled in work zones — California and federal law both enforce enhanced penalties. CHP actively enforces Caltrans construction zones. Reduce speed before entering, increase following distance to 6+ seconds, and stay in your lane.' },
        { t: 'Wildlife Crossings', b: 'Deer-vehicle collisions peak at dawn and dusk, especially Oct-Dec. If you see one deer, expect more. Do NOT swerve for small animals — a rollover is worse.' },
        { t: 'Tire Blowouts', b: 'A steer tire blowout at highway speed is one of the most dangerous events. Do NOT slam the brakes. Accelerate slightly to maintain control, then gradually slow down. Check tire pressure daily (gauge, not thump). Inspect for cuts, bulges, and uneven wear.' }
      ]
    },
    5: {
      title: 'Defensive Driving & Situational Awareness',
      intro: 'You can\'t control other drivers. You can control your response. Defensive driving isn\'t passive — it\'s the most proactive thing you can do to come home safe every night.',
      cards: [
        { t: 'The Space Cushion', b: 'Maintain a minimum 7-second following distance at highway speeds. In bad weather, double it. Space is time, and time is survival. Never let yourself get boxed in — always have an escape route.' },
        { t: 'Mirror Scanning Pattern', b: 'Check mirrors every 5-8 seconds in a systematic pattern: left mirror, road ahead, right mirror, road ahead, instruments. Before any lane change, check mirrors AND turn your head.' },
        { t: 'Eliminate Distractions', b: 'A phone at 55 mph means 100+ yards of blindness per glance. Mount your phone, use voice commands, set your GPS before rolling. One task: drive.' },
        { t: 'Night Driving Protocol', b: 'Night cuts visibility by 50% but only reduces traffic by 25%. Over-drive your headlights and you can\'t stop in time. Slow down at night. Keep your windshield clean.' },
        { t: 'Intersection Awareness', b: 'Even with a green light, scan left-right-left before entering intersections. Run-the-red collisions are among the deadliest. Cover the brake when approaching stale greens.' },
        { t: 'Reading Traffic Flow', b: 'Look 15-20 seconds ahead — not just at the vehicle in front of you. Watch brake lights cascading. The best drivers react to what\'s about to happen, not what already has.' }
      ]
    },
    6: {
      title: 'Emergency Preparedness',
      intro: 'When the unexpected happens — and it will — your preparation determines the outcome. Every minute counts. Have a plan, have the gear, have the knowledge.',
      cards: [
        { t: 'Breakdown Kit Essentials', b: 'Reflective triangles (3 minimum — per 49 CFR 393.95), high-visibility vest, heavy-duty flashlight + extra batteries, jumper cables / jump pack, basic tool kit (wrenches, pliers, screwdrivers), tire pressure gauge, duct tape and zip ties, fire extinguisher (ABC rated — per 49 CFR 393.95), and spare fuses.' },
        { t: 'First Aid Kit', b: 'Bandages, gauze, medical tape, antiseptic wipes and ointment, pain relievers (ibuprofen, acetaminophen), tourniquet, CPR face shield, emergency blanket (mylar), prescription medications (extra supply), and allergy medication (Benadryl).' },
        { t: 'Communication Plan', b: 'Phone charger + backup battery pack, emergency contacts card (laminated, in cab), company dispatch number memorized, insurance and registration accessible, CB radio operational (channel 19), and roadside assistance membership.' },
        { t: 'Roadside Safety Protocol', b: '1) Pull completely off the roadway — as far right as possible. 2) Turn on hazard flashers immediately. 3) Put on your high-visibility vest before exiting. 4) Set triangles: 10 ft, 100 ft, and 200 ft behind truck. 5) Stay on the passenger side (away from traffic). 6) Call for help: dispatch, roadside assistance, 911. 7) Never attempt repairs in a traffic lane. 8) If rear-end risk, exit cab — stand well clear of truck.' }
      ],
      extra: `
        <p style="font-size:0.78rem;color:var(--green);font-weight:500;text-align:center;margin:16px 0 6px">Each checklist is free to download and print — keep them in your cab.</p>
        <button class="btn-m" id="shareChecklists" style="width:100%;margin-bottom:20px;justify-content:center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share / Save All Checklists
        </button>

        <div class="card" style="border-color:rgba(99,102,241,0.15);background:linear-gradient(135deg,rgba(99,102,241,0.04),rgba(244,114,182,0.03));text-align:center;padding:24px 18px">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <h3 style="font-size:1rem;margin-bottom:6px">Stay Road-Ready Every Month</h3>
          <p style="font-size:0.82rem;color:var(--text-2);margin-bottom:14px;line-height:1.5">Join the <strong>Mile 12 Warrior Newsletter</strong> — free monthly safety tips, FMCSA updates, exclusive checklists, and community stories.</p>
          <div style="display:flex;flex-direction:column;gap:8px">
            <input class="form-input-m" id="nlNameMobile" placeholder="Your name" style="border-radius:var(--radius-sm)">
            <input class="form-input-m" id="nlEmailMobile" type="email" placeholder="you@example.com" style="border-radius:var(--radius-sm)">
            <button class="btn-m" id="nlSubmitMobile" style="width:100%;justify-content:center">Subscribe — It's Free</button>
          </div>
          <p id="nlSuccessMobile" style="color:var(--green);font-size:0.82rem;margin-top:10px;display:none">You're in! Check your inbox.</p>
          <p style="font-size:0.65rem;color:var(--text-3);margin-top:8px">No spam, ever. Unsubscribe anytime. <a style="color:var(--text-3);cursor:pointer" onclick="app.navigate('privacy')">Privacy Policy</a></p>

          <div style="display:flex;align-items:center;gap:10px;margin:16px auto 12px;max-width:260px">
            <span style="flex:1;height:1px;background:var(--border)"></span>
            <span style="font-size:0.72rem;color:var(--text-3)">or reach out directly</span>
            <span style="flex:1;height:1px;background:var(--border)"></span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;align-items:center">
            <a href="mailto:joyce@mile12warrior.com" style="color:var(--text-2);font-size:0.85rem">joyce@mile12warrior.com</a>
            <a href="tel:+19162927411" style="color:var(--text-2);font-size:0.85rem">(916) 292-7411</a>
          </div>
        </div>`
    },
    7: {
      title: 'Your Daily Wellness Action Plan',
      intro: 'Knowledge without action is just information. Use these daily rituals to turn this roadmap into a lifestyle. Consistency compounds.',
      cards: [
        { t: 'Morning Routine', b: 'Drink 16 oz of water before coffee. 5-minute stretch: back, hips, shoulders. Eat a protein-rich breakfast. Complete pre-trip inspection (FMCSA DVIR — 49 CFR 396.11). Check weather and road conditions. Set GPS and review construction alerts. Call or text one family member/friend.' },
        { t: 'On the Road', b: 'Maintain 7-second following distance. Mirror check every 5-8 seconds. Stop every 2 hours: walk, stretch, hydrate. Eat a balanced meal (not just fast food). Monitor fatigue level honestly. Stay off the phone.' },
        { t: 'Evening Wind-Down', b: 'Post-trip inspection and DVIR (49 CFR 396.11). 15-minute walk or exercise. Video call with family. Limit screen time 1 hour before sleep. Practice 4-7-8 breathing. Set cab temperature for quality sleep. Aim for 7-8 hours uninterrupted sleep.' },
        { t: 'Cab-Friendly Exercises', b: 'No gym? No problem. Done at any rest stop in under 15 minutes. Push-ups (3 × 10), Squats (3 × 15), Lunges (2 × 10/leg), Plank (3 × 30s), Band Rows (3 × 12), Calf Raises (3 × 20).' }
      ]
    }
  };

  const data = phaseContent[id];
  if (!data) {
    return { html: '<div class="page page-enter"><button class="back-btn">&#8592; Back</button><p class="empty-state-m">Phase not found.</p></div>', init: () => { document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('roadmap')); } };
  }

  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="roadmap">&#8592; Roadmap</button>
  <div class="page-header">
    <p style="font-family:var(--mono);font-size:0.72rem;color:var(--text-3);margin-bottom:4px">Phase 0${id}</p>
    <h1 class="page-title">${escapeHtml(data.title)}</h1>
    <p class="page-subtitle">${escapeHtml(data.intro)}</p>
  </div>
  ${data.cards.map(c => `<div class="card"><h3>${escapeHtml(c.t)}</h3><p>${escapeHtml(c.b)}</p></div>`).join('')}
  ${data.extra || ''}
  <p style="margin-top:16px;font-size:0.75rem;color:var(--text-3);text-align:center">Verify current regulations at fmcsa.dot.gov or dot.ca.gov</p>
</div>`;

  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('roadmap'));

    document.getElementById('shareChecklists')?.addEventListener('click', () => {
      const text = data.cards.map(c => c.t + ':\n' + c.b).join('\n\n');
      const full = 'Mile 12 Warrior — Emergency Checklists\n\n' + text +
        '\n\n© 2026 Mile 12 Warrior LLC. Verify regulations at fmcsa.dot.gov. mile12warrior.com';
      if (navigator.share) {
        navigator.share({ title: 'Mile 12 Warrior Checklists', text: full }).catch(() => {});
      } else {
        navigator.clipboard.writeText(full).then(() => app.toast('Checklists copied!')).catch(() => app.toast('Could not copy'));
      }
    });

    document.getElementById('nlSubmitMobile')?.addEventListener('click', async () => {
      const name = document.getElementById('nlNameMobile')?.value.trim();
      const email = document.getElementById('nlEmailMobile')?.value.trim();
      if (!name || !email) { app.toast('Please enter name and email.'); return; }
      try {
        await api.sendMessage(name, email, 'Newsletter Subscription', name + ' (' + email + ') subscribed to the monthly newsletter via mobile app.');
        document.getElementById('nlSuccessMobile').style.display = 'block';
        document.getElementById('nlNameMobile').style.display = 'none';
        document.getElementById('nlEmailMobile').style.display = 'none';
        document.getElementById('nlSubmitMobile').style.display = 'none';
        app.toast('Subscribed!');
      } catch (e) { app.toast(e.message || 'Failed to subscribe.'); }
    });
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 6. BLOG (listing)
// ---------------------------------------------------------------------------
pages.blog = () => {
  const html = `
<div class="page page-enter">
  <div class="page-header">
    <h1 class="page-title">Blog</h1>
    <p class="page-subtitle">Articles, tips, and stories from the road.</p>
  </div>
  <div id="blogList"></div>
</div>`;

  const init = async () => {
    const container = document.getElementById('blogList');
    if (!container) return;
    try {
      const posts = await api.getPosts();
      const list = posts.posts || posts;
      if (!list.length) { container.innerHTML = '<p class="empty-state-m">No posts yet.</p>'; return; }
      container.innerHTML = list.map(p => `
        <div class="blog-item" data-slug="${escapeHtml(p.slug)}">
          <div class="blog-thumb">&#128221;</div>
          <div class="blog-info">
            <h3>${escapeHtml(p.title)}</h3>
            <p>${formatDate(p.created_at)}${p.author ? ' &bull; ' + escapeHtml(p.author) : ''}</p>
          </div>
        </div>`).join('');
      container.querySelectorAll('.blog-item').forEach(el => {
        el.addEventListener('click', () => app.navigate('blog-post', el.dataset.slug));
      });
    } catch (_) {
      container.innerHTML = '<p class="empty-state-m">Could not load posts.</p>';
    }
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 7. BLOG POST (single)
// ---------------------------------------------------------------------------
pages.blogPost = (slug) => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="blog">&#8592; Blog</button>
  <div id="blogPostContent"><p class="empty-state-m">Loading...</p></div>
  <div class="divider"></div>
  <h3 class="section-title-m">Comments</h3>
  <div id="commentsSection"></div>
  <div id="commentForm"></div>
</div>`;

  const init = async () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('blog'));
    const content = document.getElementById('blogPostContent');
    const comments = document.getElementById('commentsSection');
    const formWrap = document.getElementById('commentForm');

    try {
      const data = await api.getPost(slug);
      const post = data.post || data;
      content.innerHTML = `
        <div class="blog-full">
          <h1>${escapeHtml(post.title)}</h1>
          <div class="post-meta">${formatDate(post.created_at)}${post.author ? ' &bull; ' + escapeHtml(post.author) : ''}</div>
          <div class="post-body">${(post.content || '').split('\n\n').map(p => '<p>' + escapeHtml(p) + '</p>').join('')}</div>
        </div>`;

      const postComments = post.comments || [];
      const renderComments = (list) => {
        if (!list.length) { comments.innerHTML = '<p class="empty-state-m">No comments yet. Be the first!</p>'; return; }
        comments.innerHTML = list.map(c => `
          <div class="reply-item-m">
            <div class="reply-head-m">
              <span class="reply-author-m">${escapeHtml(c.author || c.username || 'Anonymous')}</span>
              <span class="reply-date-m">${formatDate(c.created_at)}</span>
            </div>
            <div class="reply-body-m">${escapeHtml(c.content)}</div>
          </div>`).join('');
      };
      renderComments(postComments);

      if (app.user) {
        formWrap.innerHTML = `
          <div style="margin-top:14px">
            <div class="form-group-m"><textarea class="form-input-m" id="commentInput" placeholder="Write a comment..." rows="3"></textarea></div>
            <button class="btn-m" id="postCommentBtn">Post Comment</button>
            <p class="form-error-m" id="commentError"></p>
          </div>`;
        document.getElementById('postCommentBtn')?.addEventListener('click', async () => {
          const input = document.getElementById('commentInput');
          const err = document.getElementById('commentError');
          const text = input?.value.trim();
          if (!text) { err.textContent = 'Please write a comment.'; return; }
          try {
            err.textContent = '';
            await api.addComment(slug, text);
            input.value = '';
            const fresh = await api.getPost(slug);
            renderComments((fresh.post || fresh).comments || []);
            app.toast('Comment posted!');
          } catch (e) { err.textContent = e.message || 'Failed to post comment.'; }
        });
      }
    } catch (_) {
      content.innerHTML = '<p class="empty-state-m">Could not load post.</p>';
    }
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 8. FORUM (categories)
// ---------------------------------------------------------------------------
pages.forum = () => {
  const html = `
<div class="page page-enter">
  <div class="page-header">
    <div class="flex-between">
      <h1 class="page-title">Community Forum</h1>
      <span id="newThreadNav"></span>
    </div>
    <p class="page-subtitle">Connect with fellow drivers.</p>
  </div>
  <div id="forumCats"></div>
</div>`;

  const init = async () => {
    if (app.user) {
      const nav = document.getElementById('newThreadNav');
      if (nav) nav.innerHTML = '<button class="btn-m" id="newThreadBtn" style="font-size:0.75rem;padding:8px 14px">+ New Thread</button>';
      document.getElementById('newThreadBtn')?.addEventListener('click', () => app.navigate('forum-new-thread'));
    }

    const container = document.getElementById('forumCats');
    if (!container) return;
    try {
      const data = await api.getCategories();
      const cats = data.categories || data;
      if (!cats.length) { container.innerHTML = '<p class="empty-state-m">No categories yet.</p>'; return; }
      container.innerHTML = cats.map(c => `
        <div class="forum-cat-item" data-slug="${escapeHtml(c.slug)}">
          <div class="cat-icon">&#128488;</div>
          <div class="cat-info">
            <h3>${escapeHtml(c.name)}</h3>
            <p>${escapeHtml(c.description || '')}</p>
          </div>
          <div class="cat-count">${c.thread_count || 0}</div>
        </div>`).join('');
      container.querySelectorAll('.forum-cat-item').forEach(el => {
        el.addEventListener('click', () => app.navigate('forum-category', el.dataset.slug));
      });
    } catch (_) {
      container.innerHTML = '<p class="empty-state-m">Could not load categories.</p>';
    }
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 9. FORUM CATEGORY (threads list)
// ---------------------------------------------------------------------------
pages.forumCategory = (slug) => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="forum">&#8592; Forum</button>
  <div class="page-header">
    <h1 class="page-title" id="catTitle">Category</h1>
  </div>
  <div id="threadsList"></div>
</div>`;

  const init = async () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('forum'));
    const container = document.getElementById('threadsList');
    const titleEl = document.getElementById('catTitle');
    if (!container) return;
    try {
      const data = await api.getCategory(slug);
      const cat = data.category || data;
      if (titleEl) titleEl.textContent = cat.name || 'Category';
      const threads = cat.threads || [];
      if (!threads.length) { container.innerHTML = '<p class="empty-state-m">No threads yet.</p>'; return; }
      container.innerHTML = threads.map(t => `
        <div class="thread-item-m" data-slug="${escapeHtml(t.slug)}">
          <div class="thread-title-m">${t.is_pinned ? '<span class="badge-m badge-pinned">Pinned</span> ' : ''}${t.is_locked ? '<span class="badge-m badge-locked">Locked</span> ' : ''}${escapeHtml(t.title)}</div>
          <div class="thread-meta-m">${escapeHtml(t.author || t.username || '')} &bull; ${formatDate(t.created_at)} &bull; ${t.reply_count || 0} replies</div>
        </div>`).join('');
      container.querySelectorAll('.thread-item-m').forEach(el => {
        el.addEventListener('click', () => app.navigate('forum-thread', el.dataset.slug));
      });
    } catch (_) {
      container.innerHTML = '<p class="empty-state-m">Could not load threads.</p>';
    }
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 10. FORUM THREAD (single)
// ---------------------------------------------------------------------------
pages.forumThread = (slug) => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="forum">&#8592; Forum</button>
  <div id="threadContent"><p class="empty-state-m">Loading...</p></div>
  <div id="replyForm"></div>
</div>`;

  const init = async () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('forum'));
    const content = document.getElementById('threadContent');
    const formWrap = document.getElementById('replyForm');

    try {
      const data = await api.getThread(slug);
      const thread = data.thread || data;
      const replies = thread.replies || [];

      const renderReplies = (list) => list.map(r => `
        <div class="reply-item-m">
          <div class="reply-head-m">
            <span class="reply-author-m">${escapeHtml(r.author || r.username || 'Anonymous')}</span>
            <span class="reply-date-m">${formatDate(r.created_at)}</span>
          </div>
          <div class="reply-body-m">${escapeHtml(r.content)}</div>
        </div>`).join('');

      content.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">${escapeHtml(thread.title)}</h1>
          <p class="page-subtitle" style="font-family:var(--mono);font-size:0.72rem">${escapeHtml(thread.author || thread.username || '')} &bull; ${formatDate(thread.created_at)}${thread.is_locked ? ' &bull; <span class="badge-m badge-locked">Locked</span>' : ''}</p>
        </div>
        <div class="card"><p>${escapeHtml(thread.content)}</p></div>
        <h3 class="section-title-m" style="margin-top:18px">Replies (${replies.length})</h3>
        <div id="repliesList">${replies.length ? renderReplies(replies) : '<p class="empty-state-m">No replies yet.</p>'}</div>`;

      if (app.user && !thread.is_locked) {
        formWrap.innerHTML = `
          <div style="margin-top:14px">
            <div class="form-group-m"><textarea class="form-input-m" id="replyInput" placeholder="Write a reply..." rows="3"></textarea></div>
            <button class="btn-m" id="postReplyBtn">Post Reply</button>
            <p class="form-error-m" id="replyError"></p>
          </div>`;
        document.getElementById('postReplyBtn')?.addEventListener('click', async () => {
          const input = document.getElementById('replyInput');
          const err = document.getElementById('replyError');
          const text = input?.value.trim();
          if (!text) { err.textContent = 'Please write a reply.'; return; }
          try {
            err.textContent = '';
            await api.addReply(slug, text);
            input.value = '';
            const fresh = await api.getThread(slug);
            const freshThread = fresh.thread || fresh;
            const list = document.getElementById('repliesList');
            if (list) list.innerHTML = renderReplies(freshThread.replies || []);
            app.toast('Reply posted!');
          } catch (e) { err.textContent = e.message || 'Failed to post reply.'; }
        });
      }
    } catch (_) {
      content.innerHTML = '<p class="empty-state-m">Could not load thread.</p>';
    }
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 11. FORUM NEW THREAD
// ---------------------------------------------------------------------------
pages.forumNewThread = () => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="forum">&#8592; Forum</button>
  <div class="page-header">
    <h1 class="page-title">New Thread</h1>
  </div>
  <div class="form-group-m">
    <label class="form-label-m">Category</label>
    <select class="form-input-m" id="ntCategory"><option value="">Loading...</option></select>
  </div>
  <div class="form-group-m">
    <label class="form-label-m">Title</label>
    <input class="form-input-m" id="ntTitle" placeholder="Thread title">
  </div>
  <div class="form-group-m">
    <label class="form-label-m">Content</label>
    <textarea class="form-input-m" id="ntContent" placeholder="What's on your mind?" rows="5"></textarea>
  </div>
  <button class="btn-m" id="ntSubmit" style="width:100%">Post Thread</button>
  <p class="form-error-m" id="ntError"></p>
</div>`;

  const init = async () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('forum'));
    const sel = document.getElementById('ntCategory');
    try {
      const data = await api.getCategories();
      const cats = data.categories || data;
      sel.innerHTML = '<option value="">Select a category</option>' + cats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    } catch (_) {
      sel.innerHTML = '<option value="">Could not load categories</option>';
    }

    document.getElementById('ntSubmit')?.addEventListener('click', async () => {
      const catId = sel.value;
      const title = document.getElementById('ntTitle')?.value.trim();
      const content = document.getElementById('ntContent')?.value.trim();
      const err = document.getElementById('ntError');
      if (!catId || !title || !content) { err.textContent = 'All fields are required.'; return; }
      try {
        err.textContent = '';
        const res = await api.createThread(catId, title, content);
        const thread = res.thread || res;
        app.toast('Thread created!');
        app.navigate('forum-thread', thread.slug);
      } catch (e) { err.textContent = e.message || 'Failed to create thread.'; }
    });
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 12. SHOP (product listing)
// ---------------------------------------------------------------------------
pages.shop = () => {
  const html = `
<div class="page page-enter">
  <div class="page-header">
    <h1 class="page-title">Merch Shop</h1>
    <p class="page-subtitle">Gear that fuels the warrior in you.</p>
  </div>
  <div class="product-grid-m" id="productGrid"></div>
  <p style="font-size:0.68rem;color:var(--text-3);text-align:center;margin-top:20px;line-height:1.5">All sales in USD. Subject to <a style="color:var(--text-3);cursor:pointer" onclick="app.navigate('terms')">Terms of Service</a>. Returns within 30 days. Sales tax collected per California law.</p>
</div>`;

  const init = async () => {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    try {
      const data = await api.getProducts();
      const products = data.products || data;
      if (!products.length) { grid.innerHTML = '<p class="empty-state-m" style="grid-column:1/-1">No products yet.</p>'; return; }
      grid.innerHTML = products.map(p => `
        <div class="product-card-m" data-slug="${escapeHtml(p.slug)}" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}">
          <div class="product-img-m">&#128085;</div>
          <div class="product-info-m">
            <div class="product-name-m">${escapeHtml(p.name)}</div>
            <div class="product-price-m">$${Number(p.price).toFixed(2)}</div>
            <button class="btn-m add-cart-btn" style="width:100%;margin-top:8px;font-size:0.75rem;padding:8px">Add to Cart</button>
          </div>
        </div>`).join('');

      grid.querySelectorAll('.product-card-m').forEach(el => {
        el.querySelector('.add-cart-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          cart.add({ id: Number(el.dataset.id), name: el.dataset.name, price: Number(el.dataset.price), slug: el.dataset.slug });
          app.toast('Added to cart!');
          if (typeof app.updateCartBadge === 'function') app.updateCartBadge();
        });
        el.addEventListener('click', () => app.navigate('shop-product', el.dataset.slug));
      });
    } catch (_) {
      grid.innerHTML = '<p class="empty-state-m" style="grid-column:1/-1">Could not load products.</p>';
    }
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 13. SHOP PRODUCT (single)
// ---------------------------------------------------------------------------
pages.shopProduct = (slug) => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="shop">&#8592; Shop</button>
  <div id="productDetail"><p class="empty-state-m">Loading...</p></div>
</div>`;

  const init = async () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('shop'));
    const container = document.getElementById('productDetail');
    if (!container) return;
    try {
      const data = await api.getProduct(slug);
      const p = data.product || data;
      container.innerHTML = `
        <div style="background:var(--surface-2);border-radius:var(--radius);height:220px;display:flex;align-items:center;justify-content:center;font-size:4rem;color:var(--text-3);margin-bottom:18px">&#128085;</div>
        <h1 class="page-title">${escapeHtml(p.name)}</h1>
        <p style="font-family:var(--mono);font-size:1.2rem;font-weight:600;color:var(--green);margin:8px 0 14px">$${Number(p.price).toFixed(2)}</p>
        <p style="font-size:0.88rem;color:var(--text-2);line-height:1.65;margin-bottom:20px">${escapeHtml(p.description || '')}</p>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <label class="form-label-m" style="margin:0">Qty:</label>
          <input type="number" class="form-input-m" id="pdQty" value="1" min="1" max="99" style="width:70px;text-align:center">
        </div>
        <button class="btn-m" id="pdAddCart" style="width:100%">Add to Cart</button>`;

      document.getElementById('pdAddCart')?.addEventListener('click', () => {
        const qty = parseInt(document.getElementById('pdQty')?.value, 10) || 1;
        for (let i = 0; i < qty; i++) {
          cart.add({ id: p.id, name: p.name, price: p.price, slug: p.slug });
        }
        app.toast(`Added ${qty} to cart!`);
        if (typeof app.updateCartBadge === 'function') app.updateCartBadge();
      });
    } catch (_) {
      container.innerHTML = '<p class="empty-state-m">Could not load product.</p>';
    }
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 14. CART
// ---------------------------------------------------------------------------
pages.cart = () => {
  const renderCart = () => {
    const items = cart.getAll();
    if (!items.length) {
      return `
<div class="page page-enter">
  <div class="page-header"><h1 class="page-title">Your Cart</h1></div>
  <p class="empty-state-m">Your cart is empty.</p>
  <div style="text-align:center;margin-top:16px"><button class="btn-m btn-outline-m" id="continueShopping">Continue Shopping</button></div>
</div>`;
    }
    return `
<div class="page page-enter">
  <div class="page-header"><h1 class="page-title">Your Cart</h1></div>
  <div id="cartItems">${items.map(i => `
    <div class="cart-item-m" data-id="${i.product_id}">
      <div class="cart-info-m">
        <div class="cart-name-m">${escapeHtml(i.name)}</div>
        <div class="cart-price-m">$${Number(i.price).toFixed(2)}</div>
      </div>
      <div class="cart-qty-m">
        <button class="qty-btn-m" data-action="dec">-</button>
        <span>${i.quantity}</span>
        <button class="qty-btn-m" data-action="inc">+</button>
        <button class="qty-btn-m" data-action="remove" style="color:var(--red);margin-left:6px">&#10005;</button>
      </div>
    </div>`).join('')}</div>
  <div class="cart-total-m">Total: $${cart.total().toFixed(2)}</div>
  <div style="display:flex;gap:10px;margin-top:14px">
    <button class="btn-m btn-outline-m" id="continueShopping" style="flex:1">Continue Shopping</button>
    <button class="btn-m" id="checkoutBtn" style="flex:1">Checkout</button>
  </div>
</div>`;
  };

  const html = renderCart();

  const init = () => {
    document.getElementById('continueShopping')?.addEventListener('click', () => app.navigate('shop'));
    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
      if (!app.user) { app.toast('Please sign in to checkout.'); app.navigate('login'); return; }
      app.navigate('checkout');
    });

    document.querySelectorAll('.qty-btn-m').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.cart-item-m');
        const id = Number(row.dataset.id);
        const action = btn.dataset.action;
        const items = cart.getAll();
        const item = items.find(i => i.product_id === id);
        if (!item) return;
        if (action === 'inc') cart.updateQty(id, item.quantity + 1);
        else if (action === 'dec') cart.updateQty(id, item.quantity - 1);
        else if (action === 'remove') cart.remove(id);
        if (typeof app.updateCartBadge === 'function') app.updateCartBadge();
        const appEl = document.getElementById('app');
        const result = pages.cart();
        appEl.innerHTML = result.html;
        result.init();
      });
    });
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 15. CHECKOUT
// ---------------------------------------------------------------------------
pages.checkout = () => {
  const items = cart.getAll();
  const total = cart.total();

  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="cart">&#8592; Cart</button>
  <div class="page-header"><h1 class="page-title">Checkout</h1></div>

  <h3 class="section-title-m">Order Summary</h3>
  ${items.map(i => `<div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:6px 0;border-bottom:1px solid var(--border)"><span>${escapeHtml(i.name)} &times; ${i.quantity}</span><span style="font-family:var(--mono);color:var(--green)">$${(i.price * i.quantity).toFixed(2)}</span></div>`).join('')}
  <div style="text-align:right;font-family:var(--mono);font-weight:600;font-size:1.1rem;padding:12px 0">$${total.toFixed(2)}</div>

  <div class="divider"></div>
  <h3 class="section-title-m">Shipping Information</h3>
  <div class="form-group-m"><label class="form-label-m">Full Name</label><input class="form-input-m" id="coName" placeholder="Full name"></div>
  <div class="form-group-m"><label class="form-label-m">Address</label><input class="form-input-m" id="coAddress" placeholder="Street address"></div>
  <div style="display:flex;gap:10px">
    <div class="form-group-m" style="flex:2"><label class="form-label-m">City</label><input class="form-input-m" id="coCity" placeholder="City"></div>
    <div class="form-group-m" style="flex:1"><label class="form-label-m">State</label><input class="form-input-m" id="coState" placeholder="CA"></div>
    <div class="form-group-m" style="flex:1"><label class="form-label-m">Zip</label><input class="form-input-m" id="coZip" placeholder="95816"></div>
  </div>
  <button class="btn-m" id="placeOrderBtn" style="width:100%;margin-top:10px">Place Order</button>
  <p class="form-error-m" id="coError"></p>
</div>`;

  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('cart'));

    if (!app.user) { app.toast('Please sign in to checkout.'); app.navigate('login'); return; }

    document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('coName')?.value.trim();
      const address = document.getElementById('coAddress')?.value.trim();
      const city = document.getElementById('coCity')?.value.trim();
      const state = document.getElementById('coState')?.value.trim();
      const zip = document.getElementById('coZip')?.value.trim();
      const err = document.getElementById('coError');
      if (!name || !address || !city || !state || !zip) { err.textContent = 'All shipping fields are required.'; return; }

      try {
        err.textContent = '';
        const orderItems = cart.getAll().map(i => ({ product_id: i.product_id, quantity: i.quantity }));
        await api.placeOrder(orderItems, { name, address, city, state, zip });
        cart.clear();
        if (typeof app.updateCartBadge === 'function') app.updateCartBadge();
        const appEl = document.getElementById('app');
        appEl.innerHTML = '<div class="page page-enter"><div class="empty-state-m" style="padding-top:80px"><p style="font-size:1.5rem;margin-bottom:10px">&#10004;</p><h3 style="margin-bottom:6px">Order Placed!</h3><p>Thank you for your purchase.</p></div></div>';
        setTimeout(() => app.navigate('profile'), 2000);
      } catch (e) { err.textContent = e.message || 'Failed to place order.'; }
    });
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 16. LOGIN
// ---------------------------------------------------------------------------
pages.login = () => {
  const html = `
<div class="page page-enter">
  <div class="auth-container">
    <div class="auth-box">
      <h2>Sign In</h2>
      <div class="form-group-m"><label class="form-label-m">Username</label><input class="form-input-m" id="loginUser" placeholder="Your username" autocomplete="username"></div>
      <div class="form-group-m"><label class="form-label-m">Password</label><input class="form-input-m" id="loginPass" type="password" placeholder="Your password" autocomplete="current-password"></div>
      <button class="form-btn-m" id="loginBtn">Sign In</button>
      <p class="form-error-m" id="loginError"></p>
      <p class="form-link-m">Don't have an account? <a href="#" id="goRegister">Register</a></p>
    </div>
  </div>
</div>`;

  const init = () => {
    document.getElementById('goRegister')?.addEventListener('click', (e) => { e.preventDefault(); app.navigate('register'); });
    document.getElementById('loginBtn')?.addEventListener('click', async () => {
      const username = document.getElementById('loginUser')?.value.trim();
      const password = document.getElementById('loginPass')?.value;
      const err = document.getElementById('loginError');
      if (!username || !password) { err.textContent = 'Username and password are required.'; return; }
      try {
        err.textContent = '';
        const data = await api.login(username, password);
        app.user = data.user || data;
        app.toast('Welcome back, ' + (app.user.username || username) + '!');
        app.navigate('profile');
      } catch (e) { err.textContent = e.message || 'Invalid credentials.'; }
    });

    document.getElementById('loginPass')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('loginBtn')?.click();
    });
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 17. REGISTER
// ---------------------------------------------------------------------------
pages.register = () => {
  const html = `
<div class="page page-enter">
  <div class="auth-container">
    <div class="auth-box">
      <h2>Create Account</h2>
      <div class="form-group-m"><label class="form-label-m">Username</label><input class="form-input-m" id="regUser" placeholder="Choose a username" autocomplete="username"></div>
      <div class="form-group-m"><label class="form-label-m">Email</label><input class="form-input-m" id="regEmail" type="email" placeholder="you@example.com" autocomplete="email"></div>
      <div class="form-group-m"><label class="form-label-m">Password</label><input class="form-input-m" id="regPass" type="password" placeholder="Create a password" autocomplete="new-password"></div>
      <div class="form-group-m"><label class="form-label-m">Confirm Password</label><input class="form-input-m" id="regPass2" type="password" placeholder="Confirm password" autocomplete="new-password"></div>
      <p style="font-size:0.72rem;color:var(--text-3);margin-bottom:12px;line-height:1.5;text-align:center">By creating an account, you agree to our <a style="color:var(--text-2);cursor:pointer" onclick="app.navigate('terms')">Terms of Service</a> and <a style="color:var(--text-2);cursor:pointer" onclick="app.navigate('privacy')">Privacy Policy</a>.</p>
      <button class="form-btn-m" id="regBtn">Register</button>
      <p class="form-error-m" id="regError"></p>
      <p class="form-link-m">Already have an account? <a href="#" id="goLogin">Sign In</a></p>
    </div>
  </div>
</div>`;

  const init = () => {
    document.getElementById('goLogin')?.addEventListener('click', (e) => { e.preventDefault(); app.navigate('login'); });
    document.getElementById('regBtn')?.addEventListener('click', async () => {
      const username = document.getElementById('regUser')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();
      const password = document.getElementById('regPass')?.value;
      const password2 = document.getElementById('regPass2')?.value;
      const err = document.getElementById('regError');
      if (!username || !email || !password) { err.textContent = 'All fields are required.'; return; }
      if (password !== password2) { err.textContent = 'Passwords do not match.'; return; }
      try {
        err.textContent = '';
        await api.register(username, email, password);
        app.toast('Account created! Welcome!');
        app.navigate('home');
      } catch (e) { err.textContent = e.message || 'Registration failed.'; }
    });

    document.getElementById('regPass2')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('regBtn')?.click();
    });
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 18. PROFILE
// ---------------------------------------------------------------------------
pages.profile = () => {
  const html = `
<div class="page page-enter">
  <div class="page-header"><h1 class="page-title">My cab</h1></div>
  <div id="profileContent"><p class="empty-state-m">Loading...</p></div>
</div>`;

  const init = async () => {
    const container = document.getElementById('profileContent');
    if (!container) return;

    if (!app.user) {
      try {
        const data = await api.me();
        app.user = data.user || data;
      } catch (_) {
        app.navigate('login');
        return;
      }
    }

    const u = app.user;
    const initial = (u.username || '?')[0].toUpperCase();

    container.innerHTML = `
      <div class="profile-head-m">
        <div class="profile-avatar-m">${initial}</div>
        <div>
          <div class="profile-name-m">${escapeHtml(u.username)}</div>
          <div class="profile-email-m">${escapeHtml(u.email || '')}</div>
          <div style="font-size:0.72rem;color:var(--text-3);margin-top:2px">Member since ${u.created_at ? formatDate(u.created_at) : 'N/A'}</div>
        </div>
      </div>

      <h3 class="section-title-m">Bio</h3>
      <div class="card" id="bioSection">
        <p id="bioText" style="font-size:0.88rem;color:var(--text-2)">${escapeHtml(u.bio || 'No bio yet.')}</p>
        <button class="btn-m btn-outline-m" id="editBioBtn" style="margin-top:10px;font-size:0.75rem;padding:8px 14px">Edit Bio</button>
        <div id="bioEditor" style="display:none;margin-top:10px">
          <textarea class="form-input-m" id="bioInput" rows="3">${escapeHtml(u.bio || '')}</textarea>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn-m" id="saveBioBtn" style="font-size:0.75rem;padding:8px 14px">Save</button>
            <button class="btn-m btn-outline-m" id="cancelBioBtn" style="font-size:0.75rem;padding:8px 14px">Cancel</button>
          </div>
        </div>
      </div>

      ${u.role === 'admin' ? '<div class="card" style="border-color:rgba(251,191,36,0.3)"><p style="color:var(--amber);font-size:0.85rem"><strong>Admin Account</strong> — For full admin dashboard features, please use the web version.</p></div>' : ''}

      <h3 class="section-title-m" style="margin-top:20px">Orders</h3>
      <div id="ordersList"><p class="empty-state-m">Loading orders...</p></div>

      <div style="margin-top:24px;text-align:center">
        <button class="btn-m btn-danger-m" id="signOutBtn" style="width:100%">Sign Out</button>
      </div>

      <div style="margin-top:32px;padding-top:16px;border-top:1px solid var(--border)">
        <h3 class="section-title-m" style="font-size:0.9rem">Legal</h3>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          <button class="btn-m btn-outline-m" style="font-size:0.72rem;padding:7px 12px" onclick="app.navigate('terms')">Terms of Service</button>
          <button class="btn-m btn-outline-m" style="font-size:0.72rem;padding:7px 12px" onclick="app.navigate('privacy')">Privacy Policy</button>
          <button class="btn-m btn-outline-m" style="font-size:0.72rem;padding:7px 12px" onclick="app.navigate('disclaimer-page')">Disclaimer</button>
          <button class="btn-m btn-outline-m" style="font-size:0.72rem;padding:7px 12px" onclick="app.navigate('accessibility-page')">Accessibility</button>
        </div>
      </div>`;

    document.getElementById('editBioBtn')?.addEventListener('click', () => {
      document.getElementById('bioEditor').style.display = 'block';
      document.getElementById('editBioBtn').style.display = 'none';
    });
    document.getElementById('cancelBioBtn')?.addEventListener('click', () => {
      document.getElementById('bioEditor').style.display = 'none';
      document.getElementById('editBioBtn').style.display = '';
    });
    document.getElementById('saveBioBtn')?.addEventListener('click', async () => {
      const bio = document.getElementById('bioInput')?.value.trim();
      try {
        await api.updateProfile(bio);
        app.user.bio = bio;
        document.getElementById('bioText').textContent = bio || 'No bio yet.';
        document.getElementById('bioEditor').style.display = 'none';
        document.getElementById('editBioBtn').style.display = '';
        app.toast('Bio updated!');
      } catch (e) { app.toast(e.message || 'Failed to update bio.'); }
    });

    document.getElementById('signOutBtn')?.addEventListener('click', async () => {
      try { await api.logout(); } catch (_) {}
      app.user = null;
      app.toast('Signed out.');
      app.navigate('home');
    });

    try {
      const data = await api.getOrders();
      const orders = data.orders || data;
      const ol = document.getElementById('ordersList');
      if (!ol) return;
      if (!orders.length) { ol.innerHTML = '<p class="empty-state-m">No orders yet.</p>'; return; }
      ol.innerHTML = orders.map(o => `
        <div class="card card-sm">
          <div class="flex-between">
            <span style="font-family:var(--mono);font-size:0.78rem;color:var(--text-3)">Order #${o.id}</span>
            <span style="font-family:var(--mono);font-size:0.78rem;color:var(--text-3)">${formatDate(o.created_at)}</span>
          </div>
          <div style="font-family:var(--mono);font-weight:600;color:var(--green);margin-top:4px">$${Number(o.total).toFixed(2)}</div>
          <div style="font-size:0.72rem;color:var(--text-3);margin-top:2px">${escapeHtml(o.status || 'pending')}</div>
        </div>`).join('');
    } catch (_) {
      const ol = document.getElementById('ordersList');
      if (ol) ol.innerHTML = '<p class="empty-state-m">Could not load orders.</p>';
    }
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// 19. CONTACT
// ---------------------------------------------------------------------------
pages.contact = () => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="home">&#8592; Home</button>
  <div class="page-header">
    <h1 class="page-title">Contact Us</h1>
    <p class="page-subtitle">Have a question, idea, or just want to say hi? We'd love to hear from you.</p>
  </div>

  <div class="card" style="margin-bottom:20px">
    <h3>Get in Touch</h3>
    <p style="margin-top:8px"><strong>Email:</strong> joyce@mile12warrior.com</p>
    <p style="margin-top:4px"><strong>Phone:</strong> (916) 292-7411</p>
    <p style="margin-top:4px"><strong>Address:</strong> 2108 N St. #8325, Sacramento, CA 95816</p>
    <p style="margin-top:8px;font-size:0.78rem;color:var(--text-3)">Facebook &bull; X (Twitter) &bull; Instagram &bull; TikTok</p>
  </div>

  <h3 class="section-title-m">Send a Message</h3>
  <div class="form-group-m"><label class="form-label-m">Name</label><input class="form-input-m" id="ctName" placeholder="Your name"></div>
  <div class="form-group-m"><label class="form-label-m">Email</label><input class="form-input-m" id="ctEmail" type="email" placeholder="you@example.com"></div>
  <div class="form-group-m"><label class="form-label-m">Subject</label><input class="form-input-m" id="ctSubject" placeholder="What's this about?"></div>
  <div class="form-group-m"><label class="form-label-m">Message</label><textarea class="form-input-m" id="ctMessage" placeholder="Your message..." rows="5"></textarea></div>
  <button class="btn-m" id="ctSubmit" style="width:100%">Send Message</button>
  <p class="form-error-m" id="ctError"></p>
  <p id="ctSuccess" style="color:var(--green);font-size:0.85rem;text-align:center;margin-top:10px;display:none">Message sent! We'll get back to you soon.</p>
</div>`;

  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('home'));
    document.getElementById('ctSubmit')?.addEventListener('click', async () => {
      const name = document.getElementById('ctName')?.value.trim();
      const email = document.getElementById('ctEmail')?.value.trim();
      const subject = document.getElementById('ctSubject')?.value.trim();
      const message = document.getElementById('ctMessage')?.value.trim();
      const err = document.getElementById('ctError');
      const success = document.getElementById('ctSuccess');
      if (!name || !email || !subject || !message) { err.textContent = 'All fields are required.'; success.style.display = 'none'; return; }
      try {
        err.textContent = '';
        await api.sendMessage(name, email, subject, message);
        success.style.display = 'block';
        document.getElementById('ctName').value = '';
        document.getElementById('ctEmail').value = '';
        document.getElementById('ctSubject').value = '';
        document.getElementById('ctMessage').value = '';
        app.toast('Message sent!');
      } catch (e) { err.textContent = e.message || 'Failed to send message.'; success.style.display = 'none'; }
    });
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// COURSE PAGE
// ---------------------------------------------------------------------------
pages.course = () => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="services">&#8592; Services</button>
  <div class="page-header">
    <h1 class="page-title">90-Day Onboarding Course</h1>
    <p class="page-subtitle">10 modules. 47 lessons. Everything they didn't teach you in CDL school.</p>
  </div>

  <div class="card" style="text-align:center;padding:24px;margin-bottom:16px;border-color:rgba(99,102,241,0.2)">
    <div style="font-family:var(--mono);font-size:2rem;font-weight:700;color:var(--accent)">$149</div>
    <div style="font-size:0.78rem;color:var(--text-3);margin-bottom:12px">One-time payment &middot; Module 1 always free</div>
    <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-bottom:16px">
      <div style="text-align:center"><div style="font-family:var(--mono);font-weight:700">10</div><div style="font-size:0.68rem;color:var(--text-3)">Modules</div></div>
      <div style="text-align:center"><div style="font-family:var(--mono);font-weight:700">47</div><div style="font-size:0.68rem;color:var(--text-3)">Lessons</div></div>
      <div style="text-align:center"><div style="font-family:var(--mono);font-weight:700">6-8</div><div style="font-size:0.68rem;color:var(--text-3)">Hours</div></div>
      <div style="text-align:center"><div style="font-family:var(--mono);font-weight:700">&#10003;</div><div style="font-size:0.68rem;color:var(--text-3)">Certificate</div></div>
    </div>
    <p style="font-size:0.78rem;color:var(--text-2);margin-bottom:12px">Access the full course on the web at <strong>mile12warrior.com/course</strong></p>
    <button class="btn-m" onclick="window.open('https://mile12warrior.com/course','_blank')" style="width:100%;font-size:0.88rem;padding:12px">Start the Course</button>
  </div>

  <h3 class="section-title-m">Course Modules</h3>

  <div class="card" style="border-left:3px solid var(--accent);margin-bottom:8px;padding:16px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-family:var(--mono);font-size:0.65rem;color:var(--accent)">MODULE 01 &middot; FREE PREVIEW</div>
        <div style="font-weight:600;font-size:0.92rem;margin-top:2px">Welcome & Your First 90 Days</div>
        <div style="font-size:0.72rem;color:var(--text-3)">4 lessons &middot; 4 quiz questions</div>
      </div>
      <span style="color:var(--accent);font-size:0.72rem;font-weight:600">FREE</span>
    </div>
  </div>
  <div class="card" style="margin-bottom:8px;padding:16px"><div style="font-family:var(--mono);font-size:0.65rem;color:var(--text-3)">MODULE 02</div><div style="font-weight:600;font-size:0.92rem;margin-top:2px">Hours of Service Mastery</div><div style="font-size:0.72rem;color:var(--text-3)">5 lessons &middot; 5 quiz questions &middot; 49 CFR Part 395</div></div>
  <div class="card" style="margin-bottom:8px;padding:16px"><div style="font-family:var(--mono);font-size:0.65rem;color:var(--text-3)">MODULE 03</div><div style="font-weight:600;font-size:0.92rem;margin-top:2px">Sleep & Fatigue Management</div><div style="font-size:0.72rem;color:var(--text-3)">5 lessons &middot; 4 quiz questions</div></div>
  <div class="card" style="margin-bottom:8px;padding:16px"><div style="font-family:var(--mono);font-size:0.65rem;color:var(--text-3)">MODULE 04</div><div style="font-weight:600;font-size:0.92rem;margin-top:2px">Physical Health on the Road</div><div style="font-size:0.72rem;color:var(--text-3)">5 lessons &middot; 4 quiz questions</div></div>
  <div class="card" style="margin-bottom:8px;padding:16px"><div style="font-family:var(--mono);font-size:0.65rem;color:var(--text-3)">MODULE 05</div><div style="font-weight:600;font-size:0.92rem;margin-top:2px">Mental Health & Emotional Wellness</div><div style="font-size:0.72rem;color:var(--text-3)">5 lessons &middot; 4 quiz questions</div></div>
  <div class="card" style="margin-bottom:8px;padding:16px"><div style="font-family:var(--mono);font-size:0.65rem;color:var(--text-3)">MODULE 06</div><div style="font-weight:600;font-size:0.92rem;margin-top:2px">Pre-Trip, Post-Trip & Vehicle Inspection</div><div style="font-size:0.72rem;color:var(--text-3)">5 lessons &middot; 5 quiz questions &middot; 49 CFR 396.11</div></div>
  <div class="card" style="margin-bottom:8px;padding:16px"><div style="font-family:var(--mono);font-size:0.65rem;color:var(--text-3)">MODULE 07</div><div style="font-weight:600;font-size:0.92rem;margin-top:2px">Emergency Preparedness</div><div style="font-size:0.72rem;color:var(--text-3)">5 lessons &middot; 5 quiz questions &middot; 49 CFR 393.95</div></div>
  <div class="card" style="margin-bottom:8px;padding:16px"><div style="font-family:var(--mono);font-size:0.65rem;color:var(--text-3)">MODULE 08</div><div style="font-weight:600;font-size:0.92rem;margin-top:2px">Defensive Driving Fundamentals</div><div style="font-size:0.72rem;color:var(--text-3)">5 lessons &middot; 5 quiz questions &middot; 49 CFR 392.82</div></div>
  <div class="card" style="margin-bottom:8px;padding:16px"><div style="font-family:var(--mono);font-size:0.65rem;color:var(--text-3)">MODULE 09</div><div style="font-weight:600;font-size:0.92rem;margin-top:2px">Your Daily Routine System</div><div style="font-size:0.72rem;color:var(--text-3)">4 lessons &middot; 4 quiz questions</div></div>
  <div class="card" style="margin-bottom:16px;padding:16px"><div style="font-family:var(--mono);font-size:0.65rem;color:var(--text-3)">MODULE 10</div><div style="font-weight:600;font-size:0.92rem;margin-top:2px">Your 90-Day Action Plan & Next Steps</div><div style="font-size:0.72rem;color:var(--text-3)">5 lessons &middot; 4 quiz questions &middot; Certificate of completion</div></div>

  <div class="card" style="padding:20px;text-align:center">
    <h3 style="font-size:1rem;margin-bottom:6px">What's Included</h3>
    <div style="font-size:0.82rem;color:var(--text-2);line-height:1.6">
      Complete HOS reference &middot; Fatigue management science &middot; Exercise programs &middot; Mental health resources &middot;
      Inspection training &middot; Emergency protocols &middot; Defensive driving &middot; Daily routine systems &middot;
      New Driver Packet (free) &middot; Certificate of completion
    </div>
  </div>

  ${LEGAL_FOOTER}
</div>`;

  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('services'));
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// SAFETY PACKETS
// ---------------------------------------------------------------------------
pages.packets = () => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="home">&#8592; Home</button>
  <div class="page-header">
    <h1 class="page-title">Safety Packets</h1>
    <p class="page-subtitle">Free, professional, print-ready packets for individual drivers and fleet safety departments. Download, print, and put them to work.</p>
  </div>

  <h3 class="section-title-m">Individual Driver Packets</h3>

  <div class="card" style="border-color:rgba(129,140,248,0.2);margin-bottom:12px">
    <div style="font-family:var(--mono);font-size:0.65rem;color:#818cf8;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">Tier 1 — New Driver</div>
    <h3 style="font-size:1rem;margin-bottom:6px">New Driver Packet</h3>
    <p style="font-size:0.82rem;color:var(--text-2);line-height:1.5;margin-bottom:12px">Your first 90 days — HOS fundamentals, essential checklists, daily routines, defensive driving basics, and mental health resources. 13 complete sections.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-m" id="dlNewDriver" style="font-size:0.78rem;padding:9px 16px">Download Free</button>
      <button class="btn-m btn-outline-m" id="shareNewDriver" style="font-size:0.78rem;padding:9px 16px">Share</button>
    </div>
  </div>

  <div class="card" style="border-color:rgba(52,211,153,0.2);margin-bottom:24px">
    <div style="font-family:var(--mono);font-size:0.65rem;color:#34d399;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">Tier 2 — Experienced Driver</div>
    <h3 style="font-size:1rem;margin-bottom:6px">Seasoned Driver Packet</h3>
    <p style="font-size:0.82rem;color:var(--text-2);line-height:1.5;margin-bottom:12px">For 2+ years experience — advanced fatigue science, health strategies, regulatory self-audit, career sustainability, and mentorship. 11 complete sections.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-m" id="dlSeasonedDriver" style="font-size:0.78rem;padding:9px 16px">Download Free</button>
      <button class="btn-m btn-outline-m" id="shareSeasonedDriver" style="font-size:0.78rem;padding:9px 16px">Share</button>
    </div>
  </div>

  <h3 class="section-title-m">Fleet Safety Department Packets</h3>
  <p style="font-size:0.78rem;color:var(--text-3);margin-bottom:14px;line-height:1.5">For safety directors — includes sign-off sheets and section acknowledgment forms for driver qualification files (per 49 CFR 391.51).</p>

  <div class="card" style="border-color:rgba(251,191,36,0.2);margin-bottom:12px">
    <div style="font-family:var(--mono);font-size:0.65rem;color:#fbbf24;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">Fleet — New Hire</div>
    <h3 style="font-size:1rem;margin-bottom:6px">New Hire Orientation Packet</h3>
    <p style="font-size:0.82rem;color:var(--text-2);line-height:1.5;margin-bottom:12px">Complete onboarding with FMCSA compliance, drug testing requirements, accident procedures, company policy templates, and formal driver sign-off sheet.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-m" id="dlFleetNewHire" style="font-size:0.78rem;padding:9px 16px">Download Free</button>
      <button class="btn-m btn-outline-m" id="shareFleetNewHire" style="font-size:0.78rem;padding:9px 16px">Share</button>
    </div>
  </div>

  <div class="card" style="border-color:rgba(244,114,182,0.2);margin-bottom:16px">
    <div style="font-family:var(--mono);font-size:0.65rem;color:#f472b6;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">Fleet — Refresher</div>
    <h3 style="font-size:1rem;margin-bottom:6px">Seasoned Driver Refresher Packet</h3>
    <p style="font-size:0.82rem;color:var(--text-2);line-height:1.5;margin-bottom:12px">Annual/semi-annual refresher with fatigue self-assessment, seasonal hazard calendar, regulatory self-audit, mentorship guidance, and sign-off sheet.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-m" id="dlFleetRefresher" style="font-size:0.78rem;padding:9px 16px">Download Free</button>
      <button class="btn-m btn-outline-m" id="shareFleetRefresher" style="font-size:0.78rem;padding:9px 16px">Share</button>
    </div>
  </div>

  <div class="card" style="text-align:center;padding:20px">
    <p style="font-size:0.85rem;color:var(--text-2);margin-bottom:10px">Need a custom packet for your fleet?</p>
    <button class="btn-m" onclick="app.navigate('contact')" style="font-size:0.78rem;padding:9px 16px">Contact Us</button>
  </div>

  ${LEGAL_FOOTER}
</div>`;

  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('home'));

    const shareText = (title) => 'Check out the free ' + title + ' from Mile 12 Warrior! Download at mile12warrior.com';

    document.getElementById('dlNewDriver')?.addEventListener('click', () => {
      if (typeof Packets !== 'undefined') { Packets.download('new-driver'); }
      else { app.toast('Visit mile12warrior.com to download packets.'); }
    });
    document.getElementById('dlSeasonedDriver')?.addEventListener('click', () => {
      if (typeof Packets !== 'undefined') { Packets.download('seasoned-driver'); }
      else { app.toast('Visit mile12warrior.com to download packets.'); }
    });
    document.getElementById('dlFleetNewHire')?.addEventListener('click', () => {
      if (typeof Packets !== 'undefined') { Packets.download('fleet-new-hire'); }
      else { app.toast('Visit mile12warrior.com to download packets.'); }
    });
    document.getElementById('dlFleetRefresher')?.addEventListener('click', () => {
      if (typeof Packets !== 'undefined') { Packets.download('fleet-refresher'); }
      else { app.toast('Visit mile12warrior.com to download packets.'); }
    });

    document.getElementById('shareNewDriver')?.addEventListener('click', () => {
      if (navigator.share) { navigator.share({ title: 'New Driver Safety Packet', text: shareText('New Driver Safety Packet'), url: 'https://mile12warrior.com/#packets' }).catch(() => {}); }
      else { navigator.clipboard.writeText(shareText('New Driver Safety Packet')).then(() => app.toast('Link copied!')); }
    });
    document.getElementById('shareSeasonedDriver')?.addEventListener('click', () => {
      if (navigator.share) { navigator.share({ title: 'Seasoned Driver Packet', text: shareText('Seasoned Driver Safety Packet'), url: 'https://mile12warrior.com/#packets' }).catch(() => {}); }
      else { navigator.clipboard.writeText(shareText('Seasoned Driver Safety Packet')).then(() => app.toast('Link copied!')); }
    });
    document.getElementById('shareFleetNewHire')?.addEventListener('click', () => {
      if (navigator.share) { navigator.share({ title: 'Fleet New Hire Packet', text: shareText('Fleet New Hire Orientation Packet'), url: 'https://mile12warrior.com/#packets' }).catch(() => {}); }
      else { navigator.clipboard.writeText(shareText('Fleet New Hire Orientation Packet')).then(() => app.toast('Link copied!')); }
    });
    document.getElementById('shareFleetRefresher')?.addEventListener('click', () => {
      if (navigator.share) { navigator.share({ title: 'Fleet Refresher Packet', text: shareText('Fleet Seasoned Driver Refresher Packet'), url: 'https://mile12warrior.com/#packets' }).catch(() => {}); }
      else { navigator.clipboard.writeText(shareText('Fleet Seasoned Driver Refresher Packet')).then(() => app.toast('Link copied!')); }
    });
  };

  return { html, init };
};

// ---------------------------------------------------------------------------
// LEGAL PAGES
// ---------------------------------------------------------------------------

const LEGAL_FOOTER = `
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid var(--border);text-align:center">
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;font-size:0.72rem;margin-bottom:10px">
      <a style="color:var(--text-3);cursor:pointer" onclick="app.navigate('terms')">Terms of Service</a>
      <a style="color:var(--text-3);cursor:pointer" onclick="app.navigate('privacy')">Privacy Policy</a>
      <a style="color:var(--text-3);cursor:pointer" onclick="app.navigate('disclaimer-page')">Disclaimer</a>
      <a style="color:var(--text-3);cursor:pointer" onclick="app.navigate('accessibility-page')">Accessibility</a>
    </div>
    <p style="font-size:0.68rem;color:var(--text-3)">&copy; 2026 Mile 12 Warrior LLC. All rights reserved.</p>
    <p style="font-size:0.65rem;color:var(--text-3);margin-top:4px;max-width:340px;margin-left:auto;margin-right:auto;line-height:1.5">
      "Mile 12 Warrior" and "1 Social Butterfly" are trademarks of their respective owners. Educational content only — not medical, legal, or regulatory advice.
    </p>
    <p style="font-size:0.62rem;color:var(--text-3);margin-top:6px;max-width:340px;margin-left:auto;margin-right:auto;line-height:1.5">
      <strong>Multi-State Notice:</strong> Drivers from all 50 states may access this app. Each state has its own transportation laws. It is the driver's responsibility to comply with the laws of every state they travel through. California references reflect our home state.
    </p>
  </div>`;

pages.terms = () => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="profile">&#8592; Back</button>
  <div class="page-header">
    <h1 class="page-title">Terms of Service</h1>
    <p class="page-subtitle" style="font-size:0.78rem;color:var(--text-3)">Last Updated: February 24, 2026</p>
  </div>
  <div style="font-size:0.85rem;color:var(--text-2);line-height:1.7">
    <p>By accessing or using the Mile 12 Warrior application ("Service"), operated by Mile 12 Warrior LLC ("we," "us," "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service. This app may link to 1 Social Butterfly, a supportive avenue for living your best life — blogs, community, and merchandise — at 1socialbutterfly.net.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">1. Eligibility</h3>
    <p>You must be at least 18 years old to use this Service. We do not knowingly collect personal information from children under 13 in compliance with COPPA (15 U.S.C. &sect;&sect; 6501&ndash;6506). California users under 18 may request removal of publicly posted content per Cal. Bus. &amp; Prof. Code &sect; 22581.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">2. Account Registration</h3>
    <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate information. We reserve the right to suspend or terminate accounts that violate these Terms.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">3. User-Generated Content</h3>
    <p>Forum posts, blog comments, and community contributions remain your intellectual property. By posting, you grant Mile 12 Warrior LLC a non-exclusive, royalty-free, worldwide license to display, distribute, and reproduce your content on the platform. You must not post content that is defamatory, harassing, infringing, illegal, or that encourages violation of FMCSA HOS rules or other safety regulations. We may remove content at our sole discretion.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">4. Prohibited Conduct</h3>
    <p>You agree not to: impersonate others; harass, threaten, or abuse other users; distribute spam or malware; scrape or data-mine the Service; attempt unauthorized access to our systems; or post content encouraging violation of federal or state transportation safety regulations.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">5. Intellectual Property</h3>
    <p>All original content, design, code, and logos on the Service are the property of Mile 12 Warrior LLC, protected under the U.S. Copyright Act (17 U.S.C.) and the Lanham Act (15 U.S.C. &sect; 1051 et seq.). &ldquo;1 Social Butterfly&rdquo; is a trademark of its respective owner. Unauthorized reproduction, distribution, or use is prohibited.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">6. E-Commerce &amp; Merchandise</h3>
    <p>All sales are in USD. Prices may change without notice. Orders are subject to availability. Shipping is to U.S. addresses. Returns are accepted within 30 days of delivery in original condition, with refunds processed within 14 business days per California Civil Code &sect; 1723. Sales tax is collected as required by California law (Cal. Rev. &amp; Tax. Code &sect; 6051 et seq.).</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">7. Disclaimers</h3>
    <p>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. Content is for educational and informational purposes only and does NOT constitute medical, legal, regulatory, financial, or professional advice. All safety content is intended to align with USDOT FMCSA regulations (49 CFR Parts 350&ndash;399) and Caltrans/CALDOT standards (Title 13 CCR), but regulations change frequently. Users must verify current rules independently at fmcsa.dot.gov and dot.ca.gov. No professional&ndash;client relationship is created by use of this Service.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">8. Limitation of Liability</h3>
    <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, MILE 12 WARRIOR LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. Our total liability is limited to the amount you have paid to us in the preceding 12 months. This does not affect non-waivable rights under California law.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">9. Indemnification</h3>
    <p>You agree to defend, indemnify, and hold harmless Mile 12 Warrior LLC from and against any claims, damages, losses, or expenses arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">10. DMCA / Copyright Infringement</h3>
    <p>If you believe content on this Service infringes your copyright, submit a notice per the Digital Millennium Copyright Act (17 U.S.C. &sect; 512) to our designated agent: joyce@mile12warrior.com. Include: identification of the copyrighted work, the infringing material and its location, your contact information, a good-faith statement, and your signature.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">11. Governing Law &amp; Disputes</h3>
    <p>These Terms are governed by the laws of the State of California and applicable federal law. Disputes shall be resolved through binding arbitration in Sacramento County, California, under AAA rules, except where prohibited by law. Class action waiver applies. Small claims court actions are permitted.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">12. Changes &amp; Severability</h3>
    <p>We may update these Terms at any time. Continued use after changes constitutes acceptance. If any provision is found unenforceable, the remaining provisions continue in effect.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">13. Contact</h3>
    <p>Mile 12 Warrior LLC<br>2108 N St. #8325, Sacramento, CA 95816<br>joyce@mile12warrior.com<br>(916) 292-7411</p>
  </div>
  ${LEGAL_FOOTER}
</div>`;
  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('profile'));
  };
  return { html, init };
};

pages.privacy = () => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="profile">&#8592; Back</button>
  <div class="page-header">
    <h1 class="page-title">Privacy Policy</h1>
    <p class="page-subtitle" style="font-size:0.78rem;color:var(--text-3)">Last Updated: February 24, 2026</p>
  </div>
  <div style="font-size:0.85rem;color:var(--text-2);line-height:1.7">
    <p>Mile 12 Warrior LLC (&ldquo;we,&rdquo; &ldquo;us&rdquo;) operates the Mile 12 Warrior website and mobile application. This Privacy Policy explains how we collect, use, disclose, and protect your personal information. This app may link to 1 Social Butterfly, a supportive avenue for living your best life (blogs, community, merchandise) at 1socialbutterfly.net.</p>
    <p>We collect only <strong>limited</strong> personal information necessary to provide the Service. We do not sell your data. You have rights to access, correct, and delete your information and to subscribe or unsubscribe from our newsletter, blog, and forum communications at any time.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">1. Information We Collect</h3>
    <p><strong>Account Information:</strong> Username, email address, password (hashed via bcrypt &mdash; never stored in plaintext).</p>
    <p><strong>Account &amp; cab information:</strong> Bio and preferences (voluntarily provided).</p>
    <p><strong>Transaction Data:</strong> Shipping address, order history, purchase amounts for merchandise orders.</p>
    <p><strong>Communications:</strong> Contact form submissions, forum posts, blog comments, support messages.</p>
    <p><strong>Usage Data:</strong> Pages visited, features used, timestamps, device/browser information.</p>
    <p><strong>Cookies &amp; Local Storage:</strong> Session cookies for authentication (expire after 24 hours); localStorage for cart and preferences. We do not use third-party tracking cookies.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">2. How We Use Your Information</h3>
    <p>We use your data to: provide and maintain the Service; process merchandise orders; authenticate users; respond to support requests; display user-generated content; improve our Service; and comply with legal obligations. <strong>We do NOT sell your personal information.</strong></p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">3. Newsletter, Blog &amp; Forum Subscriptions</h3>
    <p>You may subscribe to our newsletter, blog emails, and forum updates. <strong>You may unsubscribe at any time</strong> via the link in our emails, your account settings, or by contacting us at joyce@mile12warrior.com or (916) 292-7411. Unsubscribing does not affect your account.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">4. Information Sharing</h3>
    <p>We do not sell personal data. We may share information with: service providers under confidentiality agreements; law enforcement when required by law; or in connection with a business transfer. User-generated content (forum posts, comments) is publicly visible by design.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">5. California Consumer Privacy Act (CCPA/CPRA)</h3>
    <p>Under Cal. Civ. Code &sect; 1798.100 et seq., California residents have the right to: know what personal information we collect; request deletion of personal information; request correction of inaccurate data; opt out of sale of personal information (we do not sell data); and exercise these rights without discrimination. To submit a request: joyce@mile12warrior.com or (916) 292-7411.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">6. Children&rsquo;s Privacy (COPPA)</h3>
    <p>Our Service is not directed to children under 13. We do not knowingly collect personal information from children under 13 per COPPA (15 U.S.C. &sect;&sect; 6501&ndash;6506). If we learn we have collected data from a child under 13, we will delete it promptly. California minors under 18 may request removal of publicly posted content per Cal. Bus. &amp; Prof. Code &sect; 22581.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">7. Data Security &amp; Retention</h3>
    <p>Passwords are hashed using bcrypt. Sessions use server-side encryption. We implement reasonable safeguards but cannot guarantee absolute security. Account data is retained while active; transaction records retained per tax law (generally 7 years). You may request deletion per CCPA rights above.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">8. Do Not Track</h3>
    <p>We honor Do Not Track (DNT) browser signals. We do not track users across third-party websites. We do not use third-party advertising cookies or analytics services at this time.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">9. Changes &amp; Contact</h3>
    <p>We may update this policy. Material changes will be posted with an updated date and communicated via email when possible.</p>
    <p>Mile 12 Warrior LLC<br>2108 N St. #8325, Sacramento, CA 95816<br>joyce@mile12warrior.com | (916) 292-7411</p>
  </div>
  ${LEGAL_FOOTER}
</div>`;
  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('profile'));
  };
  return { html, init };
};

pages['disclaimer-page'] = () => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="profile">&#8592; Back</button>
  <div class="page-header">
    <h1 class="page-title">Disclaimer</h1>
    <p class="page-subtitle" style="font-size:0.78rem;color:var(--text-3)">Last Updated: February 24, 2026</p>
  </div>
  <div style="font-size:0.85rem;color:var(--text-2);line-height:1.7">
    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">General Disclaimer</h3>
    <p>Mile 12 Warrior LLC provides this application for <strong>educational and informational purposes only</strong>. Nothing on this platform constitutes medical, legal, regulatory, financial, or professional advice. This app may link to 1 Social Butterfly, a supportive avenue for living your best life — blogs, community, and merchandise — at 1socialbutterfly.net.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Not a Substitute for Professional Advice</h3>
    <p>Our safety guidance, checklists, wellness tips, and blog articles are based on general knowledge and personal experience. They are NOT a substitute for consulting with licensed healthcare providers, attorneys, certified safety professionals, or regulatory authorities.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Regulatory Information</h3>
    <p>While we strive to align all content with USDOT FMCSA regulations (49 CFR Parts 350&ndash;399) and California Department of Transportation (Caltrans/CALDOT) standards (Title 13 CCR), federal and state regulations change frequently. Users are solely responsible for verifying current rules at fmcsa.dot.gov and dot.ca.gov. Reference to specific CFR sections is for convenience only.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">No Professional Relationship</h3>
    <p>Use of this application does not create any professional&ndash;client, attorney&ndash;client, or healthcare provider&ndash;patient relationship between you and Mile 12 Warrior LLC.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Health &amp; Wellness</h3>
    <p>All health, fitness, nutrition, sleep, and mental wellness content is general information. Consult a physician before beginning any exercise program or making health decisions, especially regarding sleep disorders (including sleep apnea screening per FMCSA 49 CFR Part 391). <strong>If you are experiencing a medical emergency, call 911.</strong></p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">User-Generated Content</h3>
    <p>Forum posts, comments, and community contributions represent the views of their individual authors and have not been independently verified. We do not endorse or guarantee user-submitted content.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">E-Commerce</h3>
    <p>Product descriptions, pricing, and availability are subject to change. We comply with FTC guidelines (16 CFR Parts 255 and 435) and California consumer protection law (Cal. Civ. Code &sect; 1723 et seq.).</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Limitation of Liability</h3>
    <p>To the maximum extent permitted by applicable law, Mile 12 Warrior LLC shall not be liable for any damages arising from your use of this application, including direct, indirect, incidental, consequential, special, or punitive damages.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">California-Specific Notices</h3>
    <p>We comply with the California Consumer Privacy Act (CCPA/CPRA), California Online Privacy Protection Act (CalOPPA), and applicable state laws. See our Privacy Policy for details.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Data &amp; Your Rights</h3>
    <p>We collect only limited personal information. You may subscribe to our newsletter, blog, and forum and <strong>unsubscribe at any time</strong>. See our Privacy Policy and Terms of Service for full details.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Contact</h3>
    <p>Mile 12 Warrior LLC<br>2108 N St. #8325, Sacramento, CA 95816<br>joyce@mile12warrior.com | (916) 292-7411</p>
  </div>
  ${LEGAL_FOOTER}
</div>`;
  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('profile'));
  };
  return { html, init };
};

pages['accessibility-page'] = () => {
  const html = `
<div class="page page-enter">
  <button class="back-btn" data-back="profile">&#8592; Back</button>
  <div class="page-header">
    <h1 class="page-title">Accessibility Statement</h1>
    <p class="page-subtitle" style="font-size:0.78rem;color:var(--text-3)">Last Updated: February 24, 2026</p>
  </div>
  <div style="font-size:0.85rem;color:var(--text-2);line-height:1.7">
    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Our Commitment</h3>
    <p>Mile 12 Warrior LLC is committed to ensuring digital accessibility for people with disabilities. We strive to meet WCAG 2.1 Level AA standards and comply with the Americans with Disabilities Act (ADA) and Section 508 of the Rehabilitation Act where applicable.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Standards We Follow</h3>
    <ul style="padding-left:18px">
      <li>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</li>
      <li>Americans with Disabilities Act (ADA), Title III</li>
      <li>Section 508 of the Rehabilitation Act (29 U.S.C. &sect; 794d)</li>
      <li>California Government Code &sect; 7405</li>
    </ul>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Accessibility Features</h3>
    <p>Our application includes: semantic HTML structure, ARIA labels on interactive elements, sufficient color contrast ratios, screen reader compatibility, keyboard navigation support, and resizable text.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Known Limitations</h3>
    <p>Some user-generated content (forum posts, comments) may not meet all accessibility standards. We are continuously working to improve accessibility across the platform.</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Feedback &amp; Assistance</h3>
    <p>If you experience any accessibility barriers or need assistance, please contact us. We aim to respond within 2 business days.</p>
    <p>joyce@mile12warrior.com | (916) 292-7411<br>2108 N St. #8325, Sacramento, CA 95816</p>

    <h3 style="color:var(--text);font-size:0.95rem;margin-top:20px;margin-bottom:8px">Enforcement</h3>
    <p>You may file ADA complaints with the U.S. Department of Justice or the California Department of Rehabilitation.</p>
  </div>
  ${LEGAL_FOOTER}
</div>`;
  const init = () => {
    document.querySelector('.back-btn')?.addEventListener('click', () => app.navigate('profile'));
  };
  return { html, init };
};

window.pages = pages;
