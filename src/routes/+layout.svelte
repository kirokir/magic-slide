<script lang="ts">
  import '../global.css';
  import Toast from '$lib/components/ui/Toast.svelte';
</script>

<div class="app-container">
  <slot />
  <Toast />
</div>

<style>
  .app-container {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background: var(--bg-secondary);
  }
</style>