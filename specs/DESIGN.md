# Personal Website Design Specification: "The Subtle Journal"

## 1. Project Overview & Core Philosophy

**The Designer:** CS student, student developer, introverted, philosophy/reading enthusiast, builder of assistive tech and side projects.
**The Goal:** A dual-audience website serving recruiters (scannable, informational) and personal visitors (holistic, exploratory).
**The Concept:** The "Subtle Journal." A digital analog to an engineer's personal notebook. It avoids literal skeuomorphism (no paper textures or leather) and instead relies on typography, generous whitespace, and structural pacing to evoke a quiet, thoughtful journal.

**Core Design Principles:**

- **The Index vs. The Entries:** "Index" pages (Home, list pages) use clean sans-serif and act as a highly scannable table of contents. "Entry" pages (articles, project writeups) use warm serif fonts for immersive, focused reading.
- **Accessibility as Identity:** Strict adherence to WCAG standards. High contrast, semantic HTML, keyboard navigability.
- **Text-First Minimalism:** No heavy shadows, glossy buttons, or complex animations. UI elements are defined by typography, thin borders, and subtle hover states.

---

## 2. Visual Identity & Typography

### Color Palette (Light Mode Only)

- **Background:** `#FAFAF8` (Warm off-white/cream, reduces eye strain)
- **Primary Text:** `#222222` (Dark charcoal "ink")
- **Accent / Links:** `#2C5C7C` (Muted slate blue, provides a subtle pop without being loud)
- **Borders / Dividers:** `#E2E2DD` (Light gray, for separating list items or sections)
- **Metadata / Tags:** `#666666` (Medium gray, for dates, reading time, and tag pills)

### Typography

- **Sans-Serif (UI, Nav, Lists, Index Pages):** `IBM Plex Sans`
  - _Usage:_ Navigation, homepage intro, project/blog list items, tag pills, metadata. Clean, structured, engineering-minded.
- **Serif (Entry / Reading Pages):** `Source Serif Pro`
  - _Usage:_ Project writeups, blog posts, random thoughts. Highly readable, classic journal/print aesthetic.
  - _Special Styling:_ Use CSS `::first-letter` for a subtle drop-cap on the first paragraph of every entry to signal "written piece." Ensure the DOM keeps the letter attached to the word for screen readers.

---

## 3. Global Structure & Components

### Navigation Bar

- **Placement:** Top of the site, sticky on scroll.
- **Content:** Left-aligned or centered. Contains four text links: `Home`, `Projects`, `Blog`, `Misc`.
- **Styling:** IBM Plex Sans. No background colors or buttons. Active page is indicated by a subtle underline or a small dot beneath the text. Hover state is a subtle color change to the Accent color.
- **Mobile:** Text links shrink slightly but easily fit on a single row for standard mobile widths.

### Footer (Optional/Minimal)

- Can be omitted entirely. If used, keep it strictly to copyright or a "Built with..." colophon note in small, gray IBM Plex Sans.

---

## 4. Page-by-Page Specifications

### A. Homepage (The Title Page)

- **Goal:** Instant overview, above-the-fold on desktop, acting as the central router.
- **Layout:** Strictly centered column (approx. 600-700px wide).
- **Content (Top to Bottom):**
  1.  **Photo:** A professional but approachable headshot.
  2.  **Intro Text:** 1-2 short paragraphs in IBM Plex Sans. Contains inline hyperlinks to other sections (e.g., "building [assistive technology](/projects)", "exploring [philosophy](/misc)", "writing [my thoughts](/blog)").
  3.  **Resume Link:** On its own line immediately below the intro, slightly set apart. E.g., `[ View Resume ↗ ]` hyperlinked.
  4.  _(Below the fold - acceptable scroll)_
  5.  **Contact Strip:** Spaced out significantly from the intro text. A single line of links separated by wide whitespace or bullet points: `GitHub  •  LinkedIn  •  X  •  me@example.com`.
- **Mobile:** Centered layout remains, but vertical scrolling is expected and acceptable to view all content.

### B. Projects Page (The Build Log)

- **Goal:** Scannable list of highlighted technical work for recruiters.
- **Layout:** Vertical list or 2-column grid of "cards."
- **Card Structure:**
  - Thumbnail image (left or top).
  - Title (IBM Plex Sans, bold).
  - Short description (1-2 sentences).
  - Tags (Minimal text or thin-bordered pills, e.g., `Python`, `Accessibility`, `AI`).
