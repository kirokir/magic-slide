<script lang="ts">
	import { derived, get } from 'svelte/store';
	import { slideStore, globalSettingsStore, selectionStore } from '$lib/stores/appStores';
	import { deleteSlide } from '$lib/actions/historyActions';
	import { historyStore } from '$lib/stores/historyStore';
	import type { Slide, GlobalSettings } from '$lib/types/index.ts';
	import SlideElement from '../editor/SlideElement.svelte';
	import { createId } from '@paralleldrive/cuid2';
	import Button from '../ui/Button.svelte';

	const { canUndo, canRedo } = historyStore;

	const dimensions = derived(globalSettingsStore, ($globals) => {
		if (!$globals) return { width: 1080, height: 566, ratio: '1.91 / 1' };
		switch ($globals.aspectRatio) {
			case '1:1': return { width: 1080, height: 1080, ratio: '1 / 1' };
			case '4:5': return { width: 1080, height: 1350, ratio: '4 / 5' };
			case '1.91:1': default: return { width: 1080, height: 566, ratio: '1.91 / 1' };
		}
	});

	let scaleFactor = '1';
	$: if ($dimensions) {
		scaleFactor = `min(100% / ${$dimensions.width}, 100% / ${$dimensions.height})`;
	}

	const slidesWithLogo = derived([slideStore, globalSettingsStore],([$slideStore, $globals]) => {
			if (!$globals?.brandingKit) return $slideStore;
			const { logoUrl, showLogoOnAllSlides } = $globals.brandingKit;
			if (!logoUrl || !showLogoOnAllSlides) return $slideStore.map(s => ({ ...s, elements: s.elements.filter(e => e.type !== 'logo') }));
			return $slideStore.map((slide) => {
				const existingLogo = slide.elements.find((el) => el.type === 'logo');
				const slideDims = get(dimensions);
				const logoElement = { id: existingLogo?.id || createId(), type: 'logo' as const, content: logoUrl, x: existingLogo?.x || (slideDims.width - 120), y: existingLogo?.y || (slideDims.height - 70), width: existingLogo?.width || 100, height: existingLogo?.height || 60, zIndex: 999, styles: {} };
				const otherElements = slide.elements.filter(el => el.type !== 'logo');
				return { ...slide, elements: [...otherElements, logoElement] };
			});
		}
	);

	const activeSlideIndex = derived([slideStore, selectionStore], ([$slides, $selection]) => {
		if (!$selection.selectedSlideId) return -1;
		return $slides.findIndex(s => s.id === $selection.selectedSlideId);
	});

	function navigateSlide(direction: 'prev' | 'next') {
		const slides = get(slideStore);
		const currentIndex = get(activeSlideIndex);
		if (direction === 'prev' && currentIndex > 0) {
			selectionStore.update(s => ({ ...s, selectedElementId: null, selectedSlideId: slides[currentIndex - 1].id }));
		} else if (direction === 'next' && currentIndex < slides.length - 1) {
			selectionStore.update(s => ({ ...s, selectedElementId: null, selectedSlideId: slides[currentIndex + 1].id }));
		}
	}

	function handleSlideClick(e: MouseEvent, slideId: string) {
		e.stopPropagation();
		selectionStore.set({ selectedSlideId: slideId, selectedElementId: null });
	}

	function getSlideStyles(slide: Slide, globals: GlobalSettings) {
		if (!slide || !globals) return '';
		const activeFilters = slide.filters ?? globals.filters;
		return `
			background-color: ${slide.styles.backgroundColor};
			${slide.backgroundImage ? `background-image: url(${slide.backgroundImage});` : ''}
			filter: brightness(${activeFilters.brightness}%) contrast(${activeFilters.contrast}%) saturate(${activeFilters.saturate}%) blur(${activeFilters.blur}px);
		`;
	}

	function handleDeleteClick() {
		if ($selectionStore.selectedSlideId) {
			deleteSlide($selectionStore.selectedSlideId);
		}
	}
</script>

<div class="top-controls" role="toolbar" aria-label="Presentation controls" tabindex="0">
	<Button on:click={() => historyStore.undo()} disabled={!$canUndo} title="Undo">
		<svg slot="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
	</Button>
	<Button on:click={() => historyStore.redo()} disabled={!$canRedo} variant="secondary" title="Redo">
		<svg slot="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>
	</Button>
	<div class="nav-controls" role="group" aria-label="Slide navigation">
		<Button on:click={() => navigateSlide('prev')} disabled={$activeSlideIndex <= 0} title="Previous Slide">
			<svg slot="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
		</Button>
		<div id="slide-indicator" aria-live="polite">{$activeSlideIndex === -1 ? '-' : $activeSlideIndex + 1} / {$slideStore.length}</div>
		<Button on:click={() => navigateSlide('next')} disabled={$activeSlideIndex >= $slideStore.length - 1} title="Next Slide">
			<svg slot="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
		</Button>
	</div>
	<Button on:click={handleDeleteClick} variant="secondary" disabled={$slideStore.length <= 1} title="Delete Slide">
		<svg slot="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.92-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
	</Button>
</div>

<div class="stage-wrapper" role="presentation" on:mousedown={() => selectionStore.update(s => ({...s, selectedElementId: null}))}>
	{#if $activeSlideIndex !== -1 && $slidesWithLogo && $slidesWithLogo[$activeSlideIndex]}
		{@const activeSlide = $slidesWithLogo[$activeSlideIndex]}
		<div class="slide-scaler" style:aspect-ratio={$dimensions.ratio}>
			<div
				id={`slide-${activeSlide.id}`}
				class="slide"
				role="document"
				class:selected={$selectionStore.selectedSlideId === activeSlide.id && !$selectionStore.selectedElementId}
				style:width="{$dimensions.width}px"
				style:height="{$dimensions.height}px"
				style:--scale-factor={scaleFactor}
				style={getSlideStyles(activeSlide, $globalSettingsStore)}
				on:mousedown={(e) => handleSlideClick(e, activeSlide.id)}
			>
				{#each activeSlide.elements.sort((a,b) => a.zIndex - b.zIndex) as element (element.id)}
					<SlideElement {element} slideId={activeSlide.id} slideDimensions={$dimensions} />
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.top-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-m);
		flex-shrink: 0;
	}
	.nav-controls {
		display: flex;
		align-items: center;
		gap: var(--spacing-m);
	}
	#slide-indicator {
		font-variant-numeric: tabular-nums;
		padding: 0 var(--spacing-l);
		font-weight: 500;
	}
	.stage-wrapper {
		flex-grow: 1;
		min-height: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--spacing-l);
	}
	.slide-scaler {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		position: relative;
	}
	.slide {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: top left;
		overflow: hidden;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		border: 1px solid var(--border-color);
		transition: all 0.3s ease;
		background-size: cover;
		background-position: center;
		transform: scale(calc(var(--scale-factor)));
	}
	.slide.selected {
		box-shadow: 0 0 0 3px var(--primary-color);
	}
	.top-controls :global(button) {
		min-width: 44px;
		padding: var(--spacing-s);
	}
</style>