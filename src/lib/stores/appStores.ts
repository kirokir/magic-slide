import { writable, get } from 'svelte/store';
import type { Slide, GlobalSettings } from '$lib/types';
import { parseTextToSlides } from '$lib/utils/parser';

export const defaultGlobals: GlobalSettings = {
	aspectRatio: '1.91:1',
	filters: { brightness: 100, contrast: 100, saturate: 100, blur: 0 },
	appBackgroundColor: '#0f172a',
	appBackgroundImage: null,
	brandingKit: {
		logoUrl: null,
		brandColor: '#4f46e5',
		brandFont: 'Inter',
		showLogoOnAllSlides: true
	}
};

const defaultText = `
h1: Welcome to Magic Slide 2.0
p: Now with Undo/Redo and advanced styling!
---
h1: Get Started Now
cta: Create Amazing Slides
`;

export const globalSettingsStore = writable<GlobalSettings>(defaultGlobals);

export const slideStore = writable<Slide[]>(
	parseTextToSlides(defaultText, defaultGlobals.brandingKit.brandColor)
);

interface Selection {
	selectedSlideId: string | null;
	selectedElementId: string | null;
}
export const selectionStore = writable<Selection>({
	selectedSlideId: get(slideStore)[0]?.id || null,
	selectedElementId: null
});

interface AppUI {
	isExporting: boolean;
}
export const appUIStore = writable<AppUI>({
	isExporting: false
});

export function deselectElement() {
	selectionStore.update(s => ({ ...s, selectedElementId: null }));
}