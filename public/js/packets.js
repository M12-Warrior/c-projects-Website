/* ============================================================
   packets.js — Mile 12 Warrior Packet Generator
   Generates downloadable/printable HTML safety packets
   for truck drivers and fleet safety departments.
   ============================================================ */

var Packets = {};

/* ----------------------------------------------------------
   Shared CSS styles for all packets
   ---------------------------------------------------------- */
Packets._styles = function () {
  return [
    '@page { margin: 0.75in; size: letter; }',
    'body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.6; color: #111; margin: 0; padding: 0; }',
    'h1 { font-family: Georgia, serif; font-size: 22pt; border-bottom: 3px solid #333; padding-bottom: 8px; margin-top: 0; }',
    'h2 { font-family: Georgia, serif; font-size: 16pt; color: #222; margin-top: 28px; border-bottom: 2px solid #6366f1; padding-bottom: 4px; }',
    'h3 { font-family: Georgia, serif; font-size: 13pt; color: #333; margin-top: 18px; }',
    '.header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #000; }',
    '.header h1 { border-bottom: none; margin-bottom: 4px; }',
    '.header p { font-size: 9pt; color: #666; margin: 2px 0; }',
    '.tier-badge { display: inline-block; padding: 4px 16px; border: 2px solid #333; border-radius: 4px; font-weight: bold; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }',
    '.check-line { padding: 6px 0; border-bottom: 1px dotted #ccc; display: flex; align-items: baseline; gap: 8px; }',
    '.check-box { width: 13px; height: 13px; border: 1.5px solid #333; flex-shrink: 0; margin-top: 2px; }',
    '.numbered-item { padding: 5px 0; counter-increment: item; }',
    '.numbered-item::before { content: counter(item) ". "; font-weight: bold; }',
    '.tip-box { background: #f0f0f5; border-left: 4px solid #6366f1; padding: 10px 14px; margin: 12px 0; font-size: 10pt; }',
    '.warning-box { background: #fff5f5; border-left: 4px solid #e53e3e; padding: 10px 14px; margin: 12px 0; font-size: 10pt; }',
    '.info-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px 14px; margin: 12px 0; font-size: 10pt; }',
    'table { width: 100%; border-collapse: collapse; margin: 12px 0; }',
    'th, td { border: 1px solid #333; padding: 8px 10px; text-align: left; font-size: 10pt; }',
    'th { background: #f5f5f5; font-weight: bold; }',
    '.sign-off-table td { height: 32px; }',
    '.page-break { page-break-before: always; }',
    '.cover-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; }',
    '.cover-page h1 { font-size: 32pt; border: none; margin-bottom: 12px; }',
    '.cover-page .subtitle { font-size: 14pt; color: #555; margin-bottom: 24px; }',
    '.toc { list-style: none; padding: 0; }',
    '.toc li { padding: 6px 0; border-bottom: 1px dotted #ccc; font-size: 11pt; }',
    '.toc li span { float: right; font-family: Georgia; }',
    '.footer-legal { margin-top: 24px; font-size: 7.5pt; color: #888; border-top: 1px solid #ccc; padding-top: 8px; text-align: center; }',
    '.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }',
    '@media print { .page-break { page-break-before: always; } }'
  ].join('\n');
};

/* ----------------------------------------------------------
   Shared header/footer helpers
   ---------------------------------------------------------- */
Packets._header = function () {
  return '<div class="header">' +
    '<h1>Mile 12 Warrior</h1>' +
    '<p>Driver Safety &amp; Wellness</p>' +
    '<p>mile12warrior.com</p>' +
    '</div>';
};

Packets._footer = function () {
  return '<div class="footer-legal">&copy; 2026 Mile 12 Warrior LLC. All rights reserved. Educational content only &mdash; not medical, legal, or regulatory advice. Verify regulations at fmcsa.dot.gov and dot.ca.gov<br><strong>Multi-State Notice:</strong> Drivers from all 50 states may access these materials. Each state has its own transportation laws that may differ significantly. It is the driver&rsquo;s responsibility to comply with the laws of every state they travel through. California (Caltrans/CALDOT) references reflect our home state and should not be assumed to apply in other jurisdictions.</div>';
};

Packets._wrap = function (title, body) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + title + '</title>' +
    '<style>' + Packets._styles() + '</style>' +
    '</head><body>' + body + '</body></html>';
};

Packets._checkLine = function (text) {
  return '<div class="check-line"><div class="check-box"></div><span>' + text + '</span></div>';
};

Packets._checkLines = function (items) {
  return items.map(function (t) { return Packets._checkLine(t); }).join('');
};

/* ============================================================
   1. NEW DRIVER PACKET — Tier 1
   ============================================================ */
