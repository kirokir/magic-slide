<script lang="ts">
	import type { Element, GlobalSettings } from '$lib/types';
	import { slideStore, selectionStore } from '$lib/stores/appStores';
	import { interactive } from '$lib/actions/interactive';

	export let element: Element;
	export let slideId: string;
	export let globalSettings: GlobalSettings;
	
	$: isSelected = $selectionStore.selectedElementId === element.id;

	$: elementStyles = {
		...element.styles,
		fontFamily: element.styles.fontFamily || globalSettings.fontFamily,
		backgroundColor: element.type === 'cta' ? globalSettings.themeColor : element.styles.backgroundColor
	};

	function handleSelect(event: MouseEvent) {
		event.stopPropagation();
		selectionStore.set({ selectedSlideId: slideId, selectedElementId: element.id });
	}

	function updateElementInStore(slideId: string, elementId: string, updates: Partial<Element>) {
		slideStore.update((slides) => {
			const slideIndex = slides.findIndex((s) => s.id === slideId);
			if (slideIndex === -1) return slides;

			const elementIndex = slides[slideIndex].elements.findIndex((e) => e.id === elementId);
			if (elementIndex === -1) return slides;

			const updatedElement = { ...slides[slideIndex].elements[elementIndex], ...updates };
			slides[slideIndex].elements[elementIndex] = updatedElement;

			return [...slides];
		});
	}

	function handleDrag(e: CustomEvent) {
		const { id, x, y } = e.detail;
		updateElementInStore(slideId, id, { x, y });
	}

	function handleResize(e: CustomEvent) {
		const { id, width, height, x, y } = e.detail;
		updateElementInStore(slideId, id, { width, height, x, y });
	}

</script>

<div
	class="element"
	class:selected={isSelected}
	style:transform="translate({element.x}px, {element.y}px)"
	style:width="{element.width}px"
	style:height="{element.height}px"
	style:font-size={elementStyles.fontSize}
	style:font-weight={elementStyles.fontWeight}
	style:color={elementStyles.color}
	style:background-color={elementStyles.backgroundColor}
	style:font-family={elementStyles.fontFamily}
	on:mousedown={handleSelect}
	use:interactive={{ id: element.id }}
	on:dragmove={handleDrag}
	on:resizemove={handleResize}
>
	{#if element.type === 'logo'}
		<img src={element.content} alt="logo" />
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
		text-align: center;
	}

	.element.selected {
		outline: 2px solid var(--primary-color);
		z-index: 10;
	}
	
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>