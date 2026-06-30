'use strict';

const { DateTime } = require('luxon');
const { printChecklistRowsHtml } = require('./journalWellnessChecklist');

const ZONE = 'America/Los_Angeles';

function laNow() {
  return DateTime.now().setZone(ZONE);
}

function parseMonthParam(raw) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(raw || '').trim());
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;
  const dt = DateTime.fromObject({ year, month, day: 1 }, { zone: ZONE });
  if (!dt.isValid) return null;
  return dt;
}

function resolveMonth(yearMonth) {
  const parsed = parseMonthParam(yearMonth);
  if (parsed) return parsed;
  return laNow().startOf('month');
}

function buildMonthPrintPages(yearMonth) {
  const monthStart = resolveMonth(yearMonth);
  const daysInMonth = monthStart.daysInMonth;
  let pagesHtml = '';

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dt = DateTime.fromObject(
      { year: monthStart.year, month: monthStart.month, day },
      { zone: ZONE }
    );
    const label = dt.toFormat('cccc, LLLL d, yyyy');
    const pageBreak = day > 1 ? ' page-break' : '';
    pagesHtml +=
      '<div class="journal-day' + pageBreak + '">' +
      '<h3 class="journal-day-header">' + label + '</h3>' +
      printChecklistRowsHtml() +
      '<p class="journal-notes-label">Notes</p>' +
      '<div class="journal-lines" aria-hidden="true">' +
      '<div class="journal-line"></div>'.repeat(14) +
      '</div>' +
      '</div>';
  }

  return {
    monthKey: monthStart.toFormat('yyyy-MM'),
    monthLabel: monthStart.toFormat('LLLL yyyy'),
    pagesHtml
  };
}

module.exports = {
  ZONE,
  laNow,
  parseMonthParam,
  resolveMonth,
  buildMonthPrintPages
};
