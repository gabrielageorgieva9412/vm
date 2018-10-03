let settings = require('../config/options');

var mysql = require('mysql');

var state = {
	connection: null
};

module.exports.connect = function (done) {

	state.connection = mysql.createPool({
		host: settings.host,
		user: settings.user,
		password: settings.password,
		database : settings.database,
		multipleStatements : true
	});

	done();
};

module.exports.get = function (done) {
	state.connection.getConnection(function (err, connection) {
		if(err) {
			console.log(err);
		}
		done(connection);
	});
};