Packets.newDriver = function () {
  var body = '';

  /* ---- Cover Page ---- */
  body += '<div class="cover-page">' +
    '<div class="tier-badge">Tier 1 &mdash; New Driver</div>' +
    '<h1>New Driver Safety &amp; Wellness Packet</h1>' +
    '<p class="subtitle">Your first 90 days on the road &mdash; everything you need to stay safe, compliant, and healthy.</p>' +
    '<p style="margin-top:32px;font-size:12pt;"><strong>Mile 12 Warrior LLC</strong><br>Driver Safety &amp; Wellness</p>' +
    '<p style="margin-top:24px;font-size:10pt;">Date Issued: ____________________</p>' +
    '</div>';

  /* ---- Table of Contents ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Table of Contents</h2><ul class="toc">';
  var tocItems = [
    'Welcome & How to Use This Packet',
    'Hours of Service (HOS) Fundamentals',
    'Sleep & Fatigue Management for New Drivers',
    'Physical Health Essentials',
    'Mental Health Awareness',
    'Pre-Trip & Post-Trip Inspection Checklist',
    'Breakdown Kit Checklist',
    'First Aid Kit Checklist',
    'Communication & Emergency Plan',
    'Roadside Safety Protocol',
    'Basic Defensive Driving',
    'Your Daily Routine',
    'Key Contacts & Resources'
  ];
  for (var i = 0; i < tocItems.length; i++) {
    body += '<li>Section ' + (i + 1) + ': ' + tocItems[i] + '</li>';
  }
  body += '</ul>' + Packets._footer() + '</div>';

  /* ---- Section 1: Welcome ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 1: Welcome &amp; How to Use This Packet</h2>';
  body += '<p>Welcome to the road, driver. The Mile 12 Warrior program was built specifically for you &mdash; a new CDL driver entering one of the most demanding and rewarding careers in America.</p>';
  body += '<h3>What Is "Mile 12"?</h3>';
  body += '<p>Research and real-world experience show that a critical danger zone exists in every trip. Roughly 12 miles in, your brain shifts from active alertness to autopilot mode. Your pre-trip adrenaline fades. You settle into the seat. Your guard drops. This is where accidents happen &mdash; not because drivers are careless, but because the human brain is wired to conserve energy once a task feels routine.</p>';
  body += '<p>The Mile 12 concept applies beyond the literal mileage. It&rsquo;s the point where any routine &mdash; pre-trip inspections, hours of service tracking, even health habits &mdash; becomes so familiar that you start cutting corners without realizing it.</p>';
  body += '<h3>How to Use This Packet</h3>';
  body += '<p>This packet is your daily companion for your first 90 days. Here&rsquo;s how to get the most from it:</p>';
  body += '<div class="numbered-item" style="counter-reset:item">Review Sections 2&ndash;5 thoroughly before your first solo trip.</div>';
  body += '<div class="numbered-item">Use the Pre-Trip and Post-Trip checklists (Section 6) every single day.</div>';
  body += '<div class="numbered-item">Verify your Breakdown Kit (Section 7) and First Aid Kit (Section 8) at the start of each week.</div>';
  body += '<div class="numbered-item">Follow the Daily Routine in Section 12 until it becomes second nature &mdash; then keep following it, because that&rsquo;s when complacency hits.</div>';
  body += '<div class="numbered-item">Keep the Key Contacts (Section 13) accessible in your cab at all times.</div>';
  body += '<div class="tip-box"><strong>Tip:</strong> Don&rsquo;t try to memorize everything at once. Focus on one section per day for your first two weeks, then cycle back through as a refresher.</div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 2: Hours of Service ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 2: Hours of Service (HOS) Fundamentals</h2>';
  body += '<p>Hours of Service regulations exist to prevent fatigue-related crashes. As a new driver, understanding HOS is not optional &mdash; it is the legal foundation of your career. Violations carry serious consequences: fines, out-of-service orders, CSA points, and potential loss of your CDL.</p>';
  body += '<p><em>Reference: 49 CFR Part 395</em></p>';

  body += '<h3>The Core HOS Rules</h3>';
  body += '<table><thead><tr><th>Rule</th><th>Requirement</th><th>Details</th></tr></thead><tbody>';
  body += '<tr><td>11-Hour Driving Limit</td><td>Maximum 11 hours of driving</td><td>After 10 consecutive hours off duty, you may drive a maximum of 11 hours before being required to take 10 consecutive hours off duty again.</td></tr>';
  body += '<tr><td>14-Hour On-Duty Window</td><td>14-hour limit after coming on duty</td><td>You may not drive beyond the 14th consecutive hour after coming on duty, following 10 consecutive hours off duty. This window does not pause for off-duty time during the day &mdash; once it starts, the clock runs.</td></tr>';
  body += '<tr><td>10-Hour Off-Duty Minimum</td><td>10 consecutive hours off duty</td><td>You must take at least 10 consecutive hours off duty before driving again. This resets both the 11-hour driving limit and the 14-hour window.</td></tr>';
  body += '<tr><td>30-Minute Break</td><td>Required after 8 hours of driving</td><td>After driving for a cumulative 8 hours without at least a 30-minute break, you must take a 30-minute break before driving again. The break can be off-duty or sleeper berth time.</td></tr>';
  body += '<tr><td>60/70-Hour Weekly Limit</td><td>60 hours in 7 days or 70 hours in 8 days</td><td>You may not drive after being on duty for 60 hours in 7 consecutive days (if your carrier does not operate every day) or 70 hours in 8 consecutive days (if your carrier operates every day). A 34-hour restart resets this clock.</td></tr>';
  body += '</tbody></table>';

  body += '<h3>ELD Basics</h3>';
  body += '<p>Electronic Logging Devices (ELDs) automatically record your driving time. Key points for new drivers:</p>';
  body += Packets._checkLines([
    'Your ELD connects to the engine and records when the vehicle is in motion.',
    'You are responsible for selecting the correct duty status (Driving, On-Duty Not Driving, Sleeper Berth, Off-Duty).',
    'Review your logs daily for accuracy and certify them within 24 hours.',
    'You must be able to present your ELD records to law enforcement during an inspection.',
    'ELD malfunctions must be noted and reported. You have 8 days to repair a malfunctioning ELD.',
    'Keep a backup supply of blank paper logs (RODS) in case of ELD failure.'
  ]);

  body += '<h3>Sleeper Berth Provisions</h3>';
  body += '<p>If your truck has a compliant sleeper berth, you may split your 10-hour off-duty period:</p>';
  body += '<p>You can use a 7/3 split: 7 consecutive hours in the sleeper berth and 3 consecutive hours off-duty or in the sleeper berth (or any combination totaling 10 hours where one period is at least 7 hours in the sleeper berth). Neither period counts against your 14-hour window.</p>';

  body += '<h3>Common New Driver HOS Mistakes</h3>';
  body += '<div class="warning-box"><strong>Avoid These Pitfalls:</strong><br>';
  body += '&bull; <strong>Confusing the 14-hour window with driving time.</strong> The 14-hour clock does not stop when you take a break, fuel up, or load. It runs continuously from the moment you go on duty.<br>';
  body += '&bull; <strong>Forgetting the 30-minute break.</strong> Track your cumulative driving time. Plan your break before you hit the 8-hour mark, not after.<br>';
  body += '&bull; <strong>Miscounting weekly hours.</strong> Your 60/70-hour clock accumulates all on-duty time, not just driving time. Loading, fueling, inspections &mdash; it all counts.<br>';
  body += '&bull; <strong>Not certifying logs daily.</strong> Uncertified logs are a violation. Certify every 24 hours.<br>';
  body += '&bull; <strong>Moving the truck without being in Driving status.</strong> Even moving 10 feet in a truck stop counts as driving. Make sure your ELD is in the correct status.</div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 3: Sleep & Fatigue ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 3: Sleep &amp; Fatigue Management for New Drivers</h2>';
  body += '<p>Fatigue is the silent killer in trucking. The National Highway Traffic Safety Administration estimates that drowsy driving causes over 100,000 crashes per year. As a new driver, your schedule will be irregular, your sleep environment will be unfamiliar, and your body will need time to adapt. Prioritizing sleep is not weakness &mdash; it is professional discipline.</p>';

  body += '<h3>Circadian Rhythm Basics</h3>';
  body += '<p>Your body runs on an internal clock called the circadian rhythm, which follows a roughly 24-hour cycle. Key facts:</p>';
  body += '<ul>';
  body += '<li>Your body naturally wants to sleep between 2:00&ndash;4:00 AM and 1:00&ndash;3:00 PM. These are your highest-risk fatigue windows.</li>';
  body += '<li>Exposure to sunlight in the morning helps reset your clock. If you start driving before dawn, use bright cab lighting.</li>';
  body += '<li>It takes 2&ndash;3 days for your body to adjust to a new sleep schedule. Don&rsquo;t assume you can flip from day driving to night driving overnight.</li>';
  body += '<li>Consistent sleep and wake times &mdash; even on weekends and home time &mdash; dramatically improve sleep quality.</li>';
  body += '</ul>';

  body += '<h3>Warning Signs of Fatigue</h3>';
  body += '<p>If you experience any of these, you are too fatigued to drive safely:</p>';
  body += '<div class="warning-box">';
  body += '&bull; Drifting out of your lane or hitting rumble strips<br>';
  body += '&bull; Frequent yawning or heavy eyelids<br>';
  body += '&bull; Missing exits, signs, or turns<br>';
  body += '&bull; Difficulty focusing or keeping your eyes open<br>';
  body += '&bull; Daydreaming or &ldquo;zoning out&rdquo; &mdash; arriving at a point with no memory of the last few miles<br>';
  body += '&bull; Restlessness, irritability, or difficulty maintaining speed<br>';
  body += '&bull; Following too closely because you can&rsquo;t judge distance accurately</div>';

  body += '<h3>Power Nap Protocol</h3>';
  body += '<p>The 20-minute power nap is one of the most effective fatigue countermeasures available:</p>';
  body += '<div class="numbered-item" style="counter-reset:item">Pull over to a safe location (truck stop, rest area, or wide shoulder as a last resort).</div>';
  body += '<div class="numbered-item">Set an alarm for exactly 20 minutes. Sleeping longer risks entering deep sleep, which causes grogginess.</div>';
  body += '<div class="numbered-item">Recline your seat or use your sleeper berth. Block light with a sleep mask or towel.</div>';
  body += '<div class="numbered-item">After waking, sit up, drink water, and wait 5&ndash;10 minutes before driving.</div>';
  body += '<div class="tip-box"><strong>Pro Tip &mdash; The Coffee Nap:</strong> Drink a cup of coffee immediately before your 20-minute nap. Caffeine takes about 20 minutes to enter your bloodstream, so you wake up with the combined benefit of rest and caffeine hitting at the same time.</div>';

  body += '<h3>Sleep Apnea Awareness</h3>';
  body += '<p>Obstructive sleep apnea (OSA) is extremely common among truck drivers &mdash; estimated at 28&ndash;35% of CDL holders. Symptoms include loud snoring, waking up gasping, morning headaches, and excessive daytime sleepiness. If you suspect you have sleep apnea, get screened. Untreated OSA dramatically increases crash risk. Treatment with a CPAP machine is effective and will not disqualify you from driving.</p>';

  body += '<h3>Caffeine Strategy</h3>';
  body += '<p>Caffeine is a tool, not a crutch. Use it wisely:</p>';
  body += '<ul>';
  body += '<li>Limit intake to 400 mg per day (roughly 4 cups of coffee).</li>';
  body += '<li>Stop all caffeine at least 6 hours before your planned sleep time.</li>';
  body += '<li>Caffeine does not replace sleep &mdash; it only masks fatigue temporarily.</li>';
  body += '<li>If you need caffeine to stay awake, that is a sign you need sleep, not more caffeine.</li>';
  body += '</ul>';
  body += Packets._footer() + '</div>';

  /* ---- Section 4: Physical Health ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 4: Physical Health Essentials</h2>';
  body += '<p>Truck driving is one of the most physically demanding sedentary occupations. The combination of prolonged sitting, vibration, irregular meals, and limited exercise creates a perfect storm for back pain, obesity, diabetes, and cardiovascular disease. Building healthy habits now &mdash; in your first 90 days &mdash; prevents problems that sideline veteran drivers.</p>';

  body += '<h3>Back &amp; Joint Care</h3>';
  body += '<ul>';
  body += '<li>Adjust your seat properly: knees slightly bent, lower back supported, mirrors set so you don&rsquo;t have to twist.</li>';
  body += '<li>Use a lumbar support cushion if your seat doesn&rsquo;t provide adequate lower back support.</li>';
  body += '<li>When exiting the cab, never jump down. Use three points of contact (two hands and one foot, or two feet and one hand) and step down facing the truck.</li>';
  body += '<li>Lift with your legs, not your back. When securing cargo, tarping, or handling freight, bend at the knees and keep the load close to your body.</li>';
  body += '<li>Stretch every time you stop &mdash; fueling, loading, breaks. Even 2 minutes of stretching prevents cumulative damage.</li>';
  body += '</ul>';

  body += '<h3>Nutrition Basics</h3>';
  body += '<p><strong>Cooler Packing List (Weekly):</strong></p>';
  body += Packets._checkLines([
    'Pre-cooked chicken breast or turkey slices',
    'Hard-boiled eggs (prep a dozen at a time)',
    'Baby carrots, celery sticks, bell pepper strips',
    'Apples, bananas, oranges, grapes',
    'Greek yogurt cups',
    'Hummus (single-serve containers)',
    'Whole grain wraps or bread',
    'String cheese or cheese slices',
    'Nuts and trail mix (portion-controlled bags)',
    'Water bottles (at least 1 gallon per day supply)'
  ]);

  body += '<p><strong>Healthy Truck Stop Choices:</strong></p>';
  body += '<ul>';
  body += '<li>Grilled chicken over fried. Ask for double vegetables instead of fries.</li>';
  body += '<li>Salads with protein &mdash; but watch dressing portions. Ask for dressing on the side.</li>';
  body += '<li>Oatmeal or eggs for breakfast instead of biscuits and gravy.</li>';
  body += '<li>Water or unsweetened tea instead of soda or energy drinks.</li>';
  body += '<li>If you eat fast food, skip the combo meal. Order a single sandwich with a side salad.</li>';
  body += '</ul>';

  body += '<h3>Hydration Targets</h3>';
  body += '<p>Aim for at least 64 ounces (8 cups) of water per day. Dehydration causes fatigue, headaches, reduced reaction time, and difficulty concentrating &mdash; all dangerous behind the wheel. Keep a refillable water bottle in your cup holder and drink consistently throughout the day, not just when you feel thirsty.</p>';
  body += '<div class="tip-box"><strong>Hydration Check:</strong> Your urine should be light yellow. Dark yellow or amber means you&rsquo;re dehydrated. Clear means you&rsquo;re over-hydrated (rare, but possible).</div>';

  body += '<h3>Stretching Routine</h3>';
  body += '<p>Perform these stretches at every stop, holding each for 15&ndash;30 seconds:</p>';
  body += '<table><thead><tr><th>Stretch</th><th>How To</th><th>Target</th></tr></thead><tbody>';
  body += '<tr><td>Standing Hamstring</td><td>Place heel on bumper or step. Keep leg straight, lean forward from hips until you feel a stretch in the back of your thigh.</td><td>Hamstrings, lower back</td></tr>';
  body += '<tr><td>Quad Stretch</td><td>Stand on one leg (hold truck for balance). Pull opposite foot toward glutes. Keep knees together.</td><td>Quadriceps, hip flexors</td></tr>';
  body += '<tr><td>Calf Raises</td><td>Stand on a step or curb edge. Rise up on toes, then lower heels below the step. 10 reps.</td><td>Calves, ankles</td></tr>';
  body += '<tr><td>Shoulder Rolls</td><td>Roll shoulders forward 10 times, then backward 10 times. Big circles.</td><td>Shoulders, upper back</td></tr>';
  body += '<tr><td>Chest Opener</td><td>Clasp hands behind your back. Squeeze shoulder blades together, lift hands slightly. Hold.</td><td>Chest, shoulders, posture</td></tr>';
  body += '<tr><td>Neck Tilts</td><td>Tilt ear toward shoulder (don&rsquo;t raise shoulder). Hold each side. Then look left and right slowly.</td><td>Neck, upper traps</td></tr>';
  body += '<tr><td>Trunk Twist</td><td>Feet shoulder-width apart. Place hands on hips. Rotate upper body left, hold, then right.</td><td>Core, lower back, obliques</td></tr>';
  body += '<tr><td>Hip Flexor Lunge</td><td>Step forward into a lunge. Keep back knee slightly off the ground. Push hips forward gently.</td><td>Hip flexors, groin</td></tr>';
  body += '</tbody></table>';
  body += Packets._footer() + '</div>';

  /* ---- Section 5: Mental Health ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 5: Mental Health Awareness</h2>';
  body += '<p>Trucking is isolating. You spend hours alone in a cab, away from family and friends, in an environment that demands constant vigilance. Mental health challenges are not a personal failure &mdash; they are an occupational reality. The strongest drivers are the ones who recognize when they need support and ask for it.</p>';

  body += '<h3>Isolation Coping Strategies</h3>';
  body += '<ul>';
  body += '<li><strong>Schedule regular calls.</strong> Set a daily time to call your spouse, kids, parents, or friends. Consistency matters more than duration &mdash; even a 10-minute call provides connection.</li>';
  body += '<li><strong>Use technology.</strong> Video calls, voice messages, and shared photo albums help maintain presence in your family&rsquo;s daily life.</li>';
  body += '<li><strong>Build a road network.</strong> Connect with other drivers at truck stops, via CB radio, or through online trucker communities. You are not alone &mdash; thousands of drivers share your experience.</li>';
  body += '<li><strong>Podcasts and audiobooks.</strong> Keep your mind engaged during long stretches. Educational, comedy, or story-based content reduces the feeling of isolation.</li>';
  body += '<li><strong>Journaling.</strong> Even a few sentences at the end of each day helps process emotions and track your mental state over time.</li>';
  body += '</ul>';

  body += '<h3>Family Communication Plan</h3>';
  body += '<table><thead><tr><th>When</th><th>Action</th><th>Duration</th></tr></thead><tbody>';
  body += '<tr><td>Morning (before driving)</td><td>Good morning text or quick call</td><td>2&ndash;5 min</td></tr>';
  body += '<tr><td>Midday break</td><td>Check in, share a photo of where you are</td><td>5&ndash;10 min</td></tr>';
  body += '<tr><td>Evening (after parking)</td><td>Video call with family, discuss your days</td><td>15&ndash;30 min</td></tr>';
  body += '<tr><td>Weekly</td><td>Longer call or virtual &ldquo;family dinner&rdquo;</td><td>30&ndash;60 min</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Stress Management: 4-7-8 Breathing</h3>';
  body += '<p>This technique activates your parasympathetic nervous system and reduces stress in under 2 minutes:</p>';
  body += '<div class="info-box">';
  body += '<strong>Step 1:</strong> Inhale through your nose for 4 seconds.<br>';
  body += '<strong>Step 2:</strong> Hold your breath for 7 seconds.<br>';
  body += '<strong>Step 3:</strong> Exhale slowly through your mouth for 8 seconds.<br>';
  body += '<strong>Repeat 4 times.</strong> Use before sleep, during stressful situations (traffic, loading delays), or anytime you feel overwhelmed.</div>';

  body += '<h3>Crisis Resources</h3>';
  body += '<div class="warning-box"><strong>If you or someone you know is in crisis, help is available 24/7:</strong><br><br>';
  body += '&bull; <strong>988 Suicide &amp; Crisis Lifeline:</strong> Call or text <strong>988</strong><br>';
  body += '&bull; <strong>Crisis Text Line:</strong> Text <strong>HOME</strong> to <strong>741741</strong><br>';
  body += '&bull; <strong>SAMHSA National Helpline:</strong> <strong>1-800-662-4357</strong> (free, confidential, 24/7 treatment referrals)<br><br>';
  body += 'There is no shame in reaching out. These services are free, confidential, and staffed by people who understand.</div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 6: Pre-Trip & Post-Trip Inspection ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 6: Pre-Trip &amp; Post-Trip Inspection Checklist</h2>';
  body += '<p>Federal regulation 49 CFR 396.11 requires every driver to complete a Driver Vehicle Inspection Report (DVIR) before operating and after completing each day&rsquo;s work. Pre-trip inspections catch problems before they become emergencies. Post-trip inspections document the condition of your vehicle for the next driver or for your next shift.</p>';
  body += '<div class="warning-box"><strong>Legal Requirement:</strong> Failing to complete a proper inspection is a violation that can result in fines, out-of-service orders, and CSA points. Inspectors can and do ask to see your DVIR.</div>';

  body += '<h3>Pre-Trip Inspection</h3>';
  body += '<h3>Engine Compartment</h3>';
  body += Packets._checkLines([
    'Oil level within proper range',
    'Coolant level adequate, no leaks',
    'Power steering fluid level',
    'Belts and hoses in good condition, no cracks or fraying',
    'Air compressor secure and functioning',
    'Wiring and connections secure, no exposed wires',
    'No fluid leaks under the vehicle'
  ]);

  body += '<h3>Cab Interior</h3>';
  body += Packets._checkLines([
    'Seat belt functions properly, no fraying',
    'Mirrors adjusted, clean, and undamaged',
    'All gauges and warning lights functional',
    'Horn works',
    'Windshield clean, no cracks that obstruct view',
    'Windshield wipers operational, blades in good condition',
    'Heater and defroster working',
    'Emergency equipment present (triangles, fire extinguisher, spare fuses)',
    'ELD functioning and current'
  ]);

  body += '<h3>Exterior &mdash; Lights</h3>';
  body += Packets._checkLines([
    'Headlights (high and low beam)',
    'Taillights',
    'Brake lights',
    'Turn signals (front, rear, and side)',
    'Clearance/marker lights',
    'Hazard flashers',
    'License plate light'
  ]);

  body += '<h3>Tires</h3>';
  body += Packets._checkLines([
    'Tire pressure within manufacturer specs (all axles)',
    'Tread depth adequate (minimum 4/32" steer, 2/32" drive and trailer)',
    'No cuts, bulges, or exposed cords',
    'Lug nuts present and tight',
    'Valve stems intact and capped',
    'Spacers (if applicable) in good condition',
    'Spare tire secured and inflated (if applicable)'
  ]);

  body += '<h3>Brakes</h3>';
  body += Packets._checkLines([
    'Air pressure builds to governor cut-out (typically 120&ndash;140 psi)',
    'Low air pressure warning activates (below 60 psi)',
    'Air leakage rate within limits (3 psi/min single, 4 psi/min combination)',
    'Service brakes apply and release properly',
    'Parking brake holds vehicle on grade',
    'Brake drums/rotors free of cracks',
    'Brake hoses and lines secure, no leaks',
    'Slack adjusters within limits'
  ]);

  body += '<h3>Coupling Devices (Combination Vehicles)</h3>';
  body += Packets._checkLines([
    'Fifth wheel plate greased and secured',
    'Kingpin engaged and locked (tug test performed)',
    'Locking jaws closed around kingpin',
    'Release arm in locked position',
    'Mounting bolts tight',
    'Air and electrical lines connected, no leaks, properly supported',
    'Landing gear fully raised and handle secured',
    'Safety chains/cables connected (doubles/triples)'
  ]);

  body += '<h3>Frame &amp; Cargo Area</h3>';
  body += Packets._checkLines([
    'Frame rails free of cracks or damage',
    'Cross members secure',
    'Mud flaps present and properly mounted',
    'Cargo secure, balanced, and within weight limits',
    'Doors/latches functional and sealed',
    'Load securement devices (straps, chains, binders) in good condition',
    'Trailer floor in good condition'
  ]);

  body += '<h3>Post-Trip Inspection</h3>';
  body += '<p>At the end of each day, inspect the same areas and note any new issues on your DVIR. Even if there are no defects, you must complete and sign the report. Document any defects discovered during the day that were not present during the pre-trip.</p>';
  body += Packets._checkLines([
    'Complete DVIR with date, vehicle number, and odometer reading',
    'Note any defects discovered during the day',
    'Report defects to maintenance/carrier as required',
    'Sign and retain a copy of the DVIR'
  ]);
  body += Packets._footer() + '</div>';

  /* ---- Section 7: Breakdown Kit ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 7: Breakdown Kit Checklist</h2>';
  body += '<p>A well-stocked breakdown kit can be the difference between a minor inconvenience and a dangerous situation. Federal regulations mandate certain equipment; the rest is professional preparedness. Verify this kit weekly and replace any used or expired items immediately.</p>';

  body += '<h3>Required by FMCSA</h3>';
  body += Packets._checkLines([
    'Three reflective warning triangles (49 CFR 393.95) &mdash; DOT-approved, in carrying case',
    'Properly rated fire extinguisher (49 CFR 393.95) &mdash; minimum 5 B:C rating, fully charged with current inspection tag',
    'Spare fuses (if vehicle uses fuses) &mdash; assorted amperage matching vehicle requirements'
  ]);

  body += '<h3>Highly Recommended</h3>';
  body += Packets._checkLines([
    'High-visibility reflective safety vest (ANSI Class 2 or higher)',
    'Heavy-duty flashlight with extra batteries',
    'LED road flares (battery-powered, reusable)',
    'Jumper cables or portable jump starter pack',
    'Basic tool kit: adjustable wrench, pliers, screwdrivers (flat and Phillips), socket set',
    'Tire pressure gauge (calibrated)',
    'Tire thumper or tire iron',
    'Duct tape (2 rolls)',
    'Electrical tape',
    'Zip ties (assorted sizes)',
    'Bungee cords (assorted lengths)',
    'Tow strap or chain (rated for vehicle weight)',
    'WD-40 or penetrating lubricant',
    'Work gloves (leather or heavy-duty)',
    'Rain gear (jacket and pants)',
    'Coolant (1 gallon)',
    'Motor oil (1 quart, correct weight for your engine)',
    'Windshield washer fluid',
    'Glad-hand seals (spare set)',
    'Air brake hose repair kit',
    'Lock de-icer (winter)',
    'Ice scraper and snow brush (winter)',
    'Tire chains (if operating in chain-required areas &mdash; required for California mountain passes per CVC 605)'
  ]);
  body += Packets._footer() + '</div>';

  /* ---- Section 8: First Aid Kit ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 8: First Aid Kit Checklist</h2>';
  body += '<p>In a roadside emergency, professional medical help may be 20&ndash;60 minutes away. A properly stocked first aid kit allows you to provide immediate care to yourself or others until help arrives. Check expiration dates monthly and replace used items after every use.</p>';

  body += '<h3>Wound Care</h3>';
  body += Packets._checkLines([
    'Adhesive bandages (assorted sizes, minimum 25)',
    'Sterile gauze pads (4"x4", minimum 10)',
    'Gauze rolls (2" and 4" width)',
    'Adhesive medical tape (1 roll)',
    'Butterfly wound closures (10 count)',
    'Non-adherent wound pads (5 count)',
    'Elastic bandage wraps (2" and 4")'
  ]);

  body += '<h3>Antiseptic &amp; Cleaning</h3>';
  body += Packets._checkLines([
    'Antiseptic wipes (individually wrapped, 20 count)',
    'Hydrogen peroxide (small bottle)',
    'Antibiotic ointment packets (10 count)',
    'Hand sanitizer (60%+ alcohol)',
    'Saline eye wash (sterile, 4 oz bottle)',
    'Nitrile gloves (non-latex, 10 pairs)'
  ]);

  body += '<h3>Emergency &amp; Trauma</h3>';
  body += Packets._checkLines([
    'CAT-style tourniquet (learn to use it before you need it)',
    'Chest seal (for penetrating chest wounds)',
    'CPR pocket mask or face shield',
    'Emergency mylar blanket (2 count)',
    'Triangular bandage/sling (2 count)',
    'Cold packs (instant, no refrigeration needed, 4 count)',
    'Scissors (trauma shears)',
    'Tweezers (fine-tip, for splinters and debris)'
  ]);

  body += '<h3>Medications &amp; Comfort</h3>';
  body += Packets._checkLines([
    'Acetaminophen (Tylenol) &mdash; individual packets',
    'Ibuprofen (Advil/Motrin) &mdash; individual packets',
    'Antacid tablets',
    'Anti-diarrheal medication (Imodium)',
    'Diphenhydramine (Benadryl) for allergic reactions',
    'Sunscreen (SPF 30+)',
    'Lip balm with SPF',
    'Insect bite/sting relief cream',
    'Personal prescription medications (always carry a supply)'
  ]);
  body += '<div class="tip-box"><strong>Tip:</strong> Store your first aid kit in the cab where you can reach it, not buried in a side box. In an emergency, seconds matter.</div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 9: Communication & Emergency Plan ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 9: Communication &amp; Emergency Plan</h2>';
  body += '<p>When something goes wrong on the road, your ability to communicate determines how quickly you get help. Prepare your communication tools and contact information before you need them &mdash; not during a crisis.</p>';

  body += '<h3>Communication Equipment</h3>';
  body += Packets._checkLines([
    'Cell phone with heavy-duty case',
    'Cell phone car charger (12V)',
    'Portable battery pack (10,000+ mAh, charged)',
    'Charging cables (keep spares)',
    'CB radio (optional but recommended &mdash; Channel 19 for truckers, Channel 9 for emergencies)',
    'Hands-free device (Bluetooth headset or mount) &mdash; many states require hands-free operation'
  ]);

  body += '<h3>Emergency Contacts Card</h3>';
  body += '<p>Fill out this card and keep it in your cab at all times. Give a copy to your family.</p>';
  body += '<table><thead><tr><th>Contact</th><th>Name</th><th>Phone Number</th></tr></thead><tbody>';
  body += '<tr><td>Dispatch (24-hour)</td><td>_______________________</td><td>_______________________</td></tr>';
  body += '<tr><td>Company Safety Director</td><td>_______________________</td><td>_______________________</td></tr>';
  body += '<tr><td>Roadside Assistance</td><td>_______________________</td><td>_______________________</td></tr>';
  body += '<tr><td>Insurance Company</td><td>_______________________</td><td>_______________________</td></tr>';
  body += '<tr><td>Emergency Contact #1</td><td>_______________________</td><td>_______________________</td></tr>';
  body += '<tr><td>Emergency Contact #2</td><td>_______________________</td><td>_______________________</td></tr>';
  body += '<tr><td>Primary Care Doctor</td><td>_______________________</td><td>_______________________</td></tr>';
  body += '<tr><td>CDL Medical Examiner</td><td>_______________________</td><td>_______________________</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Essential Documents</h3>';
  body += '<p>Keep these in your cab at all times, accessible for inspections:</p>';
  body += Packets._checkLines([
    'Commercial Driver&rsquo;s License (CDL)',
    'Medical Examiner&rsquo;s Certificate (CDL physical card)',
    'Vehicle registration',
    'Proof of insurance',
    'IRP (International Registration Plan) cab card',
    'IFTA (International Fuel Tax Agreement) decals and license',
    'Hazmat endorsement documentation (if applicable)',
    'Bill of lading / shipping documents for current load',
    'Permits for oversize/overweight (if applicable)',
    'ELD instruction manual'
  ]);

  body += '<h3>Roadside Assistance Programs</h3>';
  body += '<p>Many carriers provide roadside assistance. Confirm your coverage and save the number in your phone. Independent programs include:</p>';
  body += '<ul>';
  body += '<li>National Truck Protection (NTP) &mdash; ntpwarranty.com</li>';
  body += '<li>OOIDA roadside assistance for members</li>';
  body += '<li>FleetNet America &mdash; 1-800-438-8961</li>';
  body += '</ul>';
  body += Packets._footer() + '</div>';

  /* ---- Section 10: Roadside Safety Protocol ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 10: Roadside Safety Protocol</h2>';
  body += '<p>If you must stop on the roadside &mdash; whether for a breakdown, flat tire, or any other emergency &mdash; follow this 8-step protocol to protect yourself and others. Most roadside fatalities are preventable with proper procedure.</p>';

  body += '<div style="counter-reset:item">';
  body += '<div class="numbered-item"><strong>Pull completely off the roadway.</strong> Get as far right as possible. If a shoulder is available, use it entirely. If you can reach an exit, parking lot, or rest area, do so &mdash; even driving on a flat tire for a short distance is safer than stopping in a travel lane.</div>';
  body += '<div class="numbered-item"><strong>Activate your hazard flashers immediately.</strong> Turn on your four-way flashers as soon as you begin to slow down, before you even stop. At night, keep all available lights on.</div>';
  body += '<div class="numbered-item"><strong>Put on your high-visibility safety vest.</strong> Before exiting the cab, put on your ANSI-rated reflective vest. You should be visible from at least 500 feet.</div>';
  body += '<div class="numbered-item"><strong>Place reflective triangles.</strong> Set triangles at three points: 10 feet behind your vehicle, 100 feet behind your vehicle, and 200 feet behind your vehicle. On a curve or hill, place the farthest triangle before the curve or crest so approaching drivers see it before they see you.</div>';
  body += '<div class="numbered-item"><strong>Exit and work on the passenger side.</strong> Always position yourself on the side of the truck away from traffic. Never stand between your vehicle and traffic flow. If you must work on the driver&rsquo;s side, use extra caution and keep watching oncoming traffic.</div>';
  body += '<div class="numbered-item"><strong>Call for help.</strong> Contact dispatch, roadside assistance, or 911 as the situation requires. Provide your exact location (mile marker, GPS coordinates, or nearest cross street), the nature of the problem, and the number of people involved.</div>';
  body += '<div class="numbered-item"><strong>Do not attempt major repairs in the travel lane.</strong> If the problem cannot be resolved safely on the shoulder (such as a tire change on the traffic side), call for professional assistance. No repair is worth your life.</div>';
  body += '<div class="numbered-item"><strong>Watch for rear-end approach risk.</strong> If you are stopped and you see a vehicle approaching rapidly from behind that does not appear to be slowing down, move away from your vehicle immediately. Get behind a guardrail, up an embankment, or into a ditch &mdash; anywhere away from the potential impact zone. Vehicles striking stopped trucks is a leading cause of roadside fatalities.</div>';
  body += '</div>';
  body += '<div class="warning-box"><strong>Remember:</strong> Your life is more valuable than any load, any timeline, and any repair. If a situation feels unsafe, remove yourself from it and call for professional help.</div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 11: Basic Defensive Driving ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 11: Basic Defensive Driving</h2>';
  body += '<p>Defensive driving means anticipating hazards and making decisions that reduce risk, regardless of what other drivers do. In an 80,000-pound truck, you cannot stop quickly, you cannot swerve easily, and every collision is magnified. Defensive driving is your primary safety tool.</p>';

  body += '<h3>7-Second Following Distance</h3>';
  body += '<p>Maintain at least a 7-second following distance from the vehicle ahead of you under normal conditions. To measure: pick a fixed point (sign, overpass, shadow). When the vehicle ahead passes it, count &ldquo;one-one-thousand, two-one-thousand&rdquo; up to seven. If you reach the point before seven seconds, you are too close.</p>';
  body += '<p>Increase to 8&ndash;10 seconds in rain, fog, or heavy traffic. Increase to 10+ seconds in snow, ice, or any condition where stopping distance increases.</p>';

  body += '<h3>Mirror Scanning</h3>';
  body += '<p>Check your mirrors every 5&ndash;8 seconds. This is not optional &mdash; it is a trained habit that prevents lane-change collisions, helps you track vehicles in your blind spots, and keeps you aware of developing traffic situations behind you.</p>';
  body += '<p>Scanning pattern: left mirror, road ahead, right mirror, road ahead, instruments, road ahead. Repeat continuously.</p>';

  body += '<h3>Distraction-Free Driving</h3>';
  body += '<ul>';
  body += '<li>Phone: mounted and hands-free, or stowed. Never text while driving. Never.</li>';
  body += '<li>GPS: program your route before you start driving. Do not enter addresses while rolling.</li>';
  body += '<li>Food: eat during stops, not while driving. A dropped sandwich causes the same inattention as a phone.</li>';
  body += '<li>Paperwork: never review documents while driving.</li>';
  body += '<li>Reaching: if something falls, leave it until you stop.</li>';
  body += '</ul>';

  body += '<h3>Night Driving Basics</h3>';
  body += '<ul>';
  body += '<li>Reduce speed. Your headlights illuminate approximately 250&ndash;350 feet ahead. At 55 mph, your stopping distance exceeds 400 feet. You are always &ldquo;overdriving&rdquo; your headlights at highway speed.</li>';
  body += '<li>Keep your windshield and headlights clean. A dirty windshield dramatically reduces visibility and increases glare.</li>';
  body += '<li>Use low beams in fog. High beams reflect off fog particles and reduce visibility.</li>';
  body += '<li>Watch for pedestrians, cyclists, and animals at the edges of your headlight beam.</li>';
  body += '<li>Avoid staring at oncoming headlights. Look toward the right edge of the road to maintain your lane.</li>';
  body += '<li>Interior cab lights should be off or dimmed while driving to preserve night vision.</li>';
  body += '</ul>';
  body += Packets._footer() + '</div>';

  /* ---- Section 12: Your Daily Routine ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 12: Your Daily Routine</h2>';
  body += '<p>The drivers who last longest in this industry &mdash; and who stay safest &mdash; are the ones with consistent routines. A routine removes decision fatigue, ensures nothing gets skipped, and builds habits that protect you automatically, even when you&rsquo;re tired.</p>';

  body += '<h3>Morning Checklist</h3>';
  body += Packets._checkLines([
    'Drink 16 oz of water immediately upon waking',
    'Stretch for 5 minutes (see Section 4 stretching routine)',
    'Eat a real breakfast (protein + complex carbs &mdash; eggs, oatmeal, fruit)',
    'Complete your full pre-trip inspection (Section 6)',
    'Check weather and road conditions for your route',
    'Program GPS and review your planned route and stops',
    'Call or text family (good morning check-in)',
    'Verify ELD status and log on duty'
  ]);

  body += '<h3>On-Road Checklist (Throughout the Day)</h3>';
  body += Packets._checkLines([
    'Maintain 7-second following distance at all times',
    'Check mirrors every 5&ndash;8 seconds',
    'Take a break every 2&ndash;3 hours (stretch, hydrate, walk)',
    'Eat a proper meal at midday &mdash; don&rsquo;t skip lunch',
    'Monitor fatigue level honestly &mdash; if drowsy, pull over and nap',
    'Keep phone stowed or hands-free only',
    'Stay hydrated &mdash; sip water throughout the drive',
    'Track your HOS &mdash; plan your stops before you run out of time'
  ]);

  body += '<h3>Evening Checklist</h3>';
  body += Packets._checkLines([
    'Complete your post-trip DVIR (Section 6) and report any defects',
    'Take a 15&ndash;30 minute walk (even laps around the truck stop count)',
    'Call family &mdash; evening video call or conversation',
    'Eat dinner &mdash; prioritize vegetables and protein over fried foods',
    'Limit screen time 30&ndash;60 minutes before bed (blue light disrupts sleep)',
    'Practice 4-7-8 breathing (Section 5) to wind down',
    'Set alarm with enough time for a full morning routine',
    'Target 7&ndash;8 hours of sleep &mdash; this is non-negotiable for safe driving'
  ]);
  body += '<div class="tip-box"><strong>The 90-Day Rule:</strong> Follow this routine every single day for your first 90 days. After that, it won&rsquo;t feel like a checklist &mdash; it will feel like who you are. That&rsquo;s the goal.</div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 13: Key Contacts & Resources ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 13: Key Contacts &amp; Resources</h2>';

  body += '<h3>Federal &amp; State Agencies</h3>';
  body += '<table><thead><tr><th>Agency</th><th>Contact</th></tr></thead><tbody>';
  body += '<tr><td>FMCSA (Federal Motor Carrier Safety Administration)</td><td>fmcsa.dot.gov &mdash; 1-800-832-5660</td></tr>';
  body += '<tr><td>Caltrans (California DOT)</td><td>dot.ca.gov &mdash; 1-916-654-5266</td></tr>';
  body += '<tr><td>CHP Commercial Vehicle Section</td><td>chp.ca.gov &mdash; 1-800-835-5247</td></tr>';
  body += '<tr><td>National Response Center (Hazmat Spills)</td><td>1-800-424-8802</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Crisis &amp; Mental Health</h3>';
  body += '<table><thead><tr><th>Resource</th><th>Contact</th></tr></thead><tbody>';
  body += '<tr><td>988 Suicide &amp; Crisis Lifeline</td><td>Call or text 988</td></tr>';
  body += '<tr><td>Crisis Text Line</td><td>Text HOME to 741741</td></tr>';
  body += '<tr><td>SAMHSA National Helpline</td><td>1-800-662-4357 (24/7, free, confidential)</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Industry Organizations</h3>';
  body += '<table><thead><tr><th>Organization</th><th>Contact</th></tr></thead><tbody>';
  body += '<tr><td>OOIDA (Owner-Operator Independent Drivers Association)</td><td>ooida.com &mdash; 1-800-444-5791</td></tr>';
  body += '<tr><td>St. Christopher Truckers Relief Fund</td><td>truckersfund.org &mdash; 1-865-202-9428</td></tr>';
  body += '<tr><td>Truckers Against Trafficking</td><td>truckersagainsttrafficking.org &mdash; 1-888-373-7888</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Mile 12 Warrior</h3>';
  body += '<table><thead><tr><th>Resource</th><th>Contact</th></tr></thead><tbody>';
  body += '<tr><td>Website</td><td>mile12warrior.com</td></tr>';
  body += '<tr><td>Email</td><td>info@mile12warrior.com</td></tr>';
  body += '</tbody></table>';
  body += Packets._footer() + '</div>';

  /* ---- Back Cover ---- */
  body += '<div class="page-break cover-page">' +
    '<p style="font-size:14pt;font-family:Georgia,serif;max-width:600px;line-height:1.8;font-style:italic;">&ldquo;Your first 90 days set the tone for your entire career. Master these fundamentals and you&rsquo;ll be ahead of most drivers with decades on the road.&rdquo;</p>' +
    '<p style="font-size:12pt;margin-top:16px;">&mdash; Mile 12 Warrior</p>' +
    Packets._footer() + '</div>';

  return Packets._wrap('Mile 12 Warrior — New Driver Safety & Wellness Packet', body);
};

