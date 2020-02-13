<div>
	<h1>this is 404 page.</h1>
	{#if pathName}
		<p>Couldn't navigation to { pathName }</p>
	{/if}
	<a href='/'>Go Home</a>
</div>

<script>
	export let pathName
</script>

<script context="module">
	export const layout = 'LayoutTest'
</script>
