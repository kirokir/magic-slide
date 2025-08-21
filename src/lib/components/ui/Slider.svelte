

<script lang="ts">
	export let value: number;
	export let label: string;
	export let min = 0;
	export let max = 100;
	export let step = 1;
</script>

<div class="slider-group">
	<label for={label}>{label} <span>({value})</span></label>
	<input type="range" id={label} bind:value {min} {max} {step} on:input />
</div>

<style>
	.slider-group {
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
	span {
		font-family: monospace;
	}
	input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 4px;
		background: var(--glass-bg-light);
		border-radius: 2px;
		outline: none;
		cursor: pointer;
	}
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		background: var(--primary-color);
		border-radius: 50%;
		cursor: pointer;
		transition: background 0.2s;
	}
	input[type='range']::-webkit-slider-thumb:hover {
		background: var(--primary-color-light);
	}
</style>