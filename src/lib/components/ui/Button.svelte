<script lang="ts">
	export let disabled = false;
	export let variant: 'primary' | 'secondary' = 'primary';
	export let title: string | undefined = undefined;
</script>

<button class={variant} {disabled} {title} on:click>
	{#if $$slots.icon}
		<span class="icon">
			<slot name="icon" />
		</span>
	{/if}
	{#if $$slots.default}
		<slot />
	{/if}
</button>

<style>
	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-s);
		padding: var(--spacing-s) var(--spacing-m);
		border-radius: 8px;
		font-family: var(--font-family-base);
		font-size: var(--fs-ui);
		font-weight: 500;
		color: var(--fg-color);
		border: none;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		width: 100%;
	}
	.primary {
		background-color: var(--primary-color);
	}
	.primary:hover:not(:disabled) {
		background-color: var(--primary-color-light);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}
	.secondary {
		background-color: var(--glass-bg-light);
		border: 1px solid var(--border-color);
	}
	.secondary:hover:not(:disabled) {
		background-color: var(--glass-bg);
		border-color: var(--primary-color);
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>