'use strict';

const { DateTime } = require('luxon');

const ZONE = 'America/Los_Angeles';

function buildMonthPrintPages() {
  const now = DateTime.now().setZone(ZONE);
  const daysInMonth = now.daysInMonth;
  let pagesHtml = '';

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dt = DateTime.fromObject({ year: now.year, month: now.month, day }, { zone: ZONE });
    const label = dt.toFormat('cccc, LLLL d, yyyy');
    const pageBreak = day > 1 ? ' page-break' : '';
    pagesHtml +=
      '<div class="journal-day' + pageBreak + '">' +
      '<h3 class="journal-day-header">' + label + '</h3>' +
      '<div class="journal-lines" aria-hidden="true">' +
      '<div class="journal-line"></div>'.repeat(18) +
      '</div>' +
      '</div>';
  }

  return {
    monthLabel: now.toFormat('LLLL yyyy'),
    pagesHtml
  };
}

module.exports = {
  ZONE,
  buildMonthPrintPages
};
