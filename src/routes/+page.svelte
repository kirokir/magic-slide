<script lang="ts">
	import ControlsPanel from '$lib/components/layout/ControlsPanel.svelte';
	import PropertiesPanel from '$lib/components/layout/PropertiesPanel.svelte';
	import Stage from '$lib/components/layout/Stage.svelte';
</script>

<main>
	<div class="left-panel">
		<ControlsPanel />
	</div>
	<div class="center-panel">
		<Stage />
	</div>
	<div class="right-panel">
		<PropertiesPanel />
	</div>
</main>

<style>
	main {
		display: grid;
		grid-template-columns: 320px 1fr 320px;
		height: 100vh;
		gap: var(--spacing-m);
		padding: var(--spacing-m);
	}

	.left-panel,
	.right-panel {
		height: calc(100vh - var(--spacing-m) * 2);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.center-panel {
		height: calc(100vh - var(--spacing-m) * 2);
		overflow-y: auto;
	}
</style>