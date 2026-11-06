import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { render } from 'astro:content';
import mdxRenderer from '@astrojs/mdx/server.js';
import EndMark from '../components/EndMark.astro';
import Figure from '../components/Figure.astro';
import Sidenote from '../components/Sidenote.astro';
import { entryUrl, getPosts, SITE } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
	const container = await AstroContainer.create();
	container.addServerRenderer({ name: 'astro:jsx', renderer: mdxRenderer });
	const posts = await getPosts();
	const base = site ?? SITE.url;

	const items = await Promise.all(
		posts.map(async (post) => {
			const { Content } = await render(post);
			const html = await container.renderToString(Content, {
				props: { components: { Sidenote, Figure, EndMark } },
			});
			return {
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.date,
				link: entryUrl(post),
				// Absolute URLs so images and links work in feed readers.
				content: html
					.replace(/<style[\s\S]*?<\/style>/g, '')
					.replace(/(href|src)="\/(?!\/)/g, `$1="${new URL('/', base).href}`),
			};
		}),
	);

	return rss({
		title: 'James Zheng — Writing',
		description: 'Thoughts on technology and creation.',
		site: base,
		items,
		customData: '<language>en</language>',
	});
};
