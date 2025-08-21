import interact from 'interactjs';
import type { Action } from 'svelte/action';

export const interactive: Action<HTMLElement, { id: string }> = (node, { id }) => {
	const position = { x: 0, y: 0 };

	interact(node)
		.draggable({
			listeners: {
				start(event) {
					const element = event.target as HTMLElement;
					const transform = element.style.transform;
					const match = transform.match(/translate\((.+)px, (.+)px\)/);
					if (match) {
						position.x = parseFloat(match[1]);
						position.y = parseFloat(match[2]);
					}
				},
				move(event) {
					position.x += event.dx;
					position.y += event.dy;

					node.dispatchEvent(
						new CustomEvent('dragmove', {
							detail: { id, x: position.x, y: position.y }
						})
					);
				}
			},
			modifiers: [
				interact.modifiers.restrictRect({
					restriction: 'parent'
				})
			]
		})
		.resizable({
			edges: { left: true, right: true, bottom: true, top: true },
			listeners: {
				move(event) {
					node.dispatchEvent(
						new CustomEvent('resizemove', {
							detail: {
								id,
								width: event.rect.width,
								height: event.rect.height,
								x: event.rect.left,
								y: event.rect.top
							}
						})
					);
				}
			},
			modifiers: [
				interact.modifiers.restrictSize({
					min: { width: 50, height: 30 }
				})
			]
		});

	return {
		destroy() {
			interact(node).unset();
		}
	};
};