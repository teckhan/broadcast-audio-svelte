<main class="dark">
	<div style="margin: auto; text-align: center">
		<input type="password" value="abcd1234">
		<br>
		<button class="app-button">Start</button>
	</div>

	<a href='/404'>go 404</a>
</main>

<script context="module">
	export const layout = 'LayoutPrimary'
</script>

<script>
	const domain = process.env.API_URL
	const peer = new RTCPeerConnection()

	const RTCLib = {
		asyncGetRemoteSdp: async ({ domain }) => {
			try {
				return (await (await fetch(`${domain}/sdp`)).json()).sdp
			} catch (error) {
				return
			}
		},
		asyncAcceptSdp: async ({ sdp, peer }) => {
			if (!sdp)
				return

			return //
			await peer.setRemoteDescription(sdp)

			const answer = await peer.createAnswer()

			peer.setLocalDescription(answer)
		}
	}

	let sdp
	let retryCount = 0
	const retryLimit = 10

	$: {
		if (!sdp) {
			if (retryCount < retryLimit) {
				RTCLib.asyncGetRemoteSdp({ domain }).then((fetchedSdp) => {
					if (fetchedSdp) {
						sdp = fetchedSdp
					} else {
						setTimeout(() => retryCount++, 5000)
					}
				})
			} else {
				console.log('stop trying')
			}

		}
	}
	$: RTCLib.asyncAcceptSdp({ sdp, peer })

	// class RTCLibrary {
	// 	constructor({ domain }) {
	// 		this._domain = domain
	// 		this._peer = new RTCPeerConnection()
	// 		this._sdp = 'hello'

	// 		setTimeout(() => this._sdp = 'world', 1000)

	// 		console.log(this._sdp)
	// 		setTimeout(() => console.log(this._sdp), 2000)
	// 	}

	// 	get sdp () { return this._sdp }
	// 	set sdp (sdp) { this._sdp = sdp }

	// 	async getSdp() {
	// 		return new Promise(async (resolve, reject) => {
	// 			const retry = () => {
	// 				reject()
	// 				// setTimeout(this.sdp, 3000)
	// 				console.log('failed, retry')
	// 			}

	// 			const fetchResult = await fetch(`${this._domain}/sdp`).catch(error => { retry() })
	// 			const result = await fetchResult.json()


	// 			if (!result.sdp) {
	// 				retry()
	// 			}

	// 			resolve(result.sdp)
	// 		})
	// 	}
	// }

	const forRTCConnection = new Promise(async (resolve, reject) => {
		resolve('')
	})

	peer.oniceconnectionstatechange = event => {
		const state = peer.iceConnectionState
		console.info('State: ', state)
	}

	peer.onicecandidate = async event => {
		if (event.candidate) return
		// peer.addIceCandidate(event.candidate) // unfinished

		await (await fetch(`${domain}/sdp`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				sdp: peer.localDescription
			})
		})).json()
	}

	peer.ondatachannel = event => {
		channel = event.channel

		channel.onmessage = event => {
			console.log('Receipient receives: ', event.data)
		}

		channel.onopen = _ => {
			channel.send("Sent from Receipient: Channel Established!")
		}
	}

	peer.ontrack = event => {
		console.log(event.stream[0])
		// document.getElementById('player').srcObject = event.streams[0]
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
