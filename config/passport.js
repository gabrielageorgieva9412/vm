const passport = require('passport');
const LocalPassport = require('passport-local');
const userService = require('../services/user-service');
const encryption = require('../config/encryption');

module.exports = () => {
	passport.use(new LocalPassport((email, password, done) => {

		userService.getUserByEmail(email).then((user) => {
			if (!user) return done(null, false);

			encryption.comparePassword(password, user.password, (err, isMatch) => {
				if(err || !isMatch) {

					return done(null, false);
				}

				return done(null, user);

			});

		});
	}));

	passport.serializeUser((user, done) => {
		if (user) return done(null, user.id);
	});

	passport.deserializeUser((id, done) => {
		userService.getUserById(id).then(user => {
			if (!user) return done(null, false);

			return done(null, user);
		});
	});
};
