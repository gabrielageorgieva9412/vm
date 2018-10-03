let socket = null;
let localVideo = null;
let remoteContainer = null;
let stateSpan = null;
let localStream = null;
let peerConnection = null;
let usePlanB = false;
let roomId = null;
let isOwner = false;
let $ = window.$;
var messageReceived = null;
var printedMessages = [];

Notification.requestPermission().then(function (result) {
	console.log(result);
});

Notification.onclick = function () {
	window.focus();
};

function spawnNotification(theBody, theTitle) {
	var options = {
		body: theBody
	};
	var n = new Notification(theTitle, options);
	setTimeout(n.close.bind(n), 5000);
}

function showNotifications(data) {
	spawnNotification(data, 'New Message');
}

function handleVisibilityChange(data) {
	if (document.hidden) {
		showNotifications(data);
	}
}

function init() {
	localVideo = document.getElementById('local_video');
	remoteContainer = document.getElementById('remote_container');
	stateSpan = document.getElementById('state_span');
	messageReceived = document.getElementById('conversation');

	if (window.window.webkitRTCPeerConnection) {
		usePlanB = true;
	}

	navigator.getUserMedia = navigator.getUserMedia ||
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia ||
		navigator.msGetUserMedia;

	RTCPeerConnection = window.RTCPeerConnection ||
		window.webkitRTCPeerConnection ||
		window.mozRTCPeerConnection;

	RTCSessionDescription = window.RTCSessionDescription ||
		window.webkitRTCSessionDescription ||
		window.mozRTCSessionDescription;

	initSocketIo();

	updateView();
}

function initSocketIo() {
	socket = io();
	var cookieData = document.cookie.split(';');
	cookieData[0] = cookieData[0].split('=');
	cookieData[1] = cookieData[1].split('=');
	cookieData[2] = cookieData[2].split('=');
	socket.on('error', function (err) {
		console.error('Socket.io error:', err);
	});

	socket.on('list', function (rooms) {
		console.log('Receive [list]: ', rooms);
		listRooms(rooms);
	});

	socket.on('room-created', function (room) {
		console.log('Receive [room-created]: ', room);
		joinNewRoom(room.id, room.name);
		printedMessages = [];
		var userData = {};
		userData.userId = cookieData[2][1];
		userData.roomId = room.id;
		send('user', userData);
	});

	socket.on('streamed', (rawData) => {
		console.log(rawData);
		var data = JSON.parse(rawData);
		if (!isOwner) {
			replaceVideos(data.ownerStreamId);
			printMessages(data.messages);
		}

	});

	socket.on('offer', function (sdp) {
		console.log('Receive [offer]: ', sdp);
		let offer = new RTCSessionDescription({
			type: 'offer',
			sdp: sdp
		});
		setOffer(offer);
	});

	socket.on('answer', function (sdp) {
		console.log('Receive [answer]: ', sdp);
		let answer = new RTCSessionDescription({
			type: 'answer',
			sdp: sdp
		});
		setAnswer(answer);
	});

	socket.on('reply', function (sdp) {
		console.log('Receive [answer]: ', sdp);
		sdp = JSON.parse(sdp);
		var message = document.createElement('p');
		message.innerText = sdp.firstName + ' ' + sdp.lastName + ': ' + sdp.message + 'Sent from: ' + sdp.city;
		messageReceived.appendChild(message);
		document.addEventListener('visibilitychange', handleVisibilityChange(sdp), false);
	});

	socket.on('send', function (sdp) {
		console.log(sdp);
	});

	document.getElementById('send').addEventListener('click', () => {

		$.getJSON('//ipinfo.io/json', function (data) {

			var message = {};
			message.message = document.getElementById('sendMessageText').value;
			message.firstName = cookieData[0][1];
			message.lastName = cookieData[1][1];
			message.userId = cookieData[2][1];
			message.city = data.city;
			message.roomId = roomId;
			socket.emit('message', JSON.stringify(message));
			document.getElementById('sendMessageText').value = '';
		});
	});

	send('list');
}

function printMessages(messages) {

	for (var msg of messages) {

		if (!printedMessages.includes(msg.id)) {
			var message = document.createElement('p');
			message.innerText = msg.first_name + ' ' + msg.last_name + ': ' + msg.message;
			messageReceived.appendChild(message);
			printedMessages.push(msg.id);
		}

	}

}

function replaceVideos(ownerID) {
	document.getElementById('local_video').style.display = 'none';
	var remoteVideo = document.getElementById('remote_' + ownerID);
	document.getElementById('local_video_holder').appendChild(remoteVideo);
	remoteVideo.play();
}

function sendOffer(sdp) {
	send('join', {
		planb: usePlanB,
		roomId: roomId,
		sdp: sdp
	});
}

