<main class="dark">
	<div style="margin: auto; text-align: center">
		{#await forRTCConnection}
			<h1>Loading...</h1>
		{:then peer}
			<h1>Welcome to livebroadcast!</h1>
			<button class="app-button" on:click={ player.play }>Start</button>
			<audio bind:this={ audio } autoplay playsinline></audio>
			<!-- <audio id="player" controls autoplay></audio> -->
		{:catch}
			<h1>X_X Something bad happened.</h1>
		{/await}
	</div>

	<a href='/404'>go 404</a>
</main>

<script context="module">
	export const layout = 'LayoutPrimary'
</script>

<script>
	const domain = process.env.API_URL
	const peer = new RTCPeerConnection()
	let audio, stream
	$: if (stream && audio.srcObject !== stream) {
		audio.srcObject = stream
	}

	const player = {
		play: () => {
			console.log('PLAY!')
		}
	}

	const RTCLib = {
		asyncGetRemoteSdp: async ({ domain }) => {
			try {
				return (await (await fetch(`${domain}/sdp`)).json()).sdp
			} catch (error) {
				return
			}
		},
		asyncGetRemoteData: async ({ domain }) => {
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

	let remoteData
	let retryCount = 0
	const retryLimit = 10

	$: {
		if (!remoteData) {
			if (retryCount < retryLimit) {
				RTCLib.asyncGetRemoteData({ domain }).then((data) => {
					if (data) {
						remoteData = data
					} else {
						setTimeout(() => retryCount++, 5000)
					}
				})
			} else {
				console.log('stop trying')
			}

		}
	}
	$: RTCLib.asyncAcceptSdp({ peer, sdp: remoteData ? remoteData.sdp : null })

	const forRTCConnection = new Promise(async (resolve, reject) => {
		resolve('')
	})

	peer.onicecandidate = async event => {
		if (event.candidate) return

		await (await fetch(`${domain}/sdp`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id: remoteData.id,
				sdp: peer.localDescription
			})
		})).json()
	}

	peer.ontrack = event => {
		stream = event.streams[0]
	}
</script>

<style lang="scss">
	main {
		padding: 2em;

		h1 {
			margin-bottom: 1.5em;
			font-size: 1.3em;
		}

		button {
			padding: 1em 1.5em;
		}
	}
</style>
