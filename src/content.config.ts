import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const entries = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			date: z.coerce.date(),
			kind: z.enum(['project', 'blog', 'thought']),
			tags: z.array(z.string()),
			featured: z.boolean().default(false),
			draft: z.boolean().default(false),
			image: image().optional(),
			imageAlt: z.string().optional(),
			related: z.array(z.string()).default([]),
		}),
});

const pages = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
	}),
});

export const collections = { entries, pages };