/* ============================================================
   2. SEASONED DRIVER PACKET — Tier 2
   ============================================================ */
Packets.seasonedDriver = function () {
  var body = '';

  /* ---- Cover Page ---- */
  body += '<div class="cover-page">' +
    '<div class="tier-badge">Tier 2 &mdash; Experienced Driver</div>' +
    '<h1>Seasoned Driver Advanced Safety &amp; Wellness Packet</h1>' +
    '<p class="subtitle">For drivers with 2+ years experience &mdash; advanced strategies, career sustainability, and staying sharp after Mile 12.</p>' +
    '<p style="margin-top:32px;font-size:12pt;"><strong>Mile 12 Warrior LLC</strong><br>Driver Safety &amp; Wellness</p>' +
    '<p style="margin-top:24px;font-size:10pt;">Date Issued: ____________________</p>' +
    '</div>';

  /* ---- Table of Contents ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Table of Contents</h2><ul class="toc">';
  var tocItems = [
    'Welcome Back to Basics',
    'HOS Refresher & Common Violations',
    'Advanced Fatigue Science',
    'Long-Term Physical Health',
    'Mental Health & Career Longevity',
    'Advanced Road Hazards',
    'Advanced Defensive Driving',
    'Emergency Preparedness Review',
    'Regulatory Updates & Self-Audit',
    'Career Wellness Action Plan',
    'Key Contacts & Resources'
  ];
  for (var i = 0; i < tocItems.length; i++) {
    body += '<li>Section ' + (i + 1) + ': ' + tocItems[i] + '</li>';
  }
  body += '</ul>' + Packets._footer() + '</div>';

  /* ---- Section 1: Welcome Back to Basics ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 1: Welcome Back to Basics</h2>';
  body += '<p>You&rsquo;ve been at this for a while. You know the roads, you know the regulations, and you know how to handle your rig. That experience is invaluable &mdash; but it comes with a hidden cost: complacency.</p>';
  body += '<p>FMCSA data consistently shows that experienced drivers (5&ndash;15 years of service) are involved in a disproportionate number of serious crashes. Not because they lack skill, but because familiarity breeds overconfidence. The pre-trip that used to take 15 minutes now takes 5. The following distance that used to be 7 seconds is now 4. The fatigue that used to make you pull over now gets one more cup of coffee.</p>';

  body += '<h3>The "Mile 12" Concept</h3>';
  body += '<p>For new drivers, Mile 12 is the point in each trip where alertness drops as routine takes over. For experienced drivers, Mile 12 is something bigger: it&rsquo;s the point in your career where routine has become so ingrained that you stop actively thinking about safety. You&rsquo;re driving on autopilot &mdash; not just on the road, but in your habits, your health, and your mindset.</p>';
  body += '<p>This packet is designed to pull you back to full alertness. Not because you don&rsquo;t know this material &mdash; you do. But because knowing it and actively practicing it are two different things.</p>';

  body += '<h3>The Numbers That Should Concern You</h3>';
  body += '<div class="warning-box">';
  body += '&bull; <strong>53% of truck driver fatalities</strong> involve drivers with 5+ years of experience (NHTSA data).<br>';
  body += '&bull; <strong>Drivers aged 45&ndash;54</strong> have the highest fatal crash rate per 100 million miles.<br>';
  body += '&bull; <strong>Vehicle inspection violations</strong> are the #1 reason for roadside out-of-service orders, and experienced drivers are cited more often for brake and lighting issues than new drivers.<br>';
  body += '&bull; <strong>HOS violations</strong> increase after 3 years of driving &mdash; not because drivers don&rsquo;t understand the rules, but because they start &ldquo;managing&rdquo; their logs.</div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 2: HOS Refresher ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 2: HOS Refresher &amp; Common Violations</h2>';
  body += '<p><em>Reference: 49 CFR Part 395</em></p>';

  body += '<h3>Quick HOS Reference</h3>';
  body += '<table><thead><tr><th>Rule</th><th>Limit</th></tr></thead><tbody>';
  body += '<tr><td>Driving Limit</td><td>11 hours after 10 consecutive hours off duty</td></tr>';
  body += '<tr><td>On-Duty Window</td><td>14 consecutive hours (does not pause)</td></tr>';
  body += '<tr><td>Off-Duty Minimum</td><td>10 consecutive hours</td></tr>';
  body += '<tr><td>Break Requirement</td><td>30 minutes after 8 cumulative hours of driving</td></tr>';
  body += '<tr><td>Weekly Limit</td><td>60 hours / 7 days or 70 hours / 8 days</td></tr>';
  body += '<tr><td>34-Hour Restart</td><td>Resets weekly clock</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Top 5 HOS Violations (FMCSA Data)</h3>';
  body += '<div class="numbered-item" style="counter-reset:item"><strong>Driving beyond the 11-hour limit.</strong> Often by &ldquo;just 20 minutes to make the stop.&rdquo; Every minute over is a recordable violation.</div>';
  body += '<div class="numbered-item"><strong>Driving beyond the 14-hour window.</strong> The most common misunderstanding: the 14-hour clock does not stop. Waiting 3 hours at a shipper does not give you 3 extra hours to drive.</div>';
  body += '<div class="numbered-item"><strong>False log entries.</strong> Editing ELD records to show off-duty time during driving is a federal offense with criminal penalties.</div>';
  body += '<div class="numbered-item"><strong>Failing to take the 30-minute break.</strong> Missing or short-changing the break after 8 hours of cumulative driving.</div>';
  body += '<div class="numbered-item"><strong>Operating after 60/70-hour limit.</strong> Losing track of cumulative on-duty hours across the week.</div>';

  body += '<h3>Sleeper Berth Split Provisions</h3>';
  body += '<p>Experienced drivers often use split sleeper berth periods for scheduling flexibility:</p>';
  body += '<ul>';
  body += '<li><strong>7/3 Split:</strong> Take at least 7 consecutive hours in the sleeper berth, plus a separate period of at least 3 hours (off-duty or sleeper berth). Neither period counts against your 14-hour window.</li>';
  body += '<li>The qualifying periods do not need to be consecutive with each other.</li>';
  body += '<li>Driving time before and after each rest period cannot violate the 11-hour or 14-hour limits when calculated against the appropriate period.</li>';
  body += '</ul>';

  body += '<h3>Personal Conveyance Rules</h3>';
  body += '<p>Personal conveyance is the movement of a CMV for personal use while off duty. Key rules:</p>';
  body += '<ul>';
  body += '<li>You must be relieved of all work-related duties and responsibilities for the load.</li>';
  body += '<li>The movement must be personal (to a restaurant, lodging, or home &mdash; not to the next shipper or receiver).</li>';
  body += '<li>Record as off-duty with an annotation of &ldquo;personal conveyance.&rdquo;</li>';
  body += '<li>You must be in compliance with HOS rules at the start of personal conveyance.</li>';
  body += '<li>Bobtailing (driving without a trailer) to a nearby hotel after reaching your 11-hour limit is a common legitimate use.</li>';
  body += '</ul>';

  body += '<h3>Agricultural Exemptions</h3>';
  body += '<p>If you haul agricultural commodities during planting and harvest seasons, be aware of the agricultural exemption (49 CFR 395.1(k)). During the defined harvest period, drivers transporting agricultural products from the source within a 150 air-mile radius are exempt from certain HOS provisions. Verify the specific state harvest season declarations with FMCSA.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 3: Advanced Fatigue Science ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 3: Advanced Fatigue Science</h2>';

  body += '<h3>Cumulative Sleep Debt</h3>';
  body += '<p>Sleep debt is not a metaphor &mdash; it is a measurable physiological deficit. If you need 7&ndash;8 hours of sleep per night and consistently get 6, you accumulate a deficit that compounds over time. After one week of sleeping 6 hours per night, your cognitive impairment equals that of someone who has been awake for 24 consecutive hours. After two weeks, it equals 48 hours of total sleep deprivation.</p>';
  body += '<p>The dangerous part: you stop <em>feeling</em> sleepy. Your brain adapts to the impairment, but your reaction time, judgment, and attention do not recover without actual sleep. You feel fine. You are not fine.</p>';

  body += '<h3>Microsleep</h3>';
  body += '<p>Microsleeps are involuntary episodes of sleep lasting 1&ndash;30 seconds. Your eyes may remain open. You have no awareness that they are occurring. At 55 mph, a 4-second microsleep covers the length of a football field. Microsleeps are your brain&rsquo;s last-resort shutdown when sleep debt becomes critical. If you experience even one, you are severely impaired and must stop driving immediately.</p>';

  body += '<h3>Circadian Disruption on Schedule Changes</h3>';
  body += '<p>Switching between day and night schedules is one of the most dangerous fatigue risks in trucking. Your circadian rhythm needs 2&ndash;3 days to shift by even a few hours. Strategies for schedule transitions:</p>';
  body += '<ul>';
  body += '<li>Shift your sleep time by 1&ndash;2 hours per day leading up to the schedule change.</li>';
  body += '<li>Use strategic light exposure: bright light during your new &ldquo;day,&rdquo; darkness during your new &ldquo;night.&rdquo;</li>';
  body += '<li>Plan your most demanding driving for the first 6 hours of your wake period, when alertness is highest.</li>';
  body += '<li>Avoid the 2:00&ndash;4:00 AM and 1:00&ndash;3:00 PM danger windows regardless of your schedule.</li>';
  body += '</ul>';

  body += '<h3>Sleep Apnea Re-Screening</h3>';
  body += '<p>Under 49 CFR Part 391, your CDL medical examiner may require sleep apnea screening at each DOT physical, especially if your BMI exceeds 35 or your neck circumference exceeds 17 inches. If you were previously diagnosed, your compliance with CPAP treatment will be verified. Non-compliance can result in loss of medical certification.</p>';

  body += '<h3>The "Coffee Nap" Technique</h3>';
  body += '<div class="tip-box"><strong>Advanced Strategy:</strong> Drink a cup of coffee (about 200mg caffeine), then immediately take a 20-minute nap. Caffeine takes approximately 20 minutes to reach peak absorption. You wake up with the restorative benefit of the nap plus the alertness boost of the caffeine simultaneously. Studies show this combination outperforms either intervention alone.</div>';

  body += '<h3>Fatigue Risk Management</h3>';
  body += '<p>As an experienced driver, you should actively manage fatigue rather than react to it:</p>';
  body += Packets._checkLines([
    'Track your sleep hours in a log or app for at least 2 weeks to identify patterns',
    'Know your personal fatigue triggers (time of day, road type, weather, meal timing)',
    'Plan demanding driving segments for high-alertness windows',
    'Use your sleeper berth split strategically to align rest with circadian low points',
    'Never rely on caffeine, loud music, or open windows as fatigue countermeasures &mdash; they buy minutes, not safety'
  ]);
  body += Packets._footer() + '</div>';

  /* ---- Section 4: Long-Term Physical Health ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 4: Long-Term Physical Health</h2>';
  body += '<p>After several years of driving, the physical toll of this career becomes real. Truck drivers have significantly higher rates of cardiovascular disease, diabetes, obesity, and musculoskeletal disorders than the general population. The good news: these conditions are largely preventable and manageable with consistent effort.</p>';

  body += '<h3>Cardiovascular Risk</h3>';
  body += '<p>Truck drivers have approximately <strong>twice the cardiovascular disease risk</strong> of the general population. Contributing factors include prolonged sitting, high-sodium diets, stress, sleep disruption, and limited exercise. Get your blood pressure, cholesterol, and blood glucose checked at every DOT physical &mdash; and consider annual checkups with your personal physician between DOT physicals.</p>';

  body += '<h3>Diabetes Prevention</h3>';
  body += '<p>Type 2 diabetes rates among truck drivers are significantly elevated. Prevention strategies: maintain a healthy weight, limit sugar and refined carbohydrates, eat vegetables and whole grains, exercise regularly, and get screened at your DOT physical. If diagnosed, consistent management is critical for maintaining your CDL medical certification.</p>';

  body += '<h3>Cancer Screening</h3>';
  body += '<p>Drivers have elevated rates of certain cancers. The left arm and left side of the face receive significantly more UV exposure than the right side due to the driver&rsquo;s side window. Use SPF 30+ sunscreen daily on exposed skin, wear UV-blocking sunglasses, and consider a UV-blocking window film. Follow standard cancer screening guidelines for your age and family history.</p>';

  body += '<h3>Hearing Conservation</h3>';
  body += '<p>Chronic exposure to engine noise, wind noise, and road noise can cause progressive hearing loss. Use quality earplugs or noise-canceling earbuds during sleeper berth rest. Keep cab windows closed when possible. Get a hearing test at your DOT physical baseline and monitor for changes.</p>';

  body += '<h3>Ergonomic Cab Setup</h3>';
  body += '<ul>';
  body += '<li>Seat position: knees slightly bent, able to fully depress clutch/brake without stretching.</li>';
  body += '<li>Lumbar support: adjust or add a cushion so your lower back maintains its natural curve.</li>';
  body += '<li>Steering wheel: arms slightly bent, wrists below shoulder height. Avoid gripping at 12 o&rsquo;clock.</li>';
  body += '<li>Mirrors: adjust so you can see without twisting your torso or neck.</li>';
  body += '<li>Reduce vibration: quality seat cushion, proper tire inflation, smooth driving inputs.</li>';
  body += '</ul>';

  body += '<h3>Resistance Training Program</h3>';
  body += '<p>This bodyweight/minimal-equipment program can be performed at any truck stop. Three sessions per week, 20&ndash;25 minutes each:</p>';
  body += '<table><thead><tr><th>Exercise</th><th>Sets x Reps</th><th>Notes</th></tr></thead><tbody>';
  body += '<tr><td>Push-Ups</td><td>3 x 10</td><td>Modify on knees if needed. Full range of motion.</td></tr>';
  body += '<tr><td>Bodyweight Squats</td><td>3 x 15</td><td>Feet shoulder-width, sit back like sitting in a chair. Knees track over toes.</td></tr>';
  body += '<tr><td>Walking Lunges</td><td>2 x 10 each leg</td><td>Step forward, lower back knee toward ground. Alternate legs.</td></tr>';
  body += '<tr><td>Plank Hold</td><td>3 x 30 seconds</td><td>Forearms on ground, body straight. Don&rsquo;t sag or pike.</td></tr>';
  body += '<tr><td>Resistance Band Rows</td><td>3 x 12</td><td>Anchor band to trailer handle or mirror bracket. Pull to chest, squeeze shoulder blades.</td></tr>';
  body += '<tr><td>Calf Raises</td><td>3 x 20</td><td>Stand on step edge. Rise on toes, lower below step level.</td></tr>';
  body += '</tbody></table>';
  body += '<div class="tip-box"><strong>Gear Needed:</strong> One resistance band (medium tension) and a yoga mat or towel. Total investment: under $20. Store in your side box.</div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 5: Mental Health & Career Longevity ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 5: Mental Health &amp; Career Longevity</h2>';
  body += '<p>After years on the road, the psychological demands of trucking compound. What was exciting in year one can feel grinding by year five. Protecting your mental health is not self-indulgence &mdash; it is career preservation.</p>';

  body += '<h3>Burnout Recognition</h3>';
  body += '<p>Burnout is not just &ldquo;being tired.&rdquo; It is a clinical state of chronic stress characterized by:</p>';
  body += '<ul>';
  body += '<li><strong>Emotional exhaustion:</strong> You feel drained before the day even starts.</li>';
  body += '<li><strong>Cynicism/depersonalization:</strong> You stop caring about safety, your load, or other drivers.</li>';
  body += '<li><strong>Reduced professional efficacy:</strong> You feel like nothing you do matters or makes a difference.</li>';
  body += '</ul>';
  body += '<p>If you recognize these patterns, take action before they escalate. Talk to someone you trust, adjust your schedule if possible, and consider whether your current driving situation (carrier, route, schedule) is sustainable.</p>';

  body += '<h3>Boundary-Setting with Dispatch</h3>';
  body += '<p>You have the legal right &mdash; and the professional obligation &mdash; to refuse loads or assignments that would require you to violate HOS, drive fatigued, or operate in unsafe conditions. A good carrier respects these boundaries. If your carrier consistently pressures you to violate regulations, document it and consider reporting to FMCSA&rsquo;s coercion hotline (1-800-832-5660).</p>';

  body += '<h3>Relationship Maintenance</h3>';
  body += '<p>The divorce rate among long-haul truckers significantly exceeds the national average. Protecting your relationships requires deliberate effort:</p>';
  body += '<ul>';
  body += '<li>Scheduled, protected communication time with your partner &mdash; not just check-ins, but real conversations.</li>';
  body += '<li>Be present when you are home. Quality of home time matters more than quantity.</li>';
  body += '<li>Include your partner in career decisions (schedule changes, carrier changes, route preferences).</li>';
  body += '<li>Consider couples counseling proactively &mdash; not just when things are breaking down.</li>';
  body += '</ul>';

  body += '<h3>Financial Stress Management</h3>';
  body += '<p>Financial stress is a leading cause of mental health problems among drivers. Steps to reduce it:</p>';
  body += '<ul>';
  body += '<li>Build an emergency fund of at least 3 months of expenses.</li>';
  body += '<li>Track your per diem and maximize your tax deductions (consult a trucker-specialized CPA).</li>';
  body += '<li>Avoid truck stop impulse purchases &mdash; set a weekly discretionary budget.</li>';
  body += '<li>If you are an owner-operator, maintain separate business and personal accounts.</li>';
  body += '</ul>';

  body += '<h3>Substance Abuse Awareness</h3>';
  body += '<p>The pressures of the road can make substances feel like solutions. They are not. Alcohol use disorder, stimulant abuse, and prescription drug misuse are significant problems in trucking. If you are struggling, SAMHSA&rsquo;s helpline (1-800-662-4357) provides free, confidential referrals 24/7. Treatment is compatible with maintaining your CDL in most cases.</p>';

  body += '<h3>Crisis Resources</h3>';
  body += '<div class="warning-box"><strong>24/7 Help:</strong><br>';
  body += '&bull; <strong>988 Suicide &amp; Crisis Lifeline:</strong> Call or text <strong>988</strong><br>';
  body += '&bull; <strong>Crisis Text Line:</strong> Text <strong>HOME</strong> to <strong>741741</strong><br>';
  body += '&bull; <strong>SAMHSA:</strong> <strong>1-800-662-4357</strong></div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 6: Advanced Road Hazards ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 6: Advanced Road Hazards</h2>';
  body += '<p>Experience teaches you how to handle most road situations. This section addresses the hazards that even experienced drivers underestimate &mdash; the ones where complacency is most dangerous.</p>';

  body += '<h3>Black Ice</h3>';
  body += '<ul>';
  body += '<li>Bridges and overpasses freeze first &mdash; always. Reduce speed before crossing, not during.</li>';
  body += '<li>Black ice forms most commonly at dawn and dusk when temperatures cross the freezing point.</li>';
  body += '<li>If you feel your drive wheels lose traction, do not brake. Ease off the throttle and steer straight until you regain grip.</li>';
  body += '<li>Watch the spray from vehicles ahead. If spray suddenly stops but the road appears wet, it may be ice.</li>';
  body += '</ul>';

  body += '<h3>California Chain Control Levels</h3>';
  body += '<table><thead><tr><th>Level</th><th>Requirement</th></tr></thead><tbody>';
  body += '<tr><td>R-1</td><td>Chains or snow tread tires required on drive axle.</td></tr>';
  body += '<tr><td>R-2</td><td>Chains required on drive axle regardless of tire type. AWD/4WD vehicles with snow tread tires may proceed without chains.</td></tr>';
  body += '<tr><td>R-3</td><td>Chains required on all vehicles. No exceptions. Commercial vehicles must chain all drive axles and may need trailer chains.</td></tr>';
  body += '</tbody></table>';
  body += '<p>Check Caltrans QuickMap (quickmap.dot.ca.gov) for real-time chain control status. Fines for non-compliance start at $500 and increase for each subsequent offense.</p>';

  body += '<h3>Dense Fog Protocol</h3>';
  body += '<ul>';
  body += '<li>Use low beams only. High beams reflect off fog particles and worsen visibility.</li>';
  body += '<li>Turn off cruise control. You need full throttle and brake responsiveness.</li>';
  body += '<li>Increase following distance to maximum &mdash; in dense fog, 10+ seconds.</li>';
  body += '<li>Use fog lines (right-side road markings) as your guide, not center lines.</li>';
  body += '<li>If visibility drops below 200 feet, seriously consider pulling off and waiting.</li>';
  body += '<li>California&rsquo;s Central Valley experiences some of the worst fog in North America. Multi-vehicle pileups on I-5 and SR-99 are annual events. Reduce speed or stop entirely.</li>';
  body += '</ul>';

  body += '<h3>Crosswinds &amp; Empty Trailer Rollover</h3>';
  body += '<p>An empty or lightly loaded trailer is a sail. Crosswind rollover risk increases dramatically above 40 mph when empty. High-risk areas include open plains, bridge crossings, mountain passes, and highway cuts through ridges.</p>';
  body += '<ul>';
  body += '<li>Monitor weather forecasts for wind advisories (sustained 25+ mph or gusts 40+ mph).</li>';
  body += '<li>Reduce speed significantly when bobtailing or pulling an empty trailer in wind.</li>';
  body += '<li>Grip the wheel firmly with both hands. Anticipate gusts when emerging from wind shadows (behind overpasses, buildings, or terrain).</li>';
  body += '<li>If conditions become unmanageable, park and wait. No load is worth a rollover.</li>';
  body += '</ul>';

  body += '<h3>Tire Blowout Recovery</h3>';
  body += '<div class="warning-box"><strong>Counter-intuitive but critical:</strong><br>';
  body += '&bull; <strong>Do NOT brake immediately.</strong> A steer tire blowout will pull the truck violently. Braking increases the pull and can cause loss of control.<br>';
  body += '&bull; <strong>Accelerate slightly</strong> to stabilize the vehicle and maintain directional control.<br>';
  body += '&bull; <strong>Grip the wheel firmly</strong> and steer to counteract the pull.<br>';
  body += '&bull; <strong>Gradually slow down</strong> by easing off the throttle once you have control.<br>';
  body += '&bull; <strong>Signal and move to the shoulder</strong> when speed has decreased and you have directional control.</div>';

  body += '<h3>Wildlife Timing</h3>';
  body += '<p>Vehicle-wildlife collisions peak during dawn and dusk, and during October through December (deer mating season). Be especially alert in rural, wooded, and mountainous areas during these times. If an animal enters your lane, brake firmly in a straight line if possible &mdash; do not swerve, as losing control of an 80,000-pound vehicle is more dangerous than a direct strike.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 7: Advanced Defensive Driving ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 7: Advanced Defensive Driving</h2>';

  body += '<h3>Space Cushion Management</h3>';
  body += '<p>Professional drivers manage space in all directions, not just following distance:</p>';
  body += '<ul>';
  body += '<li><strong>Ahead:</strong> 7+ seconds minimum. Extend in poor conditions.</li>';
  body += '<li><strong>Behind:</strong> Monitor tailgaters. If being tailgated, increase your following distance ahead (giving yourself more time to stop gradually, which gives the tailgater more time to react).</li>';
  body += '<li><strong>Sides:</strong> Avoid riding next to vehicles. Either pass them or fall back to create lateral space. Never pace a vehicle in your blind spot.</li>';
  body += '<li><strong>Above:</strong> Know your vehicle height. Low bridges, tree branches, and overhead wires are real hazards.</li>';
  body += '<li><strong>Below:</strong> Watch for potholes, debris, uneven pavement, and railroad crossings that can damage tires or axles.</li>';
  body += '</ul>';

  body += '<h3>Predictive Traffic Reading</h3>';
  body += '<p>Look 15&ndash;20 seconds ahead &mdash; not at the vehicle directly in front of you. Watch brake lights 3&ndash;5 vehicles ahead. Observe traffic flow patterns. Anticipate merging traffic, lane drops, and work zones. The further ahead you look, the more time you have to react smoothly rather than abruptly.</p>';

  body += '<h3>Intersection Scanning</h3>';
  body += '<p>Even when you have a green light, scan left-right-left before entering any intersection. Red-light runners are a significant cause of truck crashes. Your truck cannot stop fast enough to avoid a vehicle running a red light, but you can reduce impact severity by scanning and beginning to brake before full entry into the intersection.</p>';

  body += '<h3>Construction Zone Protocol</h3>';
  body += '<ul>';
  body += '<li>Fines are doubled in construction zones in all 50 states. In California, speeding in a construction zone can result in a $1,000+ fine.</li>';
  body += '<li>Slow down early and well before the cones begin.</li>';
  body += '<li>Watch for workers, equipment, lane shifts, and changing speed limits.</li>';
  body += '<li>Do not change lanes within the construction zone unless directed to do so.</li>';
  body += '<li>Be alert for sudden stops from vehicles ahead navigating unfamiliar lane patterns.</li>';
  body += '</ul>';

  body += '<h3>Night Driving Advanced Techniques</h3>';
  body += '<ul>';
  body += '<li>Use your high beams whenever traffic allows, but switch to low beams within 500 feet of an oncoming vehicle.</li>';
  body += '<li>Adjust your speed so your stopping distance stays within your sight distance. In practice, this means driving below the speed limit on unlit roads.</li>';
  body += '<li>Watch for &ldquo;retroreflective&rdquo; evidence of hazards: reflectors on guardrails curving ahead tell you the road curves before your headlights illuminate it.</li>';
  body += '<li>If fatigued, no amount of technique compensates. Stop and sleep.</li>';
  body += '</ul>';
  body += Packets._footer() + '</div>';

  /* ---- Section 8: Emergency Preparedness Review ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 8: Emergency Preparedness Review</h2>';
  body += '<p>When was the last time you actually checked your emergency equipment? Not glanced at it &mdash; <em>checked</em> it? Use this section to perform a thorough audit.</p>';

  body += '<h3>Breakdown Kit Audit</h3>';
  body += Packets._checkLines([
    'Three reflective triangles present and undamaged (49 CFR 393.95)',
    'Fire extinguisher charged, inspection tag current (49 CFR 393.95)',
    'Spare fuses present and correct amperage',
    'High-visibility vest clean and reflective strips intact',
    'Flashlight works, batteries fresh',
    'LED flares functional',
    'Jumper cables or jump pack charged',
    'Tool kit complete (wrench, pliers, screwdrivers, sockets)',
    'Tire gauge calibrated (check against a known-accurate gauge)',
    'Coolant, oil, washer fluid stocked',
    'Glad-hand seals available',
    'Chains present and correct size (if operating in chain-required areas)'
  ]);

  body += '<h3>First Aid Kit Audit</h3>';
  body += Packets._checkLines([
    'All items present per original inventory',
    'No expired medications (check acetaminophen, ibuprofen, antibiotic ointment)',
    'Tourniquet in functional condition',
    'CPR mask/shield clean and sealed',
    'Gloves not degraded or discolored',
    'Emergency blankets sealed in packaging'
  ]);

  body += '<h3>Communication Plan Review</h3>';
  body += Packets._checkLines([
    'Emergency contacts updated in phone and on physical card in cab',
    'Dispatch number current',
    'Roadside assistance number current and saved in phone',
    'Insurance information accessible',
    'Phone charger and backup battery charged and functional'
  ]);

  body += '<h3>Roadside Safety Protocol Refresher</h3>';
  body += '<p>Review the 8-step protocol: (1) Pull off completely, (2) Hazards on, (3) Vest on, (4) Triangles at 10/100/200 ft, (5) Passenger side, (6) Call for help, (7) No lane repairs, (8) Exit if rear-end risk. If you can&rsquo;t recite these from memory, practice until you can.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 9: Regulatory Updates & Self-Audit ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 9: Regulatory Updates &amp; Self-Audit</h2>';

  body += '<h3>How to Check Your CSA Score</h3>';
  body += '<p>Your Compliance, Safety, Accountability (CSA) score directly impacts your employability. High scores (bad) can disqualify you from working for top carriers.</p>';
  body += '<div class="numbered-item" style="counter-reset:item">Go to <strong>ai.fmcsa.dot.gov/SMS</strong></div>';
  body += '<div class="numbered-item">Search for your carrier&rsquo;s DOT number to see the company&rsquo;s safety scores.</div>';
  body += '<div class="numbered-item">For your individual Pre-Employment Screening (PSP) report, go to <strong>psp.fmcsa.dot.gov</strong>.</div>';
  body += '<div class="numbered-item">Your PSP shows your 5-year crash history and 3-year inspection history.</div>';
  body += '<div class="numbered-item">Review it annually. Know what&rsquo;s on it before a potential employer does.</div>';

  body += '<h3>How to Challenge Incorrect Violations</h3>';
  body += '<p>If an inspection resulted in a violation you believe was incorrect:</p>';
  body += '<ul>';
  body += '<li>Use the DataQs system at <strong>dataqs.fmcsa.dot.gov</strong> to request a review.</li>';
  body += '<li>Provide supporting documentation (repair receipts, photos, witness statements).</li>';
  body += '<li>The reviewing agency will investigate and either uphold, modify, or remove the violation.</li>';
  body += '<li>Act promptly &mdash; while there is no strict deadline, timely challenges are more credible.</li>';
  body += '</ul>';

  body += '<h3>Drug &amp; Alcohol Clearinghouse</h3>';
  body += '<p>The FMCSA Drug &amp; Alcohol Clearinghouse (clearinghouse.fmcsa.dot.gov) is a database of violations. Employers must query it before hiring and annually thereafter. As a driver, you can (and should) view your own record. Any positive test, refusal, or violation is recorded and visible to all prospective employers.</p>';

  body += '<h3>Upcoming Regulatory Awareness</h3>';
  body += '<p>Stay current on FMCSA rulemaking by subscribing to FMCSA&rsquo;s email updates at fmcsa.dot.gov. Key areas under active consideration include speed limiters, automatic emergency braking mandates, and entry-level driver training (ELDT) requirements. Being aware of changes before they take effect gives you a professional advantage.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 10: Career Wellness Action Plan ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 10: Career Wellness Action Plan</h2>';

  body += '<h3>Daily Routine Refinement</h3>';
  body += '<p>After 2+ years, your daily routine should be well-established. But routines need periodic review. Ask yourself:</p>';
  body += '<ul>';
  body += '<li>Am I still doing a thorough pre-trip, or have I started cutting corners?</li>';
  body += '<li>Am I eating better or worse than my first year?</li>';
  body += '<li>Am I exercising, or did that habit slip?</li>';
  body += '<li>Am I getting 7&ndash;8 hours of sleep, or have I accepted 5&ndash;6 as &ldquo;enough&rdquo;?</li>';
  body += '<li>Am I maintaining family connections, or have they become perfunctory?</li>';
  body += '</ul>';

  body += '<h3>Quarterly Health Check Schedule</h3>';
  body += '<table><thead><tr><th>Quarter</th><th>Action</th><th>Completed</th></tr></thead><tbody>';
  body += '<tr><td>Q1 (Jan&ndash;Mar)</td><td>Blood pressure check, weight check, update DOT physical if due</td><td></td></tr>';
  body += '<tr><td>Q2 (Apr&ndash;Jun)</td><td>Dental checkup, vision check, review medications</td><td></td></tr>';
  body += '<tr><td>Q3 (Jul&ndash;Sep)</td><td>Blood work (cholesterol, glucose), skin check (dermatologist), hearing test</td><td></td></tr>';
  body += '<tr><td>Q4 (Oct&ndash;Dec)</td><td>Annual physical with personal physician, flu shot, mental health check-in</td><td></td></tr>';
  body += '</tbody></table>';

  body += '<h3>Annual Goals Template</h3>';
  body += '<table><thead><tr><th>Category</th><th>Goal</th><th>Target Date</th><th>Status</th></tr></thead><tbody>';
  body += '<tr><td>Health</td><td>______________________________</td><td>____________</td><td>____________</td></tr>';
  body += '<tr><td>Fitness</td><td>______________________________</td><td>____________</td><td>____________</td></tr>';
  body += '<tr><td>Financial</td><td>______________________________</td><td>____________</td><td>____________</td></tr>';
  body += '<tr><td>Family</td><td>______________________________</td><td>____________</td><td>____________</td></tr>';
  body += '<tr><td>Career / Skills</td><td>______________________________</td><td>____________</td><td>____________</td></tr>';
  body += '<tr><td>Safety</td><td>______________________________</td><td>____________</td><td>____________</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Mentor Checklist</h3>';
  body += '<p>If you are mentoring a new driver (or considering it), use this checklist:</p>';
  body += Packets._checkLines([
    'Share your pre-trip inspection process and explain what you look for and why',
    'Ride along during their first solo trips and provide constructive feedback',
    'Discuss your own mistakes honestly &mdash; what you learned from incidents or close calls',
    'Help them develop a sustainable daily routine',
    'Teach them how to communicate effectively with dispatch',
    'Introduce them to healthy eating, exercise, and sleep habits on the road',
    'Be available for phone calls during their first 90 days',
    'Model professionalism &mdash; you are shaping the next generation of drivers'
  ]);
  body += Packets._footer() + '</div>';

  /* ---- Section 11: Key Contacts & Resources ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 11: Key Contacts &amp; Resources</h2>';

  body += '<h3>Federal &amp; State Agencies</h3>';
  body += '<table><thead><tr><th>Agency</th><th>Contact</th></tr></thead><tbody>';
  body += '<tr><td>FMCSA</td><td>fmcsa.dot.gov &mdash; 1-800-832-5660</td></tr>';
  body += '<tr><td>Caltrans</td><td>dot.ca.gov &mdash; 1-916-654-5266</td></tr>';
  body += '<tr><td>CHP Commercial Vehicle Section</td><td>chp.ca.gov &mdash; 1-800-835-5247</td></tr>';
  body += '<tr><td>FMCSA Coercion Hotline</td><td>1-800-832-5660</td></tr>';
  body += '<tr><td>DataQs (violation challenges)</td><td>dataqs.fmcsa.dot.gov</td></tr>';
  body += '<tr><td>Drug &amp; Alcohol Clearinghouse</td><td>clearinghouse.fmcsa.dot.gov</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Crisis &amp; Mental Health</h3>';
  body += '<table><thead><tr><th>Resource</th><th>Contact</th></tr></thead><tbody>';
  body += '<tr><td>988 Suicide &amp; Crisis Lifeline</td><td>Call or text 988</td></tr>';
  body += '<tr><td>Crisis Text Line</td><td>Text HOME to 741741</td></tr>';
  body += '<tr><td>SAMHSA</td><td>1-800-662-4357</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Industry &amp; Professional</h3>';
  body += '<table><thead><tr><th>Organization</th><th>Contact</th></tr></thead><tbody>';
  body += '<tr><td>OOIDA (membership, legal support, roadside assistance)</td><td>ooida.com &mdash; 1-800-444-5791</td></tr>';
  body += '<tr><td>OOIDA Legal Department</td><td>1-800-444-5791 ext. 4</td></tr>';
  body += '<tr><td>St. Christopher Truckers Relief Fund</td><td>truckersfund.org &mdash; 1-865-202-9428</td></tr>';
  body += '<tr><td>Truckers Against Trafficking</td><td>truckersagainsttrafficking.org &mdash; 1-888-373-7888</td></tr>';
  body += '<tr><td>ATBS (owner-operator tax &amp; business services)</td><td>atbs.com &mdash; 1-866-920-2827</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Mile 12 Warrior</h3>';
  body += '<table><thead><tr><th>Resource</th><th>Contact</th></tr></thead><tbody>';
  body += '<tr><td>Website</td><td>mile12warrior.com</td></tr>';
  body += '<tr><td>Email</td><td>info@mile12warrior.com</td></tr>';
  body += '</tbody></table>';
  body += Packets._footer() + '</div>';

  /* ---- Back Cover ---- */
  body += '<div class="page-break cover-page">' +
    '<p style="font-size:14pt;font-family:Georgia,serif;max-width:600px;line-height:1.8;font-style:italic;">&ldquo;Experience is your greatest asset &mdash; but only if you keep learning. The best drivers aren&rsquo;t the ones with the most miles; they&rsquo;re the ones who never stop improving.&rdquo;</p>' +
    '<p style="font-size:12pt;margin-top:16px;">&mdash; Mile 12 Warrior</p>' +
    Packets._footer() + '</div>';

  return Packets._wrap('Mile 12 Warrior — Seasoned Driver Advanced Safety & Wellness Packet', body);
};

