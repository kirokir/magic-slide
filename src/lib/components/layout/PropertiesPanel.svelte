<script lang="ts">
	import { derived, get } from 'svelte/store';
	import { slideStore, selectionStore, globalSettingsStore } from '$lib/stores/appStores';
	import { updateElement, deleteElement, reorderElement, updateSlide, addNewElement } from '$lib/actions/historyActions';
	import type { Element, FilterSettings, Gradient } from '$lib/types';
	import { getElementPreset } from '$lib/utils/presets';
	
	import Card from '../ui/Card.svelte';
	import ColorPicker from '../ui/ColorPicker.svelte';
	import TextInput from '../ui/TextInput.svelte';
	import FileInput from '../ui/FileInput.svelte';
	import Button from '../ui/Button.svelte';
	import Slider from '../ui/Slider.svelte';
	import GradientPicker from '../ui/GradientPicker.svelte';

	const selectedSlide = derived([slideStore, selectionStore], ([$slides, $selection]) => $selection.selectedSlideId ? $slides.find(s => s.id === $selection.selectedSlideId) : null );
	const selectedElement = derived([selectedSlide, selectionStore], ([$slide, $selection]) => $selection.selectedElementId && $slide ? $slide.elements.find(e => e.id === $selection.selectedElementId) : null );

	let content = '';
	let textAlign: 'left' | 'center' | 'right' = 'left';
	let isBold = false;
	let isItalic = false;
	let gradient: Gradient | null = null;
    let fontFamily = '';
	let slideFilters: FilterSettings | null = null;
	let filters: FilterSettings;
	
	$: {
		if ($selectedElement && ($selectedElement.type === 'heading' || $selectedElement.type === 'paragraph' || $selectedElement.type === 'cta')) {
			content = $selectedElement.content;
			textAlign = $selectedElement.styles.textAlign || 'left';
			isBold = $selectedElement.styles.isBold || false;
			isItalic = $selectedElement.styles.isItalic || false;
			gradient = $selectedElement.styles.gradient || null;
            fontFamily = $selectedElement.styles.fontFamily || '';
		}
	}
	$: { if ($selectedSlide) { slideFilters = $selectedSlide.filters; } }
	
	$: filters = slideFilters ?? ($globalSettingsStore.filters || { brightness: 100, contrast: 100, saturate: 100, blur: 0 });

	$: if ($selectedElement) { updateElement($selectedSlide!.id, $selectedElement.id, { styles: { fontFamily, textAlign, isBold, isItalic, gradient } }); }
	$: if ($selectedElement?.type === 'heading' || $selectedElement?.type === 'paragraph' || $selectedElement?.type === 'cta') { updateElement($selectedSlide!.id, $selectedElement.id, { content }); }
	$: if ($selectedSlide && slideFilters !== undefined) { updateSlide($selectedSlide.id, { filters: slideFilters }); }

	function handleAddElement(type: 'heading' | 'paragraph') {
		if (!$selectedSlide) return;
		const preset = getElementPreset(type);
		addNewElement($selectedSlide.id, preset);
	}

    function applyBrandingToSelected() {
        if ($selectedElement && $selectedSlide) {
            const { brandFont, brandColor } = get(globalSettingsStore).brandingKit;
            updateElement($selectedSlide.id, $selectedElement.id, { styles: { fontFamily: brandFont, color: brandColor, gradient: null } });
        }
    }
</script>

<div class="properties-panel-content">
	<Card>
		{#if $selectedElement && $selectedSlide}
			<h2>Element Properties</h2>
			{#if $selectedElement.type === 'heading' || $selectedElement.type === 'paragraph' || $selectedElement.type === 'cta'}
				<TextInput label="Content" bind:value={content} />
                <TextInput label="Font Family" placeholder="Inherit from Brand" bind:value={fontFamily} />
				<div class="style-grid">
					<Button on:click={() => (isBold = !isBold)} variant={isBold ? 'primary' : 'secondary'}>B</Button>
					<Button on:click={() => (isItalic = !isItalic)} variant={isItalic ? 'primary' : 'secondary'}>I</Button>
					<Button on:click={() => (textAlign = 'left')} variant={textAlign === 'left' ? 'primary' : 'secondary'}>L</Button>
					<Button on:click={() => (textAlign = 'center')} variant={textAlign === 'center' ? 'primary' : 'secondary'}>C</Button>
					<Button on:click={() => (textAlign = 'right')} variant={textAlign === 'right' ? 'primary' : 'secondary'}>R</Button>
				</div>
                <Button on:click={applyBrandingToSelected}>Apply Brand Font & Color</Button>
				<GradientPicker bind:gradient />
			{/if}
			<div class="actions-grid">
				<Button on:click={() => reorderElement($selectedSlide.id, $selectedElement.id, 'backward')}>Backward</Button>
				<Button on:click={() => reorderElement($selectedSlide.id, $selectedElement.id, 'forward')}>Forward</Button>
			</div>
			<Button on:click={() => deleteElement($selectedSlide.id, $selectedElement.id)} variant="secondary">Delete Element</Button>
		{:else if $selectedSlide}
			<h2>Slide Properties</h2>
			<FileInput label="Background Image" accept="image/*" on:change={(e) => updateSlide($selectedSlide.id, { backgroundImage: e.detail.fileData })} />
			{#if $selectedSlide.backgroundImage}
				<Button on:click={() => updateSlide($selectedSlide.id, { backgroundImage: null })} variant="secondary">Remove Image</Button>
			{/if}
			<h3>Filter Overrides</h3>
			{#if filters}
				<Slider label="Brightness" bind:value={filters.brightness} min={0} max={200} on:input={() => (slideFilters = filters)} />
				<Slider label="Contrast" bind:value={filters.contrast} min={0} max={200} on:input={() => (slideFilters = filters)} />
				<Slider label="Saturation" bind:value={filters.saturate} min={0} max={200} on:input={() => (slideFilters = filters)} />
				<Slider label="Blur" bind:value={filters.blur} min={0} max={20} on:input={() => (slideFilters = filters)} />
				<Button on:click={() => (slideFilters = null)} variant="secondary" disabled={!$selectedSlide.filters}>Reset to Global</Button>
			{/if}
		{:else}
			<h2>Inspector</h2>
			<p class="placeholder">Select a slide or an element.</p>
		{/if}
	</Card>

	{#if $selectedSlide}
	<Card>
		<h2>Add Elements</h2>
		<div class="actions-grid">
			<Button on:click={() => handleAddElement('heading')}>Add Heading</Button>
			<Button on:click={() => handleAddElement('paragraph')}>Add Textbox</Button>
		</div>
		<FileInput label="Add Image" accept="image/*" on:change={(e) => addNewElement($selectedSlide.id, getElementPreset('image', e.detail.fileData))} />
	</Card>
	{/if}
</div>

<style>
	.properties-panel-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
	}
	.style-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: var(--spacing-s);
	}
	.actions-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-m);
	}
	h2, h3 {
		margin: 0;
	}
	h3 {
		font-size: 1rem;
		margin-top: var(--spacing-m);
		border-bottom: 1px solid var(--border-color);
		padding-bottom: var(--spacing-s);
	}
</style>