var db = require('../db/db');

module.exports = {
	insertUser : (data) => {
		return new Promise((resolve, reject) => {

			db.get((connection) => {
				connection.query('INSERT INTO `users` (`first_name`, `last_name`, `email`, `password`) VALUES ("' + data.firstName + '", "' + data.lastName + '" , "' + data.email + '" , "' + data.password + '" ); ', (err) => {
					connection.release();
					if(err) {
						reject(err);

						return;
					}
					resolve();
				});
			});

		});
	},
	editUser : (data) => {
		return new Promise((resolve, reject) => {

			db.get((connection) => {
				connection.query('UPDATE `users` SET  email= "' + data.email + '", first_name = "' + data.firstName + '", last_name = "' + data.lastName + '" WHERE id = "' + data.id + '"; ', (err) => {
					connection.release();
					if(err) {
						reject(err);

						return;
					}
					resolve();
				});
			});

		});
	},
	getUserById : (id) => {
		return new Promise((resolve, reject) => {

			db.get((connection) => {
				connection.query('SELECT users.id, users.first_name, users.last_name, users.email FROM `users` WHERE  id="' + id + '"', (err, data) => {
					connection.release();
					if(err) {
						reject(err);

						return;
					}
					resolve(data[0]);
				});
			});

		});
	},
	getUserByEmail : (email) => {
		return new Promise((resolve, reject) => {

			db.get((connection) => {
				connection.query('SELECT * FROM `users` WHERE  email="' + email + '" ', (err, data) => {
					connection.release();
					if(err) {
						reject(err);

						return;
					}
					resolve(data[0]);
				});
			});

		});
	}
};