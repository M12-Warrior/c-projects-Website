'use strict';

const WORDS = [
  'fuck', 'fucking', 'fucker', 'fucked', 'fucks',
  'shit', 'shits', 'shitting', 'bullshit',
  'bitch', 'bitches', 'asshole', 'bastard',
  'damn', 'crap', 'piss', 'pissed',
  'dick', 'dicks', 'cock', 'cocks',
  'whore', 'slut', 'cunt'
];

const pattern = new RegExp('\\b(' + WORDS.map(function (w) {
  return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}).join('|') + ')\\b', 'gi');

function maskProfanity(text) {
  if (text == null || text === '') return text;
  return String(text).replace(pattern, function (match) {
    if (match.length <= 2) return '**';
    return match[0] + '*'.repeat(Math.max(2, match.length - 2)) + match[match.length - 1];
  });
}

function containsProfanity(text) {
  if (text == null || text === '') return false;
  pattern.lastIndex = 0;
  return pattern.test(String(text));
}

module.exports = { maskProfanity, containsProfanity };
