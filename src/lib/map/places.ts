// Build-time place data for the travels map.
//
// Each src/assets/travel/<place-id>/place.json defines the place; its directory
// name is its ID. Photos live beside it; numeric filename prefixes set order.
// Optional alt text, a note and a link live under `photos` in place.json, keyed
// by the full image filename. Notes are a sentence or a few; `[text](href)` in
// a note becomes an inline link, and `link` ({ label, href }) adds a link line
// under the note.
import { getCollection, type CollectionEntry } from 'astro:content';
import { project } from './geometry';

export type Link = { label: string; href: string };

export type PlacePhoto = {
	image: ImageMetadata;
	alt: string;
	note?: string;
	link?: Link;
};

type PlaceData = CollectionEntry<'places'>['data'];

export type Place = Omit<PlaceData, 'photos'> & {
	id: string;
	photos: PlacePhoto[];
};

const travelImages = import.meta.glob<ImageMetadata>(
	'../../assets/travel/*/*.{avif,gif,jpeg,jpg,png,svg,webp}',
	{ eager: true, import: 'default' },
);

const filenameFromPath = (path: string) => path.split('/').at(-1) ?? path;

const descriptionFromFilename = (filename: string) =>
	filename
		.replace(/\.[^.]+$/, '')
		.replace(/^\d+[-_ ]*/, '')
		.replace(/[-_]+/g, ' ');

const loadPhotos = ({
	id,
	name,
	photos: metadata,
}: PlaceData & { id: string }): PlacePhoto[] => {
	const directory = `../../assets/travel/${id}/`;

	return Object.entries(travelImages)
		.filter(([path]) => path.startsWith(directory))
		.sort(([a], [b]) =>
			filenameFromPath(a).localeCompare(filenameFromPath(b), undefined, {
				numeric: true,
				sensitivity: 'base',
			}),
		)
		.map(([path, image]) => {
			const filename = filenameFromPath(path);
			const { alt, note, link } = metadata[filename] ?? {};
			return {
				image,
				alt: alt ?? `${name}: ${descriptionFromFilename(filename)}`,
				note,
				link,
			};
		});
};

/** Every place with its directory ID and photos. */
export const getPlaces = async (): Promise<Place[]> =>
	(await getCollection('places')).map(({ id, data }) => {
		const place = { ...data, id };
		return { ...place, photos: loadPhotos(place) };
	});

/** Inline style placing a marker by percentages of the map frame. */
export const markerStyle = ({ latitude, longitude }: Place) => {
	const { x, y } = project(latitude, longitude, { width: 100, height: 100 });
	return `--marker-x: ${x}%; --marker-y: ${y}%;`;
};

export type NotePart = { text: string; href?: string };

/** Splits a note into plain text and `[text](href)` link parts. */
export const noteParts = (note: string): NotePart[] =>
	note
		.split(/(\[[^\]]+\]\([^)\s]+\))/)
		.filter(Boolean)
		.map((part) => {
			const match = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
			return match ? { text: match[1], href: match[2] } : { text: part };
		});

export const isExternal = (href: string) => /^https?:\/\//.test(href);
