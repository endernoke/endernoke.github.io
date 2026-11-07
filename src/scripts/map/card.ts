// Positions an open place card beside its marker, inside the map frame.
import { placeBeside } from '../../lib/map/geometry';

/**
 * Sets the card's --card-x / --card-y offsets from its marker. The bottom
 * sheet on narrow screens (position: fixed) is left alone.
 */
export const positionCard = (card: HTMLElement, frame: HTMLElement) => {
	const place = card.closest<HTMLElement>('.place');
	if (!place) return;
	card.style.setProperty('--card-x', '0px');
	card.style.setProperty('--card-y', '0px');
	if (getComputedStyle(card).position === 'fixed') return;

	const bounds = frame.getBoundingClientRect();
	const origin = place.getBoundingClientRect(); // the marker's centre
	const marker = { x: origin.left - bounds.left, y: origin.top - bounds.top };
	const at = placeBeside(
		marker,
		{ width: card.offsetWidth, height: card.offsetHeight },
		{ width: bounds.width, height: bounds.height },
	);
	card.style.setProperty('--card-x', `${Math.round(at.x - marker.x)}px`);
	card.style.setProperty('--card-y', `${Math.round(at.y - marker.y)}px`);
};
