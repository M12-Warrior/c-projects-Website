'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const tmpDb = path.join(os.tmpdir(), 'drivershield-revenue-test-' + Date.now() + '.db');
const db = new Database(tmpDb);
function ok(msg) { console.log('OK:', msg); }
function fail(msg) { console.error('FAIL:', msg); process.exitCode = 1; }
db.exec("CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, total REAL, status TEXT, payment_status TEXT, payment_method TEXT, paid_at DATETIME, created_at DATETIME)");
db.exec("CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
db.exec("CREATE TABLE order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, product_id INTEGER, quantity INTEGER, price REAL)");
db.prepare("INSERT INTO orders (total, status, payment_status, payment_method, paid_at, created_at) VALUES (49.99, 'completed', 'pending', NULL, NULL, '2026-03-15 10:00:00')").run();
db.prepare("INSERT INTO orders (total, status, payment_status, payment_method, paid_at, created_at) VALUES (29.00, 'completed', 'paid', 'stripe', '2026-06-15 14:30:00', '2026-06-15 14:25:00')").run();
db.prepare("INSERT INTO orders (total, status, payment_status, payment_method, paid_at, created_at) VALUES (19.99, 'paid', 'pending', NULL, NULL, '2026-02-10 12:00:00')").run();
db.prepare("INSERT INTO orders (total, status, payment_status, payment_method, paid_at, created_at) VALUES (29.00, 'pending', 'pending', NULL, NULL, '2026-06-15 09:00:00')").run();
db.prepare("INSERT INTO products (name) VALUES ('New Driver Packet')").run();
db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (2, 1, 1, 29.00)").run();
const PAID = "LOWER(COALESCE(status, '')) != 'cancelled' AND (LOWER(COALESCE(payment_status, '')) = 'paid' OR (LOWER(COALESCE(payment_status, '')) IN ('', 'pending') AND LOWER(COALESCE(status, '')) IN ('completed', 'processing', 'shipped', 'delivered', 'paid') AND COALESCE(total, 0) > 0))";
const RD = "datetime(COALESCE(paid_at, created_at))";
function bounds(fy){const s=new Date(Date.UTC(fy-1,4,1));const e=new Date(Date.UTC(fy,3,30,23,59,59,999));const p=n=>String(n).padStart(2,'0');const f=d=>d.getUTCFullYear()+'-'+p(d.getUTCMonth()+1)+'-'+p(d.getUTCDate())+' '+p(d.getUTCHours())+':'+p(d.getUTCMinutes())+':'+p(d.getUTCSeconds());return{f:f(s),t:f(e)};}
function fiscalMonthKeys(fy){const keys=[];let y=fy-1,m=4;for(let i=0;i<12;i++){keys.push(y+'-'+String(m+1).padStart(2,'0'));m++;if(m>11){m=0;y++;}}return keys;}
function buildFiscalMonths(fy, rows){const by={};(rows||[]).forEach(r=>{by[r.month_key]={revenue:Number(r.revenue||0),orderCount:Number(r.order_count||0)};});let rt=0;return fiscalMonthKeys(fy).map(k=>{const e=by[k]||{revenue:0,orderCount:0};rt+=e.revenue;return{month_key:k,revenue:e.revenue,running_total:Math.round(rt*100)/100};});}
function sum(fy){const b=bounds(fy);return db.prepare('SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cnt FROM orders WHERE '+PAID+' AND '+RD+' >= datetime(?) AND '+RD+' <= datetime(?)').get(b.f,b.t);}
const a=sum(2026), b=sum(2027);
if(Math.abs(a.total-69.98)<0.01&&a.cnt===2)ok('FY2026 legacy kit + status paid'); else fail('FY2026 got '+a.total+' cnt '+a.cnt);
if(Math.abs(b.total-29)<0.01&&b.cnt===1)ok('FY2027 stripe packet'); else fail('FY2027 got '+b.total);
const cal=db.prepare('SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cnt FROM orders WHERE '+PAID+' AND '+RD+' >= datetime(?) AND '+RD+' <= datetime(?)').get('2026-01-01 00:00:00','2026-12-31 23:59:59');
if(Math.abs(cal.total-98.98)<0.01&&cal.cnt===3)ok('calendar 2026 includes pre-May legacy orders'); else fail('calendar 2026 got '+cal.total+' cnt '+cal.cnt);
const fyOrders=db.prepare('SELECT total FROM orders WHERE '+PAID+' AND '+RD+' >= datetime(?) AND '+RD+' <= datetime(?)').all(bounds(2027).f,bounds(2027).t);
const fySum=Math.round(fyOrders.reduce((s,r)=>s+Number(r.total||0),0)*100)/100;
if(Math.abs(fySum-b.total)<0.01&&fyOrders.length===b.cnt)ok('fiscal listed orders match fiscal total'); else fail('fiscal list mismatch');
const monthRows=db.prepare("SELECT strftime('%Y-%m', "+RD+") AS month_key, COALESCE(SUM(total),0) AS revenue, COUNT(*) AS order_count FROM orders WHERE "+PAID+" GROUP BY month_key").all();
const months=buildFiscalMonths(2027, monthRows);
if(months.length===12)ok('fiscal year returns all 12 months'); else fail('expected 12 months got '+months.length);
const june=months.find(m=>m.month_key==='2026-06');
if(june&&Math.abs(june.revenue-29)<0.01)ok('June 2026 revenue'); else fail('June revenue missing');
const running=months.filter(m=>m.month_key<='2026-06').pop();
if(running&&Math.abs(running.running_total-29)<0.01)ok('running total through June'); else fail('running total wrong');
const prod=db.prepare("SELECT p.name AS product_name, SUM(oi.quantity) AS units_sold FROM order_items oi JOIN orders o ON o.id=oi.order_id JOIN products p ON p.id=oi.product_id WHERE "+PAID.replace(/\bstatus\b/g,'o.status').replace(/\bpayment_status\b/g,'o.payment_status').replace(/\btotal\b/g,'o.total')+" GROUP BY p.id").get();
if(prod&&prod.units_sold===1)ok('product analytics query'); else fail('product analytics');
db.close(); if(process.exitCode)process.exit(process.exitCode); console.log('passed');