/* ============================================================
   3. FLEET NEW HIRE PACKET
   ============================================================ */
Packets.fleetNewHire = function () {
  var body = '';

  /* ---- Cover Page ---- */
  body += '<div class="cover-page">' +
    '<h1>Fleet Safety Department</h1>' +
    '<p class="subtitle" style="font-size:18pt;color:#222;margin-bottom:8px;">New Hire Driver Orientation Packet</p>' +
    '<p class="subtitle">Comprehensive onboarding materials for new CDL drivers.<br>Designed for safety department distribution.</p>' +
    '<p style="margin-top:24px;font-size:11pt;">Prepared by <strong>Mile 12 Warrior LLC</strong> &mdash; Driver Safety &amp; Wellness Consultants</p>' +
    '<p style="margin-top:32px;font-size:10pt;">Company Name: ________________________________________</p>' +
    '<p style="font-size:10pt;">Date: ____________________</p>' +
    '</div>';

  /* ---- Cover Letter ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Cover Letter</h2>';
  body += '<p><strong>Dear Safety Director,</strong></p>';
  body += '<p>This packet is designed to be distributed to all new hire CDL drivers during orientation. It covers essential safety topics mandated by FMCSA regulations, company best practices, and driver wellness fundamentals.</p>';
  body += '<p>Proper distribution and documentation of driver acknowledgment protects your drivers, your company, and your insurance program. Annual refresher training combined with thorough onboarding has been shown to reduce crash rates by 20&ndash;30% and can positively impact your insurance premiums.</p>';
  body += '<p>Each section may be used as a standalone training module or as a complete orientation package. The sign-off sheet at the end of this packet provides documentation of receipt and acknowledgment for your driver qualification files as required by 49 CFR Part 391.51.</p>';
  body += '<p>We recommend reviewing this packet periodically and updating the company-specific sections as your policies evolve.</p>';
  body += '<p style="margin-top:24px;">Respectfully,<br><strong>Mile 12 Warrior LLC</strong><br>Driver Safety &amp; Wellness Consultants<br>mile12warrior.com</p>';
  body += Packets._footer() + '</div>';

  /* ---- Table of Contents ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Table of Contents</h2><ul class="toc">';
  var tocItems = [
    'Company Safety Expectations',
    'Federal & State Compliance Overview',
    'Hours of Service — Complete Reference',
    'Vehicle Inspection Requirements',
    'Accident & Incident Procedures',
    'Fatigue Management Program',
    'Driver Wellness Program',
    'Emergency Equipment Requirements',
    'Defensive Driving Standards',
    'Road Hazard Response',
    'Driver Resources'
  ];
  for (var i = 0; i < tocItems.length; i++) {
    body += '<li>Section ' + (i + 1) + ': ' + tocItems[i] + '</li>';
  }
  body += '<li><strong>Driver Acknowledgment &amp; Sign-Off Sheet</strong></li>';
  body += '</ul>' + Packets._footer() + '</div>';

  /* ---- Section 1: Company Safety Expectations ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 1: Company Safety Expectations</h2>';
  body += '<div class="info-box"><strong>Note to Safety Director:</strong> Customize this section with your company-specific policies before distribution.</div>';

  body += '<h3>Company Safety Statement</h3>';
  body += '<p>At <strong>______________________________</strong> (company name), safety is our highest priority. Every employee &mdash; from the CEO to every driver on the road &mdash; is responsible for maintaining a culture of safety. We believe that every accident is preventable and that compliance with federal, state, and company safety regulations is non-negotiable.</p>';

  body += '<h3>Safety Chain of Command</h3>';
  body += '<table><thead><tr><th>Role</th><th>Name</th><th>Phone</th></tr></thead><tbody>';
  body += '<tr><td>Safety Director</td><td>_________________________</td><td>_________________________</td></tr>';
  body += '<tr><td>Assistant Safety Manager</td><td>_________________________</td><td>_________________________</td></tr>';
  body += '<tr><td>Fleet Manager</td><td>_________________________</td><td>_________________________</td></tr>';
  body += '<tr><td>Operations Manager</td><td>_________________________</td><td>_________________________</td></tr>';
  body += '<tr><td>Human Resources</td><td>_________________________</td><td>_________________________</td></tr>';
  body += '<tr><td>After-Hours Safety Hotline</td><td>&mdash;</td><td>_________________________</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Open-Door Policy</h3>';
  body += '<p>Every driver has the right to report safety concerns without fear of retaliation. If you observe an unsafe condition, experience coercion to violate regulations, or have any safety-related concern, you are expected to report it to your immediate supervisor or directly to the Safety Director. If you are not comfortable reporting through the chain of command, you may contact FMCSA&rsquo;s safety hotline at 1-888-368-7238.</p>';

  body += '<h3>Core Safety Expectations</h3>';
  body += Packets._checkLines([
    'Comply with all federal (FMCSA), state, and company safety policies at all times',
    'Complete thorough pre-trip and post-trip inspections every day without exception',
    'Accurately record all hours of service on your ELD',
    'Never operate a vehicle while impaired by fatigue, alcohol, drugs, or illness',
    'Report all accidents, incidents, and near-misses immediately to dispatch and the Safety Director',
    'Maintain your CDL, medical certificate, and all required endorsements in current status',
    'Participate in all required safety training, meetings, and refresher programs',
    'Use all required safety equipment (seat belt, reflective vest, hard hat when required)',
    'Never use a handheld mobile device while driving',
    'Treat all road users, customers, and coworkers with professionalism and respect'
  ]);
  body += Packets._footer() + '</div>';

  /* ---- Section 2: Federal & State Compliance ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 2: Federal &amp; State Compliance Overview</h2>';

  body += '<h3>FMCSA Overview</h3>';
  body += '<p>The Federal Motor Carrier Safety Administration (FMCSA), a division of the U.S. Department of Transportation, regulates the trucking industry under 49 CFR Parts 350&ndash;399. As a CDL driver, you are subject to these regulations regardless of which state you operate in. Key regulatory areas include:</p>';
  body += '<ul>';
  body += '<li><strong>Part 382:</strong> Drug and alcohol testing</li>';
  body += '<li><strong>Part 383:</strong> CDL standards and requirements</li>';
  body += '<li><strong>Part 391:</strong> Driver qualifications (including medical certification)</li>';
  body += '<li><strong>Part 392:</strong> Driving of commercial motor vehicles</li>';
  body += '<li><strong>Part 393:</strong> Parts and accessories (equipment standards)</li>';
  body += '<li><strong>Part 395:</strong> Hours of service</li>';
  body += '<li><strong>Part 396:</strong> Vehicle inspection, repair, and maintenance</li>';
  body += '</ul>';

  body += '<h3>Hours of Service — Summary Table</h3>';
  body += '<table><thead><tr><th>Rule</th><th>Limit</th><th>Reset Method</th></tr></thead><tbody>';
  body += '<tr><td>Driving Limit</td><td>11 hours</td><td>10 consecutive hours off duty</td></tr>';
  body += '<tr><td>On-Duty Window</td><td>14 consecutive hours</td><td>10 consecutive hours off duty</td></tr>';
  body += '<tr><td>Off-Duty Minimum</td><td>10 consecutive hours</td><td>&mdash;</td></tr>';
  body += '<tr><td>30-Minute Break</td><td>After 8 cumulative hours driving</td><td>30 min off-duty or sleeper berth</td></tr>';
  body += '<tr><td>Weekly Limit</td><td>60/7 or 70/8 hours</td><td>34-hour restart</td></tr>';
  body += '</tbody></table>';

  body += '<h3>ELD Mandate</h3>';
  body += '<p>All CMV drivers subject to HOS rules must use a registered Electronic Logging Device (ELD). Paper logs are only permitted during ELD malfunction (maximum 8 days to repair). Drivers must be trained on their specific ELD system and able to produce records during inspection.</p>';

  body += '<h3>Drug &amp; Alcohol Testing (49 CFR Part 382)</h3>';
  body += '<p>You are subject to the following types of drug and alcohol testing:</p>';
  body += '<table><thead><tr><th>Test Type</th><th>When</th><th>Details</th></tr></thead><tbody>';
  body += '<tr><td>Pre-Employment</td><td>Before first duty</td><td>Drug test required. Alcohol test at company discretion.</td></tr>';
  body += '<tr><td>Random</td><td>Unannounced</td><td>Minimum 50% of drivers tested for drugs, 10% for alcohol annually.</td></tr>';
  body += '<tr><td>Post-Accident</td><td>After qualifying accident</td><td>Required when the driver receives a citation AND there is a fatality, bodily injury requiring medical treatment, or a vehicle towed from the scene.</td></tr>';
  body += '<tr><td>Reasonable Suspicion</td><td>When trained supervisor observes signs</td><td>Based on specific, documented observations of appearance, behavior, speech, or body odors.</td></tr>';
  body += '<tr><td>Return-to-Duty</td><td>After a violation</td><td>Required before returning to safety-sensitive duties after a positive test or refusal.</td></tr>';
  body += '<tr><td>Follow-Up</td><td>After return-to-duty</td><td>Minimum 6 directly observed tests in 12 months. May continue for up to 60 months.</td></tr>';
  body += '</tbody></table>';
  body += '<div class="warning-box"><strong>Refusal to test is treated as a positive result.</strong> This includes failing to appear, leaving before completion, or any attempt to tamper with a specimen.</div>';

  body += '<h3>CDL Medical Certificate (49 CFR Part 391)</h3>';
  body += '<p>You must maintain a valid Medical Examiner&rsquo;s Certificate (DOT physical card) to operate a CMV. The examination must be performed by a medical examiner listed on the FMCSA National Registry. Standard certificates are valid for up to 24 months. Certain conditions (diabetes, high blood pressure, sleep apnea under treatment) may require more frequent certification (typically 12 months).</p>';

  body += '<h3>California-Specific Requirements (CALDOT/Caltrans)</h3>';
  body += '<ul>';
  body += '<li><strong>55 MPH Truck Speed Limit:</strong> California enforces a 55 mph speed limit for commercial vehicles on many highways (CVC 22406), even where passenger vehicle limits are higher.</li>';
  body += '<li><strong>Chain Control:</strong> Caltrans enforces chain requirements (R-1, R-2, R-3 levels) on mountain passes. Carry chains and know how to install them.</li>';
  body += '<li><strong>CARB Idling Regulations:</strong> California Air Resources Board limits commercial vehicle idling to 5 minutes in most areas. Use APU or shore power when available.</li>';
  body += '<li><strong>CHP Inspections:</strong> California Highway Patrol operates commercial vehicle inspection facilities (scales). Compliance with federal and California-specific equipment standards is verified.</li>';
  body += '<li><strong>BIT Inspections:</strong> California&rsquo;s Basic Inspection of Terminals (BIT) program requires carriers based in California to maintain vehicles to specific standards under CVC 34501.12.</li>';
  body += '</ul>';
  body += Packets._footer() + '</div>';

  /* ---- Section 3: HOS Complete Reference ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 3: Hours of Service &mdash; Complete Reference</h2>';
  body += '<p><em>49 CFR Part 395</em></p>';

  body += '<h3>Detailed HOS Rules with Examples</h3>';
  body += '<table><thead><tr><th>Rule</th><th>Details</th><th>Example</th></tr></thead><tbody>';
  body += '<tr><td>11-Hour Driving</td><td>Maximum driving time after 10 hours off duty.</td><td>You go off duty at 8:00 PM, sleep, and come on duty at 6:00 AM. You may drive until 5:00 PM (11 hours).</td></tr>';
  body += '<tr><td>14-Hour Window</td><td>All duties must fit within 14 hours of coming on duty. Does not pause.</td><td>You come on duty at 6:00 AM. Your window closes at 8:00 PM. If you spend 3 hours loading (on duty, not driving), you still cannot drive after 8:00 PM.</td></tr>';
  body += '<tr><td>30-Minute Break</td><td>After 8 cumulative hours of driving, take 30 minutes off-duty or sleeper berth.</td><td>You start driving at 7:00 AM. By 3:00 PM, you have 8 cumulative hours of driving. You must take a 30-minute break before driving again.</td></tr>';
  body += '<tr><td>60/70-Hour Rule</td><td>Total on-duty hours in 7 or 8 consecutive days.</td><td>If your carrier operates daily (70/8): by Thursday you have 62 on-duty hours for the week. You have 8 hours of on-duty time remaining before hitting 70.</td></tr>';
  body += '<tr><td>34-Hour Restart</td><td>34 consecutive hours off duty resets your weekly clock to zero.</td><td>You go off duty Friday at 6:00 PM. You may restart your weekly clock at 4:00 AM Sunday (34 hours later).</td></tr>';
  body += '</tbody></table>';

  body += '<h3>ELD Instructions Overview</h3>';
  body += '<ul>';
  body += '<li>Log on at the start of each duty period with your driver credentials.</li>';
  body += '<li>Select the correct duty status: Driving (D), On-Duty Not Driving (ON), Sleeper Berth (SB), Off-Duty (OFF).</li>';
  body += '<li>The ELD automatically records driving time when the vehicle exceeds 5 mph.</li>';
  body += '<li>Add annotations (shipper/receiver names, city changes) as required by your carrier.</li>';
  body += '<li>Certify your logs at the end of each 24-hour period.</li>';
  body += '<li>Transfer logs to an inspector upon request (via Bluetooth, USB, email, or printout).</li>';
  body += '</ul>';

  body += '<h3>Common Violations &amp; Consequences</h3>';
  body += '<table><thead><tr><th>Violation</th><th>CSA Points</th><th>Potential Fine</th></tr></thead><tbody>';
  body += '<tr><td>Driving beyond 11-hour limit</td><td>7</td><td>Up to $16,000 per offense</td></tr>';
  body += '<tr><td>Driving beyond 14-hour window</td><td>7</td><td>Up to $16,000 per offense</td></tr>';
  body += '<tr><td>No 30-minute break</td><td>5</td><td>Up to $16,000 per offense</td></tr>';
  body += '<tr><td>Over 60/70-hour limit</td><td>7</td><td>Up to $16,000 per offense</td></tr>';
  body += '<tr><td>False log entry</td><td>7</td><td>Up to $16,000 + potential criminal charges</td></tr>';
  body += '<tr><td>No ELD when required</td><td>5</td><td>Up to $16,000; driver placed out of service</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Record-Keeping Requirements</h3>';
  body += '<p>Drivers must retain copies of their records of duty status (RODS) for the current day plus the previous 7 consecutive days. Carriers must retain RODS for 6 months. ELD records must be available for roadside inspection via display, printout, or electronic transfer.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 4: Vehicle Inspection Requirements ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 4: Vehicle Inspection Requirements</h2>';
  body += '<p><em>49 CFR 396.11 &mdash; Driver Vehicle Inspection Reports (DVIR)</em></p>';

  body += '<h3>Pre-Trip Inspection Checklist</h3>';
  body += '<p>Complete this inspection before operating the vehicle. Check each item:</p>';

  body += '<h3>Engine Compartment</h3>';
  body += Packets._checkLines([
    'Oil level, coolant level, power steering fluid',
    'Belts and hoses (no cracks, fraying, or leaks)',
    'Air compressor operation',
    'Wiring connections secure',
    'No fluid leaks under vehicle'
  ]);

  body += '<h3>Cab Interior</h3>';
  body += Packets._checkLines([
    'Seat belt functional',
    'All mirrors adjusted and undamaged',
    'Gauges and warning lights operational',
    'Horn, wipers, defroster functional',
    'Windshield clean, no vision-obstructing cracks',
    'Emergency equipment present and accessible',
    'ELD functioning'
  ]);

  body += '<h3>Lights &amp; Signals</h3>';
  body += Packets._checkLines([
    'Headlights (high/low), taillights, brake lights',
    'Turn signals (front, rear, side)',
    'Clearance/marker lights',
    'Hazard flashers, license plate light'
  ]);

  body += '<h3>Tires, Wheels, Brakes</h3>';
  body += Packets._checkLines([
    'Tire pressure, tread depth (4/32" steer, 2/32" drive/trailer)',
    'No cuts, bulges, or exposed cords',
    'Lug nuts present and tight',
    'Air pressure builds to governor cut-out',
    'Low air warning activates below 60 psi',
    'Air leakage rate within limits',
    'Service and parking brakes functional',
    'Brake drums/rotors, hoses, slack adjusters'
  ]);

  body += '<h3>Coupling, Frame, Cargo</h3>';
  body += Packets._checkLines([
    'Fifth wheel greased, locked, tug-tested',
    'Air and electrical lines connected, no leaks',
    'Landing gear raised, handle secured',
    'Frame rails and cross members intact',
    'Mud flaps present',
    'Cargo secure, doors/latches functional'
  ]);

  body += '<h3>Post-Trip DVIR</h3>';
  body += '<p>At the end of each day, re-inspect and document any new defects. Even if no defects are found, complete and sign the report. Report all defects to maintenance.</p>';

  body += '<h3>Out-of-Service Criteria</h3>';
  body += '<p>Certain defects require the vehicle to be placed out of service and may not be operated until repaired. Examples include:</p>';
  body += '<ul>';
  body += '<li>Steering system defects, including excessive play</li>';
  body += '<li>Brake defects affecting 20% or more of braking capacity</li>';
  body += '<li>Tire defects (tread depth below minimums, exposed cords, flat tires on steering axle)</li>';
  body += '<li>Suspension defects (cracked or broken spring leaves, missing components)</li>';
  body += '<li>Frame cracks or loose components</li>';
  body += '</ul>';

  body += '<h3>Company-Specific Reporting Procedures</h3>';
  body += '<div class="info-box"><strong>Note to Safety Director:</strong> Insert your company&rsquo;s specific DVIR reporting procedures, forms, and submission requirements here. Include how drivers should submit DVIRs (paper, app, ELD system), who reviews them, and the timeline for defect repair.</div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 5: Accident & Incident Procedures ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 5: Accident &amp; Incident Procedures</h2>';

  body += '<h3>Step-by-Step Accident Protocol</h3>';
  body += '<div style="counter-reset:item">';
  body += '<div class="numbered-item"><strong>Secure the scene.</strong> Stop immediately. Turn on hazard flashers. Set the parking brake. Turn off the engine if safe to do so.</div>';
  body += '<div class="numbered-item"><strong>Check for injuries.</strong> Assess yourself and any passengers. Check occupants of other vehicles if safe to approach. Do not move injured persons unless they are in immediate danger (fire, traffic exposure).</div>';
  body += '<div class="numbered-item"><strong>Call 911 if there is any injury, fatality, or significant property damage.</strong> Provide your location, number of vehicles involved, and nature of injuries.</div>';
  body += '<div class="numbered-item"><strong>Call your company dispatch immediately.</strong> Report the incident regardless of severity. Your dispatch number: _______________________</div>';
  body += '<div class="numbered-item"><strong>Protect the scene.</strong> Put on your reflective vest. Place warning triangles. Do not move vehicles unless instructed by law enforcement or if they pose an immediate traffic hazard.</div>';
  body += '<div class="numbered-item"><strong>Exchange information</strong> with other involved parties: name, license number, insurance company, policy number, phone number, vehicle make/model/plate number.</div>';
  body += '<div class="numbered-item"><strong>Document everything.</strong> Take photographs of all vehicles from multiple angles, the overall scene, road conditions, traffic signals/signs, skid marks, debris, and weather conditions. More photos is always better.</div>';
  body += '<div class="numbered-item"><strong>Gather witness information.</strong> Get names and phone numbers of any witnesses.</div>';
  body += '<div class="numbered-item"><strong>Do not admit fault.</strong> Be cooperative and factual, but do not make statements about fault, responsibility, or who caused the accident. Direct all questions about fault to your company and insurance carrier.</div>';
  body += '<div class="numbered-item"><strong>Complete a written statement</strong> as soon as practical, while details are fresh. Use the template below.</div>';
  body += '</div>';

  body += '<h3>DOT Reportable Accident Criteria</h3>';
  body += '<p>An accident is DOT reportable if it involves a CMV and results in any of the following:</p>';
  body += '<ul>';
  body += '<li>A fatality (death of any person)</li>';
  body += '<li>Bodily injury requiring immediate medical treatment away from the scene</li>';
  body += '<li>Any vehicle requiring tow-away from the scene due to disabling damage</li>';
  body += '</ul>';

  body += '<h3>Post-Accident Drug &amp; Alcohol Testing (49 CFR 382.303)</h3>';
  body += '<div class="warning-box"><strong>Post-accident testing is required when:</strong><br>';
  body += '&bull; The driver receives a citation <strong>AND</strong> the accident involved a fatality, OR<br>';
  body += '&bull; The driver receives a citation <strong>AND</strong> there was bodily injury requiring medical treatment away from the scene, OR<br>';
  body += '&bull; The driver receives a citation <strong>AND</strong> any vehicle was towed from the scene.<br><br>';
  body += '<strong>Testing windows:</strong> Alcohol test must be administered within 8 hours. Drug test must be administered within 32 hours. You must remain available for testing. Do not consume alcohol for 8 hours after an accident or until tested.</div>';

  body += '<h3>Written Statement Template</h3>';
  body += '<table class="sign-off-table"><thead><tr><th>Field</th><th>Your Entry</th></tr></thead><tbody>';
  body += '<tr><td>Date &amp; Time of Incident</td><td></td></tr>';
  body += '<tr><td>Location (address, mile marker, GPS)</td><td></td></tr>';
  body += '<tr><td>Weather Conditions</td><td></td></tr>';
  body += '<tr><td>Road Conditions</td><td></td></tr>';
  body += '<tr><td>Your Speed at Time of Incident</td><td></td></tr>';
  body += '<tr><td>Direction of Travel</td><td></td></tr>';
  body += '<tr><td>Description of What Happened</td><td></td></tr>';
  body += '<tr><td>Other Vehicles/Persons Involved</td><td></td></tr>';
  body += '<tr><td>Injuries (describe)</td><td></td></tr>';
  body += '<tr><td>Vehicle Damage (describe)</td><td></td></tr>';
  body += '<tr><td>Witnesses (names, phone numbers)</td><td></td></tr>';
  body += '<tr><td>Police Report Number</td><td></td></tr>';
  body += '<tr><td>Responding Officer Name/Badge</td><td></td></tr>';
  body += '</tbody></table>';

  body += '<h3>Workers&rsquo; Compensation</h3>';
  body += '<p>If you are injured on the job (including during an accident), report the injury to your supervisor and HR department immediately. You have the right to file a workers&rsquo; compensation claim. Timely reporting is critical &mdash; delays can jeopardize your claim.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 6: Fatigue Management Program ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 6: Fatigue Management Program</h2>';

  body += '<h3>HOS as Minimum Standard</h3>';
  body += '<p>Hours of Service regulations set the <em>legal minimum</em> rest requirements. They are not a guarantee that you are adequately rested. You may be fully HOS-compliant and still be too fatigued to drive safely. Your professional judgment must supplement the regulations.</p>';

  body += '<h3>Company Fatigue Policy</h3>';
  body += '<div class="info-box"><strong>Note to Safety Director:</strong> Insert your company&rsquo;s specific fatigue management policy here. Include your company&rsquo;s position on: driver&rsquo;s right to rest, procedure for requesting additional rest time, how fatigue-related concerns are reported, and any company-specific fatigue management tools or programs.</div>';

  body += '<h3>Fatigue Warning Signs Checklist</h3>';
  body += '<p>If you experience <strong>any</strong> of the following, you are too fatigued to drive:</p>';
  body += Packets._checkLines([
    'Difficulty keeping eyes open or heavy eyelids',
    'Frequent yawning',
    'Drifting from your lane or hitting rumble strips',
    'Missing exits, signs, or turns',
    'Difficulty remembering the last few miles',
    'Following too closely due to reduced attention',
    'Restlessness, irritability, or difficulty concentrating',
    'Slowed reaction time or delayed braking'
  ]);

  body += '<h3>Driver&rsquo;s Right to Refuse Unsafe Dispatch</h3>';
  body += '<p>Under FMCSA regulations, <strong>no carrier or dispatcher may coerce a driver to operate in violation of safety regulations</strong>, including driving while fatigued. If you believe you are too fatigued to drive safely &mdash; even if you have HOS time remaining &mdash; you have the right and obligation to refuse to drive. Report any coercion to the FMCSA coercion hotline: 1-800-832-5660.</p>';

  body += '<h3>Drowsy Driving Reporting Procedure</h3>';
  body += '<p>If you must stop due to fatigue:</p>';
  body += '<div style="counter-reset:item">';
  body += '<div class="numbered-item">Pull over to a safe location immediately.</div>';
  body += '<div class="numbered-item">Contact dispatch and inform them you are stopping for rest. State clearly: &ldquo;I am stopping because I am too fatigued to drive safely.&rdquo;</div>';
  body += '<div class="numbered-item">Log your status change on your ELD (Sleeper Berth or Off-Duty).</div>';
  body += '<div class="numbered-item">Rest until you feel genuinely alert &mdash; not just until the minimum required time has passed.</div>';
  body += '<div class="numbered-item">Document the stop in your daily log annotations.</div>';
  body += '</div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 7: Driver Wellness Program ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 7: Driver Wellness Program</h2>';

  body += '<h3>Physical Health Guidelines</h3>';
  body += '<ul>';
  body += '<li><strong>Nutrition:</strong> Pack healthy meals and snacks. Minimize fried foods, excess sugar, and large portion sizes. Eat regular meals on a consistent schedule.</li>';
  body += '<li><strong>Hydration:</strong> Drink at least 64 oz of water daily. Avoid excessive caffeine and energy drinks.</li>';
  body += '<li><strong>Exercise:</strong> Walk, stretch, or perform bodyweight exercises at every extended stop. Aim for 30 minutes of physical activity per day.</li>';
  body += '<li><strong>Back care:</strong> Use proper lifting techniques (lift with legs, keep load close to body). Use lumbar support while driving. Stretch regularly.</li>';
  body += '<li><strong>Medical care:</strong> Maintain your DOT physical schedule. Don&rsquo;t postpone medical appointments. Address minor health issues before they become major problems.</li>';
  body += '</ul>';

  body += '<h3>Mental Health Resources</h3>';
  body += '<p>Truck driving is inherently isolating, and mental health challenges are common in the industry. Seeking help is a sign of strength, not weakness.</p>';
  body += '<ul>';
  body += '<li><strong>988 Suicide &amp; Crisis Lifeline:</strong> Call or text 988 (24/7)</li>';
  body += '<li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>';
  body += '<li><strong>SAMHSA National Helpline:</strong> 1-800-662-4357 (24/7, free, confidential)</li>';
  body += '</ul>';

  body += '<h3>Employee Assistance Program (EAP)</h3>';
  body += '<div class="info-box"><strong>Note to Safety Director:</strong> Insert your company&rsquo;s EAP information here, including the provider name, phone number, website, and number of free sessions available. If your company does not have an EAP, consider partnering with a provider &mdash; EAPs typically cost $30&ndash;$60 per employee per year and provide significant ROI in reduced turnover and absenteeism.</div>';

  body += '<h3>Substance Abuse Awareness</h3>';
  body += '<p>The use of alcohol, illegal drugs, or misuse of prescription medications while operating a CMV is a serious federal offense. Even off-duty use can affect your ability to drive safely. If you are struggling with substance use, seek help before it becomes a safety or legal crisis. SAMHSA&rsquo;s helpline (1-800-662-4357) provides free, confidential referrals 24/7. Many treatment programs are compatible with continued CDL employment.</p>';

  body += '<h3>Sleep Apnea Screening</h3>';
  body += '<p>Obstructive sleep apnea (OSA) affects an estimated 28&ndash;35% of CDL holders. Risk factors include BMI over 35, neck circumference over 17 inches, male gender, age over 40, and family history. Your medical examiner may require screening during your DOT physical. If diagnosed, treatment with a CPAP machine is effective and will not disqualify you from driving &mdash; but non-compliance with treatment can result in loss of your medical certificate.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 8: Emergency Equipment ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 8: Emergency Equipment Requirements</h2>';

  body += '<h3>FMCSA-Required Equipment</h3>';
  body += '<p>The following items are required by federal regulation to be carried on every CMV:</p>';
  body += '<table><thead><tr><th>Item</th><th>Regulation</th><th>Requirement</th></tr></thead><tbody>';
  body += '<tr><td>Reflective Warning Triangles</td><td>49 CFR 393.95(f)</td><td>Three DOT-approved triangles. Must be placed within 10 minutes of stopping: at 10 ft, 100 ft, and 200 ft behind the vehicle.</td></tr>';
  body += '<tr><td>Fire Extinguisher</td><td>49 CFR 393.95(a)</td><td>Minimum 5 B:C rating (10 B:C recommended). Properly mounted, fully charged, accessible, and with current inspection tag.</td></tr>';
  body += '<tr><td>Spare Fuses</td><td>49 CFR 393.95(b)</td><td>Assorted amperage fuses matching the vehicle&rsquo;s fuse types (not required if vehicle uses circuit breakers).</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Breakdown Kit</h3>';
  body += Packets._checkLines([
    'Three reflective warning triangles (required)',
    'Fire extinguisher with current inspection tag (required)',
    'Spare fuses (required if applicable)',
    'High-visibility safety vest (ANSI Class 2+)',
    'Heavy-duty flashlight with extra batteries',
    'LED road flares',
    'Jumper cables or portable jump starter',
    'Basic tool kit (wrench, pliers, screwdrivers, sockets)',
    'Tire pressure gauge',
    'Duct tape, electrical tape, zip ties',
    'Work gloves, rain gear',
    'Coolant, motor oil, windshield washer fluid',
    'Glad-hand seals'
  ]);

  body += '<h3>First Aid Kit</h3>';
  body += Packets._checkLines([
    'Adhesive bandages (assorted)',
    'Sterile gauze pads and rolls',
    'Adhesive medical tape',
    'Antiseptic wipes',
    'Antibiotic ointment',
    'Nitrile gloves',
    'Tourniquet',
    'CPR mask/face shield',
    'Emergency mylar blankets',
    'Scissors/trauma shears',
    'Acetaminophen, ibuprofen',
    'Personal medications'
  ]);

  body += '<h3>Communication Equipment</h3>';
  body += Packets._checkLines([
    'Cell phone with heavy-duty case',
    'Car charger and portable battery pack',
    'Hands-free device (many states require hands-free operation)',
    'CB radio (recommended &mdash; Ch 19 truckers, Ch 9 emergencies)'
  ]);
  body += Packets._footer() + '</div>';

  /* ---- Section 9: Defensive Driving Standards ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 9: Defensive Driving Standards</h2>';

  body += '<h3>Following Distance Policy</h3>';
  body += '<p>Maintain a minimum 7-second following distance under normal, dry conditions. Increase to 8&ndash;10 seconds in rain, heavy traffic, or limited visibility. Increase to 10+ seconds in snow, ice, or fog. To measure: identify a fixed point, count seconds from when the vehicle ahead passes it until you reach it.</p>';

  body += '<h3>Distraction-Free Driving Policy</h3>';
  body += '<p>The following are prohibited while the vehicle is in motion:</p>';
  body += Packets._checkLines([
    'Using a handheld mobile phone (texting, calling, browsing)',
    'Programming a GPS or navigation system',
    'Reading or writing (paperwork, maps, text messages)',
    'Eating or drinking in a way that requires two hands or diverts attention',
    'Reaching for objects that require leaving the driving position',
    'Using headphones or earbuds in both ears (most states prohibit this)'
  ]);

  body += '<h3>Cell Phone &amp; Electronic Device Policy</h3>';
  body += '<p>FMCSA regulation 49 CFR 392.82 prohibits CMV drivers from using a handheld mobile phone while driving. Hands-free use is permitted but should be minimized. Violation: up to $2,750 fine per offense and driver disqualification. Texting while driving carries fines up to $2,750 for drivers and $11,000 for carriers who allow or require it.</p>';

  body += '<h3>Speed Management</h3>';
  body += '<ul>';
  body += '<li>Never exceed the posted speed limit. California enforces a 55 mph truck speed limit on many highways (CVC 22406).</li>';
  body += '<li>Reduce speed for curves, hills, construction zones, school zones, and residential areas.</li>';
  body += '<li>In adverse conditions (rain, snow, fog, wind), reduce speed below the posted limit as conditions require.</li>';
  body += '<li>Remember: a fully loaded truck at 55 mph requires approximately 400 feet to stop. Speed increases stopping distance exponentially.</li>';
  body += '</ul>';

  body += '<h3>Adverse Conditions Protocol</h3>';
  body += '<p>FMCSA allows an additional 2 hours of driving time beyond the 11-hour limit if you encounter adverse driving conditions that were not known or could not have been anticipated before the trip began (49 CFR 395.1(b)). This exception does not extend the 14-hour window. However, the safest decision is often to stop and wait for conditions to improve.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 10: Road Hazard Response ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 10: Road Hazard Response</h2>';

  body += '<h3>Weather Protocols</h3>';

  body += '<h3>Ice &amp; Snow</h3>';
  body += '<ul>';
  body += '<li>Bridges and overpasses freeze first. Reduce speed before crossing.</li>';
  body += '<li>Do not use cruise control on wet, icy, or snowy roads.</li>';
  body += '<li>Carry and know how to install tire chains. California enforces R-1/R-2/R-3 chain control levels on mountain passes.</li>';
  body += '<li>If you lose traction, ease off the throttle and steer straight. Do not brake.</li>';
  body += '</ul>';

  body += '<h3>Fog</h3>';
  body += '<ul>';
  body += '<li>Use low beams only. High beams increase glare in fog.</li>';
  body += '<li>Turn off cruise control.</li>';
  body += '<li>Increase following distance to 10+ seconds.</li>';
  body += '<li>Use fog lines as your guide.</li>';
  body += '<li>If visibility drops dangerously, pull off the roadway completely and wait.</li>';
  body += '</ul>';

  body += '<h3>Crosswinds</h3>';
  body += '<ul>';
  body += '<li>Monitor wind advisories. Empty trailers are especially vulnerable above 40 mph.</li>';
  body += '<li>Grip the steering wheel firmly with both hands.</li>';
  body += '<li>Anticipate gusts when emerging from wind shadows.</li>';
  body += '<li>If conditions are unmanageable, park and wait.</li>';
  body += '</ul>';

  body += '<h3>Heavy Rain</h3>';
  body += '<ul>';
  body += '<li>Reduce speed by at least one-third in rain.</li>';
  body += '<li>Increase following distance.</li>';
  body += '<li>Be alert for hydroplaning &mdash; if the steering feels light, ease off the throttle.</li>';
  body += '<li>Turn on headlights (required in most states when wipers are in use).</li>';
  body += '</ul>';

  body += '<h3>Construction Zones</h3>';
  body += '<ul>';
  body += '<li>Slow down well before the zone begins.</li>';
  body += '<li>Obey all posted speed limits and flaggers.</li>';
  body += '<li>Do not change lanes within the zone.</li>';
  body += '<li>Watch for workers, equipment, and lane shifts.</li>';
  body += '<li>Fines are doubled in construction zones.</li>';
  body += '</ul>';

  body += '<h3>Mountain Driving</h3>';
  body += '<ul>';
  body += '<li>Use proper gear descending. Do not ride the brakes &mdash; use engine braking (lower gears) to control speed.</li>';
  body += '<li>Check brakes before a descent. If hot or fading, stop and cool them.</li>';
  body += '<li>Know the location of runaway truck ramps on your route.</li>';
  body += '<li>Watch for falling rock zones and reduced speed limits.</li>';
  body += '</ul>';

  body += '<h3>Night Driving</h3>';
  body += '<ul>';
  body += '<li>Reduce speed so stopping distance stays within sight distance.</li>';
  body += '<li>Keep windshield and headlights clean.</li>';
  body += '<li>Watch for pedestrians, cyclists, and animals at the edges of your headlight beam.</li>';
  body += '</ul>';

  body += '<h3>Tire Blowout Response</h3>';
  body += '<div class="warning-box"><strong>Do NOT brake.</strong> Accelerate slightly to stabilize, grip the wheel, counteract the pull, then gradually slow by easing off the throttle. Signal and move to the shoulder when you have control.</div>';
  body += Packets._footer() + '</div>';

  /* ---- Section 11: Driver Resources ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 11: Driver Resources</h2>';

  body += '<h3>Federal &amp; State Agencies</h3>';
  body += '<table><thead><tr><th>Agency</th><th>Contact</th></tr></thead><tbody>';
  body += '<tr><td>FMCSA</td><td>fmcsa.dot.gov &mdash; 1-800-832-5660</td></tr>';
  body += '<tr><td>Caltrans</td><td>dot.ca.gov &mdash; 1-916-654-5266</td></tr>';
  body += '<tr><td>CHP Commercial Vehicle Section</td><td>chp.ca.gov &mdash; 1-800-835-5247</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Crisis &amp; Mental Health</h3>';
  body += '<table><thead><tr><th>Resource</th><th>Contact</th></tr></thead><tbody>';
  body += '<tr><td>988 Suicide &amp; Crisis Lifeline</td><td>Call or text 988</td></tr>';
  body += '<tr><td>Crisis Text Line</td><td>Text HOME to 741741</td></tr>';
  body += '<tr><td>SAMHSA</td><td>1-800-662-4357</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Industry Organizations</h3>';
  body += '<table><thead><tr><th>Organization</th><th>Contact</th></tr></thead><tbody>';
  body += '<tr><td>OOIDA</td><td>ooida.com &mdash; 1-800-444-5791</td></tr>';
  body += '<tr><td>St. Christopher Truckers Relief Fund</td><td>truckersfund.org &mdash; 1-865-202-9428</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Company-Specific Resources</h3>';
  body += '<div class="info-box"><strong>Note to Safety Director:</strong> Add your company&rsquo;s specific resources: EAP provider, benefits hotline, maintenance department, training department contacts, etc.</div>';
  body += Packets._footer() + '</div>';

  /* ---- SIGN-OFF SHEET ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h1 style="text-align:center;">Driver Acknowledgment &amp; Sign-Off Sheet</h1>';
  body += '<h3 style="text-align:center;">New Hire Safety Orientation Packet</h3>';
  body += '<p>I, the undersigned, acknowledge that I have received, read, and understand the contents of this New Hire Driver Safety &amp; Wellness Orientation Packet. I understand that the information contained herein is intended to supplement, not replace, applicable federal (FMCSA), state, and company-specific safety policies. I agree to comply with all safety procedures and policies outlined in this packet and in my company&rsquo;s safety manual.</p>';

  body += '<table class="sign-off-table"><tbody>';
  body += '<tr><td style="width:40%;font-weight:bold;">Driver Name (Print)</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Driver Signature</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">CDL Number</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Date of Hire</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Date Packet Received</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Safety Director Name (Print)</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Safety Director Signature</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Date</td><td></td></tr>';
  body += '</tbody></table>';

  body += '<p style="font-size:9pt;color:#555;margin-top:16px;">This signed acknowledgment should be retained in the driver&rsquo;s personnel/qualification file per 49 CFR Part 391.51.</p>';

  body += '<h2 style="margin-top:36px;">Individual Section Acknowledgments</h2>';
  body += '<table><thead><tr><th style="width:8%;">#</th><th>Section Title</th><th style="width:12%;">Reviewed</th><th style="width:14%;">Driver Initials</th><th style="width:14%;">Date</th></tr></thead><tbody>';
  var sectionTitles = [
    'Company Safety Expectations',
    'Federal & State Compliance Overview',
    'Hours of Service — Complete Reference',
    'Vehicle Inspection Requirements',
    'Accident & Incident Procedures',
    'Fatigue Management Program',
    'Driver Wellness Program',
    'Emergency Equipment Requirements',
    'Defensive Driving Standards',
    'Road Hazard Response',
    'Driver Resources'
  ];
  for (var s = 0; s < sectionTitles.length; s++) {
    body += '<tr><td>' + (s + 1) + '</td><td>' + sectionTitles[s] + '</td><td><div class="check-box" style="margin:auto;"></div></td><td></td><td></td></tr>';
  }
  body += '</tbody></table>';
  body += Packets._footer() + '</div>';

  return Packets._wrap('Mile 12 Warrior — Fleet New Hire Driver Orientation Packet', body);
};

/* ============================================================
   4. FLEET REFRESHER PACKET
   ============================================================ */
Packets.fleetRefresher = function () {
  var body = '';

  /* ---- Cover Page ---- */
  body += '<div class="cover-page">' +
    '<h1>Fleet Safety Department</h1>' +
    '<p class="subtitle" style="font-size:18pt;color:#222;margin-bottom:8px;">Experienced Driver Refresher Packet</p>' +
    '<p class="subtitle">Annual/semi-annual safety refresher for experienced CDL drivers.<br>Designed for safety department distribution.</p>' +
    '<p style="margin-top:24px;font-size:11pt;">Prepared by <strong>Mile 12 Warrior LLC</strong> &mdash; Driver Safety &amp; Wellness Consultants</p>' +
    '<p style="margin-top:32px;font-size:10pt;">Company Name: ________________________________________</p>' +
    '<p style="font-size:10pt;">Date: ____________________</p>' +
    '</div>';

  /* ---- Cover Letter ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Cover Letter</h2>';
  body += '<p><strong>Dear Safety Director,</strong></p>';
  body += '<p>This refresher packet is designed for drivers with 1+ years of service. Annual or semi-annual safety refreshers are a best practice recommended by FMCSA and can positively impact your company&rsquo;s CSA scores, insurance premiums, and overall safety culture.</p>';
  body += '<p>Documented refresher training demonstrates due diligence to regulators and insurers. In the event of litigation following an accident, the ability to show that a driver received ongoing safety training beyond the initial orientation can significantly strengthen your company&rsquo;s legal position.</p>';
  body += '<p>This packet includes updated regulatory information, advanced hazard recognition, self-assessment tools, and a structured sign-off process for your driver qualification files.</p>';
  body += '<p style="margin-top:24px;">Respectfully,<br><strong>Mile 12 Warrior LLC</strong><br>Driver Safety &amp; Wellness Consultants<br>mile12warrior.com</p>';
  body += Packets._footer() + '</div>';

  /* ---- Table of Contents ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Table of Contents</h2><ul class="toc">';
  var tocItems = [
    'Why Refreshers Matter',
    'HOS Updates & Common Pitfalls',
    'Advanced Fatigue Management',
    'Health & Wellness Check-In',
    'Defensive Driving Refresher',
    'Hazard Recognition Update',
    'Emergency Preparedness Audit',
    'Regulatory Compliance Self-Audit',
    'Mentorship Opportunity',
    'Goals & Action Plan'
  ];
  for (var i = 0; i < tocItems.length; i++) {
    body += '<li>Section ' + (i + 1) + ': ' + tocItems[i] + '</li>';
  }
  body += '<li><strong>Driver Acknowledgment &amp; Sign-Off Sheet</strong></li>';
  body += '</ul>' + Packets._footer() + '</div>';

  /* ---- Section 1: Why Refreshers Matter ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 1: Why Refreshers Matter</h2>';

  body += '<h3>The Complacency Problem</h3>';
  body += '<p>Experience is a double-edged sword. It gives you the skills to handle almost any road situation, but it also creates a false sense of invulnerability. FMCSA data shows that drivers in the 5&ndash;15 year experience range have higher rates of serious violations and preventable accidents than drivers in their first 3 years. Not because they lack skill &mdash; because they stop actively practicing safety fundamentals.</p>';

  body += '<h3>How Refreshers Reduce Incidents</h3>';
  body += '<p>Research from the American Transportation Research Institute (ATRI) demonstrates that carriers with structured, ongoing safety training programs experience:</p>';
  body += '<ul>';
  body += '<li>20&ndash;30% reduction in preventable crashes</li>';
  body += '<li>15&ndash;25% reduction in HOS violations</li>';
  body += '<li>Improved CSA scores across all BASICs categories</li>';
  body += '<li>Lower driver turnover (drivers value companies that invest in their development)</li>';
  body += '</ul>';

  body += '<h3>Insurance Premium Impact</h3>';
  body += '<p>Insurance underwriters increasingly evaluate safety training programs when setting commercial auto premiums. Documented refresher training &mdash; especially with signed acknowledgments &mdash; can qualify your company for premium reductions and demonstrates an active safety culture during audits and renewal negotiations.</p>';

  body += '<h3>CSA Score Improvement</h3>';
  body += '<p>Your company&rsquo;s CSA scores directly impact your ability to operate, your insurance costs, and your competitiveness. Refresher training that specifically targets your company&rsquo;s highest-scoring BASICs categories (Unsafe Driving, HOS Compliance, Vehicle Maintenance, Driver Fitness, Controlled Substances) creates measurable improvement over 12&ndash;24 months.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 2: HOS Updates & Common Pitfalls ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 2: HOS Updates &amp; Common Pitfalls</h2>';

  body += '<h3>Recent Rule Changes &amp; Clarifications</h3>';
  body += '<p>FMCSA periodically updates HOS rules. Key changes to be aware of:</p>';
  body += '<ul>';
  body += '<li><strong>Sleeper Berth Flexibility:</strong> The 7/3 split allows one period of at least 7 hours in the sleeper berth and one period of at least 3 hours (either off-duty or sleeper berth), without either period counting against the 14-hour window.</li>';
  body += '<li><strong>Short-Haul Exception:</strong> Expanded to 150 air-miles from the normal work reporting location (up from 100 air-miles). Drivers using the short-haul exception are not required to use an ELD but must keep time records.</li>';
  body += '<li><strong>Adverse Driving Conditions:</strong> Clarified to allow 2 additional hours of driving time (to 13 hours) when conditions not known before dispatch are encountered. This does not extend the 14-hour window.</li>';
  body += '<li><strong>30-Minute Break:</strong> May now be satisfied by on-duty not driving time (not just off-duty or sleeper berth).</li>';
  body += '</ul>';

  body += '<h3>Top Violations by Experienced Drivers</h3>';
  body += '<p>Experienced drivers tend to accumulate violations differently than new drivers:</p>';
  body += '<div class="warning-box">';
  body += '&bull; <strong>Driving beyond the 14-hour window</strong> &mdash; by &ldquo;just finishing the run.&rdquo;<br>';
  body += '&bull; <strong>Incorrect duty status entries</strong> &mdash; logging on-duty time as off-duty or sleeper berth.<br>';
  body += '&bull; <strong>Personal conveyance misuse</strong> &mdash; using PC to advance a load rather than genuine personal travel.<br>';
  body += '&bull; <strong>Skipping the 30-minute break</strong> &mdash; believing it&rsquo;s &ldquo;not a big deal.&rdquo;<br>';
  body += '&bull; <strong>Operating past 60/70-hour limits</strong> &mdash; losing track of cumulative weekly hours.</div>';

  body += '<h3>Personal Conveyance Clarification</h3>';
  body += '<p>Personal conveyance is the movement of a CMV for personal use, <em>not</em> for the benefit of the motor carrier. It must be recorded as off-duty with a &ldquo;personal conveyance&rdquo; annotation. You must be relieved of all work-related duties. Moving to a closer shipper, receiver, or truck stop for the carrier&rsquo;s benefit does not qualify as personal conveyance.</p>';

  body += '<h3>Adverse Driving Exception Details</h3>';
  body += '<p>Under 49 CFR 395.1(b), if you encounter adverse conditions (rain, snow, fog, unexpected road closure) that were not known before dispatch, you may drive up to 2 additional hours. Important: you must have been able to complete the trip within normal HOS limits under the conditions anticipated at dispatch. This exception does not extend the 14-hour window; it only adds to the 11-hour driving limit.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 3: Advanced Fatigue Management ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 3: Advanced Fatigue Management</h2>';

  body += '<h3>Sleep Debt Science</h3>';
  body += '<p>Chronic partial sleep deprivation is the most common form of fatigue impairment in trucking. If you consistently sleep 6 hours when your body needs 7&ndash;8, the deficit accumulates. After one week, your impairment equals 24 hours without sleep. After two weeks, it equals being legally drunk. The critical danger: you stop feeling tired while remaining dangerously impaired.</p>';

  body += '<h3>Microsleep Recognition</h3>';
  body += '<p>Microsleeps are involuntary sleep episodes lasting 1&ndash;30 seconds. During a microsleep, your brain essentially shuts down. You may not even realize one has occurred. Warning signs that microsleeps may be imminent:</p>';
  body += '<ul>';
  body += '<li>Difficulty keeping your head up</li>';
  body += '<li>Blinking more frequently or slowly</li>';
  body += '<li>Drifting within your lane</li>';
  body += '<li>Suddenly &ldquo;snapping to&rdquo; with no memory of the last seconds</li>';
  body += '</ul>';
  body += '<p>If you experience any of these, <strong>stop driving immediately</strong>. No exceptions.</p>';

  body += '<h3>Schedule Change Adaptation</h3>';
  body += '<p>Transitioning between day and night schedules requires deliberate circadian adjustment. Shift your sleep time by 1&ndash;2 hours per day before the change. Use light exposure strategically (bright light during your new wake time, darkness during your new sleep time). Plan your most challenging driving for the first 6 hours after waking, when alertness peaks.</p>';

  body += '<h3>Sleep Apnea Re-Evaluation</h3>';
  body += '<p>If you were diagnosed with sleep apnea, your medical examiner will verify CPAP compliance at each DOT physical. Modern CPAP machines record usage data. Non-compliance (using the machine fewer than 4 hours per night on fewer than 70% of nights) can result in a restricted or denied medical certificate. If you were not previously screened but your BMI has increased, your examiner may require screening.</p>';

  body += '<h3>Fatigue Risk Assessment Questionnaire</h3>';
  body += '<p>Answer honestly. If you answer &ldquo;Yes&rdquo; to 3 or more questions, you should discuss your fatigue risk with a healthcare provider.</p>';
  body += '<table><thead><tr><th style="width:8%;">#</th><th>Question</th><th style="width:12%;">Yes / No</th></tr></thead><tbody>';
  var fatigueQs = [
    'Do you regularly sleep fewer than 7 hours per night?',
    'Do you often feel tired or drowsy during driving, even early in your shift?',
    'Have you caught yourself drifting in your lane or hitting rumble strips in the past 30 days?',
    'Do you snore loudly or has anyone told you that you stop breathing during sleep?',
    'Do you wake up with headaches more than twice per week?',
    'Do you use caffeine to stay alert during most driving shifts?',
    'Have you fallen asleep at the wheel (even briefly) in the past 12 months?',
    'Do you have difficulty falling asleep or staying asleep in your sleeper berth?',
    'Has your weight increased by more than 10 pounds in the past year?',
    'Do you work irregular or rotating schedules (switching between day and night driving)?'
  ];
  for (var q = 0; q < fatigueQs.length; q++) {
    body += '<tr><td>' + (q + 1) + '</td><td>' + fatigueQs[q] + '</td><td></td></tr>';
  }
  body += '</tbody></table>';
  body += Packets._footer() + '</div>';

  /* ---- Section 4: Health & Wellness Check-In ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 4: Health &amp; Wellness Check-In</h2>';

  body += '<h3>BMI &amp; Cardiovascular Awareness</h3>';
  body += '<p>Truck drivers have approximately twice the cardiovascular disease risk of the general population. Know your numbers:</p>';
  body += '<table><thead><tr><th>Metric</th><th>Healthy Range</th><th>Your Number</th><th>Date Checked</th></tr></thead><tbody>';
  body += '<tr><td>Blood Pressure</td><td>Below 140/90 (DOT standard)</td><td></td><td></td></tr>';
  body += '<tr><td>Resting Heart Rate</td><td>60&ndash;100 bpm</td><td></td><td></td></tr>';
  body += '<tr><td>BMI</td><td>18.5&ndash;24.9 (25&ndash;29.9 overweight, 30+ obese)</td><td></td><td></td></tr>';
  body += '<tr><td>Fasting Blood Glucose</td><td>Below 100 mg/dL</td><td></td><td></td></tr>';
  body += '<tr><td>Total Cholesterol</td><td>Below 200 mg/dL</td><td></td><td></td></tr>';
  body += '</tbody></table>';

  body += '<h3>Hearing Conservation</h3>';
  body += '<p>Years of engine noise, wind noise, and road vibration cause gradual hearing loss. Use earplugs or noise-canceling earbuds during sleeper berth rest. Get a baseline hearing test and compare at your annual physical. Report any ringing, muffling, or difficulty hearing conversations &mdash; these are early warning signs.</p>';

  body += '<h3>Vision Re-Check</h3>';
  body += '<p>Your DOT physical includes a basic vision test, but it does not replace a comprehensive eye exam. Get an annual eye exam with an optometrist, especially if you are over 40 (age-related changes accelerate). Night vision deteriorates with age and may require prescription driving glasses even if your daytime vision passes DOT standards.</p>';

  body += '<h3>Mental Health Self-Assessment (PHQ-2 Reference)</h3>';
  body += '<p>The PHQ-2 is a validated screening tool for depression. Over the last two weeks, how often have you been bothered by:</p>';
  body += '<table><thead><tr><th>Question</th><th>Not at all (0)</th><th>Several days (1)</th><th>More than half the days (2)</th><th>Nearly every day (3)</th></tr></thead><tbody>';
  body += '<tr><td>Little interest or pleasure in doing things</td><td></td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Feeling down, depressed, or hopeless</td><td></td><td></td><td></td><td></td></tr>';
  body += '</tbody></table>';
  body += '<p>A score of 3 or higher suggests further evaluation by a healthcare provider. This is a screening tool, not a diagnosis.</p>';

  body += '<h3>Substance Use Reminder</h3>';
  body += '<p>You remain subject to random drug and alcohol testing throughout your career. Any positive test, refusal, or violation is recorded in the FMCSA Drug &amp; Alcohol Clearinghouse and visible to all prospective employers. If you are struggling with substance use, SAMHSA&rsquo;s helpline (1-800-662-4357) provides free, confidential referrals.</p>';

  body += '<h3>DOT Physical Preparation</h3>';
  body += '<p>Before your next DOT physical:</p>';
  body += Packets._checkLines([
    'Know when your medical certificate expires',
    'Bring a list of all current medications',
    'Bring records of any specialist treatment (sleep apnea, diabetes, cardiac)',
    'Fast for 12 hours if blood work will be drawn',
    'Bring your current glasses or contacts',
    'Know your medical history (surgeries, hospitalizations, chronic conditions)',
    'Be honest with the examiner &mdash; hiding conditions creates liability for you'
  ]);
  body += Packets._footer() + '</div>';

  /* ---- Section 5: Defensive Driving Refresher ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 5: Defensive Driving Refresher</h2>';

  body += '<h3>Space Management Review</h3>';
  body += '<p>Be honest with yourself: have your following distances shortened over the years? The 7-second rule exists because physics doesn&rsquo;t care about your experience level. An 80,000-pound truck at 55 mph requires approximately 400 feet to stop. At 65 mph, it requires approximately 525 feet. Tailgating saves you seconds; an accident costs hours, careers, and lives.</p>';

  body += '<h3>Distraction Audit</h3>';
  body += '<p>Rate yourself honestly (1 = never, 5 = frequently):</p>';
  body += '<table><thead><tr><th>Behavior</th><th>Rating (1&ndash;5)</th></tr></thead><tbody>';
  body += '<tr><td>Using phone while driving (even hands-free)</td><td></td></tr>';
  body += '<tr><td>Eating while driving</td><td></td></tr>';
  body += '<tr><td>Programming GPS while moving</td><td></td></tr>';
  body += '<tr><td>Reading paperwork or looking at maps while driving</td><td></td></tr>';
  body += '<tr><td>Reaching for items while driving</td><td></td></tr>';
  body += '<tr><td>Driving while drowsy (&ldquo;just a few more miles&rdquo;)</td><td></td></tr>';
  body += '<tr><td>Taking mental shortcuts on pre-trip inspections</td><td></td></tr>';
  body += '</tbody></table>';
  body += '<p>Any rating of 3 or higher indicates an area for improvement. Be brutally honest &mdash; this audit is for your benefit.</p>';

  body += '<h3>Following Distance Standards</h3>';
  body += '<p>Minimum 7 seconds in dry conditions. 8&ndash;10 seconds in rain or heavy traffic. 10+ seconds in snow, ice, or fog. Measure actively &mdash; don&rsquo;t estimate.</p>';

  body += '<h3>Intersection Protocol</h3>';
  body += '<p>Scan left-right-left at every intersection, even with a green light. Cover your brake when approaching. Watch for vehicles that may be preparing to turn left across your path. Intersections account for a disproportionate number of serious truck crashes.</p>';

  body += '<h3>Speed Management in Adverse Conditions</h3>';
  body += '<p>California enforces a 55 mph truck speed limit on many highways (CVC 22406). In adverse conditions, appropriate speed may be well below the posted limit. Rain: reduce by one-third. Snow: reduce by half or more. Ice: do not drive unless absolutely necessary. If you can&rsquo;t see far enough ahead to stop within your sight distance, you are going too fast.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 6: Hazard Recognition Update ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 6: Hazard Recognition Update</h2>';

  body += '<h3>Seasonal Hazard Calendar</h3>';
  body += '<table><thead><tr><th>Month</th><th>Primary Hazards</th></tr></thead><tbody>';
  body += '<tr><td>January</td><td>Black ice, winter storms, reduced daylight, post-holiday traffic</td></tr>';
  body += '<tr><td>February</td><td>Ice storms, freeze-thaw cycles, potholes from winter damage</td></tr>';
  body += '<tr><td>March</td><td>Spring storms, flooding, fog, construction season begins</td></tr>';
  body += '<tr><td>April</td><td>Heavy rain, flooding, tornado season (Central US), spring break traffic</td></tr>';
  body += '<tr><td>May</td><td>Memorial Day traffic surge, construction zones expanding, severe thunderstorms</td></tr>';
  body += '<tr><td>June</td><td>Summer heat (tire blowouts, engine overheating), increased recreational traffic, wildfires (West)</td></tr>';
  body += '<tr><td>July</td><td>Peak heat, July 4th traffic, dehydration/heat exhaustion risk, monsoons (Southwest)</td></tr>';
  body += '<tr><td>August</td><td>Back-to-school traffic, continued heat, hurricane season (Gulf/East Coast)</td></tr>';
  body += '<tr><td>September</td><td>Harvest season (agricultural equipment on roads), school zones active, hurricane season peak</td></tr>';
  body += '<tr><td>October</td><td>Deer mating season begins, earlier darkness, first frost/freeze events</td></tr>';
  body += '<tr><td>November</td><td>Thanksgiving traffic (heaviest travel week), deer collisions peak, first winter storms</td></tr>';
  body += '<tr><td>December</td><td>Winter storms, holiday traffic, reduced daylight, ice, fatigue from holiday schedules</td></tr>';
  body += '</tbody></table>';

  body += '<h3>Technology Distractions: ADAS Overreliance</h3>';
  body += '<p>Advanced Driver Assistance Systems (adaptive cruise control, lane departure warning, collision mitigation) are tools, not replacements for driver attention. Over-reliance on ADAS creates a false sense of security. These systems have limitations: they may not detect stopped vehicles, they can be confused by construction zones, and they do not function well in heavy rain, snow, or fog. You remain responsible for safe operation at all times.</p>';

  body += '<h3>Complacency Traps</h3>';
  body += '<p>The most dangerous hazards for experienced drivers are the ones you&rsquo;ve seen a thousand times:</p>';
  body += '<ul>';
  body += '<li><strong>The familiar route:</strong> You&rsquo;ve driven it 500 times, so you stop actively scanning for hazards. But the construction zone that wasn&rsquo;t there last week, the new traffic pattern, the school zone hours &mdash; these change.</li>';
  body += '<li><strong>The &ldquo;quick&rdquo; pre-trip:</strong> You know your truck, so you walk around it in 3 minutes instead of 10. The brake hose that started rubbing yesterday is now chafed through.</li>';
  body += '<li><strong>The &ldquo;one more hour&rdquo; push:</strong> You&rsquo;ve driven tired before and nothing happened. Until it does.</li>';
  body += '<li><strong>The backing maneuver you&rsquo;ve done 1,000 times:</strong> Most backing accidents happen to experienced drivers in familiar locations.</li>';
  body += '</ul>';
  body += Packets._footer() + '</div>';

  /* ---- Section 7: Emergency Preparedness Audit ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 7: Emergency Preparedness Audit</h2>';
  body += '<p>Use this section to perform a date-based audit of your emergency equipment. Record the last inspection date for each item.</p>';

  body += '<h3>Equipment Inventory</h3>';
  body += '<table><thead><tr><th>Item</th><th>Present?</th><th>Condition</th><th>Last Inspected</th></tr></thead><tbody>';
  var equipItems = [
    'Reflective triangles (3) — 49 CFR 393.95',
    'Fire extinguisher — charged, tag current — 49 CFR 393.95',
    'Spare fuses (assorted)',
    'High-visibility vest',
    'Flashlight + batteries',
    'LED road flares',
    'Jumper cables / jump pack',
    'Tool kit (wrench, pliers, screwdrivers)',
    'Tire pressure gauge',
    'Tire chains (if applicable)',
    'Coolant (1 gal)',
    'Motor oil (1 qt)',
    'Windshield washer fluid',
    'Glad-hand seals',
    'Rain gear'
  ];
  for (var e = 0; e < equipItems.length; e++) {
    body += '<tr><td>' + equipItems[e] + '</td><td></td><td></td><td></td></tr>';
  }
  body += '</tbody></table>';

  body += '<h3>First Aid Kit Expiration Check</h3>';
  body += '<table><thead><tr><th>Item</th><th>Expiration Date</th><th>Replace?</th></tr></thead><tbody>';
  body += '<tr><td>Acetaminophen / Ibuprofen</td><td></td><td></td></tr>';
  body += '<tr><td>Antibiotic ointment</td><td></td><td></td></tr>';
  body += '<tr><td>Antiseptic wipes</td><td></td><td></td></tr>';
  body += '<tr><td>Hydrogen peroxide</td><td></td><td></td></tr>';
  body += '<tr><td>Diphenhydramine (Benadryl)</td><td></td><td></td></tr>';
  body += '<tr><td>Saline eye wash</td><td></td><td></td></tr>';
  body += '<tr><td>Cold packs</td><td></td><td></td></tr>';
  body += '<tr><td>Sunscreen</td><td></td><td></td></tr>';
  body += '</tbody></table>';

  body += '<h3>Fire Extinguisher Inspection</h3>';
  body += '<table class="sign-off-table"><tbody>';
  body += '<tr><td style="width:40%;font-weight:bold;">Gauge in green (charged) zone?</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Pin and seal intact?</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">No dents, corrosion, or damage?</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Hose and nozzle clear?</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Inspection tag date (last professional inspection)?</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Properly mounted and accessible?</td><td></td></tr>';
  body += '</tbody></table>';

  body += '<h3>Emergency Contacts Update</h3>';
  body += '<table><thead><tr><th>Contact</th><th>Current Name</th><th>Current Number</th><th>Verified?</th></tr></thead><tbody>';
  body += '<tr><td>Dispatch (24-hour)</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Safety Director</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Roadside Assistance</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Insurance Company</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Emergency Contact #1</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Emergency Contact #2</td><td></td><td></td><td></td></tr>';
  body += '</tbody></table>';
  body += Packets._footer() + '</div>';

  /* ---- Section 8: Regulatory Compliance Self-Audit ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 8: Regulatory Compliance Self-Audit</h2>';

  body += '<h3>CSA Score Check</h3>';
  body += '<p>Your carrier&rsquo;s CSA scores are public and visible to shippers, insurers, and competitors. Your individual record contributes to those scores.</p>';
  body += '<div class="numbered-item" style="counter-reset:item">Go to <strong>ai.fmcsa.dot.gov/SMS</strong> and review your carrier&rsquo;s scores in all BASICs categories.</div>';
  body += '<div class="numbered-item">Order your personal PSP report at <strong>psp.fmcsa.dot.gov</strong> ($10 per report). Review your 5-year crash and 3-year inspection history.</div>';
  body += '<div class="numbered-item">If you find errors, file a DataQs challenge at <strong>dataqs.fmcsa.dot.gov</strong>.</div>';

  body += '<h3>PSP Report Review</h3>';
  body += '<table class="sign-off-table"><tbody>';
  body += '<tr><td style="width:50%;font-weight:bold;">Date PSP report last reviewed</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Number of inspections in last 3 years</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Number of violations in last 3 years</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Number of crashes in last 5 years</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Any errors identified? (if yes, file DataQs)</td><td></td></tr>';
  body += '</tbody></table>';

  body += '<h3>Drug &amp; Alcohol Clearinghouse Status</h3>';
  body += '<p>Go to <strong>clearinghouse.fmcsa.dot.gov</strong> and verify your record is clean. Any positive test, refusal, or violation is visible to all prospective employers. If you have a violation on file, verify that all return-to-duty requirements have been completed and recorded.</p>';

  body += '<h3>CDL Medical Certificate Tracking</h3>';
  body += '<table class="sign-off-table"><tbody>';
  body += '<tr><td style="width:50%;font-weight:bold;">Medical certificate expiration date</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Date of next DOT physical (scheduled?)</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Medical conditions requiring monitoring?</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">CPAP compliance current? (if applicable)</td><td></td></tr>';
  body += '</tbody></table>';

  body += '<h3>Endorsement Verification</h3>';
  body += '<table class="sign-off-table"><tbody>';
  body += '<tr><td style="width:50%;font-weight:bold;">CDL class and endorsements</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">CDL expiration date</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Hazmat endorsement renewal date (if applicable)</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">TWIC card expiration (if applicable)</td><td></td></tr>';
  body += '</tbody></table>';
  body += Packets._footer() + '</div>';

  /* ---- Section 9: Mentorship Opportunity ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 9: Mentorship Opportunity</h2>';

  body += '<h3>An Invitation</h3>';
  body += '<p>Your experience is invaluable &mdash; not just to you, but to the next generation of drivers. The trucking industry faces a persistent driver shortage, and new driver retention rates are alarmingly low. One of the most effective tools for retaining new drivers and improving safety outcomes is a structured mentorship program.</p>';

  body += '<h3>Benefits of Mentorship</h3>';
  body += '<div class="two-col">';
  body += '<div><h3>For You (the Mentor)</h3>';
  body += '<ul>';
  body += '<li>Teaching reinforces your own knowledge and refreshes fundamentals</li>';
  body += '<li>Builds leadership skills that may open career advancement opportunities</li>';
  body += '<li>Creates a sense of purpose and professional satisfaction</li>';
  body += '<li>Many carriers offer mentor pay or bonuses</li>';
  body += '<li>Strengthens your reputation within the company</li>';
  body += '</ul></div>';
  body += '<div><h3>For the Company</h3>';
  body += '<ul>';
  body += '<li>Reduces new driver turnover by up to 50%</li>';
  body += '<li>Decreases new driver accident rates by 25&ndash;35%</li>';
  body += '<li>Improves overall safety culture</li>';
  body += '<li>Transfers institutional knowledge</li>';
  body += '<li>Demonstrates commitment to driver development</li>';
  body += '</ul></div>';
  body += '</div>';

  body += '<h3>Mentoring Best Practices</h3>';
  body += Packets._checkLines([
    'Lead by example in every aspect: inspections, HOS compliance, driving habits, health',
    'Share your mistakes honestly — what you learned is more valuable than pretending perfection',
    'Be patient. Remember what your first year was like.',
    'Focus on the "why" behind every procedure, not just the "what"',
    'Help your mentee develop a sustainable daily routine',
    'Teach situational awareness and decision-making, not just procedures',
    'Be available for questions — even after the formal mentoring period',
    'Provide honest, constructive feedback. Praise in public, correct in private.',
    'Introduce your mentee to the trucker community — help them build connections'
  ]);

  body += '<p style="margin-top:16px;">If you are interested in mentoring, contact your Safety Director or Fleet Manager.</p>';
  body += Packets._footer() + '</div>';

  /* ---- Section 10: Goals & Action Plan ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h2>Section 10: Goals &amp; Action Plan</h2>';

  body += '<h3>Quarterly Safety Goals</h3>';
  body += '<table><thead><tr><th>Quarter</th><th>Safety Goal</th><th>Specific Action Steps</th><th>Status</th></tr></thead><tbody>';
  body += '<tr><td>Q1</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Q2</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Q3</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Q4</td><td></td><td></td><td></td></tr>';
  body += '</tbody></table>';

  body += '<h3>Annual Professional Development Plan</h3>';
  body += '<table><thead><tr><th>Area</th><th>Goal</th><th>Resources Needed</th><th>Target Date</th><th>Complete</th></tr></thead><tbody>';
  body += '<tr><td>Endorsements / Training</td><td></td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Safety Record</td><td></td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Health / Fitness</td><td></td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Financial</td><td></td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Family / Relationships</td><td></td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Career Advancement</td><td></td><td></td><td></td><td></td></tr>';
  body += '</tbody></table>';

  body += '<h3>Health Milestone Tracker</h3>';
  body += '<table><thead><tr><th>Milestone</th><th>Current Status</th><th>Goal</th><th>Target Date</th></tr></thead><tbody>';
  body += '<tr><td>Weight</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Blood Pressure</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Exercise (days per week)</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Sleep (hours per night)</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Water intake (oz per day)</td><td></td><td></td><td></td></tr>';
  body += '<tr><td>Meals packed vs. eaten out</td><td></td><td></td><td></td></tr>';
  body += '</tbody></table>';
  body += Packets._footer() + '</div>';

  /* ---- SIGN-OFF SHEET ---- */
  body += '<div class="page-break">' + Packets._header();
  body += '<h1 style="text-align:center;">Driver Acknowledgment &amp; Sign-Off Sheet</h1>';
  body += '<h3 style="text-align:center;">Experienced Driver Safety Refresher Packet</h3>';
  body += '<p>I, the undersigned, acknowledge that I have received, reviewed, and understand the contents of this Experienced Driver Safety Refresher Packet. I understand this refresher supplements my initial training and all applicable federal (FMCSA), state, and company-specific safety policies remain in effect. I commit to applying the updated safety practices and information contained herein.</p>';

  body += '<table class="sign-off-table"><tbody>';
  body += '<tr><td style="width:40%;font-weight:bold;">Driver Name (Print)</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Driver Signature</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">CDL Number</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Date of Hire</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Date Packet Received</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Safety Director Name (Print)</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Safety Director Signature</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Date</td><td></td></tr>';
  body += '</tbody></table>';

  body += '<p style="font-size:9pt;color:#555;margin-top:16px;">This signed acknowledgment should be retained in the driver&rsquo;s personnel/qualification file per 49 CFR Part 391.51.</p>';

  body += '<h2 style="margin-top:36px;">Individual Section Acknowledgments</h2>';
  body += '<table><thead><tr><th style="width:8%;">#</th><th>Section Title</th><th style="width:12%;">Reviewed</th><th style="width:14%;">Driver Initials</th><th style="width:14%;">Date</th></tr></thead><tbody>';
  var refresherSections = [
    'Why Refreshers Matter',
    'HOS Updates & Common Pitfalls',
    'Advanced Fatigue Management',
    'Health & Wellness Check-In',
    'Defensive Driving Refresher',
    'Hazard Recognition Update',
    'Emergency Preparedness Audit',
    'Regulatory Compliance Self-Audit',
    'Mentorship Opportunity',
    'Goals & Action Plan'
  ];
  for (var rs = 0; rs < refresherSections.length; rs++) {
    body += '<tr><td>' + (rs + 1) + '</td><td>' + refresherSections[rs] + '</td><td><div class="check-box" style="margin:auto;"></div></td><td></td><td></td></tr>';
  }
  body += '</tbody></table>';

  /* ---- Safety Director Notes ---- */
  body += '<h2 style="margin-top:36px;">Safety Director Notes</h2>';
  body += '<p>Use this space for any additional observations, follow-up items, or action items specific to this driver:</p>';
  body += '<div style="border:1px solid #333;min-height:200px;padding:12px;margin:12px 0;">';
  body += '<p style="color:#aaa;font-size:9pt;">Notes:</p>';
  body += '</div>';
  body += '<table class="sign-off-table" style="margin-top:16px;"><tbody>';
  body += '<tr><td style="width:40%;font-weight:bold;">Safety Director Signature</td><td></td></tr>';
  body += '<tr><td style="font-weight:bold;">Date</td><td></td></tr>';
  body += '</tbody></table>';
  body += Packets._footer() + '</div>';

  return Packets._wrap('Mile 12 Warrior — Fleet Experienced Driver Refresher Packet', body);
};

/* ============================================================
   Download & Print Helpers
   ============================================================ */
Packets.download = function (type) {
  function track(action, slug) {
    try {
      fetch('/api/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content_type: slug, action: action, product_slug: slug })
      }).catch(function () {});
    } catch (_) {}
  }
  if (type === 'new-driver') {
    fetch('/api/shop/packet-access?type=' + encodeURIComponent(type), { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.allowed) {
          alert('New Driver Packet now requires purchase ($9). Redirecting to shop.');
          window.location.href = '/shop';
          return;
        }
        fetch('/api/shop/packet-download-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type: type })
        }).catch(function () {});
        Packets.downloadDirect(type, track);
      })
      .catch(function () {
        alert('Please sign in and purchase the New Driver Packet to download.');
        window.location.href = '/login';
      });
    return;
  }
  Packets.downloadDirect(type, track);
};