- **Styling:** No heavy drop-shadows. Cards are separated by subtle thin lines (`#E2E2DD`) or have a 1px border. Hover state: subtle background tint or slight border color change.
- **Sorting:** Reverse chronological (most recent first).
- **Click Action:** Navigates to the shared "Entry" layout for the full project writeup.

### C. Blog Page (The Writing Index)

- **Goal:** Clean, typographic list of writings.
- **Layout:** Single-column vertical list. No thumbnails.
- **List Item Structure:**
  - Date (e.g., `Oct 24, 2023`) in small, gray IBM Plex Sans.
  - Title (Larger, bold IBM Plex Sans).
  - Short description/excerpt.
  - Tags.
- **Styling:** Separated by generous whitespace and thin horizontal rules.
- **Sorting:** Reverse chronological.
- **Click Action:** Navigates to the shared "Entry" layout.

### D. Misc Page (The Personal Appendix)

- **Goal:** Show the holistic, non-coding side of the developer.
- **Layout:** Distinct sub-sections, separated by large headings.
- **Content Sub-sections:**
  1.  **Random Thoughts:** A list identical in structure to the Blog Page, but containing non-technical/philosophical writeups. Links to the shared "Entry" layout.
  2.  **World Map:** A line-drawn (SVG), monochromatic world map. Markers (small, subtle circles) on visited places. Hovering/clicking a marker shows a clean popover containing a photo taken there and a short description of the experience. _(Note: Accessibility for this specific element will be handled via a custom graph/map screen-reader package in development)._
  3.  **Now Page (Optional but recommended):** A short bulleted list of current reads, current learnings, and current side quests.
  4.  **Colophon (Optional):** A brief note on how the site was built and the fonts used.

### E. Entry Pages (Shared Layout: Projects, Blogs, Thoughts)

- **Goal:** Immersive, focused reading environment that treats technical writeups and personal thoughts with equal rigor.
- **Typography:** Shifts entirely to `Source Serif Pro`.
- **Layout:** Narrow, centered single column (approx. 680px wide) for optimal line length (measure).
- **Structure:**
  1.  **Header:** Title in large Serif. Date and Tags in small IBM Plex Sans above or below the title to provide metadata contrast.
  2.  **Body:** `Source Serif Pro`. First paragraph features a subtle drop-cap (`::first-letter`).
  3.  **Dividers:** Thin, subtle horizontal rules (`<hr>`) to separate major sections within the text.
  4.  **Cross-Pollination (Footer of Entry):** A "Related" or "See Also" section at the bottom. Links to other Projects, Blogs, or Thoughts that share themes (e.g., a link to a philosophy thought at the bottom of an assistive tech project).

---

## 5. Interaction & UX Details

- **Hyperlinks:** In sans-serif UI, links are underlined or colored with the Accent color. In serif entry text, links should be subtly colored and underlined on hover only, to keep the reading flow clean.
- **Hover States:** Minimal. Cards slightly shift border color. Text links underline. No scaling or complex transforms.
- **Focus States (Accessibility):** Keyboard focus _must_ be highly visible. Use a clear, 2px solid Accent color outline with a slight offset on all interactive elements (links, cards, map markers) when focused via keyboard.
- **Tags:** Clicking a tag should ideally route to a filtered view or a dedicated tag page showing all related Entries across Projects, Blogs, and Misc.

---

## 6. Technical & Accessibility Guidelines

- **HTML:** Use semantic HTML5 (`<nav>`, `<main>`, `<article>`, `<section>`, `<time>`).
- **Drop Caps:** Implement via CSS `p:first-of-type::first-letter { font-size: 3.5em; float: left; line-height: 0.8; margin-right: 0.05em; }`. Do _not_ wrap the first letter in a separate `<span>`, as this can cause screen readers to spell the letter out.
- **Contrast:** Ensure `#222222` on `#FAFAF8` (and vice versa for any inverted elements) passes WCAG AA/AAA standards.
- **Motion:** Do not use animations that trigger vestibular discomfort. If any page transitions are used, keep them to simple, quick fades (e.g., `opacity` transitions under 200ms).
- **Images:** All project thumbnails and photos in the world map popovers must have descriptive `alt` text. If an image is purely decorative, use `alt=""`.
