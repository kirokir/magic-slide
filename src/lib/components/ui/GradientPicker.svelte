// /src/lib/components/ui/GradientPicker.svelte

<script lang="ts">
	import type { Gradient } from '$lib/types';
	import Checkbox from './Checkbox.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import Slider from './Slider.svelte';

	export let gradient: Gradient | null = null;

	let enabled = !!gradient;

	$: if (enabled && !gradient) {
		gradient = { from: '#ffffff', to: '#4f46e5', angle: 90 };
	} else if (!enabled) {
		gradient = null;
	}
</script>

<div class="gradient-picker">
	<Checkbox label="Enable Text Gradient" bind:checked={enabled} />
	{#if enabled && gradient}
		<div class="controls">
			<ColorPicker label="From" bind:value={gradient.from} />
			<ColorPicker label="To" bind:value={gradient.to} />
			<Slider label="Angle" bind:value={gradient.angle} min={0} max={360} />
		</div>
	{/if}
</div>

<style>
	.gradient-picker {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
		border-top: 1px solid var(--border-color);
		padding-top: var(--spacing-m);
	}
	.controls {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
		padding-left: var(--spacing-s);
		border-left: 2px solid var(--glass-bg-light);
	}
</style>