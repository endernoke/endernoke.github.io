// Photo carousel inside a place card: one slide and its note visible at a
// time, the "1 / 3" count kept in step, and nearby slides fetched early.

const slidesOf = (card: HTMLElement) =>
	card.querySelectorAll<HTMLElement>('.slide');

const wrap = (index: number, count: number) =>
	((index % count) + count) % count;

export const slideCount = (card: HTMLElement) => slidesOf(card).length;

export const currentSlide = (card: HTMLElement) =>
	Number(card.dataset.index ?? 0);

/** Starts loading one slide's image now instead of when it is shown. */
export const warmSlide = (
	card: HTMLElement,
	index: number,
	priority: 'high' | 'low',
) => {
	const slides = slidesOf(card);
	if (slides.length === 0) return;
	const image = slides[wrap(index, slides.length)].querySelector('img');
	if (!image) return;
	image.fetchPriority = priority;
	image.loading = 'eager';
};

/** Shows slide `index` (wrapping around) and its note. */
export const showSlide = (card: HTMLElement, index: number, preload = true) => {
	const slides = slidesOf(card);
	if (slides.length === 0) return;

	const active = wrap(index, slides.length);
	if (preload) {
		warmSlide(card, active, 'high');
		if (slides.length > 1) {
			warmSlide(card, active - 1, 'low');
			warmSlide(card, active + 1, 'low');
		}
	}
	slides.forEach((slide, i) => {
		slide.hidden = i !== active;
	});
	card.querySelectorAll<HTMLElement>('[data-slide-note]').forEach((note) => {
		note.hidden = Number(note.dataset.slideNote) !== active;
	});
	card.dataset.index = String(active);

	const count = card.querySelector<HTMLElement>('.slide-count');
	if (count) count.textContent = `${active + 1} / ${slides.length}`;
};

/**
 * Wires the previous/next buttons and the Left/Right arrow keys. `onBrowse`
 * runs after every change (the card's height can change with its note).
 */
export const setupCarousel = (card: HTMLElement, onBrowse: () => void) => {
	const step = (by: number) => {
		showSlide(card, currentSlide(card) + by);
		onBrowse();
	};

	card
		.querySelector('[data-carousel-previous]')
		?.addEventListener('click', () => step(-1));
	card
		.querySelector('[data-carousel-next]')
		?.addEventListener('click', () => step(1));
	card.addEventListener('keydown', (event) => {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		step(event.key === 'ArrowLeft' ? -1 : 1);
	});
};
