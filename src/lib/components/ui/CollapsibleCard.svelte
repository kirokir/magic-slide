
<script lang="ts">
	import { slide } from 'svelte/transition';
	export let isOpen = false;
</script>

{#if isOpen}
	<div class="card-content" transition:slide|local={{ duration: 300 }}>
		<slot />
	</div>
{/if}

<style>
	.card-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
		background: var(--glass-bg);
		border-radius: var(--border-radius);
		padding: var(--spacing-l);
		border: 1px solid var(--border-color);
	}
</style>