import { writable, get } from 'svelte/store';
import type { Slide, GlobalSettings } from '$lib/types';
import { parseTextToSlides } from '$lib/utils/parser';

// Default initial data for a quick start
const defaultText = `
h1: Welcome to Magic Slide
p: Generate presentations instantly from text.

---
h1: How it Works
*: Use 'h1:' for titles.
*: 'p:' for paragraphs.
*: 'cta:' for call-to-action buttons.
*: '---' to separate slides.

---
h1: Get Started Now
cta: Generate Slides
`;

// === Global Settings Store ===
export const globalSettingsStore = writable<GlobalSettings>({
	themeColor: '#4f46e5',
	fontFamily: 'Inter',
	logoUrl: null
});

// === Slide Data Store ===
export const slideStore = writable<Slide[]>(
	parseTextToSlides(defaultText, get(globalSettingsStore).themeColor)
);

// === Selection Store ===
interface Selection {
	selectedSlideId: string | null;
	selectedElementId: string | null;
}
export const selectionStore = writable<Selection>({
	selectedSlideId: null,
	selectedElementId: null
});

// Helper to deselect all
export function deselectAll() {
	selectionStore.set({ selectedSlideId: null, selectedElementId: null });
}