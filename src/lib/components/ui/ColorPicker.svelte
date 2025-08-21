<script lang="ts">
	export let value: string | undefined | null;
	export let label: string;
</script>

<div class="color-picker-group">
	<label for={label}>{label}</label>
	<div class="picker-wrapper">
		<input type="color" id={label} value={value || '#000000'} on:input|currentTarget={e => value = e.value} />
		<span>{value ? value.toUpperCase() : '#------'}</span>
	</div>
</div>

<style>
	.color-picker-group {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-s);
	}
	label {
		font-size: var(--fs-ui);
		font-weight: 500;
		color: #94a3b8;
	}
	.picker-wrapper {
		display: flex;
		align-items: center;
		gap: var(--spacing-m);
		background: rgba(15, 23, 42, 0.5);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: var(--spacing-s);
		padding-right: var(--spacing-m);
	}
	input[type='color'] {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		width: 32px;
		height: 32px;
		background-color: transparent;
		border: none;
		cursor: pointer;
	}
	input[type='color']::-webkit-color-swatch {
		border-radius: 6px;
		border: 1px solid var(--border-color);
	}
	input[type='color']::-moz-color-swatch {
		border-radius: 6px;
		border: 1px solid var(--border-color);
	}
	span {
		font-family: monospace;
		font-size: var(--fs-ui);
	}
</style>