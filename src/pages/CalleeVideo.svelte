<section style="margin: auto; text-align: center">
	{#await forVideoStream}
		<h1>Welcome to livebroadcast!</h1>
		<p>Loading...</p>
	{:then}
		{#if !broadcastConnectionHasFailed}
			<button bind:this={ playButton } class="app-button" on:click={ player.play }>Start</button>
		{:else}
			<h2>Connection Failed</h2>

			<a href='javascript:window.location.reload(true)' class="app-button">Retry</a>
		{/if}
	{:catch}
		<h1>Cannot connect at the moment.<br>Please try again later</h1>

		<a href='javascript:window.location.reload(true)' class="app-button">Retry</a>
	{/await}
	<video bind:this={ video } style="width: 100%; display: block"></video>
</section>

<script context="module">
	export const layout = 'LayoutPrimary'
</script>

<script>
	import { onMount } from 'svelte'
	import pRetry from 'p-retry'

	const domain = process.env.API_URL

	let video
	let playButton
	let broadcastConnection
	let broadcastConnectionHasFailed = false
	let retryCount = 0
	const retryLimit = 10
	const peer = new RTCPeerConnection()

	const player = {
		play: () => {
			playButton.disabled = true
			playButton.textContent = 'playing'
			video.play()
		}
	}

	const RTCLib = {
		asyncGetBroadcastConnection: async ({ domain }) => {
			try {
				return (await (await fetch(`${domain}/sdp`)).json()).data
			} catch (error) {
				return
			}
		},
		asyncAcceptSdp: async ({ peer, sdp }) => {
			if (!sdp)
				return

			await peer.setRemoteDescription(sdp)

			const answer = await peer.createAnswer()

			peer.setLocalDescription(answer)
		}
	}

	const forVideoStream = new Promise(async (resolve, reject) => {
		// get broadcast connection with 10 retries
		broadcastConnection = await pRetry(async () => {
			const data = await RTCLib.asyncGetBroadcastConnection({ domain })

			if (!data) {
				throw new Error('no data')
			}

			return data
		}, { retries: 10 }).catch(reject)

		if (!broadcastConnection) // stop procedure if failed
			return

		// accept broadcast connection
		await RTCLib.asyncAcceptSdp({ peer, sdp: broadcastConnection.sdp })

		// await server reconfirmation

		resolve()
	})

	onMount(async () => {
		peer.onicecandidate = async event => {
			if (event.candidate) return

			await (await fetch(`${domain}/sdp`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: broadcastConnection.id,
					sdp: peer.localDescription
				})
			})).json()
		}

		peer.oniceconnectionstatechange = event => {
			switch (peer.iceConnectionState) {
				case 'disconnected': {
					broadcastConnectionHasFailed = true
					break;
				}
			}
		}

		peer.ontrack = event => {
			console.log(event.streams[0])
			video.srcObject = event.streams[0]
		}
	})
</script>

<style lang="scss">
	section {
		padding: 2em;

		h1, h2 {
			margin-bottom: 1.5em;
			font-size: 1.3em;
		}

		button, a {
			padding: 1em 1.5em;
		}

		video {
			transform: scaleX(-1)
		}
	}
</style>
