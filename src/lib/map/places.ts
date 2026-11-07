// Build-time place data for the travels map.
//
// Place definitions live in src/content/places/places.json. Photos live in
// src/assets/travel/<place-id>/; numeric filename prefixes set their order.
// Optional alt text, a note and a link live beside them in photos.json, keyed
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

type PhotoMetadata = Partial<Omit<PlacePhoto, 'image'>>;

export type Place = CollectionEntry<'places'>['data'] & {
	photos: PlacePhoto[];
};

const travelImages = import.meta.glob<ImageMetadata>(
	'../../assets/travel/*/*.{avif,gif,jpeg,jpg,png,svg,webp}',
	{ eager: true, import: 'default' },
);
const travelMetadata = import.meta.glob<Record<string, PhotoMetadata>>(
	'../../assets/travel/*/photos.json',
	{ eager: true, import: 'default' },
);

const filenameFromPath = (path: string) => path.split('/').at(-1) ?? path;

const descriptionFromFilename = (filename: string) =>
	filename
		.replace(/\.[^.]+$/, '')
		.replace(/^\d+[-_ ]*/, '')
		.replace(/[-_]+/g, ' ');

const loadPhotos = ({ id, name }: Place): PlacePhoto[] => {
	const directory = `../../assets/travel/${id}/`;
	const metadata = travelMetadata[`${directory}photos.json`] ?? {};

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

/** Every place with its photos, in places.json order. */
export const getPlaces = async (): Promise<Place[]> =>
	(await getCollection('places')).map(({ data }) => {
		const place = { ...data, photos: [] };
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
