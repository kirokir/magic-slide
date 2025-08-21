<script lang="ts">
	import { globalSettingsStore } from '$lib/stores/appStores';
	import ControlsPanel from '$lib/components/layout/ControlsPanel.svelte';
	import PropertiesPanel from '$lib/components/layout/PropertiesPanel.svelte';
	import Stage from '$lib/components/layout/Stage.svelte';

	$: appStyles = `
		background-color: ${$globalSettingsStore.appBackgroundColor};
		${$globalSettingsStore.appBackgroundImage ? `background-image: url(${$globalSettingsStore.appBackgroundImage}); background-size: cover; background-position: center;` : ''}
	`;
</script>

<main style={appStyles}>
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
		grid-template-columns: 350px 1fr 350px;
		height: 100vh;
		gap: var(--spacing-m);
		padding: var(--spacing-m);
		transition: background-color 0.3s ease;
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
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
	}
</style>