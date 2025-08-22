<script lang="ts">
	import { get } from 'svelte/store';
	import { globalSettingsStore, slideStore, selectionStore } from '$lib/stores/appStores';
	import { historyStore } from '$lib/stores/historyStore';
	import { parseTextToSlides } from '$lib/utils/parser';
	import { toastStore } from '$lib/stores/toastStore';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import CollapsibleCard from '$lib/components/ui/CollapsibleCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	let generatorText = `h1: Welcome to Magic Slide\np: Your content here`;
	let activePanel = 'generator';

	function handlePanelClick(panelId: string) {
		activePanel = activePanel === panelId ? '' : panelId;
	}

	function handleGenerate() {
		if (!generatorText.trim()) {
			toastStore.show('Please enter text to generate slides.', 'error');
			return;
		}
		try {
			const newSlides = parseTextToSlides(generatorText, get(globalSettingsStore).brandingKit.brandColor);
			if (newSlides.length === 0) {
				toastStore.show('No slides could be generated. Check your text format.', 'warning');
				return;
			}
			historyStore.addSnapshot({ slides: newSlides, globals: get(globalSettingsStore) });
			selectionStore.set({ selectedSlideId: newSlides[0].id, selectedElementId: null });
			toastStore.show(`Generated ${newSlides.length} new slide(s).`, 'success');
		} catch (error) {
			console.error('Error generating slides:', error);
			toastStore.show('Error generating slides. Please check console.', 'error');
		}
	}
</script>

<div class="controls-panel">
	<div class="navigation-bar">
		<IconButton label="Generate" on:click={() => handlePanelClick('generator')} isActive={activePanel === 'generator'} />
	</div>

	<div class="panels-container">
		{#if activePanel === 'generator'}
			<CollapsibleCard title="Generate from Text" isExpanded={true}>
				<textarea bind:value={generatorText} rows={10} placeholder="h1: Title..." />
				<Button on:click={handleGenerate}>Generate Slides</Button>
			</CollapsibleCard>
		{/if}
	</div>
</div>

<style>
	.controls-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		overflow: hidden;
	}
	.navigation-bar {
		padding: var(--space-s);
		border-bottom: var(--border);
		flex-shrink: 0;
	}
	.panels-container {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-m);
	}
	textarea {
		width: 100%;
		min-height: 150px;
		padding: var(--space-s);
		border-radius: var(--radius);
		border: var(--border);
		background: var(--bg-secondary);
		resize: vertical;
		margin-bottom: var(--space-m);
	}
</style>