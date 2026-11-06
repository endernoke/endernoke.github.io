// Shared dot-field generator. The corner canvases (client), dot thumbnails and
// share images (build time) all call `dots()`, so every surface matches.

export type DotOptions = {
	pitch: number;
	r: number;
	from: number;
	to: number;
	flipX?: boolean;
	flipY?: boolean;
};

export const CORNER: DotOptions = { pitch: 8, r: 1.5, from: 0.12, to: 0.92 };
export const THUMB: DotOptions = { pitch: 5, r: 1.1, from: 0, to: 1.05 };
export const OG: DotOptions = {
	pitch: 10,
	r: 1.9,
	from: 0.12,
	to: 0.92,
	flipX: false,
	flipY: false,
};

/** FNV-1a 32-bit hash. */
export const hash = (s: string) => {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
};

/** Seed for the bottom-right field of a page. */
export const altSeed = (seed: string) => (hash(seed) ^ 0x9e3779b9) >>> 0;

const rng = (a: number) => () => {
	a |= 0;
	a = (a + 0x6d2b79f5) | 0;
	let t = Math.imul(a ^ (a >>> 15), 1 | a);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const smooth = (e0: number, e1: number, x: number) => {
	const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

/** Calls `plot(x, y)` for every dot centre of a w×h field. */
export const dots = (
	w: number,
	h: number,
	seed: number,
	o: DotOptions,
	plot: (x: number, y: number) => void,
) => {
	const R = rng(seed);
	const TAU = Math.PI * 2;
	const a = 1 + R() * 1.5,
		b = R() * TAU,
		c = 1 + R() * 1.5,
		d = R() * TAU,
		sx = 0.85 + R() * 0.3;
	const fx = o.flipX ?? R() < 0.5;
	const fy = o.flipY ?? R() < 0.5;
	const p = o.pitch;
	for (let y = p / 2; y < h; y += p) {
		for (let x = p / 2; x < w; x += p) {
			const u = (fx ? w - x : x) / w;
			const v = (fy ? h - y : y) / h;
			const t =
				Math.sqrt(u * u * sx + (v * v) / sx) +
				0.07 * Math.sin(a * u * TAU + b) * Math.cos(c * v * TAU + d);
			if (1 - smooth(o.from, o.to, t) > R()) plot(x, y);
		}
	}
};

/** A single SVG path drawing every dot as a circle. */
export const dotPath = (w: number, h: number, seed: number, o: DotOptions) => {
	const r = o.r;
	let d = '';
	dots(w, h, seed, o, (x, y) => {
		d += `M${+(x - r).toFixed(2)} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
	});
	return d;
};

/** A dot thumbnail as an SVG data URI (--dot-thumb on --surface). */
export const dotThumbUri = (w: number, h: number, seed: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
			`<rect width="100%" height="100%" fill="#EDEDE9"/>` +
			`<path fill="#B4B5B0" d="${dotPath(w, h, hash(seed), THUMB)}"/></svg>`,
	)}`;
