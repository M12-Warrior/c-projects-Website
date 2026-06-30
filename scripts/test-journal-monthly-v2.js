'use strict';

const fs = require('fs');
const path = require('path');
const { buildMonthPrintPages } = require('../lib/journalPrintMonth');

const root = path.join(__dirname, '..');

let failed = 0;
function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

const month = buildMonthPrintPages();
if (month.monthLabel && month.pagesHtml) ok('buildMonthPrintPages returns month label and pages');
else fail('buildMonthPrintPages missing output');

const dayCount = (month.pagesHtml.match(/journal-day-header/g) || []).length;
if (dayCount >= 28 && dayCount <= 31) ok('print template includes full calendar month (' + dayCount + ' days)');
else fail('unexpected day count', String(dayCount));

if (month.pagesHtml.includes('journal-day-header') && month.pagesHtml.includes('journal-line')) {
  ok('print pages include date header and lined notes');
} else {
  fail('print pages missing header or lines');
}

const journalPrintTemplate = fs.readFileSync(path.join(root, 'views', 'journal-print.html'), 'utf8');
if (journalPrintTemplate.includes('<!-- JOURNAL_DAY_PAGES -->')) ok('journal-print.html has day page placeholder');
else fail('journal-print template missing placeholder');

const serverJs = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
if (serverJs.includes('buildMonthPrintPages') && serverJs.includes('JOURNAL_DAY_PAGES')) {
  ok('server injects monthly journal print pages');
} else {
  fail('server missing journal print injection');
}

const journalRoute = fs.readFileSync(path.join(root, 'routes', 'journal.js'), 'utf8');
if (journalRoute.includes('getEntryForUserDate') && journalRoute.includes('updated: true')) {
  ok('journal API upserts one entry per day');
} else {
  fail('journal API missing upsert logic');
}

const journalHtml = fs.readFileSync(path.join(root, 'views', 'journal.html'), 'utf8');
if (journalHtml.includes('One note per day') && journalHtml.includes('dayPicker')) {
  ok('online journal UI is day-centric');
} else {
  fail('journal.html missing day-centric UI');
}

const dbJs = fs.readFileSync(path.join(root, 'db', 'database.js'), 'utf8');
if (dbJs.includes('idx_journal_user_entry_date')) ok('journal unique index migration present');
else fail('journal unique index migration missing');

if (failed) process.exit(1);
console.log('All journal monthly v2 checks passed.');
