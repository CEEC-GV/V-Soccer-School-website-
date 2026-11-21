/**
 * ============================================================================
 * pages/blog.page.js
 * ----------------------------------------------------------------------------
 * Two screens, filled from the posts published in BlogSpeed:
 *   blogPage      /blog/                 every post as a card (+ category filter)
 *   blogPostPage  /blog/<slug>/          one article, with its own title,
 *                                        description, cover image and JSON-LD
 *
 * The posts come from config/blog-data.js, which scripts/blog.js writes at
 * build time (and at npm start). The browser never talks to BlogSpeed, so the
 * API key stays secret. To add or change a post: publish it in BlogSpeed,
 * then rebuild (README > Blog setup).
 * ============================================================================
 */
import { BLOG_POSTS } from "../config/blog-data.js";
import { renderPageBanner } from "../components/media.js";
import { escapeHtml } from "../core/dom.js";

/** The post with this slug, or undefined. */
export function findPost(slug) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

const postUrl = (post) => `/blog/${encodeURIComponent(post.slug)}/`;

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}

/** "12 March 2026 · 6 min read" (+ author) */
function metaLine(post, { withAuthor = false } = {}) {
  const parts = [];
  if (withAuthor && post.author) parts.push(`By ${escapeHtml(post.author)}`);
  const date = formatDate(post.publishedAt);
  if (date) parts.push(`<time datetime="${escapeHtml(post.publishedAt)}">${date}</time>`);
  parts.push(`${post.readingMinutes} min read`);
  return parts.join(" · ");
}

function renderCover(post, { width, height, eager = false, className = "" }) {
  if (!post.coverImage) return "";
  return `
    <figure class="photo blog-cover ${className}">
      <img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" width="${width}" height="${height}"
           ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
           onerror="this.parentNode.classList.add('photo--placeholder');this.remove()">
    </figure>`;
}

function renderPostCard(post) {
  return `
    <article class="card blog-card">
      <a class="blog-card__media" href="${postUrl(post)}" tabindex="-1" aria-hidden="true">
        ${renderCover(post, { width: 700, height: 394, className: "photo--zoom" })}
      </a>
      <div class="card__body">
        ${post.category ? `<span class="tag tag--plain">${escapeHtml(post.category)}</span>` : ""}
        <h2 class="blog-card__title"><a href="${postUrl(post)}">${escapeHtml(post.title)}</a></h2>
        <p class="muted">${escapeHtml(post.excerpt)}</p>
        <p class="blog-meta">${metaLine(post)}</p>
        <div class="card__actions"><a class="text-link" href="${postUrl(post)}">Read the post</a></div>
      </div>
    </article>`;
}

/* ---------------------------------------------------------------------------
   /blog/   (?category=<name> filters the list)
   ------------------------------------------------------------------------ */
export const blogPage = {
  title: "Blog",
  navId: "blog",

  render(query = {}) {
    const categories = [...new Set(BLOG_POSTS.map((post) => post.category).filter(Boolean))].sort();
    const active = categories.includes(query.category) ? query.category : "";
    const posts = active ? BLOG_POSTS.filter((post) => post.category === active) : BLOG_POSTS;

    const filters = categories.length > 1 ? `
      <nav class="blog-filters" aria-label="Blog categories">
        <a class="blog-filter" href="/blog/" aria-current="${active ? "false" : "page"}">All posts</a>
        ${categories.map((name) => `
          <a class="blog-filter" href="/blog/?category=${encodeURIComponent(name)}" aria-current="${name === active ? "page" : "false"}">${escapeHtml(name)}</a>`).join("")}
      </nav>` : "";

    const list = posts.length
      ? `<div class="blog-grid">${posts.map(renderPostCard).join("")}</div>`
      : `<div class="blog-empty">
           <h2>No posts yet</h2>
           <p class="lede" style="margin:10px 0 22px">The coaches are writing the first ones. In the meantime, come and see a session.</p>
           <div class="button-row"><a class="btn" href="/book-trial/">Book a free trial</a></div>
         </div>`;

    return `
      ${renderPageBanner({
        title: "From the touchline",
        intro: "Training tips, match reports and academy news for young players and their parents.",
        photo: "practice",
      })}
      <section class="section"><div class="container">
        ${filters}
        ${list}
      </div></section>`;
  },
};

/* ---------------------------------------------------------------------------
   /blog/<slug>/
   ------------------------------------------------------------------------ */
export const blogPostPage = {
  title: "Blog",
  navId: "blog",

  /** Head tags for this post (core/seo.js) */
  meta(query, slug) {
    const post = findPost(slug);
    if (!post) return undefined;
    return {
      title: post.title,
      ...(post.metaTitle ? { fullTitle: post.metaTitle } : {}),
      description: post.metaDescription,
      keywords: [...post.keywords, ...(post.category ? [post.category] : [])],
      image: post.coverImage || undefined,
      imageAlt: post.title,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      schema: post.structuredData,
    };
  },

  render(query, slug) {
    const post = findPost(slug);
    if (!post) return "";
    const related = BLOG_POSTS
      .filter((other) => other.slug !== post.slug)
      .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
      .slice(0, 3);

    return `
      <article class="section blog-article"><div class="container container--narrow">
        <p class="blog-article__back"><a class="text-link" href="/blog/">← All posts</a></p>
        ${post.category ? `<a class="tag tag--plain" href="/blog/?category=${encodeURIComponent(post.category)}">${escapeHtml(post.category)}</a>` : ""}
        <h1 class="blog-article__title">${escapeHtml(post.title)}</h1>
        <p class="blog-meta">${metaLine(post, { withAuthor: true })}</p>
        ${renderCover(post, { width: 1200, height: 675, eager: true, className: "blog-article__cover" })}
        <div class="blog-content">${post.html}</div>

        <aside class="blog-cta">
          <h2>Want your child to try a session?</h2>
          <p class="muted">The first session at any V Soccer School ground is free.</p>
          <div class="button-row"><a class="btn" href="/book-trial/">Book a free trial</a></div>
        </aside>
      </div></article>

      ${related.length ? `
        <section class="section section--band"><div class="container">
          <div class="section-head">
            <div><h2>More from the blog</h2></div>
            <a class="btn btn--ghost" href="/blog/">All posts</a>
          </div>
          <div class="blog-grid">${related.map(renderPostCard).join("")}</div>
        </div></section>` : ""}`;
  },
};
