/* eslint-disable no-undef */

workbox.setConfig({
	// debug: true
})

workbox.precaching.precacheAndRoute([
	'/',
	'/404'
])

workbox.routing.registerRoute(
	/api/,
	new workbox.strategies.NetworkFirst({
		cacheName: 'api'
	})
)

workbox.routing.registerRoute(
	/cdn/,
	new workbox.strategies.StaleWhileRevalidate({
		cacheName: 'cdn'
	})
)

workbox.routing.registerRoute(
	/auth/,
	new workbox.strategies.NetworkOnly({
		cacheName: 'auth'
	})
)

// Cache the Google Fonts webfont files with a cache first strategy for 1 year.
workbox.routing.registerRoute(
	/^https:\/\/fonts\.gstatic\.com/,
	new workbox.strategies.CacheFirst({
		cacheName: 'google-fonts-webfonts',
		plugins: [
			new workbox.cacheableResponse.Plugin({
				statuses: [0, 200]
			}),
			new workbox.expiration.Plugin({
				maxAgeSeconds: 60 * 60 * 24 * 365
			})
		]
	})
)

workbox.routing.registerRoute(
	/\.(?:woff|woff2|ttf)$/,
	new workbox.strategies.CacheFirst({
		cacheName: 'google-fonts-webfonts'
	})
)

workbox.routing.registerRoute(
	/\.(?:js|css)$/,
	new workbox.strategies.StaleWhileRevalidate()
)

workbox.routing.registerRoute(
	/\.(?:png|gif|jpg|jpeg|svg)$/,
	new workbox.strategies.CacheFirst({
		cacheName: 'images',
		plugins: [
			new workbox.expiration.Plugin({
				maxEntries: 60,
				maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
			})
		]
	})
)

self.addEventListener('message', event => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting()
	}
})

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.filter(cacheName => {
					// Return true if you want to remove this cache,
					// but remember that caches are shared across
					// the whole origin
					return true
				}).map(cacheName => caches.delete(cacheName))
			)
		})
	)
})
