import { getCollection, type CollectionEntry } from 'astro:content';

export type Entry = CollectionEntry<'entries'>;
export type PostType = 'essay' | 'story' | 'note';

export const SITE = {
	name: 'James Zheng',
	url: 'https://endernoke.me',
	description:
		'James Zheng builds accessibility tools and open-source software, and writes about technology, people and places.',
	resume:
		'https://drive.google.com/file/d/1q3lU2DA2R_UTCr6s_ZAcfMhFMjj5oPWX/view?usp=sharing',
	email: 'zhengzijames@gmail.com',
	github: 'https://github.com/endernoke',
	linkedin: 'https://www.linkedin.com/in/james-zheng-zi',
	x: 'https://x.com/endernoke',
};

/** Slugs taken by the /writing filter pages. */
export const RESERVED_SLUGS = ['essays', 'stories', 'notes'];

/** Filter pages under /writing, keyed by their slug. */
export const POST_FILTERS = {
	essays: 'essay',
	stories: 'story',
	notes: 'note',
} as const satisfies Record<string, PostType>;

// Drafts render in `astro dev` so layouts can be checked, never in a build.
const visible = (entry: Entry) => import.meta.env.DEV || !entry.data.draft;
const newestFirst = (a: Entry, b: Entry) =>
	b.data.date.valueOf() - a.data.date.valueOf();

const assertSlug = (entry: Entry) => {
	if (RESERVED_SLUGS.includes(entry.id))
		throw new Error(`Entry slug "${entry.id}" is reserved for /writing.`);
};

export const getPosts = async () => {
	const posts = await getCollection(
		'entries',
		(e) => e.data.kind === 'post' && visible(e),
	);
	posts.forEach(assertSlug);
	return posts.sort(newestFirst);
};

export const getProjects = async () => {
	const projects = await getCollection(
		'entries',
		(e) => e.data.kind === 'project' && visible(e),
	);
	projects.forEach(assertSlug);
	return projects.sort(newestFirst);
};

export const entryUrl = (entry: Entry) =>
	`/${entry.data.kind === 'project' ? 'projects' : 'writing'}/${entry.id}`;

export const postType = (entry: Entry): PostType => entry.data.type ?? 'essay';

/** "stack · reach · stars", unless the entry sets its own facts line. */
export const factsLine = (p: Entry) =>
	p.data.facts ??
	[
		...p.data.stack,
		p.data.reach,
		p.data.stars ? `${p.data.stars} stars` : undefined,
	]
		.filter(Boolean)
		.join(' · ');

/** Reading time at 230 words per minute, ignoring code, tags and imports. */
export const readingMinutes = (body = '') => {
	const text = body
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/^(import|export) .*$/gm, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/[#*_`>[\]()!-]/g, ' ');
	const words = text.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 230));
};

const fmt = (locale: string, opts: Intl.DateTimeFormatOptions) =>
	new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts });

const monthYear = fmt('en-US', { month: 'short', year: 'numeric' });
const monthDay = fmt('en-US', { month: 'short', day: '2-digit' });
const longDate = fmt('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
});

/** "Nov 2026" */
export const formatMonthYear = (d: Date) => monthYear.format(d);
/** "Nov 06" */
export const formatMonthDay = (d: Date) => {
	const parts = monthDay.formatToParts(d);
	const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
	return `${get('month')} ${get('day')}`;
};
/** "6 November 2026" */
export const formatLong = (d: Date) => longDate.format(d);
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Path of the generated share image for a page path. */
export const ogImagePath = (pathname: string) => {
	const clean = pathname.replace(/^\/|\/$/g, '');
	return `/og/${clean || 'index'}.png`;
};
