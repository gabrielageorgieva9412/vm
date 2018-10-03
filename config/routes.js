const userController = require('../controllers/user-controller');
const videoController = require('../controllers/video-controller');
const auth = require('./auth');

module.exports = (app) => {

	app.get('/', (req, res) => {
		res.render('home/home');
	});

	app.get('/video', auth.isAuthenticated, (req, res) => {
		res.render('video/video');
	});

	app.get('/stream/:userId', auth.isAuthenticated, (req, res) => {
		videoController.getVideos(req, res);
	});

	app.get('/register', (req, res) => {
		res.render('users/register');
	});

	app.post('/register', (req, res) => {
		userController.register(res, res);
	});

	app.get('/login', (req, res) => {
		res.render('users/login');
	});

	app.post('/login', (req, res) => {
		userController.login(req, res);
	});

	app.post('/logout', (req, res) => {
		userController.logout(req, res);
	});

};