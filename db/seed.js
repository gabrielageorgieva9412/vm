var db = require('./db');
var fs = require('fs');

function exec (sql, callback) {
	db.get((connection) => {
		connection.query(sql, function (err, results) {
			if (!Array.isArray(results)) {
				results = [results];
			}
			callback(err, results);
			connection.release();
		});
	});

	return this;
}

function execFile (filename, callback) {
	fs.readFile(filename, 'utf8', function (err, data) {
		if (err) throw err;
		exec(data, callback);
	});

	return this;
}

module.exports = () => {
	var	sqlFile = __dirname + '/seed.sql';

	execFile(sqlFile, function (err) {
		if(err) {
			console.log(err);
		}
	});

};