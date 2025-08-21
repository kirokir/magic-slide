
<script lang="ts">
	export let checked: boolean;
	export let label: string;
</script>

<label class="checkbox-wrapper">
	<input type="checkbox" bind:checked on:change />
	<span class="checkmark"></span>
	{label}
</label>

<style>
	.checkbox-wrapper {
		display: flex;
		align-items: center;
		cursor: pointer;
		font-size: var(--fs-ui);
		user-select: none;
	}

	input {
		position: absolute;
		opacity: 0;
		cursor: pointer;
		height: 0;
		width: 0;
	}

	.checkmark {
		height: 20px;
		width: 20px;
		background-color: rgba(15, 23, 42, 0.5);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		margin-right: var(--spacing-m);
		position: relative;
		transition: all 0.2s;
	}

	.checkbox-wrapper:hover input ~ .checkmark {
		background-color: var(--glass-bg-light);
	}

	.checkbox-wrapper input:checked ~ .checkmark {
		background-color: var(--primary-color);
		border-color: var(--primary-color);
	}

	.checkmark:after {
		content: '';
		position: absolute;
		display: none;
		left: 6px;
		top: 2px;
		width: 5px;
		height: 10px;
		border: solid white;
		border-width: 0 3px 3px 0;
		transform: rotate(45deg);
	}

	.checkbox-wrapper input:checked ~ .checkmark:after {
		display: block;
	}
</style>