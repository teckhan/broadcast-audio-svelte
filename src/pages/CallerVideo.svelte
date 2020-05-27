<section style="margin: auto; text-align: center">
	{#await forWSAuthentication}
		<h1>Waiting for authentication</h1>
	{:then}
		{#if player.isEnded}
			Session ended.
		{:else}
			<p>{ peersCount } people { peersCount > 1 ? 'are' : 'is' } live.</p>
			<div>
				<button class="app-button" on:click={ player.forStop }>Stop</button>
			</div>
		{/if}
	{:catch}
		<h2>Connection Failed</h2>

		<a href='javascript:window.location.reload(true)' class="app-button">Retry</a>
	{/await}
</section>

<script context="module">
	export const layout = 'LayoutPrimary'
</script>

<script>
	// import 'https://webrtc.github.io/adapter/adapter-latest.js' // global

	const peers = {}
	const forStream = window.forStream = navigator.mediaDevices.getUserMedia({ audio: true, video: true })
	let peersCount = 0
	let ws

	const player = {
		isEnded: false,
		forStop: async () => {
			(await forStream).getTracks().forEach(track => track.stop())
			player.isEnded = true
		}
	}

	class PeerEntity {
		constructor () {
			this.id = PeerEntity.incrementId()
			this.peer = new RTCPeerConnection()
		}

		static incrementId() {
			if (!this.latestId) this.latestId = 1
			else this.latestId++
			return this.latestId
		}

		forCreate ({ forStream }) {
			return new Promise(async (resolve, reject) => {
				this.peer.addTrack((await forStream).getVideoTracks()[0], await forStream)
				this.peer.addTrack((await forStream).getAudioTracks()[0], await forStream)

				this.peer.setLocalDescription(await this.peer.createOffer())
				this.peer.onicecandidate = event => {
					if (event.candidate) return
					resolve()
				}
				this.peer.oniceconnectionstatechange = event => {
					switch (this.peer.iceConnectionState) {
						case 'disconnected': {
							this.peer.close()
							this.peer = null
							delete peers[this.id]
							peersCount--
							break
						}

						case 'connected': {
							peersCount++
							break
						}
					}
				}
			})
		}

		async accept ({ sdp }) {
			this.peer.setRemoteDescription(sdp)
		}
	}

	const asyncConnectWSServer = async (secret) => {
		return new Promise((resolve, reject) => {
			ws = new WebSocket(process.env.API_WS_URL)

			ws.onerror = () => reject()

			ws.onopen = () => {
				ws.send(JSON.stringify({
					type: 'AUTH',
					secret
				}))
			}

			ws.onmessage = async (message) => {
				// console.log(message.data)
				try {
					message = JSON.parse(message.data)

					switch (message.type) {
						case 'REQUEST_SDP': {
							const peer = new PeerEntity()
							await peer.forCreate({ forStream })
							peers[peer.id] = peer

							ws.send(JSON.stringify({
								secret,
								type: 'NEW_PEER',
								data: {
									id: peer.id,
									sdp: peer.peer.localDescription
								}
							}))

							break
						}

						case 'ACCEPT_SDP': {
							const data = message.data
							peers[data.id].accept({ sdp: data.sdp })

							break
						}

						case 'AUTH': {
							const data = message.data
							if (data.isAuthorized) {
								resolve()
							} else {
								ws.close()
								reject()
							}
							break
						}
					}
				} catch (error) {}
			}
		})
	}

	const forWSAuthentication = new Promise(async (resolve, reject) => {
		const secret = prompt("Enter Password: ")

		if (secret) {
			asyncConnectWSServer(secret)
				.then(resolve)
				.catch(reject)
		} else {
			await player.forStop()
			reject()
		}
	})
</script>

<style lang="scss">
	section {
		padding: 2em;

		h2 {
			margin-bottom: 1.5em;
			font-size: 1.3em;
		}

		button, a {
			padding: 1em 1.5em;
		}
	}
</style>
