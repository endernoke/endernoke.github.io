import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOgImage } from '../../lib/og';
import { entryUrl, getPosts, getProjects, POST_FILTERS } from '../../lib/site';

type Props = { title: string; seed: string };

export const getStaticPaths = (async () => {
	const pages: { path: string; title: string; seed: string }[] = [
		{ path: 'index', title: 'Hello, I’m James.', seed: 'home' },
		{ path: 'projects', title: 'Projects', seed: 'projects' },
		{ path: 'writing', title: 'Writing', seed: 'writing' },
		{ path: 'travels', title: 'Travels', seed: 'travels' },
		...Object.keys(POST_FILTERS).map((slug) => ({
			path: `writing/${slug}`,
			title: 'Writing',
			seed: 'writing',
		})),
	];
	const entries = [...(await getPosts()), ...(await getProjects())];
	for (const entry of entries)
		pages.push({
			path: entryUrl(entry).slice(1),
			title: entry.data.title,
			seed: entry.data.title,
		});
	return pages.map(({ path, title, seed }) => ({
		params: { path },
		props: { title, seed },
	}));
}) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = async ({ props }) =>
	new Response(new Uint8Array(await renderOgImage(props.title, props.seed)), {
		headers: { 'Content-Type': 'image/png' },
	});
