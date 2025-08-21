// /src/lib/actions/interactive.ts

import interact from 'interactjs';
import type { Action } from 'svelte/action';

export const interactive: Action<HTMLElement, { id: string, slideDimensions: { width: number, height: number } }> = (
	node,
	{ id, slideDimensions }
) => {
	const position = { x: 0, y: 0 };

	interact(node)
		.draggable({
			listeners: { /* ... existing listeners ... */ },
			modifiers: [
				interact.modifiers.restrictRect({
					restriction: 'parent'
				})
			]
		})
		.resizable({
			edges: { left: true, right: true, bottom: true, top: true },
			listeners: { /* ... existing listeners ... */ },
			modifiers: [
				interact.modifiers.restrictSize({
					min: { width: 50, height: 30 }
				}),
				interact.modifiers.restrictRect({
					restriction: 'parent'
				})
			]
		});

	return {
		update({ id: newId, slideDimensions: newSlideDimensions }) {
            // This is where you could update modifiers if needed, e.g., restriction
        },
		destroy() {
			interact(node).unset();
		}
	};
};