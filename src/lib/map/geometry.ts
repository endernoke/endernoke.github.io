// Pure map geometry, shared by the build (marker positions) and the browser
// (clustering, cluster spreading and card placement). No DOM access here.

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };

/** Equirectangular projection of a coordinate into a width×height frame. */
export const project = (
	latitude: number,
	longitude: number,
	{ width, height }: Size,
): Point => ({
	x: ((longitude + 180) / 360) * width,
	y: ((90 - latitude) / 180) * height,
});

const clamp = (value: number, low: number, high: number) =>
	Math.min(Math.max(value, low), Math.max(low, high));

/**
 * Groups the indices of points that chain together within `distance` of each
 * other (union-find), so A–B and B–C close together put A, B and C in one group.
 */
export const groupNearby = (points: Point[], distance: number) => {
	const parent = points.map((_, index) => index);
	const find = (index: number): number => {
		if (parent[index] !== index) parent[index] = find(parent[index]);
		return parent[index];
	};

	for (let a = 0; a < points.length; a += 1) {
		for (let b = a + 1; b < points.length; b += 1) {
			const near =
				Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y) <=
				distance;
			const rootA = find(a);
			const rootB = find(b);
			if (near && rootA !== rootB) parent[rootB] = rootA;
		}
	}

	const groups = new Map<number, number[]>();
	points.forEach((_, index) => {
		const root = find(index);
		groups.set(root, [...(groups.get(root) ?? []), index]);
	});
	return [...groups.values()];
};

export type SpreadOptions = {
	/** Minimum distance between two spread points. */
	spacing: number;
	/** Minimum distance from the centre (clears the cluster's × button). */
	minRadius: number;
	/** Frame the results are kept inside, `edge` px from its sides. */
	bounds: Size;
	edge?: number;
};

/**
 * Where each point of a cluster goes when the cluster expands. Points fan out
 * from `centre` in the direction of their real position (Beijing goes north of
 * Nanjing, Hong Kong south-east of Shenzhen): offsets from the centre are
 * magnified until the closest pair is `spacing` apart (within a cap), then
 * overlapping pairs are pushed apart along the line between them, which keeps
 * their relative direction, and anything inside `minRadius` is pushed straight
 * out. Coincident points fall back to even angles, starting due north.
 */
export const spreadAround = (
	points: Point[],
	centre: Point,
	{ spacing, minRadius, bounds, edge = 10 }: SpreadOptions,
): Point[] => {
	const count = points.length;
	const maxRadius =
		1.6 * Math.max(minRadius, (count * spacing) / (2 * Math.PI));
	const unit = (x: number, y: number, index: number): Point => {
		const length = Math.hypot(x, y);
		if (length > 0.001) return { x: x / length, y: y / length };
		const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
		return { x: Math.cos(angle), y: Math.sin(angle) };
	};

	const offsets = points.map(({ x, y }) => ({
		x: x - centre.x,
		y: y - centre.y,
	}));
	const farthest = Math.max(...offsets.map(({ x, y }) => Math.hypot(x, y)));
	let closest = Infinity;
	offsets.forEach((a, i) =>
		offsets.slice(i + 1).forEach((b) => {
			closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y));
		}),
	);
	let scale = closest > 0.001 ? spacing / closest : Infinity;
	scale =
		farthest > 0.001
			? Math.max(Math.min(scale, maxRadius / farthest), minRadius / farthest)
			: 0;
	const spread = offsets.map(({ x, y }) => ({ x: x * scale, y: y * scale }));

	for (let pass = 0; pass < 80; pass += 1) {
		let moved = false;
		for (let i = 0; i < count; i += 1) {
			for (let j = i + 1; j < count; j += 1) {
				const a = spread[i];
				const b = spread[j];
				const gap = Math.hypot(b.x - a.x, b.y - a.y);
				if (gap >= spacing - 0.01) continue;
				const away =
					gap > 0.001
						? { x: (b.x - a.x) / gap, y: (b.y - a.y) / gap }
						: unit(offsets[j].x - offsets[i].x, offsets[j].y - offsets[i].y, j);
				const push = (spacing - gap) / 2;
				a.x -= away.x * push;
				a.y -= away.y * push;
				b.x += away.x * push;
				b.y += away.y * push;
				moved = true;
			}
		}
		spread.forEach((point, index) => {
			const radius = Math.hypot(point.x, point.y);
			if (radius >= minRadius - 0.01) return;
			const out =
				radius > 0.001
					? { x: point.x / radius, y: point.y / radius }
					: unit(offsets[index].x, offsets[index].y, index);
			point.x = out.x * minRadius;
			point.y = out.y * minRadius;
			moved = true;
		});
		if (!moved) break;
	}

	return spread.map(({ x, y }) => ({
		x: clamp(centre.x + x, edge, bounds.width - edge),
		y: clamp(centre.y + y, edge, bounds.height - edge),
	}));
};

/**
 * Top-left corner for a card of `card` size next to a marker at `marker`,
 * inside a frame of `frame` size (`margin` px from its sides). Tries above the
 * marker, then below, right and left (cards with long notes can be taller than
 * the space above or below), and otherwise takes whichever spills out least.
 * Above and below slide sideways near the frame's edges; left and right slide
 * up or down.
 */
export const placeBeside = (
	marker: Point,
	card: Size,
	frame: Size,
	margin = 8,
): Point => {
	const { width: w, height: h } = card;
	const centredX = clamp(marker.x - w / 2, margin, frame.width - margin - w);
	const centredY = clamp(marker.y - h / 2, margin, frame.height - margin - h);
	const candidates: Point[] = [
		{ x: centredX, y: marker.y - 22 - h },
		{ x: centredX, y: marker.y + 22 },
		{ x: marker.x + 20, y: centredY },
		{ x: marker.x - 20 - w, y: centredY },
	];
	const spill = ({ x, y }: Point) =>
		Math.max(0, margin - x) +
		Math.max(0, x + w - (frame.width - margin)) +
		Math.max(0, margin - y) +
		Math.max(0, y + h - (frame.height - margin));

	let best = candidates[0];
	let bestSpill = Infinity;
	for (const candidate of candidates) {
		const amount = spill(candidate);
		if (amount < bestSpill - 0.5) {
			best = candidate;
			bestSpill = amount;
		}
	}
	return best;
};
