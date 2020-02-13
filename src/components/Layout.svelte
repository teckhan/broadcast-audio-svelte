{#await forLayout}
	<div>Loading</div>
{:then LayoutModule}
	<svelte:component this={ LayoutModule }>
		<slot />
	</svelte:component>
{:catch}
	<slot />
{/await}

<script>
	export let layoutName

	const normalizeModule = m => m.default || m

	$: forLayout = new Promise((resolve, reject) => {
		switch (layoutName) {
			case 'LayoutPrimary':
				import('~components/LayoutPrimary').then(normalizeModule).then(resolve).catch(reject)
				break

			case 'LayoutTest':
				import('~components/LayoutTest').then(normalizeModule).then(resolve).catch(reject)
				break

			default:
				reject()
		}
	})

	// load for offline use
	const loadOffline = () => {
		try {
			import('~components/LayoutPrimary').then(() => console.info('LayoutPrimary is loaded for offline use.'))
			import('~components/LayoutTest').then(() => console.info('LayoutTest is loaded for offline use.'))
		} catch (error) {}
	}

	loadOffline()
</script>
