# AGENTS.md

## Project Direction

This site is a fresh start for Tomasz Rozanski's personal webpage. Treat the old
Hugo/Wowchemy output as historical reference only, not as architecture to
preserve. Do not port legacy teaching material, posts, layouts, or generated
HTML unless the user explicitly asks for that content to return.

The preferred direction is a hand-crafted static website:

- Plain HTML, CSS, and small amounts of vanilla JavaScript.
- No frontend framework and no static site generator by default.
- No package manager, build step, bundler, or dependency tree unless there is a
  clear need and the user agrees.
- Codex acts as the site assistant: creating pages, updating indexes, checking
  links, keeping metadata consistent, and maintaining RSS/sitemap files if they
  become useful.

The goal is not to recreate the old academic theme. The new site should feel
personal, light, maintainable, and deliberate.

## Content Philosophy

This is a compact personal site first, not a migrated archive. Start with the
current professional identity, selected projects, selected research/publication
information, and contact/profile material. Add blog posts, teaching material,
or long-form pages only when there is real content for them.

Do not create empty sections just because the old site had them. Avoid
placeholder pages, fake blog indexes, or mirrored navigation items that lead to
thin content.

## Language Strategy

English and Polish content are allowed to be asymmetric.

- English pages live at the root, for example `/about/` or `/projects/`.
- Polish pages live under `/pl/`, for example `/pl/o-mnie/` or `/pl/projekty/`.
- A page may exist only in English.
- A page may exist only in Polish.
- When a real counterpart exists, link the two pages with visible language
  navigation and proper `rel="alternate"` metadata.
- When no counterpart exists, do not invent a placeholder translation.
- Global language navigation may point to the language homepage when there is no
  page-level counterpart.

Keep the language switch simple and honest: it should help visitors find the
available version, not imply that every page has a translation.

## Implementation Style

- Write semantic HTML with accessible landmarks, headings, alt text, and link
  labels.
- Keep CSS in a small number of readable files under `assets/`.
- Prefer stable, boring layout primitives over clever abstractions.
- Avoid copying the same large block of HTML repeatedly if a simpler convention
  or Codex-maintained snippet can keep it consistent.
- Keep JavaScript optional and minimal. Use it only for small enhancements such
  as theme switching, equation rendering, or lightweight navigation behavior.
- If equations are needed, prefer adding MathJax or KaTeX only on pages that use
  them.
- Preserve important public URLs only when they still serve useful content.
  Otherwise, prefer a clean new structure.

## Responsive QA Loop

Every meaningful visual change should be checked across common viewport sizes
before it is considered done. At minimum, inspect the page at:

- `375x812` for a phone-sized portrait viewport.
- `768x1024` for a tablet-sized portrait viewport.
- `1024x768` for a small laptop or tablet landscape viewport.
- `1440x900` for a typical desktop/laptop viewport.

Use the in-app browser or another browser automation tool to take a real look at
the rendered page. The goal is not pixel perfection at every size, but to catch
obvious failures: broken navigation, unreadable text, horizontal overflow,
overlapping sections, images with bad cropping, cramped tap targets, equations
or code blocks escaping their containers, and language-switch/menu states that
fall apart.

When a page has an interactive menu, theme control, language switch, equation,
image-heavy section, app/demo, or other special UI, include that state in the
responsive check. Fix glaring issues before calling the work complete.

## Refactor Guidance

Before large deletions, make sure replacement pages exist for the homepage and
any URLs the user wants to keep. The old generated files may be removed as part
of the rebuild, but only as an intentional cleanup step.

When adding new content, update related navigation, metadata, sitemap/RSS files
if present, and any language counterpart links that actually exist.

Keep changes understandable. This project should remain easy to open in a text
editor and reason about without reconstructing a toolchain.
