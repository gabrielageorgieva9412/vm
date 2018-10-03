'use strict';

//process.env.DEBUG = "mediasoup*";

const fs = require('fs');
const ip = require('ip');
const path = require('path');

const roomCreatedByConnection = {};
var streamCollection = [];
var streamRoomCollection = [];
var messageController = require('./controllers/message-controller');
var videoController = require('./controllers/video-controller');
var videoData = [];
const { WebRtcServer, RtspServer, ffmpeg } = require('./index.js');

const recordingsPath = path.join(__dirname, 'recordings');
const ipAddress = ip.address();
const streamer = new ffmpeg({
	enableDebug: true
});

function removeDuplicates(originalArray, prop) {
	var newArray = [];
	var lookupObject = {};

	for (var i in originalArray) {
		lookupObject[originalArray[i][prop]] = originalArray[i];
	}

	for (i in lookupObject) {
		newArray.push(lookupObject[i]);
	}

	return newArray;
}

const webRtcServer = new WebRtcServer();
webRtcServer
	.listen({
		enableDebug: true,
		key: fs.readFileSync('./keys/server.key'),
		cert: fs.readFileSync('./keys/server.crt'),
		port: 8100,
		path: 'public',
	})
	.on('listen', () => {
		console.log('Hangouts 2.0 test started');
	})
	.on('web-listen', (port) => {
		console.log(`Open https://${ipAddress}:${port} with browser`);
	})
	.on('new-connection', (connection) => {
		console.log(`New connection [${connection.id}]`);

		connection
			.on('error', (err) => {
				console.log(`Connection [${connection.id}] error: ${err}`);
			})
			.on('receive', (action, data) => {
				if (action === 'join') {
					// event on user join in a room
					console.log(connection);
				}

				if (action === 'joined') {
					var ownerStreamId = streamRoomCollection.find(conn => conn.roomId === connection.roomId).streamId;

					messageController.getMessages(connection.roomId).then((messages) => {
						connection.server.io.sockets.in(connection.roomId).emit('streamed', JSON.stringify({ 'messages': messages, 'ownerStreamId': ownerStreamId }));
					});
				}

				if (action === 'quit') {
					if (connection.id === roomCreatedByConnection[connection.roomId]) {
						console.log('OWNER JUST QUIT');
						connection.server.removeRoom(connection.roomId);
						connection.server.io.sockets.in(connection.roomId).emit('list', connection.server.getRoomsList());
					}
				}
				if (action === 'list') {
					console.log('LISTED');
				}

				if (action === 'streaming') {
					console.log('STREAM ID OF OWNER ' + data);
					// streamRoomCollection.push({'connectionId' : connection.id, 'streamId' : data});
					var currentRoomOwner = streamRoomCollection.find(conn => conn.connectionId === connection.id);
					currentRoomOwner['streamId'] = data;
				}
				console.log(`Connection [${connection.id}] receive [${action}]`);
			})
			.on('send', (action, data) => {
				console.log(`Connection [${connection.id}] send [${action}]`);
				if (action === 'reply') {
					connection.server.io.sockets.in(connection.roomId).emit('reply', data);
					messageController.insertMessage(data);
				}
				if (action === 'room-created') {
					roomCreatedByConnection[data.id] = connection.id;
					var existingConn = streamRoomCollection.find(conn => conn.connectionId === connection.id);
					if (existingConn) {
						existingConn.roomId = data.id;
					} else {
						streamRoomCollection.push({ 'connectionId': connection.id, 'roomId': data.id });
					}
				}
				if (action === "user") {
					videoData.push({ roomId: data.roomId, userId: data.userId });
				}
			})
			.on('new-stream', (stream) => {
				console.log(`Connection [${connection.id}] peer [${stream.peer.id}] new stream [${stream.id}]`);
			})
			.on('ready', (peerConnection) => {
				console.log(`Connection [${connection.id}] peer [${peerConnection.peer.id}] ready`);
			})
			.on('close', (peerId) => {
				console.log(`Connection [${connection.id}] peer [${peerId}] closed`);
			})
			.on('disconnect', (err) => {
				console.log(`Connection [${connection.id}] signaling disconnected`);
				connection = null;
			});
	});

