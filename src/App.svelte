<Layout { layoutName }>
	<svelte:component this={ Route } { pathName } />
</Layout>

<script>
	import 'normalize.css'
	import Layout from '~components/Layout'

	import Navaid from 'navaid'
	import { onMount } from 'svelte'

	let Route,
		pathName = {},
		layoutName

	function useRoute(m, p) {
		Route = m.default || m
		pathName = p || {}
		layoutName = m.layout
	}

	function track(obj) {
		if (window.ga) {
			ga.send('pageview', { dp:obj.uri })
		}
	}

	const router = (
		Navaid('/', p => import('~pages/404').then(m => useRoute(m, p)))
			.on('/', p => import('~pages/Callee').then(m => useRoute(m, p)))
			.on('/caller', p => import('~pages/Caller').then(m => useRoute(m, p)))
	)

	onMount(() => {
		router.listen()
		addEventListener('replacestate', track)
		addEventListener('pushstate', track)
		addEventListener('popstate', track)

		return () => {
			removeEventListener('replacestate', track)
			removeEventListener('pushstate', track)
			removeEventListener('popstate', track)
			router.unlisten()
		}
	})
</script>

<style lang="scss" global>
	@import 'src/assets/styles/global.scss';
	@import 'src/assets/styles/app.scss';
</style>