function sendAnswer(answer) {
	send('joined', answer);
}

function send(type, data) {
	console.log('Sending [' + type + ']: ', data);
	socket.emit(type, data);
}

function appendRoom(id, name) {
	let roomsDiv = document.getElementById('rooms');

	var newDiv = document.createElement('button');
	newDiv.classList.add('room');
	newDiv.onclick = function () {
		joinRoom(id, false);
	};

	var newContent = document.createTextNode(name);

	newDiv.appendChild(newContent);
	roomsDiv.appendChild(newDiv);
}

function joinNewRoom(id, name) {
	appendRoom(id, name);
	joinRoom(id, true);
	printedMessages = [];
	messageReceived.innerHTML = '';
}

function joinRoom(id, isOwner) {
	roomId = id;

	startVideo(isOwner, roomId);
	printedMessages = [];
	messageReceived.innerHTML = '';
}

function listRooms(rooms) {
	document.getElementById('rooms').innerHTML = '';
	for (let id in rooms) {
		appendRoom(id, rooms[id]);
	}
}

function createRoom() {
	let element = document.getElementById('newRoom');
	let name = element.value;
	if (!name.length) {
		return alert('Please specify room name');
	}

	send('create-room', name);

	isOwner = true;
}

function startVideo(isOwner, roomId) {
	getDeviceStream({ video: isOwner, audio: true })
		.then(function (stream) { // success
			localStream = stream;
			logStream('Local stream', stream);
			playVideo(localVideo, stream);

			connect(roomId);
			updateView();

		}).catch(function (error) { // error
			console.error('getUserMedia error:', error);

			return;
		});
}

function stopVideo() {
	pauseVideo(localVideo);
	stopLocalStream(localStream);
	localStream = null;

	updateView();
}

function stopLocalStream(stream) {
	let tracks = stream.getTracks();
	if (!tracks) {
		console.warn('NO tracks');

		return;
	}

	for (let track of tracks) {
		track.stop();
	}
}

function getDeviceStream(option) {
	if ('getUserMedia' in navigator.mediaDevices) {
		return navigator.mediaDevices.getUserMedia(option);
	}

	return new Promise(function (resolve, reject) {
		navigator.getUserMedia(option,
			resolve,
			reject
		);
	});

}

function playVideo(element, stream) {
	if (isOwner) {
		socket.emit('streaming', stream.id);
	}
	if ('srcObject' in element) {
		element.srcObject = stream;
	}
	else {
		element.src = window.URL.createObjectURL(stream);
	}
	element.play();
	element.volume = 0;
}

function pauseVideo(element) {
	element.pause();
	if ('srcObject' in element) {
		element.srcObject = null;
	}
	else {
		if (element.src && (element.src !== '')) {
			window.URL.revokeObjectURL(element.src);
		}
		element.src = '';
	}
}

function prepareNewConnection() {
	let pc_config = { 'iceServers': [] };
	let peer = new RTCPeerConnection(pc_config);

	if ('ontrack' in peer) {
		peer.ontrack = function (event) {
			let stream = event.streams[0];
			logStream('Remote stream on track', stream);
			if ((stream.getVideoTracks().length > 0) && (stream.getAudioTracks().length > 0)) {
				addRemoteVideo(stream.id, stream);
			}

		};
	}
	else {
		peer.onaddstream = function (event) {
			let stream = event.stream;
			logStream('Remote stream added', stream);

			addRemoteVideo(stream.id, stream);
		};
	}

	peer.onicecandidate = function (evt) {
		if (evt.candidate) {
			console.log(evt.candidate);
		} else {
			console.log('Empty ICE event');
		}
	};
	peer.onnegotiationneeded = function (evt) {
		console.log('Negotiation needed');
	};

	peer.onicecandidateerror = function (evt) {
		console.error('ICE candidate ERROR:', evt);
	};
	peer.onsignalingstatechange = function () {
		console.log('Signaling state changed: ' + peer.signalingState);
	};
	peer.oniceconnectionstatechange = function () {
		console.log('ICE connection state changed: ' + peer.iceConnectionState);
		showState('ICE connection state changed: ' + peer.iceConnectionState);
		if (peer.iceConnectionState === 'disconnected') {
			console.log('ICE disconnected');
			hangUp();
		}
	};
	peer.onicegatheringstatechange = function () {
		console.log('ICE gathering state changed: ' + peer.iceGatheringState);
	};

	peer.onconnectionstatechange = function () {
		console.log('Connection state changed: ' + peer.connectionState);
	};
	peer.onremovestream = function (event) {
		console.log('Stream removed');
		let stream = event.stream;
		removeRemoteVideo(stream.id, stream);
	};

	if (localStream) {
		console.log('Adding local stream');
		peer.addStream(localStream);
	}
	else {
		console.warn('No local stream found, continue anyway.');
	}

	return peer;
}

