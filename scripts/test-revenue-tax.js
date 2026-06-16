'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');
const tmpDb = path.join(os.tmpdir(), 'drivershield-revenue-test-' + Date.now() + '.db');
const db = new Database(tmpDb);
function ok(msg) { console.log('OK:', msg); }
function fail(msg) { console.error('FAIL:', msg); process.exitCode = 1; }
db.exec("CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, total REAL, status TEXT, payment_status TEXT, payment_method TEXT, paid_at DATETIME, created_at DATETIME)");
db.prepare("INSERT INTO orders (total, status, payment_status, payment_method, paid_at, created_at) VALUES (49.99, 'completed', 'pending', NULL, NULL, '2026-03-15 10:00:00')").run();
db.prepare("INSERT INTO orders (total, status, payment_status, payment_method, paid_at, created_at) VALUES (29.00, 'completed', 'paid', 'stripe', '2026-06-15 14:30:00', '2026-06-15 14:25:00')").run();
db.prepare("INSERT INTO orders (total, status, payment_status, payment_method, paid_at, created_at) VALUES (29.00, 'pending', 'pending', NULL, NULL, '2026-06-15 09:00:00')").run();
const PAID = "LOWER(COALESCE(status, '')) != 'cancelled' AND (LOWER(COALESCE(payment_status, '')) = 'paid' OR (LOWER(COALESCE(payment_status, '')) IN ('', 'pending') AND LOWER(COALESCE(status, '')) IN ('completed', 'processing', 'shipped', 'delivered') AND COALESCE(total, 0) > 0))";
const RD = "datetime(COALESCE(paid_at, created_at))";
function bounds(fy){const s=new Date(Date.UTC(fy-1,4,1));const e=new Date(Date.UTC(fy,3,30,23,59,59,999));const p=n=>String(n).padStart(2,'0');const f=d=>d.getUTCFullYear()+'-'+p(d.getUTCMonth()+1)+'-'+p(d.getUTCDate())+' '+p(d.getUTCHours())+':'+p(d.getUTCMinutes())+':'+p(d.getUTCSeconds());return{f:f(s),t:f(e)};}
function sum(fy){const b=bounds(fy);return db.prepare('SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cnt FROM orders WHERE '+PAID+' AND '+RD+' >= datetime(?) AND '+RD+' <= datetime(?)').get(b.f,b.t);}
const a=sum(2026), b=sum(2027);
if(Math.abs(a.total-49.99)<0.01&&a.cnt===1)ok('FY2026 legacy kit'); else fail('FY2026 got '+a.total);
if(Math.abs(b.total-29)<0.01&&b.cnt===1)ok('FY2027 stripe packet'); else fail('FY2027 got '+b.total);
db.close(); if(process.exitCode)process.exit(process.exitCode); console.log('passed');
