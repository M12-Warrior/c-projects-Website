'use strict';

const fs = require('fs');
const path = require('path');

const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'views', 'admin.html'), 'utf8');
const shopJs = fs.readFileSync(path.join(__dirname, '..', 'routes', 'shop.js'), 'utf8');
const adminJs = fs.readFileSync(path.join(__dirname, '..', 'routes', 'admin.js'), 'utf8');

function ok(msg) { console.log('OK:', msg); }
function fail(msg) { console.error('FAIL:', msg); process.exitCode = 1; }

const tabIds = [];
const tabRe = /data-tab="([^"]+)"/g;
let tabMatch;
while ((tabMatch = tabRe.exec(adminHtml)) !== null) {
  tabIds.push(tabMatch[1]);
}
const uniqueTabs = tabIds.filter(function (t, i, a) { return a.indexOf(t) === i; });

const staticTabs = { compliance: true };

uniqueTabs.forEach(function (tab) {
  if (staticTabs[tab]) return;
  const loaderName = 'load' + tab.charAt(0).toUpperCase() + tab.slice(1);
  const fnDef = new RegExp('(?:async\\s+)?function\\s+' + loaderName + '\\s*\\(');
  const windowAssign = new RegExp('window\\.' + loaderName + '\\s*=\\s*' + loaderName);
  if (!fnDef.test(adminHtml)) {
    fail('tab "' + tab + '" has no ' + loaderName + '() function');
    return;
  }
  if (!windowAssign.test(adminHtml)) {
    fail('tab "' + tab + '" missing window.' + loaderName + ' registration');
    return;
  }
  ok('tab "' + tab + '" exports ' + loaderName);
});

if (/<div id="tabShop"[\s\S]*?id="productEditModal"[\s\S]*?<div id="tabServices"/.test(adminHtml)) {
  fail('productEditModal should live outside #tabShop so a fixed overlay cannot block the tab');
} else {
  ok('product edit modal moved outside tab panel');
}

if (!/function closeAdminModals\(/.test(adminHtml) || !/closeAdminModals\(\)/.test(adminHtml)) {
  fail('activateAdminTab should close admin modals when switching tabs');
} else {
  ok('admin tab switch closes overlays');
}

if (!/function bindShopTabInteractions\(/.test(adminHtml) ||
    !/getElementById\('tabShop'\)[\s\S]*addEventListener\('click'/.test(adminHtml)) {
  fail('Shop tab should use delegated click handlers for edit/save actions');
} else {
  ok('shop tab uses delegated edit/save handlers');
}

if (!/\/api\/shop\/admin\/products/.test(adminHtml)) {
  fail('loadShop should fetch /api/shop/admin/products');
} else {
  ok('loadShop uses admin products API');
}

if (!/router\.get\('\/admin\/products', requireAdmin/.test(shopJs)) {
  fail('routes/shop.js missing GET /admin/products');
} else {
  ok('admin products API route present');
}

if (!/\/api\/blog\/admin\/posts/.test(adminHtml)) {
  fail('loadBlog should fetch /api/blog/admin/posts');
} else {
  ok('loadBlog uses admin posts API');
}

if (/<div id="tabBlog"[\s\S]*?id="blogEditModal"[\s\S]*?<div id="tabForum"/.test(adminHtml)) {
  fail('blogEditModal should live outside #tabBlog so a fixed overlay cannot block the tab');
} else {
  ok('blog edit modal moved outside tab panel');
}

if (!/function bindBlogTabInteractions\(/.test(adminHtml) ||
    !/getElementById\('tabBlog'\)[\s\S]*addEventListener\('click'/.test(adminHtml)) {
  fail('Blog tab should use delegated click handlers for edit/publish/delete actions');
} else {
  ok('blog tab uses delegated edit handlers');
}


if (!/course-preview-open/.test(adminHtml)) {
  fail('loadPacketPreviews should support course-preview-open for full course');
} else {
  ok('packet previews tab supports full course preview');
}

if (!/kind:\s*'course'/.test(adminJs)) {
  fail('ADMIN_PACKET_CATALOG should include full course entry');
} else {
  ok('admin packet catalog includes full course');
}

if (process.exitCode) process.exit(process.exitCode);
console.log('All admin tab loader checks passed.');