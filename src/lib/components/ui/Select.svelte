// /src/lib/components/ui/Select.svelte

<script lang="ts">
	export let value: string;
	export let label: string;
	export let options: { value: string; label: string }[] = [];
</script>

<div class="select-group">
	<label for={label}>{label}</label>
	<div class="select-wrapper">
		<select id={label} bind:value on:change>
			{#each options as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</div>
</div>

<style>
	.select-group {
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

	.select-wrapper {
		position: relative;
	}

	select {
		width: 100%;
		background: rgba(15, 23, 42, 0.5);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: var(--spacing-s) var(--spacing-m);
		color: var(--fg-color);
		font-family: var(--font-family-base);
		font-size: var(--fs-ui);
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
	}
	select:focus {
		outline: none;
		border-color: var(--primary-color);
	}
	.select-wrapper::after {
		content: '▼';
		font-size: 0.75rem;
		color: #94a3b8;
		position: absolute;
		right: var(--spacing-m);
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
	}
</style>