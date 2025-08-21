

<script lang="ts">
	import { selectionStore } from '$lib/stores/appStores';
	import { interactive } from '$lib/actions/interactive';
	import { updateElement } from '$lib/actions/historyActions';
	import type { Element, Gradient } from '$lib/types';

	export let element: Element;
	export let slideId: string;
	export let slideDimensions: { width: number; height: number };
	
	$: isSelected = $selectionStore.selectedElementId === element.id;

	function getGradientStyle(gradient: Gradient) {
		return `
			background: linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to});
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
		`;
	}

	$: elementDynamicStyles = `
		transform: translate(${element.x}px, ${element.y}px);
		width: ${element.width}px;
		height: ${element.height}px;
		z-index: ${element.zIndex};
		font-size: ${element.styles.fontSize || 'inherit'};
		font-weight: ${element.styles.isBold ? 'bold' : (element.styles.fontWeight || 'normal')};
		font-style: ${element.styles.isItalic ? 'italic' : 'normal'};
		text-align: ${element.styles.textAlign || 'left'};
		color: ${element.styles.color || 'inherit'};
		background-color: ${element.styles.backgroundColor || 'transparent'};
		font-family: ${element.styles.fontFamily || 'inherit'};
		${element.styles.gradient ? getGradientStyle(element.styles.gradient) : ''}
	`;

	function handleSelect(event: MouseEvent) {
		event.stopPropagation();
		selectionStore.set({ selectedSlideId: slideId, selectedElementId: element.id });
	}

	function handleDrag(e: CustomEvent) {
		const { x, y } = e.detail;
		updateElement(slideId, element.id, { x, y });
	}

	function handleResize(e: CustomEvent) {
		const { width, height, x, y } = e.detail;
		updateElement(slideId, element.id, { width, height, x, y });
	}

</script>

<div
	class="element"
	class:selected={isSelected}
	style={elementDynamicStyles}
	on:mousedown={handleSelect}
	use:interactive={{ id: element.id, slideDimensions }}
	on:dragmove={handleDrag}
	on:resizemove={handleResize}
>
	{#if element.type === 'logo' || element.type === 'image'}
		<img src={element.content} alt={element.type} />
	{:else}
		<span>{element.content}</span>
	{/if}
</div>

<style>
	.element {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10px;
		cursor: move;
		touch-action: none;
		user-select: none;
		overflow: hidden;
		word-break: break-word;
		box-sizing: border-box; /* Important for resizing */
	}

	.element.selected {
		outline: 2px solid var(--primary-color);
		z-index: 1000 !important; /* Ensure selected is always on top for interaction */
	}
	
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none; /* Prevent image from capturing drag events */
	}
</style>