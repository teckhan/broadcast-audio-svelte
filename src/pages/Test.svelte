<section style="margin: auto; text-align: center">
	Test
</section>

<script>
	// import 'https://webrtc.github.io/adapter/adapter-latest.js' // global

	const peers = {}
	const forStream = navigator.mediaDevices.getUserMedia({ audio: true, video: false })
	const ws = new WebSocket(process.env.API_WS_URL)

	ws.onmessage = async (message) => {
		console.log(message.data)
		try {
			message = JSON.parse(message.data)

			switch (message.type) {
				case 'REQUEST_SDP': {
					const peer = new PeerEntity()
					await peer.forCreate({ forStream })
					peers[peer.id] = peer

					ws.send(JSON.stringify({
						secret: process.env.API_WS_SECRET,
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
				}
			}
		} catch (error) {}
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
				this.peer.addTrack((await forStream).getAudioTracks()[0], await forStream)
				this.peer.setLocalDescription(await this.peer.createOffer())
				this.peer.onicecandidate = async event => {
					if (event.candidate) return
					resolve()
				}
			})
		}

		async accept ({ sdp }) {
			this.peer.setRemoteDescription(sdp)
		}
	}
</script>
