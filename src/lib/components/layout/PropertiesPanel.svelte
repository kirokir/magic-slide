<script lang="ts">
	import { derived } from 'svelte/store';
	import { slideStore, selectionStore } from '$lib/stores/appStores';
	import type { Slide, Element } from '$lib/types';
	import Card from '../ui/Card.svelte';
	import ColorPicker from '../ui/ColorPicker.svelte';
	import TextInput from '../ui/TextInput.svelte';

	// Derived store to find the currently selected slide
	const selectedSlide = derived([slideStore, selectionStore], ([$slideStore, $selectionStore]) => {
		if (!$selectionStore.selectedSlideId) return null;
		return $slideStore.find((s) => s.id === $selectionStore.selectedSlideId) || null;
	});

	// Derived store to find the currently selected element
	const selectedElement = derived([slideStore, selectionStore], ([$slideStore, $selectionStore]) => {
		if (!$selectionStore.selectedSlideId || !$selectionStore.selectedElementId) return null;
		const slide = $slideStore.find((s) => s.id === $selectionStore.selectedSlideId);
		if (!slide) return null;
		return slide.elements.find((e) => e.id === $selectionStore.selectedElementId) || null;
	});

	// Two-way bindable properties
	let backgroundColor: string;
	let content: string;
	let fontSize: string;
	let fontWeight: string;

	$: if ($selectedSlide && !$selectedElement) {
		backgroundColor = $selectedSlide.styles.backgroundColor;
	}
	$: if ($selectedElement) {
		content = $selectedElement.content;
		fontSize = $selectedElement.styles.fontSize || '';
		fontWeight = $selectedElement.styles.fontWeight || '';
	}

	function updateSlideStyle(key: keyof Slide['styles'], value: any) {
		if (!$selectedSlide) return;
		slideStore.update((slides) =>
			slides.map((s) =>
				s.id === $selectedSlide!.id ? { ...s, styles: { ...s.styles, [key]: value } } : s
			)
		);
	}

	function updateElement(key: 'content' | 'styles', value: any) {
		if (!$selectedElement || !$selectedSlide) return;
		slideStore.update((slides) => {
			const slideIndex = slides.findIndex((s) => s.id === $selectedSlide!.id);
			if (slideIndex === -1) return slides;
			
			const elementIndex = slides[slideIndex].elements.findIndex((e) => e.id === $selectedElement!.id);
			if (elementIndex === -1) return slides;

			if (key === 'content') {
				slides[slideIndex].elements[elementIndex].content = value;
			} else if (key === 'styles') {
				slides[slideIndex].elements[elementIndex].styles = { ...slides[slideIndex].elements[elementIndex].styles, ...value };
			}
			return [...slides];
		});
	}

	$: updateSlideStyle('backgroundColor', backgroundColor);
	$: if ($selectedElement) updateElement('content', content);
	$: if ($selectedElement) updateElement('styles', { fontSize: fontSize });
	$: if ($selectedElement) updateElement('styles', { fontWeight: fontWeight });

</script>

<div class="properties-panel-content">
	<Card>
		{#if $selectedElement}
			<h2>Element Properties</h2>
			<div class="prop-group">
				{#if $selectedElement.type !== 'logo'}
				<TextInput label="Content" bind:value={content} />
				<TextInput label="Font Size (e.g., 24px)" bind:value={fontSize} />
				<TextInput label="Font Weight (e.g., 400, 700)" bind:value={fontWeight} />
				{/if}
				{#if $selectedElement.type === 'logo'}
				<p class="info">Logo properties are edited via Drag & Resize on the stage.</p>
				{/if}
			</div>
		{:else if $selectedSlide}
			<h2>Slide Properties</h2>
			<div class="prop-group">
				<ColorPicker label="Background Color" bind:value={backgroundColor} />
			</div>
		{:else}
			<h2>Properties Inspector</h2>
			<p class="placeholder">Select a slide or an element on the stage to see its properties here.</p>
		{/if}
	</Card>
</div>

<style>
	.properties-panel-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
	}
	h2 {
		margin-bottom: var(--spacing-m);
		font-size: 1.25rem;
	}
	.placeholder, .info {
		color: #94a3b8;
		font-size: var(--fs-ui);
		text-align: center;
		padding: var(--spacing-l) 0;
	}
	.prop-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
	}
</style>