<script lang="ts">
	import { derived, get } from 'svelte/store';
	import { slideStore, globalSettingsStore, selectionStore } from '$lib/stores/appStores';
	import { deleteSlide } from '$lib/actions/historyActions';
	import SlideElement from '../editor/SlideElement.svelte';
	import { createId } from '@paralleldrive/cuid2';
	import Button from '../ui/Button.svelte';

	const dimensions = derived(globalSettingsStore, ($globals) => {
		switch ($globals.aspectRatio) {
			case '1:1':
				return { width: 1080, height: 1080 };
			case '4:5':
				return { width: 1080, height: 1350 };
			case '1.91:1':
			default:
				return { width: 1080, height: 566 };
		}
	});

	const slidesWithLogo = derived(
		[slideStore, globalSettingsStore],
		([$slideStore, $globals]) => {
			const { logoUrl, showLogoOnAllSlides } = $globals.brandingKit;

			if (!logoUrl || !showLogoOnAllSlides) {
				return $slideStore.map(slide => ({
					...slide,
					elements: slide.elements.filter(el => el.type !== 'logo')
				}));
			}

			return $slideStore.map((slide) => {
				const existingLogo = slide.elements.find((el) => el.type === 'logo');
				const slideDims = get(dimensions);

				const logoElement = {
					id: existingLogo?.id || createId(),
					type: 'logo' as const,
					content: logoUrl,
					x: existingLogo?.x || (slideDims.width - 120),
					y: existingLogo?.y || (slideDims.height - 70),
					width: existingLogo?.width || 100,
					height: existingLogo?.height || 60,
					zIndex: 999, // Ensure logo is on top
					styles: {}
				};

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
		const activeFilters = slide.filters ?? globals.filters;
		return `
			background-color: ${slide.styles.backgroundColor};
			${slide.backgroundImage ? `background-image: url(${slide.backgroundImage}); background-size: cover; background-position: center;` : ''}
			filter: 
				brightness(${activeFilters.brightness}%) 
				contrast(${activeFilters.contrast}%) 
				saturate(${activeFilters.saturate}%) 
				blur(${activeFilters.blur}px);
		`;
	}

</script>

<div class="canvas-controls">
	<Button on:click={() => navigateSlide('prev')} disabled={$activeSlideIndex <= 0}>Prev</Button>
	<div id="slide-indicator">
		{$activeSlideIndex === -1 ? '-' : $activeSlideIndex + 1} / {$slideStore.length}
	</div>
	<Button on:click={() => navigateSlide('next')} disabled={$activeSlideIndex >= $slideStore.length - 1}>Next</Button>
	<Button on:click={() => deleteSlide($selectionStore.selectedSlideId)} variant="secondary" disabled={$slideStore.length <= 1}>Delete Slide</Button>
</div>

<!-- THIS IS THE FIX: The on:mousedown handler now correctly uses an inline function -->
<div class="stage-wrapper" role="presentation" on:mousedown={() => selectionStore.update(s => ({...s, selectedElementId: null}))}>
	<div class="slide-list">
		{#if $activeSlideIndex !== -1 && $slidesWithLogo[$activeSlideIndex]}
			{@const activeSlide = $slidesWithLogo[$activeSlideIndex]}
			<div class="slide-container">
				<div
					id={`slide-${activeSlide.id}`}
					class="slide"
					role="document"
					class:selected={$selectionStore.selectedSlideId === activeSlide.id && !$selectionStore.selectedElementId}
					style:width="{$dimensions.width}px"
					style:height="{$dimensions.height}px"
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
</div>

<style>
	.canvas-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-m);
		flex-shrink: 0;
	}
	#slide-indicator {
		font-variant-numeric: tabular-nums;
		padding: 0 var(--spacing-l);
		font-weight: 500;
	}
	.stage-wrapper {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--spacing-xl);
		overflow: hidden;
	}
	.slide-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}
	.slide {
		position: relative;
		overflow: hidden;
		transform-origin: center center;
		transform: scale(0.7); /* Adjust for larger canvas sizes */
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		border: 1px solid var(--border-color);
		transition: box-shadow 0.2s, filter 0.2s ease-in-out;
	}

	.slide.selected {
		box-shadow: 0 0 0 3px var(--primary-color);
	}
</style>
	