var db = require('../db/db');

var moment = require('moment');

var parseDate = function (date) {
	return date = moment(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
};

module.exports = {
	getVideos: (userId) => {
		return new Promise((resolve, reject) => {
			db.get((connection) => {
				connection.query('SELECT videos.video_path, videos.name, videos.created from videos, users, usersVideos WHERE users.id=usersVideos.userId AND usersVideos.videoId=videos.id AND users.id="' + userId + '" ', (err, data) => {
					connection.release();
					if (err) {
						reject(err);

						return;
					}
					for (var video in data) {
						video.created = parseDate(video.created);
					}
					resolve(data);
				});
			});

		});
	},
	insertVideo: (data) => {
		return new Promise((resolve, reject) => {

			//WIP

			db.get((connection) => {
				connection.query('INSERT INTO `videos` (`video_path`, `name`, `created`) VALUES ("' + data.videoPath + '", "' + data.name + '", "' + data.created + '")', (err) => {
					connection.release();
					if (err) {
						reject(err);

						return;
					}

					db.get((connection) => {
						connection.query('INSERT INTO `usersVideos` (`userId`, `videoId`) VALUES ("' + data.userId + '", ' + '(SELECT videos.id from videos WHERE videos.video_path="' + data.videoPath + '"));', (err) => {
							connection.release();
							if (err) {
								reject(err);

								return;
							}
							resolve();
						});
					});
				});
			});

		});
	}
};