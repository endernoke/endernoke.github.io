// Wires up one travels map: markers open their place card (one at a time),
// the "Jump to" list, clusters, closing on Escape or an outside click,
// image preloading and the analytics events.
import { trackEvent } from '../analytics';
import { positionCard } from './card';
import {
	currentSlide,
	setupCarousel,
	showSlide,
	slideCount,
	warmSlide,
} from './carousel';
import { createClusters } from './clusters';

export const initWorldMap = (root: HTMLElement) => {
	const frame = root.querySelector<HTMLElement>('[data-map-frame]');
	const buttonLayer = root.querySelector<HTMLElement>('[data-cluster-buttons]');
	const lineLayer = root.querySelector<SVGSVGElement>('[data-cluster-lines]');
	if (!frame || !buttonLayer || !lineLayer) return;

	const markers = [...root.querySelectorAll<HTMLButtonElement>('.marker')];
	const cards = [...root.querySelectorAll<HTMLElement>('[data-place-card]')];
	const picker = root.querySelector<HTMLSelectElement>('[data-place-picker]');

	const cardOf = (marker: HTMLButtonElement) =>
		document.getElementById(marker.getAttribute('aria-controls') ?? '');
	const markerOf = (card: HTMLElement) =>
		card.closest('.place')?.querySelector<HTMLButtonElement>('.marker');

	// Analytics: each event once per place per page view.
	const opened = new Set<string>();
	const browsed = new Set<string>();
	const trackOnce = (
		seen: Set<string>,
		event: string,
		place: string | undefined,
	) => {
		if (!place || seen.has(place)) return;
		seen.add(place);
		trackEvent(event, { place });
	};

	/** Closes every card except `except`'s, resetting each to its first photo. */
	const closeCards = (except?: HTMLButtonElement) => {
		markers.forEach((marker) => {
			if (marker === except) return;
			marker.setAttribute('aria-expanded', 'false');
			const card = cardOf(marker);
			if (card) {
				card.hidden = true;
				showSlide(card, 0, false);
			}
		});
		if (!except && picker) picker.value = '';
	};

	const clusters = createClusters({
		frame,
		buttonLayer,
		lineLayer,
		markers,
		closeCards: () => closeCards(),
	});

	const closeEverything = () => {
		closeCards();
		clusters.collapseAll();
	};

	const openMarker = (marker: HTMLButtonElement, focusCard = false) => {
		const cluster = clusters.clusterOf(marker);
		if (cluster) clusters.expand(cluster);
		else clusters.collapseAll();
		closeCards(marker);
		marker.setAttribute('aria-expanded', 'true');

		const card = cardOf(marker);
		if (card) {
			showSlide(card, currentSlide(card));
			card.hidden = false;
			positionCard(card, frame);
			// A spread-out marker is still sliding into place; place again once it lands.
			if (cluster)
				window.setTimeout(() => {
					if (!card.hidden) positionCard(card, frame);
				}, 200);
			if (focusCard) requestAnimationFrame(() => card.focus());
		}
		if (picker) picker.value = marker.getAttribute('aria-controls') ?? '';
		trackOnce(opened, 'map-place-open', marker.dataset.placeName);
	};

	cards.forEach((card) => {
		setupCarousel(card, () => {
			positionCard(card, frame);
			if (slideCount(card) > 1)
				trackOnce(
					browsed,
					'map-gallery-browse',
					markerOf(card)?.dataset.placeName,
				);
		});
		card.querySelector('[data-place-close]')?.addEventListener('click', () => {
			const marker = markerOf(card);
			closeCards();
			marker?.focus();
		});
	});

	markers.forEach((marker) => {
		const warm = (priority: 'high' | 'low') => {
			const card = cardOf(marker);
			if (card) warmSlide(card, currentSlide(card), priority);
		};
		marker.addEventListener('pointerenter', () => warm('low'));
		marker.addEventListener('focus', () => warm('low'));
		marker.addEventListener('pointerdown', () => warm('high'));
		marker.addEventListener('click', () => {
			if (marker.getAttribute('aria-expanded') === 'true') closeCards();
			else openMarker(marker);
		});
	});

	picker?.addEventListener('change', () => {
		const marker = markers.find(
			(item) => item.getAttribute('aria-controls') === picker.value,
		);
		if (marker) openMarker(marker, true);
		else closeCards();
	});

	document.addEventListener('click', (event) => {
		if (!(event.target instanceof Element)) return;
		if (!event.target.closest('.place, .place-picker, .cluster-button'))
			closeEverything();
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') closeEverything();
	});

	// Fetch every first photo once the map is near the viewport, unless the
	// visitor asked to save data.
	const connection = (
		navigator as Navigator & { connection?: { saveData?: boolean } }
	).connection;
	if (!connection?.saveData) {
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				window.setTimeout(() => {
					cards.forEach((card) => warmSlide(card, 0, 'low'));
				}, 250);
			},
			{ rootMargin: '160px' },
		);
		observer.observe(frame);
	}

	// Marker positions are in pixels, so clusters follow the frame's size.
	let resizeFrame = 0;
	new ResizeObserver(() => {
		cancelAnimationFrame(resizeFrame);
		resizeFrame = requestAnimationFrame(clusters.rebuild);
	}).observe(frame);
};
