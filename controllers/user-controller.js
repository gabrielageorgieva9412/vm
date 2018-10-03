var userService = require('../services/user-service');
var encryption = require('../config/encryption');
const userValidation = require('../utils/user-validation');

module.exports = {

	register : (req, res) => {
		var data = req.req.body;

		let errors = userValidation.validate(data);
		if (errors !== '') {
			res.locals.globalError = errors;
			res.render('users/register', data);

			return;
		}

		userService.getUserByEmail(data.email).then((emailData) => {
			if (emailData) {

				res.locals.globalError = 'User With This email exists';
				res.render('users/register', data);

				return;
			}

			encryption.cryptPassword(data.password, (err, hashedPass) => {
				if(err) {

					res.locals.globalError = 'Invalid Password';
					res.render('users/register', data);

					return;

				}
				data.password = hashedPass;
				userService.insertUser(data)
					.then(() => {
						res.redirect('/');
					})
					.catch((err) => {
						res.locals.globalError = err;
						res.render('users/register', data);
					});

			});

		});

	},
	login : (req, res) => {
		if(req.body.email && req.body.password) {
			var email = req.body.email;
			var password = req.body.password;
		}
		userService.getUserByEmail(email)
			.then((user) => {
				if(!user) {

					res.locals.globalError = 'No such user found';
					res.render('users/login');

					return;
				}

				encryption.comparePassword(password, user.password, (err, isMatch) => {
					if(err || !isMatch) {

						res.locals.globalError = 'Password is not correct';
						res.render('users/login');

						return;
					}

					req.logIn(user, (err) => {
						if (err) {
							res.locals.globalError = err;
							res.render('users/login');

							return;
						}

						res.cookie('firstName', user.first_name);
						res.cookie('lastName', user.last_name);
						res.cookie('id', user.id);
						res.redirect('/');
					});

				});

			}).catch((err) => {
				res.locals.globalError = err.sqlMessage;
				res.render('users/login');

				return;
			});
	},
	logout: (req, res) => {
		req.logout();
		res.redirect('/');
	}
};