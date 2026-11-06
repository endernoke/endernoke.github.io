import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const link = z.object({ label: z.string(), href: z.string().url() });

const entries = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/entries' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(), // dek / one-line description
			date: z.coerce.date(),
			kind: z.enum(['project', 'post']),
			featured: z.boolean().default(false), // shown on Home
			minor: z.boolean().default(false), // projects: "Smaller things"
			draft: z.boolean().default(false),
			image: image().optional(),
			imageAlt: z.string().optional(),
			imageCaption: z.string().optional(), // shown under the hero image
			related: z.array(z.string()).default([]),
			tags: z.array(z.string()).default([]), // kept for data; not shown
			// projects only
			blurb: z.string().optional(), // shorter Home description; falls back to description
			lede: z.string().optional(),
			stack: z.array(z.string()).default([]),
			with: z.string().optional(), // collaborators
			reach: z.string().optional(), // e.g. "~50,000 people in 70+ countries"
			repo: z.string().optional(), // owner/name
			stars: z.string().optional(), // e.g. "2.2k"
			links: z.array(link).default([]),
			elsewhere: z.array(link).default([]),
			facts: z.string().optional(), // override for the /projects facts line
		}),
});

const pages = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			portrait: image().optional(),
			portraitAlt: z.string().optional(),
			portraitCaption: z.string().optional(),
		}),
});

const places = defineCollection({
	loader: file('src/content/places/places.json'),
	schema: z.object({
		id: z.string(), // matches src/assets/travel/<id>/
		name: z.string(),
		latitude: z.number().min(-90).max(90),
		longitude: z.number().min(-180).max(180),
		note: z.string().optional(),
	}),
});

export const collections = { entries, pages, places };
