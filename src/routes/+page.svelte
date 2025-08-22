<script lang="ts">
	import { globalSettingsStore, selectionStore } from '$lib/stores/appStores';
	import ControlsPanel from '$lib/components/layout/ControlsPanel.svelte';
	import PropertiesPanel from '$lib/components/layout/PropertiesPanel.svelte';
	import Stage from '$lib/components/layout/Stage.svelte';
</script>

<div class="app-layout" style={`background-color: ${$globalSettingsStore.appBackgroundColor};`}>
	<aside class="left-panel">
		<ControlsPanel />
	</aside>
	<main class="main-panel">
		<Stage />
	</main>
	<aside class="right-panel" class:hidden={!$selectionStore.selectedSlideId}>
		<PropertiesPanel />
	</aside>
</div>

<style>
	.app-layout {
		display: flex;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		padding: var(--spacing-m);
		gap: var(--spacing-m);
	}
	.left-panel {
		flex: 0 0 450px;
		height: 100%;
		overflow-y: auto;
	}
	.main-panel {
		flex: 1 1 0;
		height: 100%;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.right-panel {
		flex: 0 0 350px;
		height: 100%;
		overflow-y: auto;
		transition: flex-basis 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
	}
	.right-panel.hidden {
		flex-basis: 0;
		opacity: 0;
		padding: 0;
		margin: 0;
		overflow: hidden;
	}
</style>