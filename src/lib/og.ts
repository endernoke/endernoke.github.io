// Build-time share images: the dot field from the top-left, the page title in
// Instrument Sans and "James Zheng" in Plex Mono, drawn as SVG paths (so no
// system fonts are needed) and converted to PNG with sharp.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { create, type Font } from 'fontkitten';
import sharp from 'sharp';
import { dotPath, hash, OG } from './dots';

const require = createRequire(join(process.cwd(), 'package.json'));
const load = (spec: string) =>
	create(readFileSync(require.resolve(spec))) as Font;

let fonts: { sans: Font; mono: Font } | undefined;
const getFonts = () =>
	(fonts ??= {
		sans: load(
			'@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2',
		),
		mono: load(
			'@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
		),
	});

const W = 1200;
const H = 630;
const X = 80;

const advance = (font: Font, text: string, size: number) =>
	font
		.glyphsForString(text)
		.reduce((sum, g) => sum + (g.advanceWidth * size) / font.unitsPerEm, 0);

const textPath = (
	font: Font,
	text: string,
	size: number,
	x: number,
	y: number,
) => {
	const scale = size / font.unitsPerEm;
	let pen = x;
	let d = '';
	for (const glyph of font.glyphsForString(text)) {
		d += glyph.path.scale(scale, -scale).translate(pen, y).toSVG();
		pen += glyph.advanceWidth * scale;
	}
	return d;
};

/** Greedy word wrap to a maximum line width. */
const wrap = (font: Font, text: string, size: number, max: number) => {
	const lines: string[] = [];
	let line = '';
	for (const word of text.split(/\s+/)) {
		const next = line ? `${line} ${word}` : word;
		if (line && advance(font, next, size) > max) {
			lines.push(line);
			line = word;
		} else line = next;
	}
	if (line) lines.push(line);
	return lines;
};

export const renderOgImage = async (title: string, seed: string) => {
	const { sans, mono } = getFonts();
	const size = 56;
	const lineHeight = 66;
	const lines = wrap(sans, title, size, W - X * 2).slice(0, 4);
	const nameBaseline = H - 72;
	const lastBaseline = nameBaseline - 76;
	const titleD = lines
		.map((line, i) =>
			textPath(
				sans,
				line,
				size,
				X,
				lastBaseline - (lines.length - 1 - i) * lineHeight,
			),
		)
		.join('');
	const nameD = textPath(mono, 'James Zheng', 24, X, nameBaseline);

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#F7F7F4"/>
<path fill="#C4C5C0" d="${dotPath(W, H, hash(seed), OG)}"/>
<path fill="#1D1E20" d="${titleD}"/>
<path fill="#5E6165" d="${nameD}"/>
</svg>`;
	return sharp(Buffer.from(svg))
		.png({ compressionLevel: 9, palette: true })
		.toBuffer();
};
