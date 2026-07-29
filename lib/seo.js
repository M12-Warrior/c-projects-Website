'use strict';

const { siteBaseUrl } = require('./siteUrl');

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/\n/g, ' ');
}

/** Plain text from HTML for meta descriptions. */
function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, maxLen) {
  const s = String(text || '').trim();
  if (s.length <= maxLen) return s;
  const cut = s.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

/**
 * Build common SEO head tags (description, canonical, OG, Twitter).
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.url absolute URL
 * @param {string} [opts.image] absolute image URL
 * @param {string} [opts.type] og:type default website
 * @param {object|object[]} [opts.jsonLd]
 */
function renderHeadTags(opts) {
  const title = opts.title || 'Mile 12 Warrior';
  const description = truncate(opts.description || '', 160);
  const url = opts.url || '';
  const image = opts.image || '';
  const type = opts.type || 'website';
  const parts = [];
  if (description) {
    parts.push('<meta name="description" content="' + escapeAttr(description) + '">');
  }
  if (url) {
    parts.push('<link rel="canonical" href="' + escapeAttr(url) + '">');
    parts.push('<meta property="og:url" content="' + escapeAttr(url) + '">');
  }
  parts.push('<meta property="og:site_name" content="Mile 12 Warrior">');
  parts.push('<meta property="og:type" content="' + escapeAttr(type) + '">');
  parts.push('<meta property="og:title" content="' + escapeAttr(title) + '">');
  if (description) {
    parts.push('<meta property="og:description" content="' + escapeAttr(description) + '">');
  }
  if (image) {
    parts.push('<meta property="og:image" content="' + escapeAttr(image) + '">');
  }
  parts.push('<meta name="twitter:card" content="' + (image ? 'summary_large_image' : 'summary') + '">');
  parts.push('<meta name="twitter:title" content="' + escapeAttr(title) + '">');
  if (description) {
    parts.push('<meta name="twitter:description" content="' + escapeAttr(description) + '">');
  }
  if (image) {
    parts.push('<meta name="twitter:image" content="' + escapeAttr(image) + '">');
  }
  if (opts.jsonLd) {
    const blocks = Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd];
    blocks.forEach(function (block) {
      if (!block) return;
      parts.push('<script type="application/ld+json">' + JSON.stringify(block).replace(/</g, '\\u003c') + '</script>');
    });
  }
  return parts.join('\n  ');
}

function organizationJsonLd(baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Mile 12 Warrior',
    url: baseUrl,
    logo: baseUrl + '/images/logo.png',
    description: 'Fatigue management, HOS-aligned rest, wellness, and defensive driving resources for professional truck drivers.',
    email: 'joyce@mile12warrior.com',
  };
}

function websiteJsonLd(baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Mile 12 Warrior',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: baseUrl + '/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

function blogPostingJsonLd(baseUrl, post) {
  const authorName = (post.author_display && String(post.author_display).trim())
    || post.author_username
    || 'Mile 12 Warrior';
  const url = baseUrl + (post.audience === 'family'
    ? '/social-butterflies/blog/' + post.slug
    : '/blog/' + post.slug);
  const desc = truncate(post.excerpt || stripHtml(post.content), 160);
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: desc,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: { '@type': 'Person', name: authorName },
    publisher: {
      '@type': 'Organization',
      name: 'Mile 12 Warrior',
      logo: { '@type': 'ImageObject', url: baseUrl + '/images/logo.png' },
    },
    mainEntityOfPage: url,
    url: url,
  };
  if (post.image) obj.image = post.image.indexOf('http') === 0 ? post.image : (baseUrl + post.image);
  return obj;
}

function courseJsonLd(baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'New Driver 90-Day Onboarding Course',
    description: 'CDL new-hire onboarding for professional truck drivers: fatigue awareness, HOS basics, defensive driving, and road-ready habits.',
    provider: {
      '@type': 'Organization',
      name: 'Mile 12 Warrior',
      url: baseUrl,
    },
    url: baseUrl + '/course',
  };
}

const STATIC_SITEMAP_PATHS = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/services', changefreq: 'monthly', priority: '0.9' },
  { path: '/course', changefreq: 'monthly', priority: '0.9' },
  { path: '/wellness', changefreq: 'weekly', priority: '0.7' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/forum', changefreq: 'daily', priority: '0.6' },
  { path: '/shop', changefreq: 'weekly', priority: '0.7' },
  { path: '/packets/new-driver', changefreq: 'monthly', priority: '0.8' },
  { path: '/packets/seasoned-driver', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'yearly', priority: '0.5' },
  { path: '/social-butterflies', changefreq: 'weekly', priority: '0.7' },
  { path: '/social-butterflies/blog', changefreq: 'weekly', priority: '0.6' },
  { path: '/accessibility', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/disclaimer', changefreq: 'yearly', priority: '0.3' },
];

function buildSitemapXml(baseUrl, blogPosts) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const urls = STATIC_SITEMAP_PATHS.map(function (row) {
    return {
      loc: base + row.path,
      changefreq: row.changefreq,
      priority: row.priority,
    };
  });
  (blogPosts || []).forEach(function (p) {
    if (!p || !p.slug) return;
    const isFamily = p.audience === 'family';
    urls.push({
      loc: base + (isFamily ? '/social-butterflies/blog/' : '/blog/') + encodeURIComponent(p.slug).replace(/%2F/g, '/'),
      lastmod: (p.updated_at || p.created_at || '').slice(0, 10) || undefined,
      changefreq: 'weekly',
      priority: '0.7',
    });
  });
  const body = urls.map(function (u) {
    let xml = '  <url>\n    <loc>' + escapeHtml(u.loc) + '</loc>\n';
    if (u.lastmod) xml += '    <lastmod>' + escapeHtml(u.lastmod) + '</lastmod>\n';
    if (u.changefreq) xml += '    <changefreq>' + u.changefreq + '</changefreq>\n';
    if (u.priority) xml += '    <priority>' + u.priority + '</priority>\n';
    xml += '  </url>';
    return xml;
  }).join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + body + '\n</urlset>\n';
}

module.exports = {
  escapeHtml,
  escapeAttr,
  stripHtml,
  truncate,
  renderHeadTags,
  organizationJsonLd,
  websiteJsonLd,
  blogPostingJsonLd,
  courseJsonLd,
  buildSitemapXml,
  siteBaseUrl,
  STATIC_SITEMAP_PATHS,
};
