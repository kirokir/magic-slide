
<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { globalSettingsStore, appUIStore, slideStore } from '$lib/stores/appStores';
	import { historyStore } from '$lib/stores/historyStore';
	import { updateGlobalSettings, updateBrandingKit, addNewSlide } from '$lib/actions/historyActions';
	import { exportAsZip, exportAsTemplate, importFromTemplate } from '$lib/utils/fileHandlers';
	import { getSlidePreset, slidePresetOptions } from '$lib/utils/presets';

	import Card from '../ui/Card.svelte';
	import Button from '../ui/Button.svelte';
	import ColorPicker from '../ui/ColorPicker.svelte';
	import FileInput from '../ui/FileInput.svelte';
	import Select from '../ui/Select.svelte';
	import Checkbox from '../ui/Checkbox.svelte';

	let fileInput: HTMLInputElement;
	let manualSlideType: string = 'titleAndContent';

	onMount(() => {
		const savedBranding = localStorage.getItem('magic-slide-branding');
		if (savedBranding) {
			try {
				const parsedBranding = JSON.parse(savedBranding);
				// Use the action to ensure it's part of the history if needed, though onMount is usually fine
				updateBrandingKit(parsedBranding); 
			} catch (e) {
				console.error('Failed to parse saved branding kit.');
			}
		}

		// Save to localStorage whenever the branding kit changes
		globalSettingsStore.subscribe(settings => {
			localStorage.setItem('magic-slide-branding', JSON.stringify(settings.brandingKit));
		});
	});

	function handleClearBranding() {
		localStorage.removeItem('magic-slide-branding');
		// Reset to a default state
		updateBrandingKit({
			logoUrl: null,
			brandColor: '#4f46e5',
			brandFont: 'Inter',
			showLogoOnAllSlides: true
		});
	}

	function handleAddManualSlide() {
		const preset = getSlidePreset(manualSlideType);
		if (preset) {
			const currentSlideIndex = get(slideStore).findIndex(s => s.id === get(globalSettingsStore).selectedSlideId)
			addNewSlide(preset, currentSlideIndex + 1);
		}
	}
</script>

<div class="controls-panel-content">
	<Card>
		<div class="actions-grid">
			<Button on:click={historyStore.undo} disabled={!$historyStore.canUndo}>Undo</Button>
			<Button on:click={historyStore.redo} disabled={!$historyStore.canRedo} variant="secondary">Redo</Button>
		</div>
	</Card>

	<Card>
		<h2>Project Settings</h2>
		<Select
			label="Canvas Aspect Ratio"
			options={[
				{ value: '1.91:1', label: 'Landscape (1.91:1)' },
				{ value: '4:5', label: 'Vertical (4:5)' },
				{ value: '1:1', label: 'Square (1:1)' }
			]}
			bind:value={$globalSettingsStore.aspectRatio}
			on:change={(e) => updateGlobalSettings({ aspectRatio: e.currentTarget.value })}
		/>
	</Card>

	<Card>
		<h2>Branding Kit</h2>
		<FileInput
			label="Brand Logo"
			accept="image/*"
			on:change={(e) => updateBrandingKit({ logoUrl: e.detail.fileData })}
		/>
		<ColorPicker
			label="Brand Color"
			bind:value={$globalSettingsStore.brandingKit.brandColor}
			on:input={(e) => updateBrandingKit({ brandColor: e.currentTarget.value })}
		/>
		<Checkbox
			label="Show Logo on All Slides"
			bind:checked={$globalSettingsStore.brandingKit.showLogoOnAllSlides}
			on:change={(e) => updateBrandingKit({ showLogoOnAllSlides: e.currentTarget.checked })}
		/>
		<Button on:click={handleClearBranding} variant="secondary">Clear Saved Branding</Button>
	</Card>

	<Card>
		<h2>Slide Creation</h2>
		<Select
			label="Add Slide from Preset"
			options={slidePresetOptions}
			bind:value={manualSlideType}
		/>
		<Button on:click={handleAddManualSlide}>Add Manual Slide</Button>
	</Card>

	<Card>
		<h2>Import / Export</h2>
		{#if $appUIStore.isExporting}
			<div id="loading-indicator">Exporting, please wait...</div>
		{/if}
		<div class="actions-grid">
			<Button on:click={exportAsTemplate}>Save Template</Button>
			<Button on:click={() => fileInput.click()} variant="secondary">Load Template</Button>
		</div>
		<input type="file" bind:this={fileInput} hidden accept=".magicslide" on:change={importFromTemplate} />
		<Button on:click={exportAsZip} disabled={$appUIStore.isExporting}>
			Export as .ZIP (PNGs)
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
		margin-bottom: var(--spacing-s);
		font-size: 1.125rem;
	}
	.controls-panel-content :global(.card) {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
	}
	.actions-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-m);
	}
	#loading-indicator {
		text-align: center;
		padding: var(--spacing-s);
		background: rgba(0,0,0,0.2);
		border-radius: 8px;
		font-style: italic;
		color: var(--fg-color);
	}
</style>