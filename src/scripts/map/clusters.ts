// Marker clustering. Markers closer than a hit target to each other collapse
// into a count button; expanding it spreads them out around the button (in
// their real geographic directions) with dashed leader lines back to where
// they belong, and dims everything else until it collapses.
import { groupNearby, project, spreadAround } from '../../lib/map/geometry';

type Member = {
	marker: HTMLButtonElement;
	place: HTMLElement;
	x: number;
	y: number;
};

type Cluster = {
	members: Member[];
	button: HTMLButtonElement;
	lines: SVGLineElement[];
	names: string;
	x: number;
	y: number;
	expanded: boolean;
};

type Options = {
	frame: HTMLElement;
	buttonLayer: HTMLElement;
	lineLayer: SVGSVGElement;
	markers: HTMLButtonElement[];
	/** Closes any open card. */
	closeCards: () => void;
};

const coarsePointer = () => window.matchMedia('(pointer: coarse)').matches;

const setReachable = (marker: HTMLButtonElement, reachable: boolean) => {
	if (reachable) marker.removeAttribute('aria-hidden');
	else marker.setAttribute('aria-hidden', 'true');
	marker.tabIndex = reachable ? 0 : -1;
};

const resetOffset = (place: HTMLElement) => {
	place.classList.remove('is-spiderfied');
	place.style.removeProperty('--spider-offset-x');
	place.style.removeProperty('--spider-offset-y');
};

export const createClusters = ({
	frame,
	buttonLayer,
	lineLayer,
	markers,
	closeCards,
}: Options) => {
	let clusters: Cluster[] = [];
	const byMarker = new Map<HTMLButtonElement, Cluster>();

	// With a cluster expanded, every other marker and cluster is disabled.
	const isolate = (active?: Cluster) => {
		const inside = new Set(active?.members.map(({ marker }) => marker));
		frame.classList.toggle('has-expanded-cluster', Boolean(active));
		markers.forEach((marker) => {
			marker.disabled = Boolean(active && !inside.has(marker));
		});
		clusters.forEach((cluster) => {
			cluster.button.disabled = Boolean(active && cluster !== active);
		});
	};

	const label = (cluster: Cluster) => {
		const { button, expanded, members, names } = cluster;
		button.textContent = expanded ? '×' : String(members.length);
		button.setAttribute('aria-expanded', String(expanded));
		button.setAttribute(
			'aria-label',
			expanded
				? `Collapse nearby places: ${names}.`
				: `${members.length} nearby places: ${names}. Expand markers.`,
		);
	};

	const collapse = (cluster: Cluster) => {
		cluster.expanded = false;
		label(cluster);
		cluster.members.forEach(({ marker, place }) => {
			resetOffset(place);
			setReachable(marker, false);
		});
		cluster.lines.forEach((line) => line.remove());
		cluster.lines = [];
		if (!clusters.some(({ expanded }) => expanded)) isolate();
	};

	const collapseAll = (except?: Cluster) => {
		clusters.forEach((cluster) => {
			if (cluster !== except && cluster.expanded) collapse(cluster);
		});
	};

	const expand = (cluster: Cluster) => {
		if (cluster.expanded) return;

		closeCards();
		collapseAll(cluster);
		cluster.expanded = true;
		isolate(cluster);
		label(cluster);

		const coarse = coarsePointer();
		const targets = spreadAround(cluster.members, cluster, {
			spacing: coarse ? 36 : 30,
			minRadius: coarse ? 36 : 30,
			bounds: { width: frame.clientWidth, height: frame.clientHeight },
		});
		cluster.members.forEach(({ marker, place, x, y }, index) => {
			const target = targets[index];
			place.style.setProperty('--spider-offset-x', `${target.x - x}px`);
			place.style.setProperty('--spider-offset-y', `${target.y - y}px`);
			place.classList.add('is-spiderfied');
			setReachable(marker, true);

			const line = document.createElementNS(
				'http://www.w3.org/2000/svg',
				'line',
			);
			line.setAttribute('x1', String(x));
			line.setAttribute('y1', String(y));
			line.setAttribute('x2', String(target.x));
			line.setAttribute('y2', String(target.y));
			lineLayer.append(line);
			cluster.lines.push(line);
		});
	};

	const createCluster = (members: Member[]): Cluster => {
		const x = members.reduce((sum, m) => sum + m.x, 0) / members.length;
		const y = members.reduce((sum, m) => sum + m.y, 0) / members.length;
		const button = document.createElement('button');
		button.className = 'cluster-button';
		button.type = 'button';
		button.style.left = `${x}px`;
		button.style.top = `${y}px`;
		button.setAttribute(
			'aria-controls',
			members
				.map(({ marker }) => marker.getAttribute('aria-controls'))
				.filter(Boolean)
				.join(' '),
		);
		buttonLayer.append(button);

		const cluster: Cluster = {
			members,
			button,
			lines: [],
			names: members
				.map(({ marker }) => marker.dataset.placeName)
				.filter(Boolean)
				.join(', '),
			x,
			y,
			expanded: false,
		};
		label(cluster);
		members.forEach(({ marker, place }) => {
			byMarker.set(marker, cluster);
			place.classList.add('is-clustered');
			setReachable(marker, false);
		});

		button.addEventListener('click', () => {
			if (!cluster.expanded) return expand(cluster);
			closeCards();
			collapse(cluster);
		});
		return cluster;
	};

	/** Re-clusters for the frame's current size. Closes everything. */
	const rebuild = () => {
		closeCards();
		isolate();
		buttonLayer.replaceChildren();
		lineLayer.replaceChildren();
		clusters = [];
		byMarker.clear();

		const size = { width: frame.clientWidth, height: frame.clientHeight };
		lineLayer.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);

		const points = markers.flatMap<Member>((marker) => {
			const place = marker.closest<HTMLElement>('.place');
			if (!place) return [];
			place.classList.remove('is-clustered');
			resetOffset(place);
			setReachable(marker, true);
			const { latitude, longitude } = place.dataset;
			const { x, y } = project(Number(latitude), Number(longitude), size);
			return [{ marker, place, x, y }];
		});

		clusters = groupNearby(points, coarsePointer() ? 30 : 24)
			.filter((group) => group.length > 1)
			.map((group) => createCluster(group.map((index) => points[index])));
	};

	return {
		rebuild,
		expand,
		collapseAll,
		clusterOf: (marker: HTMLButtonElement) => byMarker.get(marker),
	};
};
