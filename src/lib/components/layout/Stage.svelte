<script lang="ts">
	import { derived } from 'svelte/store';
	import { slideStore, globalSettingsStore, selectionStore, deselectAll } from '$lib/stores/appStores';
	import SlideElement from '../editor/SlideElement.svelte';
	import { createId } from '@paralleldrive/cuid2';

	// Derived store that adds the logo to each slide if it exists
	const slidesWithLogo = derived(
		[slideStore, globalSettingsStore],
		([$slideStore, $globalSettingsStore]) => {
			if (!$globalSettingsStore.logoUrl) {
				return $slideStore.map(slide => ({
					...slide,
					elements: slide.elements.filter(el => el.type !== 'logo')
				}));
			}

			return $slideStore.map((slide) => {
				const existingLogo = slide.elements.find((el) => el.type === 'logo');
				
				const logoElement = {
					id: existingLogo?.id || createId(),
					type: 'logo' as const,
					content: $globalSettingsStore.logoUrl!,
					x: existingLogo?.x || 1150,
					y: existingLogo?.y || 620,
					width: existingLogo?.width || 100,
					height: existingLogo?.height || 60,
					styles: {}
				};

				// Filter out old logo and add the new/updated one
				const otherElements = slide.elements.filter(el => el.type !== 'logo');
				return { ...slide, elements: [...otherElements, logoElement] };
			});
		}
	);

	function handleStageClick() {
		deselectAll();
	}

	function handleSlideClick(e: MouseEvent, slideId: string) {
		e.stopPropagation();
		selectionStore.set({ selectedSlideId: slideId, selectedElementId: null });
	}

</script>

<div class="stage-wrapper" on:mousedown={handleStageClick}>
	<div class="slide-list">
		{#each $slidesWithLogo as slide, i (slide.id)}
			<div class="slide-container">
				<div class="slide-number">Slide {i + 1}</div>
				<div
					id={`slide-${slide.id}`}
					class="slide"
					class:selected={$selectionStore.selectedSlideId === slide.id && !$selectionStore.selectedElementId}
					style:background-color={slide.styles.backgroundColor}
					on:mousedown={(e) => handleSlideClick(e, slide.id)}
				>
					{#each slide.elements as element (element.id)}
						<SlideElement {element} slideId={slide.id} globalSettings={$globalSettingsStore} />
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.stage-wrapper {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		padding: var(--spacing-xl);
	}
	.slide-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}
	.slide-container {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-s);
	}
	.slide-number {
		color: #94a3b8;
		font-size: var(--fs-ui);
		font-weight: 500;
	}
	.slide {
		width: 1280px;
		height: 720px;
		position: relative;
		overflow: hidden;
		transform-origin: top left;
		transform: scale(0.6); /* Adjust scale for preview */
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		border: 1px solid var(--border-color);
		transition: box-shadow 0.2s;
	}

	.slide.selected {
		box-shadow: 0 0 0 3px var(--primary-color);
	}

	@media (max-width: 1800px) {
		.slide {
			transform: scale(0.5);
		}
	}
	@media (max-width: 1600px) {
		.slide {
			transform: scale(0.4);
		}
	}
</style>