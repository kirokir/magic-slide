<script lang="ts">
	import { slideStore, globalSettingsStore, deselectAll } from '$lib/stores/appStores';
	import { get } from 'svelte/store';
	import { parseTextToSlides } from '$lib/utils/parser';
	import { showToast } from '$lib/stores/toastStore';
	import { exportAsZip, exportAsTemplate, importFromTemplate } from '$lib/utils/fileHandlers';

	import Card from '../ui/Card.svelte';
	import Button from '../ui/Button.svelte';
	import ColorPicker from '../ui/ColorPicker.svelte';
	import TextInput from '../ui/TextInput.svelte';

	let textInput = `h1: Welcome to Magic Slide
p: Generate slides from text.
---
h1: Features
*: Fully client-side
*: Interactive editor
*: Export to ZIP or .magicslide template
---
cta: Start Creating`;

	let isExporting = false;
	let fileInput: HTMLInputElement;

	function handleGenerate() {
		deselectAll();
		const newSlides = parseTextToSlides(textInput, $globalSettingsStore.themeColor);
		slideStore.set(newSlides);
		showToast('Slides generated successfully!', 'success');
	}

	function handleLogoUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			globalSettingsStore.update((settings) => ({
				...settings,
				logoUrl: event.target?.result as string
			}));
			showToast('Logo updated!', 'success');
		};
		reader.readAsDataURL(file);
	}

	async function handleZipExport() {
		isExporting = true;
		showToast('Starting ZIP export...', 'info');
		try {
			await exportAsZip(get(slideStore), get(globalSettingsStore));
			showToast('Download started!', 'success');
		} catch (error) {
			console.error('ZIP Export failed:', error);
			showToast('Export failed. Check console for details.', 'error');
		} finally {
			isExporting = false;
		}
	}

	function handleTemplateSave() {
		exportAsTemplate(get(slideStore), get(globalSettingsStore));
	}

	async function handleTemplateLoad(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		
		await importFromTemplate(file);
		target.value = ''; // Reset input to allow re-uploading the same file
	}

</script>

<div class="controls-panel-content">
	<Card>
		<h2>Generator</h2>
		<textarea bind:value={textInput} placeholder="Enter your slide content here..." rows="10" />
		<Button on:click={handleGenerate}>Generate Slides</Button>
	</Card>

	<Card>
		<h2>Global Settings</h2>
		<ColorPicker label="Theme Color" bind:value={$globalSettingsStore.themeColor} />
		<TextInput label="Font Family" bind:value={$globalSettingsStore.fontFamily} />
		<Button on:click={() => document.getElementById('logo-upload')?.click()}>Upload Logo</Button>
		<input
			type="file"
			id="logo-upload"
			hidden
			accept="image/*"
			on:change={handleLogoUpload}
		/>
	</Card>

	<Card>
		<h2>Actions</h2>
		<Button on:click={handleTemplateSave}>Save as Template</Button>
		<Button on:click={() => fileInput.click()} variant="secondary">Load Template</Button>
		<input type="file" bind:this={fileInput} hidden accept=".magicslide" on:change={handleTemplateLoad} />
		<Button on:click={handleZipExport} disabled={isExporting}>
			{#if isExporting}
				Exporting...
			{:else}
				Export as .ZIP (PNGs)
			{/if}
		</Button>
	</Card>
</div>

<style>
	.controls-panel-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
	}
	h2 {
		margin-bottom: var(--spacing-m);
		font-size: 1.25rem;
	}
	textarea {
		width: 100%;
		background: rgba(15, 23, 42, 0.5);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: var(--spacing-s) var(--spacing-m);
		color: var(--fg-color);
		font-family: var(--font-family-base);
		font-size: var(--fs-ui);
		resize: vertical;
		margin-bottom: var(--spacing-m);
	}
	textarea:focus {
		outline: none;
		border-color: var(--primary-color);
	}
	.controls-panel-content :global(.card) {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
	}
</style>