Packets.downloadDirect = function (type, trackFn) {
  var html, filename;
  switch (type) {
    case 'new-driver': html = Packets.newDriver(); filename = 'Mile12Warrior-New-Driver-Packet.html'; break;
    case 'seasoned-driver': html = Packets.seasonedDriver(); filename = 'Mile12Warrior-Seasoned-Driver-Packet.html'; break;
    case 'fleet-new-hire': html = Packets.fleetNewHire(); filename = 'Mile12Warrior-Fleet-NewHire-Packet.html'; break;
    case 'fleet-refresher': html = Packets.fleetRefresher(); filename = 'Mile12Warrior-Fleet-Refresher-Packet.html'; break;
    default: return;
  }
  var blob = new Blob([html], { type: 'text/html' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  if (typeof trackFn === 'function') trackFn('download', filename.replace('.html', '').toLowerCase());
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
};

Packets.print = function (type) {
  if (type === 'new-driver') {
    fetch('/api/shop/packet-access?type=' + encodeURIComponent(type), { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.allowed) {
          alert('New Driver Packet now requires purchase ($9). Redirecting to shop.');
          window.location.href = '/shop';
          return;
        }
        Packets.printDirect(type);
      })
      .catch(function () {
        alert('Please sign in and purchase the New Driver Packet to print.');
        window.location.href = '/login';
      });
    return;
  }
  Packets.printDirect(type);
};

Packets.printDirect = function (type) {
  try {
    fetch('/api/track-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content_type: type, action: 'print', product_slug: type })
    }).catch(function () {});
  } catch (_) {}
  var html;
  switch (type) {
    case 'new-driver': html = Packets.newDriver(); break;
    case 'seasoned-driver': html = Packets.seasonedDriver(); break;
    case 'fleet-new-hire': html = Packets.fleetNewHire(); break;
    case 'fleet-refresher': html = Packets.fleetRefresher(); break;
    default: return;
  }
  var win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(function () { win.print(); }, 500);
};
