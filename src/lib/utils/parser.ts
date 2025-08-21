import { createId } from '@paralleldrive/cuid2';
import type { Element, Slide } from '$lib/types';

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;
const PADDING = 60;

export function parseTextToSlides(text: string, themeColor: string): Slide[] {
	const slideTexts = text.trim().split(/\n---\n/);

	return slideTexts.map((slideText) => {
		const elements: Element[] = [];
		const lines = slideText.trim().split('\n').filter(line => line.trim() !== '');
		let currentY = PADDING;

		lines.forEach((line) => {
			if (currentY > SLIDE_HEIGHT - PADDING) return;

			let element: Element | null = null;
			const content = line.substring(line.indexOf(':') + 1).trim();

			if (line.startsWith('h1:')) {
				element = {
					id: createId(),
					type: 'heading',
					content,
					x: PADDING,
					y: currentY,
					width: SLIDE_WIDTH - 2 * PADDING,
					height: 100,
					styles: {
						fontSize: '64px',
						fontWeight: '900'
					}
				};
				currentY += 120;
			} else if (line.startsWith('p:')) {
				element = {
					id: createId(),
					type: 'paragraph',
					content,
					x: PADDING,
					y: currentY,
					width: SLIDE_WIDTH - 2 * PADDING,
					height: 60,
					styles: {
						fontSize: '28px',
						fontWeight: '400'
					}
				};
				currentY += 80;
			} else if (line.startsWith('*')) {
				element = {
					id: createId(),
					type: 'list',
					content: '• ' + line.substring(1).trim(),
					x: PADDING,
					y: currentY,
					width: SLIDE_WIDTH - 2 * PADDING,
					height: 50,
					styles: {
						fontSize: '28px',
						fontWeight: '400'
					}
				};
				currentY += 60;
			} else if (line.startsWith('cta:')) {
				element = {
					id: createId(),
					type: 'cta',
					content,
					x: (SLIDE_WIDTH - 300) / 2, // Centered
					y: currentY,
					width: 300,
					height: 70,
					styles: {
						fontSize: '24px',
						fontWeight: '700',
						color: '#FFFFFF',
						backgroundColor: themeColor
					}
				};
				currentY += 100;
			}

			if (element) {
				elements.push(element);
			}
		});

		return {
			id: createId(),
			elements,
			styles: {
				backgroundColor: '#0f172a'
			}
		};
	});
}