<script lang="ts">
	export let value: string;
	export let label: string;
	export let placeholder = '';
</script>

<div class="input-group">
	<label for={label}>{label}</label>
	<input type="text" id={label} {placeholder} bind:value />
</div>

<style>
	.input-group {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-s);
	}

	label {
		font-size: var(--fs-ui);
		font-weight: 500;
		color: #94a3b8; /* slate-400 */
	}

	input {
		width: 100%;
		background: rgba(15, 23, 42, 0.5); /* slate-900 */
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: var(--spacing-s) var(--spacing-m);
		color: var(--fg-color);
		font-family: var(--font-family-base);
		font-size: var(--fs-ui);
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: var(--primary-color);
	}
</style>