const rtspServer = new RtspServer(webRtcServer);
rtspServer
	.listen(8101)
	.on('listen', (port) => {
		console.log(`RTSP server started rtsp://${ipAddress}:${port}`);
	})
	.on('new-source', (source) => {
		let rtspUrl = `rtsp://${ipAddress}:${rtspServer.port}/${source.id}.sdp`;
		console.log(`New RTSP source ${rtspUrl}`);

		let process;
		let processMerge;
		source.on('enabled', () => {
			let filepath = `${recordingsPath}/${source.connection.roomId}/${source.id}.mp4`;
			let logpath = `${recordingsPath}/${source.connection.roomId}/${source.id}.log`;

			var dir = `${recordingsPath}/${source.connection.roomId}`;
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir);
			}

			// streamCollection.push({ stream: source.id, time: Date.now(), room: source.connection.roomId });
			streamCollection[source.connection.roomId] = [];
			streamCollection[source.connection.roomId].push({ stream: source.id, time: Date.now() });

			console.log(`Recording [${source.id}]: ${filepath}`);

			process = streamer.record(rtspUrl, filepath, logpath)
				.on('error', (err) => {
					console.error(`Streamer [${source.id}] error: ${err}`);
				})
				.on('exit', (code, signal) => {
					console.log(`Streamer [${source.id}] closed, log: ${logpath}`);
					if (streamCollection[source.connection.roomId][0].stream == source.id) {
						//finish
						console.log('Merging.......');
						for (var i = 0; i < streamCollection[source.connection.roomId].length; i++) {
							if (i == 0) {
								streamCollection[source.connection.roomId][i].stream = `${recordingsPath}/${source.connection.roomId}/${streamCollection[source.connection.roomId][i].stream}.mp4`;
							} else {
								streamCollection[source.connection.roomId][i].offSet = (streamCollection[source.connection.roomId][i].time - sstreamCollection[source.connection.roomId][0].time) / 1000;
								streamCollection[i].stream = `${recordingsPath}/${source.connection.roomId}/${streamCollection[source.connection.roomId][i].stream}.mp4`;
							}
						}

						var uniqueArray = removeDuplicates(streamCollection[source.connection.roomId], "stream");
						var outputFile = `${recordingsPath}/${source.connection.roomId}.mp4`;
						processMerge = streamer.mergeRecords(uniqueArray, outputFile, `${recordingsPath}/${source.connection.roomId}.log`)
							.on('exit', (code, signal) => {
								console.log('MERGE COMPLETE!');
								//todo insert path to final video to db
								var uniqueVideoData = removeDuplicates(videoData, "userId");
								uniqueVideoData.forEach(function (data) {
									if (data.roomId == source.connection.roomId) {
										data.videoPath = "/" + source.connection.roomId + ".mp4";
										data.name = source.connection.roomId;
										data.created = Date.now();
										videoController.insertVideo(data);
									}
								}, this);

								const directory = `./recordings/${source.connection.roomId}`;
								var deleteFolderRecursive = function (directory) {
									if (fs.existsSync(directory)) {
										fs.readdirSync(directory).forEach(function (file, index) {
											var curPath = directory + '/' + file;
											if (fs.lstatSync(curPath).isDirectory()) { // recurse
												deleteFolderRecursive(curPath);
											} else { // delete file

												console.log('Deleting ' + curPath);
												fs.unlinkSync(curPath);

											}
										});
										fs.rmdirSync(directory);
									}
								};
								deleteFolderRecursive(directory);
							});

					}
				});
		})
			.on('error', (err) => {
				console.error(`RTSP Source [${source.id}] error:`, err);
			});
	})
	.on('client-connected', (client) => {
		console.log('CLIENT CONNECTED');
	})
	.on('decoder-error', (client, err) => {
		console.log('DECODER ERROR');
	})
	.on('client-error', (client, err) => {
		console.log('CLIENT ERROR');
		console.log(err);
	})
	.on('client-end', (client) => {
		console.log('CLIENT END');
	})
	.on('client-close', (client) => {
		console.log('CLIENT CLOSE');
	})
	.on('request', (method, uri) => {
		console.log(`RTSP Request [${method}]`, uri);
	});
