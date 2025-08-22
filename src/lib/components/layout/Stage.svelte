<script lang="ts">
	import { derived, get } from 'svelte/store';
	import { slideStore, globalSettingsStore, selectionStore } from '$lib/stores/appStores';
	import { historyStore } from '$lib/stores/historyStore';
	import type { Slide, GlobalSettings } from '$lib/types/index';
	import SlideElement from '../editor/SlideElement.svelte';
	import Button from '../ui/Button.svelte';

	const { canUndo, canRedo } = historyStore;

	const activeSlide = derived([slideStore, selectionStore], ([$slides, $selection]) => {
		if (!$selection.selectedSlideId) return null;
		return $slides.find(s => s.id === $selection.selectedSlideId) || null;
	});

	let scaleFactor = 1;
	let stageContainer: HTMLDivElement;

	$: if (stageContainer && $activeSlide) {
		const containerWidth = stageContainer.clientWidth;
		const containerHeight = stageContainer.clientHeight;
		scaleFactor = Math.min(
			(containerWidth - 64) / $activeSlide.width,
			(containerHeight - 64) / $activeSlide.height
		);
	}
</script>

<div class="stage-container">
	<div class="top-controls">
		<Button on:click={() => historyStore.undo()} disabled={!$canUndo}>Undo</Button>
		<Button on:click={() => historyStore.redo()} disabled={!$canRedo}>Redo</Button>
	</div>

	<div class="slide-canvas-container" bind:this={stageContainer}>
		{#if $activeSlide}
			<div
				class="slide"
				style:width={`${$activeSlide.width}px`}
				style:height={`${$activeSlide.height}px`}
				style:transform={`scale(${scaleFactor})`}
				style:background={$activeSlide.styles.backgroundColor}
			>
				{#each $activeSlide.elements as element (element.id)}
					<SlideElement {element} slideId={$activeSlide.id} />
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<p>No slide selected. Generate slides to begin.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.stage-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		overflow: hidden;
	}
	.top-controls {
		display: flex;
		gap: var(--space-m);
		padding: var(--space-m);
		border-bottom: var(--border);
		flex-shrink: 0;
	}
	.slide-canvas-container {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
		overflow: hidden;
		min-height: 0;
	}
	.slide {
		position: relative;
		transform-origin: center;
		transition: transform 0.2s ease;
		box-shadow: var(--shadow-lg);
		border-radius: var(--radius);
	}
	.empty-state {
		color: var(--text-secondary);
	}
</style>