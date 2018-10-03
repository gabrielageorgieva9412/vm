module.exports =
	{
		roomOptions:
		{
			mediaCodecs:
			[
				{
					kind: 'audio',
					name: 'audio/opus',
					payloadType: 100,
					clockRate: 48000,
					numChannels: 2
				},
				{
					kind: 'video',
					name: 'video/h264',
					payloadType: 103,
					clockRate: 90000,
					parameters:
					{
						packetizationMode: 1
					}
				}
			]
		},
		path: 'public',
		port: 8100,
		host: 'localhost',
		user: 'root',
		password: 'qwe123',
		database: 'hangouts'
	};
