var messageService = require('../services/message-service');
const moment = require('moment');

module.exports = {

	insertMessage : (messageObj) => {
		var data = JSON.parse(messageObj);

		data.created = moment(data.created).format('YYYY-MM-DD HH:mm:ss');
		messageService.insertMessage(data).then(() => {});

	},
	getMessages : (roomId) => {

		return new Promise((resolve, reject) => {
			messageService.getMessages(roomId).then((data) => {

				resolve(data);
			});
		});
	}
};