function makeOffer() {
	peerConnection = prepareNewConnection();
	peerConnection.createOffer({
		offerToReceiveAudio: 1,
		offerToReceiveVideo: 1
	})
		.then(function (sessionDescription) {
			console.log('Offer created');
			sendOffer(sessionDescription.sdp);
		})
		.catch(function (err) {
			console.error(err);
		});
}

function setOffer(sessionDescription) {
	if (peerConnection) {
		console.log('Peer connection alreay exist, reuse it');
	}
	else {
		console.log('Create new Peer connection');
		peerConnection = prepareNewConnection();
	}
	peerConnection.setRemoteDescription(sessionDescription)
		.then(function () {
			console.log('Set remote description');
			makeAnswer();
		}).catch(function (err) {
			console.error('Set remote description error: ', err);
		});
}

function makeAnswer() {
	console.log('Create remote session description');
	if (!peerConnection) {
		console.error('Peer connection doesn\'t exist');

		return;
	}

	peerConnection.createAnswer()
		.then(function (sessionDescription) {
			console.log('Create answer');

			return peerConnection.setLocalDescription(sessionDescription);
		}).then(function () {
			let answer = peerConnection.localDescription;
			sendAnswer(answer);
		}).catch(function (err) {
			console.error(err);
		});
}

function setAnswer(sessionDescription) {
	if (!peerConnection) {
		console.error('Peer connection doesn\'t exist');

		return;
	}
	peerConnection.setRemoteDescription(sessionDescription)
		.then(function () {
			console.log('Set remote description');
		}).catch(function (err) {
			console.error('Set remote description error: ', err);
		});
}

function connect(roomId) {
	makeOffer();
	updateView();
	var cookieData = document.cookie.split(';');
	cookieData[0] = cookieData[0].split('=');
	cookieData[1] = cookieData[1].split('=');
	cookieData[2] = cookieData[2].split('=');
	var userData = {};
	userData.userId = cookieData[2][1];
	userData.roomId = roomId;
	send('user', userData);
}

function dissconnect() {
	send('quit');

	if (peerConnection) {
		console.log('Quiting');
		peerConnection.close();
		peerConnection = null;

		removeAllRemoteVideo();
	}
	else {
		console.warn('Peer doesn\'t exist');
	}

	stopVideo();
	updateView();

	messageReceived.innerHTML = '';
	printedMessages = [];
}

function showState(state) {
	stateSpan.innerText = state;
}

function logStream(msg, stream) {
	console.log(msg + ': id: ' + stream.id);

	let videoTracks = stream.getVideoTracks();
	if (videoTracks) {
		console.log('Video tracks length: ' + videoTracks.length);
		videoTracks.forEach(function (track) {
			console.log(' track id: ' + track.id);
		});
	}

	let audioTracks = stream.getAudioTracks();
	if (audioTracks) {
		console.log('Audio tracks length: ' + audioTracks.length);
		audioTracks.forEach(function (track) {
			console.log(' track id: ' + track.id);
		});
	}
}

function addRemoteVideo(id, stream) {
	let element = document.createElement('video');
	remoteContainer.appendChild(element);
	element.id = 'remote_' + id;
	element.width = 640;
	element.height = 480;
	element.srcObject = stream;

	element.play();
	element.volume = 1;
	element.controls = true;
	// element.style.display = "none";
}

function removeRemoteVideo(id, stream) {
	console.log('Remote video removed id: ' + id);
	let element = document.getElementById('remote_' + id);
	if (element) {
		element.pause();
		element.srcObject = null;
		remoteContainer.removeChild(element);
	}
	else {
		console.log('Remote video element not found');
	}
}

function removeAllRemoteVideo() {
	while (remoteContainer.firstChild) {
		remoteContainer.firstChild.pause();
		remoteContainer.firstChild.srcObject = null;
		remoteContainer.removeChild(remoteContainer.firstChild);
	}
}

function updateView() {
	if (peerConnection) {
		hideElement('roomsSelect');
		showElement('conference');
		enabelElement('disconnect_button');
	}
	else {
		showElement('roomsSelect');
		hideElement('conference');
		disableElement('disconnect_button');
	}
}

function enabelElement(id) {
	let element = document.getElementById(id);
	if (element) {
		element.removeAttribute('disabled');
	}
}

function disableElement(id) {
	let element = document.getElementById(id);
	if (element) {
		element.setAttribute('disabled', '1');
	}
}

function hideElement(id) {
	let element = document.getElementById(id);
	if (element) {
		element.style.display = 'none';
	}
}

function showElement(id) {
	let element = document.getElementById(id);
	if (element) {
		element.style.display = 'block';
	}
}