// /src/lib/utils/presets.ts

import type { Slide, Element } from '$lib/types';

export const slidePresetOptions = [
	{ value: 'titleAndContent', label: 'Title & Content' },
	{ value: 'quote', label: 'Quote' },
	{ value: 'twoColumn', label: 'Two Column Text' },
	{ value: 'blank', label: 'Blank Canvas' }
];

export function getSlidePreset(type: string): Omit<Slide, 'id'> {
	switch (type) {
		case 'titleAndContent':
			return {
				elements: [
					getElementPreset('heading', 'Title Text'),
					getElementPreset('paragraph', 'Supporting content text goes here.')
				],
				filters: null,
				backgroundImage: null,
				styles: { backgroundColor: '#0f172a' }
			};
		case 'quote':
			return {
				elements: [
					{ ...getElementPreset('paragraph', '"A memorable quote."'), styles: { ...getElementPreset('paragraph').styles, fontSize: '48px', isItalic: true, textAlign: 'center' } },
					{ ...getElementPreset('paragraph', '- Author'), x: 100, y: 350, width: 880, height: 50, styles: { ...getElementPreset('paragraph').styles, textAlign: 'right' } }
				],
				filters: null,
				backgroundImage: null,
				styles: { backgroundColor: '#0f172a' }
			};
		case 'twoColumn':
			return {
				elements: [
					{ ...getElementPreset('paragraph', 'Column one content.'), width: 480 },
					{ ...getElementPreset('paragraph', 'Column two content.'), x: 600, width: 480 }
				],
				filters: null,
				backgroundImage: null,
				styles: { backgroundColor: '#0f172a' }
			};
		case 'blank':
		default:
			return {
				elements: [],
				filters: null,
				backgroundImage: null,
				styles: { backgroundColor: '#0f172a' }
			};
	}
}

export function getElementPreset(
	type: 'heading' | 'paragraph' | 'image',
	content: string = ''
): Omit<Element, 'id'> {
	switch (type) {
		case 'heading':
			return {
				type,
				content: content || 'Heading',
				x: 100, y: 100, width: 880, height: 100, zIndex: 1,
				styles: { fontSize: '64px', fontWeight: '900', textAlign: 'center' }
			};
		case 'paragraph':
			return {
				type,
				content: content || 'Paragraph text',
				x: 100, y: 220, width: 880, height: 150, zIndex: 1,
				styles: { fontSize: '28px', textAlign: 'left' }
			};
		case 'image':
			return {
				type,
				content: content, // base64 src
				x: 100, y: 100, width: 400, height: 300, zIndex: 1,
				styles: {}
			};
	}
}