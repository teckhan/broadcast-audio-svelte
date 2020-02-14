import '@babel/polyfill'
import GAnalytics from 'ganalytics'
import App from './App.svelte'

const app = new App({
	target: document.body
})

if (process.env.NODE_ENV === 'production') {
	app.ga = new GAnalytics('UA-XXXXXXXX-X')

	// // Service Worker registration
	// if ('serviceWorker' in navigator) {
	// 	navigator.serviceWorker.register('./sw.js')
	// }
}

export default app;
