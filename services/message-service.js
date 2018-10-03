var db = require('../db/db');

var moment = require('moment');

var parseDate = function (date) {
	return date = moment(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
};

module.exports = {
	getMessages : (roomId) => {
		return new Promise((resolve, reject) => {
			db.get((connection) => {
				connection.query('SELECT messages.message, messages.id, messages.created, messages.id, users.first_name, users.last_name from `messages` JOIN `users` on messages.user_id = users.id WHERE messages.room_id="' + roomId + '" ', (err, data) => {
					connection.release();
					if(err) {
						reject(err);

						return;
					}
					for(var message in data) {
						message.created = parseDate(message.created);
					}
					resolve(data);
				});
			});

		});
	},
	insertMessage : (data) => {
		return new Promise((resolve, reject) => {

			db.get((connection) => {
				connection.query('INSERT INTO `messages` (`message`, `user_id`, `created`, `room_id`) VALUES ("' + data.message + '", "' + data.userId + '", "' + data.created + '", "' + data.roomId + '")', (err) => {
					connection.release();
					if(err) {
						reject(err);

						return;
					}
					resolve();
				});
			});

		});
	}
};