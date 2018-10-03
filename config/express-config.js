const express = require('express');
const options = require('./options');
const routes = require('./routes');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const handlebars = require('express-handlebars');
const db = require('../db/db');
const seed = require('../db/seed');
const passportInit = require('./passport');

module.exports = (app) => {

	passportInit();

	db.connect((err) => {
		if(err) {
			console.log('COULD NOT CONNECT TO DB' + err);
		}
		seed();
	});

	app.use(express.static(options.path));
	app.use(express.static('recordings'));

	app.engine('handlebars', handlebars({
		defaultLayout: 'main'
	}));
	app.set('view engine', 'handlebars');
	app.use(cookieParser());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(session({
		secret: 'shit happens',
		resave: false,
		saveUninitialized: false
	}));
	app.use(passport.initialize());
	app.use(passport.session());

	app.use((req, res, next) => {
		if (req.user) {
			res.locals.currentUser = req.user;
		}

		next();
	});

	routes(app);

};