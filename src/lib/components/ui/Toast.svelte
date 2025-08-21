<script lang="ts">
	import { toasts } from '$lib/stores/toastStore';
	import { fly } from 'svelte/transition';

	function getIcon(type: string) {
		switch (type) {
			case 'success':
				return '✅';
			case 'error':
				return '❌';
			default:
				return 'ℹ️';
		}
	}
</script>

<div class="toast-container">
	{#each $toasts as toast (toast.id)}
		<div class="toast glass-card" class:success={toast.type === 'success'} class:error={toast.type === 'error'} in:fly={{ y: 20, duration: 300 }} out:fly={{ y: 20, duration: 300 }}>
			<span class="icon">{getIcon(toast.type)}</span>
			<p>{toast.message}</p>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: var(--spacing-l);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
		z-index: 9999;
	}
	.toast {
		display: flex;
		align-items: center;
		gap: var(--spacing-m);
		padding: var(--spacing-m);
		min-width: 250px;
		max-width: 400px;
	}
	.icon {
		font-size: 1.2rem;
	}
</style>