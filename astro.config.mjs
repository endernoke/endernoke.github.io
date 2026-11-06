// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://endernoke.me',
	trailingSlash: 'ignore',
	integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/og/') })],
	markdown: {
		shikiConfig: { theme: 'github-light' },
	},
	redirects: {
		'/blog': '/writing',
		'/blog/[slug]': '/writing/[slug]',
		'/misc': '/travels',
	},
});
