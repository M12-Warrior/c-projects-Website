// Smoke checks: Social Butterflies Family Circle community (run: node scripts/test-sb-community.js)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dbJs = fs.readFileSync(path.join(root, 'db', 'database.js'), 'utf8');
const serverJs = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const sbHtml = fs.readFileSync(path.join(root, 'views', 'social-butterflies.html'), 'utf8');
const communityHtml = fs.readFileSync(path.join(root, 'views', 'sb-community.html'), 'utf8');
const forumHtml = fs.readFileSync(path.join(root, 'views', 'forum.html'), 'utf8');
const forumCatHtml = fs.readFileSync(path.join(root, 'views', 'forum-category.html'), 'utf8');
const constantsJs = fs.readFileSync(path.join(root, 'lib', 'forumConstants.js'), 'utf8');

let failed = 0;
function ok(label) { console.log('ok', label); }
function fail(label, detail) { console.error('FAIL', label, detail || ''); failed++; }

if (dbJs.includes("'family-circle'")) ok('database family-circle category migration');
else fail('database family-circle category migration');

if (serverJs.includes('/social-butterflies/community')) ok('server community routes');
else fail('server community routes');

if (serverJs.includes('sb-community.html') && serverJs.includes('requireLogin')) ok('community new-thread requires login');
else fail('community new-thread login gate');

if (communityHtml.includes('family-circle') && communityHtml.includes('/api/forum/categories/')) ok('community page uses forum API');
else fail('community page forum API');

if (sbHtml.includes('/social-butterflies/community')) ok('social-butterflies links to community');
else fail('social-butterflies community link');

if (forumHtml.includes("c.slug !== 'family-circle'")) ok('driver forum hides family-circle');
else fail('driver forum family-circle filter');

if (forumCatHtml.includes("slug === 'family-circle'")) ok('forum category redirects family-circle');
else fail('forum category family-circle redirect');

if (constantsJs.includes('FAMILY_CIRCLE_SLUG')) ok('forumConstants slug export');
else fail('forumConstants slug export');

if (communityHtml.includes('No conversations yet')) ok('community empty state copy');
else fail('community empty state copy');

const accountHtml = fs.readFileSync(path.join(root, 'views', 'account.html'), 'utf8');
if (accountHtml.includes('id="tabBtnCommunity"') && accountHtml.includes('id="tabPanelCommunity"')) ok('account community tab');
else fail('account community tab');
if (accountHtml.includes('/social-butterflies/community') && accountHtml.includes('Family Circle')) ok('account family circle link');
else fail('account family circle link');
if (accountHtml.includes('href="/forum"') && accountHtml.includes("Driver's Lounge")) ok('account forum link');
else fail('account forum link');

if (serverJs.includes('/api/family-circle/recipes')) ok('family circle recipes API route');
else fail('family circle recipes API route');

if (dbJs.includes('family_circle_recipes')) ok('family circle recipes table');
else fail('family circle recipes table');

if (fs.existsSync(path.join(root, 'routes', 'familyCircleRecipes.js'))) ok('familyCircleRecipes route module');
else fail('familyCircleRecipes route module');

if (fs.existsSync(path.join(root, 'views', 'sb-community-recipes.html'))) ok('recipes list page');
else fail('recipes list page');

const recipesHtml = fs.readFileSync(path.join(root, 'views', 'sb-community-recipes.html'), 'utf8');
if (recipesHtml.includes('sb-community-tabs') && recipesHtml.includes('Road recipes')) ok('recipes community tab');
else fail('recipes community tab');

if (recipesHtml.includes('/api/family-circle/recipes')) ok('recipes page API fetch');
else fail('recipes page API fetch');

const recipeDetailHtml = fs.readFileSync(path.join(root, 'views', 'sb-community-recipe.html'), 'utf8');
if (recipeDetailHtml.includes('sb-recipe-fold') && recipeDetailHtml.includes('deleteBtn')) ok('recipe detail fold and delete');
else fail('recipe detail fold and delete');

if (recipeDetailHtml.includes('recipeEditForm') && recipeDetailHtml.includes('PUT')) ok('recipe author edit');
else fail('recipe author edit');

if (sbHtml.includes('/social-butterflies/community/recipes')) ok('social-butterflies links to recipes');
else fail('social-butterflies recipes link');

if (serverJs.includes('/social-butterflies/blog')) ok('server social butterflies blog routes');
else fail('server social butterflies blog routes');

if (dbJs.includes("audience TEXT DEFAULT 'driver'") || dbJs.includes('audience TEXT')) ok('blog audience column migration');
else fail('blog audience column migration');

const blogJs = fs.readFileSync(path.join(root, 'routes', 'blog.js'), 'utf8');
if (blogJs.includes('normalizeAudience') && blogJs.includes("req.query.audience")) ok('blog audience filter API');
else fail('blog audience filter API');

if (fs.existsSync(path.join(root, 'views', 'sb-blog.html'))) ok('sb blog list page');
else fail('sb blog list page');

if (sbHtml.includes('id="articles"') && sbHtml.includes('/social-butterflies/blog')) ok('social butterflies articles section');
else fail('social butterflies articles section');

const adminHtml = fs.readFileSync(path.join(root, 'views', 'admin.html'), 'utf8');
if (adminHtml.includes('tabSocialButterflies') && adminHtml.includes('loadSocialButterflies')) ok('admin social butterflies tab');
else fail('admin social butterflies tab');

if (adminHtml.includes('blogNewAudience') && adminHtml.includes('blogAudienceFilter')) ok('admin blog audience controls');
else fail('admin blog audience controls');

if (failed) process.exit(1);
console.log('All Social Butterflies community checks passed.');
