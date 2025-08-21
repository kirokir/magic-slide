// /src/lib/components/ui/IconButton.svelte
<script lang="ts">
	export let label: string;
	export let isActive = false;
</script>

<button class:active={isActive} on:click title={label}>
	<slot />
	<span>{label}</span>
</button>

<style>
	button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-xs);
		width: 72px;
		height: 72px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--border-radius);
		color: #94a3b8;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 11px;
	}
	button:hover {
		background: var(--glass-bg-light);
		color: var(--fg-color);
	}
	button.active {
		background: var(--primary-color);
		color: white;
		border-color: var(--primary-color-light);
	}
	button :global(svg) {
		width: 24px;
		height: 24px;
	}
</style>