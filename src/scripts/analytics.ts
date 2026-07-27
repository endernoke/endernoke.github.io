type UmamiEventData = Record<string, string | number | boolean>;

type UmamiTracker = {
	track: (eventName: string, data?: UmamiEventData) => unknown;
};

declare global {
	interface Window {
		umami?: UmamiTracker;
	}
}

export const trackEvent = (eventName: string, data?: UmamiEventData) => {
	window.umami?.track(eventName, data);
};
