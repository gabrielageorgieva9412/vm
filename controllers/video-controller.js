var videoService = require('../services/video-service.js');
const moment = require('moment');

module.exports = {

	insertVideo: (videoObj) => {
		var data = videoObj;

		data.created = moment(data.created).format('YYYY-MM-DD HH:mm:ss');
		videoService.insertVideo(data).then(() => { });

	},
	getVideos: (req, res) => {

		var userID = req.params.userId;

		videoService.getVideos(userID).then((data) => {

			for(var video of data) {
				video.created = moment(video.created).format('dddd, MMMM Do YYYY, h:mm:ss a');
			}

			res.render('video/stream', {data});

		});

	}
};