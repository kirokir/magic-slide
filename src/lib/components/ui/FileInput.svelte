// /src/lib/components/ui/FileInput.svelte

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from './Button.svelte';

	export let label: string;
	export let accept: string = '*/*';

	const dispatch = createEventDispatcher();
	let fileInput: HTMLInputElement;

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			dispatch('change', {
				fileData: event.target?.result as string,
				fileName: file.name
			});
		};
		reader.readAsDataURL(file);
		target.value = ''; // Reset to allow re-uploading the same file
	}
</script>

<div>
	<label for={label}>{label}</label>
	<Button on:click={() => fileInput.click()} variant="secondary">{label}</Button>
	<input type="file" bind:this={fileInput} id={label} {accept} hidden on:change={handleChange} />
</div>

<style>
	div {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-s);
	}
	label {
		font-size: var(--fs-ui);
		font-weight: 500;
		color: #94a3b8;
	}
</style>