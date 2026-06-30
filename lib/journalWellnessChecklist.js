'use strict';

/** Daily wellness checklist groups — shared by Services embed, journal, and print. */
const DAILY_WELLNESS_GROUPS = [
  {
    id: 'morning',
    title: 'Morning — meals & pre-trip',
    summary: 'Hydrate, breakfast, full pre-trip DVIR, weather check.',
    items: [
      'Drink 16 oz of water upon waking',
      'Eat a protein-rich breakfast',
      'Complete full pre-trip inspection (DVIR)',
      'Check weather and road conditions',
      'Verify ELD status and log on duty'
    ]
  },
  {
    id: 'onroad',
    title: 'On the road — meals & wellness',
    summary: 'Following distance, breaks, balanced midday meal, fatigue check.',
    items: [
      'Maintain 7-second following distance',
      'Stop every 2–3 hours: stretch, hydrate, walk',
      'Eat a balanced midday meal',
      'Monitor fatigue — nap if drowsy',
      'Track HOS and plan stops before clocks run out'
    ]
  },
  {
    id: 'evening',
    title: 'Evening — post-trip wind-down',
    summary: 'Post-trip DVIR, walk, family check-in, sleep target.',
    items: [
      'Complete post-trip DVIR and report defects',
      'Walk 15–30 minutes after parking',
      'Call or video chat with family',
      'Limit screen time before bed',
      'Target 7–8 hours of sleep'
    ]
  }
];

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function printChecklistRowsHtml() {
  return (
    '<div class="journal-checklist">' +
    '<div class="journal-row"><label>Meals today</label><span class="line">&nbsp;</span></div>' +
    '<div class="journal-row journal-check-row"><label>Pre-trip complete</label><span class="check-box">&nbsp;</span></div>' +
    '<div class="journal-row journal-check-row"><label>Post-trip complete</label><span class="check-box">&nbsp;</span></div>' +
    '</div>'
  );
}

module.exports = {
  DAILY_WELLNESS_GROUPS,
  escapeHtml,
  printChecklistRowsHtml
};
