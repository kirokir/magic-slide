// /src/lib/stores/appStores.ts (CORRECTED)

import { writable, get } from 'svelte/store';
import type { Slide, GlobalSettings } from '$lib/types';
import { parseTextToSlides } from '$lib/utils/parser';

// === Initial Default State ===
const defaultGlobals: GlobalSettings = {
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
h1: How it Works
*: Use the controls on the left and right.
*: Every action can be undone.
*: Export your creation when you're done.

---
h1: Get Started Now
cta: Create Amazing Slides
`;

// === Global Settings Store ===
export const globalSettingsStore = writable<GlobalSettings>(defaultGlobals);

// === Slide Data Store ===
export const slideStore = writable<Slide[]>(
	parseTextToSlides(defaultText, defaultGlobals.brandingKit.brandColor)
);

// === Selection Store ===
interface Selection {
	selectedSlideId: string | null;
	selectedElementId: string | null;
}
export const selectionStore = writable<Selection>({
	selectedSlideId: get(slideStore)[0]?.id || null, // Select the first slide by default
	selectedElementId: null
});

// === UI State Store ===
interface AppUI {
	isExporting: boolean;
}
// THIS IS THE CORRECTED LINE
export const appUIStore = writable<AppUI>({
	isExporting: false
});

// Helper to deselect all elements but keep slide selection
export function deselectElement() {
	selectionStore.update(s => ({ ...s, selectedElementId: null }));
}