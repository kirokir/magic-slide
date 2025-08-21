<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { globalSettingsStore, appUIStore, slideStore, selectionStore } from '$lib/stores/appStores';
	import { historyStore } from '$lib/stores/historyStore';
	import { updateGlobalSettings, updateBrandingKit, addNewSlide } from '$lib/actions/historyActions';
	import { exportAsZip, exportAsTemplate, importFromTemplate } from '$lib/utils/fileHandlers';
	import { getSlidePreset, slidePresetOptions } from '$lib/utils/presets';
	import { activePanel, type ActivePanel } from '$lib/stores/uiStateStore';
	import { parseTextToSlides } from '$lib/utils/parser';

	import IconButton from '../ui/IconButton.svelte';
	import CollapsibleCard from '../ui/CollapsibleCard.svelte';
	import Button from '../ui/Button.svelte';
	import ColorPicker from '../ui/ColorPicker.svelte';
	import FileInput from '../ui/FileInput.svelte';
	import Select from '../ui/Select.svelte';
	import Checkbox from '../ui/Checkbox.svelte';
	import TextInput from '../ui/TextInput.svelte';

	let fileInput: HTMLInputElement;
	let manualSlideType: string = 'titleAndContent';
	let generatorText = `h1: Welcome Back!\np: Generate slides from text here.`;

	const togglePanel = (panel: ActivePanel) => {
		activePanel.update(current => current === panel ? null : panel);
	};

	function handleGenerate() {
		const newSlides = parseTextToSlides(generatorText, get(globalSettingsStore).brandingKit.brandColor);
		if (newSlides.length > 0) {
			historyStore.addSnapshot({
				slides: newSlides,
				globals: get(globalSettingsStore)
			});
			selectionStore.set({ selectedSlideId: newSlides[0].id, selectedElementId: null });
		}
	}

	onMount(() => {
		const savedBranding = localStorage.getItem('magic-slide-branding');
		if (savedBranding) {
			try {
				updateBrandingKit(JSON.parse(savedBranding));
			} catch (e) { console.error('Failed to parse saved branding kit.'); }
		}
		globalSettingsStore.subscribe(settings => {
			localStorage.setItem('magic-slide-branding', JSON.stringify(settings.brandingKit));
		});
	});

	function handleClearBranding() {
		localStorage.removeItem('magic-slide-branding');
		updateBrandingKit({ logoUrl: null, brandColor: '#4f46e5', brandFont: 'Inter', showLogoOnAllSlides: true });
	}

	function handleAddManualSlide() {
		const preset = getSlidePreset(manualSlideType);
		if (preset) {
            const currentSlides = get(slideStore);
            const currentIndex = currentSlides.findIndex(s => s.id === get(selectionStore).selectedSlideId);
            addNewSlide(preset, currentIndex + 1);
        }
	}
</script>

<div class="panel-layout">
	<div class="icon-bar glass-card">
		<IconButton label="Project" isActive={$activePanel === 'project'} on:click={() => togglePanel('project')}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
		</IconButton>
		<IconButton label="Branding" isActive={$activePanel === 'branding'} on:click={() => togglePanel('branding')}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m3.388 1.62a15.998 15.998 0 00-1.622-3.385m-5.043.025a15.998 15.998 0 01-3.388-1.621m7.5 0a4.5 4.5 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 00-3.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385" /></svg>
		</IconButton>
		<IconButton label="Generate" isActive={$activePanel === 'generator'} on:click={() => togglePanel('generator')}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456l1.178.398-1.178.398a3.375 3.375 0 00-2.456 2.456z" /></svg>
		</IconButton>
		<IconButton label="Add Slide" isActive={$activePanel === 'addSlide'} on:click={() => togglePanel('addSlide')}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
		</IconButton>
		<IconButton label="Export" isActive={$activePanel === 'export'} on:click={() => togglePanel('export')}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
		</IconButton>
	</div>

	<div class="content-area">
		<CollapsibleCard isOpen={$activePanel === 'project'}>
			<h2>Project Settings</h2>
			<Select label="Canvas Aspect Ratio" options={[{ value: '1.91:1', label: 'Landscape (1.91:1)' },{ value: '4:5', label: 'Vertical (4:5)' },{ value: '1:1', label: 'Square (1:1)' }]} bind:value={$globalSettingsStore.aspectRatio} on:change={(e) => updateGlobalSettings({ aspectRatio: e.currentTarget.value })} />
		</CollapsibleCard>

		<CollapsibleCard isOpen={$activePanel === 'branding'}>
			<h2>Branding Kit</h2>
			<FileInput label="Brand Logo" accept="image/*" on:change={(e) => updateBrandingKit({ logoUrl: e.detail.fileData })} />
			<ColorPicker label="Brand Color" bind:value={$globalSettingsStore.brandingKit.brandColor} on:input={(e) => updateBrandingKit({ brandColor: e.currentTarget.value })} />
            <TextInput label="Brand Font" bind:value={$globalSettingsStore.brandingKit.brandFont} on:input={(e) => updateBrandingKit({ brandFont: e.currentTarget.value })} />
			<Checkbox label="Show Logo on All Slides" bind:checked={$globalSettingsStore.brandingKit.showLogoOnAllSlides} on:change={(e) => updateBrandingKit({ showLogoOnAllSlides: e.currentTarget.checked })} />
			<Button on:click={handleClearBranding} variant="secondary">Clear Saved Branding</Button>
		</CollapsibleCard>

		<CollapsibleCard isOpen={$activePanel === 'generator'}>
			<h2>Generate from Text</h2>
			<textarea bind:value={generatorText} rows="10" placeholder="h1: Title..." />
			<Button on:click={handleGenerate}>Generate Slides</Button>
		</CollapsibleCard>

		<CollapsibleCard isOpen={$activePanel === 'addSlide'}>
			<h2>Add Slide from Preset</h2>
			<Select label="Preset Type" options={slidePresetOptions} bind:value={manualSlideType} />
			<Button on:click={handleAddManualSlide}>Add Slide</Button>
		</CollapsibleCard>

		<CollapsibleCard isOpen={$activePanel === 'export'}>
			<h2>Import / Export</h2>
			{#if $appUIStore.isExporting}<div class="loading">Exporting...</div>{/if}
			<Button on:click={exportAsTemplate}>Save Template</Button>
			<Button on:click={() => fileInput.click()} variant="secondary">Load Template</Button>
			<input type="file" bind:this={fileInput} hidden accept=".magicslide" on:change={importFromTemplate} />
			<Button on:click={exportAsZip} disabled={$appUIStore.isExporting}>Export as .ZIP</Button>
		</CollapsibleCard>
	</div>
</div>

<style>
	.panel-layout {
		display: grid;
		grid-template-columns: 88px 1fr;
		height: 100%;
	}
	.icon-bar {
		padding: var(--spacing-s);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-s);
		align-items: center;
		height: fit-content;
	}
	.content-area {
		overflow-y: auto;
		padding-left: var(--spacing-m);
	}
	h2 {
		margin-bottom: var(--spacing-s);
		font-size: 1.125rem;
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
	}
</style>