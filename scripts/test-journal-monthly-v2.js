'use strict';

const fs = require('fs');
const path = require('path');
const { buildMonthPrintPages, parseMonthParam } = require('../lib/journalPrintMonth');

const root = path.join(__dirname, '..');

let failed = 0;
function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

const month = buildMonthPrintPages();
if (month.monthLabel && month.pagesHtml && month.monthKey) ok('buildMonthPrintPages returns month label, key, and pages');
else fail('buildMonthPrintPages missing output');

const dayCount = (month.pagesHtml.match(/journal-day-header/g) || []).length;
if (dayCount >= 28 && dayCount <= 31) ok('print template includes full calendar month (' + dayCount + ' days)');
else fail('unexpected day count', String(dayCount));

if (month.pagesHtml.includes('journal-day-header') && month.pagesHtml.includes('journal-line')) {
  ok('print pages include date header and lined notes');
} else {
  fail('print pages missing header or lines');
}

if (month.pagesHtml.includes('Pre-trip complete') && month.pagesHtml.includes('Post-trip complete')) {
  ok('print pages include daily checklist rows');
} else {
  fail('print pages missing checklist rows');
}

const june = buildMonthPrintPages('2026-06');
if (june.monthLabel === 'June 2026' && (june.pagesHtml.match(/journal-day-header/g) || []).length === 30) {
  ok('buildMonthPrintPages honors explicit month param');
} else {
  fail('month param parsing failed', june.monthLabel);
}

if (parseMonthParam('2026-13') === null && parseMonthParam('bad') === null) ok('parseMonthParam rejects invalid months');
else fail('parseMonthParam should reject invalid input');

const journalPrintTemplate = fs.readFileSync(path.join(root, 'views', 'journal-print.html'), 'utf8');
if (journalPrintTemplate.includes('<!-- JOURNAL_DAY_PAGES -->')) ok('journal-print.html has day page placeholder');
else fail('journal-print template missing placeholder');

if (journalPrintTemplate.includes('printMonthPicker')) ok('journal-print.html has month picker');
else fail('journal-print template missing month picker');

const serverJs = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
if (serverJs.includes('buildMonthPrintPages') && serverJs.includes('JOURNAL_DAY_PAGES') && serverJs.includes('req.query.month')) {
  ok('server injects monthly journal print pages with month query');
} else {
  fail('server missing journal print injection');
}

const journalRoute = fs.readFileSync(path.join(root, 'routes', 'journal.js'), 'utf8');
if (journalRoute.includes('getEntryForUserDate') && journalRoute.includes('updated: true') && journalRoute.includes('pre_trip')) {
  ok('journal API upserts one entry per day with checklist fields');
} else {
  fail('journal API missing upsert/checklist logic');
}

const journalHtml = fs.readFileSync(path.join(root, 'views', 'journal.html'), 'utf8');
if (journalHtml.includes('One note per day') && journalHtml.includes('dayPicker') && journalHtml.includes('entryPreTrip')) {
  ok('online journal UI is day-centric with checklist fields');
} else {
  fail('journal.html missing day-centric UI or checklist fields');
}

const servicesHtml = fs.readFileSync(path.join(root, 'views', 'services.html'), 'utf8');
if (servicesHtml.includes('Daily Wellness Checklist') && servicesHtml.includes('Tier1Checklist.open()')) {
  ok('services page restores daily wellness checklist section');
} else {
  fail('services.html missing restored checklist section');
}

const dbJs = fs.readFileSync(path.join(root, 'db', 'database.js'), 'utf8');
if (dbJs.includes('idx_journal_user_entry_date') && dbJs.includes('pre_trip')) ok('journal unique index and checklist columns migration present');
else fail('journal schema migration missing');

if (failed) process.exit(1);
console.log('All journal monthly v2 checks passed.');
