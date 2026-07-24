const dateFormatter = new Intl.DateTimeFormat('en-US', {
	month: 'long',
	year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
	day: '2-digit',
	month: 'short',
	year: 'numeric',
});

export const formatDate = (date: Date) => dateFormatter.format(date);
export const formatShortDate = (date: Date) => shortDateFormatter.format(date);
