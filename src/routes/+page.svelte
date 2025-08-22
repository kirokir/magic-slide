<script lang="ts">
  import ControlsPanel from '$lib/components/layout/ControlsPanel.svelte';
  import Stage from '$lib/components/layout/Stage.svelte';
  import PropertiesPanel from '$lib/components/layout/PropertiesPanel.svelte';
  import { selectionStore } from '$lib/stores/appStores';
</script>

<div class="app-layout">
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
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  .left-panel {
    flex-shrink: 0;
    width: 320px;
    height: 100%;
    background: var(--bg-primary);
    border-right: var(--border);
    overflow-y: auto;
  }

  .main-panel {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .right-panel {
    flex-shrink: 0;
    width: 300px;
    height: 100%;
    background: var(--bg-primary);
    border-left: var(--border);
    transition: width 0.2s ease, opacity 0.2s ease;
    overflow-y: auto;
  }

  .right-panel.hidden {
    width: 0;
    opacity: 0;
    padding: 0;
    border-left: none;
  }
</style>