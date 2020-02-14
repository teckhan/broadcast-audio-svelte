<section style="margin: auto; text-align: center">
	{#if pathName}
		<h2>Couldn't navigate to { pathName }</h2>
	{/if}
	<a href='/' class="app-button">Go Home</a>
</section>

<script>
	export let pathName
</script>

<style lang="scss">
	section {
		padding: 2em;

		h2 {
			margin-bottom: 1.5em;
			font-size: 1.3em;
		}

		a {
			padding: 1em 1.5em;
		}
	}
</style>
